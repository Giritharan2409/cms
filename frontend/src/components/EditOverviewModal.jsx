import { useState } from 'react';

export default function EditOverviewModal({ isOpen, onClose, onSave, student }) {
  const [formData, setFormData] = useState({
    phone: student?.phone || '',
    email: student?.email || '',
    address: student?.address || '',
    guardian: student?.guardian || '',
    motherName: student?.motherName || '',
    guardianPhone: student?.guardianPhone || '',
    enrollDate: student?.enrollDate ? new Date(student.enrollDate).toISOString().split('T')[0] : '',
    bloodGroup: student?.bloodGroup || '',
    skills: (student?.skills || []).join(', ')
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
