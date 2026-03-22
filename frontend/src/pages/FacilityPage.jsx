import { useState, useRef, useEffect } from 'react'
import Layout from '../components/Layout'
import { getUserSession } from '../auth/sessionController'
import {
  fetchFacilities,
  fetchFacilityBookings,
  createFacilityBooking,
  createFacilityRecord,
} from '../api/facilityApi'

const statusStyle = {
  Available:   'bg-green-100 text-green-800',
  'In Use':    'bg-blue-100 text-blue-800',
  Maintenance: 'bg-red-100 text-red-800',
}

export default function FacilityPage({ noLayout = false }) {
  const session = getUserSession()
  const role = session?.role || 'student'
  const canAddFacility = role === 'admin'
  const canBookFacility = role === 'admin' || role === 'faculty'

  const [facilities, setFacilities] = useState([])
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [apiNotice, setApiNotice] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [filterOpen, setFilterOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [bookingOpen, setBookingOpen] = useState(false)
  const [bookingForm, setBookingForm] = useState({ room: '', date: '', timeFrom: '', timeTo: '', purpose: '' })
  const [bookingSuccess, setBookingSuccess] = useState(false)
  const [addFacilityOpen, setAddFacilityOpen] = useState(false)
  const [addFacilityForm, setAddFacilityForm] = useState({ name: '', type: '', capacity: 30, status: 'Available', amenities: '' })
  const [addFacilitySuccess, setAddFacilitySuccess] = useState(false)
  const filterRef = useRef(null)

  async function loadFacilitiesData({ silent = false } = {}) {
    if (!silent) setLoading(true)
    setApiNotice('')
    try {
      const [facilityRows, bookingRows] = await Promise.all([
        fetchFacilities({ status: statusFilter, search: searchQuery }),
        fetchFacilityBookings(),
      ])
      setFacilities(facilityRows)
      setBookings(bookingRows)
    } catch (err) {
      console.error('Failed to fetch facilities/bookings:', err)
      setFacilities([])
      setBookings([])
      setApiNotice('Failed to load facility data from backend API.')
    } finally {
      if (!silent) setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadFacilitiesData()
  }, [statusFilter, searchQuery])

  const visibleFacilities = canBookFacility || canAddFacility
    ? facilities
    : facilities.filter((facility) => facility.status === 'Available')

  const availableRooms = visibleFacilities.filter((f) => f.status !== 'Maintenance')

  const bookingsByRoom = bookings.reduce((acc, booking) => {
    const room = String(booking?.room || '')
    if (!room) return acc
    if (!acc[room]) acc[room] = []
    acc[room].push(booking)
    return acc
  }, {})

  Object.values(bookingsByRoom).forEach((roomBookings) => {
    roomBookings.sort((a, b) => {
      const aKey = `${a?.date || ''} ${a?.timeFrom || ''}`
      const bKey = `${b?.date || ''} ${b?.timeFrom || ''}`
      return bKey.localeCompare(aKey)
    })
  })

  useEffect(() => {
    function handleClickOutside(e) {
      if (filterRef.current && !filterRef.current.contains(e.target)) setFilterOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const filtered = visibleFacilities

  async function handleBookRoom(e) {
    e.preventDefault()
    setApiNotice('')
    try {
      const created = await createFacilityBooking({ ...bookingForm, requestedBy: session?.userId || '' })
      setBookings((prev) => [created, ...prev])
      setBookingSuccess(true)
      setApiNotice('Room booking saved to backend successfully.')
      setTimeout(() => {
        setBookingOpen(false)
        setBookingSuccess(false)
        setBookingForm({ room: '', date: '', timeFrom: '', timeTo: '', purpose: '' })
      }, 1500)
    } catch (err) {
      console.error('Failed to book room:', err)
      setApiNotice(err?.message || 'Booking failed. Please check backend connection and try again.')
    }
  }

  async function handleAddFacility(e) {
    e.preventDefault()
    setApiNotice('')
    try {
      const amenitiesArray = addFacilityForm.amenities
        .split(',')
        .map(a => a.trim())
        .filter(a => a)

      const payload = {
        name: addFacilityForm.name,
        type: addFacilityForm.type,
        capacity: parseInt(addFacilityForm.capacity),
        status: addFacilityForm.status,
        amenities: amenitiesArray,
      }

      const created = await createFacilityRecord(payload)
      setFacilities(prev => [...prev, created])
      setAddFacilitySuccess(true)
      setApiNotice('Facility record saved to backend successfully.')
      setTimeout(() => {
        setAddFacilityOpen(false)
        setAddFacilitySuccess(false)
        setAddFacilityForm({ name: '', type: '', capacity: 30, status: 'Available', amenities: '' })
      }, 1500)
    } catch (err) {
      console.error('Failed to add facility:', err)
      setApiNotice(err?.message || 'Failed to add facility. Please check backend connection and try again.')
    }
  }

  const inner = (
    <>
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        {(canAddFacility || canBookFacility) && (
          <div className="flex items-center gap-3">
            {canAddFacility && (
              <button
                onClick={() => setAddFacilityOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 transition-colors"
              >
                <span className="material-symbols-outlined text-lg">add_circle</span>Add Facility
              </button>
            )}
            {canBookFacility && (
              <button
                onClick={() => setBookingOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-[#1162d4] text-white rounded-lg text-sm font-semibold hover:bg-[#1162d4]/90 transition-colors"
              >
                <span className="material-symbols-outlined text-lg">add</span>Book Room
              </button>
            )}
          </div>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {[
          { icon: 'meeting_room', label: 'Available',   value: visibleFacilities.filter(f => f.status === 'Available').length, color: 'text-emerald-600 bg-emerald-100' },
          { icon: 'groups',       label: 'In Use',      value: visibleFacilities.filter(f => f.status === 'In Use').length,    color: 'text-blue-600 bg-blue-100' },
          { icon: 'build',        label: 'Maintenance', value: visibleFacilities.filter(f => f.status === 'Maintenance').length, color: 'text-red-600 bg-red-100' },
        ].map((s) => (
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

      {/* Search & Filter — right-aligned like attendance page */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <button
            onClick={() => {
              setRefreshing(true)
              loadFacilitiesData({ silent: true })
            }}
            disabled={loading || refreshing}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border bg-white text-slate-600 border-slate-200 hover:border-slate-300 shadow-sm disabled:opacity-60"
          >
            <span className="material-symbols-outlined text-lg">refresh</span>
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
            <input
              type="text"
              placeholder="Search by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 w-56 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#1162d4]/30 focus:border-[#1162d4] transition-all duration-200"
            />
          </div>

          <div className="relative" ref={filterRef}>
            <button
              onClick={() => setFilterOpen(prev => !prev)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border transition-all duration-200 ${
                statusFilter !== 'All'
                  ? 'bg-[#1162d4] text-white border-[#1162d4] shadow-sm'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 shadow-sm'
              }`}
            >
              <span className="material-symbols-outlined text-lg">filter_list</span>
              {statusFilter !== 'All' && <span>{statusFilter}</span>}
            </button>

            {filterOpen && (
              <div className="absolute right-0 mt-2 w-44 bg-white border border-slate-200 rounded-xl shadow-lg z-20 py-1 animate-dropIn origin-top-right">
                {['All', 'Available', 'In Use', 'Maintenance'].map((opt) => (
                  <button
                    key={opt}
                    onClick={() => { setStatusFilter(opt); setFilterOpen(false) }}
                    className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm transition-colors duration-150 ${
                      statusFilter === opt
                        ? 'bg-[#1162d4]/10 text-[#1162d4] font-semibold'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {opt !== 'All' && (
                      <span className={`w-2 h-2 rounded-full ${
                        opt === 'Available' ? 'bg-green-500' : opt === 'In Use' ? 'bg-blue-500' : 'bg-red-500'
                      }`} />
                    )}
                    {opt}
                    {statusFilter === opt && (
                      <span className="material-symbols-outlined text-base ml-auto">check</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {apiNotice && (
        <div className={`mb-4 px-4 py-2.5 rounded-lg text-xs font-semibold border ${
          apiNotice.toLowerCase().includes('failed')
            ? 'bg-red-50 text-red-700 border-red-200'
            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
        }`}>
          {apiNotice}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {loading && (
          <div className="col-span-full text-center text-slate-400 text-sm py-10">Loading facilities...</div>
        )}
        {!loading && filtered.length === 0 && (
          <div className="col-span-full text-center text-slate-400 text-sm py-10">No facilities found</div>
        )}
        {!loading && filtered.map((f, i) => (
          <div key={f.name} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex flex-col gap-3 animate-fadeIn" style={{ animationDelay: `${i * 50}ms` }}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-bold text-slate-900">{f.name}</p>
                <p className="text-xs text-slate-500">{f.type}</p>
              </div>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyle[f.status]}`}>{f.status}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="material-symbols-outlined text-sm text-slate-400">people</span>
              Capacity: <span className="font-semibold text-slate-700">{f.capacity}</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {f.amenities.map((a) => (
                <span key={a} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[11px] font-medium">{a}</span>
              ))}
            </div>

            {(() => {
              const roomBookings = bookingsByRoom[f.name] || []
              if (roomBookings.length === 0) return null

              return (
                <div className="pt-2 border-t border-slate-100">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Booked Slots</p>
                  <div className="space-y-1.5">
                    {roomBookings.slice(0, 3).map((booking) => (
                      <div key={booking.id || `${booking.date}-${booking.timeFrom}-${booking.timeTo}`} className="text-xs text-slate-600 bg-blue-50 border border-blue-100 rounded-md px-2 py-1.5">
                        <span className="font-semibold text-blue-700">{booking.date}</span>
                        <span>{`  ${booking.timeFrom} - ${booking.timeTo}`}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })()}
          </div>
        ))}
      </div>

      {/* Book Room Modal */}
      {canBookFacility && bookingOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm" onClick={() => setBookingOpen(false)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            {bookingSuccess ? (
              <div className="p-8 text-center">
                <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="material-symbols-outlined text-3xl text-green-600">check_circle</span>
                </div>
                <h3 className="text-lg font-bold text-slate-900">Room Booked!</h3>
                <p className="text-sm text-slate-500 mt-1">Your booking has been confirmed.</p>
              </div>
            ) : (
              <>
                <div className="p-6 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-[#1162d4]/10 rounded-lg">
                      <span className="material-symbols-outlined text-[#1162d4]">meeting_room</span>
                    </div>
                    <h3 className="text-xl font-bold text-slate-900">Book a Room</h3>
                  </div>
                  <button onClick={() => setBookingOpen(false)} className="p-1 hover:bg-slate-100 rounded-full transition-colors">
                    <span className="material-symbols-outlined text-slate-400">close</span>
                  </button>
                </div>
                <form onSubmit={handleBookRoom} className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2 flex flex-col gap-2">
                      <label className="text-sm font-semibold text-slate-700">Room <span className="text-red-500">*</span></label>
                      <select
                        required
                        value={bookingForm.room}
                        onChange={e => setBookingForm({ ...bookingForm, room: e.target.value })}
                        className="px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#1162d4]/20 focus:border-[#1162d4] outline-none transition-colors"
                      >
                        <option value="">Select a room</option>
                        {availableRooms.map(r => (
                          <option key={r.name} value={r.name}>{r.name} — {r.type} (Cap: {r.capacity})</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-semibold text-slate-700">Date <span className="text-red-500">*</span></label>
                      <input
                        type="date"
                        required
                        value={bookingForm.date}
                        onChange={e => setBookingForm({ ...bookingForm, date: e.target.value })}
                        className="px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#1162d4]/20 focus:border-[#1162d4] outline-none transition-colors"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-semibold text-slate-700">Purpose <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Guest Lecture, Lab Session"
                        value={bookingForm.purpose}
                        onChange={e => setBookingForm({ ...bookingForm, purpose: e.target.value })}
                        className="px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#1162d4]/20 focus:border-[#1162d4] outline-none transition-colors"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-semibold text-slate-700">From <span className="text-red-500">*</span></label>
                      <input
                        type="time"
                        required
                        value={bookingForm.timeFrom}
                        onChange={e => setBookingForm({ ...bookingForm, timeFrom: e.target.value })}
                        className="px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#1162d4]/20 focus:border-[#1162d4] outline-none transition-colors"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-semibold text-slate-700">To <span className="text-red-500">*</span></label>
                      <input
                        type="time"
                        required
                        value={bookingForm.timeTo}
                        onChange={e => setBookingForm({ ...bookingForm, timeTo: e.target.value })}
                        className="px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#1162d4]/20 focus:border-[#1162d4] outline-none transition-colors"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-3 mt-6 pt-6 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={() => setBookingOpen(false)}
                      className="flex-1 px-4 py-2.5 border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-4 py-2.5 bg-[#1162d4] text-white rounded-lg text-sm font-semibold hover:bg-[#1162d4]/90 transition-colors"
                    >
                      Confirm Booking
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      {/* Add Facility Modal */}
      {canAddFacility && addFacilityOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm" onClick={() => setAddFacilityOpen(false)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl md:min-h-[31rem] max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            {addFacilitySuccess ? (
              <div className="p-8 text-center">
                <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="material-symbols-outlined text-3xl text-green-600">check_circle</span>
                </div>
                <h3 className="text-lg font-bold text-slate-900">Facility Added!</h3>
                <p className="text-sm text-slate-500 mt-1">Your new facility has been created successfully.</p>
              </div>
            ) : (
              <>
                <div className="p-6 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-600/10 rounded-lg">
                      <span className="material-symbols-outlined text-green-600">add_circle</span>
                    </div>
                    <h3 className="text-xl font-bold text-slate-900">Add New Facility</h3>
                  </div>
                  <button onClick={() => setAddFacilityOpen(false)} className="p-1 hover:bg-slate-100 rounded-full transition-colors">
                    <span className="material-symbols-outlined text-slate-400">close</span>
                  </button>
                </div>
                <form onSubmit={handleAddFacility} className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2 flex flex-col gap-2">
                      <label className="text-sm font-semibold text-slate-700">Facility Name <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Computer Lab 1, Hall B"
                        value={addFacilityForm.name}
                        onChange={e => setAddFacilityForm({ ...addFacilityForm, name: e.target.value })}
                        className="px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-green-600/20 focus:border-green-600 outline-none transition-colors"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-semibold text-slate-700">Type <span className="text-red-500">*</span></label>
                      <select
                        required
                        value={addFacilityForm.type}
                        onChange={e => setAddFacilityForm({ ...addFacilityForm, type: e.target.value })}
                        className="px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-green-600/20 focus:border-green-600 outline-none transition-colors"
                      >
                        <option value="">Select Type</option>
                        <option value="Classroom">Classroom</option>
                        <option value="Lecture Hall">Lecture Hall</option>
                        <option value="Laboratory">Laboratory</option>
                        <option value="Seminar">Seminar</option>
                        <option value="Conference Room">Conference Room</option>
                        <option value="Auditorium">Auditorium</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-semibold text-slate-700">Capacity <span className="text-red-500">*</span></label>
                      <input
                        type="number"
                        required
                        min="1"
                        value={addFacilityForm.capacity}
                        onChange={e => setAddFacilityForm({ ...addFacilityForm, capacity: e.target.value })}
                        className="px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-green-600/20 focus:border-green-600 outline-none transition-colors"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-semibold text-slate-700">Status</label>
                      <select
                        value={addFacilityForm.status}
                        onChange={e => setAddFacilityForm({ ...addFacilityForm, status: e.target.value })}
                        className="px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-green-600/20 focus:border-green-600 outline-none transition-colors"
                      >
                        <option value="Available">Available</option>
                        <option value="In Use">In Use</option>
                        <option value="Maintenance">Maintenance</option>
                      </select>
                    </div>
                    <div className="md:col-span-2 flex flex-col gap-2">
                      <label className="text-sm font-semibold text-slate-700">Amenities <span className="text-slate-500 text-xs font-normal">(comma-separated)</span></label>
                      <input
                        type="text"
                        placeholder="e.g. AC, Projector, Wi-Fi, CCTV"
                        value={addFacilityForm.amenities}
                        onChange={e => setAddFacilityForm({ ...addFacilityForm, amenities: e.target.value })}
                        className="px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-green-600/20 focus:border-green-600 outline-none transition-colors"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-3 mt-6 pt-6 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={() => setAddFacilityOpen(false)}
                      className="flex-1 px-4 py-2.5 border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 transition-colors"
                    >
                      Add Facility
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
  return noLayout ? inner : <Layout title="Facility">{inner}</Layout>
}
