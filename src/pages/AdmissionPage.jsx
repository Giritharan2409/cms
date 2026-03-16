import { useState, useMemo, useEffect } from 'react'
import Layout from '../components/Layout'
import StatCard from '../components/StatCard'
import { getAdmissions, addAdmission, updateAdmission, deleteAdmission, getAdmissionStats, updateTrackingStage, rejectApplication } from '../services/dataService'

const statusStyles = {
  Pending:       'bg-orange-100 text-orange-800',
  Approved:      'bg-green-100 text-green-800',
  Rejected:      'bg-red-100 text-red-800',
  'Under Review': 'bg-blue-100 text-blue-800',
}

export default function AdmissionPage() {
  const [applications, setApplications] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [courseFilter, setCourseFilter] = useState('All')
  const [currentPage, setCurrentPage] = useState(1)
  const [showModal, setShowModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedApp, setSelectedApp] = useState(null)
  const [editingApp, setEditingApp] = useState(null)
  const itemsPerPage = 8

  const initialForm = {
    name: '', email: '', phone: '', dob: '', gender: 'Male', course: 'B.Tech CSE',
    address: '', guardianName: '', guardianPhone: '', previousInstitution: '', marks10: '', marks12: '', merit: ''
  }
  const [formData, setFormData] = useState(initialForm)
  const [formErrors, setFormErrors] = useState({})

  // Load data from service
  useEffect(() => {
    loadApplications()
    // Listen for storage changes from other tabs
    window.addEventListener('storage', loadApplications)
    return () => window.removeEventListener('storage', loadApplications)
  }, [])

  const loadApplications = () => {
    const data = getAdmissions()
    setApplications(data)
  }

  const stats = useMemo(() => getAdmissionStats(), [applications])
  const courses = useMemo(() => [...new Set(applications.map(a => a.course))].sort(), [applications])

  const filtered = useMemo(() => {
    return applications.filter(a => {
      const matchesSearch = a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           a.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           a.email.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesStatus = statusFilter === 'All' || a.status === statusFilter
      const matchesCourse = courseFilter === 'All' || a.course === courseFilter
      return matchesSearch && matchesStatus && matchesCourse
    })
  }, [applications, searchQuery, statusFilter, courseFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage))
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const handleSearch = (val) => { 
    setSearchQuery(val)
    setCurrentPage(1) 
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (formErrors[name]) setFormErrors(prev => ({ ...prev, [name]: '' }))
  }

  const validateForm = () => {
    const errors = {}
    if (!formData.name.trim()) errors.name = 'Name is required'
    if (!formData.email.trim()) errors.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(formData.email)) errors.email = 'Invalid email'
    if (!formData.phone.trim()) errors.phone = 'Phone is required'
    if (!formData.dob) errors.dob = 'Date of birth is required'
    if (!formData.guardianName.trim()) errors.guardianName = 'Guardian name is required'
    if (!formData.marks12) errors.marks12 = '12th marks required'
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const openAddModal = () => {
    setEditingApp(null)
    setFormData(initialForm)
    setFormErrors({})
    setShowModal(true)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!validateForm()) return

    const appData = {
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      dob: formData.dob,
      gender: formData.gender,
      course: formData.course,
      merit: parseFloat(formData.marks12) || 0,
      address: formData.address,
      guardianName: formData.guardianName,
      guardianPhone: formData.guardianPhone,
      previousInstitution: formData.previousInstitution,
      marks10: parseFloat(formData.marks10) || 0,
      marks12: parseFloat(formData.marks12) || 0,
    }

    if (editingApp) {
      updateAdmission(editingApp.id, appData)
    } else {
      addAdmission(appData)
    }

    loadApplications()
    setShowModal(false)
    setFormData(initialForm)
    setCurrentPage(1)
  }

  const handleStatusChange = (id, newStatus) => {
    if (newStatus === 'Rejected') {
      if (confirm('Are you sure you want to reject this application?')) {
        rejectApplication(id)
        loadApplications()
      }
    } else {
      updateTrackingStage(id, newStatus === 'Approved' ? 'Approved' : 'Under Review')
      updateAdmission(id, { status: newStatus })
      loadApplications()
    }
  }

  const handleDelete = (id) => {
    if (confirm('Are you sure you want to delete this application?')) {
      deleteAdmission(id)
      loadApplications()
    }
  }

  const openDetail = (app) => { 
    setSelectedApp(app)
    setShowDetailModal(true) 
  }

  const openEdit = (app) => {
    setEditingApp(app)
    setFormData({
      name: app.name, email: app.email, phone: app.phone, dob: app.dob, gender: app.gender,
      course: app.course, address: app.address, guardianName: app.guardianName,
      guardianPhone: app.guardianPhone, previousInstitution: app.previousInstitution,
      marks10: String(app.marks10), marks12: String(app.marks12), merit: String(app.merit),
    })
    setFormErrors({})
    setShowModal(true)
  }

  const formatDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })

  return (
    <Layout title="Admission">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Admission Management</h1>
          <p className="text-slate-500 mt-1">Review, approve, and track student admission applications.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-slate-50 px-4 py-2 rounded-xl border border-slate-200 hidden xl:block">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Admission Cycle</p>
            <p className="text-xs font-semibold text-slate-600">2026-27 • Open</p>
          </div>
          <button onClick={openAddModal}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#1162d4] text-white rounded-lg text-sm font-semibold hover:bg-[#1162d4]/90 transition-colors shadow-sm">
            <span className="material-symbols-outlined text-lg">person_add</span>New Application
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon="description" label="Total Applications" value={stats.total} color="blue" />
        <StatCard icon="pending" label="Pending Review" value={stats.pending + stats.underReview} color="orange" />
        <StatCard icon="check_circle" label="Approved" value={stats.approved} color="green" />
        <StatCard icon="cancel" label="Rejected" value={stats.rejected} color="red" />
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col lg:flex-row items-center gap-4 mb-6">
        <div className="relative flex-1 group w-full lg:w-auto">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#1162d4] text-[20px] transition-colors">search</span>
          <input type="text" placeholder="Search by name, ID, or email..."
            className="w-full bg-white border border-slate-200 rounded-lg pl-11 pr-5 py-2.5 text-sm focus:ring-2 focus:ring-[#1162d4]/20 focus:border-[#1162d4] outline-none transition-all placeholder:text-slate-400 shadow-sm"
            value={searchQuery} onChange={(e) => handleSearch(e.target.value)} />
        </div>
        <div className="flex items-center gap-3 w-full lg:w-auto">
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1) }}
            className="h-10 px-4 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-600 shadow-sm focus:ring-2 focus:ring-[#1162d4]/20 focus:border-[#1162d4] outline-none">
            <option value="All">All Status</option>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
            <option value="Under Review">Under Review</option>
          </select>
          <select value={courseFilter} onChange={(e) => { setCourseFilter(e.target.value); setCurrentPage(1) }}
            className="h-10 px-4 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-600 shadow-sm focus:ring-2 focus:ring-[#1162d4]/20 focus:border-[#1162d4] outline-none">
            <option value="All">All Courses</option>
            {courses.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <button className="flex items-center justify-center gap-2 h-10 px-4 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-all shadow-sm">
            <span className="material-symbols-outlined text-lg">ios_share</span>
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wider border-b border-slate-200">
              <th className="px-6 py-4">Applicant</th>
              <th className="px-6 py-4">Course</th>
              <th className="px-6 py-4">Merit %</th>
              <th className="px-6 py-4">Applied Date</th>
              <th className="px-6 py-4">Documents</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-10 py-20 text-center text-slate-400">
                  <span className="material-symbols-outlined text-5xl mb-3 opacity-10 text-slate-900">person_search</span>
                  <p className="text-sm font-bold text-slate-500">No applications found</p>
                  <p className="text-xs text-slate-400 mt-1">Try adjusting your search or filters</p>
                </td>
              </tr>
            ) : paginated.map((app) => (
              <tr key={app.id} className="hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => openDetail(app)}>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#1162d4]/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-[#1162d4]">{app.name.split(' ').map(n => n[0]).join('')}</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{app.name}</p>
                      <p className="text-xs text-slate-500">{app.id}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-slate-600">{app.course}</td>
                <td className="px-6 py-4">
                  <span className={`text-sm font-bold ${app.merit >= 90 ? 'text-green-600' : app.merit >= 80 ? 'text-blue-600' : 'text-orange-600'}`}>
                    {app.merit}%
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-slate-600">{formatDate(app.appliedDate)}</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${app.documents ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    <span className="material-symbols-outlined text-sm">{app.documents ? 'check_circle' : 'error'}</span>
                    {app.documents ? 'Complete' : 'Incomplete'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyles[app.status] || 'bg-slate-100 text-slate-700'}`}>
                    {app.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-end gap-1">
                    {app.status === 'Pending' && (
                      <>
                        <button onClick={() => handleStatusChange(app.id, 'Approved')}
                          className="p-1.5 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="Approve">
                          <span className="material-symbols-outlined text-lg">check_circle</span>
                        </button>
                        <button onClick={() => handleStatusChange(app.id, 'Rejected')}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Reject">
                          <span className="material-symbols-outlined text-lg">cancel</span>
                        </button>
                      </>
                    )}
                    <button onClick={() => openEdit(app)}
                      className="p-1.5 text-slate-400 hover:text-[#1162d4] hover:bg-[#1162d4]/10 rounded-lg transition-colors" title="Edit">
                      <span className="material-symbols-outlined text-lg">edit</span>
                    </button>
                    <button onClick={() => handleDelete(app.id)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                      <span className="material-symbols-outlined text-lg">delete</span>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {filtered.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between mt-8 gap-4 px-4 pb-10">
          <p className="text-sm text-slate-500">
            Showing <span className="font-semibold text-slate-900">{(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, filtered.length)}</span> of <span className="font-semibold text-slate-900">{filtered.length}</span> results
          </p>
          <div className="flex items-center gap-2">
            <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}
              className="px-4 py-2 text-xs font-semibold rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm">
              Previous
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(page => (
                <button key={page} onClick={() => setCurrentPage(page)}
                  className={`w-9 h-9 flex items-center justify-center text-xs font-semibold rounded-lg transition-all ${page === currentPage ? 'bg-[#1162d4] text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}>
                  {page}
                </button>
              ))}
            </div>
            <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}
              className="px-5 py-2.5 text-xs font-bold rounded-[14px] border border-slate-100 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm">
              Next
            </button>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col border border-slate-200">
            <div className="px-8 py-5 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-3">
                  <div className="p-2 bg-[#1162d4]/10 rounded-lg">
                    <span className="material-symbols-outlined text-[#1162d4]">person_add</span>
                  </div>
                  {editingApp ? 'Edit Application' : 'New Application'}
                </h2>
                <p className="text-sm text-slate-500 mt-1">Fill in the applicant details below</p>
              </div>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {[
                  { label: 'Full Name', name: 'name', type: 'text', placeholder: 'e.g. John Doe', required: true },
                  { label: 'Email', name: 'email', type: 'email', placeholder: 'applicant@email.com', required: true },
                  { label: 'Phone', name: 'phone', type: 'text', placeholder: '+91 XXXXX XXXXX', required: true },
                  { label: 'Date of Birth', name: 'dob', type: 'date', required: true },
                ].map(field => (
                  <div key={field.name} className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{field.label} {field.required && <span className="text-red-500">*</span>}</label>
                    <input type={field.type} name={field.name} value={formData[field.name]} onChange={handleChange}
                      placeholder={field.placeholder}
                      className={`w-full px-4 py-2.5 rounded-lg border ${formErrors[field.name] ? 'border-red-400 focus:ring-red-100' : 'border-slate-200 focus:border-[#1162d4] focus:ring-[#1162d4]/20'} focus:ring-2 outline-none transition-all text-sm text-slate-700`} />
                    {formErrors[field.name] && <p className="text-xs text-red-500 font-medium">{formErrors[field.name]}</p>}
                  </div>
                ))}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Gender</label>
                  <select name="gender" value={formData.gender} onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:border-[#1162d4] focus:ring-2 focus:ring-[#1162d4]/20 outline-none transition-all text-sm text-slate-700 bg-white">
                    <option>Male</option><option>Female</option><option>Other</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Course <span className="text-red-500">*</span></label>
                  <select name="course" value={formData.course} onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:border-[#1162d4] focus:ring-2 focus:ring-[#1162d4]/20 outline-none transition-all text-sm text-slate-700 bg-white">
                    <option>B.Tech CSE</option><option>B.Tech ECE</option><option>B.Tech ME</option><option>B.Tech CE</option><option>B.Tech IT</option>
                  </select>
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Address</label>
                  <input type="text" name="address" value={formData.address} onChange={handleChange} placeholder="City, State"
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:border-[#1162d4] focus:ring-2 focus:ring-[#1162d4]/20 outline-none transition-all text-sm text-slate-700" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Guardian Name <span className="text-red-500">*</span></label>
                  <input type="text" name="guardianName" value={formData.guardianName} onChange={handleChange} placeholder="Guardian full name"
                    className={`w-full px-4 py-2.5 rounded-lg border ${formErrors.guardianName ? 'border-red-400' : 'border-slate-200 focus:border-[#1162d4]'} focus:ring-2 focus:ring-[#1162d4]/20 outline-none transition-all text-sm text-slate-700`} />
                  {formErrors.guardianName && <p className="text-xs text-red-500 font-medium">{formErrors.guardianName}</p>}
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Guardian Phone</label>
                  <input type="text" name="guardianPhone" value={formData.guardianPhone} onChange={handleChange} placeholder="+91 XXXXX XXXXX"
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:border-[#1162d4] focus:ring-2 focus:ring-[#1162d4]/20 outline-none transition-all text-sm text-slate-700" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Previous Institution</label>
                  <input type="text" name="previousInstitution" value={formData.previousInstitution} onChange={handleChange} placeholder="School/College name"
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:border-[#1162d4] focus:ring-2 focus:ring-[#1162d4]/20 outline-none transition-all text-sm text-slate-700" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">10th Marks %</label>
                  <input type="number" name="marks10" value={formData.marks10} onChange={handleChange} placeholder="e.g. 92"
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:border-[#1162d4] focus:ring-2 focus:ring-[#1162d4]/20 outline-none transition-all text-sm text-slate-700" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">12th Marks % <span className="text-red-500">*</span></label>
                  <input type="number" name="marks12" value={formData.marks12} onChange={handleChange} placeholder="e.g. 94.2"
                    className={`w-full px-4 py-2.5 rounded-lg border ${formErrors.marks12 ? 'border-red-400' : 'border-slate-200 focus:border-[#1162d4]'} focus:ring-2 focus:ring-[#1162d4]/20 outline-none transition-all text-sm text-slate-700`} />
                  {formErrors.marks12 && <p className="text-xs text-red-500 font-medium">{formErrors.marks12}</p>}
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 mt-8 pt-6 border-t border-slate-200">
                <button type="button" onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">Cancel</button>
                <button type="submit"
                  className="px-6 py-2.5 text-sm font-semibold text-white bg-[#1162d4] rounded-lg hover:bg-[#1162d4]/90 transition-colors shadow-sm">
                  {editingApp ? 'Update Application' : 'Submit Application'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedApp && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col border border-slate-200">
            <div className="px-8 py-5 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">Application Details</h2>
              <button onClick={() => setShowDetailModal(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-8 space-y-5">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-xl bg-[#1162d4]/10 flex items-center justify-center">
                  <span className="text-xl font-bold text-[#1162d4]">{selectedApp.name.split(' ').map(n => n[0]).join('')}</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{selectedApp.name}</h3>
                  <p className="text-sm text-slate-500">{selectedApp.id}</p>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-1 ${statusStyles[selectedApp.status]}`}>{selectedApp.status}</span>
                </div>
              </div>
              {[
                ['Course', selectedApp.course],
                ['Merit Score', `${selectedApp.merit}%`],
                ['Email', selectedApp.email],
                ['Phone', selectedApp.phone],
                ['Date of Birth', formatDate(selectedApp.dob)],
                ['Gender', selectedApp.gender],
                ['Address', selectedApp.address],
                ['Previous Institution', selectedApp.previousInstitution],
                ['Guardian', `${selectedApp.guardianName} (${selectedApp.guardianPhone})`],
                ['10th Marks', `${selectedApp.marks10}%`],
                ['12th Marks', `${selectedApp.marks12}%`],
                ['Applied Date', formatDate(selectedApp.appliedDate)],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between items-center py-2 border-b border-slate-100">
                  <span className="text-sm text-slate-500">{label}</span>
                  <span className="text-sm font-semibold text-slate-900">{value || '—'}</span>
                </div>
              ))}
            </div>
            <div className="px-8 py-4 border-t border-slate-200 flex justify-end gap-3">
              {selectedApp.status === 'Pending' && (
                <>
                  <button onClick={() => { handleStatusChange(selectedApp.id, 'Approved'); setShowDetailModal(false) }}
                    className="px-5 py-2 text-sm font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors">Approve</button>
                  <button onClick={() => { handleStatusChange(selectedApp.id, 'Rejected'); setShowDetailModal(false) }}
                    className="px-5 py-2 text-sm font-semibold text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors">Reject</button>
                </>
              )}
              <button onClick={() => setShowDetailModal(false)}
                className="px-5 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">Close</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}
