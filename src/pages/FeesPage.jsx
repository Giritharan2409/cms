import { useState, useMemo, useEffect } from 'react'
import Layout from '../components/Layout'
import StatCard from '../components/StatCard'
import { 
  getFeeRecords, 
  updateFeeRecord,
  getFeeStats 
} from '../services/dataService'

const statusStyles = {
  Paid:    'bg-green-100 text-green-800',
  Partial: 'bg-orange-100 text-orange-800',
  Overdue: 'bg-red-100 text-red-800',
  Pending: 'bg-yellow-100 text-yellow-800',
}

export default function FeesPage() {
  const [records, setRecords] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [typeFilter, setTypeFilter] = useState('All')
  const [currentPage, setCurrentPage] = useState(1)
  const [showModal, setShowModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentRecord, setPaymentRecord] = useState(null)
  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('Online')
  const itemsPerPage = 8

  useEffect(() => {
    loadData()
    window.addEventListener('storage', loadData)
    return () => window.removeEventListener('storage', loadData)
  }, [])

  const loadData = () => {
    setRecords(getFeeRecords())
  }

  const initialForm = {
    studentId: '', studentName: '', department: 'Computer Science', semester: '1',
    feeType: 'Tuition', amount: '', dueDate: ''
  }
  const [formData, setFormData] = useState(initialForm)
  const [formErrors, setFormErrors] = useState({})

  const stats = useMemo(() => getFeeStats(records), [records])
  const feeTypes = [...new Set(records.map(r => r.feeType))]

  const filtered = records.filter(r => {
    const matchesSearch = r.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         r.studentId.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         r.id.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'All' || r.status === statusFilter
    const matchesType = typeFilter === 'All' || r.feeType === typeFilter
    return matchesSearch && matchesStatus && matchesType
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
    if (!formData.amount || parseFloat(formData.amount) <= 0) errors.amount = 'Valid amount required'
    if (!formData.dueDate) errors.dueDate = 'Due date required'
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!validateForm()) return
    const newRecord = {
      id: `FEE-${String(records.length + 1).padStart(3, '0')}`,
      studentId: formData.studentId,
      studentName: formData.studentName,
      department: formData.department,
      semester: formData.semester,
      feeType: formData.feeType,
      amount: parseFloat(formData.amount),
      paid: 0,
      due: parseFloat(formData.amount),
      dueDate: formData.dueDate,
      paidDate: null,
      status: 'Pending',
      method: null,
      transactionId: null,
    }
    addFeeRecordToService(newRecord)
    setShowModal(false)
    setFormData(initialForm)
    setCurrentPage(1)
  }

  const openPayment = (record) => {
    setPaymentRecord(record)
    setPaymentAmount(String(record.due))
    setPaymentMethod('Online')
    setShowPaymentModal(true)
  }

  const handlePayment = (e) => {
    e.preventDefault()
    const amount = parseFloat(paymentAmount)
    if (!amount || amount <= 0 || amount > paymentRecord.due) return

    const newPaid = paymentRecord.paid + amount
    const newDue = paymentRecord.amount - newPaid
    const newStatus = newDue <= 0 ? 'Paid' : 'Partial'

    updateFeeRecordInService(paymentRecord.id, {
      paid: newPaid,
      due: newDue,
      status: newStatus,
      paidDate: new Date().toISOString().split('T')[0],
      method: paymentMethod,
      transactionId: `TXN${Date.now().toString().slice(-6)}`
    })
    
    setShowPaymentModal(false)
  }

  const handleSendReminder = (record) => {
    alert(`Fee reminder sent to ${record.studentName} (${record.studentId}) for ₹${record.due.toLocaleString('en-IN')}`)
  }

  const handleDelete = (id) => {
    if (confirm('Delete this fee record?')) {
      const existing = getFeeRecords()
      const updated = existing.filter(r => r.id !== id)
      localStorage.setItem('fee_records', JSON.stringify(updated))
      loadData()
    }
  }

  const formatCurrency = (val) => `₹${val.toLocaleString('en-IN')}`
  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'

  // Helper to persist fee records to service
  const addFeeRecordToService = (feeRecord) => {
    const existing = getFeeRecords()
    const updated = [feeRecord, ...existing]
    localStorage.setItem('fee_records', JSON.stringify(updated))
    loadData()
  }

  // Helper to update fee record in service
  const updateFeeRecordInService = (id, updates) => {
    updateFeeRecord(id, updates)
    loadData()
  }

  return (
    <Layout title="Fees">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Fee Management</h1>
          <p className="text-slate-500 mt-1">Track student fee payments, dues, and generate receipts.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-all shadow-sm">
            <span className="material-symbols-outlined text-lg">download</span>Export Report
          </button>
          <button onClick={() => { setShowModal(true); setFormErrors({}) }}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#1162d4] text-white rounded-lg text-sm font-semibold hover:bg-[#1162d4]/90 transition-colors shadow-sm">
            <span className="material-symbols-outlined text-lg">add</span>Add Fee Record
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon="account_balance" label="Total Fees" value={formatCurrency(stats.totalAmount)} color="blue" />
        <StatCard icon="payments" label="Collected" value={formatCurrency(stats.totalCollected)} color="green" />
        <StatCard icon="warning" label="Outstanding" value={formatCurrency(stats.totalDue)} color="orange" />
        <StatCard icon="error" label="Overdue" value={stats.overdue} color="red" trend={`of ${stats.total} records`} />
      </div>

      {/* Collection Progress */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 mb-6 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold text-slate-700">Collection Progress</p>
          <p className="text-sm font-bold text-[#1162d4]">{stats.totalAmount > 0 ? Math.round((stats.totalCollected / stats.totalAmount) * 100) : 0}%</p>
        </div>
        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full rounded-full bg-[#1162d4] transition-all duration-700"
            style={{ width: `${stats.totalAmount > 0 ? (stats.totalCollected / stats.totalAmount) * 100 : 0}%` }} />
        </div>
        <div className="flex items-center gap-6 mt-3">
          <span className="flex items-center gap-2 text-xs text-slate-500"><span className="w-2 h-2 rounded-full bg-[#1162d4]" />Collected</span>
          <span className="flex items-center gap-2 text-xs text-slate-500"><span className="w-2 h-2 rounded-full bg-slate-200" />Remaining</span>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col lg:flex-row items-center gap-4 mb-6">
        <div className="relative flex-1 group w-full lg:w-auto">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#1162d4] text-[20px] transition-colors">search</span>
          <input type="text" placeholder="Search by student name, ID, or fee ID..."
            className="w-full bg-white border border-slate-200 rounded-lg pl-11 pr-5 py-2.5 text-sm focus:ring-2 focus:ring-[#1162d4]/20 focus:border-[#1162d4] outline-none transition-all placeholder:text-slate-400 shadow-sm"
            value={searchQuery} onChange={(e) => handleSearch(e.target.value)} />
        </div>
        <div className="flex items-center gap-3 w-full lg:w-auto">
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1) }}
            className="h-10 px-4 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-600 shadow-sm focus:ring-2 focus:ring-[#1162d4]/20 focus:border-[#1162d4] outline-none">
            <option value="All">All Status</option>
            <option>Paid</option><option>Partial</option><option>Pending</option><option>Overdue</option>
          </select>
          <select value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setCurrentPage(1) }}
            className="h-10 px-4 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-600 shadow-sm focus:ring-2 focus:ring-[#1162d4]/20 focus:border-[#1162d4] outline-none">
            <option value="All">All Types</option>
            {feeTypes.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wider border-b border-slate-200">
              <th className="px-6 py-4">Student</th>
              <th className="px-6 py-4">Fee Type</th>
              <th className="px-6 py-4">Amount</th>
              <th className="px-6 py-4">Paid</th>
              <th className="px-6 py-4">Due</th>
              <th className="px-6 py-4">Due Date</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-10 py-20 text-center text-slate-400">
                  <span className="material-symbols-outlined text-5xl mb-3 opacity-10 text-slate-900">receipt_long</span>
                  <p className="text-sm font-bold text-slate-500">No fee records found</p>
                </td>
              </tr>
            ) : paginated.map((r) => (
              <tr key={r.id} className="hover:bg-slate-50 transition-colors cursor-pointer"
                onClick={() => { setSelectedRecord(r); setShowDetailModal(true) }}>
                <td className="px-6 py-4">
                  <p className="text-sm font-semibold text-slate-900">{r.studentName}</p>
                  <p className="text-xs text-slate-500">{r.studentId} • {r.department}</p>
                </td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">{r.feeType}</span>
                </td>
                <td className="px-6 py-4 text-sm font-semibold text-slate-900">{formatCurrency(r.amount)}</td>
                <td className="px-6 py-4 text-sm font-medium text-green-600">{formatCurrency(r.paid)}</td>
                <td className="px-6 py-4 text-sm font-medium text-red-600">{r.due > 0 ? formatCurrency(r.due) : '—'}</td>
                <td className="px-6 py-4 text-sm text-slate-600">{formatDate(r.dueDate)}</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyles[r.status] || 'bg-slate-100 text-slate-700'}`}>{r.status}</span>
                </td>
                <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-end gap-1">
                    {r.due > 0 && (
                      <button onClick={() => openPayment(r)}
                        className="p-1.5 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="Record Payment">
                        <span className="material-symbols-outlined text-lg">payments</span>
                      </button>
                    )}
                    {(r.status === 'Overdue' || r.status === 'Pending') && (
                      <button onClick={() => handleSendReminder(r)}
                        className="p-1.5 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors" title="Send Reminder">
                        <span className="material-symbols-outlined text-lg">notifications</span>
                      </button>
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

      {/* Add Fee Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col border border-slate-200">
            <div className="px-8 py-5 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-3">
                <div className="p-2 bg-[#1162d4]/10 rounded-lg"><span className="material-symbols-outlined text-[#1162d4]">payments</span></div>
                Add Fee Record
              </h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors">
                <span className="material-symbols-outlined">close</span></button>
            </div>
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {[
                  { label: 'Student ID', name: 'studentId', type: 'text', placeholder: 'STU-2025-XXXX' },
                  { label: 'Student Name', name: 'studentName', type: 'text', placeholder: 'Full name' },
                ].map(f => (
                  <div key={f.name} className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{f.label} <span className="text-red-500">*</span></label>
                    <input type={f.type} name={f.name} value={formData[f.name]} onChange={handleChange} placeholder={f.placeholder}
                      className={`w-full px-4 py-2.5 rounded-lg border ${formErrors[f.name] ? 'border-red-400' : 'border-slate-200 focus:border-[#1162d4]'} focus:ring-2 focus:ring-[#1162d4]/20 outline-none transition-all text-sm text-slate-700`} />
                    {formErrors[f.name] && <p className="text-xs text-red-500 font-medium">{formErrors[f.name]}</p>}
                  </div>
                ))}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Department</label>
                  <select name="department" value={formData.department} onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:border-[#1162d4] focus:ring-2 focus:ring-[#1162d4]/20 outline-none text-sm text-slate-700 bg-white">
                    {['Computer Science', 'Electronics', 'Mechanical', 'Civil', 'IT'].map(d => <option key={d}>{d}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Semester</label>
                  <select name="semester" value={formData.semester} onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:border-[#1162d4] focus:ring-2 focus:ring-[#1162d4]/20 outline-none text-sm text-slate-700 bg-white">
                    {['1','2','3','4','5','6','7','8'].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Fee Type</label>
                  <select name="feeType" value={formData.feeType} onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:border-[#1162d4] focus:ring-2 focus:ring-[#1162d4]/20 outline-none text-sm text-slate-700 bg-white">
                    {['Tuition', 'Hostel', 'Lab', 'Examination', 'Transport', 'Library'].map(t => <option key={t}>{t}</option>)}
                  </select>
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
                  className="px-6 py-2.5 text-sm font-semibold text-white bg-[#1162d4] rounded-lg hover:bg-[#1162d4]/90 shadow-sm">Add Record</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && paymentRecord && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md border border-slate-200">
            <div className="px-8 py-5 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg"><span className="material-symbols-outlined text-green-600">payments</span></div>
                Record Payment
              </h2>
              <button onClick={() => setShowPaymentModal(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400">
                <span className="material-symbols-outlined">close</span></button>
            </div>
            <form onSubmit={handlePayment} className="p-8">
              <div className="bg-slate-50 rounded-lg p-4 mb-6 border border-slate-200">
                <p className="text-sm font-semibold text-slate-900">{paymentRecord.studentName}</p>
                <p className="text-xs text-slate-500">{paymentRecord.id} • Due: {formatCurrency(paymentRecord.due)}</p>
              </div>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Payment Amount (₹)</label>
                  <input type="number" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} max={paymentRecord.due}
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:border-[#1162d4] focus:ring-2 focus:ring-[#1162d4]/20 outline-none text-sm text-slate-700" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Payment Method</label>
                  <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:border-[#1162d4] focus:ring-2 focus:ring-[#1162d4]/20 outline-none text-sm text-slate-700 bg-white">
                    <option>Online</option><option>Bank Transfer</option><option>Cash</option><option>Cheque</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 mt-6">
                <button type="button" onClick={() => setShowPaymentModal(false)}
                  className="px-5 py-2.5 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50">Cancel</button>
                <button type="submit"
                  className="px-6 py-2.5 text-sm font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700 shadow-sm">Confirm Payment</button>
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
              <h2 className="text-xl font-bold text-slate-900">Fee Details</h2>
              <button onClick={() => setShowDetailModal(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400">
                <span className="material-symbols-outlined">close</span></button>
            </div>
            <div className="flex-1 overflow-y-auto p-8 space-y-4">
              {[
                ['Fee ID', selectedRecord.id],
                ['Student', `${selectedRecord.studentName} (${selectedRecord.studentId})`],
                ['Department', selectedRecord.department],
                ['Semester', selectedRecord.semester],
                ['Fee Type', selectedRecord.feeType],
                ['Amount', formatCurrency(selectedRecord.amount)],
                ['Paid', formatCurrency(selectedRecord.paid)],
                ['Due', selectedRecord.due > 0 ? formatCurrency(selectedRecord.due) : '—'],
                ['Due Date', formatDate(selectedRecord.dueDate)],
                ['Paid Date', formatDate(selectedRecord.paidDate)],
                ['Method', selectedRecord.method || '—'],
                ['Transaction ID', selectedRecord.transactionId || '—'],
                ['Status', selectedRecord.status],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between items-center py-2 border-b border-slate-100">
                  <span className="text-sm text-slate-500">{label}</span>
                  <span className="text-sm font-semibold text-slate-900">{value}</span>
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
    </Layout>
  )
}
