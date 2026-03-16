// Central data management service with localStorage persistence
// Keeps all admission tabs synchronized with real-time updates

const STORAGE_KEYS = {
  ADMISSIONS: 'cms_admissions',
  TRACKING: 'cms_admission_tracking',
  ENROLLMENTS: 'cms_enrollments',
  SEMESTER_FEES: 'cms_semester_fees',
  STAFF_ADMISSIONS: 'cms_staff_admissions',
  FEES: 'cms_fees',
  PAYROLL: 'cms_payroll',
  INVOICES: 'cms_invoices',
}

// Initialize enrollment counter from localStorage
let enrollmentCounter = parseInt(localStorage.getItem('enrollment_counter') || '0')

// ─────────────────────────────────────────────────────────────
// ADMISSIONS MANAGEMENT
// ─────────────────────────────────────────────────────────────

export function getAdmissions() {
  const data = localStorage.getItem(STORAGE_KEYS.ADMISSIONS)
  return data ? JSON.parse(data) : []
}

export function addAdmission(application) {
  const admissions = getAdmissions()
  const newApp = {
    id: `APP-2026-${String(admissions.length + 1).padStart(3, '0')}`,
    ...application,
    status: 'Pending',
    appliedDate: new Date().toISOString().split('T')[0],
    documents: true,
    avatar: null,
  }
  
  admissions.push(newApp)
  localStorage.setItem(STORAGE_KEYS.ADMISSIONS, JSON.stringify(admissions))
  
  // Create corresponding tracking entry
  createTrackingEntry(newApp)
  
  return newApp
}

export function updateAdmission(id, updates) {
  const admissions = getAdmissions()
  const index = admissions.findIndex(a => a.id === id)
  if (index !== -1) {
    admissions[index] = { ...admissions[index], ...updates }
    localStorage.setItem(STORAGE_KEYS.ADMISSIONS, JSON.stringify(admissions))
  }
  return admissions[index]
}

export function deleteAdmission(id) {
  const admissions = getAdmissions()
  const filtered = admissions.filter(a => a.id !== id)
  localStorage.setItem(STORAGE_KEYS.ADMISSIONS, JSON.stringify(filtered))
}

// ─────────────────────────────────────────────────────────────
// ADMISSION STATUS TRACKING
// ─────────────────────────────────────────────────────────────

export function getAdmissionTracking() {
  const data = localStorage.getItem(STORAGE_KEYS.TRACKING)
  return data ? JSON.parse(data) : []
}

function createTrackingEntry(application) {
  const tracking = getAdmissionTracking()
  
  const newEntry = {
    applicationId: application.id,
    studentId: null, // Will be assigned on enrollment
    name: application.name,
    course: application.course,
    merit: application.merit,
    currentStage: 'Application',
    timeline: [
      {
        stage: 'Application',
        date: application.appliedDate,
        status: 'completed',
        notes: 'Application submitted',
      },
      {
        stage: 'Under Review',
        date: null,
        status: 'pending',
        notes: 'Awaiting document verification',
      },
      {
        stage: 'Approved',
        date: null,
        status: 'pending',
        notes: 'Awaiting approval decision',
      },
      {
        stage: 'Enrollment',
        date: null,
        status: 'pending',
        notes: 'Awaiting student confirmation',
      },
      {
        stage: 'Fee Payment',
        date: null,
        status: 'pending',
        notes: 'Awaiting fee submission',
      },
    ],
  }
  
  tracking.push(newEntry)
  localStorage.setItem(STORAGE_KEYS.TRACKING, JSON.stringify(tracking))
}

