/**
 * Maps PostgreSQL finance tables to domain objects compatible with the frontend dashboards,
 * receipt generator, modals, and export utilities.
 */

export function mapPgCategory(row: any) {
  if (!row) return null;
  return {
    _id: row.id,
    id: row.id,
    name: row.name,
    code: row.code,
    type: row.type || 'Kit/Uniform',
    defaultAmount: Number(row.default_amount) || 0,
    frequency: row.frequency || 'One-Time',
    isMandatory: Boolean(row.is_mandatory),
    description: row.description || '',
    status: row.status || 'Active',
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export function mapPgCategories(rows: any[]) {
  if (!Array.isArray(rows)) return [];
  return rows.map(mapPgCategory).filter(Boolean);
}

export function mapPgTransaction(row: any) {
  if (!row) return null;
  return {
    _id: row.id,
    id: row.id,
    studentId: row.student_first_name ? {
      _id: row.student_id,
      id: row.student_id,
      firstName: row.student_first_name,
      middleName: row.student_middle_name || '',
      lastName: row.student_last_name || '',
      studentId: row.student_code || row.student_admission_number || '',
      enrollmentNumber: row.student_enrollment_number || '',
      admissionNumber: row.student_admission_number || '',
      mobile: row.student_mobile || '',
      email: row.student_email || '',
      selectedBranch: row.student_branch || '',
      selectedProgram: row.student_program || ''
    } : (row.student_id ? { _id: row.student_id, id: row.student_id } : null),
    courseId: row.course_name ? {
      _id: row.course_id,
      id: row.course_id,
      name: row.course_name,
      code: row.course_code || '',
      duration: Number(row.course_duration) || 4
    } : (row.course_id ? { _id: row.course_id, id: row.course_id } : null),
    receiptNumber: row.receipt_number || '',
    amount: Number(row.amount) || 0,
    category: row.category || 'tuition',
    categoryName: row.category_name || 'Tuition Fee',
    breakup: typeof row.breakup === 'string' ? JSON.parse(row.breakup) : (row.breakup || []),
    paymentDate: row.payment_date,
    paymentMethod: row.payment_method || 'Cash',
    transactionId: row.transaction_id || '',
    status: row.status || 'Completed',
    semester: Number(row.semester) || 1,
    academicYear: row.academic_year || 'Year 1',
    notes: row.notes || '',
    collectedBy: row.collected_by || 'Admin Finance',
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export function mapPgTransactions(rows: any[]) {
  if (!Array.isArray(rows)) return [];
  return rows.map(mapPgTransaction).filter(Boolean);
}

export function mapPgPayout(row: any) {
  if (!row) return null;
  return {
    _id: row.id,
    id: row.id,
    payeeId: row.user_first_name ? {
      _id: row.payee_id,
      id: row.payee_id,
      firstName: row.user_first_name,
      lastName: row.user_last_name || '',
      email: row.user_email || '',
      role: row.user_role || 'Staff',
      department: row.user_department || 'Academics'
    } : { _id: row.payee_id || row.id, firstName: row.payee_name || 'Staff', lastName: '' },
    payeeName: row.payee_name || '',
    receiptNumber: row.receipt_number || '',
    designation: row.designation || 'Faculty / Staff',
    department: row.department || 'Academics',
    payoutType: row.payout_type || 'Salary',
    amount: Number(row.amount) || 0,
    paymentDate: row.payment_date,
    paymentMethod: row.payment_method || 'Bank Transfer',
    transactionId: row.transaction_id,
    status: row.status || 'Completed',
    monthYear: row.month_year || '',
    notes: row.notes || '',
    disbursedBy: row.disbursed_by || 'Admin Finance',
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export function mapPgPayouts(rows: any[]) {
  if (!Array.isArray(rows)) return [];
  return rows.map(mapPgPayout).filter(Boolean);
}

export function mapPgFeeAlert(row: any) {
  if (!row) return null;
  return {
    _id: row.id,
    id: row.id,
    studentId: row.student_first_name ? {
      _id: row.student_id,
      id: row.student_id,
      firstName: row.student_first_name,
      lastName: row.student_last_name || '',
      enrollmentNumber: row.student_enrollment_number || '',
      admissionNumber: row.student_admission_number || '',
      mobile: row.student_mobile || '',
      parentMobile: row.student_parent_mobile || '',
      email: row.student_email || '',
      selectedProgram: row.student_program || ''
    } : (row.student_id ? { _id: row.student_id, id: row.student_id } : null),
    alertType: row.alert_type || 'Outstanding_Dues',
    title: row.title || '',
    message: row.message || '',
    outstandingAmount: Number(row.outstanding_amount) || 0,
    channel: row.channel || 'In-App',
    status: row.status || 'Active',
    sentAt: row.sent_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export function mapPgFeeAlerts(rows: any[]) {
  if (!Array.isArray(rows)) return [];
  return rows.map(mapPgFeeAlert).filter(Boolean);
}
