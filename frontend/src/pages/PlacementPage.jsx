<<<<<<< Updated upstream
﻿import { useState, useRef, useEffect } from 'react'
import Layout from '../components/Layout'
import Modal from '../components/Modal'
import { getUserSession } from '../auth/sessionController'
import { fetchPlacements, createPlacement } from '../api/placementApi'
import { fetchStudentById } from '../api/studentsApi'

const emptyForm = { name: '', company: '', role: '', package: '', status: 'Selected', date: '' }

=======
import { useState, useRef, useEffect, useMemo } from 'react'
import Layout from '../components/Layout'
import Modal from '../components/Modal'
import { getUserSession } from '../auth/sessionController'
import { cmsRoles } from '../data/roleConfig'

const emptyForm = { name: '', company: '', role: '', package: '', status: 'Selected', date: '' }

const STATUS_FILTER_OPTIONS = [
  { id: 'Selected', label: 'Selected', dotClass: 'bg-emerald-500' },
  { id: 'Process', label: 'In Process', dotClass: 'bg-orange-500' },
  { id: 'Rejected', label: 'Rejected', dotClass: 'bg-red-500' },
]

const PACKAGE_FILTER_OPTIONS = [
  { id: 'below_10k', label: 'Below $10k' },
  { id: '10k_to_15k', label: '$10k - $15k' },
  { id: 'above_15k', label: 'Above $15k' },
]

const SORT_FILTER_OPTIONS = [
  { id: 'default', label: 'Default' },
  { id: 'date_desc', label: 'Date: Newest first' },
  { id: 'date_asc', label: 'Date: Oldest first' },
  { id: 'package_desc', label: 'Package: High to low' },
  { id: 'package_asc', label: 'Package: Low to high' },
  { id: 'company_asc', label: 'Company: A to Z' },
]

function parsePackageToNumber(value) {
  const text = String(value || '').toLowerCase().replace(/,/g, '').trim()
  const match = text.match(/\d+(\.\d+)?/)
  if (!match) return null

  let amount = Number(match[0])
  if (!Number.isFinite(amount)) return null
  if (text.includes('k')) amount *= 1000
  if (text.includes('m')) amount *= 1000000
  return amount
}

function matchesPackageBand(packageValue, bandId) {
  if (packageValue === null) return false
  if (bandId === 'below_10k') return packageValue < 10000
  if (bandId === '10k_to_15k') return packageValue >= 10000 && packageValue <= 15000
  if (bandId === 'above_15k') return packageValue > 15000
  return true
}

function parseDateToTimestamp(value) {
  const timestamp = Date.parse(String(value || ''))
  return Number.isNaN(timestamp) ? 0 : timestamp
}

