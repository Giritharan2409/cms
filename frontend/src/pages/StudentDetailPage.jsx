import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import DashboardLayout from '../components/DashboardLayout'
import { fetchStudentById } from '../api/studentsApi'

// ─── Tab Components ──────────────────────────────────────────────

function OverviewTab({ student, onUpdate }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState({ ...student });

  const handleSave = () => {
    onUpdate(editedData);
    setIsEditing(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditedData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Left Column - Core Info */}
      <div className="lg:col-span-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Contact Information */}
          <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm relative group">
            <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-3 mb-6 uppercase tracking-wider">
              <span className="material-symbols-outlined text-[#1162d4] text-[20px]">contact_page</span>
              Contact Information
            </h3>
            {!isEditing && (
              <button 
                onClick={() => setIsEditing(true)}
                className="absolute top-8 right-8 p-2 text-slate-300 hover:text-[#1162d4] hover:bg-blue-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
              >
                <span className="material-symbols-outlined text-[18px]">edit</span>
              </button>
            )}
            <div className="space-y-5">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Phone Number</p>
                {isEditing ? (
                  <input name="phone" value={editedData.phone} onChange={handleChange} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#1162d4]/20 outline-none" />
                ) : (
                  <p className="text-sm font-medium text-slate-700">{student.phone}</p>
                )}
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Personal Email</p>
                {isEditing ? (
                  <input name="email" value={editedData.email} onChange={handleChange} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#1162d4]/20 outline-none" />
                ) : (
                  <p className="text-sm font-medium text-slate-700">{student.email}</p>
                )}
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Permanent Address</p>
                {isEditing ? (
                  <textarea name="address" value={editedData.address} onChange={handleChange} rows="3" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#1162d4]/20 outline-none resize-none" />
                ) : (
                  <p className="text-sm font-medium text-slate-700 leading-relaxed">{student.address}</p>
                )}
              </div>
            </div>
          </div>

          {/* Family Details */}
          <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm relative group">
            <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-3 mb-6 uppercase tracking-wider">
              <span className="material-symbols-outlined text-[#1162d4] text-[20px]">family_restroom</span>
              Family Details
            </h3>
            <div className="space-y-5">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Primary Guardian</p>
                {isEditing ? (
                  <input name="guardian" value={editedData.guardian} onChange={handleChange} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#1162d4]/20 outline-none" />
                ) : (
                  <p className="text-sm font-medium text-slate-700">{student.guardian}</p>
                )}
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Guardian Contact</p>
                {isEditing ? (
                  <input name="guardianPhone" value={editedData.guardianPhone} onChange={handleChange} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#1162d4]/20 outline-none" />
                ) : (
                  <p className="text-sm font-medium text-slate-700">{student.guardianPhone}</p>
                )}
              </div>
              <div className="pt-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter italic">Note: Only one primary guardian can be listed currently.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Bar for Editing */}
        {isEditing && (
          <div className="flex items-center justify-end gap-3 p-4 bg-blue-50 border border-blue-100 rounded-xl animate-in fade-in slide-in-from-top-2">
            <button onClick={() => { setIsEditing(false); setEditedData({...student}); }} className="px-4 py-2 text-xs font-bold text-slate-500 uppercase hover:text-slate-700 transition-colors">Cancel</button>
            <button onClick={handleSave} className="px-6 py-2 bg-[#1162d4] text-white rounded-lg text-xs font-bold uppercase tracking-wider shadow-sm hover:bg-[#1162d4]/90 transition-all">Save Changes</button>
          </div>
        )}

        {/* Academic Info Strip */}
        <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-3 mb-6 uppercase tracking-wider">
            <span className="material-symbols-outlined text-[#1162d4] text-[20px]">menu_book</span>
            Academic Info
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
               <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-[#1162d4] shadow-sm">
                  <span className="material-symbols-outlined text-[20px]">event_available</span>
               </div>
               <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Admission Date</p>
                  <p className="text-sm font-medium text-slate-700">{new Date(student.enrollDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
               </div>
            </div>
            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
               <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-red-500 shadow-sm">
                  <span className="material-symbols-outlined text-[20px]">bloodtype</span>
               </div>
               <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Blood Group</p>
                  <p className="text-sm font-medium text-slate-700">O+</p>
               </div>
            </div>
            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
               <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-green-500 shadow-sm">
                  <span className="material-symbols-outlined text-[20px]">task_alt</span>
               </div>
               <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Attendance</p>
                  <p className="text-sm font-medium text-slate-700">{student.attendancePct}%</p>
               </div>
            </div>
          </div>
        </div>

        {/* Technical Skills */}
        <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-800 mb-6 uppercase tracking-wider">Technical Skills</h3>
          <div className="flex flex-wrap gap-2">
            {['Python', 'Java', 'SQL', 'React JS', 'Node.js'].map((skill, idx) => (
              <span key={skill} className={`px-4 py-2 rounded-lg text-xs font-semibold ${idx === 3 ? 'bg-[#1162d4]/10 text-[#1162d4]' : 'bg-slate-100 text-slate-600'}`}>
                {skill}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Right Column - Trends & Status */}
      <div className="lg:col-span-4 space-y-8">
        {/* GPA Trend Mock */}
        <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider text-slate-900 leading-none">GPA Trend</h3>
            <span className="px-2 py-0.5 bg-blue-50 text-[#1162d4] rounded text-[9px] font-bold uppercase tracking-wider">B+ Average</span>
          </div>
          <div className="flex items-end justify-between h-24 gap-2 mb-4">
            {[35, 45, 100, 40].map((h, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <div 
                  className={`w-full rounded-md transition-all duration-1000 ${i === 2 ? 'bg-[#1162d4]' : 'bg-[#1162d4]/20'}`} 
                  style={{ height: `${h}%` }} 
                />
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">SEM{i+1}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Attendance Calendar Mock */}
        <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm">
           <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider">Attendance: June 2024</h3>
              <div className="flex gap-1">
                 <div className="w-2 h-2 rounded-full bg-green-500" />
                 <div className="w-2 h-2 rounded-full bg-red-400" />
              </div>
           </div>
           <div className="grid grid-cols-7 gap-2">
              {['M','T','W','T','F','S','S'].map(d => (
                <div key={d} className="text-center text-[9px] font-bold text-slate-300 py-1">{d}</div>
              ))}
              {Array.from({length: 21}).map((_, i) => (
                <div key={i} className={`aspect-square rounded-md border border-slate-50 transition-colors cursor-pointer ${
                  i === 15 ? 'bg-red-400' : 
                  i % 3 === 0 ? 'bg-green-100' : 
                  i % 2 === 0 ? 'bg-green-400' : 'bg-green-50'
                }`} />
              ))}
           </div>
        </div>

        {/* Academic Alert */}
        <div className="bg-[#1162d4]/5 border border-[#1162d4]/10 rounded-xl p-8 flex gap-4">
           <div className="w-10 h-10 bg-[#1162d4] rounded-lg flex items-center justify-center text-white shrink-0 shadow-lg shadow-[#1162d4]/10">
              <span className="material-symbols-outlined text-[20px]">info</span>
           </div>
           <div>
              <p className="text-xs font-semibold text-[#1162d4] uppercase tracking-wider mb-1">Academic Alert</p>
              <p className="text-xs font-medium text-[#1162d4]/80 leading-relaxed">
                {student.name} has successfully completed 85% of his credit requirements for the current year.
              </p>
           </div>
        </div>
      </div>
    </div>
  )
}

function AcademicsTab({ student, onUpdate }) {
  const [selectedSemester, setSelectedSemester] = useState('All')
  const [currentPage, setCurrentPage] = useState(1)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [newSubject, setNewSubject] = useState({ code: '', name: '', credits: 3, grade: 'A', total: 95, semester: student.semester || 1 })
  const itemsPerPage = 5

  const allSubjects = student.subjects || []
  const filteredSubjects = selectedSemester === 'All' 
    ? allSubjects 
    : allSubjects.filter(s => s.semester === parseInt(selectedSemester))

  const totalPages = Math.ceil(filteredSubjects.length / itemsPerPage)
  const paginatedSubjects = filteredSubjects.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const handleAddSubject = async (e) => {
    e.preventDefault();
    const updatedSubjects = [...allSubjects, { ...newSubject, id: Date.now() }];
    await onUpdate({ subjects: updatedSubjects });
    setIsAddModalOpen(false);
    setNewSubject({ code: '', name: '', credits: 3, grade: 'A', total: 95, semester: student.semester || 1 });
  };

  const handleDeleteSubject = async (subjectId) => {
    if (!confirm('Are you sure you want to delete this record?')) return;
    const updatedSubjects = allSubjects.filter(s => s.id !== subjectId);
    await onUpdate({ subjects: updatedSubjects });
  };

  // GPA Trend Data (Calculated from subjects)
  const gpaData = [1, 2, 3, 4, 5, 6, 7, 8].map(sem => {
    const semSubjects = allSubjects.filter(s => s.semester === sem);
    if (semSubjects.length === 0) return { semester: sem, gpa: 0 };
    const totalPoints = semSubjects.reduce((acc, s) => {
      const points = { 'A+': 10, 'A': 9, 'B+': 8, 'B': 7, 'C': 6, 'D': 5, 'F': 0 }[s.grade] || 0;
      return acc + (points * s.credits);
    }, 0);
    const totalCredits = semSubjects.reduce((acc, s) => acc + s.credits, 0);
    return { semester: sem, gpa: totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : 0 };
  }).filter(d => d.gpa > 0);

  const currentGPA = gpaData.length > 0 ? gpaData[gpaData.length - 1].gpa : '0.00';

  return (
    <div className="space-y-8 pb-12">
      {/* Top Stats and Analytics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* GPA Trend Chart Card */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-800">GPA Trend</h3>
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Performance across semesters</p>
            </div>
            <div className="text-right">
              <span className="block text-2xl font-black text-[#1162d4]">{currentGPA}</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Overall GPA</span>
            </div>
          </div>
          
          <div className="h-48 flex items-end justify-between gap-2 px-4 relative group/chart">
            {/* Simple SVG Line/Bar Chart Placeholder */}
            {gpaData.length > 0 ? (
              gpaData.map((data, idx) => (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 group/bar">
                  <div className="relative w-full flex justify-center items-end h-32">
                    <div 
                      className="w-10 bg-gradient-to-t from-[#1162d4] to-[#60a5fa] rounded-t-lg transition-all duration-500 group-hover/bar:brightness-110 relative"
                      style={{ height: `${(data.gpa / 10) * 100}%` }}
                    >
                       <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover/bar:opacity-100 transition-opacity whitespace-nowrap z-10">
                         GPA: {data.gpa}
                       </div>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Sem {data.semester}</span>
                </div>
              ))
            ) : (
              <div className="w-full h-full flex items-center justify-center border-2 border-dashed border-slate-100 rounded-xl">
                <p className="text-xs font-semibold text-slate-300 italic">Add semester data to view trends</p>
              </div>
            )}
          </div>
        </div>

        {/* Action Card */}
        <div className="bg-[#1162d4] rounded-2xl p-6 shadow-xl shadow-[#1162d4]/20 flex flex-col justify-between relative overflow-hidden text-white">
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
          <div>
            <h3 className="text-xl font-bold mb-2">Academic Actions</h3>
            <p className="text-white/70 text-sm leading-relaxed mb-6">Manage student records, generate transcripts, or update semester results.</p>
          </div>
          <div className="space-y-3">
            <button 
              onClick={() => setIsAddModalOpen(true)}
              className="w-full py-3 bg-white text-[#1162d4] rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-white/90 transition-all flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              Add New Record
            </button>
            <button 
              onClick={() => alert('Transcript generation in progress...')}
              className="w-full py-3 bg-white/10 border border-white/20 text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-white/20 transition-all flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">download</span>
              Export Transcript
            </button>
          </div>
        </div>
      </div>

      {/* Main Subjects Table Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-8 py-6 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-800 leading-none">Semester Records</h3>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mt-2">Detailed breakdown of subjects and grades</p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
              <span className="material-symbols-outlined text-[18px] text-slate-400">filter_alt</span>
              <select 
                value={selectedSemester} 
                onChange={(e) => { setSelectedSemester(e.target.value); setCurrentPage(1); }}
                className="bg-transparent text-xs font-bold text-slate-600 outline-none uppercase tracking-wider cursor-pointer"
              >
                <option value="All">All Semesters</option>
                {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Semester {s}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Code</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Subject Name</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Credits</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Grade</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Status</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedSubjects.length > 0 ? (
                paginatedSubjects.map((sub, idx) => (
                  <tr key={sub.id || idx} className="hover:bg-slate-50/30 transition-colors group">
                    <td className="px-8 py-5 text-sm font-bold text-[#1162d4]">{sub.code}</td>
                    <td className="px-8 py-5">
                       <span className="block text-sm font-bold text-slate-700">{sub.name}</span>
                       <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Semester {sub.semester}</span>
                    </td>
                    <td className="px-8 py-5 text-sm font-semibold text-slate-500">{sub.credits}</td>
                    <td className="px-8 py-5">
                      <span className={`inline-flex items-center justify-center w-9 h-9 rounded-lg text-sm font-black transition-transform group-hover:scale-110 ${
                        sub.grade.includes('A') ? 'bg-green-50 text-green-600' :
                        sub.grade.includes('B') ? 'bg-blue-50 text-blue-600' :
                        sub.grade.includes('F') ? 'bg-red-50 text-red-600' : 'bg-slate-50 text-slate-600'
                      }`}>
                        {sub.grade}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                        sub.grade !== 'F' ? 'bg-green-50 text-green-600 border-green-100' : 'bg-red-50 text-red-600 border-red-100'
                      }`}>
                        {sub.grade !== 'F' ? 'Cleared' : 'Failed'}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-right">
                       <button 
                        onClick={() => handleDeleteSubject(sub.id)}
                        className="p-2 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                       >
                         <span className="material-symbols-outlined text-[18px]">delete</span>
                       </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-8 py-16 text-center">
                     <span className="material-symbols-outlined text-4xl text-slate-200 mb-2">search_off</span>
                     <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No matching records found</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-8 py-4 bg-slate-50/30 border-t border-slate-100 flex items-center justify-between">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredSubjects.length)} of {filteredSubjects.length} subjects
            </p>
            <div className="flex gap-2">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 border border-slate-200 rounded-lg text-slate-400 hover:text-[#1162d4] disabled:opacity-30 disabled:hover:text-slate-400 transition-all"
              >
                <span className="material-symbols-outlined text-[18px]">chevron_left</span>
              </button>
              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 border border-slate-200 rounded-lg text-slate-400 hover:text-[#1162d4] disabled:opacity-30 disabled:hover:text-slate-400 transition-all"
              >
                <span className="material-symbols-outlined text-[18px]">chevron_right</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add Subject Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-800">Add Academic Record</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600"><span className="material-symbols-outlined">close</span></button>
            </div>
            <form onSubmit={handleAddSubject} className="p-6 space-y-4">
               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Subject Code</label>
                    <input 
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#1162d4]/10"
                      required value={newSubject.code} onChange={e => setNewSubject({...newSubject, code: e.target.value})} placeholder="e.g. CS201"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Semester</label>
                    <select 
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none"
                      value={newSubject.semester} onChange={e => setNewSubject({...newSubject, semester: parseInt(e.target.value)})}
                    >
                      {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Semester {s}</option>)}
                    </select>
                  </div>
               </div>
               <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Subject Name</label>
                <input 
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none"
                  required value={newSubject.name} onChange={e => setNewSubject({...newSubject, name: e.target.value})} placeholder="e.g. Data Structures"
                />
               </div>
               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Credits</label>
                    <input 
                      type="number" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none"
                      value={newSubject.credits} onChange={e => setNewSubject({...newSubject, credits: parseInt(e.target.value)})}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Grade</label>
                    <select 
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none"
                      value={newSubject.grade} onChange={e => setNewSubject({...newSubject, grade: e.target.value})}
                    >
                      {['A+','A','B+','B','C','D','F'].map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </div>
               </div>
               <button type="submit" className="w-full py-3 bg-[#1162d4] text-white rounded-xl text-xs font-bold uppercase tracking-widest shadow-lg shadow-[#1162d4]/20 hover:bg-[#1162d4]/90 transition-all mt-6">
                 Add Record
               </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}


function FeesTab({ student, onUpdate }) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newPayment, setNewPayment] = useState({ type: 'Tuition Fee', amount: '', method: 'Online' })

  const fees = student.fees || []
  const totalAmount = fees.reduce((s, f) => s + f.amount, 0)
  const totalPaid = fees.reduce((s, f) => s + f.paid || (f.status === 'Paid' ? f.amount : 0), 0)
  const totalDue = Math.max(0, totalAmount - totalPaid)

  const fmt = (n) => `₹${n.toLocaleString('en-IN')}`

  const handleAddPayment = () => {
    const payment = {
      id: Math.floor(1000 + Math.random() * 9000),
      ...newPayment,
      amount: parseFloat(newPayment.amount),
      date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
      status: 'Paid'
    }
    onUpdate({ ...student, fees: [...fees, payment] })
    setIsModalOpen(false)
    setNewPayment({ type: 'Tuition Fee', amount: '', method: 'Online' })
  }

  const handleDownloadInvoice = () => {
    alert('Generating Invoice for ' + student.name + '...\nSuccess! Invoice downloaded as mit_invoice_' + student.id + '.pdf')
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Left Column - Payment Ledger */}
      <div className="lg:col-span-8 space-y-8">
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider">Fee Payment Ledger</h3>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-[#1162d4] text-white rounded-lg text-xs font-semibold uppercase tracking-wider hover:bg-[#1162d4]/90 transition-all shadow-sm"
            >
               <span className="material-symbols-outlined text-[18px]">add</span>
               New Payment
            </button>
          </div>
          <div className="overflow-x-auto">
             <table className="w-full text-left border-collapse">
               <thead>
                 <tr className="bg-slate-50 text-slate-500 text-[10px] font-semibold uppercase tracking-wider border-b border-slate-200">
                   <th className="px-8 py-4">Transaction ID</th>
                   <th className="px-4 py-4">Fee Type</th>
                   <th className="px-4 py-4">Date</th>
                   <th className="px-4 py-4 text-right">Amount</th>
                   <th className="px-8 py-4 text-center">Status</th>
                 </tr>
               </thead>
                <tbody className="divide-y divide-slate-100">
                 {fees.map(f => (
                   <tr key={f.id} className="hover:bg-slate-50/50 transition-colors group">
                     <td className="px-8 py-5 text-sm font-medium text-slate-400 group-hover:text-slate-600 transition-colors">#{f.id}</td>
                     <td className="px-4 py-5 text-sm font-medium text-slate-800">{f.type}</td>
                     <td className="px-4 py-5 text-sm font-medium text-slate-500">{f.date}</td>
                     <td className="px-4 py-5 text-sm font-bold text-slate-900 text-right">{fmt(f.amount)}</td>
                     <td className="px-8 py-5 text-center">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                           f.status === 'Paid' ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-600'
                        }`}>
                           {f.status}
                        </span>
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
          </div>
        </div>

        {/* Payment History Notes */}
        <div className="bg-slate-50 rounded-xl p-8 border border-slate-100">
           <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider mb-4">Payment Remarks</h3>
           <div className="space-y-4">
              <div className="flex gap-4 p-4 bg-white rounded-xl border border-slate-100 shadow-sm">
                 <div className="w-10 h-10 bg-blue-50 text-[#1162d4] rounded-lg flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[18px]">sticky_note_2</span>
                 </div>
                 <p className="text-xs font-medium text-slate-500 leading-relaxed">
                   Next installment of ₹12,000 scheduled for July 15, 2024. Automated reminder has been sent to the guardian.
                 </p>
              </div>
           </div>
        </div>
      </div>

      {/* Right Column - Balance & Summary */}
      <div className="lg:col-span-4 space-y-8">
        {/* Outstanding Balance Card */}
        <div className="bg-[#1e293b] rounded-xl p-10 text-white relative overflow-hidden shadow-xl">
           <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16" />
           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Total Outstanding</p>
           <h4 className="text-5xl font-bold mb-10 tracking-tighter">{fmt(totalDue)}</h4>
           
           <div className="space-y-6 pt-10 border-t border-white/10">
              <div className="flex items-center justify-between">
                 <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Fees</span>
                 <span className="text-sm font-bold">{fmt(totalAmount)}</span>
              </div>
              <div className="flex items-center justify-between">
                 <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Paid Amount</span>
                 <span className="text-sm font-bold text-green-400">{fmt(totalPaid)}</span>
              </div>
              <div className="flex items-center justify-between">
                 <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Late Charges</span>
                 <span className="text-sm font-bold text-red-400">₹0.00</span>
              </div>
           </div>
           
           <button 
             onClick={handleDownloadInvoice}
             className="w-full mt-10 py-3 bg-[#1162d4] text-white rounded-lg text-xs font-semibold uppercase tracking-wider hover:bg-[#1162d4]/90 transition-all"
           >
              DOWNLOAD INVOICE (PDF)
           </button>
        </div>

        {/* Quick Payment Methods */}
        <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm">
           <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider mb-6">Payment Methods</h3>
           <div className="space-y-3">
              {['HDFC Bank Summary', 'Unified Payments (UPI)', 'Credit/Debit Cards'].map(method => (
                <div key={method} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100 hover:border-[#1162d4]/30 transition-all cursor-pointer group">
                   <span className="text-xs font-semibold text-slate-600 group-hover:text-slate-900">{method}</span>
                   <span className="material-symbols-outlined text-slate-300 group-hover:text-[#1162d4] text-[18px]">chevron_right</span>
                </div>
              ))}
           </div>
        </div>
      </div>

      {/* New Payment Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-8 py-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-800">Record New Payment</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-8 space-y-6">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Fee Type</label>
                <select 
                  value={newPayment.type}
                  onChange={(e) => setNewPayment({...newPayment, type: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-[#1162d4]/20"
                >
                  <option>Tuition Fee</option>
                  <option>Hostel Fee</option>
                  <option>Exam Fee</option>
                  <option>Library Fine</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Amount (₹)</label>
                <input 
                  type="number"
                  value={newPayment.amount}
                  onChange={(e) => setNewPayment({...newPayment, amount: e.target.value})}
                  placeholder="Enter amount"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-[#1162d4]/20"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Payment Method</label>
                <div className="grid grid-cols-2 gap-3">
                  {['Online', 'Cash'].map(m => (
                    <button 
                      key={m}
                      onClick={() => setNewPayment({...newPayment, method: m})}
                      className={`py-3 rounded-xl border text-xs font-bold transition-all ${
                        newPayment.method === m 
                          ? 'bg-[#1162d4]/10 border-[#1162d4] text-[#1162d4]' 
                          : 'bg-slate-50 border-slate-200 text-slate-400 hover:border-slate-300'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="px-8 py-6 bg-slate-50 border-t border-slate-100 flex gap-3">
              <button onClick={() => setIsModalOpen(false)} className="flex-1 py-3 text-xs font-bold text-slate-500 uppercase">Cancel</button>
              <button 
                onClick={handleAddPayment}
                disabled={!newPayment.amount}
                className="flex-[2] py-3 bg-[#1162d4] text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-lg shadow-[#1162d4]/20 hover:bg-[#1162d4]/90 transition-all disabled:opacity-50"
              >
                Confirm Payment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function DocumentsTab({ student, onUpdate }) {
  const [viewMode, setViewMode] = useState('grid')
  const docs = student.documents || []

  const handleDownload = (docName) => {
    alert('Downloading ' + docName + '...')
  }

  const handleDelete = (docId) => {
    if (confirm('Are you sure you want to delete this document?')) {
      const updatedDocs = docs.filter(d => d.id !== docId)
      onUpdate({ ...student, documents: updatedDocs })
    }
  }

  const formatDate = (dateStr) => {
    if (!dateStr || dateStr === 'Invalid Date') return 'N/A'
    try {
      const d = new Date(dateStr)
      if (isNaN(d.getTime())) return 'N/A'
      return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    } catch (e) {
      return 'N/A'
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Left Column - Category Cards and Helper */}
      <div className="lg:col-span-4 space-y-8">
        <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm">
           <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider mb-6">File Categories</h3>
           <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Academic', count: docs.filter(d => d.name.toLowerCase().includes('result') || d.name.toLowerCase().includes('certificate')).length, color: 'bg-blue-50 text-[#1162d4]', icon: 'school' },
                { label: 'Identity', count: docs.filter(d => d.name.toLowerCase().includes('id') || d.name.toLowerCase().includes('aadhar')).length, color: 'bg-green-50 text-green-600', icon: 'badge' },
                { label: 'Fees', count: docs.filter(d => d.name.toLowerCase().includes('fee') || d.name.toLowerCase().includes('receipt')).length, color: 'bg-purple-50 text-purple-600', icon: 'receipt_long' },
                { label: 'Others', count: docs.length, color: 'bg-slate-50 text-slate-400', icon: 'folder_open' }
              ].map(cat => (
                <div key={cat.label} className="p-4 rounded-xl border border-slate-50 bg-slate-50/30 hover:bg-white hover:border-[#1162d4]/20 transition-all cursor-pointer group">
                   <div className={`w-10 h-10 ${cat.color} rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                      <span className="material-symbols-outlined text-[20px]">{cat.icon}</span>
                   </div>
                   <p className="text-xs font-semibold text-slate-900 mb-0.5">{cat.label}</p>
                   <p className="text-[10px] font-semibold text-slate-300 uppercase tracking-wider">{cat.count} Files</p>
                </div>
              ))}
           </div>
        </div>

        {/* Upload Dropzone Preview */}
        <div onClick={() => alert('File Upload Portal Opening...')} className="bg-[#1162d4]/5 border-2 border-dashed border-[#1162d4]/20 rounded-xl p-10 flex flex-col items-center text-center group cursor-pointer hover:bg-[#1162d4]/10 transition-all">
           <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center text-[#1162d4] shadow-xl shadow-[#1162d4]/10 mb-6 group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-[32px]">cloud_upload</span>
           </div>
           <h4 className="text-sm font-semibold text-[#1162d4] uppercase tracking-wider mb-2">Upload New Media</h4>
           <p className="text-[10px] font-medium text-[#1162d4]/60 uppercase tracking-tight">Drag & drop or browse files</p>
        </div>
      </div>

      {/* Right Column - Document List */}
      <div className="lg:col-span-8 space-y-8">
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider">Document Storage</h3>
            <div className="flex bg-slate-50 border border-slate-200 p-1 rounded-lg">
               <button 
                 onClick={() => setViewMode('grid')}
                 className={`px-3 py-1.5 rounded-md text-[10px] font-semibold uppercase tracking-wider shadow-sm transition-all ${
                   viewMode === 'grid' ? 'bg-white text-[#1162d4]' : 'text-slate-400'
                 }`}
               >Grid View</button>
               <button 
                 onClick={() => setViewMode('list')}
                 className={`px-3 py-1.5 rounded-md text-[10px] font-semibold uppercase tracking-wider transition-all ${
                   viewMode === 'list' ? 'bg-white text-[#1162d4]' : 'text-slate-400'
                 }`}
               >List View</button>
            </div>
          </div>

          {viewMode === 'list' ? (
            <div className="overflow-x-auto">
               <table className="w-full text-left">
                 <thead>
                   <tr className="bg-slate-50 text-slate-500 text-[10px] font-semibold uppercase tracking-wider border-b border-slate-200">
                     <th className="px-8 py-4">Document Details</th>
                     <th className="px-4 py-4">Status</th>
                     <th className="px-4 py-4">Last Updated</th>
                     <th className="px-8 py-4 text-center">Actions</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100">
                   {docs.map(doc => (
                     <tr key={doc.id} className="hover:bg-slate-50/50 transition-colors group">
                       <td className="px-8 py-5">
                          <div className="flex items-center gap-4">
                             <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-500 group-hover:bg-[#1162d4]/10 group-hover:text-[#1162d4] transition-all">
                                <span className="material-symbols-outlined text-[20px]">{doc.type === 'pdf' ? 'picture_as_pdf' : 'description'}</span>
                             </div>
                             <div>
                                <p className="text-sm font-semibold text-slate-800">{doc.name}</p>
                                <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">{doc.size}</p>
                             </div>
                          </div>
                       </td>
                       <td className="px-4 py-5">
                          <div className="flex items-center gap-2">
                             <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                             <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Verified</span>
                          </div>
                       </td>
                       <td className="px-4 py-5 text-sm font-medium text-slate-500">
                          {formatDate(doc.uploadDate)}
                       </td>
                       <td className="px-8 py-5 text-center">
                          <div className="flex items-center justify-center gap-1">
                             <button onClick={() => handleDownload(doc.name)} className="p-2 text-slate-400 hover:text-[#1162d4] hover:bg-blue-50 rounded-lg transition-all">
                                <span className="material-symbols-outlined text-[18px]">download</span>
                             </button>
                             <button onClick={() => handleDelete(doc.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
                                <span className="material-symbols-outlined text-[18px]">delete</span>
                             </button>
                          </div>
                       </td>
                     </tr>
                   ))}
                   {docs.length === 0 && (
                     <tr>
                       <td colSpan="4" className="px-8 py-12 text-center text-slate-400 text-sm italic">No documents found.</td>
                     </tr>
                   )}
                 </tbody>
               </table>
            </div>
          ) : (
            <div className="p-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {docs.map(doc => (
                <div key={doc.id} className="p-4 border border-slate-100 rounded-xl hover:border-[#1162d4]/30 transition-all group relative">
                   <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400 group-hover:bg-[#1162d4]/10 group-hover:text-[#1162d4] transition-all">
                         <span className="material-symbols-outlined text-[24px]">{doc.type === 'pdf' ? 'picture_as_pdf' : 'description'}</span>
                      </div>
                      <div className="flex gap-1">
                         <button onClick={() => handleDownload(doc.name)} className="p-1.5 text-slate-300 hover:text-[#1162d4] transition-colors"><span className="material-symbols-outlined text-[18px]">download</span></button>
                         <button onClick={() => handleDelete(doc.id)} className="p-1.5 text-slate-300 hover:text-red-500 transition-colors"><span className="material-symbols-outlined text-[18px]">delete</span></button>
                      </div>
                   </div>
                   <h4 className="text-sm font-semibold text-slate-800 mb-1 truncate pr-16">{doc.name}</h4>
                   <div className="flex items-center justify-between">
                      <p className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">{doc.size}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{formatDate(doc.uploadDate)}</p>
                   </div>
                </div>
              ))}
              {docs.length === 0 && (
                <div className="col-span-full py-12 text-center text-slate-400 text-sm italic">No documents found.</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function StudentEditModal({ isOpen, onClose, student, onSave }) {
  const [formData, setFormData] = useState({ ...student });
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSave(formData);
      onClose();
    } catch (err) {
      alert('Failed to save changes: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="px-8 py-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-slate-800">Edit Student Profile</h3>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mt-1">Updating ID: {student.id}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[60vh] overflow-y-auto">
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Full Name</label>
              <input 
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-[#1162d4]/20"
                required
              />
            </div>
            
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Department</label>
              <select 
                name="department"
                value={formData.department}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-[#1162d4]/20"
              >
                <option>Computer Science Eng.</option>
                <option>Electrical Eng.</option>
                <option>Mechanical Eng.</option>
                <option>Civil Eng.</option>
                <option>Electronics Eng.</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Current Year</label>
              <select 
                name="year"
                value={formData.year}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-[#1162d4]/20"
              >
                <option value="1st">1st Year</option>
                <option value="2nd">2nd Year</option>
                <option value="3rd">3rd Year</option>
                <option value="4th">4th Year</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Current Semester</label>
              <input 
                type="number"
                name="semester"
                value={formData.semester}
                onChange={handleChange}
                min="1" max="8"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-[#1162d4]/20"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Admission Batch</label>
              <input 
                name="batch"
                value={formData.batch || ''}
                onChange={handleChange}
                placeholder="e.g. 2023-27"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-[#1162d4]/20"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Room / Section</label>
              <input 
                name="room"
                value={formData.room || ''}
                onChange={handleChange}
                placeholder="e.g. Block C, Room 402"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-[#1162d4]/20"
              />
            </div>
          </div>
          
          <div className="px-8 py-6 bg-slate-50 border-t border-slate-100 flex gap-3 justify-end">
            <button 
              type="button"
              onClick={onClose} 
              className="px-6 py-3 text-xs font-bold text-slate-500 uppercase hover:text-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={isSaving}
              className="px-8 py-3 bg-[#1162d4] text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-lg shadow-[#1162d4]/20 hover:bg-[#1162d4]/90 transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {isSaving && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              {isSaving ? 'Saving Changes...' : 'Save Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main Detail Page ────────────────────────────────────────────

const tabs = [
  { id: 'overview',  label: 'Overview',  icon: 'dashboard' },
  { id: 'academics', label: 'Academics', icon: 'school' },
  { id: 'fees',      label: 'Fees',      icon: 'payments' },
  { id: 'documents', label: 'Documents', icon: 'folder_open' },
]

export default function StudentDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('overview')
  const [student, setStudent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showQuickActions, setShowQuickActions] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  const loadData = () => {
    setLoading(true)
    fetchStudentById(decodeURIComponent(id)).then(data => {
      setStudent(data)
      setLoading(false)
    })
  }

  useEffect(() => {
    loadData()
  }, [id])

  const handleUpdate = async (updatedData) => {
    try {
      const { updateStudent } = await import('../api/studentsApi')
      await updateStudent(student.id, updatedData)
      loadData()
    } catch (err) {
      alert('Failed to update student: ' + err.message)
      throw err;
    }
  }

  if (loading) {
    return (
      <DashboardLayout title="Loading..." showProfileHeader={false}>
        <div className="flex items-center justify-center py-24">
          <p className="text-slate-500">Loading student data...</p>
        </div>
      </DashboardLayout>
    )
  }

  if (!student) {
    return (
      <DashboardLayout title="Student Not Found" showProfileHeader={false}>
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <span className="material-symbols-outlined text-6xl text-slate-300 mb-4">person_off</span>
          <h2 className="text-xl font-bold text-slate-700 mb-2">Student Not Found</h2>
          <p className="text-sm text-slate-500 mb-6">No student record exists with ID "{decodeURIComponent(id)}"</p>
          <button
            onClick={() => navigate('/students')}
            className="px-5 py-2.5 bg-[#2563eb] text-white rounded-lg text-sm font-semibold hover:bg-[#1d4ed8] transition-all"
          >
            Back to Students
          </button>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout 
      title={`Students / ${student.name}`} 
      showProfileHeader={false}
    >
      {/* Top Navigation Row */}
      <div className="flex items-center justify-between mb-8">
        <button 
          onClick={() => navigate('/students')}
          className="flex items-center gap-2.5 px-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-500 hover:text-[#1162d4] hover:border-[#1162d4] transition-all group uppercase tracking-wider"
        >
          <span className="material-symbols-outlined text-[18px] group-hover:-translate-x-1 transition-transform">arrow_back</span>
          <span>Back to Students</span>
        </button>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-100 rounded-lg">
             <div className="w-1.5 h-1.5 bg-[#1162d4] rounded-full animate-pulse" />
             <span className="text-[10px] font-bold text-[#1162d4] uppercase tracking-wider">Active Session</span>
          </div>
          <div className="flex items-center gap-3 border-l border-slate-200 pl-4">
            <div className="text-right hidden md:block">
              <span className="block text-sm font-bold text-slate-900 leading-none">Admin Control</span>
              <span className="block text-[10px] font-medium text-slate-400 uppercase tracking-wider mt-1">Super User</span>
            </div>
            <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 border border-slate-200 shadow-sm">
              <span className="material-symbols-outlined text-[18px]">person</span>
            </div>
          </div>
        </div>
      </div>

      {/* Premium Profile Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm mb-8 relative group">
        {/* Isolated background decorations container */}
        <div className="absolute inset-0 overflow-hidden rounded-xl pointer-events-none">
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-slate-50 rounded-full opacity-50 group-hover:scale-125 transition-transform duration-1000" />
          <div className="absolute top-1/2 -right-12 w-32 h-32 bg-blue-50/30 rounded-full blur-3xl" />
        </div>
        
        <div className="relative flex flex-col xl:flex-row xl:items-center justify-between gap-10 z-10">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-8">
            <div className="relative">
              <div className="w-32 h-32 rounded-xl p-1 bg-gradient-to-br from-[#1162d4] to-[#60a5fa] shadow-xl">
                <img
                  src={student.avatar}
                  alt={student.name}
                  className="w-full h-full rounded-lg object-cover border-2 border-white"
                />
              </div>
              <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md">
                <div className="w-5 h-5 bg-green-500 rounded-full border-2 border-white" />
              </div>
            </div>
            
            <div className="text-center sm:text-left">
              <div className="flex flex-col sm:flex-row items-center gap-3 mb-3">
                <h2 className="text-3xl font-bold text-slate-900 tracking-tight leading-none">{student.name}</h2>
                <span className="px-2.5 py-0.5 bg-blue-50 text-[#1162d4] border border-blue-100 rounded-full text-[10px] font-bold uppercase tracking-wider mt-1 sm:mt-0">
                  {student.id}
                </span>
              </div>
              
              <div className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-2">
                  <span className="text-base font-semibold text-slate-600">{student.department}</span>
                  <span className="w-1 h-1 rounded-full bg-slate-300 hidden sm:block" />
                  <span className="text-base font-semibold text-slate-400">Semester {student.semester}</span>
                </div>
                
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-5 mt-2">
                   <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                      <span className="material-symbols-outlined text-[20px] text-slate-300">school</span>
                      <span className="uppercase tracking-wide">{student.year} Year</span>
                   </div>
                   <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                      <span className="material-symbols-outlined text-[20px] text-slate-300">location_on</span>
                      <span className="uppercase tracking-wide">{student.room || 'Block C, Room 402'}</span>
                   </div>
                   <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                      <span className="material-symbols-outlined text-[20px] text-slate-300">event_available</span>
                      <span className="uppercase tracking-wide">Batch {student.batch || '2023-27'}</span>
                   </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 relative">
            <button 
              id="quick-action-btn"
              onClick={() => setShowQuickActions(!showQuickActions)}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#1162d4] text-white rounded-xl text-sm font-semibold hover:bg-[#1162d4]/90 transition-all active:scale-95 shadow-lg shadow-[#1162d4]/20 z-20"
            >
              <span className="material-symbols-outlined text-[20px]">bolt</span>
              <span>Quick Action</span>
              <span className={`material-symbols-outlined text-[18px] transition-transform duration-300 ${showQuickActions ? 'rotate-180' : ''}`}>expand_more</span>
            </button>
            
            {showQuickActions && (
              <>
                {/* Mobile Backdrop */}
                <div 
                  className="fixed inset-0 bg-slate-900/20 backdrop-blur-[2px] z-40 sm:hidden animate-in fade-in duration-300"
                  onClick={() => setShowQuickActions(false)}
                />
                
                <div className="fixed sm:absolute bottom-6 left-6 right-6 sm:bottom-auto sm:left-auto sm:top-full sm:right-0 sm:mt-3 w-auto sm:w-64 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 p-2.5 animate-in fade-in slide-in-from-bottom-4 sm:slide-in-from-top-2 duration-300">
                  <div className="px-4 py-2 mb-1 sm:hidden border-b border-slate-50">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Select Action</p>
                  </div>
                  
                  <button 
                    onClick={() => { setShowQuickActions(false); window.location.href = `mailto:${student.email}`; }} 
                    className="w-full flex items-center gap-3 px-4 py-3.5 sm:py-2.5 text-sm sm:text-xs font-semibold text-slate-600 hover:bg-blue-50 hover:text-[#1162d4] rounded-xl transition-all group"
                  >
                    <div className="w-8 h-8 sm:w-7 sm:h-7 bg-slate-50 group-hover:bg-white rounded-lg flex items-center justify-center transition-colors">
                      <span className="material-symbols-outlined text-[18px]">mail</span>
                    </div>
                    <span>Send Email</span>
                  </button>
                  
                  <button 
                    onClick={() => { setShowQuickActions(false); alert('Attendance Marked for Today!'); }} 
                    className="w-full flex items-center gap-3 px-4 py-3.5 sm:py-2.5 text-sm sm:text-xs font-semibold text-slate-600 hover:bg-green-50 hover:text-green-600 rounded-xl transition-all group"
                  >
                    <div className="w-8 h-8 sm:w-7 sm:h-7 bg-slate-50 group-hover:bg-white rounded-lg flex items-center justify-center transition-colors">
                      <span className="material-symbols-outlined text-[18px]">fact_check</span>
                    </div>
                    <span>Mark Attendance</span>
                  </button>
                  
                  <div className="h-px bg-slate-100 my-1.5" />
                  
                  <button 
                    onClick={() => { setShowQuickActions(false); alert('Profile Locked'); }} 
                    className="w-full flex items-center gap-3 px-4 py-3.5 sm:py-2.5 text-sm sm:text-xs font-semibold text-slate-600 hover:bg-red-50 hover:text-red-600 rounded-xl transition-all group"
                  >
                    <div className="w-8 h-8 sm:w-7 sm:h-7 bg-slate-50 group-hover:bg-white rounded-lg flex items-center justify-center transition-colors">
                      <span className="material-symbols-outlined text-[18px]">lock</span>
                    </div>
                    <span>Lock Profile</span>
                  </button>

                  <button 
                    onClick={() => setShowQuickActions(false)}
                    className="w-full mt-2 py-3 bg-slate-100 text-slate-500 rounded-xl text-xs font-bold uppercase tracking-wider sm:hidden"
                  >
                    Close
                  </button>
                </div>
              </>
            )}

            <button onClick={() => window.print()} className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-all shadow-sm">
              <span className="material-symbols-outlined text-[20px]">description</span>
              <span className="hidden xs:inline">Report</span>
            </button>
            <button 
              onClick={() => setIsEditModalOpen(true)}
              className="p-2.5 bg-white border border-slate-200 text-slate-400 rounded-xl hover:text-[#1162d4] hover:border-[#1162d4] transition-all shadow-sm group/edit"
            >
              <span className="material-symbols-outlined text-[20px] group-hover/edit:rotate-12 transition-transform">edit</span>
            </button>
          </div>
        </div>
      </div>

      {/* Underlined Tab Navigation */}
      <div className="flex items-center gap-8 border-b border-slate-200 mb-8 px-4">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`pb-4 text-sm font-semibold transition-all relative ${
              activeTab === tab.id
                ? 'text-[#1162d4]'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            {tab.label}
            {activeTab === tab.id && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#1162d4] rounded-t-full" />
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        {activeTab === 'overview' && <OverviewTab student={student} onUpdate={handleUpdate} />}
        {activeTab === 'academics' && <AcademicsTab student={student} onUpdate={handleUpdate} />}
        {activeTab === 'fees' && <FeesTab student={student} onUpdate={handleUpdate} />}
        {activeTab === 'documents' && <DocumentsTab student={student} onUpdate={handleUpdate} />}
      </div>

      {/* Profile Edit Modal */}
      <StudentEditModal 
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        student={student}
        onSave={handleUpdate}
      />
    </DashboardLayout>
  )
}
