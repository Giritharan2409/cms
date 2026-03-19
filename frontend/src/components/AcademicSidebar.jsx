import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useRef } from 'react'
import { getUserSession, destroyUserSession } from '../auth/sessionController'
import { cmsRoles, roleMenuGroups } from '../data/roleConfig'

const iconMap = {
  Dashboard: 'dashboard',
  Students: 'group',
  Faculty: 'person',
  Department: 'domain',
  Exams: 'school',
  Timetable: 'calendar_today',
  Attendance: 'rule',
  Placement: 'work',
  Facility: 'apartment',
  Fees: 'payments',
  Reports: 'assessment',
  Admission: 'person_add',
  Payroll: 'receipt_long',
  Invoices: 'description',
  Analytics: 'query_stats',
  Notifications: 'notifications',
  Settings: 'settings',
  'My Courses': 'menu_book',
}

const routeMap = {
  Dashboard: '/dashboard',
  Students: '/students',
  Faculty: '/faculty',
  Department: '/department',
  Exams: '/exams',
  Timetable: '/timetable',
  Attendance: '/attendance',
  Placement: '/placement',
  Facility: '/facility',
  Fees: '/fees',
  Reports: '/reports',
  Admission: '/admission',
  Payroll: '/payroll',
  Invoices: '/invoices',
  Analytics: '/analytics',
  Notifications: '/notifications',
  Settings: '/settings',
  'My Courses': '/my-courses',
}

export default function AcademicSidebar({ isSidebarVisible = true, onToggleSidebar }) {
  const navigate = useNavigate()
  const location = useLocation()
  const navRef = useRef(null)
  const session = getUserSession()
  const role = session?.role || 'student'
  const roleMeta = cmsRoles[role] || cmsRoles.student
  const menuGroups = roleMenuGroups[role] || []

  function getRoute(item) {
    if (item === 'Fees') {
      return role === 'admin' ? '/admin-fees' : '/fees'
    }
    if (item === 'Invoices') {
      return role === 'admin' ? '/admin-invoices' : '/invoices'
    }
    return routeMap[item] || '/dashboard'
  }

  function withRoleQuery(pathname) {
    return `${pathname}?role=${encodeURIComponent(role)}`
  }

  function handleLogout() {
    destroyUserSession()
    navigate('/', { replace: true })
  }

  useEffect(() => {
    const saved = sessionStorage.getItem('cmsSidebarScroll')
    if (navRef.current && saved) {
      const value = Number.parseInt(saved, 10)
      if (Number.isFinite(value)) {
        navRef.current.scrollTop = value
      }
    }
  }, [])

  useEffect(() => {
    if (!navRef.current) return
    const handleScroll = () => {
      sessionStorage.setItem('cmsSidebarScroll', String(navRef.current.scrollTop))
    }
    navRef.current.addEventListener('scroll', handleScroll)
    return () => navRef.current?.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    if (!navRef.current) return
    const saved = sessionStorage.getItem('cmsSidebarScroll')
    if (saved) {
      const value = Number.parseInt(saved, 10)
      if (Number.isFinite(value)) {
        navRef.current.scrollTop = value
      }
    }
  }, [location.pathname])

  return (
    <aside className={`w-64 border-r border-slate-200 bg-white flex flex-col fixed h-full overflow-y-auto z-50 transition-transform duration-300 ${isSidebarVisible ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="p-6 flex items-center gap-3 relative">
        <button
          onClick={onToggleSidebar}
          className="mr-3 p-2 rounded-full border border-slate-300 bg-white shadow hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
          title="Toggle sidebar"
          style={{ zIndex: 2 }}
        >
          <span className="material-symbols-outlined text-3xl">menu</span>
        </button>
        <div className="bg-[#2563eb] w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-100">
          <span className="material-symbols-outlined text-2xl font-bold">school</span>
        </div>
        <div>
          <h1 className="font-extrabold text-[#1e293b] text-xl tracking-tight leading-none">MIT Connect</h1>
          <p className="text-[10px] font-bold text-[#64748b] uppercase tracking-[0.1em] mt-1">{roleMeta.label} Portal</p>
        </div>
      </div>

      <nav ref={navRef} className="flex-1 px-4 space-y-6 overflow-y-auto">
        {menuGroups.map((group) => (
          <div key={group.title}>
            <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
              {group.title}
            </p>
            <div className="space-y-1">
              {group.items.map((item) => {
                const route = getRoute(item)
                const to = withRoleQuery(route)
                return (
                  <NavLink
                    key={item}
                    to={to}
                    className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all duration-200 relative z-10 w-full text-left ${isActive ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}
                  >
                    <span className="material-symbols-outlined text-[22px]">{iconMap[item] || 'circle'}</span>
                    <span>{item}</span>
                  </NavLink>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-100 mt-auto">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 text-slate-500 hover:text-red-500 hover:bg-red-50 rounded-xl text-sm font-medium transition-all duration-200"
        >
          <span className="material-symbols-outlined text-[22px]">logout</span>
          <span>Logout</span>
        </button>
      </div>
    </aside>
  )
}
