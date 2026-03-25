import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

// ─── Tab Components ──────────────────────────────────────────────

function OverviewTab({ student, onEdit }) {
  const admissionDate = student.enrollDate ? new Date(student.enrollDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A';
  const skills = student.skills || ['Python', 'Java', 'SQL', 'React JS', 'Node.js'];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 relative">
      {/* Left Column - Core Info */}
      <div className="lg:col-span-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Contact Information */}
          <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-3 mb-6 uppercase tracking-wider">
              <span className="material-symbols-outlined text-[#1162d4] text-[20px]">contact_page</span>
              Contact Information
            </h3>
            <div className="space-y-5">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Phone Number</p>
                <p className="text-sm font-medium text-slate-700">{student.phone || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Personal Email</p>
                <p className="text-sm font-medium text-slate-700">{student.email || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Permanent Address</p>
                <p className="text-sm font-medium text-slate-700 leading-relaxed">{student.address || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Family Details */}
          <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-3 mb-6 uppercase tracking-wider">
              <span className="material-symbols-outlined text-[#1162d4] text-[20px]">family_restroom</span>
              Family Details
            </h3>
            <div className="space-y-5">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Father's Name</p>
                <p className="text-sm font-medium text-slate-700">{student.guardian || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Mother's Name</p>
                <p className="text-sm font-medium text-slate-700">{student.motherName || 'Not Specified'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Guardian Contact</p>
                <p className="text-sm font-medium text-slate-700">{student.guardianPhone || 'N/A'}</p>
              </div>
            </div>
          </div>
        </div>

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
                  <p className="text-sm font-medium text-slate-700">{admissionDate}</p>
               </div>
            </div>
            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
               <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-red-500 shadow-sm">
                  <span className="material-symbols-outlined text-[20px]">bloodtype</span>
               </div>
               <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Blood Group</p>
                  <p className="text-sm font-medium text-slate-700">{student.bloodGroup || 'Not Set'}</p>
               </div>
            </div>
            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
               <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-green-500 shadow-sm">
                  <span className="material-symbols-outlined text-[20px]">task_alt</span>
               </div>
               <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Attendance</p>
                  <p className="text-sm font-medium text-slate-700">{student.attendancePct || 0}%</p>
               </div>
            </div>
          </div>
        </div>

        {/* Technical Skills */}
        <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-800 mb-6 uppercase tracking-wider">Technical Skills</h3>
          <div className="flex flex-wrap gap-2">
            {skills.map((skill, idx) => (
              <span key={skill} className={`px-4 py-2 rounded-lg text-xs font-semibold ${idx % 2 === 0 ? 'bg-[#1162d4]/10 text-[#1162d4]' : 'bg-slate-100 text-slate-600'}`}>
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
  );
}

function EditOverviewModal({ isOpen, onClose, onSave, student }) {
  const [formData, setFormData] = useState({
    phone: student.phone || '',
    email: student.email || '',
    address: student.address || '',
    guardian: student.guardian || '',
    motherName: student.motherName || '',
    guardianPhone: student.guardianPhone || '',
    enrollDate: student.enrollDate ? new Date(student.enrollDate).toISOString().split('T')[0] : '',
    bloodGroup: student.bloodGroup || '',
    skills: (student.skills || []).join(', ')
  });

  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const skillsArray = formData.skills.split(',').map(s => s.trim()).filter(s => s !== '');
      const studentId = student.rollNumber || student.id;
      if (!studentId) {
        alert('Error: Cannot determine student ID for update.');
        setSaving(false);
        return;
      }
      const updatePayload = {
        phone: formData.phone,
        email: formData.email,
        address: formData.address,
        guardian: formData.guardian,
        motherName: formData.motherName,
        guardianPhone: formData.guardianPhone,
        enrollDate: formData.enrollDate,
        bloodGroup: formData.bloodGroup,
        skills: skillsArray
      };
      console.log('[EditOverviewModal] PUT /api/students/' + encodeURIComponent(studentId), updatePayload);
      const res = await fetch(`/api/students/${encodeURIComponent(studentId)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatePayload)
      });
      if (!res.ok) {
        let errorDetail = `HTTP ${res.status}`;
        try {
          const errBody = await res.json();
          errorDetail = errBody.detail || JSON.stringify(errBody);
        } catch (_) {
          errorDetail += ': ' + (res.statusText || 'Unknown error');
        }
        throw new Error(errorDetail);
      }
      const updatedData = await res.json();
      console.log('[EditOverviewModal] Update successful:', updatedData);
      alert('Profile updated successfully!');
      onSave();
    } catch (err) {
      console.error('[EditOverviewModal] Update failed:', err);
      alert('Failed to update profile.\n\nDetails: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
       <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden border border-slate-200 lg:max-h-[90vh] flex flex-col">
          <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
             <h3 className="text-lg font-bold text-slate-800 flex items-center gap-3">
                <span className="material-symbols-outlined text-[#1162d4]">edit_note</span>
                Edit Student Overview
             </h3>
             <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <span className="material-symbols-outlined text-slate-400 text-[20px]">close</span>
             </button>
          </div>
          
          <div className="p-8 space-y-8 overflow-y-auto">
             {/* Contact Section */}
             <div className="space-y-4">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-l-2 border-[#1162d4] pl-3">Contact Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Phone Number</label>
                      <input 
                        type="text" 
                        value={formData.phone} 
                        onChange={e => setFormData({...formData, phone: e.target.value})}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-[#1162d4] transition-all font-medium"
                      />
                   </div>
                   <div className="space-y-1.5">
                     <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Personal Email</label>
                     <input 
                       type="email" 
                       value={formData.email} 
                       onChange={e => setFormData({...formData, email: e.target.value})}
                       className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-[#1162d4] transition-all font-medium"
                     />
                   </div>
                   <div className="md:col-span-2 space-y-1.5">
                     <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Permanent Address</label>
                     <textarea 
                       rows="2"
                       value={formData.address} 
                       onChange={e => setFormData({...formData, address: e.target.value})}
                       className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-[#1162d4] transition-all font-medium resize-none"
                     />
                   </div>
                </div>
             </div>

             {/* Family Section */}
             <div className="space-y-4">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-l-2 border-[#1162d4] pl-3">Family Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                   <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Father's Name</label>
                      <input 
                        type="text" 
                        value={formData.guardian} 
                        onChange={e => setFormData({...formData, guardian: e.target.value})}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-[#1162d4] transition-all font-medium"
                      />
                   </div>
                   <div className="space-y-1.5">
                     <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Mother's Name</label>
                     <input 
                       type="text" 
                       value={formData.motherName} 
                       onChange={e => setFormData({...formData, motherName: e.target.value})}
                       className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-[#1162d4] transition-all font-medium"
                     />
                   </div>
                   <div className="space-y-1.5">
                     <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Guardian Contact</label>
                     <input 
                       type="text" 
                       value={formData.guardianPhone} 
                       onChange={e => setFormData({...formData, guardianPhone: e.target.value})}
                       className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-[#1162d4] transition-all font-medium"
                     />
                   </div>
                </div>
             </div>

             {/* Academic & Skills Section */}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                   <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-l-2 border-red-400 pl-3">Academic Info</h4>
                   <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                         <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Admission Date</label>
                         <input 
                           type="date" 
                           value={formData.enrollDate} 
                           onChange={e => setFormData({...formData, enrollDate: e.target.value})}
                           className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-[#1162d4] transition-all font-medium"
                         />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Blood Group</label>
                        <select 
                          value={formData.bloodGroup} 
                          onChange={e => setFormData({...formData, bloodGroup: e.target.value})}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-[#1162d4] transition-all font-medium cursor-pointer"
                        >
                          <option value="">Select</option>
                          {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(bg => <option key={bg} value={bg}>{bg}</option>)}
                        </select>
                      </div>
                   </div>
                </div>

                <div className="space-y-4">
                   <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-l-2 border-green-400 pl-3">Technical Skills</h4>
                   <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Skills (Comma separated)</label>
                      <input 
                        type="text" 
                        placeholder="e.g., Python, React, SQL"
                        value={formData.skills} 
                        onChange={e => setFormData({...formData, skills: e.target.value})}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-[#1162d4] transition-all font-medium"
                      />
                   </div>
                </div>
             </div>
          </div>

          <div className="p-8 bg-slate-50 border-t border-slate-100 flex gap-4 shrink-0">
             <button onClick={onClose} disabled={saving} className="flex-1 px-4 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl text-[10px] font-bold uppercase tracking-wider hover:bg-slate-50 transition-all active:scale-95 disabled:opacity-50">Cancel</button>
             <button 
               onClick={handleSubmit}
               disabled={saving}
               className="flex-1 px-4 py-3 bg-[#1162d4] text-white rounded-xl text-[10px] font-bold uppercase tracking-wider hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
             >
               <span className="material-symbols-outlined text-base">{saving ? 'hourglass_top' : 'save'}</span>
               {saving ? 'Saving...' : 'Save Changes'}
             </button>
          </div>
       </div>
    </div>
  );
}


function SubjectRow({ sub, studentId, onUpdate }) {
  const [isUpdating, setIsUpdating] = useState(false);

  const handleChange = async (field, value) => {
    setIsUpdating(true);
    await onUpdate(sub.code, field, value);
    setIsUpdating(false);
  };

  return (
    <tr className="hover:bg-slate-50/80 transition-all group">
      <td className="px-8 py-5 text-sm font-medium text-slate-500 italic">
        Sem {sub.semester}
      </td>
      <td className="px-4 py-5 text-sm font-medium text-slate-400 uppercase tracking-tight">{sub.code}</td>
      <td className="px-4 py-5 text-sm font-semibold text-slate-800">{sub.name}</td>
      <td className="px-4 py-5 text-sm font-medium text-slate-500">4.0</td>
      <td className="px-4 py-5">
        <select 
          value={sub.grade}
          onChange={(e) => handleChange('grade', e.target.value)}
          disabled={isUpdating}
          className="bg-transparent text-sm font-bold text-slate-900 outline-none cursor-pointer hover:text-[#1162d4] transition-colors"
        >
          {['A+','A','B+','B','C+','C','D','F','Pending'].map(g => (
            <option key={g} value={g}>{g}</option>
          ))}
        </select>
      </td>
      <td className="px-8 py-5 text-center">
        <select 
          value={sub.status || (sub.grade === 'Pending' ? 'In Progress' : 'Passed')}
          onChange={(e) => handleChange('status', e.target.value)}
          disabled={isUpdating}
          className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider shadow-sm outline-none cursor-pointer transition-all ${
            sub.status === 'Passed' ? 'bg-green-50 text-green-600 border border-green-100' :
            sub.status === 'In Progress' ? 'bg-orange-50 text-orange-600 border border-orange-100' :
            'bg-slate-50 text-slate-500 border border-slate-100'
          }`}
        >
          {['Passed', 'Failed', 'In Progress'].map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </td>
    </tr>
  );
}

function AddAcademicRecordModal({ isOpen, onClose, onSave, studentId }) {
  const [formData, setFormData] = useState({
    semester: '',
    code: '',
    name: '',
    credits: '4.0',
    grade: 'A',
    status: 'Passed'
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
       <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-200">
          <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
             <h3 className="text-lg font-bold text-slate-800">Add Academic Record</h3>
             <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <span className="material-symbols-outlined text-slate-400 text-[20px]">close</span>
             </button>
          </div>
          <div className="p-8 space-y-6">
             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                   <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Semester</label>
                   <select 
                     value={formData.semester} 
                     onChange={e => setFormData({...formData, semester: e.target.value})}
                     className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-[#1162d4] transition-all font-medium"
                   >
                     <option value="">Select</option>
                     {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s.toString()}>Sem {s}</option>)}
                   </select>
                </div>
                <div className="space-y-2">
                   <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Credits</label>
                   <input 
                     type="text" 
                     value={formData.credits} 
                     onChange={e => setFormData({...formData, credits: e.target.value})}
                     className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-[#1162d4] transition-all font-medium"
                   />
                </div>
             </div>
             
             <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Subject Code</label>
                <input 
                  type="text" 
                  placeholder="e.g., CS105"
                  value={formData.code} 
                  onChange={e => setFormData({...formData, code: e.target.value})}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-[#1162d4] transition-all font-medium"
                />
             </div>

             <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Subject Name</label>
                <input 
                  type="text" 
                  placeholder="e.g., Database Management"
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-[#1162d4] transition-all font-medium"
                />
             </div>

             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                   <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Grade</label>
                   <select 
                     value={formData.grade} 
                     onChange={e => setFormData({...formData, grade: e.target.value})}
                     className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-[#1162d4] transition-all font-medium"
                   >
                     {['A+','A','B+','B','C+','C','D','F','Pending'].map(g => <option key={g} value={g}>{g}</option>)}
                   </select>
                </div>
                <div className="space-y-2">
                   <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Status</label>
                   <select 
                     value={formData.status} 
                     onChange={e => setFormData({...formData, status: e.target.value})}
                     className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-[#1162d4] transition-all font-medium"
                   >
                     {['Passed','Failed','In Progress'].map(s => <option key={s} value={s}>{s}</option>)}
                   </select>
                </div>
             </div>
          </div>
          <div className="p-8 bg-slate-50 border-t border-slate-100 flex gap-3">
             <button onClick={onClose} className="flex-1 px-4 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl text-[10px] font-bold uppercase tracking-wider hover:bg-slate-50 transition-all active:scale-95">Cancel</button>
             <button 
               onClick={async () => {
                 try {
                   const res = await fetch(`/api/students/${studentId}/subjects`, {
                     method: 'POST',
                     headers: { 'Content-Type': 'application/json' },
                     body: JSON.stringify({
                       ...formData,
                       semester: parseInt(formData.semester),
                       credits: parseFloat(formData.credits) || 4.0,
                       total: 0 // New records start at 0
                     })
                   });
                   if (!res.ok) throw new Error('Failed to save record');
                   const savedRecord = await res.json();
                   onSave(savedRecord);
                 } catch (err) {
                   alert('Error: ' + err.message);
                 }
               }}
               className="flex-1 px-4 py-3 bg-[#1162d4] text-white rounded-xl text-[10px] font-bold uppercase tracking-wider hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 active:scale-95"
             >
               Add Record
             </button>
          </div>
       </div>
    </div>
  )
}

function AcademicsTab({ student, onRefresh }) {
  const [semesterFilter, setSemesterFilter] = useState('All')
  const [currentPage, setCurrentPage] = useState(1)
  const [isAddRecordModalOpen, setIsAddRecordModalOpen] = useState(false)
  const itemsPerPage = 8

  const allSubjects = student.subjects || []
  const filteredSubjects = semesterFilter === 'All' 
    ? allSubjects 
    : allSubjects.filter(s => s.semester?.toString() === semesterFilter)

  const totalPages = Math.ceil(filteredSubjects.length / itemsPerPage)
  const currentSubjects = filteredSubjects.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const passedSubjects = allSubjects.filter(s => s.grade !== 'Pending')
  const totalObtained = passedSubjects.reduce((s, sub) => s + (sub.total || 0), 0)
  const totalMax = passedSubjects.length * 100
  const calcCGPA = totalMax > 0 ? ((totalObtained / totalMax) * 10).toFixed(2) : '0.00'

  const handleUpdateSubject = async (subjectCode, field, value) => {
    const updatedSubjects = allSubjects.map(s => 
      s.code === subjectCode ? { ...s, [field]: value } : s
    );
    try {
      const res = await fetch(`/api/students/${student.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subjects: updatedSubjects })
      });
      if (!res.ok) throw new Error('Failed to update student');
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Error updating subject:', err);
      alert('Failed to update: ' + err.message);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Left Column - Grades Table */}
      <div className="lg:col-span-8 space-y-8">
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="px-8 py-6 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-50 text-[#1162d4] rounded-xl flex items-center justify-center shadow-inner">
                 <span className="material-symbols-outlined text-[24px]">school</span>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider">Semester Outcomes</h3>
                <p className="text-[10px] text-slate-400 font-medium uppercase mt-1">Official Academic Record</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setIsAddRecordModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-[#1162d4] text-white rounded-lg text-[10px] font-bold uppercase tracking-wider hover:bg-blue-700 transition-all shadow-md active:scale-95"
              >
                <span className="material-symbols-outlined text-[18px]">add_circle</span>
                Add Record
              </button>
              <button 
                onClick={() => alert('Generating Provisional Transcript...')}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg text-[10px] font-bold uppercase tracking-wider hover:bg-slate-50 transition-all shadow-sm active:scale-95"
              >
                <span className="material-symbols-outlined text-[18px] text-[#1162d4]">description</span>
                Download Transcript
              </button>
              <select 
                value={semesterFilter}
                onChange={(e) => {setSemesterFilter(e.target.value); setCurrentPage(1);}}
                className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-bold text-slate-500 uppercase tracking-wider outline-none cursor-pointer"
              >
                <option value="All">All Semesters</option>
                {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                  <option key={s} value={s.toString()}>Semester {s}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="overflow-x-auto">
             <table className="w-full text-left border-collapse">
               <thead>
                 <tr className="bg-slate-50 text-slate-500 text-[10px] font-semibold uppercase tracking-wider border-b border-slate-200">
                   <th className="px-8 py-4">Semester</th>
                   <th className="px-4 py-4">Subject Code</th>
                   <th className="px-4 py-4">Subject Name</th>
                   <th className="px-4 py-4">Credits</th>
                   <th className="px-4 py-4">Grade</th>
                   <th className="px-8 py-4 text-center">Status</th>
                 </tr>
               </thead>
                <tbody className="divide-y divide-slate-100">
                  {currentSubjects.length > 0 ? currentSubjects.map(sub => (
                    <SubjectRow key={sub.code} sub={sub} studentId={student.id} onUpdate={handleUpdateSubject} />
                  )) : (
                    <tr>
                      <td colSpan="6" className="px-8 py-10 text-center text-slate-400 text-sm font-medium italic">
                        No subjects found for this selection.
                      </td>
                    </tr>
                  )}
                </tbody>
             </table>
          </div>
          <div className="px-8 py-6 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-100">
             <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
               Showing {filteredSubjects.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}-{Math.min(filteredSubjects.length, currentPage * itemsPerPage)} of {filteredSubjects.length} subjects
             </p>
             <div className="flex items-center gap-1.5">
                <button 
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => p - 1)}
                  className={`w-8 h-8 flex items-center justify-center bg-white border border-slate-200 rounded-lg transition-all ${currentPage === 1 ? 'text-slate-200' : 'text-slate-500 hover:text-slate-900 hover:border-slate-300'}`}
                >
                  <span className="material-symbols-outlined text-[20px]">chevron_left</span>
                </button>
                {Array.from({length: totalPages}).map((_, i) => (
                  <button 
                    key={i}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`w-8 h-8 flex items-center justify-center rounded-lg font-semibold text-xs border transition-all ${currentPage === i + 1 ? 'bg-[#1162d4] border-[#1162d4] text-white shadow-sm' : 'bg-white border-slate-200 text-slate-500 hover:text-slate-900'}`}
                  >
                    {i + 1}
                  </button>
                ))}
                <button 
                  disabled={currentPage === totalPages || totalPages === 0}
                  onClick={() => setCurrentPage(p => p + 1)}
                  className={`w-8 h-8 flex items-center justify-center bg-white border border-slate-200 rounded-lg transition-all ${currentPage === totalPages || totalPages === 0 ? 'text-slate-200' : 'text-slate-500 hover:text-slate-900 hover:border-slate-300'}`}
                >
                  <span className="material-symbols-outlined text-[20px]">chevron_right</span>
                </button>
             </div>
          </div>
        </div>

        <AddAcademicRecordModal 
          isOpen={isAddRecordModalOpen}
          onClose={() => setIsAddRecordModalOpen(false)}
          studentId={student.id}
          onSave={(newRecord) => {
            setIsAddRecordModalOpen(false);
            if (onRefresh) onRefresh();
            setSemesterFilter(newRecord.semester.toString());
          }}
        />
      </div>

      {/* Right Column - Charts & Awards */}
      <div className="lg:col-span-4 space-y-8">
        {/* Credits Overview Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm flex flex-col items-center">
          <h3 className="text-sm font-semibold text-slate-800 self-start uppercase tracking-wider mb-8">Credits Overview</h3>
          <div className="relative w-48 h-48 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="54" stroke="#e2e8f0" strokeWidth="12" fill="none" />
              <circle
                cx="60" cy="60" r="54"
                stroke="#1162d4" strokeWidth="12" fill="none"
                strokeLinecap="round"
                strokeDasharray={`${((passedSubjects.length * 4) / 145) * 339} ${339}`}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
               <p className="text-4xl font-bold text-slate-900 leading-none">{passedSubjects.length * 4}</p>
               <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mt-1">of 145 Earned</p>
            </div>
          </div>
          <div className="grid grid-cols-2 w-full gap-4 mt-8 border-t border-slate-100 pt-8">
             <div className="text-center">
                <p className="text-lg font-bold text-[#1162d4]">{calcCGPA}</p>
                <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Calculated CGPA</p>
             </div>
             <div className="text-center">
                <p className="text-lg font-bold text-slate-800">{student.department === 'Computer Science' ? 'CS Eng.' : student.department || 'N/A'}</p>
                <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Major</p>
             </div>
          </div>
        </div>

        {/* Academic Distinctions */}
        <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm">
           <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider mb-6">Academic Distinctions</h3>
           <div className="space-y-4">
              {[
                { title: "Dean's List - Sem 2", desc: "Top 5% of class performance", color: "bg-blue-50 text-[#1162d4]", icon: "military_tech" },
                { title: "Smart Hackathon Runner-up", desc: "National Level Competition 2023", color: "bg-purple-50 text-purple-600", icon: "emoji_events" },
                { title: "Google Cloud Certification", desc: "Associate Cloud Engineer", color: "bg-slate-50 text-slate-600", icon: "verified" }
              ].map(item => (
                <div key={item.title} className="flex gap-4 p-4 rounded-xl border border-slate-50 hover:border-slate-100 transition-all hover:shadow-sm cursor-pointer group">
                   <div className={`w-10 h-10 ${item.color} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform`}>
                      <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                   </div>
                   <div>
                      <p className="text-sm font-semibold text-slate-800 leading-tight">{item.title}</p>
                      <p className="text-[10px] font-medium text-slate-400 mt-1 uppercase tracking-tight">{item.desc}</p>
                   </div>
                </div>
              ))}
           </div>
        </div>
      </div>
    </div>
  )
}

function FeesTab({ student, onStudentUpdate }) {
  const [fees, setFees] = useState(student.fees || [])
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [isEditOverviewModalOpen, setIsEditOverviewModalOpen] = useState(false)
  const [preselectedMethod, setPreselectedMethod] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [paymentForm, setPaymentForm] = useState({
    type: 'Tuition Fee',
    amount: '',
    method: 'Online',
    date: new Date().toISOString().split('T')[0],
  })

  const totalAmount = fees.reduce((s, f) => s + (f.amount || 0), 0)
  const totalPaid = fees.reduce((s, f) => s + (f.paid || 0), 0)
  const totalDue = fees.reduce((s, f) => s + (f.due || 0), 0)
  const fmt = (n) => `₹${n.toLocaleString('en-IN')}`

  const handleOpenPayment = (method = '') => {
    setPreselectedMethod(method)
    setPaymentForm({
      type: 'Tuition Fee',
      amount: '',
      method: method || 'Online',
      date: new Date().toISOString().split('T')[0],
    })
    setShowPaymentModal(true)
  }

  const handleSubmitPayment = async () => {
    if (!paymentForm.amount || parseFloat(paymentForm.amount) <= 0) {
      alert('Please enter a valid amount')
      return
    }
    setIsSubmitting(true)
    const amt = parseFloat(paymentForm.amount)
    const newFee = {
      id: `FEE-${Date.now().toString().slice(-6)}`,
      type: paymentForm.type,
      date: paymentForm.date,
      amount: amt,
      paid: amt,
      due: 0,
      status: 'Paid',
      method: paymentForm.method,
    }
    const updatedFees = [...fees, newFee]

    try {
      const studentId = student.rollNumber || student.id
      const res = await fetch(`/api/students/${encodeURIComponent(studentId)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fees: updatedFees }),
      })
      if (res.ok) {
        setFees(updatedFees)
        if (onStudentUpdate) onStudentUpdate({ ...student, fees: updatedFees })
        setShowPaymentModal(false)
        alert('Payment recorded successfully!')
      } else {
        alert('Failed to save payment. Please try again.')
      }
    } catch (err) {
      console.error(err)
      alert('Network error. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDownloadInvoice = () => {
    // Dynamic import to avoid issues if jsPDF isn't loaded
    import('jspdf').then(({ jsPDF }) => {
      const pdf = new jsPDF()
      const pw = pdf.internal.pageSize.getWidth()
      let y = 20

      pdf.setFont('helvetica', 'bold')
      pdf.setFontSize(20)
      pdf.text('MIT CONNECT', pw / 2, y, { align: 'center' })
      y += 8
      pdf.setFontSize(12)
      pdf.text('FEE INVOICE', pw / 2, y, { align: 'center' })
      y += 6
      pdf.setFont('helvetica', 'normal')
      pdf.setFontSize(9)
      pdf.text('123 University Road, Education City | Phone: +91-9876543210', pw / 2, y, { align: 'center' })
      y += 8

      pdf.setDrawColor(180)
      pdf.line(20, y, pw - 20, y)
      y += 8

      // Student info
      pdf.setFont('helvetica', 'bold')
      pdf.setFontSize(10)
      pdf.text('Student Details', 20, y)
      y += 6
      pdf.setFont('helvetica', 'normal')
      pdf.setFontSize(9)
      pdf.text(`Name: ${student.name}`, 20, y)
      pdf.text(`ID: ${student.rollNumber || student.id}`, pw / 2, y)
      y += 5
      pdf.text(`Department: ${student.department || 'N/A'}`, 20, y)
      pdf.text(`Semester: ${student.semester || 'N/A'}`, pw / 2, y)
      y += 5
      pdf.text(`Date: ${new Date().toLocaleDateString('en-IN')}`, 20, y)
      y += 10

      // Table header
      pdf.setDrawColor(180)
      pdf.line(20, y, pw - 20, y)
      y += 5
      pdf.setFont('helvetica', 'bold')
      pdf.text('#', 22, y)
      pdf.text('Fee Type', 30, y)
      pdf.text('Date', 85, y)
      pdf.text('Amount', 120, y)
      pdf.text('Paid', 148, y)
      pdf.text('Due', 172, y)
      pdf.text('Status', 188, y)
      y += 3
      pdf.line(20, y, pw - 20, y)
      y += 5

      // Table rows
      pdf.setFont('helvetica', 'normal')
      fees.forEach((f, i) => {
        pdf.text(String(i + 1), 22, y)
        pdf.text(f.type || '', 30, y)
        pdf.text(f.date || '', 85, y)
        pdf.text(String(f.amount || 0), 120, y)
        pdf.text(String(f.paid || 0), 148, y)
        pdf.text(String(f.due || 0), 172, y)
        pdf.text(f.status || '', 188, y)
        y += 6
      })

      // Total
      y += 2
      pdf.line(20, y, pw - 20, y)
      y += 6
      pdf.setFont('helvetica', 'bold')
      pdf.setFontSize(10)
      pdf.text('Total Fees:', 30, y)
      pdf.text(String(totalAmount), 120, y)
      pdf.text(String(totalPaid), 148, y)
      pdf.text(String(totalDue), 172, y)
      y += 10

      // Footer
      pdf.setFont('helvetica', 'italic')
      pdf.setFontSize(8)
      pdf.text('This is a computer-generated invoice. No signature required.', pw / 2, y, { align: 'center' })

      pdf.save(`invoice_${student.rollNumber || student.id}.pdf`)
    }).catch(() => {
      alert('PDF library not available. Please try again.')
    })
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Left Column - Payment Ledger */}
      <div className="lg:col-span-8 space-y-8">
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider">Fee Payment Ledger</h3>
            <button
              onClick={() => handleOpenPayment('')}
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
                   <th className="px-4 py-4">Method</th>
                   <th className="px-4 py-4 text-right">Amount</th>
                   <th className="px-8 py-4 text-center">Status</th>
                 </tr>
               </thead>
                <tbody className="divide-y divide-slate-100">
                 {fees.length === 0 ? (
                   <tr><td colSpan="6" className="px-8 py-12 text-center text-slate-400 text-sm">No fee records found</td></tr>
                 ) : fees.map(f => (
                   <tr key={f.id} className="hover:bg-slate-50/50 transition-colors group">
                     <td className="px-8 py-5 text-sm font-medium text-slate-400 group-hover:text-slate-600 transition-colors">#{f.id}</td>
                     <td className="px-4 py-5 text-sm font-medium text-slate-800">{f.type}</td>
                     <td className="px-4 py-5 text-sm font-medium text-slate-500">{f.date}</td>
                     <td className="px-4 py-5">
                        <span className="px-2.5 py-1 bg-slate-100 text-slate-500 rounded text-[10px] font-bold uppercase tracking-wider">{f.method || 'N/A'}</span>
                     </td>
                     <td className="px-4 py-5 text-sm font-bold text-slate-900 text-right">{fmt(f.amount)}</td>
                     <td className="px-8 py-5 text-center">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                           f.status === 'Paid' ? 'bg-green-50 text-green-600' : f.status === 'Partial' ? 'bg-orange-50 text-orange-600' : 'bg-red-50 text-red-600'
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
                   {totalDue > 0
                     ? `Outstanding balance of ${fmt(totalDue)} pending. Please complete the remaining payment to avoid late charges.`
                     : 'All fees are paid. No outstanding balance.'}
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
             className="w-full mt-10 py-3 bg-[#1162d4] text-white rounded-lg text-xs font-semibold uppercase tracking-wider hover:bg-[#1162d4]/90 transition-all flex items-center justify-center gap-2"
           >
              <span className="material-symbols-outlined text-[16px]">download</span>
              DOWNLOAD INVOICE (PDF)
           </button>
        </div>

        {/* Quick Payment Methods */}
        <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm">
           <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider mb-6">Payment Methods</h3>
           <div className="space-y-3">
              {[
                { label: 'Net Banking', method: 'Net Banking', icon: 'account_balance' },
                { label: 'Unified Payments (UPI)', method: 'UPI', icon: 'qr_code_2' },
                { label: 'Credit/Debit Cards', method: 'Card', icon: 'credit_card' },
              ].map(pm => (
                <div
                  key={pm.label}
                  onClick={() => handleOpenPayment(pm.method)}
                  className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100 hover:border-[#1162d4]/30 hover:bg-blue-50/30 transition-all cursor-pointer group"
                >
                   <div className="flex items-center gap-3">
                     <span className="material-symbols-outlined text-slate-400 group-hover:text-[#1162d4] text-[20px]">{pm.icon}</span>
                     <span className="text-xs font-semibold text-slate-600 group-hover:text-slate-900">{pm.label}</span>
                   </div>
                   <span className="material-symbols-outlined text-slate-300 group-hover:text-[#1162d4] text-[18px]">chevron_right</span>
                </div>
              ))}
           </div>
        </div>
      </div>

      {/* New Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200">
            <div className="px-8 py-6 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-3">
                <div className="p-2 bg-[#1162d4]/10 rounded-lg">
                  <span className="material-symbols-outlined text-[#1162d4]">payments</span>
                </div>
                Record New Payment
              </h2>
              <button onClick={() => setShowPaymentModal(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="p-8 space-y-5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Fee Type *</label>
                <select
                  value={paymentForm.type}
                  onChange={(e) => setPaymentForm(p => ({ ...p, type: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 outline-none text-slate-700 bg-white"
                >
                  {['Tuition Fee', 'Hostel Fee', 'Exam Fee', 'Lab Fee', 'Library Fee', 'Transport Fee', 'Misc Fee'].map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Amount (₹) *</label>
                <input
                  type="number"
                  min="1"
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm(p => ({ ...p, amount: e.target.value }))}
                  placeholder="Enter amount"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 outline-none text-slate-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Payment Method</label>
                  <select
                    value={paymentForm.method}
                    onChange={(e) => setPaymentForm(p => ({ ...p, method: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 outline-none text-slate-700 bg-white"
                  >
                    {['Online', 'UPI', 'Net Banking', 'Card', 'Cash', 'Cheque'].map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Date</label>
                  <input
                    type="date"
                    value={paymentForm.date}
                    onChange={(e) => setPaymentForm(p => ({ ...p, date: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 outline-none text-slate-700"
                  />
                </div>
              </div>

              {paymentForm.amount && (
                <div className="bg-green-50 border border-green-100 rounded-xl p-4 flex items-center gap-3">
                  <span className="material-symbols-outlined text-green-600">info</span>
                  <p className="text-xs text-green-700">
                    Recording payment of <strong>{fmt(parseFloat(paymentForm.amount) || 0)}</strong> for <strong>{paymentForm.type}</strong> via <strong>{paymentForm.method}</strong>
                  </p>
                </div>
              )}
            </div>

            <div className="px-8 py-5 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowPaymentModal(false)}
                className="px-6 py-2.5 text-xs font-bold text-slate-400 hover:text-slate-600 tracking-wider uppercase"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitPayment}
                disabled={isSubmitting}
                className={`px-6 py-2.5 ${isSubmitting ? 'bg-slate-400' : 'bg-emerald-600 hover:bg-emerald-700'} text-white rounded-lg text-sm font-semibold transition-colors flex items-center gap-2`}
              >
                {isSubmitting ? 'Saving...' : 'Confirm Payment'}
                <span className="material-symbols-outlined text-base">{isSubmitting ? 'sync' : 'check_circle'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function DocumentsTab({ student }) {
  const docs = student.documents || []

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Left Column - Category Cards and Helper */}
      <div className="lg:col-span-4 space-y-8">
        <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm">
           <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider mb-6">File Categories</h3>
           <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Academic', count: 12, color: 'bg-blue-50 text-[#1162d4]', icon: 'school' },
                { label: 'Identity', count: 4, color: 'bg-green-50 text-green-600', icon: 'badge' },
                { label: 'Fees', count: 8, color: 'bg-purple-50 text-purple-600', icon: 'receipt_long' },
                { label: 'Others', count: 2, color: 'bg-slate-50 text-slate-400', icon: 'folder_open' }
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
        <div className="bg-[#1162d4]/5 border-2 border-dashed border-[#1162d4]/20 rounded-xl p-10 flex flex-col items-center text-center group cursor-pointer hover:bg-[#1162d4]/10 transition-all">
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
               <button className="px-3 py-1.5 bg-white text-[#1162d4] rounded-md text-[10px] font-semibold uppercase tracking-wider shadow-sm">Grid View</button>
               <button className="px-3 py-1.5 text-slate-400 rounded-md text-[10px] font-semibold uppercase tracking-wider">List View</button>
            </div>
          </div>
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
                        {new Date(doc.uploadDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                     </td>
                     <td className="px-8 py-5 text-center">
                        <div className="flex items-center justify-center gap-1">
                           <button className="p-2 text-slate-400 hover:text-[#1162d4] hover:bg-blue-50 rounded-lg transition-all">
                              <span className="material-symbols-outlined text-[18px]">download</span>
                           </button>
                           <button className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
                              <span className="material-symbols-outlined text-[18px]">delete</span>
                           </button>
                        </div>
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
          </div>
        </div>
      </div>
    </div>
  )
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
  const [error, setError] = useState(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const [showQuickActionMenu, setShowQuickActionMenu] = useState(false)
  const [isEditOverviewModalOpen, setIsEditOverviewModalOpen] = useState(false); // New state for edit modal

  const refreshData = () => setRefreshKey(prev => prev + 1)

  const generateStudentPDF = () => {
    const doc = new jsPDF();
    
    // Add Header
    doc.setFillColor(17, 98, 212); // #1162d4
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text("MIT CONNECT", 20, 20);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.text("Student Official Profile Report", 20, 30);
    
    // Student Core Info
    doc.setTextColor(51, 65, 85); // Slate-700
    doc.setFontSize(18);
    doc.text(student.name, 20, 55);
    doc.setFontSize(12);
    doc.text(`Student ID: ${student.id}`, 20, 62);
    doc.text(`Department: ${student.department}`, 20, 69);
    doc.text(`Current Semester: ${student.semester}`, 20, 76);

    // Personal Details Table
    autoTable(doc, {
      startY: 85,
      head: [['Personal Information', 'Details']],
      body: [
        ['Full Name', student.name],
        ['Date of Birth', student.dob || 'N/A'],
        ['Gender', student.gender || 'N/A'],
        ['Email', student.email],
        ['Phone', student.phone],
        ['Address', student.address || 'N/A'],
      ],
      headStyles: { fillColor: [17, 98, 212] },
      margin: { left: 20, right: 20 }
    });

    // Academic Details Table
    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 10,
      head: [['Academic Information', 'Details']],
      body: [
        ['Year of Study', student.year],
        ['Section', student.section || 'A'],
        ['Enrollment Date', student.enrollDate ? new Date(student.enrollDate).toLocaleDateString() : 'N/A'],
        ['Admission Type', student.admissionType || 'Regular'],
        ['Attendance', `${student.attendancePct}%`],
      ],
      headStyles: { fillColor: [17, 98, 212] },
      margin: { left: 20, right: 20 }
    });

    // Guardian Details Table
    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 10,
      head: [['Guardian Information', 'Details']],
      body: [
        ['Guardian Name', student.guardian || student.guardianName || 'N/A'],
        ['Relationship', student.relationship || 'Father'],
        ['Contact', student.guardianPhone || 'N/A'],
      ],
      headStyles: { fillColor: [17, 98, 212] },
      margin: { left: 20, right: 20 }
    });

    // Footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(10);
        doc.setTextColor(150);
        doc.text(`Generated on ${new Date().toLocaleString()} | Page ${i} of ${pageCount}`, 20, 285);
    }

    doc.save(`${student.name}_Profile_Report.pdf`);
  }

  const handleReport = () => {
    try {
      generateStudentPDF();
    } catch (err) {
      console.error("PDF Error:", err);
      alert("Failed to generate PDF. Please try again.");
    }
  }

  const handleMarkAttendance = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const payload = {
        classId: "GEN-101", // Default generic class
        date: today,
        hour: "1",
        entries: [{
          studentId: id,
          status: "Present"
        }]
      };

      const res = await fetch('/api/academics/attendance/markings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('API Error');
      
      alert(`Attendance marked as 'Present' for ${student.name} (${today})`);
      refreshData();
    } catch (err) {
      console.error("Attendance Error:", err);
      alert("Failed to mark attendance. Please try again.");
    }
  }

  const generateIDCardPDF = () => {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: [85, 55] // Standard ID card size
    });

    // Background & Border
    doc.setFillColor(17, 98, 212); // #1162d4
    doc.rect(0, 0, 85, 12, 'F');
    doc.setDrawColor(17, 98, 212);
    doc.rect(0, 0, 85, 55, 'S');

    // Header Text
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text("MIT CONNECT - STUDENT ID", 42.5, 7.5, { align: 'center' });

    // Student Info (Left Column)
    doc.setTextColor(51, 65, 85);
    doc.setFontSize(9);
    doc.text(`Name: ${student.name}`, 35, 25);
    doc.setFontSize(7);
    doc.text(`ID: ${student.id}`, 35, 30);
    doc.text(`Dept: ${student.department}`, 35, 34);
    doc.text(`Batch: 2023-27`, 35, 38);

    // Placeholder for Photo (Since we can't easily embed base64/blob without more complex handling)
    doc.setFillColor(241, 245, 249);
    doc.rect(5, 18, 25, 30, 'F');
    doc.setDrawColor(203, 213, 225);
    doc.rect(5, 18, 25, 30, 'S');
    doc.setFontSize(5);
    doc.text("PHOTO", 17.5, 33, { align: 'center' });

    // Footer
    doc.setFillColor(248, 250, 252);
    doc.rect(0, 48, 85, 7, 'F');
    doc.setFontSize(6);
    doc.setTextColor(148, 163, 184);
    doc.text("OFFICIAL UNIVERSITY IDENTITY CARD", 42.5, 52.5, { align: 'center' });

    doc.save(`${student.name}_ID_Card.pdf`);
  }
  
  const handleQuickAction = () => setShowQuickActionMenu(!showQuickActionMenu)

  useEffect(() => {
    const fetchStudent = async () => {
      try {
        setLoading(true)
        const res = await fetch(`/api/students/${encodeURIComponent(id)}`)
        if (!res.ok) {
          if (res.status === 404) throw new Error('Student not found')
          throw new Error('Failed to fetch student details')
        }
        const data = await res.json()
        setStudent(data)
        setError(null)
      } catch (err) {
        console.error('Error fetching student:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    if (id) fetchStudent()
  }, [id, refreshKey])

  if (loading) {
    return (
      <Layout title="Loading Student...">
        <div className="flex flex-col items-center justify-center py-32 animate-pulse">
           <div className="w-24 h-24 bg-slate-100 rounded-xl mb-6" />
           <div className="w-48 h-4 bg-slate-100 rounded mb-2" />
           <div className="w-32 h-3 bg-slate-50 rounded" />
        </div>
      </Layout>
    )
  }

  if (error || !student) {
    return (
      <Layout title="Student Not Found">
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <span className="material-symbols-outlined text-6xl text-slate-300 mb-4">{error === 'Student not found' ? 'person_off' : 'cloud_off'}</span>
          <h2 className="text-xl font-bold text-slate-700 mb-2">{error === 'Student not found' ? 'Student Not Found' : 'Connection Error'}</h2>
          <p className="text-sm text-slate-500 mb-6">{error === 'Student not found' ? `No student record exists with ID "${id}"` : error}</p>
          <button
            onClick={() => navigate('/students')}
            className="px-5 py-2.5 bg-[#2563eb] text-white rounded-lg text-sm font-semibold hover:bg-[#1d4ed8] transition-all"
          >
            Back to Students
          </button>
        </div>
      </Layout>
    )
  }

  return (
    <Layout title={`Students / ${student.name}`}>
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
        {/* Abstract background elements wrapper to handle clipping separately */}
        <div className="absolute inset-0 overflow-hidden rounded-xl pointer-events-none">
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-slate-50 rounded-full opacity-50 group-hover:scale-125 transition-transform duration-1000" />
          <div className="absolute top-1/2 -right-12 w-32 h-32 bg-blue-50/30 rounded-full blur-3xl" />
        </div>
        
        <div className="relative flex flex-col xl:flex-row xl:items-center justify-between gap-10">
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
                      <span className="uppercase tracking-wide">Block C, Room 402</span>
                   </div>
                   <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                      <span className="material-symbols-outlined text-[20px] text-slate-300">event_available</span>
                      <span className="uppercase tracking-wide">Batch 2023-27</span>
                   </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 relative">
            {activeTab === 'overview' && (
              <button 
                onClick={() => setIsEditOverviewModalOpen(true)}
                className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-lg text-sm font-semibold hover:bg-slate-50 transition-all shadow-sm active:scale-95"
              >
                <span className="material-symbols-outlined text-[20px] text-[#1162d4]">edit</span>
                <span>Edit Overview</span>
              </button>
            )}

            <div className="relative">
              <button 
                onClick={handleQuickAction}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#1162d4] text-white rounded-lg text-sm font-semibold hover:bg-[#1162d4]/90 transition-all active:scale-95 shadow-sm"
              >
                <span className="material-symbols-outlined text-[20px]">bolt</span>
                <span>Quick Action</span>
              </button>
              
              {showQuickActionMenu && (
                <div className="absolute top-full right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 z-[110] py-2 animate-in fade-in zoom-in-95 duration-200">
                  {[
                    { label: 'Mark Attendance', icon: 'how_to_reg', action: handleMarkAttendance },
                    { label: 'Generate ID Card', icon: 'badge', action: generateIDCardPDF },
                    { label: 'Send Email', icon: 'mail', action: () => window.location.href = `mailto:${student.email}` },
                    { label: 'Print Transcript', icon: 'print', action: () => window.print() },
                  ].map(item => (
                    <button
                      key={item.label}
                      onClick={() => { item.action(); setShowQuickActionMenu(false); }}
                      className="w-full px-4 py-2.5 flex items-center gap-3 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-[#1162d4] transition-colors"
                    >
                      <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                      {item.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button 
              onClick={handleReport}
              className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-lg text-sm font-semibold hover:bg-slate-50 transition-all shadow-sm"
            >
              <span className="material-symbols-outlined text-[20px]">description</span>
              <span>Report</span>
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
        {activeTab === 'overview' && <OverviewTab student={student} onEdit={() => setIsEditOverviewModalOpen(true)} />}
        {activeTab === 'academics' && <AcademicsTab student={student} onRefresh={refreshData} />}
        {activeTab === 'fees' && <FeesTab student={student} />}
        {activeTab === 'documents' && <DocumentsTab student={student} />}
      </div>

      <EditOverviewModal 
        isOpen={isEditOverviewModalOpen} 
        onClose={() => setIsEditOverviewModalOpen(false)}
        student={student}
        onSave={() => {
          setIsEditOverviewModalOpen(false);
          refreshData();
        }}
      />
    </Layout>
  )
}
