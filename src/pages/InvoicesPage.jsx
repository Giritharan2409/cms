import { useState, useMemo, useRef } from 'react'
import Layout from '../components/Layout'
import StatCard from '../components/StatCard'
import { invoiceRecords as initialRecords, getInvoiceStats } from '../data/administrationData'

const statusStyles = {
  Paid:    'bg-green-100 text-green-800',
  Partial: 'bg-orange-100 text-orange-800',
  Overdue: 'bg-red-100 text-red-800',
  Pending: 'bg-yellow-100 text-yellow-800',
  Draft:   'bg-slate-100 text-slate-700',
}

export default function InvoicesPage() {
  const [records, setRecords] = useState(initialRecords)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [categoryFilter, setCategoryFilter] = useState('All')
  const [currentPage, setCurrentPage] = useState(1)
  const [showModal, setShowModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState(null)
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const itemsPerPage = 8
  const printRef = useRef(null)

  const initialForm = {
    studentId: '', studentName: '', department: 'Computer Science',
    description: '', amount: '', category: 'Tuition', dueDate: ''
  }
  const [formData, setFormData] = useState(initialForm)
  const [formErrors, setFormErrors] = useState({})

  const stats = useMemo(() => getInvoiceStats(records), [records])
  const categories = [...new Set(records.map(r => r.category))]

  const filtered = records.filter(r => {
    const matchesSearch = r.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         r.studentId.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         r.id.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'All' || r.status === statusFilter
    const matchesCat = categoryFilter === 'All' || r.category === categoryFilter
    return matchesSearch && matchesStatus && matchesCat
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
    if (!formData.studentId.trim()) errors.studentId = 'Student ID required'
    if (!formData.studentName.trim()) errors.studentName = 'Student name required'
    if (!formData.description.trim()) errors.description = 'Description required'
    if (!formData.amount || parseFloat(formData.amount) <= 0) errors.amount = 'Valid amount required'
    if (!formData.dueDate) errors.dueDate = 'Due date required'
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!validateForm()) return
    const amount = parseFloat(formData.amount)
    const newRecord = {
      id: `INV-2026-${String(records.length + 1).padStart(3, '0')}`,
      studentId: formData.studentId,
      studentName: formData.studentName,
      department: formData.department,
      description: formData.description,
      amount,
      tax: 0,
      total: amount,
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: formData.dueDate,
      paidDate: null,
      status: 'Pending',
      category: formData.category,
      method: null,
    }
    setRecords(prev => [newRecord, ...prev])
    setShowModal(false)
    setFormData(initialForm)
    setCurrentPage(1)
  }

  const handleMarkPaid = (id) => {
    setRecords(prev => prev.map(r =>
      r.id === id ? { ...r, status: 'Paid', paidDate: new Date().toISOString().split('T')[0], method: 'Online' } : r
    ))
  }

  const handleSendReminder = (record) => {
    alert(`Invoice reminder sent to ${record.studentName} for ${record.id} — ₹${record.total.toLocaleString('en-IN')}`)
  }

  const handleDelete = (id) => {
    if (confirm('Delete this invoice?')) {
      setRecords(prev => prev.filter(r => r.id !== id))
    }
  }

  const formatCurrency = (val) => `₹${val.toLocaleString('en-IN')}`
  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'

  return (
    <Layout title="Invoices">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Invoice Management</h1>
          <p className="text-slate-500 mt-1">Generate, track, and manage student invoices and payment receipts.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-all shadow-sm">
            <span className="material-symbols-outlined text-lg">download</span>Export All
          </button>
          <button onClick={() => { setShowModal(true); setFormErrors({}) }}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#1162d4] text-white rounded-lg text-sm font-semibold hover:bg-[#1162d4]/90 transition-colors shadow-sm">
            <span className="material-symbols-outlined text-lg">add</span>Create Invoice
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon="receipt" label="Total Invoiced" value={formatCurrency(stats.totalAmount)} color="blue" />
        <StatCard icon="payments" label="Total Received" value={formatCurrency(stats.totalPaid)} color="green" />
        <StatCard icon="pending" label="Pending" value={stats.pending} color="orange" trend={`of ${stats.total}`} />
        <StatCard icon="error" label="Overdue" value={stats.overdue} color="red" />
      </div>

      {/* Revenue Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {(() => {
          const byCat = {}
          records.forEach(r => { byCat[r.category] = (byCat[r.category] || 0) + r.total })
          const sorted = Object.entries(byCat).sort((a, b) => b[1] - a[1]).slice(0, 3)
          const colors = ['bg-[#1162d4]/10 text-[#1162d4]', 'bg-emerald-100 text-emerald-600', 'bg-purple-100 text-purple-600']
          const icons = ['school', 'apartment', 'science']
          return sorted.map(([cat, total], i) => (
            <div key={cat} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-center gap-4">
              <div className={`p-3 rounded-xl ${colors[i]}`}>
                <span className="material-symbols-outlined">{icons[i]}</span>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">{cat} Fees</p>
                <p className="text-xl font-bold text-slate-900">{formatCurrency(total)}</p>
              </div>
            </div>
          ))
        })()}
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col lg:flex-row items-center gap-4 mb-6">
        <div className="relative flex-1 group w-full lg:w-auto">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#1162d4] text-[20px] transition-colors">search</span>
          <input type="text" placeholder="Search by student, invoice ID..."
            className="w-full bg-white border border-slate-200 rounded-lg pl-11 pr-5 py-2.5 text-sm focus:ring-2 focus:ring-[#1162d4]/20 focus:border-[#1162d4] outline-none transition-all placeholder:text-slate-400 shadow-sm"
            value={searchQuery} onChange={(e) => handleSearch(e.target.value)} />
        </div>
        <div className="flex items-center gap-3 w-full lg:w-auto">
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1) }}
            className="h-10 px-4 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-600 shadow-sm focus:ring-2 focus:ring-[#1162d4]/20 focus:border-[#1162d4] outline-none">
            <option value="All">All Status</option>
            <option>Paid</option><option>Partial</option><option>Pending</option><option>Overdue</option>
          </select>
          <select value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); setCurrentPage(1) }}
            className="h-10 px-4 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-600 shadow-sm focus:ring-2 focus:ring-[#1162d4]/20 focus:border-[#1162d4] outline-none">
            <option value="All">All Categories</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wider border-b border-slate-200">
              <th className="px-6 py-4">Invoice</th>
              <th className="px-6 py-4">Student</th>
              <th className="px-6 py-4">Category</th>
              <th className="px-6 py-4">Amount</th>
              <th className="px-6 py-4">Issue Date</th>
              <th className="px-6 py-4">Due Date</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-10 py-20 text-center text-slate-400">
                  <span className="material-symbols-outlined text-5xl mb-3 opacity-10 text-slate-900">description</span>
                  <p className="text-sm font-bold text-slate-500">No invoices found</p>
                </td>
              </tr>
            ) : paginated.map((r) => (
              <tr key={r.id} className="hover:bg-slate-50 transition-colors cursor-pointer"
                onClick={() => { setSelectedRecord(r); setShowDetailModal(true) }}>
                <td className="px-6 py-4">
                  <p className="text-xs font-bold text-[#1162d4]">{r.id}</p>
                  <p className="text-xs text-slate-500 mt-0.5 truncate max-w-[160px]">{r.description}</p>
                </td>
                <td className="px-6 py-4">
                  <p className="text-sm font-semibold text-slate-900">{r.studentName}</p>
                  <p className="text-xs text-slate-500">{r.studentId}</p>
                </td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">{r.category}</span>
                </td>
                <td className="px-6 py-4 text-sm font-bold text-slate-900">{formatCurrency(r.total)}</td>
                <td className="px-6 py-4 text-sm text-slate-600">{formatDate(r.issueDate)}</td>
                <td className="px-6 py-4 text-sm text-slate-600">{formatDate(r.dueDate)}</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyles[r.status] || 'bg-slate-100 text-slate-700'}`}>{r.status}</span>
                </td>
                <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-end gap-1">
                    <button onClick={() => { setSelectedRecord(r); setShowPreviewModal(true) }}
                      className="p-1.5 text-slate-400 hover:text-[#1162d4] hover:bg-[#1162d4]/10 rounded-lg transition-colors" title="Preview Invoice">
                      <span className="material-symbols-outlined text-lg">visibility</span>
                    </button>
                    {(r.status === 'Pending' || r.status === 'Overdue' || r.status === 'Partial') && (
                      <>
                        <button onClick={() => handleMarkPaid(r.id)}
                          className="p-1.5 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="Mark Paid">
                          <span className="material-symbols-outlined text-lg">check_circle</span>
                        </button>
                        <button onClick={() => handleSendReminder(r)}
                          className="p-1.5 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors" title="Send Reminder">
                          <span className="material-symbols-outlined text-lg">notifications</span>
                        </button>
                      </>
                    )}
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

      {/* Create Invoice Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col border border-slate-200">
            <div className="px-8 py-5 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-3">
                <div className="p-2 bg-[#1162d4]/10 rounded-lg"><span className="material-symbols-outlined text-[#1162d4]">description</span></div>
                Create Invoice
              </h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400">
                <span className="material-symbols-outlined">close</span></button>
            </div>
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Student ID <span className="text-red-500">*</span></label>
                  <input type="text" name="studentId" value={formData.studentId} onChange={handleChange} placeholder="STU-2025-XXXX"
                    className={`w-full px-4 py-2.5 rounded-lg border ${formErrors.studentId ? 'border-red-400' : 'border-slate-200 focus:border-[#1162d4]'} focus:ring-2 focus:ring-[#1162d4]/20 outline-none text-sm text-slate-700`} />
                  {formErrors.studentId && <p className="text-xs text-red-500 font-medium">{formErrors.studentId}</p>}
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Student Name <span className="text-red-500">*</span></label>
                  <input type="text" name="studentName" value={formData.studentName} onChange={handleChange} placeholder="Full name"
                    className={`w-full px-4 py-2.5 rounded-lg border ${formErrors.studentName ? 'border-red-400' : 'border-slate-200 focus:border-[#1162d4]'} focus:ring-2 focus:ring-[#1162d4]/20 outline-none text-sm text-slate-700`} />
                  {formErrors.studentName && <p className="text-xs text-red-500 font-medium">{formErrors.studentName}</p>}
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Department</label>
                  <select name="department" value={formData.department} onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:border-[#1162d4] focus:ring-2 focus:ring-[#1162d4]/20 outline-none text-sm text-slate-700 bg-white">
                    {['Computer Science', 'Electronics', 'Mechanical', 'Civil', 'IT'].map(d => <option key={d}>{d}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Category</label>
                  <select name="category" value={formData.category} onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:border-[#1162d4] focus:ring-2 focus:ring-[#1162d4]/20 outline-none text-sm text-slate-700 bg-white">
                    {['Tuition', 'Hostel', 'Lab', 'Examination', 'Transport', 'Library'].map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Description <span className="text-red-500">*</span></label>
                  <input type="text" name="description" value={formData.description} onChange={handleChange} placeholder="e.g. Tuition Fee - Sem 4"
                    className={`w-full px-4 py-2.5 rounded-lg border ${formErrors.description ? 'border-red-400' : 'border-slate-200 focus:border-[#1162d4]'} focus:ring-2 focus:ring-[#1162d4]/20 outline-none text-sm text-slate-700`} />
                  {formErrors.description && <p className="text-xs text-red-500 font-medium">{formErrors.description}</p>}
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Amount (₹) <span className="text-red-500">*</span></label>
                  <input type="number" name="amount" value={formData.amount} onChange={handleChange} placeholder="e.g. 75000"
                    className={`w-full px-4 py-2.5 rounded-lg border ${formErrors.amount ? 'border-red-400' : 'border-slate-200 focus:border-[#1162d4]'} focus:ring-2 focus:ring-[#1162d4]/20 outline-none text-sm text-slate-700`} />
                  {formErrors.amount && <p className="text-xs text-red-500 font-medium">{formErrors.amount}</p>}
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Due Date <span className="text-red-500">*</span></label>
                  <input type="date" name="dueDate" value={formData.dueDate} onChange={handleChange}
                    className={`w-full px-4 py-2.5 rounded-lg border ${formErrors.dueDate ? 'border-red-400' : 'border-slate-200 focus:border-[#1162d4]'} focus:ring-2 focus:ring-[#1162d4]/20 outline-none text-sm text-slate-700`} />
                  {formErrors.dueDate && <p className="text-xs text-red-500 font-medium">{formErrors.dueDate}</p>}
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 mt-8 pt-6 border-t border-slate-200">
                <button type="button" onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50">Cancel</button>
                <button type="submit"
                  className="px-6 py-2.5 text-sm font-semibold text-white bg-[#1162d4] rounded-lg hover:bg-[#1162d4]/90 shadow-sm">Create Invoice</button>
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
              <h2 className="text-xl font-bold text-slate-900">Invoice Details</h2>
              <button onClick={() => setShowDetailModal(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400">
                <span className="material-symbols-outlined">close</span></button>
            </div>
            <div className="flex-1 overflow-y-auto p-8 space-y-3">
              {[
                ['Invoice ID', selectedRecord.id],
                ['Student', `${selectedRecord.studentName} (${selectedRecord.studentId})`],
                ['Department', selectedRecord.department],
                ['Category', selectedRecord.category],
                ['Description', selectedRecord.description],
                ['Amount', formatCurrency(selectedRecord.amount)],
                ['Tax', formatCurrency(selectedRecord.tax)],
                ['Total', formatCurrency(selectedRecord.total)],
                ['Issue Date', formatDate(selectedRecord.issueDate)],
                ['Due Date', formatDate(selectedRecord.dueDate)],
                ['Paid Date', formatDate(selectedRecord.paidDate)],
                ['Payment Method', selectedRecord.method || '—'],
                ['Status', selectedRecord.status],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between items-center py-2 border-b border-slate-100">
                  <span className="text-sm text-slate-500">{label}</span>
                  <span className="text-sm font-semibold text-slate-900">{value}</span>
                </div>
              ))}
            </div>
            <div className="px-8 py-4 border-t border-slate-200 flex justify-end gap-3">
              {(selectedRecord.status === 'Pending' || selectedRecord.status === 'Overdue') && (
                <button onClick={() => { handleMarkPaid(selectedRecord.id); setShowDetailModal(false) }}
                  className="px-5 py-2 text-sm font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700">Mark Paid</button>
              )}
              <button onClick={() => setShowDetailModal(false)}
                className="px-5 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Preview Modal */}
      {showPreviewModal && selectedRecord && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md border border-slate-200" ref={printRef}>
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="bg-[#2563eb] w-8 h-8 rounded-lg flex items-center justify-center text-white">
                  <span className="material-symbols-outlined text-lg">school</span>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">EduCore</h3>
                  <p className="text-[10px] text-slate-500">Tax Invoice</p>
                </div>
              </div>
              <button onClick={() => setShowPreviewModal(false)} className="p-1.5 hover:bg-slate-200 rounded-full text-slate-400">
                <span className="material-symbols-outlined text-lg">close</span></button>
            </div>
            <div className="p-6 space-y-5">
              <div className="flex justify-between">
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wider">Invoice #</p>
                  <p className="text-sm font-bold text-[#1162d4]">{selectedRecord.id}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-400 uppercase tracking-wider">Date</p>
                  <p className="text-sm font-semibold text-slate-900">{formatDate(selectedRecord.issueDate)}</p>
                </div>
              </div>
              <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Billed To</p>
                <p className="text-sm font-bold text-slate-900">{selectedRecord.studentName}</p>
                <p className="text-xs text-slate-500">{selectedRecord.studentId} • {selectedRecord.department}</p>
              </div>
              <div>
                <div className="flex justify-between py-2 border-b border-slate-200 text-xs text-slate-500 font-semibold uppercase">
                  <span>Description</span><span>Amount</span>
                </div>
                <div className="flex justify-between py-3">
                  <span className="text-sm text-slate-700">{selectedRecord.description}</span>
                  <span className="text-sm text-slate-900">{formatCurrency(selectedRecord.amount)}</span>
                </div>
                {selectedRecord.tax > 0 && (
                  <div className="flex justify-between py-2 border-t border-slate-100">
                    <span className="text-sm text-slate-500">Tax</span>
                    <span className="text-sm text-slate-700">{formatCurrency(selectedRecord.tax)}</span>
                  </div>
                )}
                <div className="flex justify-between py-3 border-t border-slate-200 mt-1">
                  <span className="text-sm font-bold text-slate-900">Total</span>
                  <span className="text-lg font-bold text-[#1162d4]">{formatCurrency(selectedRecord.total)}</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-xs text-slate-400">Due Date</p>
                  <p className="text-sm font-semibold text-slate-900">{formatDate(selectedRecord.dueDate)}</p>
                </div>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${statusStyles[selectedRecord.status]}`}>{selectedRecord.status}</span>
              </div>
            </div>
            <div className="px-6 py-3 border-t border-slate-200 flex justify-end gap-2">
              <button onClick={() => window.print()}
                className="px-4 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-base">print</span>Print
              </button>
              <button onClick={() => setShowPreviewModal(false)}
                className="px-4 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50">Close</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}
