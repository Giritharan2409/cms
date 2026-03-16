import { useState, useMemo, useEffect } from 'react'
import Layout from '../components/Layout'
import StatCard from '../components/StatCard'
import SearchFilter from '../components/SearchFilter'
import { 
  getStaffAdmissions,
  addStaffApplication,
  updateStaffApplication,
  getStaffAdmissionStats 
} from '../services/dataService'

export default function StaffAdmissionPage() {
  const [applications, setApplications] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState({ status: '', department: '' })
  const [currentPage, setCurrentPage] = useState(1)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedApp, setSelectedApp] = useState(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', designation: '', department: '', qualification: '', experience: '', address: '' 
  })

  useEffect(() => {
    loadData()
    window.addEventListener('storage', loadData)
    return () => window.removeEventListener('storage', loadData)
  }, [])

  const loadData = () => {
    setApplications(getStaffAdmissions())
  }

  const stats = useMemo(() => getStaffAdmissionStats(applications), [applications])

  const filteredApplications = useMemo(() => {
    let filtered = applications

    if (searchQuery) {
      filtered = filtered.filter(app =>
        app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.designation.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    if (filters.status) {
      filtered = filtered.filter(app => app.status === filters.status)
    }

    if (filters.department) {
      filtered = filtered.filter(app => app.department === filters.department)
    }

    return filtered
  }, [applications, searchQuery, filters])

  const paginatedApps = useMemo(() => {
    const start = (currentPage - 1) * 5
    return filteredApplications.slice(start, start + 5)
  }, [filteredApplications, currentPage])

  const totalPages = Math.ceil(filteredApplications.length / 5)

  const departments = [...new Set(applications.map(a => a.department))].sort()
  const designations = [...new Set(applications.map(a => a.designation))].sort()

  const colorMap = {
    Pending: 'bg-blue-50 text-blue-700 border-blue-200',
    Approved: 'bg-green-50 text-green-700 border-green-200',
    Rejected: 'bg-red-50 text-red-700 border-red-200',
    'Under Review': 'bg-yellow-50 text-yellow-700 border-yellow-200',
  }

  const handleAddStaff = () => {
    if (formData.name && formData.email) {
      const newApp = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        designation: formData.designation,
        department: formData.department,
        qualification: formData.qualification,
        experience: parseInt(formData.experience) || 0,
        address: formData.address,
      }
      addStaffApplication(newApp)
      loadData()
      setFormData({ name: '', email: '', phone: '', designation: '', department: '', qualification: '', experience: '', address: '' })
      setShowAddModal(false)
    }
  }

  const handleApprove = (id) => {
    updateStaffApplication(id, { status: 'Approved' })
    loadData()
  }

  const handleReject = (id) => {
    updateStaffApplication(id, { status: 'Rejected' })
    loadData()
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Staff Admissions</h1>
            <p className="text-gray-600 mt-1">Manage staff recruitment and onboarding</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
          >
            <span className="material-symbols-outlined text-xl">add</span>
            Add Staff Application
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard label="Total Applications" value={stats.total} color="blue" icon="groups" />
          <StatCard label="Pending Review" value={stats.pending} color="yellow" icon="schedule" />
          <StatCard label="Approved" value={stats.approved} color="green" icon="check_circle" />
          <StatCard label="Under Review" value={stats.underReview} color="purple" icon="history" />
          <StatCard label="Rejected" value={stats.rejected} color="orange" icon="cancel" />
        </div>

        {/* Search & Filter Bar */}
        <SearchFilter
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onFilterChange={setFilters}
          filterOptions={{
            status: ['All', 'Pending', 'Under Review', 'Approved', 'Rejected'],
            department: ['All', ...departments],
          }}
        />

        {/* Applications Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left font-semibold text-gray-700">Name</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-700">Position</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-700">Department</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-700">Experience</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-700">Status</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-700">Applied Date</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedApps.map((app) => (
                  <tr key={app.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-6 py-4 font-medium text-gray-900">{app.name}</td>
                    <td className="px-6 py-4 text-gray-700">{app.designation}</td>
                    <td className="px-6 py-4 text-gray-700">{app.department}</td>
                    <td className="px-6 py-4 text-gray-700">{app.experience} years</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${colorMap[app.status]}`}>
                        {app.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-700">{new Date(app.appliedDate).toLocaleDateString('en-IN')}</td>
                    <td className="px-6 py-4 flex gap-2">
                      <button
                        onClick={() => {
                          setSelectedApp(app)
                          setShowDetailModal(true)
                        }}
                        className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-xs font-medium hover:bg-blue-100 transition"
                      >
                        View
                      </button>
                      {app.status === 'Pending' && (
                        <>
                          <button
                            onClick={() => handleApprove(app.id)}
                            className="px-3 py-1 bg-green-50 text-green-600 rounded-lg text-xs font-medium hover:bg-green-100 transition"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleReject(app.id)}
                            className="px-3 py-1 bg-red-50 text-red-600 rounded-lg text-xs font-medium hover:bg-red-100 transition"
                          >
                            Reject
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between bg-slate-50">
              <p className="text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium hover:bg-slate-100 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium hover:bg-slate-100 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Department Distribution */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Applications by Department</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {departments.map(dept => {
              const count = applications.filter(a => a.department === dept).length
              return (
                <div key={dept} className="p-4 border border-slate-200 rounded-lg text-center">
                  <p className="text-sm text-gray-600 mb-1">{dept}</p>
                  <p className="text-2xl font-bold text-blue-600">{count}</p>
                </div>
              )
            })}
          </div>
        </div>

        {/* Detail Modal */}
        {showDetailModal && selectedApp && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-slate-200 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Application Details</h2>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="text-gray-500 hover:text-gray-700 text-xl"
                >
                  ✕
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="text-sm font-semibold text-gray-700">Name</label>
                  <p className="text-gray-900">{selectedApp.name}</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700">Email</label>
                  <p className="text-gray-900">{selectedApp.email}</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700">Phone</label>
                  <p className="text-gray-900">{selectedApp.phone}</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700">Position</label>
                  <p className="text-gray-900">{selectedApp.designation}</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700">Department</label>
                  <p className="text-gray-900">{selectedApp.department}</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700">Qualification</label>
                  <p className="text-gray-900">{selectedApp.qualification}</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700">Experience</label>
                  <p className="text-gray-900">{selectedApp.experience} years</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700">Address</label>
                  <p className="text-gray-900">{selectedApp.address}</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700">Status</label>
                  <p><span className={`px-3 py-1 rounded-full text-xs font-medium border ${colorMap[selectedApp.status]}`}>
                    {selectedApp.status}
                  </span></p>
                </div>
              </div>

              <div className="p-6 border-t border-slate-200 flex gap-3">
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="flex-1 px-4 py-2 bg-slate-200 text-gray-700 rounded-lg font-medium hover:bg-slate-300 transition"
                >
                  Close
                </button>
                {selectedApp.status === 'Pending' && (
                  <button
                    onClick={() => {
                      handleApprove(selectedApp.id)
                      setShowDetailModal(false)
                    }}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition"
                  >
                    Approve
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Add Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-slate-200 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Add Staff Application</h2>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-gray-500 hover:text-gray-700 text-xl"
                >
                  ✕
                </button>
              </div>

              <div className="p-6 space-y-4">
                <input
                  type="text"
                  placeholder="Full Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
                />
                <input
                  type="tel"
                  placeholder="Phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
                />
                <select
                  value={formData.designation}
                  onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
                >
                  <option value="">Select Position</option>
                  {designations.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                <select
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
                >
                  <option value="">Select Department</option>
                  {departments.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                <input
                  type="text"
                  placeholder="Qualification"
                  value={formData.qualification}
                  onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
                />
                <input
                  type="number"
                  placeholder="Years of Experience"
                  value={formData.experience}
                  onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
                />
                <input
                  type="text"
                  placeholder="Address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="p-6 border-t border-slate-200 flex gap-3">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 bg-slate-200 text-gray-700 rounded-lg font-medium hover:bg-slate-300 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddStaff}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
                >
                  Add Application
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