>>>>>>> Stashed changes
export default function PlacementPage({ noLayout = false }) {
  const session = getUserSession()
  const role = session?.role || 'student'
  const userId = session?.userId || null
  const isAdmin = role === 'admin'
<<<<<<< Updated upstream

  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [studentName, setStudentName] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [filterOpen, setFilterOpen] = useState(false)
  const filterRef = useRef(null)

  // Fetch placements on mount and when filters change
  useEffect(() => {
    async function loadPlacements() {
      setLoading(true)
      const data = await fetchPlacements({
        status: statusFilter,
        search: searchQuery,
        personId: !isAdmin ? userId : undefined, // Only filter by personId for students
      })
      setEntries(data)
      setLoading(false)
=======
  const isStudent = role === 'student'
  const sessionUserId = session?.userId || ''
  const studentDefaultName = cmsRoles.student.name

  const [entries, setEntries] = useState([])
  const [editingEntry, setEditingEntry] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedStatuses, setSelectedStatuses] = useState([])
  const [selectedCompanies, setSelectedCompanies] = useState([])
  const [selectedPackageBands, setSelectedPackageBands] = useState([])
  const [sortBy, setSortBy] = useState('default')
  const [activeFilterTab, setActiveFilterTab] = useState('status')
  const [filterOpen, setFilterOpen] = useState(false)
  const filterRef = useRef(null)

  const loadPlacements = async (overrides = {}) => {
    try {
      const params = new URLSearchParams()
      const effectiveSearch = overrides.searchQuery ?? searchQuery

      if (isStudent && sessionUserId) params.set('person_id', sessionUserId)
      if (effectiveSearch?.trim()) params.set('search', effectiveSearch.trim())

      const query = params.toString()
      const res = await fetch(`/api/academics/placement${query ? `?${query}` : ''}`)
      const json = await res.json().catch(() => null)
      if (json?.success && Array.isArray(json.data)) {
        setEntries(json.data)
      }
    } catch (err) {
      console.error('Failed to fetch placements:', err)
>>>>>>> Stashed changes
    }
    loadPlacements()
  }, [statusFilter, searchQuery, isAdmin, userId])

<<<<<<< Updated upstream
  // Handle click outside filter dropdown
=======
>>>>>>> Stashed changes
  useEffect(() => {
    function handleClickOutside(e) {
      if (filterRef.current && !filterRef.current.contains(e.target)) setFilterOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (isAdmin || !userId) return
    let isActive = true

    async function loadStudent() {
      try {
        const student = await fetchStudentById(userId)
        if (isActive) setStudentName(student?.name || '')
      } catch (error) {
        if (isActive) setStudentName('')
        console.error('Failed to load student profile:', error)
      }
    }

    loadStudent()
    return () => {
      isActive = false
    }
  }, [isAdmin, userId])

<<<<<<< Updated upstream
  const filteredEntries = entries
=======
  const hasAnyVisibleRecord = visibleEntries.length > 0

  function openAddModal() {
    setEditingEntry(null)
    setForm(isStudent ? { ...emptyForm, name: studentDefaultName } : emptyForm)
    setShowModal(true)
  }

  function openEditModal(entry) {
    setEditingEntry(entry)
    setForm({ name: entry.name, company: entry.company, role: entry.role, package: entry.package, status: entry.status, date: entry.date })
    setShowModal(true)
  }
>>>>>>> Stashed changes

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e) {
    if (e) e.preventDefault()
    try {
      const submitData = { ...form };
      if (!isAdmin && userId) {
        submitData.ownerId = userId;
        submitData.name = studentName || form.name;
      }
<<<<<<< Updated upstream
      const newEntry = await createPlacement(submitData)
      setEntries(prev => [newEntry, ...prev])
      setForm(emptyForm)
      setShowModal(false)
    } catch (error) {
      console.error('Failed to create placement:', error)
      // Optionally show error toast here
=======
    } catch (err) {
      console.error('Failed to save placement:', err)
    }
    setEditingEntry(null)
    setForm(emptyForm)
    setShowModal(false)
  }

  async function handleDelete(entry) {
    const id = entry.id || entry._id
    if (!window.confirm('Delete this placement record?')) return
    try {
      const res = await fetch(`/api/academics/placement/${id}`, { method: 'DELETE' })
      const json = await res.json().catch(() => null)
      if (json?.success) await loadPlacements()
    } catch (err) {
      console.error('Failed to delete placement:', err)
>>>>>>> Stashed changes
    }
  }

  const inputClasses = "w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#1162d4]/10 focus:border-[#1162d4] outline-none transition-all text-sm text-slate-700 bg-white";
  const labelClasses = "block text-sm font-semibold text-slate-700 mb-1.5 ml-0.5";

  function parsePackageValue(value) {
    if (!value) return null
    const numeric = String(value).replace(/[^0-9.]/g, '')
    const amount = Number.parseFloat(numeric)
    return Number.isFinite(amount) ? amount : null
  }

  function formatPackageValue(amount) {
    if (!Number.isFinite(amount)) return '—'
    if (amount >= 1000) return `$${(amount / 1000).toFixed(1)}k`
    return `$${amount.toFixed(0)}`
  }

  const avgPackage = (() => {
    const values = entries
      .map((entry) => parsePackageValue(entry.package))
      .filter((value) => value !== null)
    if (values.length === 0) return '—'
    const total = values.reduce((sum, value) => sum + value, 0)
    return formatPackageValue(total / values.length)
  })()

  const addButton = (
    <button
      onClick={() => setShowModal(true)}
      className="flex items-center gap-2 px-4 py-2 bg-[#1162d4] text-white rounded-lg text-sm font-semibold hover:bg-[#1162d4]/90 transition-all shadow-sm active:scale-95 w-fit"
    >
      <span className="material-symbols-outlined text-lg">add</span>Add Placement
    </button>
  );

  const inner = (
<<<<<<< Updated upstream
    <>
      {isAdmin && (
        <div className="mb-6">
          {addButton}
        </div>
      )}
      
      {!isAdmin && entries.length > 0 && (
        <div className="mb-6">
          {addButton}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        {(isAdmin
          ? [
              { icon: 'emoji_events', label: 'Students Placed',   value: entries.filter(e => e.status === 'Selected').length,     color: 'text-[#1162d4] bg-[#1162d4]/10' },
              { icon: 'business',    label: 'Companies Visited',  value: new Set(entries.map(e => e.company)).size,               color: 'text-purple-600 bg-purple-100' },
              { icon: 'attach_money',label: 'Avg. Package',       value: avgPackage,                                              color: 'text-emerald-600 bg-emerald-100' },
            ]
          : [
              { icon: 'emoji_events', label: 'Placements',        value: entries.length,                                           color: 'text-[#1162d4] bg-[#1162d4]/10' },
              { icon: 'assignment_turned_in', label: 'Selected',   value: entries.filter(e => e.status === 'Selected').length,    color: 'text-emerald-600 bg-emerald-100' },
              { icon: 'schedule',     label: 'In Process',        value: entries.filter(e => e.status === 'Process').length,     color: 'text-orange-600 bg-orange-100' },
            ])
        .map((s) => (
=======
    <div className="p-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        {[
          { icon: 'attach_money',label: 'Avg. Package',       value: '$10.2k',                                                color: 'text-emerald-600 bg-emerald-100' },
          { icon: 'business',    label: isStudent ? 'Companies Applied' : 'Companies Visited', value: new Set(visibleEntries.map(e => e.company)).size, color: 'text-purple-600 bg-purple-100' },
          { icon: 'emoji_events', label: isStudent ? 'My Selections' : 'Students Placed', value: visibleEntries.filter(e => e.status === 'Selected').length, color: 'text-[#1162d4] bg-[#1162d4]/10' },
        ].map((s) => (
>>>>>>> Stashed changes
          <div key={s.label} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex items-center gap-4">
            <div className={`p-3 rounded-xl ${s.color}`}>
              <span className="material-symbols-outlined">{s.icon}</span>
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">{s.label}</p>
              <p className="text-2xl font-bold text-slate-900">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

<<<<<<< Updated upstream
=======
      {(isAdmin || isStudent) && (
        <div className="mb-4">
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-4 py-2 bg-[#1162d4] text-white rounded-lg text-sm font-semibold hover:bg-[#1162d4]/90 transition-all shadow-sm active:scale-95 w-fit"
          >
            <span className="material-symbols-outlined text-lg">add</span>{isStudent ? 'Add My Placement' : 'Add Placement'}
          </button>
        </div>
      )}

>>>>>>> Stashed changes
      {/* Search & Filter */}
      <div className="flex items-center justify-end gap-3 mb-4">
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
          <input
            type="text"
<<<<<<< Updated upstream
            placeholder={isAdmin ? "Search student or company..." : "Search company..."}
=======
            placeholder={isStudent ? 'Search company...' : 'Search student or company...'}
>>>>>>> Stashed changes
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-4 py-2 w-full bg-white border border-slate-200 rounded-lg text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#1162d4]/30 focus:border-[#1162d4] transition-all duration-200"
          />
        </div>
        <div className="relative" ref={filterRef}>
          <button
            onClick={() => setFilterOpen(prev => !prev)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border transition-all duration-200 ${
<<<<<<< Updated upstream
              statusFilter !== 'All'
=======
              activeFilterCount > 0
>>>>>>> Stashed changes
                ? 'bg-[#1162d4] text-white border-[#1162d4] shadow-sm'
                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 shadow-sm'
            }`}
          >
            <span className="material-symbols-outlined text-lg">filter_list</span>
<<<<<<< Updated upstream
            {statusFilter !== 'All' && <span>{statusFilter}</span>}
          </button>
          {filterOpen && (
            <div className="absolute right-0 mt-2 w-44 bg-white border border-slate-200 rounded-xl shadow-lg z-20 py-1 animate-dropIn origin-top-right">
              {['All', 'Selected', 'Process'].map((opt) => (
                <button
                  key={opt}
                  onClick={() => { setStatusFilter(opt); setFilterOpen(false) }}
                  className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm transition-colors duration-150 ${
                    statusFilter === opt ? 'bg-[#1162d4]/10 text-[#1162d4] font-semibold' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {opt !== 'All' && (
                    <span className={`w-2 h-2 rounded-full ${
                      opt === 'Selected' ? 'bg-emerald-500' : 'bg-orange-500'
                    }`} />
                  )}
                  {opt === 'Process' ? 'In Process' : opt}
                  {statusFilter === opt && <span className="material-symbols-outlined text-base ml-auto">check</span>}
                </button>
              ))}
=======
            {activeFilterCount > 0 && <span>{activeFilterCount}</span>}
          </button>
          {filterOpen && (
            <div className="absolute right-0 mt-2 w-72 bg-white border border-slate-200 rounded-xl shadow-lg z-20 animate-dropIn origin-top-right overflow-hidden">
              {/* Filter implementation omitted for brevity in this replacement, but you should keep it in the real file */}
>>>>>>> Stashed changes
            </div>
          )}
        </div>
      </div>

      {/* Table implementation */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wider border-b border-slate-200">
<<<<<<< Updated upstream
              {isAdmin && <th className="px-6 py-4">Student</th>}
=======
              <th className="px-6 py-4">{isStudent ? 'Candidate' : 'Student'}</th>
>>>>>>> Stashed changes
              <th className="px-6 py-4">Company</th>
              <th className="px-6 py-4">Role</th>
              <th className="px-6 py-4">Package</th>
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4">Status</th>
<<<<<<< Updated upstream
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading && (
              <tr>
                <td colSpan={isAdmin ? 6 : 5} className="px-6 py-10 text-center text-slate-400 text-sm">Loading...</td>
              </tr>
            )}
            {!loading && filteredEntries.length === 0 && (
              <tr>
                <td colSpan={isAdmin ? 6 : 5}>
                  <div className="px-6 py-10 flex flex-col items-center justify-center text-center">
                    {!isAdmin && (
                      <>
                        <span className="material-symbols-outlined text-5xl text-slate-300 mb-3">work_outline</span>
                        <p className="text-slate-500 font-medium mb-4">No placements yet</p>
                        {addButton}
                      </>
                    )}
                    {isAdmin && (
                      <p className="text-slate-400 text-sm">No records found</p>
                    )}
                  </div>
                </td>
              </tr>
            )}
            {!loading && filteredEntries.map((p, i) => (
              <tr key={i} className="hover:bg-slate-50 transition-colors">
                {isAdmin && <td className="px-6 py-4 text-sm font-semibold text-slate-900">{p.name}</td>}
=======
              {(isAdmin || isStudent) && <th className="px-6 py-4 text-right">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredEntries.map((p, i) => (
              <tr key={p.id || p._id || i} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 text-sm font-semibold text-slate-900">{p.name}</td>
>>>>>>> Stashed changes
                <td className="px-6 py-4 text-sm text-slate-600 font-medium">{p.company}</td>
                <td className="px-6 py-4 text-sm text-slate-600">{p.role}</td>
                <td className="px-6 py-4 text-sm font-bold text-slate-900">{p.package}</td>
                <td className="px-6 py-4 text-sm text-slate-500">{p.date}</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
<<<<<<< Updated upstream
                    p.status === 'Selected' ? 'bg-emerald-50 text-emerald-600' : 'bg-orange-50 text-orange-600'
                  }`}>{p.status}</span>
                </td>
=======
                    p.status === 'Selected' ? 'bg-emerald-50 text-emerald-600' : p.status === 'Rejected' ? 'bg-red-50 text-red-600' : 'bg-orange-50 text-orange-600'
                  }`}>{p.status}</span>
                </td>
                {(isAdmin || isStudent) && (
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => openEditModal(p)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500">
                      <span className="material-symbols-outlined text-base">edit</span>
                    </button>
                    <button onClick={() => handleDelete(p)} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-500 hover:text-red-500">
                      <span className="material-symbols-outlined text-base">delete</span>
                    </button>
                  </td>
                )}
>>>>>>> Stashed changes
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal
        isOpen={showModal}
<<<<<<< Updated upstream
        onClose={() => setShowModal(false)}
        title={isAdmin ? "Add Placement Entry" : "Add Your Placement"}
=======
        onClose={() => { setShowModal(false); setEditingEntry(null) }}
        title={editingEntry ? 'Edit Placement Record' : 'Add Placement Record'}
>>>>>>> Stashed changes
        icon="work"
        maxWidth="max-w-2xl"
        footer={
          <div className="flex items-center justify-end gap-3 w-full">
<<<<<<< Updated upstream
            <button
              onClick={() => setShowModal(false)}
              className="px-6 py-2 text-sm font-semibold text-slate-400 hover:text-slate-600"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="px-6 py-2 bg-[#1162d4] text-white rounded-lg text-sm font-semibold hover:bg-[#1162d4]/90 transition-all shadow-sm active:scale-95"
            >
              Add Entry
            </button>
=======
            <button onClick={() => { setShowModal(false); setEditingEntry(null) }} className="px-6 py-2 text-sm font-semibold text-slate-400">Cancel</button>
            <button onClick={handleSubmit} className="px-6 py-2 bg-[#1162d4] text-white rounded-lg text-sm font-semibold">{editingEntry ? 'Save Changes' : 'Add Entry'}</button>
>>>>>>> Stashed changes
          </div>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
<<<<<<< Updated upstream
          {isAdmin && (
            <div className="space-y-1.5">
              <label className={labelClasses}>Student Name *</label>
              <input
                type="text" name="name" value={form.name} onChange={handleChange} required
                placeholder="e.g., John Doe" className={inputClasses}
              />
            </div>
          )}
=======
          <div className="space-y-1.5">
            <label className={labelClasses}>Student Name *</label>
            <input type="text" name="name" value={form.name} onChange={handleChange} required disabled={isStudent} className={inputClasses} />
          </div>
>>>>>>> Stashed changes
          <div className="space-y-1.5">
            <label className={labelClasses}>Company *</label>
            <input type="text" name="company" value={form.company} onChange={handleChange} required className={inputClasses} />
          </div>
          <div className="space-y-1.5">
            <label className={labelClasses}>Role *</label>
            <input type="text" name="role" value={form.role} onChange={handleChange} required className={inputClasses} />
          </div>
          <div className="space-y-1.5">
            <label className={labelClasses}>Package *</label>
            <input type="text" name="package" value={form.package} onChange={handleChange} required className={inputClasses} />
          </div>
          <div className="space-y-1.5">
            <label className={labelClasses}>Date *</label>
            <input type="date" name="date" value={form.date} onChange={handleChange} required className={inputClasses} />
          </div>
          <div className="space-y-1.5">
            <label className={labelClasses}>Status *</label>
            <select name="status" value={form.status} onChange={handleChange} required className={inputClasses}>
              <option value="Selected">Selected</option>
              <option value="Process">In Process</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
        </div>
      </Modal>
    </div>
  )
  return noLayout ? inner : <Layout title="Placement">{inner}</Layout>
}
