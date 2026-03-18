import { useState, useEffect } from 'react'
import DashboardLayout from '../components/DashboardLayout'
import StatCard from '../components/StatCard'
import SearchFilter from '../components/SearchFilter'
import StudentTable from '../components/StudentTable'
import AddStudentModal from '../components/AddStudentModal'
import { fetchStudents, deleteStudent } from '../api/studentsApi'

export default function StudentsPage() {
  const [studentsList, setStudentsList] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState(null)
  const itemsPerPage = 8

  useEffect(() => {
    fetchStudents().then(data => {
      setStudentsList(data)
      setLoading(false)
    })
  }, [])

  const total = studentsList.length
  const active = studentsList.filter(s => s.status === 'Active').length
  const stats = { total, active }

  // Filter logic
  const filtered = studentsList.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         s.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         s.email.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesSearch
  })

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage))
  const paginatedStudents = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const handleSearch = (val) => { setSearchQuery(val); setCurrentPage(1) }

  const handleSaveSuccess = (savedStudent) => {
    setStudentsList(prev => {
      const exists = prev.find(s => s.id === savedStudent.id)
      if (exists) {
        return prev.map(s => s.id === savedStudent.id ? savedStudent : s)
      }
      return [savedStudent, ...prev]
    })
    setIsModalOpen(false)
    setSelectedStudent(null)
  }

  const handleEdit = (student) => {
    setSelectedStudent(student)
    setIsModalOpen(true)
  }

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this student? This action cannot be undone.')) {
      try {
        await deleteStudent(id)
        setStudentsList(prev => prev.filter(s => s.id !== id))
      } catch (err) {
        alert('Failed to delete student: ' + err.message)
      }
    }
  }

  return (
    <DashboardLayout 
      title="Students" 
      subtitle="Manage and monitor comprehensive student enrollment records."
      showProfileHeader={false}
    >

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard icon="group" label="Total Students" value={stats.total.toLocaleString()} color="blue" />
        <StatCard icon="bolt" label="Active Today" value={stats.active.toLocaleString()} color="green" trend="Live Updates" />
        <StatCard icon="person_add" label="New Admissions" value="45" color="purple" trend="+12% from last month" />
      </div>

      {/* Search / Filter Toolbar */}
      <div className="mb-6">
        <SearchFilter
          searchQuery={searchQuery}
          onSearchChange={handleSearch}
          onAddClick={() => setIsModalOpen(true)}
        />
      </div>

      {/* Student Table */}
      <StudentTable 
        students={paginatedStudents} 
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {/* Add/Edit Student Modal */}
      <AddStudentModal 
        isOpen={isModalOpen} 
        onClose={() => {
          setIsModalOpen(false)
          setSelectedStudent(null)
        }} 
        onSuccess={handleSaveSuccess}
        students={studentsList}
        editingStudent={selectedStudent}
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
    </DashboardLayout>
  )
}
