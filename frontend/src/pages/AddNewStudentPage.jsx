import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { API_BASE } from '../api/apiBase';
import { ChevronLeft, ChevronRight, CheckCircle2, AlertCircle } from 'lucide-react';

export default function AddNewStudentPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  
  const initialData = {
    // Personal
    name: '',
    dob: '',
    gender: 'Male',
    // Contact
    email: '',
    phone: '',
    // Academic Background
    previousInstitution: '',
    address: '',
    bloodGroup: '',
    // Academic Program
    id: `STU-2025-${Math.floor(1000 + Math.random() * 9000)}`,
    department: 'Computer Science',
    year: '1st Year',
    semester: '1',
    section: 'A',
    enrollDate: new Date().toISOString().split('T')[0],
    admissionType: 'Regular',
    // Guardian
    guardianName: '',
    relationship: 'Father',
    guardianPhone: '',
    guardianEmail: '',
    guardianOccupation: '',
    // Documents - Academic
    docs: {
      marksheet10: null,
      marksheet12: null,
      tc: null,
      additional: [],
    },
    // Documents - Identity
    avatar: null,
    aadhar: null,
    photo: null,
  };

  const [formData, setFormData] = useState(initialData);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const fileInputRef = useRef(null);

  // Load draft from localStorage on mount
  useEffect(() => {
    const draft = localStorage.getItem('add_student_draft');
    if (draft) {
      try {
        const parsed = JSON.parse(draft);
        setFormData(parsed);
        if (parsed.avatar) setAvatarPreview(parsed.avatar);
      } catch (e) {
        console.error("Failed to load draft");
      }
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleFileChange = (e, field = 'avatar') => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (field === 'avatar') {
          setAvatarPreview(reader.result);
          setFormData(prev => ({ ...prev, avatar: reader.result }));
        } else {
          setFormData(prev => ({
            ...prev,
            docs: { ...prev.docs, [field]: { name: file.name, size: file.size, data: reader.result } }
          }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const validateStep = (s) => {
    let newErrors = {};
    if (s === 1) {
      if (!formData.name) newErrors.name = 'Full Name is required';
      if (!formData.dob) newErrors.dob = 'Date of Birth is required';
      if (!formData.gender) newErrors.gender = 'Gender is required';
    } else if (s === 2) {
      if (!formData.email) {
        newErrors.email = 'Email is required';
      } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
        newErrors.email = 'Email is invalid';
      }
      if (!formData.phone) newErrors.phone = 'Phone is required';
    } else if (s === 5) {
      if (!formData.guardianName) newErrors.guardianName = 'Guardian Name is required';
      if (!formData.guardianPhone) newErrors.guardianPhone = 'Guardian Phone is required';
    } else if (s === 6) {
      if (!formData.docs.marksheet10) newErrors.marksheet10 = '10th Marksheet is required';
      if (!formData.docs.marksheet12) newErrors.marksheet12 = '12th Marksheet is required';
    } else if (s === 7) {
      if (!formData.photo) newErrors.photo = 'Passport Photo is required';
      if (!formData.aadhar) newErrors.aadhar = 'Aadhar Card is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(s => s + 1);
    }
  };

  const handlePrevious = () => {
    setStep(s => Math.max(1, s - 1));
  };

  const handleSaveDraft = () => {
    localStorage.setItem('add_student_draft', JSON.stringify(formData));
    setSuccessMessage('Progress saved to draft!');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validateStep(step)) {
      setIsSubmitting(true);
      try {
        const payload = {
          ...formData,
          semester: parseInt(formData.semester) || 1,
          enrollDate: formData.enrollDate ? new Date(formData.enrollDate).toISOString() : null,
          dob: formData.dob ? new Date(formData.dob).toISOString() : null,
          documents: [
            { id: 'DOC-01', name: '10th Marksheet', type: 'base64', data: formData.docs.marksheet10 },
            { id: 'DOC-02', name: '12th Marksheet', type: 'base64', data: formData.docs.marksheet12 },
            { id: 'DOC-03', name: 'Aadhar Card', type: 'base64', data: formData.aadhar },
            { id: 'DOC-04', name: 'Passport Photo', type: 'base64', data: formData.photo },
            { id: 'DOC-05', name: 'Transfer Certificate', type: 'base64', data: formData.docs.tc },
          ].filter(d => d.data)
        };

        const res = await fetch(`${API_BASE}/students`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.detail || 'Failed to save student');
        }

        const savedStudent = await res.json();
        console.log('Success:', savedStudent);
        
        localStorage.removeItem('add_student_draft');
        setSuccessMessage('Student enrolled successfully!');
        
        setTimeout(() => {
          navigate('/admission');
        }, 2000);
      } catch (err) {
        console.error('Submit error:', err);
        alert(`Error: ${err.message}`);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const getSemOptions = () => {
    const yearNum = parseInt(formData.year);
    if (yearNum === 1) return ['1', '2'];
    if (yearNum === 2) return ['3', '4'];
    if (yearNum === 3) return ['5', '6'];
    if (yearNum === 4) return ['7', '8'];
    return [];
  };

  const steps = [
    { id: 1, label: 'Personal', short: 'P' },
    { id: 2, label: 'Contact', short: 'C' },
    { id: 3, label: 'Background', short: 'B' },
    { id: 4, label: 'Program', short: 'Pr' },
    { id: 5, label: 'Guardian', short: 'G' },
    { id: 6, label: 'Academics', short: 'Ac' },
    { id: 7, label: 'Identity', short: 'I' },
    { id: 8, label: 'Review', short: 'R' },
  ];

  return (
    <Layout title="New Student Admission">
      <div className="max-w-5xl mx-auto">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-6">
          <button onClick={() => navigate('/admission')} className="hover:text-green-600 transition-colors">
            Admission
          </button>
          <span>›</span>
          <span className="text-gray-900 font-medium">Enroll Student</span>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
            <CheckCircle2 size={20} className="text-green-600" />
            <span className="text-green-800">{successMessage}</span>
          </div>
        )}

        {/* Compact Progress Timeline */}
        <div className="mb-8 bg-white rounded-lg shadow p-4 border border-gray-100">
          <div className="flex items-center justify-between gap-1">
            {steps.map((s, i) => (
              <div key={s.id} className="flex items-center flex-1">
                <button
                  onClick={() => setStep(s.id)}
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-xs transition-all flex-shrink-0 relative z-10 ${
                    step > s.id
                      ? 'bg-green-600 text-white'
                      : step === s.id
                      ? 'bg-green-600 text-white ring-2 ring-green-300'
                      : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                  }`}
                  disabled={step < s.id}
                  title={s.label}
                >
                  {step > s.id ? '✓' : s.id}
                </button>
                {i < steps.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-0.5 transition-all ${step > s.id ? 'bg-green-600' : 'bg-gray-200'}`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between gap-1 mt-2 px-0.5">
            {steps.map((s) => (
              <div key={s.id} className="flex-1 text-center">
                <p className="text-[10px] font-semibold text-gray-600">{s.short}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Step Content Card */}
        <div className="bg-white rounded-lg shadow-lg p-8 border border-gray-100">
          {/* Step 1: Personal Information */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                  <span className="text-lg font-bold text-green-600">1</span>
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Personal Information</h3>
                  <p className="text-sm text-gray-600">Basic details about the student</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-bold text-gray-700 uppercase tracking-wider block mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter full name"
                    className={`w-full px-4 py-2.5 rounded-lg border transition-all ${
                      errors.name ? 'border-red-500 ring-2 ring-red-100' : 'border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-100'
                    } outline-none text-sm`}
                  />
                  {errors.name && <p className="text-red-600 text-xs mt-1 flex items-center gap-1"><AlertCircle size={12} /> {errors.name}</p>}
                </div>

                <div>
                  <label className="text-sm font-bold text-gray-700 uppercase tracking-wider block mb-2">
                    Date of Birth *
                  </label>
                  <input
                    type="date"
                    name="dob"
                    value={formData.dob}
                    onChange={handleChange}
                    className={`w-full px-4 py-2.5 rounded-lg border transition-all ${
                      errors.dob ? 'border-red-500 ring-2 ring-red-100' : 'border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-100'
                    } outline-none text-sm`}
                  />
                  {errors.dob && <p className="text-red-600 text-xs mt-1 flex items-center gap-1"><AlertCircle size={12} /> {errors.dob}</p>}
                </div>

                <div>
                  <label className="text-sm font-bold text-gray-700 uppercase tracking-wider block mb-2">
                    Gender *
                  </label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className={`w-full px-4 py-2.5 rounded-lg border transition-all ${
                      errors.gender ? 'border-red-500 ring-2 ring-red-100' : 'border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-100'
                    } outline-none bg-white text-sm`}
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                  {errors.gender && <p className="text-red-600 text-xs mt-1 flex items-center gap-1"><AlertCircle size={12} /> {errors.gender}</p>}
                </div>

                <div>
                  <label className="text-sm font-bold text-gray-700 uppercase tracking-wider block mb-2">
                    Blood Group
                  </label>
                  <select
                    name="bloodGroup"
                    value={formData.bloodGroup}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-100 outline-none bg-white text-sm"
                  >
                    <option value="">Select Group</option>
                    {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(bg => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Contact Information */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                  <span className="text-lg font-bold text-green-600">2</span>
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Contact Information</h3>
                  <p className="text-sm text-gray-600">How to reach the student</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="text-sm font-bold text-gray-700 uppercase tracking-wider block mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="student@mit.edu"
                    className={`w-full px-4 py-2.5 rounded-lg border transition-all ${
                      errors.email ? 'border-red-500 ring-2 ring-red-100' : 'border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-100'
                    } outline-none text-sm`}
                  />
                  {errors.email && <p className="text-red-600 text-xs mt-1 flex items-center gap-1"><AlertCircle size={12} /> {errors.email}</p>}
                </div>

                <div>
                  <label className="text-sm font-bold text-gray-700 uppercase tracking-wider block mb-2">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+91 9876543210"
                    className={`w-full px-4 py-2.5 rounded-lg border transition-all ${
                      errors.phone ? 'border-red-500 ring-2 ring-red-100' : 'border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-100'
                    } outline-none text-sm`}
                  />
                  {errors.phone && <p className="text-red-600 text-xs mt-1 flex items-center gap-1"><AlertCircle size={12} /> {errors.phone}</p>}
                </div>

                <div className="md:col-span-2">
                  <label className="text-sm font-bold text-gray-700 uppercase tracking-wider block mb-2">
                    Permanent Address
                  </label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="Enter your permanent address"
                    rows="2"
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-100 outline-none text-sm"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Academic Background */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                  <span className="text-lg font-bold text-green-600">3</span>
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Academic Background</h3>
                  <p className="text-sm text-gray-600">Previous educational history</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="text-sm font-bold text-gray-700 uppercase tracking-wider block mb-2">
                    Previous Institution
                  </label>
                  <input
                    type="text"
                    name="previousInstitution"
                    value={formData.previousInstitution}
                    onChange={handleChange}
                    placeholder="Name of previous school/college"
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-100 outline-none text-sm"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Program Selection */}
          {step === 4 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                  <span className="text-lg font-bold text-green-600">4</span>
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Academic Program</h3>
                  <p className="text-sm text-gray-600">Select course and batch details</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-bold text-gray-700 uppercase tracking-wider block mb-2">
                    Department
                  </label>
                  <select
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-100 outline-none bg-white text-sm"
                  >
                    <option value="Computer Science">Computer Science & Engineering</option>
                    <option value="Electrical">Electrical Engineering</option>
                    <option value="Mechanical">Mechanical Engineering</option>
                    <option value="Civil">Civil Engineering</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-bold text-gray-700 uppercase tracking-wider block mb-2">
                    Year
                  </label>
                  <select
                    name="year"
                    value={formData.year}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-100 outline-none bg-white text-sm"
                  >
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year</option>
                    <option value="3rd Year">3rd Year</option>
                    <option value="4th Year">4th Year</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-bold text-gray-700 uppercase tracking-wider block mb-2">
                    Batch
                  </label>
                  <select
                    name="semester"
                    value={formData.semester}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-100 outline-none bg-white text-sm"
                  >
                    {getSemOptions().map(sem => (
                      <option key={sem} value={sem}>Batch {sem}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-bold text-gray-700 uppercase tracking-wider block mb-2">
                    Section
                  </label>
                  <select
                    name="section"
                    value={formData.section}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-100 outline-none bg-white text-sm"
                  >
                    <option value="A">Section A</option>
                    <option value="B">Section B</option>
                    <option value="C">Section C</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="text-sm font-bold text-gray-700 uppercase tracking-wider block mb-2">
                    Enrollment Date
                  </label>
                  <input
                    type="date"
                    name="enrollDate"
                    value={formData.enrollDate}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-100 outline-none text-sm"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Guardian Information */}
          {step === 5 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                  <span className="text-lg font-bold text-green-600">5</span>
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Guardian Information</h3>
                  <p className="text-sm text-gray-600">Parent or guardian details</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-bold text-gray-700 uppercase tracking-wider block mb-2">
                    Guardian Name *
                  </label>
                  <input
                    type="text"
                    name="guardianName"
                    value={formData.guardianName}
                    onChange={handleChange}
                    placeholder="Full name"
                    className={`w-full px-4 py-2.5 rounded-lg border transition-all ${
                      errors.guardianName ? 'border-red-500 ring-2 ring-red-100' : 'border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-100'
                    } outline-none text-sm`}
                  />
                  {errors.guardianName && <p className="text-red-600 text-xs mt-1 flex items-center gap-1"><AlertCircle size={12} /> {errors.guardianName}</p>}
                </div>

                <div>
                  <label className="text-sm font-bold text-gray-700 uppercase tracking-wider block mb-2">
                    Relationship
                  </label>
                  <select
                    name="relationship"
                    value={formData.relationship}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-100 outline-none bg-white text-sm"
                  >
                    {['Father', 'Mother', 'Legal Guardian', 'Sibling', 'Relative'].map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-bold text-gray-700 uppercase tracking-wider block mb-2">
                    Phone *
                  </label>
                  <input
                    type="tel"
                    name="guardianPhone"
                    value={formData.guardianPhone}
                    onChange={handleChange}
                    placeholder="+91 9876543210"
                    className={`w-full px-4 py-2.5 rounded-lg border transition-all ${
                      errors.guardianPhone ? 'border-red-500 ring-2 ring-red-100' : 'border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-100'
                    } outline-none text-sm`}
                  />
                  {errors.guardianPhone && <p className="text-red-600 text-xs mt-1 flex items-center gap-1"><AlertCircle size={12} /> {errors.guardianPhone}</p>}
                </div>

                <div>
                  <label className="text-sm font-bold text-gray-700 uppercase tracking-wider block mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    name="guardianEmail"
                    value={formData.guardianEmail}
                    onChange={handleChange}
                    placeholder="guardian@example.com"
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-100 outline-none text-sm"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 6: Academic Documents */}
          {step === 6 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                  <span className="text-lg font-bold text-green-600">6</span>
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Academic Documents</h3>
                  <p className="text-sm text-gray-600">Certificates and academic records</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { field: 'marksheet10', label: '10th Marksheet', required: true },
                  { field: 'marksheet12', label: '12th Marksheet', required: true },
                  { field: 'tc', label: 'Transfer Certificate', required: false },
                ].map(doc => (
                  <div
                    key={doc.field}
                    className={`border-2 border-dashed rounded-lg p-3 hover:border-green-400 hover:bg-green-50 transition-all group cursor-pointer ${
                      errors[doc.field] ? 'border-red-500 bg-red-50' : 'border-gray-300'
                    }`}
                    onClick={() => document.getElementById(`file-${doc.field}`)?.click()}
                  >
                    <input
                      id={`file-${doc.field}`}
                      type="file"
                      onChange={(e) => handleFileChange(e, doc.field)}
                      className="hidden"
                      accept="image/*,.pdf"
                    />
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded flex items-center justify-center text-sm flex-shrink-0 ${
                        formData.docs[doc.field] ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400 group-hover:bg-green-100 group-hover:text-green-600'
                      }`}>
                        <span className="material-symbols-outlined text-base">{formData.docs[doc.field] ? 'verified' : 'upload'}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-gray-700 truncate">{doc.label} {doc.required && '*'}</p>
                        <p className="text-[10px] text-gray-500 truncate">
                          {formData.docs[doc.field] ? formData.docs[doc.field].name : 'Upload file'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 7: Identity Documents */}
          {step === 7 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                  <span className="text-lg font-bold text-green-600">7</span>
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Identity Documents</h3>
                  <p className="text-sm text-gray-600">Photo and identity verification</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { field: 'photo', label: 'Passport Photo', required: true },
                  { field: 'aadhar', label: 'Aadhar Card', required: true },
                ].map(doc => (
                  <div
                    key={doc.field}
                    className={`border-2 border-dashed rounded-lg p-3 hover:border-green-400 hover:bg-green-50 transition-all group cursor-pointer ${
                      errors[doc.field] ? 'border-red-500 bg-red-50' : 'border-gray-300'
                    }`}
                    onClick={() => document.getElementById(`file-${doc.field}`)?.click()}
                  >
                    <input
                      id={`file-${doc.field}`}
                      type="file"
                      onChange={(e) => handleFileChange(e, doc.field)}
                      className="hidden"
                      accept="image/*,.pdf"
                    />
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded flex items-center justify-center text-sm flex-shrink-0 ${
                        formData[doc.field] ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400 group-hover:bg-green-100 group-hover:text-green-600'
                      }`}>
                        <span className="material-symbols-outlined text-base">{formData[doc.field] ? 'verified' : 'upload'}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-gray-700 truncate">{doc.label} {doc.required && '*'}</p>
                        <p className="text-[10px] text-gray-500 truncate">
                          {formData[doc.field] ? (typeof formData[doc.field] === 'object' ? formData[doc.field].name : 'Uploaded') : 'Upload file'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 8: Review & Submit */}
          {step === 8 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                  <span className="text-lg font-bold text-green-600">8</span>
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Review & Submit</h3>
                  <p className="text-sm text-gray-600">Verify information before submitting</p>
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200">
                <div className="flex gap-3">
                  <CheckCircle2 size={20} className="text-green-600 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-green-900">Ready to Submit</h4>
                    <p className="text-sm text-green-700">Review the information below and submit the application.</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <h4 className="text-xs font-bold text-gray-700 uppercase mb-3">Personal</h4>
                  <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between"><span className="text-gray-600">Name:</span> <span className="font-medium truncate">{formData.name}</span></div>
                    <div className="flex justify-between"><span className="text-gray-600">DOB:</span> <span className="font-medium">{formData.dob}</span></div>
                    <div className="flex justify-between"><span className="text-gray-600">Gender:</span> <span className="font-medium">{formData.gender}</span></div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <h4 className="text-xs font-bold text-gray-700 uppercase mb-3">Contact</h4>
                  <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between"><span className="text-gray-600">Email:</span> <span className="font-medium truncate">{formData.email}</span></div>
                    <div className="flex justify-between"><span className="text-gray-600">Phone:</span> <span className="font-medium">{formData.phone}</span></div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <h4 className="text-xs font-bold text-gray-700 uppercase mb-3">Program</h4>
                  <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between"><span className="text-gray-600">Department:</span> <span className="font-medium">{formData.department}</span></div>
                    <div className="flex justify-between"><span className="text-gray-600">Year:</span> <span className="font-medium">{formData.year}</span></div>
                    <div className="flex justify-between"><span className="text-gray-600">ID:</span> <span className="font-medium text-green-600">{formData.id}</span></div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <h4 className="text-xs font-bold text-gray-700 uppercase mb-3">Guardian</h4>
                  <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between"><span className="text-gray-600">Name:</span> <span className="font-medium truncate">{formData.guardianName}</span></div>
                    <div className="flex justify-between"><span className="text-gray-600">Phone:</span> <span className="font-medium">{formData.guardianPhone}</span></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="mt-8 pt-6 border-t border-gray-200 flex gap-3">
            <button
              onClick={handlePrevious}
              disabled={step === 1}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all text-sm ${
                step === 1
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <ChevronLeft size={16} />
              Previous
            </button>

            <button
              onClick={handleSaveDraft}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium transition-all text-sm"
            >
              Save Draft
            </button>

            <div className="flex-1" />

            {step < 8 ? (
              <button
                onClick={handleNext}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-all text-sm"
              >
                Next
                <ChevronRight size={16} />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-all disabled:bg-gray-400 text-sm"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Enrollment'}
              </button>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default function AddNewStudentPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  
  const initialData = {
    // Personal
    name: '',
    dob: '',
    gender: 'Male',
    email: '',
    phone: '',
    avatar: null,
    address: '',
    bloodGroup: '',
    // Academic
    id: `STU-2025-${Math.floor(1000 + Math.random() * 9000)}`,
    department: 'Computer Science',
    year: '1st Year',
    semester: '1',
    section: 'A',
    enrollDate: new Date().toISOString().split('T')[0],
    admissionType: 'Regular',
    previousInstitution: '',
    // Guardian
    guardianName: '',
    relationship: 'Father',
    guardianPhone: '',
    guardianEmail: '',
    guardianOccupation: '',
    // Documents
    docs: {
      marksheet10: null,
      marksheet12: null,
      aadhar: null,
      photo: null,
      tc: null,
      additional: [],
    }
  };

  const [formData, setFormData] = useState(initialData);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const fileInputRef = useRef(null);

  // Load draft from localStorage on mount
  useEffect(() => {
    const draft = localStorage.getItem('add_student_draft');
    if (draft) {
      try {
        const parsed = JSON.parse(draft);
        setFormData(parsed);
        if (parsed.avatar) setAvatarPreview(parsed.avatar);
      } catch (e) {
        console.error("Failed to load draft");
      }
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleFileChange = (e, field = 'avatar') => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (field === 'avatar') {
          setAvatarPreview(reader.result);
          setFormData(prev => ({ ...prev, avatar: reader.result }));
        } else {
          setFormData(prev => ({
            ...prev,
            docs: { ...prev.docs, [field]: { name: file.name, size: file.size, data: reader.result } }
          }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const validateStep = (s) => {
    let newErrors = {};
    if (s === 1) {
      if (!formData.name) newErrors.name = 'Full Name is required';
      if (!formData.dob) newErrors.dob = 'Date of Birth is required';
      if (!formData.gender) newErrors.gender = 'Gender is required';
      if (!formData.email) {
        newErrors.email = 'Email is required';
      } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
        newErrors.email = 'Email is invalid';
      }
    } else if (s === 3) {
      if (!formData.guardianName) newErrors.guardianName = 'Guardian Name is required';
      if (!formData.guardianPhone) newErrors.guardianPhone = 'Guardian Phone is required';
    } else if (s === 4) {
      if (!formData.docs.marksheet10) newErrors.marksheet10 = '10th Marksheet is required';
      if (!formData.docs.marksheet12) newErrors.marksheet12 = '12th Marksheet is required';
      if (!formData.docs.aadhar) newErrors.aadhar = 'Aadhar Card is required';
      if (!formData.docs.photo) newErrors.photo = 'Passport Photo is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(s => s + 1);
    }
  };

  const handlePrevious = () => {
    setStep(s => Math.max(1, s - 1));
  };

  const handleSaveDraft = () => {
    localStorage.setItem('add_student_draft', JSON.stringify(formData));
    setSuccessMessage('Progress saved to draft!');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validateStep(step)) {
      setIsSubmitting(true);
      try {
        const payload = {
          ...formData,
          semester: parseInt(formData.semester) || 1,
          enrollDate: formData.enrollDate ? new Date(formData.enrollDate).toISOString() : null,
          dob: formData.dob ? new Date(formData.dob).toISOString() : null,
          documents: [
            { id: 'DOC-01', name: '10th Marksheet', type: 'base64', data: formData.docs.marksheet10 },
            { id: 'DOC-02', name: '12th Marksheet', type: 'base64', data: formData.docs.marksheet12 },
            { id: 'DOC-03', name: 'Aadhar Card', type: 'base64', data: formData.docs.aadhar },
            { id: 'DOC-04', name: 'Passport Photo', type: 'base64', data: formData.docs.photo },
          ].filter(d => d.data)
        };

        const res = await fetch(`${API_BASE}/students`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.detail || 'Failed to save student');
        }

        const savedStudent = await res.json();
        console.log('Success:', savedStudent);
        
        localStorage.removeItem('add_student_draft');
        setSuccessMessage('Student enrolled successfully!');
        
        setTimeout(() => {
          navigate('/admission');
        }, 2000);
      } catch (err) {
        console.error('Submit error:', err);
        alert(`Error: ${err.message}`);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const getSemOptions = () => {
    const yearNum = parseInt(formData.year);
    if (yearNum === 1) return ['1', '2'];
    if (yearNum === 2) return ['3', '4'];
    if (yearNum === 3) return ['5', '6'];
    if (yearNum === 4) return ['7', '8'];
    return [];
  };

  const steps = [
    { id: 1, label: 'Personal' },
    { id: 2, label: 'Academic' },
    { id: 3, label: 'Guardian' },
    { id: 4, label: 'Documents' },
    { id: 5, label: 'Review' },
  ];

  return (
    <Layout title="Add New Student">
      <div className="max-w-6xl mx-auto">
        {/* Header with Breadcrumb */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3 text-sm text-gray-600">
              <button onClick={() => navigate('/admission')} className="hover:text-green-600 transition-colors">
                Admission
              </button>
              <span>›</span>
              <span className="text-gray-900 font-medium">New Admission</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-xl">
                <UserPlus size={28} className="text-green-600" />
              </div>
              Add New Student
            </h1>
            <p className="text-sm text-gray-600 mt-2">Populating the digital campus with the next generation of scholars.</p>
          </div>
          <button
            onClick={() => navigate('/admission')}
            className="p-3 hover:bg-gray-100 rounded-lg transition-colors text-gray-600 hover:text-gray-900"
            title="Close"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
            <CheckCircle2 size={20} className="text-green-600" />
            <span className="text-green-800">{successMessage}</span>
          </div>
        )}

        {/* Progress Steps */}
        <div className="mb-8 bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            {steps.map((s, i) => (
              <div key={s.id} className="flex items-center flex-1">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                    step >= s.id
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {step > s.id ? <CheckCircle2 size={20} /> : s.id}
                </div>
                <div className="ml-3">
                  <p className={`text-xs font-bold uppercase ${step >= s.id ? 'text-green-600' : 'text-gray-500'}`}>
                    Step {s.id}
                  </p>
                  <p className={`text-sm font-medium ${step >= s.id ? 'text-gray-900' : 'text-gray-500'}`}>
                    {s.label} Information
                  </p>
                </div>
                {i < steps.length - 1 && (
                  <div className={`flex-1 h-1 mx-4 transition-all ${step > s.id ? 'bg-green-600' : 'bg-gray-200'}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content Card */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* Step 1: Personal */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Avatar Upload */}
                <div className="md:col-span-2">
                  <label className="text-sm font-bold text-gray-700 uppercase tracking-wider block mb-3">
                    Student Photo *
                  </label>
                  <div className="flex gap-6">
                    <div className="relative w-24 h-24 rounded-xl overflow-hidden border-2 border-dashed border-gray-200 flex items-center justify-center bg-gray-50">
                      {avatarPreview ? (
                        <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <span className="material-symbols-outlined text-4xl text-gray-300">camera_alt</span>
                      )}
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={(e) => handleFileChange(e, 'avatar')}
                        accept="image/*"
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute inset-0 opacity-0 hover:opacity-0 cursor-pointer"
                      />
                    </div>
                    <div className="flex-1">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                      >
                        Upload Photo
                      </button>
                      <p className="text-xs text-gray-500 mt-2">JPG, PNG up to 5MB</p>
                    </div>
                  </div>
                </div>

                {/* Name */}
                <div>
                  <label className="text-sm font-bold text-gray-700 uppercase tracking-wider block mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter full name"
                    className={`w-full px-4 py-3 rounded-xl border transition-all ${
                      errors.name ? 'border-red-500 ring-2 ring-red-100' : 'border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-100'
                    } outline-none`}
                  />
                  {errors.name && <p className="text-red-600 text-xs mt-1 flex items-center gap-1"><AlertCircle size={14} /> {errors.name}</p>}
                </div>

                {/* DOB */}
                <div>
                  <label className="text-sm font-bold text-gray-700 uppercase tracking-wider block mb-2">
                    Date of Birth *
                  </label>
                  <input
                    type="date"
                    name="dob"
                    value={formData.dob}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 rounded-xl border transition-all ${
                      errors.dob ? 'border-red-500 ring-2 ring-red-100' : 'border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-100'
                    } outline-none`}
                  />
                  {errors.dob && <p className="text-red-600 text-xs mt-1 flex items-center gap-1"><AlertCircle size={14} /> {errors.dob}</p>}
                </div>

                {/* Gender */}
                <div>
                  <label className="text-sm font-bold text-gray-700 uppercase tracking-wider block mb-2">
                    Gender *
                  </label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 rounded-xl border transition-all ${
                      errors.gender ? 'border-red-500 ring-2 ring-red-100' : 'border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-100'
                    } outline-none bg-white`}
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                  {errors.gender && <p className="text-red-600 text-xs mt-1 flex items-center gap-1"><AlertCircle size={14} /> {errors.gender}</p>}
                </div>

                {/* Blood Group */}
                <div>
                  <label className="text-sm font-bold text-gray-700 uppercase tracking-wider block mb-2">
                    Blood Group
                  </label>
                  <select
                    name="bloodGroup"
                    value={formData.bloodGroup}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-100 outline-none bg-white"
                  >
                    <option value="">Select Group</option>
                    {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(bg => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                </div>

                {/* Email */}
                <div>
                  <label className="text-sm font-bold text-gray-700 uppercase tracking-wider block mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="student@mit.edu"
                    className={`w-full px-4 py-3 rounded-xl border transition-all ${
                      errors.email ? 'border-red-500 ring-2 ring-red-100' : 'border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-100'
                    } outline-none`}
                  />
                  {errors.email && <p className="text-red-600 text-xs mt-1 flex items-center gap-1"><AlertCircle size={14} /> {errors.email}</p>}
                </div>

                {/* Phone */}
                <div>
                  <label className="text-sm font-bold text-gray-700 uppercase tracking-wider block mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+91 9876543210"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-100 outline-none"
                  />
                </div>

                {/* Address */}
                <div className="md:col-span-2">
                  <label className="text-sm font-bold text-gray-700 uppercase tracking-wider block mb-2">
                    Permanent Address
                  </label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="Enter your permanent address"
                    rows="3"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-100 outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Academic */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                <div className="flex items-start gap-3">
                  <CheckCircle2 size={20} className="text-green-600 mt-1" />
                  <div>
                    <h3 className="font-bold text-green-900">Academic Foundation</h3>
                    <p className="text-sm text-green-700 mt-1">Specify the course of study and institutional classification for the student.</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Enrollment Year */}
                <div>
                  <label className="text-sm font-bold text-gray-700 uppercase tracking-wider block mb-2">
                    Enrollment Year
                  </label>
                  <select
                    name="year"
                    value={formData.year}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-100 outline-none bg-white"
                  >
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year</option>
                    <option value="3rd Year">3rd Year</option>
                    <option value="4th Year">4th Year</option>
                  </select>
                </div>

                {/* Batch */}
                <div>
                  <label className="text-sm font-bold text-gray-700 uppercase tracking-wider block mb-2">
                    Batch
                  </label>
                  <select
                    name="semester"
                    value={formData.semester}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-100 outline-none bg-white"
                  >
                    {getSemOptions().map(sem => (
                      <option key={sem} value={sem}>Batch {sem}</option>
                    ))}
                  </select>
                </div>

                {/* Department */}
                <div>
                  <label className="text-sm font-bold text-gray-700 uppercase tracking-wider block mb-2">
                    Department
                  </label>
                  <select
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-100 outline-none bg-white"
                  >
                    <option value="Computer Science">Computer Science & Engineering</option>
                    <option value="Electrical">Electrical Engineering</option>
                    <option value="Mechanical">Mechanical Engineering</option>
                    <option value="Civil">Civil Engineering</option>
                    <option value="Electronics">Electronics & Communication</option>
                  </select>
                </div>

                {/* Degree Program */}
                <div>
                  <label className="text-sm font-bold text-gray-700 uppercase tracking-wider block mb-2">
                    Degree Program
                  </label>
                  <select
                    name="admissionType"
                    value={formData.admissionType}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-100 outline-none bg-white"
                  >
                    <option value="Regular">B.Tech Artificial Intelligence</option>
                    <option value="Merit">B.Tech Artificial Intelligence (Merit)</option>
                    <option value="Sponsored">B.Tech Artificial Intelligence (Sponsored)</option>
                  </select>
                </div>

                {/* Section */}
                <div>
                  <label className="text-sm font-bold text-gray-700 uppercase tracking-wider block mb-2">
                    Section
                  </label>
                  <select
                    name="section"
                    value={formData.section}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-100 outline-none bg-white"
                  >
                    <option value="A">Section A</option>
                    <option value="B">Section B</option>
                    <option value="C">Section C</option>
                  </select>
                </div>

                {/* Enroll Date */}
                <div>
                  <label className="text-sm font-bold text-gray-700 uppercase tracking-wider block mb-2">
                    Enrollment Date
                  </label>
                  <input
                    type="date"
                    name="enrollDate"
                    value={formData.enrollDate}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-100 outline-none"
                  />
                </div>

                {/* Previous Institution */}
                <div className="md:col-span-2">
                  <label className="text-sm font-bold text-gray-700 uppercase tracking-wider block mb-2">
                    Previous Institution
                  </label>
                  <input
                    type="text"
                    name="previousInstitution"
                    value={formData.previousInstitution}
                    onChange={handleChange}
                    placeholder="Name of previous school/college"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-100 outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Guardian */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Guardian Name */}
                <div>
                  <label className="text-sm font-bold text-gray-700 uppercase tracking-wider block mb-2">
                    Guardian Name *
                  </label>
                  <input
                    type="text"
                    name="guardianName"
                    value={formData.guardianName}
                    onChange={handleChange}
                    placeholder="Full name"
                    className={`w-full px-4 py-3 rounded-xl border transition-all ${
                      errors.guardianName ? 'border-red-500 ring-2 ring-red-100' : 'border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-100'
                    } outline-none`}
                  />
                  {errors.guardianName && <p className="text-red-600 text-xs mt-1 flex items-center gap-1"><AlertCircle size={14} /> {errors.guardianName}</p>}
                </div>

                {/* Relationship */}
                <div>
                  <label className="text-sm font-bold text-gray-700 uppercase tracking-wider block mb-2">
                    Relationship
                  </label>
                  <select
                    name="relationship"
                    value={formData.relationship}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-100 outline-none bg-white"
                  >
                    {['Father', 'Mother', 'Legal Guardian', 'Sibling', 'Relative'].map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>

                {/* Guardian Phone */}
                <div>
                  <label className="text-sm font-bold text-gray-700 uppercase tracking-wider block mb-2">
                    Guardian Phone *
                  </label>
                  <input
                    type="tel"
                    name="guardianPhone"
                    value={formData.guardianPhone}
                    onChange={handleChange}
                    placeholder="+91 9876543210"
                    className={`w-full px-4 py-3 rounded-xl border transition-all ${
                      errors.guardianPhone ? 'border-red-500 ring-2 ring-red-100' : 'border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-100'
                    } outline-none`}
                  />
                  {errors.guardianPhone && <p className="text-red-600 text-xs mt-1 flex items-center gap-1"><AlertCircle size={14} /> {errors.guardianPhone}</p>}
                </div>

                {/* Guardian Email */}
                <div>
                  <label className="text-sm font-bold text-gray-700 uppercase tracking-wider block mb-2">
                    Guardian Email
                  </label>
                  <input
                    type="email"
                    name="guardianEmail"
                    value={formData.guardianEmail}
                    onChange={handleChange}
                    placeholder="guardian@example.com"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-100 outline-none"
                  />
                </div>

                {/* Guardian Occupation */}
                <div className="md:col-span-2">
                  <label className="text-sm font-bold text-gray-700 uppercase tracking-wider block mb-2">
                    Guardian Occupation
                  </label>
                  <input
                    type="text"
                    name="guardianOccupation"
                    value={formData.guardianOccupation}
                    onChange={handleChange}
                    placeholder="e.g., Engineer, Teacher, Businessman"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-100 outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Documents */}
          {step === 4 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  { field: 'marksheet10', label: '10th Marksheet', required: true },
                  { field: 'marksheet12', label: '12th Marksheet', required: true },
                  { field: 'aadhar', label: 'Aadhar Card', required: true },
                  { field: 'photo', label: 'Passport Photo', required: true },
                  { field: 'tc', label: 'Transfer Certificate', required: false },
                ].map(doc => (
                  <div key={doc.field} className="relative">
                    <label className="text-sm font-bold text-gray-700 uppercase tracking-wider block mb-2">
                      {doc.label} {doc.required && '*'}
                    </label>
                    <div
                      className={`border-2 border-dashed rounded-xl p-4 hover:border-green-300 hover:bg-green-50 transition-all group cursor-pointer ${
                        errors[doc.field] ? 'border-red-500 bg-red-50' : 'border-gray-200'
                      }`}
                      onClick={() => document.getElementById(`file-${doc.field}`)?.click()}
                    >
                      <input
                        id={`file-${doc.field}`}
                        type="file"
                        onChange={(e) => handleFileChange(e, doc.field)}
                        className="hidden"
                        accept="image/*,.pdf"
                      />
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          formData.docs[doc.field] ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400 group-hover:bg-green-100 group-hover:text-green-600'
                        }`}>
                          <span className="material-symbols-outlined text-lg">{formData.docs[doc.field] ? 'verified' : 'upload'}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-gray-700 truncate">{doc.label}</p>
                          <p className="text-[10px] text-gray-400 truncate">
                            {formData.docs[doc.field] ? formData.docs[doc.field].name : 'Click to browse or drag & drop'}
                          </p>
                        </div>
                      </div>
                    </div>
                    {errors[doc.field] && <p className="text-red-600 text-xs mt-1 flex items-center gap-1"><AlertCircle size={14} /> {errors[doc.field]}</p>}
                  </div>
                ))}

                {/* Additional Documents */}
                <div className="md:col-span-2 border-2 border-dashed border-gray-200 rounded-xl p-4 hover:border-green-300 hover:bg-green-50 transition-all group cursor-pointer">
                  <input type="file" multiple className="absolute inset-0 opacity-0 cursor-pointer" />
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gray-100 text-gray-400 group-hover:bg-green-100 group-hover:text-green-600 flex items-center justify-center">
                      <span className="material-symbols-outlined text-lg">add_circle</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-gray-700">Additional Documents</p>
                      <p className="text-[10px] text-gray-400">Multiple files allowed</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Review */}
          {step === 5 && (
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 transform rotate-12 opacity-5 scale-150">
                  <span className="material-symbols-outlined text-[120px] text-green-600">check_circle</span>
                </div>
                <div className="relative">
                  <h3 className="text-2xl font-bold text-green-900 mb-2">Almost Complete!</h3>
                  <p className="text-green-700">Review all information before submitting. You can make changes by going back to the previous steps.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                  <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-4">Personal Information</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-gray-600">Name:</span> <span className="font-medium">{formData.name}</span></div>
                    <div className="flex justify-between"><span className="text-gray-600">Email:</span> <span className="font-medium">{formData.email}</span></div>
                    <div className="flex justify-between"><span className="text-gray-600">Phone:</span> <span className="font-medium">{formData.phone || 'N/A'}</span></div>
                    <div className="flex justify-between"><span className="text-gray-600">Gender:</span> <span className="font-medium">{formData.gender}</span></div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                  <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-4">Academic Information</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-gray-600">Department:</span> <span className="font-medium">{formData.department}</span></div>
                    <div className="flex justify-between"><span className="text-gray-600">Year:</span> <span className="font-medium">{formData.year}</span></div>
                    <div className="flex justify-between"><span className="text-gray-600">Student ID:</span> <span className="font-medium text-green-600">{formData.id}</span></div>
                    <div className="flex justify-between"><span className="text-gray-600">Enrollment Date:</span> <span className="font-medium">{formData.enrollDate}</span></div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 md:col-span-2">
                  <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-4">Guardian Information</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-gray-600">Guardian Name:</span> <span className="font-medium">{formData.guardianName}</span></div>
                    <div className="flex justify-between"><span className="text-gray-600">Relationship:</span> <span className="font-medium">{formData.relationship}</span></div>
                    <div className="flex justify-between"><span className="text-gray-600">Phone:</span> <span className="font-medium">{formData.guardianPhone}</span></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="mt-8 pt-6 border-t border-gray-200 flex gap-4">
            <button
              onClick={handlePrevious}
              disabled={step === 1}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
                step === 1
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <ChevronLeft size={18} />
              Previous
            </button>

            <button
              onClick={handleSaveDraft}
              className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium transition-all"
            >
              Save Draft
            </button>

            <div className="flex-1" />

            {step < 5 ? (
              <button
                onClick={handleNext}
                className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-all"
              >
                Next
                <ChevronRight size={18} />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-all disabled:bg-gray-400"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Application'}
              </button>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
