/**
 * Lab Data Mappers - Formats PostgreSQL rows to frontend-compatible objects
 */

export function mapLabRow(row: any) {
  if (!row) return null;
  const incharge = row.incharge_first_name ? {
    _id: row.lab_incharge,
    id: row.lab_incharge,
    firstName: row.incharge_first_name,
    lastName: row.incharge_last_name || '',
    email: row.incharge_email || ''
  } : (row.lab_incharge || null);

  return {
    _id: row.id,
    id: row.id,
    labName: row.lab_name,
    roomNumber: row.room_number,
    capacity: Number(row.capacity) || 0,
    labType: row.lab_type,
    labIncharge: incharge,
    description: row.description || '',
    isActive: row.is_active !== false,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export function mapInventoryRow(row: any) {
  if (!row) return null;
  const lab = row.lab_name ? {
    _id: row.lab_id,
    id: row.lab_id,
    labName: row.lab_name,
    roomNumber: row.room_number
  } : (row.lab_id || null);

  return {
    _id: row.id,
    id: row.id,
    itemName: row.item_name,
    itemCode: row.item_code,
    category: row.category,
    quantity: Number(row.quantity) || 0,
    availableQuantity: Number(row.available_quantity) || 0,
    lab: lab,
    condition: row.condition || 'Good',
    lowStockThreshold: Number(row.low_stock_threshold) || 5,
    description: row.description || '',
    purchaseDate: row.purchase_date,
    purchaseCost: Number(row.purchase_cost) || 0,
    vendor: row.vendor || '',
    isIssuable: row.is_issuable !== false,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export function mapIssueRow(row: any) {
  if (!row) return null;
  const item = row.item_name ? {
    _id: row.item_id,
    id: row.item_id,
    itemName: row.item_name,
    category: row.item_category
  } : (row.item_id || null);

  const lab = row.lab_name ? {
    _id: row.lab_id,
    id: row.lab_id,
    labName: row.lab_name,
    roomNumber: row.room_number
  } : (row.lab_id || null);

  const issuedBy = row.staff_first_name ? {
    _id: row.issued_by,
    id: row.issued_by,
    firstName: row.staff_first_name,
    lastName: row.staff_last_name || ''
  } : (row.issued_by || null);

  return {
    _id: row.id,
    id: row.id,
    transactionId: row.transaction_id,
    item: item,
    lab: lab,
    issuedTo: row.issued_to,
    issuedToModel: row.issued_to_model || 'Student',
    issuedToName: row.issued_to_name || '',
    issuedToId: row.issued_to_id || '',
    quantityIssued: Number(row.quantity_issued) || 1,
    issueDate: row.issue_date,
    expectedReturnDate: row.expected_return_date,
    returnDate: row.return_date,
    status: row.status || 'Issued',
    remarks: row.remarks || '',
    issuedBy: issuedBy,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export function mapMappingRow(row: any) {
  if (!row) return null;
  const lab = row.lab_name ? {
    _id: row.lab_id,
    id: row.lab_id,
    labName: row.lab_name,
    roomNumber: row.room_number
  } : (row.lab_id || null);

  const faculty = row.faculty_first_name ? {
    _id: row.faculty_id,
    id: row.faculty_id,
    firstName: row.faculty_first_name,
    lastName: row.faculty_last_name || '',
    email: row.faculty_email || ''
  } : (row.faculty_id || null);

  return {
    _id: row.id,
    id: row.id,
    subject: row.subject,
    course: row.course,
    branch: row.branch,
    semester: row.semester,
    lab: lab,
    faculty: faculty,
    academicYear: row.academic_year,
    isActive: row.is_active !== false,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}
