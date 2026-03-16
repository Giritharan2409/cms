import { useState, useMemo, useEffect } from 'react'
import Layout from '../components/Layout'
import StatCard from '../components/StatCard'
import { 
  getSemesterFees,
  initializeSemesterFees,
  updateSemesterFee,
  getEnrollments,
  getSemesterFeeStats 
} from '../services/dataService'

export default function SemesterFeesPage() {
  const [fees, setFees] = useState([])
  const [enrollments, setEnrollments] = useState([])
  const [selectedSemFee, setSelectedSemFee] = useState(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterCourse, setFilterCourse] = useState('All')

  useEffect(() => {
    // Initialize semester fees on first load if empty
    if (getSemesterFees().length === 0) {
      initializeSemesterFees()
    }
    loadData()
    window.addEventListener('storage', loadData)
    return () => window.removeEventListener('storage', loadData)
  }, [])

  const loadData = () => {
    setFees(getSemesterFees())
    setEnrollments(getEnrollments())
  }

  const stats = useMemo(() => getSemesterFeeStats(fees), [fees])

  const filteredFees = useMemo(() => {
    let filtered = fees

    if (filterCourse !== 'All') {
      filtered = filtered.filter(f => f.courseId === filterCourse)
    }

    if (searchQuery) {
      filtered = filtered.filter(f =>
        f.courseId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.academicYear.includes(searchQuery)
      )
    }

    return filtered
  }, [fees, filterCourse, searchQuery])

  const courses = [...new Set(fees.map(f => f.courseId))].sort()

  // Calculate fee breakdown for each semester fee
  const getFeeBreakdown = (semFee) => {
    return [
      { name: 'Tuition Fee', amount: semFee.tuitionFee, percentage: (semFee.tuitionFee / semFee.totalFee * 100).toFixed(1) },
      { name: 'Lab Fee', amount: semFee.labFee, percentage: (semFee.labFee / semFee.totalFee * 100).toFixed(1) },
      { name: 'Hostel Fee', amount: semFee.hostelFee, percentage: (semFee.hostelFee / semFee.totalFee * 100).toFixed(1) },
      { name: 'Transport Fee', amount: semFee.transportFee, percentage: (semFee.transportFee / semFee.totalFee * 100).toFixed(1) },
    ]
  }

  // Get enrolled students for a semester fee
  const getEnrolledStudentsForSemFee = (semFee) => {
    return enrollments.filter(e => e.course.includes(semFee.courseId))
  }

  const handleUpdateFee = (id, field, value) => {
    const feeRecord = fees.find(f => f.id === id)
    if (!feeRecord) return

    const numValue = parseInt(value)
    const updates = { [field]: numValue }

    // Recalculate total fee
    if (field === 'tuitionFee' || field === 'labFee' || field === 'hostelFee' || field === 'transportFee') {
      updates.totalFee = 
        (field === 'tuitionFee' ? numValue : feeRecord.tuitionFee) +
        (field === 'labFee' ? numValue : feeRecord.labFee) +
        (field === 'hostelFee' ? numValue : feeRecord.hostelFee) +
        (field === 'transportFee' ? numValue : feeRecord.transportFee)
    }

    updateSemesterFee(id, updates)
    loadData()
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Semester Fees Management</h1>
          <p className="text-gray-600 mt-1">Manage semester-wise fee schedules and student payments</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard
            label="Total Courses"
            value={stats.totalCourses}
            color="blue"
            icon="school"
          />
          <StatCard
            label="Total Fee Amount"
            value={`₹${(stats.totalFeeAmount / 100000).toFixed(1)}L`}
            color="green"
            icon="currency_rupee"
          />
          <StatCard
            label="Enrolled Students"
            value={stats.enrolledStudents}
            color="purple"
            icon="group"
          />
          <StatCard
            label="Pending Fees"
            value={stats.pendingFees}
            color="yellow"
            icon="hourglass_bottom"
          />
          <StatCard
            label="Payable Amount"
            value={`₹${(stats.totalFeeAmount / 100000).toFixed(2)}L`}
            color="orange"
            icon="receipt"
          />
        </div>

        {/* Search & Filter */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <input
              type="text"
              placeholder="Search by course or year..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
            />
            <select
              value={filterCourse}
              onChange={(e) => setFilterCourse(e.target.value)}
              className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 min-w-48"
            >
              <option value="All">All Courses</option>
              {courses.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        {/* Semester Fees Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredFees.map((semFee) => {
            const enrolledStudents = getEnrolledStudentsForSemFee(semFee)
            const breakdown = getFeeBreakdown(semFee)

            return (
              <div key={semFee.id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {semFee.courseId} • Semester {semFee.semester}
                    </h3>
                    <p className="text-sm text-gray-600">{semFee.academicYear}</p>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedSemFee(semFee)
                      setShowDetailModal(true)
                    }}
                    className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-100 transition"
                  >
                    Edit
                  </button>
                </div>

                {/* Total Fee */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 mb-4 border border-blue-200">
                  <p className="text-sm text-gray-600 mb-1">Total Fee Amount</p>
                  <p className="text-3xl font-bold text-blue-600">₹{semFee.totalFee.toLocaleString('en-IN')}</p>
                  <p className="text-xs text-gray-600 mt-2">Due Date: {new Date(semFee.dueDate).toLocaleDateString('en-IN')}</p>
                </div>

                {/* Fee Breakdown */}
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Fee Breakdown</h4>
                  <div className="space-y-2">
                    {breakdown.map((item) => (
                      <div key={item.name} className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="text-sm text-gray-700">{item.name}</p>
                          <div className="w-full bg-slate-100 rounded-full h-2 mt-1">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: `${item.percentage}%` }}
                            />
                          </div>
                        </div>
                        <div className="ml-4 text-right">
                          <p className="text-sm font-semibold text-gray-900">₹{item.amount.toLocaleString('en-IN')}</p>
                          <p className="text-xs text-gray-600">{item.percentage}%</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Enrolled Students */}
                <div className="border-t border-slate-200 pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold text-gray-900">Enrolled Students</h4>
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-semibold">
                      {enrolledStudents.length}
                    </span>
                  </div>
                  {enrolledStudents.length > 0 ? (
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {enrolledStudents.map((student) => (
                        <div key={student.id} className="flex items-center justify-between p-2 bg-slate-50 rounded">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{student.name}</p>
                            <p className="text-xs text-gray-600">{student.studentId}</p>
                          </div>
                          <span className={`px-2 py-1 rounded text-xs font-medium border ${
                            student.feeStatus === 'Paid'
                              ? 'bg-green-50 text-green-700 border-green-200'
                              : 'bg-yellow-50 text-yellow-700 border-yellow-200'
                          }`}>
                            {student.feeStatus}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 text-center py-4">No enrolled students yet</p>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {filteredFees.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <p>No semester fees found matching your criteria</p>
          </div>
        )}

        {/* Edit Modal */}
        {showDetailModal && selectedSemFee && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-slate-200 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Edit Semester Fee</h2>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="text-gray-500 hover:text-gray-700 text-xl"
                >
                  ✕
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-1 block">Course</label>
                  <input
                    type="text"
                    value={selectedSemFee.courseId}
                    disabled
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-slate-50 text-gray-900"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-1 block">Semester</label>
                  <input
                    type="text"
                    value={selectedSemFee.semester}
                    disabled
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-slate-50 text-gray-900"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-1 block">Tuition Fee (₹)</label>
                  <input
                    type="number"
                    value={selectedSemFee.tuitionFee}
                    onChange={(e) => handleUpdateFee(selectedSemFee.id, 'tuitionFee', e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-1 block">Lab Fee (₹)</label>
                  <input
                    type="number"
                    value={selectedSemFee.labFee}
                    onChange={(e) => handleUpdateFee(selectedSemFee.id, 'labFee', e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-1 block">Hostel Fee (₹)</label>
                  <input
                    type="number"
                    value={selectedSemFee.hostelFee}
                    onChange={(e) => handleUpdateFee(selectedSemFee.id, 'hostelFee', e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-1 block">Transport Fee (₹)</label>
                  <input
                    type="number"
                    value={selectedSemFee.transportFee}
                    onChange={(e) => handleUpdateFee(selectedSemFee.id, 'transportFee', e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-1 block">Due Date</label>
                  <input
                    type="date"
                    value={selectedSemFee.dueDate}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700">
                  <p className="font-medium mb-1">Total Fee:</p>
                  <p className="text-lg font-bold">₹{selectedSemFee.totalFee.toLocaleString('en-IN')}</p>
                </div>
              </div>

              <div className="p-6 border-t border-slate-200 flex gap-3">
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="flex-1 px-4 py-2 bg-slate-200 text-gray-700 rounded-lg font-medium hover:bg-slate-300 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowDetailModal(false)
                    setSelectedSemFee(null)
                    loadData()
                  }}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
