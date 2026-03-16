import { useState, useMemo, useEffect } from 'react'
import Layout from '../components/Layout'
import StatCard from '../components/StatCard'
import { 
  getEnrollments, 
  enrollStudent, 
  getAdmissionTracking, 
  updateTrackingStage, 
  getEnrollmentStats 
} from '../services/dataService'

export default function EnrollmentPage() {
  const [expandedId, setExpandedId] = useState(null)
  const [enrollments, setEnrollments] = useState([])
  const [tracking, setTracking] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState('All')
  const [currentPage, setCurrentPage] = useState(1)
  const [showEnrollModal, setShowEnrollModal] = useState(false)
  const [selectedApproved, setSelectedApproved] = useState(null)
  const [enrollmentForm, setEnrollmentForm] = useState({
    course: '',
    semester: '1',
    batch: '',
  })

  useEffect(() => {
    loadData()
    window.addEventListener('storage', loadData)
    return () => window.removeEventListener('storage', loadData)
  }, [])

  const loadData = () => {
    setEnrollments(getEnrollments())
    setTracking(getAdmissionTracking())
  }

  const stats = useMemo(() => getEnrollmentStats(enrollments), [enrollments])

  // Get approved but not yet enrolled applications
  const approvedPending = useMemo(() => {
    return tracking.filter(t =>
      t.currentStage === 'Approved' && !enrollments.some(e => e.applicationId === t.applicationId)
    )
  }, [tracking, enrollments])

  // Filter approved pending
  const filteredApproved = useMemo(() => {
    let filtered = approvedPending

    if (searchQuery) {
      filtered = filtered.filter(app =>
        app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.course.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    return filtered
  }, [approvedPending, searchQuery])

  const paginatedApproved = useMemo(() => {
    const start = (currentPage - 1) * 5
    return filteredApproved.slice(start, start + 5)
  }, [filteredApproved, currentPage])

  const totalPages = Math.ceil(filteredApproved.length / 5)

  // Filter enrolled students
  const filteredEnrolled = useMemo(() => {
    let filtered = enrollments

    if (searchQuery) {
      filtered = filtered.filter(e =>
        e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.course.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    if (filterStatus !== 'All') {
      filtered = filtered.filter(e => e.feeStatus === filterStatus)
    }

    return filtered
  }, [enrollments, searchQuery, filterStatus])

  const handleEnroll = () => {
    if (selectedApproved && enrollmentForm.course && enrollmentForm.batch) {
      // enrollStudent auto-creates enrollment, student ID, fee record, and updates tracking
      enrollStudent(
        selectedApproved.applicationId,
        enrollmentForm.course,
        enrollmentForm.semester,
        enrollmentForm.batch
      )
      
      loadData()
      setShowEnrollModal(false)
      setEnrollmentForm({ course: '', semester: '1', batch: '' })
      setSelectedApproved(null)
    }
  }

  const handleGenerateFee = (enrollment) => {
    // Fee invoice is already generated during enrollment
    // This button updates the tracking stage to Fee Payment
    updateTrackingStage(enrollment.applicationId, 'Fee Payment', 'Invoice generated and sent to student')
    loadData()
  }

  const semesters = ['1', '2', '3', '4', '5', '6', '7', '8']

  return (
    <Layout>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Student Enrollment</h1>
          <p className="text-gray-600 mt-1">Manage student enrollment and fee generation</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard label="Total Enrolled" value={stats.total} color="blue" icon="school" />
          <StatCard label="Fee Pending" value={stats.feePending} color="yellow" icon="payment" />
          <StatCard label="Fee Paid" value={stats.feePaid} color="green" icon="check_circle" />
          <StatCard label="Active Students" value={stats.active} color="purple" icon="person_check" />
          <StatCard label="Ready for Enrollment" value={approvedPending.length} color="orange" icon="auto_stories" />
        </div>

        {/* Two-Tab Interface */}
        <div className="space-y-6">
          {/* Tab 1: Pending Enrollment */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <span className="material-symbols-outlined text-2xl text-orange-600">hourglass_bottom</span>
                Approved Applicants Pending Enrollment
              </h2>
              <p className="text-sm text-gray-600 mt-1">{approvedPending.length} students ready for enrollment</p>
            </div>

            <div className="p-6 border-b border-slate-200">
              <input
                type="text"
                placeholder="Search by name or course..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 text-left font-semibold text-gray-700">Name</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-700">Course</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-700">Merit Score</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-700">Approval Date</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedApproved.map((app) => {
                    const approvedDate = app.timeline.find(t => t.stage === 'Approved')?.date
                    return (
                      <tr key={app.applicationId} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="px-6 py-4 font-medium text-gray-900">{app.name}</td>
                        <td className="px-6 py-4 text-gray-700">{app.course}</td>
                        <td className="px-6 py-4 text-gray-700">{app.merit.toFixed(1)}</td>
                        <td className="px-6 py-4 text-gray-700">
                          {approvedDate ? new Date(approvedDate).toLocaleDateString('en-IN') : 'N/A'}
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => {
                              setSelectedApproved(app)
                              setEnrollmentForm({ ...enrollmentForm, course: app.course })
                              setShowEnrollModal(true)
                            }}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 transition"
                          >
                            Enroll
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {approvedPending.length === 0 && (
              <div className="p-8 text-center text-gray-500">
                <p>No approved applicants pending enrollment</p>
              </div>
            )}

            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between bg-slate-50">
                <p className="text-sm text-gray-600">Page {currentPage} of {totalPages}</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 border border-slate-300 rounded-lg text-sm hover:bg-slate-100 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 border border-slate-300 rounded-lg text-sm hover:bg-slate-100 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Tab 2: Enrolled Students */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <span className="material-symbols-outlined text-2xl text-green-600">group</span>
                Enrolled Students
              </h2>
              <p className="text-sm text-gray-600 mt-1">{enrollments.length} students currently enrolled</p>
            </div>

            <div className="p-6 border-b border-slate-200 flex gap-4 flex-wrap">
              <input
                type="text"
                placeholder="Search by name or course..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 min-w-64 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
              />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
              >
                <option value="All">All Status</option>
                <option value="Pending">Fee Pending</option>
                <option value="Paid">Fee Paid</option>
              </select>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 text-left font-semibold text-gray-700">Name</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-700">Student ID</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-700">Course</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-700">Semester</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-700">Fee Status</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-700">Enrollment Date</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEnrolled.map((enrollment) => (
                    <tr key={enrollment.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="px-6 py-4 font-medium text-gray-900">{enrollment.name}</td>
                      <td className="px-6 py-4 text-gray-700">{enrollment.studentId}</td>
                      <td className="px-6 py-4 text-gray-700">{enrollment.course}</td>
                      <td className="px-6 py-4 text-gray-700">{enrollment.semester}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${
                          enrollment.feeStatus === 'Paid'
                            ? 'bg-green-50 text-green-700 border-green-200'
                            : 'bg-yellow-50 text-yellow-700 border-yellow-200'
                        }`}>
                          {enrollment.feeStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-700">
                        {new Date(enrollment.enrollmentDate).toLocaleDateString('en-IN')}
                      </td>
                      <td className="px-6 py-4 flex gap-2">
                        {enrollment.feeStatus === 'Pending' && (
                          <button
                            onClick={() => handleGenerateFee(enrollment)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 transition"
                          >
                            Generate Fee
                          </button>
                        )}
                        <button className="px-4 py-2 bg-slate-200 text-gray-700 rounded-lg text-xs font-medium hover:bg-slate-300 transition">
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {enrollments.length === 0 && (
              <div className="p-8 text-center text-gray-500">
                <p>No enrolled students yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Enrollment Modal */}
        {showEnrollModal && selectedApproved && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-md w-full">
              <div className="p-6 border-b border-slate-200 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Enroll Student</h2>
                <button
                  onClick={() => setShowEnrollModal(false)}
                  className="text-gray-500 hover:text-gray-700 text-xl"
                >
                  ✕
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-1 block">Student Name</label>
                  <input
                    type="text"
                    value={selectedApproved.name}
                    disabled
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-slate-50 text-gray-900"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-1 block">Course</label>
                  <input
                    type="text"
                    value={enrollmentForm.course}
                    disabled
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-slate-50 text-gray-900"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-1 block">Semester</label>
                  <select
                    value={enrollmentForm.semester}
                    onChange={(e) => setEnrollmentForm({ ...enrollmentForm, semester: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
                  >
                    {semesters.map(s => <option key={s} value={s}>Semester {s}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-1 block">Batch</label>
                  <input
                    type="text"
                    placeholder="e.g., CSE-2026-A"
                    value={enrollmentForm.batch}
                    onChange={(e) => setEnrollmentForm({ ...enrollmentForm, batch: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700">
                  <p className="font-medium mb-1">Note:</p>
                  <p>After enrollment, a fee invoice will be automatically generated for the student.</p>
                </div>
              </div>

              <div className="p-6 border-t border-slate-200 flex gap-3">
                <button
                  onClick={() => setShowEnrollModal(false)}
                  className="flex-1 px-4 py-2 bg-slate-200 text-gray-700 rounded-lg font-medium hover:bg-slate-300 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEnroll}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition"
                >
                  Confirm Enrollment
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