export function updateTrackingStage(applicationId, newStage, notes = '') {
  const tracking = getAdmissionTracking()
  const entry = tracking.find(t => t.applicationId === applicationId)
  
  if (entry) {
    const stageIndex = entry.timeline.findIndex(t => t.stage === newStage)
    if (stageIndex !== -1) {
      entry.timeline[stageIndex].status = 'completed'
      entry.timeline[stageIndex].date = new Date().toISOString().split('T')[0]
      if (notes) entry.timeline[stageIndex].notes = notes
      entry.currentStage = newStage
      
      // Mark next stage as in-progress
      if (stageIndex + 1 < entry.timeline.length) {
        entry.timeline[stageIndex + 1].status = 'in-progress'
      }
      
      localStorage.setItem(STORAGE_KEYS.TRACKING, JSON.stringify(tracking))
    }
    
    // Update admission status too
    updateAdmission(applicationId, { status: newStage })
  }
  
  return entry
}

export function rejectApplication(applicationId, reason = '') {
  const tracking = getAdmissionTracking()
  const entry = tracking.find(t => t.applicationId === applicationId)
  
  if (entry) {
    entry.currentStage = 'Rejected'
    entry.timeline = entry.timeline.map(t => ({
      ...t,
      status: t.status === 'completed' ? 'completed' : 'rejected'
    }))
    localStorage.setItem(STORAGE_KEYS.TRACKING, JSON.stringify(tracking))
  }
  
  updateAdmission(applicationId, { status: 'Rejected' })
  return entry
}

export function getTrackingStats() {
  const tracking = getAdmissionTracking()
  const total = tracking.length
  const approved = tracking.filter(t => t.currentStage === 'Approved').length
  const enrolled = tracking.filter(t => t.currentStage === 'Enrollment').length
  const feePaid = tracking.filter(t => t.currentStage === 'Fee Payment').length
  const underReview = tracking.filter(t => t.currentStage === 'Under Review').length
  const rejected = tracking.filter(t => t.currentStage === 'Rejected').length
  
  return { total, approved, enrolled, feePaid, underReview, rejected }
}

// ─────────────────────────────────────────────────────────────
// ENROLLMENTS
// ─────────────────────────────────────────────────────────────

export function getEnrollments() {
  const data = localStorage.getItem(STORAGE_KEYS.ENROLLMENTS)
  return data ? JSON.parse(data) : []
}

export function enrollStudent(applicationId, course, semester, batch) {
  const application = getAdmissions().find(a => a.id === applicationId)
  if (!application) return null
  
  // Get tracking entry
  const trackingEntry = getAdmissionTracking().find(t => t.applicationId === applicationId)
  
  // Generate new student ID
  enrollmentCounter++
  localStorage.setItem('enrollment_counter', enrollmentCounter.toString())
  const studentId = `STU-2026-${String(enrollmentCounter).padStart(3, '0')}`
  
  // Create enrollment record
  const enrollments = getEnrollments()
  const newEnrollment = {
    id: `ENR-${String(enrollments.length + 1).padStart(3, '0')}`,
    admissionId: applicationId,
    studentId,
    name: application.name,
    course,
    semester: parseInt(semester),
    academicYear: '2025-26',
    enrollmentDate: new Date().toISOString().split('T')[0],
    feeStatus: 'Pending',
    enrollmentStatus: 'Active',
    batch,
  }
  
  enrollments.push(newEnrollment)
  localStorage.setItem(STORAGE_KEYS.ENROLLMENTS, JSON.stringify(enrollments))
  
  // Update tracking entry with student ID and stage
  if (trackingEntry) {
    trackingEntry.studentId = studentId
    updateTrackingStage(applicationId, 'Enrollment', `Enrolled as ${studentId}`)
  }
  
  // Create fee invoice
  const coursePart = course.substring(7, 10).toUpperCase() // Extract CSE, ECE, etc.
  createFeeRecord(studentId, application.name, coursePart, semester)
  
  return newEnrollment
}

export function updateEnrollmentFeeStatus(studentId, status) {
  const enrollments = getEnrollments()
  const enrollment = enrollments.find(e => e.studentId === studentId)
  
  if (enrollment) {
    enrollment.feeStatus = status
    localStorage.setItem(STORAGE_KEYS.ENROLLMENTS, JSON.stringify(enrollments))
    
    // If fee paid, update tracking stage
    if (status === 'Paid') {
      updateTrackingStage(enrollment.admissionId, 'Fee Payment', 'Fee payment completed')
    }
  }
  
  return enrollment
}

