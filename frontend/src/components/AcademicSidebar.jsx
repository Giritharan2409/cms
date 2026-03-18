import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { destroyUserSession, getUserSession } from '../auth/sessionController'
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

const getRouteMap = (role) => ({
  Dashboard: '/dashboard',
  Students: '/students',
  Faculty: '/dashboard',
  Department: '/dashboard',
  Exams: '/exams',
  Timetable: '/timetable',
  Attendance: '/attendance',
  Placement: '/placement',
  Facility: '/facility',
  Fees: role === 'admin' ? '/admin-fees' : '/fees',
  Reports: '/dashboard',
  Admission: '/admission',
  Payroll: '/payroll',
  Invoices: role === 'admin' ? '/admin-invoices' : '/invoices',
  Analytics: '/analytics',
  Notifications: '/notifications',
  Settings: '/settings',
  'My Courses': '/dashboard',
})

export default function AcademicSidebar({ isSidebarVisible = true, onToggleSidebar }) {
  const navigate = useNavigate()
  const location = useLocation()
  const session = getUserSession()
  const role = session?.role || 'student'
  const roleLabel = cmsRoles[role]?.label || 'Student'
  const routeMap = getRouteMap(role)
  const menuGroups = roleMenuGroups[role] || roleMenuGroups.student

  function handleLogout() {
    destroyUserSession()
    navigate('/', { replace: true })
  }

  return (
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
        </button>
      </div>

      <nav className="flex-1 px-4 space-y-6 overflow-y-auto">
        {menuGroups.map((group) => (
          <div key={group.title}>
            <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
              {group.title}
            </p>
            <div className="space-y-1">
              {group.items.map((item) => {
                const route = routeMap[item] || '/dashboard'
                const to = `${route}?role=${encodeURIComponent(role)}`
                const isActive =
                  location.pathname === route ||
                  (route !== '/dashboard' && location.pathname.startsWith(route))
                return (
                  <NavLink
                    key={item}
                    to={to}
                    className={() =>
                      `flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all duration-200 ${
                        isActive
                          ? 'bg-[#2563eb]/10 text-[#2563eb] font-semibold shadow-sm'
                          : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                      }`
                    }
                  >
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
          <span>Logout</span>
        </button>
      </div>
    </aside>
  )
}
