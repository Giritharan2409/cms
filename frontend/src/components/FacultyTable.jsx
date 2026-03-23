import { useNavigate } from 'react-router-dom'

export default function FacultyTable({ faculty, onEdit, onDelete, onViewDetails }) {
  const navigate = useNavigate()

  const statusStyles = {
    Top: 'bg-yellow-100 text-yellow-800 flex items-center gap-1',
    Good: 'bg-green-100 text-green-800',
    Watch: 'bg-orange-100 text-orange-800 flex items-center gap-1',
  }

  const getStatusStyle = (status) => {
    return statusStyles[status] || 'bg-slate-100 text-slate-700'
  }

  const getDepartmentColor = (dept) => {
    const colors = {
      'CS': 'bg-blue-100 text-blue-800',
      'ECE': 'bg-purple-100 text-purple-800',
      'ME': 'bg-cyan-100 text-cyan-800',
      'MATH': 'bg-green-100 text-green-800',
      'CE': 'bg-red-100 text-red-800',
      'BT': 'bg-pink-100 text-pink-800',
    }
    return colors[dept] || 'bg-slate-100 text-slate-700'
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-all">
      <table className="w-full text-left">
        <thead>
          <tr className="bg-slate-50/80 text-slate-600 text-xs font-bold uppercase tracking-wider border-b border-slate-200">
            <th className="px-6 py-4">Name</th>
            <th className="px-6 py-4">Designation</th>
            <th className="px-6 py-4">Subject</th>
            <th className="px-6 py-4 text-center">Attendance</th>
            <th className="px-6 py-4 text-center">Pass Rate</th>
            <th className="px-6 py-4 text-center">Experience</th>
            <th className="px-6 py-4">Status</th>
            <th className="px-6 py-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {faculty.length === 0 ? (
            <tr>
              <td colSpan={8} className="px-10 py-24 text-center">
                <div className="flex flex-col items-center gap-3">
                  <span className="material-symbols-outlined text-6xl text-slate-200">group_off</span>
                  <p className="text-base font-bold text-slate-500">No faculty members found</p>
                </div>
              </td>
            </tr>
          ) : (
            faculty.map((f) => (
              <tr
                key={f.employeeId || f._id}
                className="hover:bg-blue-50/30 transition-colors cursor-pointer border-slate-100"
                onClick={() => {
                  const profileId = f._id || f.employeeId
                  if (!profileId) return
                  navigate(`/faculty/${encodeURIComponent(profileId)}`)
                }}
              >
                {/* Name Column */}
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-white text-xs shadow-sm ${getDepartmentColor(f.department_id)}`}>
                      {f.name ? f.name.split(' ').slice(0, 2).map(n => n[0]).join('') : 'FA'}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-slate-900 leading-tight">{f.name}</p>
                      <p className="text-xs text-slate-500">{f.employeeId || 'N/A'}</p>
                    </div>
                  </div>
                </td>
                
                {/* Designation Column */}
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <span className="inline-block px-3 py-1.5 bg-orange-50 text-orange-700 text-xs font-bold rounded-md border border-orange-200">
                      {f.designation || 'Faculty'}
                    </span>
                  </div>
                </td>
                
                {/* Subject Column */}
                <td className="px-6 py-4">
                  <p className="text-sm font-medium text-slate-700">{f.subject || f.specialization || 'N/A'}</p>
                </td>
                
                {/* Attendance Column */}
                <td className="px-6 py-4">
                  <div className="flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-sm font-bold text-green-600">{f.attendance_rate || f.attendance || 0}%</p>
                      <div className="w-14 h-1 bg-slate-100 rounded-full mt-1 overflow-hidden">
                        <div 
                          className="h-full bg-green-500 rounded-full" 
                          style={{ width: `${f.attendance_rate || f.attendance || 0}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </td>
                
                {/* Pass Rate Column */}
                <td className="px-6 py-4">
                  <div className="flex items-center justify-center">
                    <div className="text-center">
                      <p 
                        className="text-sm font-bold" 
                        style={{ 
                          color: (f.pass_rate || 0) >= 85 ? '#10b981' : (f.pass_rate || 0) >= 75 ? '#f59e0b' : '#ef4444' 
                        }}
                      >
                        {f.pass_rate || f.passRate || 0}%
                      </p>
                      <div className="w-14 h-1 bg-slate-100 rounded-full mt-1 overflow-hidden">
                        <div 
                          className="h-full rounded-full"
                          style={{ 
                            width: `${f.pass_rate || 0}%`,
                            backgroundColor: (f.pass_rate || 0) >= 85 ? '#10b981' : (f.pass_rate || 0) >= 75 ? '#f59e0b' : '#ef4444'
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </td>
                
                {/* Experience Column */}
                <td className="px-6 py-4">
                  <div className="text-center">
                    <p className="text-sm font-bold text-slate-900">{f.experience_years || 0}</p>
                    <p className="text-xs text-slate-500">years</p>
                  </div>
                </td>
                
                {/* Status Column */}
                <td className="px-6 py-4">
                  <div className="flex items-center gap-1.5">
                    {f.status === 'Top' && (
                      <>
                        <span className="material-symbols-outlined text-base text-yellow-500">star</span>
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-800">
                          Top
                        </span>
                      </>
                    )}
                    {f.status === 'Good' && (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800">
                        Good
                      </span>
                    )}
                    {f.status === 'Watch' && (
                      <>
                        <span className="material-symbols-outlined text-base text-orange-500">warning</span>
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-800">
                          Watch
                        </span>
                      </>
                    )}
                  </div>
                </td>
                
                {/* Actions Column */}
                <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-end gap-1.5">
                    <button 
                      onClick={() => onEdit && onEdit(f)}
                      className="p-2 text-slate-400 hover:text-[#1162d4] hover:bg-blue-50 rounded-lg transition-all font-medium"
                      title="Edit Faculty"
                    >
                      <span className="material-symbols-outlined text-lg">edit</span>
                    </button>
                    <button 
                      onClick={() => onDelete && onDelete(f)}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all font-medium"
                      title="Delete Faculty"
                    >
                      <span className="material-symbols-outlined text-lg">delete</span>
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