export function getEnrollmentStats() {
  const enrollments = getEnrollments()
  const total = enrollments.length
  const feePending = enrollments.filter(e => e.feeStatus === 'Pending').length
  const feePaid = enrollments.filter(e => e.feeStatus === 'Paid').length
  const active = enrollments.filter(e => e.enrollmentStatus === 'Active').length
  
  return { total, feePending, feePaid, active }
}

// ─────────────────────────────────────────────────────────────
// SEMESTER FEES
// ─────────────────────────────────────────────────────────────

export function getSemesterFees() {
  const data = localStorage.getItem(STORAGE_KEYS.SEMESTER_FEES)
  return data ? JSON.parse(data) : []
}

export function initializeSemesterFees() {
  const fees = getSemesterFees()
  if (fees.length === 0) {
    const courses = ['CSE', 'ECE', 'ME', 'IT', 'CE']
    const newFees = courses.map((courseId, idx) => ({
      id: `SEMFEE-${String(idx + 1).padStart(3, '0')}`,
      courseId,
      semester: 1,
      academicYear: '2025-26',
      tuitionFee: 75000,
      labFee: courseId === 'ECE' ? 15000 : courseId === 'IT' ? 18000 : courseId === 'ME' ? 12000 : courseId === 'CE' ? 8000 : 10000,
      hostelFee: 45000,
      transportFee: 18000,
      totalFee: 0, // Will be calculated
      dueDate: '2026-06-15',
      students: [],
    }))
    
    newFees.forEach(fee => {
      fee.totalFee = fee.tuitionFee + fee.labFee + fee.hostelFee + fee.transportFee
    })
    
    localStorage.setItem(STORAGE_KEYS.SEMESTER_FEES, JSON.stringify(newFees))
  }
}

export function addStudentToSemesterFee(courseId, studentId) {
  const fees = getSemesterFees()
  const fee = fees.find(f => f.courseId === courseId)
  
  if (fee && !fee.students.includes(studentId)) {
    fee.students.push(studentId)
    localStorage.setItem(STORAGE_KEYS.SEMESTER_FEES, JSON.stringify(fees))
  }
  
  return fee
}

export function updateSemesterFee(feeId, updates) {
  const fees = getSemesterFees()
  const fee = fees.find(f => f.id === feeId)
  
  if (fee) {
    Object.assign(fee, updates)
    // Recalculate total fee
    fee.totalFee = fee.tuitionFee + fee.labFee + fee.hostelFee + fee.transportFee
    localStorage.setItem(STORAGE_KEYS.SEMESTER_FEES, JSON.stringify(fees))
  }
  
  return fee
}

export function getSemesterFeeStats() {
  const fees = getSemesterFees()
  const totalCourses = fees.length
  const totalFeeAmount = fees.reduce((sum, f) => sum + f.totalFee, 0)
  const enrolledStudents = new Set(fees.flatMap(f => f.students)).size
  const pendingFees = fees.filter(f => f.students.length > 0).length
  
  return { totalCourses, totalFeeAmount, enrolledStudents, pendingFees }
}

// ─────────────────────────────────────────────────────────────
// FEES RECORDS
// ─────────────────────────────────────────────────────────────

export function getFeeRecords() {
  const data = localStorage.getItem(STORAGE_KEYS.FEES)
  return data ? JSON.parse(data) : []
}

