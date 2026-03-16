import { useState, useMemo } from 'react'
import Layout from '../components/Layout'
import StatCard from '../components/StatCard'
import { payrollRecords as initialRecords, getPayrollStats } from '../data/administrationData'

const statusStyles = {
  Paid:       'bg-green-100 text-green-800',
  Processing: 'bg-blue-100 text-blue-800',
  Pending:    'bg-orange-100 text-orange-800',
}

export default function PayrollPage() {
  const [records, setRecords] = useState(initialRecords)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [deptFilter, setDeptFilter] = useState('All')
  const [currentPage, setCurrentPage] = useState(1)
  const [showModal, setShowModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState(null)
  const [showPayslipModal, setShowPayslipModal] = useState(false)
  const [editingRecord, setEditingRecord] = useState(null)
  const itemsPerPage = 8

  const initialForm = {
    employeeId: '', name: '', department: 'Computer Science', designation: 'Professor',
    basicSalary: '', hra: '', da: '', allowances: '', deductions: '', tax: '',
    bankAccount: '', month: 'March 2026'
  }
  const [formData, setFormData] = useState(initialForm)
  const [formErrors, setFormErrors] = useState({})

  const stats = useMemo(() => getPayrollStats(records), [records])
  const departments = [...new Set(records.map(r => r.department))]

  const filtered = records.filter(r => {
    const matchesSearch = r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         r.employeeId.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'All' || r.status === statusFilter
    const matchesDept = deptFilter === 'All' || r.department === deptFilter
    return matchesSearch && matchesStatus && matchesDept
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage))
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const handleSearch = (val) => { setSearchQuery(val); setCurrentPage(1) }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (formErrors[name]) setFormErrors(prev => ({ ...prev, [name]: '' }))
  }

  const validateForm = () => {
    const errors = {}
    if (!formData.employeeId.trim()) errors.employeeId = 'Employee ID required'
    if (!formData.name.trim()) errors.name = 'Name required'
    if (!formData.basicSalary || parseFloat(formData.basicSalary) <= 0) errors.basicSalary = 'Valid salary required'
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const openAddModal = () => {
    setEditingRecord(null)
    setFormData(initialForm)
    setFormErrors({})
    setShowModal(true)
  }

  const openEditModal = (record) => {
    setEditingRecord(record)
    setFormData({
      employeeId: record.employeeId, name: record.name, department: record.department,
      designation: record.designation, basicSalary: String(record.basicSalary),
      hra: String(record.hra), da: String(record.da), allowances: String(record.allowances),
      deductions: String(record.deductions), tax: String(record.tax),
      bankAccount: record.bankAccount, month: record.month
    })
    setFormErrors({})
    setShowModal(true)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!validateForm()) return

    const basic = parseFloat(formData.basicSalary) || 0
    const hra = parseFloat(formData.hra) || Math.round(basic * 0.2)
    const da = parseFloat(formData.da) || Math.round(basic * 0.15)
    const allowances = parseFloat(formData.allowances) || 0
    const deductions = parseFloat(formData.deductions) || 0
    const tax = parseFloat(formData.tax) || Math.round((basic + hra + da) * 0.1)
    const netSalary = basic + hra + da + allowances - deductions - tax

    if (editingRecord) {
      setRecords(prev => prev.map(r => r.id === editingRecord.id ? {
        ...r, ...formData, basicSalary: basic, hra, da, allowances, deductions, tax, netSalary
      } : r))
    } else {
      const newRecord = {
        id: `PAY-${String(records.length + 1).padStart(3, '0')}`,
        employeeId: formData.employeeId, name: formData.name, department: formData.department,
        designation: formData.designation, basicSalary: basic, hra, da, allowances, deductions, tax,
        netSalary, status: 'Pending', month: formData.month, paidDate: null,
        bankAccount: formData.bankAccount, method: 'Bank Transfer'
      }
      setRecords(prev => [newRecord, ...prev])
    }
    setShowModal(false)
    setFormData(initialForm)
    setCurrentPage(1)
  }

  const handleProcessPayroll = (id) => {
    setRecords(prev => prev.map(r =>
      r.id === id ? { ...r, status: 'Processing' } : r
    ))
  }

  const handleMarkPaid = (id) => {
    setRecords(prev => prev.map(r =>
      r.id === id ? { ...r, status: 'Paid', paidDate: new Date().toISOString().split('T')[0] } : r
    ))
  }

  const handleDelete = (id) => {
    if (confirm('Delete this payroll record?')) {
      setRecords(prev => prev.filter(r => r.id !== id))
    }
  }

  const handleRunPayroll = () => {
    const pendingCount = records.filter(r => r.status === 'Pending').length
    if (pendingCount === 0) {
      alert('No pending payroll records to process.')
      return
    }
    setRecords(prev => prev.map(r => r.status === 'Pending' ? { ...r, status: 'Processing' } : r))
    alert(`Processing payroll for ${pendingCount} employee(s)...`)
    setTimeout(() => {
      setRecords(prev => prev.map(r => r.status === 'Processing' ? { ...r, status: 'Paid', paidDate: new Date().toISOString().split('T')[0] } : r))
    }, 2000)
  }

  const formatCurrency = (val) => `₹${val.toLocaleString('en-IN')}`

  return (
    <Layout title="Payroll">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Payroll Management</h1>
          <p className="text-slate-500 mt-1">Manage employee salaries, deductions, and process payroll cycles.</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleRunPayroll}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-all shadow-sm">
            <span className="material-symbols-outlined text-lg">play_arrow</span>Run Payroll
          </button>
          <button onClick={openAddModal}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#1162d4] text-white rounded-lg text-sm font-semibold hover:bg-[#1162d4]/90 transition-colors shadow-sm">
            <span className="material-symbols-outlined text-lg">add</span>Add Employee
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon="account_balance_wallet" label="Total Payout" value={formatCurrency(stats.totalPayout)} color="blue" />
        <StatCard icon="check_circle" label="Paid" value={stats.paid} color="green" trend={`of ${stats.total}`} />
        <StatCard icon="sync" label="Processing" value={stats.processing} color="purple" />
        <StatCard icon="schedule" label="Pending" value={stats.pending} color="orange" />
      </div>

      {/* Payroll Month Summary */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 mb-6 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#1162d4]/10 rounded-lg">
              <span className="material-symbols-outlined text-[#1162d4]">calendar_month</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">March 2026 Payroll Cycle</p>
              <p className="text-xs text-slate-500">Processing deadline: March 25, 2026</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-500">Total Deductions</p>
            <p className="text-lg font-bold text-slate-900">{formatCurrency(stats.totalDeductions)}</p>
          </div>
        </div>
        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full rounded-full bg-green-500 transition-all duration-700"
            style={{ width: `${stats.total > 0 ? (stats.paid / stats.total) * 100 : 0}%` }} />
        </div>
        <p className="text-xs text-slate-400 mt-2">{stats.paid} of {stats.total} employees paid</p>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col lg:flex-row items-center gap-4 mb-6">
        <div className="relative flex-1 group w-full lg:w-auto">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#1162d4] text-[20px] transition-colors">search</span>
          <input type="text" placeholder="Search by name or employee ID..."
            className="w-full bg-white border border-slate-200 rounded-lg pl-11 pr-5 py-2.5 text-sm focus:ring-2 focus:ring-[#1162d4]/20 focus:border-[#1162d4] outline-none transition-all placeholder:text-slate-400 shadow-sm"
            value={searchQuery} onChange={(e) => handleSearch(e.target.value)} />
        </div>
        <div className="flex items-center gap-3 w-full lg:w-auto">
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1) }}
            className="h-10 px-4 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-600 shadow-sm focus:ring-2 focus:ring-[#1162d4]/20 focus:border-[#1162d4] outline-none">
            <option value="All">All Status</option>
            <option>Paid</option><option>Processing</option><option>Pending</option>
          </select>
          <select value={deptFilter} onChange={(e) => { setDeptFilter(e.target.value); setCurrentPage(1) }}
            className="h-10 px-4 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-600 shadow-sm focus:ring-2 focus:ring-[#1162d4]/20 focus:border-[#1162d4] outline-none">
            <option value="All">All Departments</option>
            {departments.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <button className="flex items-center justify-center gap-2 h-10 px-4 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-all shadow-sm">
            <span className="material-symbols-outlined text-lg">download</span>
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wider border-b border-slate-200">
              <th className="px-6 py-4">Employee</th>
              <th className="px-6 py-4">Department</th>
              <th className="px-6 py-4">Basic Salary</th>
              <th className="px-6 py-4">Deductions</th>
              <th className="px-6 py-4">Net Salary</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-10 py-20 text-center text-slate-400">
                  <span className="material-symbols-outlined text-5xl mb-3 opacity-10 text-slate-900">receipt_long</span>
                  <p className="text-sm font-bold text-slate-500">No payroll records found</p>
                </td>
              </tr>
            ) : paginated.map((r) => (
              <tr key={r.id} className="hover:bg-slate-50 transition-colors cursor-pointer"
                onClick={() => { setSelectedRecord(r); setShowDetailModal(true) }}>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#1162d4]/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-[#1162d4]">{r.name.split(' ').map(n => n[0]).join('').slice(0, 2)}</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{r.name}</p>
                      <p className="text-xs text-slate-500">{r.employeeId} • {r.designation}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-slate-600">{r.department}</td>
                <td className="px-6 py-4 text-sm text-slate-900">{formatCurrency(r.basicSalary)}</td>
                <td className="px-6 py-4 text-sm text-red-500">-{formatCurrency(r.deductions + r.tax)}</td>
                <td className="px-6 py-4 text-sm font-bold text-slate-900">{formatCurrency(r.netSalary)}</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyles[r.status] || 'bg-slate-100 text-slate-700'}`}>{r.status}</span>
                </td>
                <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-end gap-1">
                    {r.status === 'Pending' && (
                      <button onClick={() => handleProcessPayroll(r.id)}
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Process">
                        <span className="material-symbols-outlined text-lg">sync</span>
                      </button>
                    )}
                    {r.status === 'Processing' && (
                      <button onClick={() => handleMarkPaid(r.id)}
                        className="p-1.5 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="Mark Paid">
                        <span className="material-symbols-outlined text-lg">check_circle</span>
                      </button>
                    )}
                    <button onClick={() => { setSelectedRecord(r); setShowPayslipModal(true) }}
                      className="p-1.5 text-slate-400 hover:text-[#1162d4] hover:bg-[#1162d4]/10 rounded-lg transition-colors" title="View Payslip">
                      <span className="material-symbols-outlined text-lg">receipt</span>
                    </button>
                    <button onClick={() => openEditModal(r)}
                      className="p-1.5 text-slate-400 hover:text-[#1162d4] hover:bg-[#1162d4]/10 rounded-lg transition-colors" title="Edit">
                      <span className="material-symbols-outlined text-lg">edit</span>
                    </button>
                    <button onClick={() => handleDelete(r.id)}
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
              className="px-4 py-2 text-xs font-semibold rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm">Previous</button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(page => (
                <button key={page} onClick={() => setCurrentPage(page)}
                  className={`w-9 h-9 flex items-center justify-center text-xs font-semibold rounded-lg transition-all ${page === currentPage ? 'bg-[#1162d4] text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}>{page}</button>
              ))}
            </div>
            <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}
              className="px-5 py-2.5 text-xs font-bold rounded-[14px] border border-slate-100 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm">Next</button>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col border border-slate-200">
            <div className="px-8 py-5 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-3">
                <div className="p-2 bg-[#1162d4]/10 rounded-lg"><span className="material-symbols-outlined text-[#1162d4]">receipt_long</span></div>
                {editingRecord ? 'Edit Payroll' : 'Add Employee Payroll'}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400">
                <span className="material-symbols-outlined">close</span></button>
            </div>
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Employee ID <span className="text-red-500">*</span></label>
                  <input type="text" name="employeeId" value={formData.employeeId} onChange={handleChange} placeholder="FAC-XXX"
                    className={`w-full px-4 py-2.5 rounded-lg border ${formErrors.employeeId ? 'border-red-400' : 'border-slate-200 focus:border-[#1162d4]'} focus:ring-2 focus:ring-[#1162d4]/20 outline-none text-sm text-slate-700`} />
                  {formErrors.employeeId && <p className="text-xs text-red-500 font-medium">{formErrors.employeeId}</p>}
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Full Name <span className="text-red-500">*</span></label>
                  <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Employee name"
                    className={`w-full px-4 py-2.5 rounded-lg border ${formErrors.name ? 'border-red-400' : 'border-slate-200 focus:border-[#1162d4]'} focus:ring-2 focus:ring-[#1162d4]/20 outline-none text-sm text-slate-700`} />
                  {formErrors.name && <p className="text-xs text-red-500 font-medium">{formErrors.name}</p>}
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Department</label>
                  <select name="department" value={formData.department} onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:border-[#1162d4] focus:ring-2 focus:ring-[#1162d4]/20 outline-none text-sm text-slate-700 bg-white">
                    {['Computer Science', 'Mathematics', 'English', 'Mechanical', 'Electronics', 'Administration', 'Library', 'IT Support'].map(d => <option key={d}>{d}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Designation</label>
                  <select name="designation" value={formData.designation} onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:border-[#1162d4] focus:ring-2 focus:ring-[#1162d4]/20 outline-none text-sm text-slate-700 bg-white">
                    {['Professor', 'Assoc. Professor', 'Asst. Professor', 'Lecturer', 'Office Manager', 'Head Librarian', 'System Admin', 'Lab Assistant'].map(d => <option key={d}>{d}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Basic Salary (₹) <span className="text-red-500">*</span></label>
                  <input type="number" name="basicSalary" value={formData.basicSalary} onChange={handleChange} placeholder="e.g. 100000"
                    className={`w-full px-4 py-2.5 rounded-lg border ${formErrors.basicSalary ? 'border-red-400' : 'border-slate-200 focus:border-[#1162d4]'} focus:ring-2 focus:ring-[#1162d4]/20 outline-none text-sm text-slate-700`} />
                  {formErrors.basicSalary && <p className="text-xs text-red-500 font-medium">{formErrors.basicSalary}</p>}
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">HRA (₹)</label>
                  <input type="number" name="hra" value={formData.hra} onChange={handleChange} placeholder="Auto: 20% of basic"
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:border-[#1162d4] focus:ring-2 focus:ring-[#1162d4]/20 outline-none text-sm text-slate-700" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">DA (₹)</label>
                  <input type="number" name="da" value={formData.da} onChange={handleChange} placeholder="Auto: 15% of basic"
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:border-[#1162d4] focus:ring-2 focus:ring-[#1162d4]/20 outline-none text-sm text-slate-700" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Allowances (₹)</label>
                  <input type="number" name="allowances" value={formData.allowances} onChange={handleChange} placeholder="0"
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:border-[#1162d4] focus:ring-2 focus:ring-[#1162d4]/20 outline-none text-sm text-slate-700" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Deductions (₹)</label>
                  <input type="number" name="deductions" value={formData.deductions} onChange={handleChange} placeholder="0"
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:border-[#1162d4] focus:ring-2 focus:ring-[#1162d4]/20 outline-none text-sm text-slate-700" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tax (₹)</label>
                  <input type="number" name="tax" value={formData.tax} onChange={handleChange} placeholder="Auto: 10% of gross"
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:border-[#1162d4] focus:ring-2 focus:ring-[#1162d4]/20 outline-none text-sm text-slate-700" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Bank Account</label>
                  <input type="text" name="bankAccount" value={formData.bankAccount} onChange={handleChange} placeholder="XXXX-XXXX"
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:border-[#1162d4] focus:ring-2 focus:ring-[#1162d4]/20 outline-none text-sm text-slate-700" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Payroll Month</label>
                  <input type="text" name="month" value={formData.month} onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:border-[#1162d4] focus:ring-2 focus:ring-[#1162d4]/20 outline-none text-sm text-slate-700" />
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 mt-8 pt-6 border-t border-slate-200">
                <button type="button" onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50">Cancel</button>
                <button type="submit"
                  className="px-6 py-2.5 text-sm font-semibold text-white bg-[#1162d4] rounded-lg hover:bg-[#1162d4]/90 shadow-sm">
                  {editingRecord ? 'Update' : 'Add Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedRecord && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col border border-slate-200">
            <div className="px-8 py-5 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">Payroll Details</h2>
              <button onClick={() => setShowDetailModal(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400">
                <span className="material-symbols-outlined">close</span></button>
            </div>
            <div className="flex-1 overflow-y-auto p-8 space-y-3">
              {[
                ['Employee', `${selectedRecord.name} (${selectedRecord.employeeId})`],
                ['Department', selectedRecord.department],
                ['Designation', selectedRecord.designation],
                ['Month', selectedRecord.month],
                ['Basic Salary', formatCurrency(selectedRecord.basicSalary)],
                ['HRA', formatCurrency(selectedRecord.hra)],
                ['DA', formatCurrency(selectedRecord.da)],
                ['Allowances', formatCurrency(selectedRecord.allowances)],
                ['Gross', formatCurrency(selectedRecord.basicSalary + selectedRecord.hra + selectedRecord.da + selectedRecord.allowances)],
                ['Deductions', formatCurrency(selectedRecord.deductions)],
                ['Tax', formatCurrency(selectedRecord.tax)],
                ['Net Salary', formatCurrency(selectedRecord.netSalary)],
                ['Status', selectedRecord.status],
                ['Paid Date', selectedRecord.paidDate || '—'],
                ['Bank Account', selectedRecord.bankAccount],
              ].map(([label, value]) => (
                <div key={label} className={`flex justify-between items-center py-2 border-b border-slate-100 ${label === 'Net Salary' ? 'font-bold' : ''}`}>
                  <span className="text-sm text-slate-500">{label}</span>
                  <span className={`text-sm font-semibold ${label === 'Net Salary' ? 'text-[#1162d4] text-base' : 'text-slate-900'}`}>{value}</span>
                </div>
              ))}
            </div>
            <div className="px-8 py-4 border-t border-slate-200 flex justify-end">
              <button onClick={() => setShowDetailModal(false)}
                className="px-5 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Payslip Modal */}
      {showPayslipModal && selectedRecord && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md border border-slate-200">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="bg-[#2563eb] w-8 h-8 rounded-lg flex items-center justify-center text-white">
                  <span className="material-symbols-outlined text-lg">school</span>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">EduCore</h3>
                  <p className="text-[10px] text-slate-500">Payslip - {selectedRecord.month}</p>
                </div>
              </div>
              <button onClick={() => setShowPayslipModal(false)} className="p-1.5 hover:bg-slate-200 rounded-full text-slate-400">
                <span className="material-symbols-outlined text-lg">close</span></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                <p className="text-sm font-bold text-slate-900">{selectedRecord.name}</p>
                <p className="text-xs text-slate-500">{selectedRecord.employeeId} • {selectedRecord.designation} • {selectedRecord.department}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Earnings</p>
                {[['Basic Salary', selectedRecord.basicSalary], ['HRA', selectedRecord.hra], ['DA', selectedRecord.da], ['Allowances', selectedRecord.allowances]].map(([l, v]) => (
                  <div key={l} className="flex justify-between py-1.5"><span className="text-sm text-slate-600">{l}</span><span className="text-sm text-slate-900">{formatCurrency(v)}</span></div>
                ))}
                <div className="flex justify-between py-1.5 border-t border-slate-200 mt-1"><span className="text-sm font-semibold text-slate-700">Gross</span><span className="text-sm font-bold text-slate-900">{formatCurrency(selectedRecord.basicSalary + selectedRecord.hra + selectedRecord.da + selectedRecord.allowances)}</span></div>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Deductions</p>
                {[['PF & Deductions', selectedRecord.deductions], ['Tax', selectedRecord.tax]].map(([l, v]) => (
                  <div key={l} className="flex justify-between py-1.5"><span className="text-sm text-slate-600">{l}</span><span className="text-sm text-red-500">-{formatCurrency(v)}</span></div>
                ))}
              </div>
              <div className="bg-[#1162d4]/5 rounded-lg p-3 flex justify-between items-center border border-[#1162d4]/20">
                <span className="text-sm font-bold text-slate-700">Net Salary</span>
                <span className="text-lg font-bold text-[#1162d4]">{formatCurrency(selectedRecord.netSalary)}</span>
              </div>
            </div>
            <div className="px-6 py-3 border-t border-slate-200 flex justify-end">
              <button onClick={() => setShowPayslipModal(false)}
                className="px-5 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50">Close</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}
