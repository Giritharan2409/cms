import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getUserSession } from '../auth/sessionController'
import { cmsRoles } from '../data/roleConfig'
import { getStudentById } from '../data/studentData'

export default function TopBar({ title, isSidebarVisible = true }) {
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const navigate = useNavigate()
  const session = getUserSession()
  const role = session?.role || 'student'
  const userId = session?.userId || 'N/A'
  const user = cmsRoles[role] || cmsRoles.student
  const knownStudent = session?.userId ? getStudentById(session?.userId) : null
  const fallbackStudentId = 'STU-2024-1547'

  const handleOpenProfileDetails = () => {
    if (role === 'student') {
      const studentId = knownStudent ? session?.userId : fallbackStudentId
      navigate(`/students/${encodeURIComponent(studentId)}?role=${encodeURIComponent(role)}`)
      return
    }
    navigate(`/students?role=${encodeURIComponent(role)}`)
    setIsProfileOpen(false)
  }

  return (
    <header className={`h-20 bg-white border-b border-green-200 flex items-center justify-between sticky top-0 z-10 backdrop-blur-md bg-white/95 transition-all duration-300 ${isSidebarVisible ? 'px-10' : 'pl-24 pr-10'}`}>
      <div className="flex items-center gap-4 flex-1">
        <div>
          <h2 className="text-[20px] font-bold text-[#0d6947] tracking-tight">MIT Connect</h2>
          <p className="text-xs text-slate-500">{title || 'Dashboard'}</p>
        </div>
      </div>
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <button className="p-2.5 text-slate-400 hover:bg-slate-50 rounded-xl transition-all relative">
            <span className="material-symbols-outlined text-[24px]">notifications</span>
            <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
          </button>
          <button className="p-2.5 text-slate-400 hover:bg-slate-50 rounded-xl transition-all">
            <span className="material-symbols-outlined text-[24px]">settings</span>
          </button>
        </div>
      <div className="flex items-center gap-4 border-l border-slate-100 pl-6 cursor-pointer group relative">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold text-[#1e293b]">{user.name}</p>
            <p className="text-[11px] font-bold text-[#64748b] uppercase tracking-wider">{user.label}</p>
          </div>
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="w-11 h-11 rounded-xl bg-slate-100 overflow-hidden border-2 border-white shadow-sm transition-transform hover:scale-105"
          >
            <img 
              src="https://img.freepik.com/free-photo/young-bearded-man-with-striped-shirt_273609-5677.jpg" 
              alt="Profile" 
              className="w-full h-full object-cover"
            />
          </button>

          {/* Profile Popup */}
          {isProfileOpen && (
            <div className="absolute top-20 right-0 bg-white rounded-lg shadow-lg p-6 w-96 z-50 border border-gray-200">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
                  {user.label.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900">{user.name}</h3>
                  <p className="text-sm text-gray-600">ID: {userId}</p>
                  <p className="text-sm text-gray-600">Team: {user.team}</p>
                  <p className="text-sm text-gray-600">Focus: {user.focus}</p>
                </div>
              </div>
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button 
                  onClick={() => handleOpenProfileDetails()}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium text-sm transition-colors"
                >
                  {user.primaryAction}
                </button>
                <button className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium text-sm transition-colors">
                  {user.secondaryAction}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