function createFeeRecord(studentId, studentName, courseId, semester) {
  const fees = getFeeRecords()
  
  // Ensure semester fees are initialized
  if (getSemesterFees().length === 0) {
    initializeSemesterFees()
  }
  
  const semesterFee = getSemesterFees().find(f => f.courseId === courseId)
  
  if (semesterFee) {
    const newFee = {
      id: `FEE-${String(fees.length + 1).padStart(3, '0')}`,
      studentId,
      studentName,
      department: courseId,
      semester: String(semester),
      feeType: 'Tuition',
      amount: semesterFee.totalFee,
      paid: 0,
      due: semesterFee.totalFee,
      dueDate: semesterFee.dueDate,
      paidDate: null,
      status: 'Pending',
      method: null,
      transactionId: null,
    }
    
    fees.push(newFee)
    localStorage.setItem(STORAGE_KEYS.FEES, JSON.stringify(fees))
    
    // Add student to semester fee students list
    addStudentToSemesterFee(courseId, studentId)
  }
}

export function updateFeeRecord(feeId, updates) {
  const fees = getFeeRecords()
  const fee = fees.find(f => f.id === feeId)
  
  if (fee) {
    Object.assign(fee, updates)
    localStorage.setItem(STORAGE_KEYS.FEES, JSON.stringify(fees))
    
    // If fee is now paid, update enrollment
    if (updates.status === 'Paid') {
      const enrollment = getEnrollments().find(e => e.studentId === fee.studentId)
      if (enrollment) {
        updateEnrollmentFeeStatus(fee.studentId, 'Paid')
      }
    }
  }
  
  return fee
}

export function getFeeStats() {
  const records = getFeeRecords()
  const totalAmount = records.reduce((sum, r) => sum + r.amount, 0)
  const totalCollected = records.reduce((sum, r) => sum + r.paid, 0)
  const totalDue = records.reduce((sum, r) => sum + r.due, 0)
  const overdue = records.filter(r => r.status === 'Overdue').length
  const paid = records.filter(r => r.status === 'Paid').length
  
  return { totalAmount, totalCollected, totalDue, overdue, paid, total: records.length }
}

// ─────────────────────────────────────────────────────────────
// STAFF ADMISSIONS
// ─────────────────────────────────────────────────────────────

export function getStaffAdmissions() {
  const data = localStorage.getItem(STORAGE_KEYS.STAFF_ADMISSIONS)
  return data ? JSON.parse(data) : []
}

export function addStaffApplication(application) {
  const staffApps = getStaffAdmissions()
  const newApp = {
    id: `STAFF-APP-${String(staffApps.length + 1).padStart(3, '0')}`,
    ...application,
    status: 'Pending',
    appliedDate: new Date().toISOString().split('T')[0],
    documents: true,
  }
  
  staffApps.push(newApp)
  localStorage.setItem(STORAGE_KEYS.STAFF_ADMISSIONS, JSON.stringify(staffApps))
  
  return newApp
}

export function updateStaffApplication(id, updates) {
  const staffApps = getStaffAdmissions()
  const index = staffApps.findIndex(a => a.id === id)
  if (index !== -1) {
    staffApps[index] = { ...staffApps[index], ...updates }
    localStorage.setItem(STORAGE_KEYS.STAFF_ADMISSIONS, JSON.stringify(staffApps))
  }
  return staffApps[index]
}

export function getStaffAdmissionStats() {
  const apps = getStaffAdmissions()
  const total = apps.length
  const pending = apps.filter(a => a.status === 'Pending').length
  const approved = apps.filter(a => a.status === 'Approved').length
  const rejected = apps.filter(a => a.status === 'Rejected').length
  const underReview = apps.filter(a => a.status === 'Under Review').length
  
  return { total, pending, approved, rejected, underReview }
}

// ─────────────────────────────────────────────────────────────
// UTILITY FUNCTIONS
// ─────────────────────────────────────────────────────────────

export function clearAllData() {
  Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key))
  localStorage.removeItem('enrollment_counter')
  enrollmentCounter = 0
}

export function getAdmissionStats() {
  const admissions = getAdmissions()
  const total = admissions.length
  const pending = admissions.filter(a => a.status === 'Pending').length
  const approved = admissions.filter(a => a.status === 'Approved').length
  const rejected = admissions.filter(a => a.status === 'Rejected').length
  const underReview = admissions.filter(a => a.status === 'Under Review').length
  
  return { total, pending, approved, rejected, underReview }
}
