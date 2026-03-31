import { useNavigate } from 'react-router-dom'

export default function FacultyTable({ faculty, onEdit, onDelete, onViewDetails }) {
  const navigate = useNavigate()

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
      <table className="w-full text-left">
        <thead>
          <tr className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wider border-b border-slate-200">
            <th className="px-6 py-4">Faculty Information</th>
            <th className="px-6 py-4">Department</th>
            <th className="px-6 py-4">Experience</th>
            <th className="px-6 py-4">Specialization</th>
            <th className="px-6 py-4">Status</th>
            <th className="px-6 py-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {faculty.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-10 py-24 text-center text-slate-400 bg-slate-50/30">
                <div className="flex flex-col items-center">
                  <span className="material-symbols-outlined text-6xl mb-4 opacity-10 text-slate-900">group_off</span>
                  <p className="text-base font-bold text-slate-500">No faculty members found</p>
                  <p className="text-xs font-medium text-slate-400 mt-1">Try adjusting your filters or search terms</p>
                </div>
              </td>
            </tr>
          ) : (
            faculty.map((f) => (
              <tr
                key={f._id || f.id}
                className="hover:bg-blue-50/30 transition-colors cursor-pointer border-slate-100"
                onClick={() => {
                  const profileId = f._id || f.id
                  if (!profileId) return
                  navigate(`/faculty/${profileId}`)
                }}
              >
                {(() => {
                  const facultyName = f.fullName || f.name || 'N/A';
                  const facultyEmail = f.email || 'N/A';
                  const department = f.department || 'N/A';
                  const designation = f.role || f.designation || 'Faculty';
                  const experience = f.experience || f.yearsOfExperience || 'N/A';
                  const specialization = f.specialization || f.specializations || 'N/A';
                  const status = f.status || 'Pending';
                  const qualification = f.qualification || f.highestQualification || 'N/A';

                  return (
                    <>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center font-semibold text-xs bg-blue-100 text-[#1162d4]">
                      {facultyName ? facultyName.split(' ').slice(0, 2).map(n => n[0]).join('') : 'FA'}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-slate-900 leading-tight">{facultyName}</p>
                      <p className="text-xs text-slate-500">{facultyEmail}</p>
                    </div>
                  </div>
                </td>

                <td className="px-6 py-4">
                  <div>
                    <p className="text-sm font-medium text-slate-700">{department}</p>
                    <p className="text-xs text-slate-500">{designation}</p>
                  </div>
                </td>
                
                <td className="px-6 py-4">
                  <div>
                    <p className="text-sm font-medium text-slate-700">
                      {experience !== 'N/A' ? `${experience} years` : experience}
                    </p>
                    <p className="text-xs text-slate-500">{qualification}</p>
                  </div>
                </td>

                <td className="px-6 py-4">
                  <p className="text-sm font-semibold text-slate-900">{specialization}</p>
                  <p className="text-xs text-slate-500">{designation}</p>
                </td>

                <td className="px-6 py-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      status === 'Approved' 
                        ? 'bg-green-100 text-green-800'
                        : status === 'Rejected'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-orange-100 text-orange-800'
                    }`}>
                      {status}
                    </span>
                  </div>
                </td>

                <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-end gap-2">
                    <button 
                      onClick={() => onEdit && onEdit(f)}
                      className="p-1.5 text-slate-400 hover:text-[#1162d4] hover:bg-[#1162d4]/10 rounded-lg transition-colors"
                      title="Edit Faculty"
                    >
                      <span className="material-symbols-outlined text-lg">edit</span>
                    </button>
                    <button 
                      onClick={() => onDelete && onDelete(f)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete Faculty"
                    >
                      <span className="material-symbols-outlined text-lg">delete</span>
                    </button>
                  </div>
                </td>
                    </>
                  )
                })()}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
