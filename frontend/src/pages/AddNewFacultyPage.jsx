import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { API_BASE } from '../api/apiBase';
import { ChevronLeft, ChevronRight, CheckCircle2, AlertCircle } from 'lucide-react';

export default function AddNewFacultyPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const initialData = {
    // Personal
    employeeId: `FAC-2025-${Math.floor(1000 + Math.random() * 9000)}`,
    name: '',
    dob: '',
    gender: 'Male',
    // Contact
    email: '',
    phone: '',
    officePhone: '',
    // Department & Designation
    departmentId: '',
    designation: '',
    employment_status: 'Active',
    office_location: '',
    // Academic
    qualifications: '',
    specialization: '',
    // Professional
    experience: 0,
    avatar: null,
  };

  const [formData, setFormData] = useState(initialData);
  const [successMsg, setSuccessMsg] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateStep = (s) => {
    let newErrors = {};
    if (s === 1) {
      if (!formData.name) newErrors.name = 'Full Name is required';
      if (!formData.dob) newErrors.dob = 'Date of birth is required';
    } else if (s === 2) {
      if (!formData.email) {
        newErrors.email = 'Email is required';
      } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
        newErrors.email = 'Email is invalid';
      }
      if (!formData.phone) newErrors.phone = 'Phone is required';
    } else if (s === 4) {
      if (!formData.departmentId) newErrors.departmentId = 'Department is required';
      if (!formData.designation) newErrors.designation = 'Designation is required';
    } else if (s === 5) {
      if (!formData.qualifications) newErrors.qualifications = 'Qualifications are required';
    } else if (s === 6) {
      if (!formData.specialization) newErrors.specialization = 'Specialization is required';
      if (!formData.experience) newErrors.experience = 'Experience is required';
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
    localStorage.setItem('add_faculty_draft', JSON.stringify(formData));
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
        };

        const res = await fetch(`${API_BASE}/faculty`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.detail || 'Failed to save faculty');
        }

        const savedFaculty = await res.json();
        console.log('Success:', savedFaculty);

        localStorage.removeItem('add_faculty_draft');
        setSuccessMessage('Faculty member added successfully!');

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

  const steps = [
    { id: 1, label: 'Personal', short: 'P' },
    { id: 2, label: 'Contact', short: 'C' },
    { id: 3, label: 'Employment', short: 'E' },
    { id: 4, label: 'Department', short: 'D' },
    { id: 5, label: 'Qualifications', short: 'Q' },
    { id: 6, label: 'Professional', short: 'Pr' },
    { id: 7, label: 'Experience', short: 'Ex' },
    { id: 8, label: 'Review', short: 'R' },
  ];

  return (
    <Layout title="New Faculty Admission">
      <div className="max-w-5xl mx-auto">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-6">
          <button onClick={() => navigate('/admission')} className="hover:text-green-600 transition-colors">
            Admission
          </button>
          <span>›</span>
          <span className="text-gray-900 font-medium">Add Faculty</span>
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
                  <p className="text-sm text-gray-600">Basic personal details</p>
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
                    Gender
                  </label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-100 outline-none bg-white text-sm"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-bold text-gray-700 uppercase tracking-wider block mb-2">
                    Employee ID
                  </label>
                  <input
                    type="text"
                    value={formData.employeeId}
                    disabled
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-gray-500 outline-none text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-1">Auto-generated</p>
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
                  <p className="text-sm text-gray-600">Communication details</p>
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
                    placeholder="faculty@mit.edu"
                    className={`w-full px-4 py-2.5 rounded-lg border transition-all ${
                      errors.email ? 'border-red-500 ring-2 ring-red-100' : 'border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-100'
                    } outline-none text-sm`}
                  />
                  {errors.email && <p className="text-red-600 text-xs mt-1 flex items-center gap-1"><AlertCircle size={12} /> {errors.email}</p>}
                </div>

                <div>
                  <label className="text-sm font-bold text-gray-700 uppercase tracking-wider block mb-2">
                    Personal Phone *
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

                <div>
                  <label className="text-sm font-bold text-gray-700 uppercase tracking-wider block mb-2">
                    Office Phone
                  </label>
                  <input
                    type="tel"
                    name="officePhone"
                    value={formData.officePhone}
                    onChange={handleChange}
                    placeholder="Office extension"
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-100 outline-none text-sm"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Employment Status */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                  <span className="text-lg font-bold text-green-600">3</span>
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Employment Status</h3>
                  <p className="text-sm text-gray-600">Current employment details</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-bold text-gray-700 uppercase tracking-wider block mb-2">
                    Employment Status
                  </label>
                  <select
                    name="employment_status"
                    value={formData.employment_status}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-100 outline-none bg-white text-sm"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Leave">On Leave</option>
                    <option value="Contract">Contract</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-bold text-gray-700 uppercase tracking-wider block mb-2">
                    Office Location
                  </label>
                  <input
                    type="text"
                    name="office_location"
                    value={formData.office_location}
                    onChange={handleChange}
                    placeholder="e.g., Block A, Room 101"
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-100 outline-none text-sm"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Department & Designation */}
          {step === 4 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                  <span className="text-lg font-bold text-green-600">4</span>
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Department & Designation</h3>
                  <p className="text-sm text-gray-600">Academic department and role</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-bold text-gray-700 uppercase tracking-wider block mb-2">
                    Department *
                  </label>
                  <select
                    name="departmentId"
                    value={formData.departmentId}
                    onChange={handleChange}
                    className={`w-full px-4 py-2.5 rounded-lg border transition-all ${
                      errors.departmentId ? 'border-red-500 ring-2 ring-red-100' : 'border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-100'
                    } outline-none bg-white text-sm`}
                  >
                    <option value="">Select Department</option>
                    <option value="CSE">Computer Science & Engineering</option>
                    <option value="ECE">Electrical Engineering</option>
                    <option value="ME">Mechanical Engineering</option>
                    <option value="CE">Civil Engineering</option>
                  </select>
                  {errors.departmentId && <p className="text-red-600 text-xs mt-1 flex items-center gap-1"><AlertCircle size={12} /> {errors.departmentId}</p>}
                </div>

                <div>
                  <label className="text-sm font-bold text-gray-700 uppercase tracking-wider block mb-2">
                    Designation *
                  </label>
                  <select
                    name="designation"
                    value={formData.designation}
                    onChange={handleChange}
                    className={`w-full px-4 py-2.5 rounded-lg border transition-all ${
                      errors.designation ? 'border-red-500 ring-2 ring-red-100' : 'border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-100'
                    } outline-none bg-white text-sm`}
                  >
                    <option value="">Select Designation</option>
                    <option value="Professor">Professor</option>
                    <option value="Associate Professor">Associate Professor</option>
                    <option value="Assistant Professor">Assistant Professor</option>
                    <option value="Lecturer">Lecturer</option>
                  </select>
                  {errors.designation && <p className="text-red-600 text-xs mt-1 flex items-center gap-1"><AlertCircle size={12} /> {errors.designation}</p>}
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Qualifications */}
          {step === 5 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                  <span className="text-lg font-bold text-green-600">5</span>
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Qualifications</h3>
                  <p className="text-sm text-gray-600">Educational background</p>
                </div>
              </div>

              <div>
                <label className="text-sm font-bold text-gray-700 uppercase tracking-wider block mb-2">
                  Qualifications *
                </label>
                <textarea
                  name="qualifications"
                  value={formData.qualifications}
                  onChange={handleChange}
                  placeholder="e.g., B.Tech in CSE, M.Tech in AI, PhD in Machine Learning"
                  rows="4"
                  className={`w-full px-4 py-2.5 rounded-lg border transition-all ${
                    errors.qualifications ? 'border-red-500 ring-2 ring-red-100' : 'border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-100'
                  } outline-none text-sm`}
                />
                {errors.qualifications && <p className="text-red-600 text-xs mt-1 flex items-center gap-1"><AlertCircle size={12} /> {errors.qualifications}</p>}
              </div>
            </div>
          )}

          {/* Step 6: Professional Details */}
          {step === 6 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                  <span className="text-lg font-bold text-green-600">6</span>
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Professional Details</h3>
                  <p className="text-sm text-gray-600">Specialization and expertise</p>
                </div>
              </div>

              <div>
                <label className="text-sm font-bold text-gray-700 uppercase tracking-wider block mb-2">
                  Specialization *
                </label>
                <textarea
                  name="specialization"
                  value={formData.specialization}
                  onChange={handleChange}
                  placeholder="Areas of specialization (e.g., Artificial Intelligence, Machine Learning)"
                  rows="4"
                  className={`w-full px-4 py-2.5 rounded-lg border transition-all ${
                    errors.specialization ? 'border-red-500 ring-2 ring-red-100' : 'border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-100'
                  } outline-none text-sm`}
                />
                {errors.specialization && <p className="text-red-600 text-xs mt-1 flex items-center gap-1"><AlertCircle size={12} /> {errors.specialization}</p>}
              </div>
            </div>
          )}

          {/* Step 7: Experience */}
          {step === 7 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                  <span className="text-lg font-bold text-green-600">7</span>
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Experience</h3>
                  <p className="text-sm text-gray-600">Professional experience</p>
                </div>
              </div>

              <div>
                <label className="text-sm font-bold text-gray-700 uppercase tracking-wider block mb-2">
                  Years of Experience *
                </label>
                <input
                  type="number"
                  name="experience"
                  value={formData.experience}
                  onChange={handleChange}
                  placeholder="e.g., 10"
                  min="0"
                  className={`w-full px-4 py-2.5 rounded-lg border transition-all ${
                    errors.experience ? 'border-red-500 ring-2 ring-red-100' : 'border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-100'
                  } outline-none text-sm`}
                />
                {errors.experience && <p className="text-red-600 text-xs mt-1 flex items-center gap-1"><AlertCircle size={12} /> {errors.experience}</p>}
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
                    <p className="text-sm text-green-700">Review the information below and submit the faculty profile.</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <h4 className="text-xs font-bold text-gray-700 uppercase mb-3">Personal</h4>
                  <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between"><span className="text-gray-600">Name:</span> <span className="font-medium truncate">{formData.name}</span></div>
                    <div className="flex justify-between"><span className="text-gray-600">ID:</span> <span className="font-medium text-green-600">{formData.employeeId}</span></div>
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
                  <h4 className="text-xs font-bold text-gray-700 uppercase mb-3">Department</h4>
                  <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between"><span className="text-gray-600">Department:</span> <span className="font-medium">{formData.departmentId}</span></div>
                    <div className="flex justify-between"><span className="text-gray-600">Designation:</span> <span className="font-medium">{formData.designation}</span></div>
                    <div className="flex justify-between"><span className="text-gray-600">Status:</span> <span className="font-medium text-green-600">{formData.employment_status}</span></div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <h4 className="text-xs font-bold text-gray-700 uppercase mb-3">Experience</h4>
                  <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between"><span className="text-gray-600">Years:</span> <span className="font-medium">{formData.experience}</span></div>
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
                {isSubmitting ? 'Submitting...' : 'Submit Profile'}
              </button>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default function AddNewFacultyPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const initialData = {
    employeeId: `FAC-2025-${Math.floor(1000 + Math.random() * 9000)}`,
    name: '',
    email: '',
    phone: '',
    departmentId: '',
    designation: '',
    employment_status: 'Active',
    office_location: '',
    qualifications: '',
    specialization: '',
    experience: '',
    officePhone: '',
    avatar: null,
  };

  const [formData, setFormData] = useState(initialData);
  const [successMsg, setSuccessMsg] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateStep = (s) => {
    let newErrors = {};
    if (s === 1) {
      if (!formData.name) newErrors.name = 'Full Name is required';
      if (!formData.email) {
        newErrors.email = 'Email is required';
      } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
        newErrors.email = 'Email is invalid';
      }
      if (!formData.phone) newErrors.phone = 'Phone number is required';
    } else if (s === 2) {
      if (!formData.departmentId) newErrors.departmentId = 'Department is required';
      if (!formData.designation) newErrors.designation = 'Designation is required';
      if (!formData.qualifications) newErrors.qualifications = 'Qualifications are required';
    } else if (s === 3) {
      if (!formData.specialization) newErrors.specialization = 'Specialization is required';
      if (!formData.experience) newErrors.experience = 'Experience is required';
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
    localStorage.setItem('add_faculty_draft', JSON.stringify(formData));
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
        };

        const res = await fetch(`${API_BASE}/faculty`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.detail || 'Failed to save faculty');
        }

        const savedFaculty = await res.json();
        console.log('Success:', savedFaculty);

        localStorage.removeItem('add_faculty_draft');
        setSuccessMessage('Faculty member added successfully!');

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

  const steps = [
    { id: 1, label: 'Personal' },
    { id: 2, label: 'Academic' },
    { id: 3, label: 'Professional' },
    { id: 4, label: 'Review' },
  ];

  return (
    <Layout title="Add New Faculty">
      <div className="max-w-6xl mx-auto">
        {/* Header with Breadcrumb */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3 text-sm text-gray-600">
              <button onClick={() => navigate('/admission')} className="hover:text-green-600 transition-colors">
                Admission
              </button>
              <span>›</span>
              <span className="text-gray-900 font-medium">New Faculty</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-xl">
                <UserPlus size={28} className="text-green-600" />
              </div>
              Add New Faculty
            </h1>
            <p className="text-sm text-gray-600 mt-2">Expand your academic community with experienced faculty members.</p>
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

                {/* Employee ID */}
                <div>
                  <label className="text-sm font-bold text-gray-700 uppercase tracking-wider block mb-2">
                    Employee ID
                  </label>
                  <input
                    type="text"
                    name="employeeId"
                    value={formData.employeeId}
                    disabled
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 outline-none text-gray-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Auto-generated ID</p>
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
                    placeholder="faculty@mit.edu"
                    className={`w-full px-4 py-3 rounded-xl border transition-all ${
                      errors.email ? 'border-red-500 ring-2 ring-red-100' : 'border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-100'
                    } outline-none`}
                  />
                  {errors.email && <p className="text-red-600 text-xs mt-1 flex items-center gap-1"><AlertCircle size={14} /> {errors.email}</p>}
                </div>

                {/* Phone */}
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
                    className={`w-full px-4 py-3 rounded-xl border transition-all ${
                      errors.phone ? 'border-red-500 ring-2 ring-red-100' : 'border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-100'
                    } outline-none`}
                  />
                  {errors.phone && <p className="text-red-600 text-xs mt-1 flex items-center gap-1"><AlertCircle size={14} /> {errors.phone}</p>}
                </div>

                {/* Office Phone */}
                <div className="md:col-span-2">
                  <label className="text-sm font-bold text-gray-700 uppercase tracking-wider block mb-2">
                    Office Phone
                  </label>
                  <input
                    type="tel"
                    name="officePhone"
                    value={formData.officePhone}
                    onChange={handleChange}
                    placeholder="+91 XXXX XXXXXX"
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
                    <h3 className="font-bold text-green-900">Academic Details</h3>
                    <p className="text-sm text-green-700 mt-1">Specify the department, designation, and academic qualifications.</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Department */}
                <div>
                  <label className="text-sm font-bold text-gray-700 uppercase tracking-wider block mb-2">
                    Department *
                  </label>
                  <select
                    name="departmentId"
                    value={formData.departmentId}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 rounded-xl border transition-all ${
                      errors.departmentId ? 'border-red-500 ring-2 ring-red-100' : 'border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-100'
                    } outline-none bg-white`}
                  >
                    <option value="">Select Department</option>
                    <option value="CSE">Computer Science & Engineering</option>
                    <option value="ECE">Electrical Engineering</option>
                    <option value="ME">Mechanical Engineering</option>
                    <option value="CE">Civil Engineering</option>
                    <option value="EE">Electronics & Communication</option>
                  </select>
                  {errors.departmentId && <p className="text-red-600 text-xs mt-1 flex items-center gap-1"><AlertCircle size={14} /> {errors.departmentId}</p>}
                </div>

                {/* Designation */}
                <div>
                  <label className="text-sm font-bold text-gray-700 uppercase tracking-wider block mb-2">
                    Designation *
                  </label>
                  <select
                    name="designation"
                    value={formData.designation}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 rounded-xl border transition-all ${
                      errors.designation ? 'border-red-500 ring-2 ring-red-100' : 'border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-100'
                    } outline-none bg-white`}
                  >
                    <option value="">Select Designation</option>
                    <option value="Professor">Professor</option>
                    <option value="Associate Professor">Associate Professor</option>
                    <option value="Assistant Professor">Assistant Professor</option>
                    <option value="Lecturer">Lecturer</option>
                    <option value="Teaching Fellow">Teaching Fellow</option>
                  </select>
                  {errors.designation && <p className="text-red-600 text-xs mt-1 flex items-center gap-1"><AlertCircle size={14} /> {errors.designation}</p>}
                </div>

                {/* Qualifications */}
                <div className="md:col-span-2">
                  <label className="text-sm font-bold text-gray-700 uppercase tracking-wider block mb-2">
                    Qualifications *
                  </label>
                  <textarea
                    name="qualifications"
                    value={formData.qualifications}
                    onChange={handleChange}
                    placeholder="e.g., B.Tech in CSE, M.Tech in AI, PhD in Machine Learning"
                    rows="3"
                    className={`w-full px-4 py-3 rounded-xl border transition-all ${
                      errors.qualifications ? 'border-red-500 ring-2 ring-red-100' : 'border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-100'
                    } outline-none`}
                  />
                  {errors.qualifications && <p className="text-red-600 text-xs mt-1 flex items-center gap-1"><AlertCircle size={14} /> {errors.qualifications}</p>}
                </div>

                {/* Employment Status */}
                <div>
                  <label className="text-sm font-bold text-gray-700 uppercase tracking-wider block mb-2">
                    Employment Status
                  </label>
                  <select
                    name="employment_status"
                    value={formData.employment_status}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-100 outline-none bg-white"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Leave">Leave</option>
                  </select>
                </div>

                {/* Office Location */}
                <div>
                  <label className="text-sm font-bold text-gray-700 uppercase tracking-wider block mb-2">
                    Office Location
                  </label>
                  <input
                    type="text"
                    name="office_location"
                    value={formData.office_location}
                    onChange={handleChange}
                    placeholder="e.g., Block A, Room 101"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-100 outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Professional */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Specialization */}
                <div className="md:col-span-2">
                  <label className="text-sm font-bold text-gray-700 uppercase tracking-wider block mb-2">
                    Specialization *
                  </label>
                  <textarea
                    name="specialization"
                    value={formData.specialization}
                    onChange={handleChange}
                    placeholder="Enter areas of specialization and expertise"
                    rows="3"
                    className={`w-full px-4 py-3 rounded-xl border transition-all ${
                      errors.specialization ? 'border-red-500 ring-2 ring-red-100' : 'border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-100'
                    } outline-none`}
                  />
                  {errors.specialization && <p className="text-red-600 text-xs mt-1 flex items-center gap-1"><AlertCircle size={14} /> {errors.specialization}</p>}
                </div>

                {/* Experience */}
                <div className="md:col-span-2">
                  <label className="text-sm font-bold text-gray-700 uppercase tracking-wider block mb-2">
                    Years of Experience *
                  </label>
                  <input
                    type="number"
                    name="experience"
                    value={formData.experience}
                    onChange={handleChange}
                    placeholder="e.g., 10"
                    className={`w-full px-4 py-3 rounded-xl border transition-all ${
                      errors.experience ? 'border-red-500 ring-2 ring-red-100' : 'border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-100'
                    } outline-none`}
                  />
                  {errors.experience && <p className="text-red-600 text-xs mt-1 flex items-center gap-1"><AlertCircle size={14} /> {errors.experience}</p>}
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Review */}
          {step === 4 && (
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 transform rotate-12 opacity-5 scale-150">
                  <span className="material-symbols-outlined text-[120px] text-green-600">check_circle</span>
                </div>
                <div className="relative">
                  <h3 className="text-2xl font-bold text-green-900 mb-2">Almost Complete!</h3>
                  <p className="text-green-700">Review all information before submitting the faculty profile.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                  <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-4">Personal Information</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-gray-600">Name:</span> <span className="font-medium">{formData.name}</span></div>
                    <div className="flex justify-between"><span className="text-gray-600">Employee ID:</span> <span className="font-medium text-green-600">{formData.employeeId}</span></div>
                    <div className="flex justify-between"><span className="text-gray-600">Email:</span> <span className="font-medium">{formData.email}</span></div>
                    <div className="flex justify-between"><span className="text-gray-600">Phone:</span> <span className="font-medium">{formData.phone}</span></div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                  <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-4">Academic Information</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-gray-600">Department:</span> <span className="font-medium">{formData.departmentId}</span></div>
                    <div className="flex justify-between"><span className="text-gray-600">Designation:</span> <span className="font-medium">{formData.designation}</span></div>
                    <div className="flex justify-between"><span className="text-gray-600">Status:</span> <span className="font-medium text-green-600">{formData.employment_status}</span></div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 md:col-span-2">
                  <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-4">Professional Information</h4>
                  <div className="space-y-3 text-sm">
                    <div>
                      <span className="text-gray-600 font-semibold block mb-1">Specialization:</span>
                      <span className="font-medium">{formData.specialization}</span>
                    </div>
                    <div>
                      <span className="text-gray-600 font-semibold block mb-1">Experience:</span>
                      <span className="font-medium">{formData.experience} years</span>
                    </div>
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

            {step < 4 ? (
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
                {isSubmitting ? 'Submitting...' : 'Submit Profile'}
              </button>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
