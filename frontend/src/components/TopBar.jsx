import { useState } from 'react'
import { getUserSession } from '../auth/sessionController'
import { cmsRoles } from '../data/roleConfig'
import NotificationBell from './NotificationBell'
import NotificationDropdown from './NotificationDropdown'

export default function TopBar({ title, isSidebarVisible = true }) {
  const [isNotificationOpen, setIsNotificationOpen] = useState(false)
  const session = getUserSession()
  const role = session?.role || 'student'
  const user = cmsRoles[role] || cmsRoles.student

  return (
    <header className={`h-20 bg-white border-b border-slate-100 flex items-center justify-between sticky top-0 z-10 backdrop-blur-md bg-white/80 transition-all duration-300 ${isSidebarVisible ? 'px-10' : 'pl-24 pr-10'}`}>
      <div className="flex items-center gap-4 flex-1">
        <div>
          <h2 className="text-[20px] font-bold text-[#2563eb] tracking-tight">MIT Connect</h2>
          <p className="text-xs text-slate-500">{title || 'Dashboard'}</p>
        </div>
      </div>
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2 relative">
          <NotificationBell
            role={role}
            onBellClick={() => setIsNotificationOpen((prev) => !prev)}
          />
          <NotificationDropdown
            role={role}
            isOpen={isNotificationOpen}
            onClose={() => setIsNotificationOpen(false)}
          />
          <button className="p-2.5 text-slate-400 hover:bg-slate-50 rounded-xl transition-all">
            <span className="material-symbols-outlined text-[24px]">settings</span>
          </button>
        </div>
        <div className="flex items-center gap-4 border-l border-slate-100 pl-6 cursor-pointer group">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold text-[#1e293b]">{user.name}</p>
            <p className="text-[11px] font-bold text-[#64748b] uppercase tracking-wider">{user.label}</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-slate-100 overflow-hidden border-2 border-white shadow-sm transition-transform group-hover:scale-105">
            <img 
              src="https://img.freepik.com/free-photo/young-bearded-man-with-striped-shirt_273609-5677.jpg" 
              alt="Profile" 
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>
    </header>
  )
}
