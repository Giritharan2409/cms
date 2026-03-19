import { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import StatCard from '../components/StatCard'
import SearchFilter from '../components/SearchFilter'
import StudentTable from '../components/StudentTable'
import AddStudentModal from '../components/AddStudentModal'

export default function StudentsPage() {
  const [studentsList, setStudentsList] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingStudent, setEditingStudent] = useState(null)
  const [showFilterPanel, setShowFilterPanel] = useState(false)
  const [filterDept, setFilterDept] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterYear, setFilterYear] = useState('')
  const itemsPerPage = 8

  const fetchStudents = async () => {
    try {
      setLoading(true)
      const res = await fetch('http://127.0.0.1:5000/api/students')
      if (!res.ok) throw new Error('Failed to fetch students')
      const data = await res.json()
      setStudentsList(data)
      setError(null)
    } catch (err) {
      console.error('Error fetching students:', err)
      setError('Could not connect to backend. Please ensure the server is running.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStudents()
  }, [])

  const handleDelete = async (student) => {
    if (window.confirm(`Are you sure you want to delete ${student.name} (Roll: ${student.rollNumber || student.id})? This action cannot be undone.`)) {
      try {
        const res = await fetch(`http://127.0.0.1:5000/api/students/${encodeURIComponent(student.rollNumber || student.id)}`, {
          method: 'DELETE'
        })
        if (!res.ok) throw new Error('Failed to delete student')
        alert('Student deleted successfully')
        fetchStudents()
      } catch (err) {
        console.error('Delete error:', err)
        alert(`Error: ${err.message}`)
      }
    }
  }

  const handleEdit = (student) => {
    setEditingStudent(student)
    setIsModalOpen(true)
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
    setEditingStudent(null)
  }

  const handleSuccess = () => {
    fetchStudents() // Refresh from backend
    handleModalClose()
    setCurrentPage(1)
  }

  const handleExport = () => {
    window.open('http://127.0.0.1:5000/api/students/export', '_blank');
  };

  const handleFilter = () => {
    setShowFilterPanel(prev => !prev);
  };

  const clearFilters = () => {
    setFilterDept('');
    setFilterStatus('');
    setFilterYear('');
    setCurrentPage(1);
  };

  const getStats = () => ({
    total: studentsList.length,
    active: studentsList.filter(s => s.status === 'active' || s.status === 'Active').length
  })

  const stats = getStats()

  // Filter logic
  const filtered = studentsList.filter(s => {
    const name = s.name || ''
    const rollNumber = s.rollNumber || s.id || ''
    const email = s.email || ''
    const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         rollNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         email.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesDept = !filterDept || (s.department || '').toLowerCase().includes(filterDept.toLowerCase()) || (s.departmentId || '').toLowerCase() === filterDept.toLowerCase()
    const matchesStatus = !filterStatus || (s.status || '').toLowerCase() === filterStatus.toLowerCase()
    const matchesYear = !filterYear || String(s.year) === filterYear
    return matchesSearch && matchesDept && matchesStatus && matchesYear
  })

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage))
  const paginatedStudents = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const handleSearch = (val) => { setSearchQuery(val); setCurrentPage(1) }

  return (
    <Layout title="Students">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Students</h1>
          <p className="text-slate-500 mt-1">Manage and monitor comprehensive student enrollment records.</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard icon="group" label="Total Students" value={loading ? '...' : stats.total.toLocaleString()} color="blue" />
        <StatCard icon="bolt" label="Active Today" value={loading ? '...' : stats.active.toLocaleString()} color="green" trend="Live Updates" />
        <StatCard icon="person_add" label="New Admissions" value={(stats.total > 0 ? 40 + stats.total : 45).toString()} color="purple" trend="+12% from last month" />
      </div>

      {/* Search / Filter Toolbar */}
      <div className="mb-6">
        <SearchFilter
          searchQuery={searchQuery}
          onSearchChange={handleSearch}
          onAddClick={() => { setEditingStudent(null); setIsModalOpen(true); }}
          onFilterClick={handleFilter}
          onExportClick={handleExport}
        />
      </div>

      {/* Filter Panel */}
      {showFilterPanel && (
        <div className="mb-6 bg-white rounded-xl border border-slate-200 p-4 shadow-sm animate-in fade-in slide-in-from-top-2">
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex-1 min-w-[140px]">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Department</label>
              <select value={filterDept} onChange={e => { setFilterDept(e.target.value); setCurrentPage(1); }} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#1162d4]/20 focus:border-[#1162d4] outline-none">
                <option value="">All Departments</option>
                <option value="Computer Science">Computer Science</option>
                <option value="Mechanical Eng.">Mechanical Eng.</option>
                <option value="Electrical Eng.">Electrical Eng.</option>
                <option value="Civil Engineering">Civil Engineering</option>
              </select>
            </div>
            <div className="flex-1 min-w-[140px]">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Status</label>
              <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setCurrentPage(1); }} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#1162d4]/20 focus:border-[#1162d4] outline-none">
                <option value="">All Statuses</option>
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="inactive">Inactive</option>
                <option value="graduated">Graduated</option>
              </select>
            </div>
            <div className="flex-1 min-w-[140px]">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Year</label>
              <select value={filterYear} onChange={e => { setFilterYear(e.target.value); setCurrentPage(1); }} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#1162d4]/20 focus:border-[#1162d4] outline-none">
                <option value="">All Years</option>
                <option value="1">1st Year</option>
                <option value="2">2nd Year</option>
                <option value="3">3rd Year</option>
                <option value="4">4th Year</option>
              </select>
            </div>
            <button onClick={clearFilters} className="px-4 py-2 text-xs font-bold text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all">
              <span className="material-symbols-outlined text-sm align-middle mr-1">close</span>
              Clear Filters
            </button>
          </div>
        </div>
      )}

      {/* Student Table / State Displays */}
      {error ? (
        <div className="bg-red-50 border border-red-100 rounded-xl p-8 text-center">
          <span className="material-symbols-outlined text-red-400 text-5xl mb-4">cloud_off</span>
          <h3 className="text-lg font-bold text-red-900">Connection Error</h3>
          <p className="text-red-700 mt-1 max-w-sm mx-auto">{error}</p>
          <button 
            onClick={fetchStudents}
            className="mt-6 px-6 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-all shadow-sm"
          >
            Retry Connection
          </button>
        </div>
      ) : loading ? (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="w-full h-96 flex flex-col items-center justify-center gap-4 animate-pulse">
             <div className="w-12 h-12 bg-slate-100 rounded-full" />
             <div className="w-48 h-4 bg-slate-100 rounded" />
             <div className="w-32 h-3 bg-slate-50 rounded" />
          </div>
        </div>
      ) : (
        <StudentTable 
          students={paginatedStudents} 
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}

      {/* Add / Edit Student Modal */}
      <AddStudentModal 
        isOpen={isModalOpen} 
        onClose={handleModalClose} 
        onSuccess={handleSuccess}
        editStudent={editingStudent}
      />

      {/* High-Fidelity Pagination */}
      {filtered.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between mt-8 gap-4 px-4 pb-10">
          <p className="text-sm text-slate-500">
            Showing <span className="font-semibold text-slate-900">{(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, filtered.length)}</span> of <span className="font-semibold text-slate-900">{filtered.length}</span> results
          </p>
          <div className="flex items-center gap-2">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => p - 1)}
              className="px-4 py-2 text-xs font-semibold rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
            >
              Previous
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-9 h-9 flex items-center justify-center text-xs font-semibold rounded-lg transition-all ${
                    page === currentPage
                      ? 'bg-[#1162d4] text-white shadow-sm'
                      : 'text-slate-500 hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  {page}
                </button>
              ))}
              {totalPages > 5 && <span className="text-slate-300 px-1">...</span>}
              {totalPages > 5 && (
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  className={`w-9 h-9 flex items-center justify-center text-xs font-semibold rounded-lg transition-all ${
                    totalPages === currentPage
                      ? 'bg-[#1162d4] text-white shadow-sm'
                      : 'text-slate-500 hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  {totalPages}
                </button>
              )}
            </div>
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(p => p + 1)}
              className="px-5 py-2.5 text-xs font-bold rounded-[14px] border border-slate-100 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </Layout>
  )
}
