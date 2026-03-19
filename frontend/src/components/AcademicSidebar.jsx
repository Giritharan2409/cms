import { NavLink, useLocation, useNavigate } from 'react-router-dom'
<<<<<<< Updated upstream
import { useEffect, useRef } from 'react'
import { getUserSession, destroyUserSession } from '../auth/sessionController'
=======
import { destroyUserSession, getUserSession } from '../auth/sessionController'
>>>>>>> Stashed changes
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

<<<<<<< Updated upstream
const routeMap = {
=======
const getRouteMap = (role) => ({
>>>>>>> Stashed changes
  Dashboard: '/dashboard',
  Students: '/students',
  Faculty: '/faculty',
  Department: '/department',
  Exams: '/exams',
  Timetable: '/timetable',
  Attendance: '/attendance',
  Placement: '/placement',
  Facility: '/facility',
<<<<<<< Updated upstream
  Fees: '/fees',
  Reports: '/reports',
  Admission: '/admission',
  Payroll: '/payroll',
  Invoices: '/invoices',
=======
  Fees: role === 'admin' ? '/admin-fees' : '/fees',
  Reports: '/reports',
  Admission: '/admission',
  Payroll: '/payroll',
  Invoices: role === 'admin' ? '/admin-invoices' : '/invoices',
>>>>>>> Stashed changes
  Analytics: '/analytics',
  Notifications: '/notifications',
  Settings: '/settings',
  'My Courses': '/my-courses',
<<<<<<< Updated upstream
}
=======
})
>>>>>>> Stashed changes

export default function AcademicSidebar({ isSidebarVisible = true, onToggleSidebar }) {
  const navigate = useNavigate()
  const location = useLocation()
  const navRef = useRef(null)
  const session = getUserSession()
  const role = session?.role || 'student'
<<<<<<< Updated upstream
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
=======
  const roleLabel = cmsRoles[role]?.label || 'Student'
  const routeMap = getRouteMap(role)
  const menuGroups = roleMenuGroups[role] || roleMenuGroups.student
>>>>>>> Stashed changes

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
<<<<<<< Updated upstream
    <aside className={`w-64 border-r border-slate-200 bg-white flex flex-col fixed h-full overflow-y-auto z-50 transition-transform duration-300 ${isSidebarVisible ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="p-5 flex items-center justify-between border-b border-slate-100/60 mb-2">
        <div className="flex items-center gap-3">
          <div className="bg-[#2563eb] w-8 h-8 rounded-lg flex items-center justify-center text-white shadow-sm">
            <span className="material-symbols-outlined text-[18px] font-bold">school</span>
          </div>
          <div className="min-w-0">
            <h1 className="font-bold text-[#1e293b] text-base leading-none truncate">MIT Connect</h1>
            <p className="text-[10px] text-slate-400 mt-1 truncate">{roleMeta.label} Portal</p>
          </div>
        </div>
        <button
          onClick={onToggleSidebar}
          className="p-1 rounded-md bg-white border border-slate-200 text-black hover:bg-slate-50 transition-colors flex items-center justify-center flex-shrink-0"
          title="Toggle sidebar"
        >
          <span className="material-symbols-outlined text-lg font-semibold">menu</span>
=======
    <aside
      className={`w-64 border-r border-slate-200 bg-white flex flex-col fixed h-full overflow-y-auto z-20 transition-transform duration-300 ${isSidebarVisible ? 'translate-x-0' : '-translate-x-full'}`}
      id="sidebar"
    >
      <div className="p-5 flex items-start gap-2">
        <div className="bg-[#2563eb] w-10 h-10 rounded-lg flex items-center justify-center text-white shadow-lg shadow-blue-100 shrink-0">
          <span className="material-symbols-outlined text-xl font-bold">school</span>
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="font-black text-[#1e293b] text-xl tracking-tight leading-tight">MIT Connect</h1>
          <p className="text-[11px] font-semibold text-[#64748b] uppercase tracking-widest mt-0.5">{roleLabel} Portal</p>
        </div>
        <button
          type="button"
          onClick={onToggleSidebar}
          className="w-8 h-8 mt-0.5 shrink-0 rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors"
          aria-label="Hide sidebar"
          title="Hide sidebar"
        >
          <span className="material-symbols-outlined text-[20px] leading-none">menu</span>
>>>>>>> Stashed changes
        </button>
      </div>

      <nav ref={navRef} className="flex-1 px-4 space-y-6 overflow-y-auto">
        {menuGroups.map((group) => (
          <div key={group.title}>
            <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
              {group.title}
            </p>
            <div className="space-y-1">
              {group.items.map((item) => {
<<<<<<< Updated upstream
                const route = getRoute(item)
                const to = withRoleQuery(route)
=======
                const route = routeMap[item] || '/dashboard'
                const to = `${route}?role=${encodeURIComponent(role)}`
                const isActive =
                  location.pathname === route ||
                  (route !== '/dashboard' && location.pathname.startsWith(route))
>>>>>>> Stashed changes
                return (
                  <NavLink
                    key={item}
                    to={to}
                    className={({ isActive }) => `block px-4 py-2.5 rounded-xl text-sm tracking-wide transition-all duration-200 relative z-10 w-full text-left ${isActive ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold shadow-md' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800 font-medium'}`}
                  >
<<<<<<< Updated upstream
                    {item}
=======
                    <span className="material-symbols-outlined mr-3 text-[22px]">{iconMap[item] || 'circle'}</span>
                    <span>{item}</span>
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
          className="w-full flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-50 rounded-xl text-sm font-semibold transition-all duration-200"
        >
          <span className="material-symbols-outlined text-[22px]">logout</span>
=======
          className="w-full flex items-center px-4 py-3 text-slate-500 hover:text-red-500 hover:bg-red-50 rounded-xl text-sm font-medium transition-all duration-200"
        >
          <span className="material-symbols-outlined mr-3 text-[22px]">logout</span>
>>>>>>> Stashed changes
          <span>Logout</span>
        </button>
      </div>
    </aside>
  )
}

