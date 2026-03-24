import { useState, useRef, useEffect } from 'react'
import Layout from '../components/Layout'
import { getUserSession } from '../auth/sessionController'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'

const FALLBACK_WEEKLY = [
  { day: 'Mon', attendance: 92 },
  { day: 'Tue', attendance: 88 },
  { day: 'Wed', attendance: 90 },
  { day: 'Thu', attendance: 86 },
  { day: 'Fri', attendance: 94 },
]

// ─── Attendance helpers ──────────────────────────────────────────────────────
const REQUIRED_PCT = 75

const ATTENDANCE_RANGE_OPTIONS = [
  { id: 'below_75', label: 'Below 75%' },
  { id: '75_to_85', label: '75% - 84.9%' },
  { id: '85_and_above', label: '85% and above' },
]

function calcPct(present, total) {
  if (!total) return 0
  return Number(((present / total) * 100).toFixed(1))
}

function getRiskStatus(pct) {
  if (pct >= 85) return 'Good'
  if (pct >= 75) return 'At Risk'
  return 'Critical'
}

function getEligibilityStatus(pct) {
  return pct >= REQUIRED_PCT ? 'Eligible for Exams' : 'Low Attendance'
}

function classesNeeded(present, total) {
  return Math.max(0, Math.ceil((0.75 * total - present) / 0.25))
}

function safeClasses(present, total) {
  return Math.max(0, Math.floor(present / 0.75 - total))
}

function normalizeId(v) {
  return String(v || '').replace('#', '').trim().toUpperCase()
}

function isInAttendanceRange(pct, rangeId) {
  if (rangeId === 'below_75') return pct < 75
  if (rangeId === '75_to_85') return pct >= 75 && pct < 85
  if (rangeId === '85_and_above') return pct >= 85
  return true
}
// ────────────────────────────────────────────────────────────────────────────

const FALLBACK_STUDENTS = [
  { name: 'John Anderson',  id: '#STU-2024-1547', course: 'Data Structures',   present: 22, total: 24 },
  { name: 'Alice Smith',    id: '#STU-2024-042',  course: 'Discrete Math',     present: 23, total: 24 },
  { name: 'Michael Ross',   id: '#STU-2024-118',  course: 'Database Systems',   present: 18, total: 24 },
  { name: 'Elena Lopez',    id: '#STU-2024-089',  course: 'Tech Writing',       present: 20, total: 24 },
  { name: 'David Kim',      id: '#STU-2024-203',  course: 'Operating Systems',  present: 21, total: 24 },
]

const FALLBACK_STAFF = [
  { name: 'Dr. Rajesh Iyer',     id: '#FAC-204',      department: 'Computer Science',       present: 18, total: 20 },
  { name: 'Lydia Brooks',        id: '#FIN-880',      department: 'Finance Office',          present: 19, total: 20 },
  { name: 'Prof. James Carter',  id: '#STF-2024-002', department: 'Mathematics',             present: 17, total: 20 },
  { name: 'Ms. Sandra Lee',      id: '#STF-2024-003', department: 'English & Tech Writing',  present: 15, total: 20 },
  { name: 'Mr. Robert Hughes',   id: '#STF-2024-004', department: 'Database Systems',        present: 19, total: 20 },
  { name: 'Dr. Fatima Noor',     id: '#STF-2024-005', department: 'Operating Systems',       present: 14, total: 20 },
]

const STAFF_MARK_HOURS = ['Hour 1', 'Hour 2', 'Hour 3', 'Hour 4', 'Hour 5', 'Hour 6', 'Hour 7', 'Hour 8']
const MARK_ATTENDANCE_STORAGE_KEY = 'cms:attendance:hourly'
const STUDENT_DAILY_LOOKBACK_DAYS = 15
const WEEK_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
const HOUR_SLOT_TIMINGS = {
  'Hour 1': '09:00 AM - 09:50 AM',
  'Hour 2': '09:50 AM - 10:40 AM',
  'Hour 3': '10:55 AM - 11:45 AM',
  'Hour 4': '11:45 AM - 12:35 PM',
  'Hour 5': '01:20 PM - 02:10 PM',
  'Hour 6': '02:10 PM - 03:00 PM',
  'Hour 7': '03:10 PM - 04:00 PM',
  'Hour 8': '04:00 PM - 04:50 PM',
}

function getTodayISODate() {
  return new Date().toISOString().slice(0, 10)
}

function shiftISODate(isoDate, daysToShift) {
  const base = new Date(`${isoDate}T12:00:00`)
  base.setDate(base.getDate() + daysToShift)
  return base.toISOString().slice(0, 10)
}

function formatGridDateLabel(isoDate) {
  const d = new Date(`${isoDate}T12:00:00`)
  const parts = new Intl.DateTimeFormat('en-GB', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).formatToParts(d)

  const get = (type) => parts.find((item) => item.type === type)?.value || ''
  return `${get('weekday')}, ${get('day')} ${get('month')}, ${get('year')}`
}

function toNormalizedText(value) {
  return String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '')
}

function toSemesterNumber(value) {
  const match = String(value || '').match(/\d+/)
  return match ? Number(match[0]) : null
}

function toSectionCode(value) {
  const match = String(value || '').toUpperCase().match(/[A-Z]/)
  return match ? match[0] : null
}

