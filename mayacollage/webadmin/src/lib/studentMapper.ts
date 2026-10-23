/**
 * Maps PostgreSQL student table rows to camelCase Student domain objects
 * fully compatible with all frontend pages, dashboards, and APIs.
 */

export function mapPgStudent(row: any) {
  if (!row) return null;

  const fees = typeof row.fees === 'string' ? JSON.parse(row.fees) : (row.fees || { isConfigured: false, years: [] });
  const documents = typeof row.documents === 'string' ? JSON.parse(row.documents) : (row.documents || {});

    // Personal Details - cleanly resolve legacy father name from middle_name and remove placeholder 'Student'
    const rawLastName = (row.last_name || '').trim();
    const isPlaceholderLastName = rawLastName.toLowerCase() === 'student';
    const cleanLastName = isPlaceholderLastName ? '' : rawLastName;

    const rawFather = (row.father_name || documents.fatherName || documents.father_name || '').trim();
    const rawMiddle = (row.middle_name || '').trim();

    let cleanFatherName = rawFather;
    let cleanMiddleName = rawMiddle;

    // In legacy/previous seed data, father's name was placed in middle_name when father_name was null/empty
    if (!cleanFatherName && rawMiddle) {
      cleanFatherName = rawMiddle;
      cleanMiddleName = '';
    } else if (cleanFatherName && rawMiddle && cleanFatherName.toLowerCase() === rawMiddle.toLowerCase()) {
      cleanMiddleName = '';
    }

    const cleanMotherName = (row.mother_name || documents.motherName || documents.mother_name || '').trim();

    return {
      _id: row.id,
      id: row.id,
      enrollmentNumber: row.enrollment_number || '',
      admissionNumber: row.admission_number || '',
      studentId: row.student_id || '',
      password: row.password || '',
      libraryPin: row.library_pin || '',
      applicationId: row.application_id || null,
      applicantPhoto: row.applicant_photo || '',

      // Personal Details
      firstName: row.first_name || '',
      middleName: cleanMiddleName,
      lastName: cleanLastName,
      fatherName: cleanFatherName,
      motherName: cleanMotherName,
      casteCategory: row.caste_category || documents.casteCategory || '',
      panNumber: row.pan_number || documents.panNumber || '',
      grnNumber: row.grn_number || documents.grnNumber || '',
      admissionFormDate: row.admission_form_date || documents.admissionFormDate || '',
      enrollmentDate: row.enrollment_date || documents.enrollmentDate || '',
      casteCertificateNumber: row.caste_certificate_number || documents.casteCertificateNumber || '',
    dob: row.dob || '',
    gender: row.gender || 'Male',
    email: row.email || '',
    mobile: row.mobile || '',
    parentMobile: row.parent_mobile || '',
    alternateMobile: row.alternate_mobile || '',
    address: row.address || '',
    city: row.city || '',
    state: row.state || '',
    pinCode: row.pin_code || '',
    aadharNumber: row.aadhar_number || '',
    religion: row.religion || '',
    entryType: row.entry_type || 'Direct',

    // Academic Details & Programs
    selectedBranch: row.selected_branch || null,
    branchCode: row.branch_code || '',
    branchName: row.branch_name || '',
    selectedProgram: row.selected_program || null,
    courseCode: row.course_code || '',
    courseName: row.course_name || '',
    courseDuration: Number(row.course_duration) || 4,
    selectedSemester: Number(row.selected_semester) || 1,
    selectedSection: row.selected_section || '',
    sessionYear: row.session_year || '',
    admissionYear: row.admission_year || '',
    batch: row.batch || '',
    courseYear: Number(row.course_year) || 1,

    // Fee Structure & Precomputed Aggregates
    fees,
    totalFee: Number(row.total_fee) || 0,
    paidFee: Number(row.paid_fee) || 0,
    feeBalance: Number(row.fee_balance) || 0,
    feeStatus: row.fee_status || 'unpaid',

    tuitionFee: Number(row.tuition_fee) || 0,
    tuitionPaid: Number(row.tuition_paid) || 0,
    examFee: Number(row.exam_fee) || 0,
    examPaid: Number(row.exam_paid) || 0,
    transportFee: Number(row.transport_fee) || 0,
    transportPaid: Number(row.transport_paid) || 0,
    otherFee: Number(row.other_fee) || 0,
    otherPaid: Number(row.other_paid) || 0,

    // Documents & Metadata
    documents,
    documentsLastUpdated: row.documents_last_updated || null,
    status: row.status || 'Approved',
    studentStatus: row.student_status || 'Active',
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || new Date().toISOString()
  };
}

export function mapPgStudents(rows: any[]) {
  if (!Array.isArray(rows)) return [];
  return rows.map(mapPgStudent).filter((s): s is NonNullable<ReturnType<typeof mapPgStudent>> => s !== null);
}
