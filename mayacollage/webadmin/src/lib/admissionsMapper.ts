/**
 * Admissions Mapper between PostgreSQL snake_case rows and Frontend camelCase structures
 */

export function mapApplicationRow(row: any) {
  if (!row) return null;

  return {
    id: row.id,
    _id: row.id, // For backward compatibility with MongoDB _id
    firstName: row.first_name,
    lastName: row.last_name,
    dob: row.dob,
    gender: row.gender,
    email: row.email,
    mobile: row.mobile,
    alternateMobile: row.alternate_mobile,
    address: row.address,
    city: row.city,
    state: row.state,
    pinCode: row.pin_code,
    applicantPhoto: row.applicant_photo,

    // Academic Info
    highestQualification: row.highest_qualification,
    institutionName: row.institution_name,
    boardUniversity: row.board_university,
    percentageCGPA: row.percentage_cgpa,
    yearOfPassing: row.year_of_passing,
    subjectMarks: typeof row.subject_marks === 'string' ? JSON.parse(row.subject_marks) : (row.subject_marks || {}),
    entranceScore: row.entrance_score,

    // Program Selection
    selectedProgram: row.selected_program,
    selectedBranch: row.selected_branch,
    sessionYear: row.session_year,
    category: row.category,
    statementOfPurpose: row.statement_of_purpose,

    // Documents
    documents: typeof row.documents === 'string' ? JSON.parse(row.documents) : (row.documents || {}),

    // Status
    status: row.status,
    studentId: row.student_id,
    admissionNumber: row.admission_number,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}