function weekdayCodeFromDate(isoDate) {
  return new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(new Date(`${isoDate}T12:00:00`))
}

function findMatchingTimetableRecord(records, profile) {
  if (!profile || !Array.isArray(records) || records.length === 0) return null

  const wantedDept = toNormalizedText(profile.department)
  const wantedSemester = toSemesterNumber(profile.semester)
  const wantedSection = toSectionCode(profile.section)

  const exact = records.find((record) => {
    const dept = toNormalizedText(record?.dept)
    const semester = toSemesterNumber(record?.semester)
    const section = toSectionCode(record?.section)
    return dept === wantedDept && semester === wantedSemester && section === wantedSection
  })
  if (exact) return exact

  const semSection = records.find((record) => {
    const semester = toSemesterNumber(record?.semester)
    const section = toSectionCode(record?.section)
    return semester === wantedSemester && section === wantedSection
  })
  if (semSection) return semSection

  const sectionOnly = records.find((record) => toSectionCode(record?.section) === wantedSection)
  return sectionOnly || null
}

function buildClassMeta(student) {
  const department = String(student?.department || 'General')
  const year = String(student?.year || 'Year')
  const section = String(student?.section || 'A')
  const classLabel = `${department} - ${year} - Sec ${section}`
  const classId = `${department}__${year}__${section}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return { classId, classLabel }
}

function buildMarkRecordKey(classId, date, hour) {
  return `${classId}::${date}::${hour}`
}

function readMarkAttendanceStorage() {
  try {
    const raw = localStorage.getItem(MARK_ATTENDANCE_STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function writeMarkAttendanceStorage(payload) {
  try {
    localStorage.setItem(MARK_ATTENDANCE_STORAGE_KEY, JSON.stringify(payload))
  } catch (err) {
    console.error('Failed to persist hour-wise attendance:', err)
  }
}

function normalizeAttendanceRecord(r) {
  return {
    id: r.personId || r.id || '',
    name: r.name,
    course: r.courseOrDepartment || r.course || '',
    department: r.courseOrDepartment || r.department || '',
    present: r.present,
    total: r.total,
  }
}

function AttendanceTable({ data, type, isAdmin }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
      <table className="w-full text-left">
        <thead>
          <tr className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wider border-b border-slate-200">
            <th className="px-6 py-4">{type === 'staff' ? 'Staff Member' : 'Student'}</th>
            <th className="px-6 py-4">{type === 'staff' ? 'Department' : 'Course'}</th>
            <th className="px-6 py-4">Days Attended</th>
            <th className="px-6 py-4">Attendance %</th>
            <th className="px-6 py-4">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {data.length === 0 && (
            <tr>
              <td colSpan={5} className="px-6 py-10 text-center text-slate-400 text-sm">No records found</td>
            </tr>
          )}
          {data.map((s, i) => {
            const pct     = calcPct(s.present, s.total)
            const risk    = getRiskStatus(pct)
            const isStaff = type === 'staff'
            const statusLabel = isStaff
              ? (pct >= 75 ? 'Regular Attendance' : 'Irregular Attendance')
              : getEligibilityStatus(pct)
            const statusGreen = pct >= 75
            const needed  = classesNeeded(s.present, s.total)
            const safe    = safeClasses(s.present, s.total)
            return (
              <tr
                key={s.id}
                className="hover:bg-slate-50 transition-all duration-300 animate-fadeIn"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <td className="px-6 py-4">
                  <p className="text-sm font-semibold text-slate-900">{s.name}</p>
                  <p className="text-xs text-slate-500">{s.id}</p>
                </td>
                <td className="px-6 py-4 text-sm text-slate-600">{isStaff ? s.department : s.course}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-32 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#1162d4] transition-all duration-700 ease-out"
                        style={{ width: `${Math.min(pct, 100)}%` }}
                      />
                    </div>
                    <span className="text-sm text-slate-600">{s.present}/{s.total}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">Progress: {pct}%</p>
                </td>
                <td className="px-6 py-4">
                  <p className="text-sm font-bold">{pct}%</p>
                  <p className={`text-xs mt-1 font-medium ${statusGreen ? 'text-green-700' : 'text-red-600'}`}>
                    {statusLabel}
                  </p>
                  {!statusGreen ? (
                    <p className="text-[11px] text-slate-500 mt-1">
                      {isStaff ? `Attend ${needed} more sessions to reach 75%.` : `Attend ${needed} more classes to reach 75%.`}
                    </p>
                  ) : (
                    <p className="text-[11px] text-slate-500 mt-1">
                      {isStaff ? `Can miss ${safe} more sessions and stay ≥75%.` : `Can miss ${safe} more and still stay ≥75%.`}
                    </p>
                  )}
                </td>
                <td className="px-6 py-4">
                  {isAdmin ? (
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      risk === 'Good'    ? 'bg-green-100 text-green-800'   :
                      risk === 'At Risk' ? 'bg-orange-100 text-orange-800' :
                                          'bg-red-100 text-red-800'
                    }`}>{risk}</span>
                  ) : (
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      statusGreen ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>{statusLabel}</span>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export default function AttendancePage({ noLayout = false }) {
  const session       = getUserSession()
  const role          = session?.role || 'student'
  const sessionUserId = session?.userId || ''
  const isAdmin       = role === 'admin'
  const isStudent     = role === 'student'
  const isFaculty     = role === 'faculty'

  const [activeTab,               setActiveTab]               = useState('students')
  const [studentViewTab,          setStudentViewTab]          = useState('my')
  const [staffViewTab,            setStaffViewTab]            = useState('my')
  const [selectedStatuses,        setSelectedStatuses]        = useState([])
  const [selectedAttendanceRange, setSelectedAttendanceRange] = useState([])
  const [selectedCourses,         setSelectedCourses]         = useState([])
  const [activeFilterTab,         setActiveFilterTab]         = useState('status')
  const [filterOpen,              setFilterOpen]              = useState(false)
  const [searchQuery,             setSearchQuery]             = useState('')
  const filterRef = useRef(null)

  const [studentData,      setStudentData]      = useState(FALLBACK_STUDENTS)
  const [staffData,        setStaffData]        = useState(FALLBACK_STAFF)
  const [weeklyAttendance, setWeeklyAttendance] = useState(FALLBACK_WEEKLY)

  const [classOptions,     setClassOptions]     = useState([])
  const [classStudentsMap, setClassStudentsMap] = useState({})
  const [selectedClassId,  setSelectedClassId]  = useState('')
  const [attendanceDate,   setAttendanceDate]   = useState(getTodayISODate())
  const [attendanceHour,   setAttendanceHour]   = useState(STAFF_MARK_HOURS[0])
  const [markRows,         setMarkRows]         = useState([])
  const [markNotice,       setMarkNotice]       = useState('')
  const [studentDailyDate, setStudentDailyDate] = useState(getTodayISODate())
  const [studentClassProfile, setStudentClassProfile] = useState(null)
  const [studentTimetableRecord, setStudentTimetableRecord] = useState(null)

  useEffect(() => {
    async function fetchAttendance() {
      try {
        const [stuRes, staffRes, weekRes] = await Promise.all([
          fetch('/api/academics/attendance?role=student'),
          fetch('/api/academics/attendance?role=staff'),
          fetch('/api/academics/attendance/weekly'),
        ])
        const [stuJson, staffJson, weekJson] = await Promise.all([
          stuRes.json().catch(() => null),
          staffRes.json().catch(() => null),
          weekRes.json().catch(() => null),
        ])
        if (stuJson?.success && stuJson.data.length > 0)
          setStudentData(stuJson.data.map(normalizeAttendanceRecord))
        if (staffJson?.success && staffJson.data.length > 0)
          setStaffData(staffJson.data.map(normalizeAttendanceRecord))
        if (weekJson?.success && weekJson.data.length > 0)
          setWeeklyAttendance(weekJson.data)
      } catch (err) {
        console.error('Failed to fetch attendance data:', err)
      }
    }
    fetchAttendance()
  }, [])

  useEffect(() => {
    if (!isFaculty && !isStudent) return

    let cancelled = false

    async function fetchClassStudents() {
      try {
        const res = await fetch('/api/students')
        const json = await res.json().catch(() => null)
        const students = Array.isArray(json)
          ? json
          : (Array.isArray(json?.data) ? json.data : [])

        const grouped = {}

        students.forEach((student) => {
          const { classId, classLabel } = buildClassMeta(student)
          if (!grouped[classId]) grouped[classId] = { id: classId, label: classLabel, students: [] }

          grouped[classId].students.push({
            id: student.id || student.rollNumber || student._id || '',
            rollNumber: student.rollNumber || student.id || '-',
            name: student.name || 'Unnamed Student',
          })
        })

        const groupedList = Object.values(grouped)
          .map((item) => ({
            ...item,
            students: [...item.students].sort((a, b) => String(a.rollNumber).localeCompare(String(b.rollNumber))),
          }))
          .sort((a, b) => a.label.localeCompare(b.label))

        const nextOptions = groupedList.map(({ id, label }) => ({ id, label }))
        const nextMap = groupedList.reduce((acc, item) => {
          acc[item.id] = item.students
          return acc
        }, {})

        if (cancelled) return

        setClassOptions(nextOptions)
        setClassStudentsMap(nextMap)
        setSelectedClassId((prev) => {
          if (isStudent) {
            const myStudent = students.find((student) =>
              normalizeId(student.id || student.rollNumber) === normalizeId(sessionUserId)
            )
            if (myStudent) {
              setStudentClassProfile({
                department: myStudent.department,
                semester: myStudent.semester || myStudent.year,
                section: myStudent.section,
              })
              return buildClassMeta(myStudent).classId
            }
            return prev || nextOptions[0]?.id || ''
          }
          if (prev && nextMap[prev]) return prev
          return nextOptions[0]?.id || ''
        })
      } catch (err) {
        console.error('Failed to fetch class students for attendance:', err)
      }
    }

    fetchClassStudents()

    return () => {
      cancelled = true
    }
  }, [isFaculty, isStudent, sessionUserId])

  useEffect(() => {
    if (!isStudent || !studentClassProfile) return

    let cancelled = false

    async function fetchStudentTimetable() {
      try {
        const res = await fetch('/api/academics/timetable')
        const json = await res.json().catch(() => null)
        const records = Array.isArray(json?.data) ? json.data : []
        const matched = findMatchingTimetableRecord(records, studentClassProfile)
        if (!cancelled) {
          setStudentTimetableRecord(matched)
        }
      } catch (err) {
        console.error('Failed to fetch timetable for attendance tooltip:', err)
      }
    }

    fetchStudentTimetable()

    return () => {
      cancelled = true
    }
  }, [isStudent, studentClassProfile])

  useEffect(() => {
    if (!isFaculty || staffViewTab !== 'mark') return

    const studentsForClass = classStudentsMap[selectedClassId] || []
    const baseRows = studentsForClass.map((student) => ({ ...student, status: 'Present' }))

    const storage = readMarkAttendanceStorage()
    const recordKey = buildMarkRecordKey(selectedClassId, attendanceDate, attendanceHour)
    const savedEntries = Array.isArray(storage[recordKey]?.entries) ? storage[recordKey].entries : []

    if (savedEntries.length > 0) {
      const statusByStudent = savedEntries.reduce((acc, item) => {
        if (item?.studentId) acc[item.studentId] = item.status
        return acc
      }, {})

      setMarkRows(baseRows.map((student) => ({
        ...student,
        status: statusByStudent[student.id] === 'Absent' ? 'Absent' : 'Present',
      })))
      return
    }

    setMarkRows(baseRows)
  }, [isFaculty, staffViewTab, classStudentsMap, selectedClassId, attendanceDate, attendanceHour])

  // Scope records: non-admin sees only their own row
  const scopedStudents = isAdmin
    ? studentData
    : studentData.filter(e => normalizeId(e.id) === normalizeId(sessionUserId))

  const scopedStaff = isAdmin
    ? staffData
    : staffData.filter(e => normalizeId(e.id) === normalizeId(sessionUserId))

  const currentTabData   = isStudent ? scopedStudents : (isAdmin ? (activeTab === 'students' ? scopedStudents : scopedStaff) : scopedStaff)
  const currentTableType = isStudent ? 'student'      : (isAdmin ? (activeTab === 'students' ? 'student' : 'staff') : 'staff')
  const statusOptions = isAdmin
    ? ['Good', 'At Risk', 'Critical']
    : ['Eligible for Exams', 'Low Attendance']

  const courseOptions = Array.from(
    new Set(
      currentTabData
        .map((item) => (currentTableType === 'staff' ? item.department : item.course))
        .filter(Boolean)
    )
  ).sort((a, b) => a.localeCompare(b))

  const activeFilterCount =
    selectedStatuses.length + selectedAttendanceRange.length + selectedCourses.length

  const filterTabs = [
    { id: 'status', label: 'Status' },
    { id: 'attendance', label: 'Attendance %' },
    { id: 'course', label: currentTableType === 'staff' ? 'Department' : 'Course' },
  ]

  const showStudentDailyView = isStudent && studentViewTab === 'daily'
  const showStaffMarkingView = isFaculty && staffViewTab === 'mark'

  const selectedClassLabel =
    classOptions.find((option) => option.id === selectedClassId)?.label || 'Select class'

  const presentCount = markRows.filter((row) => row.status === 'Present').length
  const absentCount = markRows.filter((row) => row.status === 'Absent').length

  const studentDailyGridRows = (() => {
    if (!isStudent) return []

    const storage = readMarkAttendanceStorage()
    const currentStudentId = normalizeId(sessionUserId)
    const statusMap = {}

    Object.values(storage).forEach((record) => {
      if (!record || !record.date || !record.hour || !Array.isArray(record.entries)) return

      const matched = record.entries.find((entry) => {
        const entryId = normalizeId(entry?.studentId || entry?.rollNumber)
        return entryId === currentStudentId
      })

      if (!matched) return

      const key = `${record.date}::${record.hour}`
      const incomingStatus = matched.status === 'Absent' ? 'Absent' : 'Present'
      const existing = statusMap[key]

      // If multiple records exist for same date/hour, Absent takes precedence.
      statusMap[key] = existing === 'Absent' || incomingStatus === 'Absent' ? 'Absent' : 'Present'
    })

    return Array.from({ length: STUDENT_DAILY_LOOKBACK_DAYS }, (_, index) => {
      const date = shiftISODate(studentDailyDate, -index)
      const hours = STAFF_MARK_HOURS.map((hour) => {
        const status = statusMap[`${date}::${hour}`] || 'Not Marked'
        return { hour, status }
      })
      return {
        date,
        label: formatGridDateLabel(date),
        isToday: date === getTodayISODate(),
        hours,
      }
    })
  })()

  function getTimetableSubjectForCell(dateIso, hourLabel) {
    if (!studentTimetableRecord) return 'Subject not available'

    const dayCode = weekdayCodeFromDate(dateIso)
    const dayIndex = WEEK_DAYS.indexOf(dayCode)
    if (dayIndex === -1) return 'No class scheduled'

    const slotIndex = STAFF_MARK_HOURS.indexOf(hourLabel)
    if (slotIndex === -1) return 'No class scheduled'

    const slotEntry = studentTimetableRecord?.slots?.[slotIndex]?.[dayIndex]
    if (!slotEntry || (!slotEntry.code && !slotEntry.name && !slotEntry.label)) return 'No class scheduled'

    const code = String(slotEntry.code || '').trim()
    const name = String(slotEntry.name || slotEntry.label || '').trim()

    if (code && name) return `${code} - ${name}`
    return code || name || 'No class scheduled'
  }

  function setStudentAttendanceStatus(studentId, status) {
    setMarkRows((prev) =>
      prev.map((row) =>
        row.id === studentId
          ? { ...row, status: status === 'Absent' ? 'Absent' : 'Present' }
          : row
      )
    )
    setMarkNotice('')
  }

  function saveMarkedAttendance() {
    if (!selectedClassId || markRows.length === 0) {
      setMarkNotice('No students available for the selected class.')
      return
    }

    const recordKey = buildMarkRecordKey(selectedClassId, attendanceDate, attendanceHour)
    const storage = readMarkAttendanceStorage()

    storage[recordKey] = {
      classId: selectedClassId,
      classLabel: selectedClassLabel,
      date: attendanceDate,
      hour: attendanceHour,
      markedBy: sessionUserId,
      markedAt: new Date().toISOString(),
      entries: markRows.map((row) => ({
        studentId: row.id,
        rollNumber: row.rollNumber,
        name: row.name,
        status: row.status,
      })),
    }

    writeMarkAttendanceStorage(storage)
    setMarkNotice(`Saved attendance for ${selectedClassLabel} on ${attendanceDate} (${attendanceHour}).`)
  }

  function toggleFilterValue(value, setter) {
    setter((prev) =>
      prev.includes(value)
        ? prev.filter((item) => item !== value)
        : [...prev, value]
    )
  }

  function clearAllFilters() {
    setSelectedStatuses([])
    setSelectedAttendanceRange([])
    setSelectedCourses([])
  }

  const filteredData = currentTabData.filter(s => {
    const pct = calcPct(s.present, s.total)
    const statusValue = isAdmin ? getRiskStatus(pct) : getEligibilityStatus(pct)
    const courseValue = currentTableType === 'staff' ? s.department : s.course

    const statusMatch =
      selectedStatuses.length === 0 || selectedStatuses.includes(statusValue)
    const attendanceRangeMatch =
      selectedAttendanceRange.length === 0 ||
      selectedAttendanceRange.some((rangeId) => isInAttendanceRange(pct, rangeId))
    const courseMatch =
      selectedCourses.length === 0 || selectedCourses.includes(courseValue)
    const searchMatch = s.name.toLowerCase().includes(searchQuery.toLowerCase())

    return statusMatch && attendanceRangeMatch && courseMatch && searchMatch
  })

  useEffect(() => {
    setSelectedCourses((prev) => {
      const next = prev.filter((course) => courseOptions.includes(course))
      return next.length === prev.length ? prev : next
    })
  }, [courseOptions])

  useEffect(() => {
    function handleClickOutside(e) {
      if (filterRef.current && !filterRef.current.contains(e.target)) setFilterOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const inner = (
    <>
      {isAdmin && (
        <div className="flex justify-start mb-6">
          <button className="flex items-center gap-2 px-4 py-2 bg-[#1162d4] text-white rounded-lg text-sm font-semibold hover:bg-[#1162d4]/90">
            <span className="material-symbols-outlined text-lg">download</span>Export Report
          </button>
        </div>
      )}

      {(() => {
        if (isStudent) {
          const my = scopedStudents[0]
          if (!my) return null
          const pct      = calcPct(my.present, my.total)
          const canMiss  = safeClasses(my.present, my.total)
          return (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex items-center gap-4">
                <div className="p-3 rounded-xl text-[#1162d4] bg-[#1162d4]/10">
                  <span className="material-symbols-outlined">calendar_today</span>
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium">Total Classes</p>
                  <p className="text-2xl font-bold text-slate-900">{my.total}</p>
                </div>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex items-center gap-4">
                <div className="p-3 rounded-xl text-purple-600 bg-purple-100">
                  <span className="material-symbols-outlined">percent</span>
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium">Attendance %</p>
                  <p className="text-2xl font-bold text-slate-900">{pct}%</p>
                </div>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex items-center gap-4">
                <div className="p-3 rounded-xl text-emerald-600 bg-emerald-100">
                  <span className="material-symbols-outlined">event_available</span>
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium">Classes Can Miss</p>
                  <p className="text-2xl font-bold text-slate-900">{canMiss}</p>
                </div>
              </div>
            </div>
          )
        }
        // Faculty / Admin view
        const allS        = studentData
        const avgPct      = allS.length
          ? Number((allS.reduce((acc, s) => acc + calcPct(s.present, s.total), 0) / allS.length).toFixed(1))
          : 0
        const below75     = allS.filter(s => calcPct(s.present, s.total) < 75).length
        const totalTaken  = allS.length > 0 ? allS[0].total : 0
        return (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex items-center gap-4">
              <div className="p-3 rounded-xl text-[#1162d4] bg-[#1162d4]/10">
                <span className="material-symbols-outlined">school</span>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Total Classes Taken</p>
                <p className="text-2xl font-bold text-slate-900">{totalTaken}</p>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex items-center gap-4">
              <div className="p-3 rounded-xl text-purple-600 bg-purple-100">
                <span className="material-symbols-outlined">bar_chart</span>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Average Attendance %</p>
                <p className="text-2xl font-bold text-slate-900">{avgPct}%</p>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex items-center gap-4">
              <div className="p-3 rounded-xl text-red-500 bg-red-100">
                <span className="material-symbols-outlined">warning</span>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Students Below 75%</p>
                <p className="text-2xl font-bold text-slate-900">{below75}</p>
              </div>
            </div>
          </div>
        )
      })()}

      {
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm mb-6">
          <p className="text-sm font-semibold text-slate-700 mb-4">Weekly Attendance Trend</p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={weeklyAttendance} barCategoryGap="35%">
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis
                dataKey="day"
                tick={{ fontSize: 12, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                domain={[70, 100]}
                tick={{ fontSize: 12, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `${v}%`}
              />
              <Tooltip
                formatter={(v) => [`${v}%`, 'Attendance']}
                contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: 12 }}
                cursor={{ fill: '#f8fafc' }}
              />
              <Bar dataKey="attendance" fill="#1162d4" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      }

      {(() => {
        if (isStudent) {
          const my  = scopedStudents[0]
          if (!my) return null
          const pct = calcPct(my.present, my.total)
          return pct < 75 ? (
            <div className="flex items-start gap-3 p-4 bg-orange-50 border border-orange-200 rounded-xl mb-6">
              <span className="material-symbols-outlined text-orange-500 mt-0.5">warning</span>
              <div>
                <p className="text-sm font-semibold text-orange-700">Warning: Your attendance is below 75%.</p>
                <p className="text-xs text-orange-600 mt-0.5">Attend upcoming classes to maintain eligibility.</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl mb-6">
              <span className="material-symbols-outlined text-emerald-500">check_circle</span>
              <p className="text-sm font-semibold text-emerald-700">Eligible for Exams</p>
            </div>
          )
        }
        // Faculty / Admin view
        const lowStudents = studentData.filter(s => calcPct(s.present, s.total) < 75)
        if (lowStudents.length === 0) return null
        return (
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <span className="material-symbols-outlined text-orange-500">warning</span>
              <p className="text-sm font-semibold text-orange-700">Students Below 75%</p>
            </div>
            <ul className="space-y-1">
              {lowStudents.map((s) => (
                <li key={s.id} className="flex items-center gap-2 text-sm text-orange-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-400 inline-block" />
                  {s.name} ({calcPct(s.present, s.total)}%)
                </li>
              ))}
            </ul>
          </div>
        )
      })()}

      {/* Summary Cards — admin only */}
      {isAdmin && (() => {
        const data     = activeTab === 'students' ? scopedStudents : scopedStaff
        const good     = data.filter(s => calcPct(s.present, s.total) >= 85).length
        const atRisk   = data.filter(s => { const p = calcPct(s.present, s.total); return p >= 75 && p < 85 }).length
        const critical = data.filter(s => calcPct(s.present, s.total) < 75).length
        return (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{data.length}</p>
            </div>
            <div className="bg-green-50 rounded-xl border border-green-200 p-4 shadow-sm">
              <p className="text-xs font-semibold text-green-600 uppercase tracking-wider">Good</p>
              <p className="text-2xl font-bold text-green-700 mt-1">{good}</p>
            </div>
            <div className="bg-orange-50 rounded-xl border border-orange-200 p-4 shadow-sm">
              <p className="text-xs font-semibold text-orange-600 uppercase tracking-wider">At Risk</p>
              <p className="text-2xl font-bold text-orange-700 mt-1">{atRisk}</p>
            </div>
            <div className="bg-red-50 rounded-xl border border-red-200 p-4 shadow-sm">
              <p className="text-xs font-semibold text-red-600 uppercase tracking-wider">Critical</p>
              <p className="text-2xl font-bold text-red-700 mt-1">{critical}</p>
            </div>
          </div>
        )
      })()}

      {/* Tabs + Controls Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        {isAdmin ? (
          <div className="flex gap-1 p-1 bg-slate-100 rounded-lg w-fit">
            <button
              onClick={() => setActiveTab('students')}
              className={`flex items-center gap-2 px-5 py-2 rounded-md text-sm font-semibold transition-all duration-200 ${
                activeTab === 'students' ? 'bg-white text-[#1162d4] shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <span className="material-symbols-outlined text-base">school</span>Students
            </button>
            <button
              onClick={() => setActiveTab('staff')}
              className={`flex items-center gap-2 px-5 py-2 rounded-md text-sm font-semibold transition-all duration-200 ${
                activeTab === 'staff' ? 'bg-white text-[#1162d4] shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <span className="material-symbols-outlined text-base">badge</span>Staff
            </button>
          </div>
        ) : isFaculty ? (
          <div className="flex gap-1 p-1 bg-slate-100 rounded-lg w-fit">
            <button
              onClick={() => setStaffViewTab('my')}
              className={`flex items-center gap-2 px-5 py-2 rounded-md text-sm font-semibold transition-all duration-200 ${
                staffViewTab === 'my' ? 'bg-white text-[#1162d4] shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <span className="material-symbols-outlined text-base">person</span>My Attendance
            </button>
            <button
              onClick={() => setStaffViewTab('mark')}
              className={`flex items-center gap-2 px-5 py-2 rounded-md text-sm font-semibold transition-all duration-200 ${
                staffViewTab === 'mark' ? 'bg-white text-[#1162d4] shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <span className="material-symbols-outlined text-base">checklist</span>Mark Attendance
            </button>
          </div>
        ) : isStudent ? (
          <div className="flex gap-1 p-1 bg-slate-100 rounded-lg w-fit">
            <button
              onClick={() => setStudentViewTab('my')}
              className={`flex items-center gap-2 px-5 py-2 rounded-md text-sm font-semibold transition-all duration-200 ${
                studentViewTab === 'my' ? 'bg-white text-[#1162d4] shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <span className="material-symbols-outlined text-base">person</span>My Attendance
            </button>
            <button
              onClick={() => setStudentViewTab('daily')}
              className={`flex items-center gap-2 px-5 py-2 rounded-md text-sm font-semibold transition-all duration-200 ${
                studentViewTab === 'daily' ? 'bg-white text-[#1162d4] shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <span className="material-symbols-outlined text-base">calendar_month</span>Daily Attendance
            </button>
          </div>
        ) : (
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-100 text-slate-600 text-sm font-semibold w-fit">
            <span className="material-symbols-outlined text-base">person</span>My Attendance
          </div>
        )}

        {isAdmin && (
          <div className="flex items-center justify-end gap-3">
            {/* Search */}
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

            {/* Filter Dropdown */}
            <div className="relative" ref={filterRef}>
              <button
                onClick={() => setFilterOpen(prev => !prev)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border transition-all duration-200 ${
                  activeFilterCount > 0
                    ? 'bg-[#1162d4] text-white border-[#1162d4] shadow-sm'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 shadow-sm'
                }`}
              >
                <span className="material-symbols-outlined text-lg">filter_list</span>
                {activeFilterCount > 0 && <span>{activeFilterCount}</span>}
              </button>

              {filterOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white border border-slate-200 rounded-xl shadow-lg z-20 animate-dropIn origin-top-right overflow-hidden">
                  <div className="border-b border-slate-100 px-2 pt-1.5">
                    <div className="grid grid-cols-3 gap-1">
                      {filterTabs.map((tab) => (
                        <button
                          key={tab.id}
                          onClick={() => setActiveFilterTab(tab.id)}
                          className={`px-2 py-2 text-xs font-semibold rounded-t-lg transition-colors ${
                            activeFilterTab === tab.id
                              ? 'text-[#1162d4] border-b-2 border-[#1162d4]'
                              : 'text-slate-500 hover:text-slate-700'
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="p-2.5 max-h-56 overflow-y-auto">
                    {activeFilterTab === 'status' && (
                      <div className="space-y-1">
                        {statusOptions.map((opt) => {
                          const checked = selectedStatuses.includes(opt)
                          return (
                            <button
                              key={opt}
                              onClick={() => toggleFilterValue(opt, setSelectedStatuses)}
                              className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                                checked ? 'bg-[#1162d4]/10 text-[#1162d4] font-semibold' : 'text-slate-600 hover:bg-slate-50'
                              }`}
                            >
                              <span className="flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full ${
                                  opt === 'Good' || opt === 'Eligible for Exams' ? 'bg-green-500' :
                                  opt === 'At Risk' ? 'bg-orange-500' : 'bg-red-500'
                                }`} />
                                {opt}
                              </span>
                              {checked && <span className="material-symbols-outlined text-base">check</span>}
                            </button>
                          )
                        })}
                      </div>
                    )}

                    {activeFilterTab === 'attendance' && (
                      <div className="space-y-1">
                        {ATTENDANCE_RANGE_OPTIONS.map((range) => {
                          const checked = selectedAttendanceRange.includes(range.id)
                          return (
                            <button
                              key={range.id}
                              onClick={() => toggleFilterValue(range.id, setSelectedAttendanceRange)}
                              className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                                checked ? 'bg-[#1162d4]/10 text-[#1162d4] font-semibold' : 'text-slate-600 hover:bg-slate-50'
                              }`}
                            >
                              <span>{range.label}</span>
                              {checked && <span className="material-symbols-outlined text-base">check</span>}
                            </button>
                          )
                        })}
                      </div>
                    )}

                    {activeFilterTab === 'course' && (
                      <div className="space-y-1">
                        {courseOptions.length === 0 && (
                          <p className="px-3 py-2 text-sm text-slate-400">No options available</p>
                        )}
                        {courseOptions.map((course) => {
                          const checked = selectedCourses.includes(course)
                          return (
                            <button
                              key={course}
                              onClick={() => toggleFilterValue(course, setSelectedCourses)}
                              className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                                checked ? 'bg-[#1162d4]/10 text-[#1162d4] font-semibold' : 'text-slate-600 hover:bg-slate-50'
                              }`}
                            >
                              <span className="truncate text-left">{course}</span>
                              {checked && <span className="material-symbols-outlined text-base">check</span>}
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </div>

                  <div className="border-t border-slate-100 px-3 py-2.5 flex items-center justify-between bg-slate-50/70">
                    <p className="text-xs text-slate-500">{activeFilterCount} filter(s) applied</p>
                    <button
                      onClick={clearAllFilters}
                      disabled={activeFilterCount === 0}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="material-symbols-outlined text-sm">restart_alt</span>
                      Clear All Filters
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {showStaffMarkingView ? (
        <>
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm mb-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Class</label>
                <select
                  value={selectedClassId}
                  onChange={(e) => { setSelectedClassId(e.target.value); setMarkNotice('') }}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#1162d4]/30 focus:border-[#1162d4]"
                >
                  {classOptions.length === 0 && <option value="">No classes available</option>}
                  {classOptions.map((option) => (
                    <option key={option.id} value={option.id}>{option.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Date</label>
                <input
                  type="date"
                  value={attendanceDate}
                  onChange={(e) => { setAttendanceDate(e.target.value); setMarkNotice('') }}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#1162d4]/30 focus:border-[#1162d4]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Hour</label>
                <select
                  value={attendanceHour}
                  onChange={(e) => { setAttendanceHour(e.target.value); setMarkNotice('') }}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#1162d4]/30 focus:border-[#1162d4]"
                >
                  {STAFF_MARK_HOURS.map((hour) => (
                    <option key={hour} value={hour}>{hour}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="px-5 py-4 border-b border-slate-200 bg-slate-50 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-slate-700">Hour-wise Attendance</p>
                <p className="text-xs text-slate-500">Default status is Present. Use cross icon only for absent students.</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
                  Present: {presentCount}
                </span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700">
                  Absent: {absentCount}
                </span>
                <button
                  onClick={saveMarkedAttendance}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#1162d4] text-white rounded-lg text-sm font-semibold hover:bg-[#1162d4]/90 transition-all"
                >
                  <span className="material-symbols-outlined text-base">save</span>
                  Save
                </button>
              </div>
            </div>

            {markNotice && (
              <div className="px-5 py-2.5 border-b border-slate-100 bg-emerald-50 text-emerald-700 text-xs font-medium">
                {markNotice}
              </div>
            )}

            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wider border-b border-slate-200">
                  <th className="px-6 py-4">Register Number</th>
                  <th className="px-6 py-4">Student Name</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {markRows.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-6 py-10 text-center text-slate-400 text-sm">No students found for this class</td>
                  </tr>
                )}

                {markRows.map((row) => (
                  <tr key={row.id || row.rollNumber} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-sm text-slate-700 font-medium">{row.rollNumber}</td>
                    <td className="px-6 py-4 text-sm text-slate-800 font-semibold">{row.name}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setStudentAttendanceStatus(row.id, 'Present')}
                          className={`w-9 h-9 inline-flex items-center justify-center rounded-lg border transition-colors ${
                            row.status === 'Present'
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
                              : 'bg-white border-slate-200 text-slate-400 hover:border-emerald-200'
                          }`}
                          title="Present"
                        >
                          <span className="material-symbols-outlined text-base">check</span>
                        </button>
                        <button
                          onClick={() => setStudentAttendanceStatus(row.id, 'Absent')}
                          className={`w-9 h-9 inline-flex items-center justify-center rounded-lg border transition-colors ${
                            row.status === 'Absent'
                              ? 'bg-red-50 border-red-200 text-red-600'
                              : 'bg-white border-slate-200 text-slate-400 hover:border-red-200'
                          }`}
                          title="Absent"
                        >
                          <span className="material-symbols-outlined text-base">close</span>
                        </button>
                        <span className={`text-xs font-semibold ${row.status === 'Present' ? 'text-emerald-600' : 'text-red-600'}`}>
                          {row.status}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : showStudentDailyView ? (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-slate-700">Daily Hour-wise Attendance</p>
              <p className="text-xs text-slate-500">Date-wise overview for Hour 1 to Hour 8.</p>
            </div>
            <input
              type="date"
              value={studentDailyDate}
              onChange={(e) => setStudentDailyDate(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#1162d4]/30 focus:border-[#1162d4]"
            />
          </div>

          <div className="overflow-auto max-h-[540px]">
            <table className="min-w-[1120px] w-full text-center">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wider border-b border-slate-200">
                  <th className="px-4 py-3 sticky top-0 bg-slate-50 z-10 min-w-[170px]">Date</th>
                  {STAFF_MARK_HOURS.map((hour) => (
                    <th key={hour} className="px-4 py-3 sticky top-0 bg-slate-50 z-10 min-w-[120px]">{hour}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {studentDailyGridRows.map((row) => (
                  <tr key={row.date} className={row.isToday ? 'bg-[#1162d4]/5' : 'bg-white hover:bg-slate-50'}>
                    <td className="px-4 py-3 text-sm font-semibold text-slate-700 border-r border-slate-200">
                      <div className="flex flex-col items-center gap-1">
                        <span>{row.label}</span>
                        {row.isToday && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#1162d4]/10 text-[#1162d4]">Today</span>
                        )}
                      </div>
                    </td>
                    {row.hours.map((cell) => (
                      <td key={`${row.date}-${cell.hour}`} className="px-4 py-3 border-r border-slate-100">
                        <span
                          title={`${cell.hour}: ${getTimetableSubjectForCell(row.date, cell.hour)} (${cell.status})`}
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border cursor-help ${
                          cell.status === 'Present'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : cell.status === 'Absent'
                              ? 'bg-red-50 text-red-700 border-red-200'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}
                        >
                          {cell.status}
                        </span>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <AttendanceTable data={filteredData} type={currentTableType} isAdmin={isAdmin} />
      )}
    </>
  )
  return noLayout ? inner : <Layout title="Attendance">{inner}</Layout>
}
