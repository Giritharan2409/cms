import { X, Mail, Phone, MapPin, Briefcase, Calendar, Award, BookOpen } from 'lucide-react';

export default function FacultyDetailsModal({ faculty, isOpen, onClose, onOpenProfile }) {
  if (!isOpen || !faculty) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header with Gradient */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 text-white p-8 flex justify-between items-start rounded-t-2xl">
          <div className="flex-1">
            <h2 className="text-4xl font-bold mb-2">{faculty.name}</h2>
            <div className="flex items-center gap-3 text-blue-100">
              <Award size={18} />
              <p className="text-lg font-medium">{faculty.designation}</p>
              <span className="text-blue-200">•</span>
              <p className="text-lg font-medium">{faculty.departmentId}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-blue-700 p-2 rounded-lg transition duration-200 hover:scale-110"
          >
            <X size={28} />
          </button>
        </div>

        {/* Content */}
        <div className="p-8 space-y-8">
          {/* Status Badges */}
          <div className="flex gap-3 flex-wrap">
            <span className={`px-4 py-2 rounded-full text-sm font-bold ${
              faculty.employment_status === 'Active' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-yellow-100 text-yellow-800'
            }`}>
              ● {faculty.employment_status || 'Active'}
            </span>
            {faculty.contract_end_date && (
              <span className="px-4 py-2 rounded-full text-sm font-bold bg-blue-100 text-blue-800">
                Contract ends: {new Date(faculty.contract_end_date).toLocaleDateString()}
              </span>
            )}
          </div>

          {/* Contact Information */}
          <div>
            <h3 className="text-xl font-bold text-slate-900 mb-5 pb-3 border-b-2 border-blue-600">
              Contact Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-4 p-4 bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-lg hover:shadow-md transition">
                <div className="p-3 bg-blue-600 text-white rounded-lg">
                  <Mail size={20} />
                </div>
                <div>
                  <p className="text-xs font-bold text-blue-600 uppercase tracking-wider">Email</p>
                  <a href={`mailto:${faculty.email}`} className="text-sm font-semibold text-slate-900 hover:text-blue-600 transition">
                    {faculty.email}
                  </a>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-lg hover:shadow-md transition">
                <div className="p-3 bg-emerald-600 text-white rounded-lg">
                  <Phone size={20} />
                </div>
                <div>
                  <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Phone</p>
                  <p className="text-sm font-semibold text-slate-900">{faculty.phone || 'Not provided'}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-lg hover:shadow-md transition">
                <div className="p-3 bg-purple-600 text-white rounded-lg">
                  <MapPin size={20} />
                </div>
                <div>
                  <p className="text-xs font-bold text-purple-600 uppercase tracking-wider">Office Location</p>
                  <p className="text-sm font-semibold text-slate-900">{faculty.office_location || 'Not assigned'}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 bg-gradient-to-br from-orange-50 to-orange-100/50 rounded-lg hover:shadow-md transition">
                <div className="p-3 bg-orange-600 text-white rounded-lg">
                  <Briefcase size={20} />
                </div>
                <div>
                  <p className="text-xs font-bold text-orange-600 uppercase tracking-wider">Employee ID</p>
                  <p className="text-sm font-semibold text-slate-900">{faculty.employeeId}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Academic Details */}
          <div>
            <h3 className="text-xl font-bold text-slate-900 mb-5 pb-3 border-b-2 border-blue-600">
              Academic Details
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-l-4 border-blue-600 rounded-lg p-4 hover:shadow-lg transition">
                <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-2">Qualification</p>
                <p className="text-sm font-bold text-slate-900">{faculty.qualification || 'Not provided'}</p>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 border-l-4 border-purple-600 rounded-lg p-4 hover:shadow-lg transition">
                <p className="text-xs font-bold text-purple-600 uppercase tracking-wider mb-2">Subject</p>
                <p className="text-sm font-bold text-slate-900">{faculty.subject || 'Not assigned'}</p>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-green-100 border-l-4 border-green-600 rounded-lg p-4 hover:shadow-lg transition">
                <p className="text-xs font-bold text-green-600 uppercase tracking-wider mb-2">Department</p>
                <p className="text-sm font-bold text-slate-900">{faculty.departmentId || 'Not assigned'}</p>
              </div>
              <div className="bg-gradient-to-br from-orange-50 to-orange-100 border-l-4 border-orange-600 rounded-lg p-4 hover:shadow-lg transition">
                <p className="text-xs font-bold text-orange-600 uppercase tracking-wider mb-2">Joining Date</p>
                <p className="text-sm font-bold text-slate-900">
                  {faculty.joining_date ? new Date(faculty.joining_date).toLocaleDateString() : 'Not provided'}
                </p>
              </div>
            </div>
          </div>

          {/* Experience & Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-lg p-6 border border-indigo-200">
              <div className="flex items-center gap-3 mb-4">
                <Calendar className="text-indigo-600" size={24} />
                <h4 className="text-lg font-bold text-slate-900">Experience</h4>
              </div>
              <p className="text-3xl font-bold text-indigo-600">{faculty.experience_years || 0}</p>
              <p className="text-sm text-slate-600 mt-2">Years of experience</p>
            </div>

            <div className="bg-gradient-to-br from-cyan-50 to-cyan-100 rounded-lg p-6 border border-cyan-200">
              <div className="flex items-center gap-3 mb-4">
                <BookOpen className="text-cyan-600" size={24} />
                <h4 className="text-lg font-bold text-slate-900">Attendance</h4>
              </div>
              <p className="text-3xl font-bold text-cyan-600">{faculty.attendance_rate || 0}%</p>
              <p className="text-sm text-slate-600 mt-2">Current attendance rate</p>
            </div>
          </div>

          {/* Specializations */}
          {faculty.specializations && faculty.specializations.length > 0 && (
            <div>
              <h3 className="text-xl font-bold text-slate-900 mb-4 pb-3 border-b-2 border-blue-600">
                Specializations
              </h3>
              <div className="flex flex-wrap gap-3">
                {faculty.specializations.map((spec, i) => (
                  <span
                    key={i}
                    className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full text-sm font-semibold shadow-md hover:shadow-lg transition"
                  >
                    {spec}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-6 border-t border-slate-200">
            <button
              onClick={() => onOpenProfile?.(faculty)}
              className="flex-1 px-6 py-3 bg-white text-blue-700 border border-blue-200 rounded-lg font-bold hover:bg-blue-50 transition"
            >
              Open Full Profile
            </button>
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-bold hover:from-blue-700 hover:to-blue-800 transition shadow-lg hover:shadow-xl transform hover:scale-105 duration-200"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
