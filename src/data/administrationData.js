// ─── Admission Data ───
export const admissionApplications = []

export const getAdmissionStats = (applications) => {
  const total = applications.length
  const pending = applications.filter(a => a.status === 'Pending').length
  const approved = applications.filter(a => a.status === 'Approved').length
  const rejected = applications.filter(a => a.status === 'Rejected').length
  const underReview = applications.filter(a => a.status === 'Under Review').length
  return { total, pending, approved, rejected, underReview }
}

// ─── Fees Data ───
export const feeRecords = []

export const getFeeStats = (records) => {
  const totalAmount = records.reduce((sum, r) => sum + r.amount, 0)
  const totalCollected = records.reduce((sum, r) => sum + r.paid, 0)
  const totalDue = records.reduce((sum, r) => sum + r.due, 0)
  const overdue = records.filter(r => r.status === 'Overdue').length
  const paid = records.filter(r => r.status === 'Paid').length
  return { totalAmount, totalCollected, totalDue, overdue, paid, total: records.length }
}

// ─── Payroll Data ───
export const payrollRecords = []

export const getPayrollStats = (records) => {
  const totalPayout = records.reduce((sum, r) => sum + r.netSalary, 0)
  const paid = records.filter(r => r.status === 'Paid').length
  const processing = records.filter(r => r.status === 'Processing').length
  const pending = records.filter(r => r.status === 'Pending').length
  const totalDeductions = records.reduce((sum, r) => sum + r.deductions + r.tax, 0)
  return { totalPayout, paid, processing, pending, totalDeductions, total: records.length }
}

// ─── Invoice Data ───
export const invoiceRecords = []

export const getInvoiceStats = (records) => {
  const totalAmount = records.reduce((sum, r) => sum + r.total, 0)
  const paidRecords = records.filter(r => r.status === 'Paid')
  const totalPaid = paidRecords.reduce((sum, r) => sum + r.total, 0)
  const overdue = records.filter(r => r.status === 'Overdue').length
  const pending = records.filter(r => r.status === 'Pending' || r.status === 'Partial').length
  return { totalAmount, totalPaid, overdue, pending, paid: paidRecords.length, total: records.length }
}

// ─── Admission Status Tracking Data ───
export const admissionStatusTracking = []

export const getAdmissionTrackingStats = (tracking) => {
  const total = tracking.length
  const approved = tracking.filter(t => t.currentStage === 'Approved').length
  const enrolled = tracking.filter(t => t.currentStage === 'Enrolled').length
  const underReview = tracking.filter(t => t.currentStage === 'Under Review').length
  const rejected = tracking.filter(t => t.currentStage === 'Rejected').length
  const feePaid = tracking.filter(t => t.currentStage === 'Fee Payment Complete').length
  return { total, approved, enrolled, underReview, rejected, feePaid }
}

// ─── Semester Fees Data ───
export const semesterFees = []

export const getSemesterFeeStats = (fees) => {
  const totalCourses = fees.length
  const totalFeeAmount = fees.reduce((sum, f) => sum + f.totalFee, 0)
  const enrolledStudents = new Set(fees.flatMap(f => f.students)).size
  const pendingFees = fees.filter(f => f.students.length > 0).length
  return { totalCourses, totalFeeAmount, enrolledStudents, pendingFees }
}

// ─── Staff Admissions Data ───
export const staffAdmissions = []

export const getStaffAdmissionStats = (applications) => {
  const total = applications.length
  const pending = applications.filter(a => a.status === 'Pending').length
  const approved = applications.filter(a => a.status === 'Approved').length
  const rejected = applications.filter(a => a.status === 'Rejected').length
  const underReview = applications.filter(a => a.status === 'Under Review').length
  return { total, pending, approved, rejected, underReview }
}

// ─── Student Enrollment Data ───
export const studentEnrollments = []

export const getEnrollmentStats = (enrollments) => {
  const total = enrollments.length
  const feePending = enrollments.filter(e => e.feeStatus === 'Pending').length
  const feePaid = enrollments.filter(e => e.feeStatus === 'Paid').length
  const active = enrollments.filter(e => e.enrollmentStatus === 'Active').length
  return { total, feePending, feePaid, active }
}
