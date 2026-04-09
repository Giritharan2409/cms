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
  'Admin Dashboard': 'admin_panel_settings',
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
  'Admin Dashboard': '/admin-administration',
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
      if (role === 'admin') return '/admin-invoices'
      if (role === 'finance') return '/finance-invoices'
      return '/invoices'
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
    <aside className={`w-64 border-r-0 bg-[#0a2f1a] flex flex-col fixed h-full overflow-y-auto z-50 transition-transform duration-300 ${isSidebarVisible ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="p-5 flex items-center justify-between border-b border-green-700/60 mb-2">
        <div className="flex items-center gap-3">
          <div className="bg-white w-8 h-8 rounded-lg flex items-center justify-center text-[#0a2f1a] shadow-sm">
            <span className="material-symbols-outlined text-[18px] font-bold">school</span>
          </div>
          <div className="min-w-0">
            <h1 className="font-bold text-white text-base leading-none truncate">MIT Connect</h1>
            <p className="text-[10px] text-green-200 mt-1 truncate">{roleMeta.label} Portal</p>
          </div>
        </div>
        <button
          onClick={onToggleSidebar}
          className="p-1 rounded-md bg-green-700 border border-green-600 text-white hover:bg-green-600 transition-colors flex items-center justify-center flex-shrink-0"
          title="Toggle sidebar"
        >
          <span className="material-symbols-outlined text-lg font-semibold">menu</span>
        </button>
      </div>

      <nav ref={navRef} className="flex-1 px-3 space-y-4 overflow-y-auto py-3">
        {menuGroups.map((group) => (
          <div key={group.title}>
            <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-green-300 mb-3 flex items-center gap-2 pl-3 border-l-3 border-green-400 py-1">
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
                    className={({ isActive }) => `block px-3 py-2.5 rounded-lg text-sm tracking-wide transition-all duration-200 relative z-10 w-full text-left ${isActive ? 'bg-white/20 text-white font-semibold border-l-3 border-white' : 'text-green-100 hover:bg-green-600/50 hover:text-white font-medium'}`}
                  >
                    {item}
                  </NavLink>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="p-4 border-t border-green-700/60 mt-auto">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 text-red-300 hover:bg-red-600/20 hover:text-red-200 rounded-lg text-sm font-semibold transition-all duration-200"
        >
          <span className="material-symbols-outlined text-[22px]">logout</span>
          <span>Logout</span>
        </button>
      </div>
    </aside>
  )
}
