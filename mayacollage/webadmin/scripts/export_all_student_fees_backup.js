const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

function getDbUrl() {
  let envStr = '';
  if (fs.existsSync('.env.local')) envStr += '\n' + fs.readFileSync('.env.local', 'utf8');
  if (fs.existsSync('.env')) envStr += '\n' + fs.readFileSync('.env', 'utf8');
  const line = envStr.split(/\r?\n/).find(l => l.startsWith('DATABASE_URL=') || l.startsWith('POSTGRES_URL='));
  return line.split(/=(.*)/s)[1].trim().replace(/^["']|["']$/g, '');
}

const { Pool } = require('pg');
const pool = new Pool({ connectionString: getDbUrl() });

async function exportStudentFeesBackup() {
  console.log('Fetching all students and transactions from PostgreSQL...');
  
  const studentsRes = await pool.query(`
    SELECT 
      id, enrollment_number, admission_number, student_id,
      first_name, middle_name, last_name,
      course_name, course_code, branch_name, branch_code, course_year, course_duration,
      batch, session_year, admission_year, status, student_status,
      mobile, email, father_name,
      total_fee, paid_fee, fee_balance, fee_status,
      tuition_fee, tuition_paid, exam_fee, exam_paid, transport_fee, transport_paid, other_fee, other_paid,
      fees
    FROM students
    ORDER BY course_name ASC, course_year ASC, enrollment_number ASC, first_name ASC
  `);

  const txRes = await pool.query(`
    SELECT 
      t.id, t.transaction_id, t.receipt_number, t.student_id,
      t.amount, t.payment_method, t.payment_date, t.academic_year, t.semester,
      t.category, t.category_name, t.status, t.notes,
      s.first_name, s.last_name, s.enrollment_number, s.course_name
    FROM fee_transactions t
    LEFT JOIN students s ON t.student_id = s.id
    ORDER BY t.payment_date DESC, t.created_at DESC
  `);

  console.log(`Loaded ${studentsRes.rows.length} students and ${txRes.rows.length} transactions.`);

  // Sheet 1: Student Fee Summary (Master Snapshot)
  const summaryRows = [];
  // Sheet 2: Detailed Components Breakdown per Student & Year
  const componentRows = [];
  // Sheet 3: Course Wise Stats
  const courseStatsMap = {};

  let totalCollegeAssessed = 0;
  let totalCollegePaid = 0;
  let totalCollegeBalance = 0;

  for (let idx = 0; idx < studentsRes.rows.length; idx++) {
    const s = studentsRes.rows[idx];
    const fullName = [s.first_name, s.middle_name, s.last_name].filter(Boolean).join(' ').trim();
    
    // Parse fees structure
    let feesObj = s.fees;
    if (typeof feesObj === 'string') {
      try { feesObj = JSON.parse(feesObj); } catch(e) { feesObj = null; }
    }

    const years = (feesObj && Array.isArray(feesObj.years)) ? feesObj.years : [];

    let assessedGross = 0;
    let totalDiscount = 0;
    let netPayable = 0;
    let calculatedPaid = 0;
    let calculatedBalance = 0;

    if (years.length > 0) {
      years.forEach(yr => {
        let yrGross = Number(yr.yearGross || yr.yearTotal) || 0;
        let yrDiscount = Number(yr.discount) || 0;
        let yrPaid = Number(yr.yearPaid) || 0;

        // Calculate from components if yearGross/yearPaid not aggregated
        let compGross = 0;
        let compPaid = 0;
        (yr.components || []).forEach(c => {
          compGross += Number(c.amount) || 0;
          compPaid += Number(c.paid) || 0;
        });

        if (compGross > 0) yrGross = compGross;
        if (compPaid > 0) yrPaid = compPaid;

        const yrNet = Math.max(0, yrGross - yrDiscount);
        const yrDue = Math.max(0, yrNet - yrPaid);

        assessedGross += yrGross;
        totalDiscount += yrDiscount;
        netPayable += yrNet;
        calculatedPaid += yrPaid;
        calculatedBalance += yrDue;

        // Add component rows
        (yr.components || []).forEach(c => {
          const compAmt = Number(c.amount) || 0;
          const compPd = Number(c.paid) || 0;
          const compLeft = Math.max(0, compAmt - compPd);
          componentRows.push({
            'Student ID': s.id,
            'Roll / Enrollment No': s.enrollment_number || s.admission_number || s.student_id || 'N/A',
            'Student Name': fullName,
            'Course': s.course_name || 'N/A',
            'Branch': s.branch_name || 'N/A',
            'Academic Year': `Year ${yr.year}`,
            'Fee Category / Component': c.category || c.title || 'General Fee',
            'Component Frequency': c.frequency || 'Annual',
            'Assessed Amount (₹)': compAmt,
            'Paid Amount (₹)': compPd,
            'Pending / Due Amount (₹)': compLeft,
            'Status': compLeft === 0 && compAmt > 0 ? 'Fully Paid' : (compPd > 0 ? 'Partially Paid' : (compAmt === 0 ? 'N/A' : 'Pending'))
          });
        });
      });
    } else {
      // Fallback to flat column totals
      netPayable = Number(s.total_fee) || 0;
      calculatedPaid = Number(s.paid_fee) || 0;
      calculatedBalance = Number(s.fee_balance) || Math.max(0, netPayable - calculatedPaid);
      assessedGross = netPayable;
    }

    // Sanity sync with student record columns if fees object is empty
    if (netPayable === 0 && Number(s.total_fee) > 0) {
      netPayable = Number(s.total_fee);
      calculatedPaid = Number(s.paid_fee) || 0;
      calculatedBalance = Number(s.fee_balance) || Math.max(0, netPayable - calculatedPaid);
      assessedGross = netPayable;
    }

    // Determine status
    let statusLabel = 'Pending';
    if (netPayable > 0 && calculatedBalance <= 0) {
      statusLabel = 'Cleared / Paid';
    } else if (calculatedPaid > 0 && calculatedBalance > 0) {
      statusLabel = 'Partial';
    } else if (netPayable === 0) {
      statusLabel = 'No Fee Configured';
    }

    totalCollegeAssessed += netPayable;
    totalCollegePaid += calculatedPaid;
    totalCollegeBalance += calculatedBalance;

    const courseKey = s.course_name || 'Unassigned Course';
    if (!courseStatsMap[courseKey]) {
      courseStatsMap[courseKey] = {
        totalStudents: 0,
        totalNet: 0,
        totalPaid: 0,
        totalBalance: 0,
        clearedCount: 0,
        partialCount: 0,
        pendingCount: 0
      };
    }
    courseStatsMap[courseKey].totalStudents += 1;
    courseStatsMap[courseKey].totalNet += netPayable;
    courseStatsMap[courseKey].totalPaid += calculatedPaid;
    courseStatsMap[courseKey].totalBalance += calculatedBalance;
    if (statusLabel === 'Cleared / Paid') courseStatsMap[courseKey].clearedCount += 1;
    else if (statusLabel === 'Partial') courseStatsMap[courseKey].partialCount += 1;
    else courseStatsMap[courseKey].pendingCount += 1;

    summaryRows.push({
      'S.No': idx + 1,
      'Student ID': s.id,
      'Enrollment Number': s.enrollment_number || '',
      'Admission Number': s.admission_number || '',
      'Student Name': fullName,
      'Father Name': s.father_name || '',
      'Mobile Number': s.mobile || '',
      'Course': s.course_name || '',
      'Branch': s.branch_name || '',
      'Current Year': s.course_year ? `Year ${s.course_year}` : '',
      'Batch / Session': s.batch || s.session_year || s.admission_year || '',
      'Gross Assessed Fee (₹)': assessedGross,
      'Scholarship / Discount (₹)': totalDiscount,
      'Net Total Fee (₹)': netPayable,
      'Total Fees Submitted / Paid (₹)': calculatedPaid,
      'Fees Left / Balance (₹)': calculatedBalance,
      'Payment Status': statusLabel,
      'Tuition Fee Total (₹)': Number(s.tuition_fee) || 0,
      'Tuition Paid (₹)': Number(s.tuition_paid) || 0,
      'Exam Fee Total (₹)': Number(s.exam_fee) || 0,
      'Exam Paid (₹)': Number(s.exam_paid) || 0,
      'Transport Fee Total (₹)': Number(s.transport_fee) || 0,
      'Transport Paid (₹)': Number(s.transport_paid) || 0,
      'Other Fee Total (₹)': Number(s.other_fee) || 0,
      'Other Paid (₹)': Number(s.other_paid) || 0,
      'Student Status': s.student_status || s.status || 'Active'
    });
  }

  // Sheet 4: Fee Transactions Ledger
  const transactionRows = txRes.rows.map((t, i) => ({
    'S.No': i + 1,
    'Transaction Ref': t.transaction_id || t.id,
    'Receipt No': t.receipt_number || 'N/A',
    'Payment Date': t.payment_date ? new Date(t.payment_date).toLocaleDateString('en-IN') : '',
    'Student Roll / Enrollment': t.enrollment_number || 'N/A',
    'Student Name': [t.first_name, t.last_name].filter(Boolean).join(' '),
    'Course': t.course_name || '',
    'Academic Year': t.academic_year || '',
    'Semester': t.semester ? `Semester ${t.semester}` : '',
    'Fee Category': t.category_name || t.category || 'Tuition Fee',
    'Amount Paid (₹)': Number(t.amount) || 0,
    'Payment Method': t.payment_method || 'Cash',
    'Payment Status': t.status || 'Completed',
    'Notes / Remarks': t.notes || ''
  }));

  // Sheet 3: Course Summary Rows
  const courseSummaryRows = Object.keys(courseStatsMap).sort().map((cName, i) => {
    const cs = courseStatsMap[cName];
    return {
      'S.No': i + 1,
      'Course Name': cName,
      'Total Enrolled Students': cs.totalStudents,
      'Net Fee Assessed (₹)': cs.totalNet,
      'Total Fees Collected (₹)': cs.totalPaid,
      'Total Fees Left / Due (₹)': cs.totalBalance,
      'Collection %': cs.totalNet > 0 ? ((cs.totalPaid / cs.totalNet) * 100).toFixed(1) + '%' : '0%',
      'Fully Paid Students': cs.clearedCount,
      'Partial Paid Students': cs.partialCount,
      'Fully Pending Students': cs.pendingCount
    };
  });

  // Add Grand Total row to course summary
  courseSummaryRows.push({
    'S.No': 'TOTAL',
    'Course Name': 'ALL COURSES COMBINED',
    'Total Enrolled Students': studentsRes.rows.length,
    'Net Fee Assessed (₹)': totalCollegeAssessed,
    'Total Fees Collected (₹)': totalCollegePaid,
    'Total Fees Left / Due (₹)': totalCollegeBalance,
    'Collection %': totalCollegeAssessed > 0 ? ((totalCollegePaid / totalCollegeAssessed) * 100).toFixed(1) + '%' : '0%',
    'Fully Paid Students': summaryRows.filter(r => r['Payment Status'] === 'Cleared / Paid').length,
    'Partial Paid Students': summaryRows.filter(r => r['Payment Status'] === 'Partial').length,
    'Fully Pending Students': summaryRows.filter(r => r['Payment Status'] === 'Pending').length
  });

  // Build Excel Workbook
  const wb = XLSX.utils.book_new();

  // Create Sheets
  const wsSummary = XLSX.utils.json_to_sheet(summaryRows);
  const wsComponents = XLSX.utils.json_to_sheet(componentRows);
  const wsTransactions = XLSX.utils.json_to_sheet(transactionRows);
  const wsCourseSummary = XLSX.utils.json_to_sheet(courseSummaryRows);

  // Set column widths for summary
  wsSummary['!cols'] = [
    { wch: 6 },  // S.No
    { wch: 26 }, // ID
    { wch: 18 }, // Enrollment
    { wch: 16 }, // Admission
    { wch: 25 }, // Name
    { wch: 22 }, // Father
    { wch: 14 }, // Mobile
    { wch: 24 }, // Course
    { wch: 22 }, // Branch
    { wch: 12 }, // Year
    { wch: 14 }, // Batch
    { wch: 22 }, // Gross
    { wch: 22 }, // Discount
    { wch: 18 }, // Net
    { wch: 26 }, // Paid
    { wch: 22 }, // Left
    { wch: 16 }, // Status
    { wch: 18 }, // Tuition
    { wch: 18 }, // Tuition Paid
    { wch: 16 }, // Exam
    { wch: 16 }, // Exam Paid
    { wch: 18 }, // Transport
    { wch: 18 }, // Transport Paid
    { wch: 16 }, // Other
    { wch: 16 }, // Other Paid
    { wch: 14 }  // Student Status
  ];

  wsCourseSummary['!cols'] = [
    { wch: 6 },
    { wch: 28 },
    { wch: 22 },
    { wch: 20 },
    { wch: 22 },
    { wch: 22 },
    { wch: 14 },
    { wch: 20 },
    { wch: 20 },
    { wch: 20 }
  ];

  XLSX.utils.book_append_sheet(wb, wsSummary, 'Student Fee Master');
  XLSX.utils.book_append_sheet(wb, wsComponents, 'Fee Breakdown by Category');
  XLSX.utils.book_append_sheet(wb, wsTransactions, 'Fee Receipts & Payments');
  XLSX.utils.book_append_sheet(wb, wsCourseSummary, 'Course Wise Totals');

  const timestamp = new Date().toISOString().split('T')[0];
  const publicFileName = `ALL_STUDENTS_FEES_BACKUP_${timestamp}.xlsx`;
  const publicFilePath = path.join(process.cwd(), 'public', publicFileName);

  XLSX.writeFile(wb, publicFilePath);
  console.log(`Excel backup created successfully at: ${publicFilePath}`);
  console.log(`Total Students Exported: ${studentsRes.rows.length}`);
  console.log(`Total Net Fees Assessed: ₹${totalCollegeAssessed.toLocaleString('en-IN')}`);
  console.log(`Total Fees Submitted: ₹${totalCollegePaid.toLocaleString('en-IN')}`);
  console.log(`Total Fees Left: ₹${totalCollegeBalance.toLocaleString('en-IN')}`);

  pool.end();
  return {
    filePath: publicFilePath,
    fileName: publicFileName,
    studentsCount: studentsRes.rows.length,
    componentsCount: componentRows.length,
    txCount: transactionRows.length,
    totalAssessed: totalCollegeAssessed,
    totalPaid: totalCollegePaid,
    totalLeft: totalCollegeBalance
  };
}

exportStudentFeesBackup().catch(e => {
  console.error('Export error:', e);
  pool.end();
  process.exit(1);
});
