import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Layout from '../components/Layout';
import AddEditFacultyModal from '../components/AddEditFacultyModal';
import RequestLeaveModal from '../components/RequestLeaveModal';
import PerformanceEvaluationModal from '../components/PerformanceEvaluationModal';
import PayrollIntegrationPanel from '../components/PayrollIntegrationPanel';
import CareerPathwayTracking from '../components/CareerPathwayTracking';
import { useAdmission } from '../context/AdmissionContext';
import { 
  ArrowLeft, User, BarChart2,
  Mail, Phone, MapPin, Briefcase, Calendar, Target, DollarSign
} from 'lucide-react';
import '../styles.css';

const API_BASE_URL = '/api';
const profileTabs = [
  { id: 'overview', label: 'Overview', icon: User },
  { id: 'performance', label: 'Performance', icon: BarChart2 },
  { id: 'payroll', label: 'Invoice', icon: DollarSign },
  { id: 'career', label: 'Career Path', icon: Target },
  { id: 'leave', label: 'Leave & Attendance', icon: Calendar }
];

export default function FacultyProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { facultyApps } = useAdmission();
  const [faculty, setFaculty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isRequestLeaveOpen, setIsRequestLeaveOpen] = useState(false);
  const [isEvalModalOpen, setIsEvalModalOpen] = useState(false);
  const [editingLeave, setEditingLeave] = useState(null);
  const [evaluations, setEvaluations] = useState([]);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [deleteConfirmation, setDeleteConfirmation] = useState(null);

  useEffect(() => {
    // Find faculty from admission context
    if (facultyApps && facultyApps.length > 0) {
      const foundFaculty = facultyApps.find(f => (f._id || f.id) === id);
      if (foundFaculty) {
        setFaculty(foundFaculty);
        setError(null);
        // Fetch evaluations and leave requests for this faculty
        fetchEvaluations(foundFaculty._id || foundFaculty.id);
        fetchLeaveRequests(foundFaculty._id || foundFaculty.id);
      } else {
        setFaculty(null);
        setError('Faculty member not found in the admission system');
      }
      setLoading(false);
    }
  }, [id, facultyApps]);

  const fetchEvaluations = async (facultyId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/faculty/${facultyId}/evaluations`);
      if (response.ok) {
        const data = await response.json();
        setEvaluations(data || []);
      }
    } catch (err) {
      console.error('Error fetching evaluations:', err);
    }
  };

  const fetchLeaveRequests = async (facultyId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/faculty/${facultyId}/leave`);
      if (response.ok) {
        const data = await response.json();
        setLeaveRequests(data || []);
      }
    } catch (err) {
      console.error('Error fetching leave requests:', err);
    }
  };

  const handleEditLeave = (leaveReq) => {
    setEditingLeave(leaveReq);
    setIsRequestLeaveOpen(true);
  };

  const handleDeleteLeave = async (leaveReq) => {
    setDeleteConfirmation(leaveReq);
  };

  const confirmDeleteLeave = async () => {
    const leaveReq = deleteConfirmation;
    setDeleteConfirmation(null);
    
    try {
      const leaveId = leaveReq._id || leaveReq.id;
      if (!leaveId) {
        alert('Cannot delete this leave request because its ID is missing.');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/faculty/${faculty._id || faculty.id || faculty.email}/leave/${leaveId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        setLeaveRequests(leaveRequests.filter(l => (l._id || l.id) !== leaveId));
        alert('Leave request deleted successfully');
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert(errorData?.detail || 'Failed to delete leave request');
      }
    } catch (err) {
      console.error('Error deleting leave request:', err);
      alert('Error deleting leave request');
    }
  };

  const generateReport = () => {
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      let yPosition = 20;
      
      const addSection = (title, yPos) => {
        doc.setFontSize(14);
        doc.setTextColor(18, 85, 171);
        doc.text(title, 14, yPos);
        doc.setDrawColor(220, 220, 220);
        doc.line(14, yPos + 2, pageWidth - 14, yPos + 2);
        return yPos + 10;
      };
      
      // Header
      doc.setFontSize(20);
      doc.setTextColor(0, 0, 0);
      doc.text('Faculty Profile Report', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 8;
      
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`Generated on: ${new Date().toLocaleDateString('en-IN')} at ${new Date().toLocaleTimeString('en-IN')}`, pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 12;
      
      // Personal Information
      yPosition = addSection('PERSONAL INFORMATION', yPosition);
      autoTable(doc, {
        startY: yPosition,
        theme: 'plain',
        head: [],
        body: [
          ['Full Name:', faculty.fullName || faculty.name || 'N/A'],
          ['Email:', faculty.email || 'N/A'],
          ['Phone:', faculty.phone || 'N/A'],
          ['Department:', faculty.department || 'N/A'],
          ['Designation:', faculty.role || faculty.designation || 'Faculty'],
          ['DOB:', faculty.dob ? new Date(faculty.dob).toLocaleDateString('en-IN') : 'N/A'],
        ],
        styles: { fontSize: 9, cellPadding: 3, textColor: 40, },
        columnStyles: { 0: { fontStyle: 'bold', cellWidth: 50, textColor: 70 } },
        margin: { left: 14, right: 14 }
      });
      
      yPosition = doc.lastAutoTable ? doc.lastAutoTable.finalY + 8 : yPosition + 50;
      
      // Academic & Professional Information
      yPosition = addSection('PROFESSIONAL DETAILS', yPosition);
      autoTable(doc, {
        startY: yPosition,
        theme: 'plain',
        head: [],
        body: [
          ['Experience:', faculty.experience || faculty.yearsOfExperience ? `${faculty.experience || faculty.yearsOfExperience} years` : 'N/A'],
          ['Gender:', faculty.gender || 'N/A'],
          ['Qualification:', faculty.qualification || faculty.highestQualification || 'N/A'],
          ['Specialization:', faculty.specialization || 'N/A'],
          ['Status:', faculty.status || 'Pending'],
        ],
        styles: { fontSize: 9, cellPadding: 3, textColor: 40 },
        columnStyles: { 0: { fontStyle: 'bold', cellWidth: 50, textColor: 70 } },
        margin: { left: 14, right: 14 }
      });
      
      yPosition = doc.lastAutoTable ? doc.lastAutoTable.finalY + 8 : yPosition + 50;
      
      // Qualifications
      if (faculty.qualifications && faculty.qualifications.length > 0) {
        yPosition = addSection('QUALIFICATIONS', yPosition);
        const qualData = faculty.qualifications.map(q => [
          q.degree || 'N/A',
          q.institution || 'N/A',
          q.year || 'N/A'
        ]);
        
        autoTable(doc, {
          startY: yPosition,
          head: [['Degree', 'Institution', 'Year']],
          body: qualData,
          styles: { fontSize: 8, cellPadding: 2, textColor: 40 },
          headStyles: { fillColor: [47, 85, 171], textColor: 255, fontStyle: 'bold' },
          margin: { left: 14, right: 14 }
        });
        
        yPosition = doc.lastAutoTable ? doc.lastAutoTable.finalY + 8 : yPosition + 30;
      }
      
      // Specializations
      if (faculty.specializations && faculty.specializations.length > 0) {
        yPosition = addSection('SPECIALIZATIONS', yPosition);
        doc.setFontSize(9);
        doc.setTextColor(40, 40, 40);
        const specializations = faculty.specializations.join(', ');
        const specLines = doc.splitTextToSize(specializations, pageWidth - 28);
        doc.text(specLines, 14, yPosition);
        yPosition += specLines.length * 4 + 5;
      }
      
      // Research Interests
      if (faculty.research_interests && faculty.research_interests.length > 0) {
        yPosition = addSection('RESEARCH INTERESTS', yPosition);
        doc.setFontSize(9);
        doc.setTextColor(40, 40, 40);
        const interests = faculty.research_interests.join(', ');
        const interestLines = doc.splitTextToSize(interests, pageWidth - 28);
        doc.text(interestLines, 14, yPosition);
        yPosition += interestLines.length * 4 + 5;
      }
      
      // Publications
      if (faculty.publications && faculty.publications.length > 0) {
        if (yPosition > pageHeight - 40) {
          doc.addPage();
          yPosition = 20;
        }
        
        yPosition = addSection('PUBLICATIONS', yPosition);
        const pubData = faculty.publications.map((p, idx) => [
          idx + 1,
          p.title || 'N/A',
          p.year || 'N/A'
        ]);
        
        autoTable(doc, {
          startY: yPosition,
          head: [['#', 'Title', 'Year']],
          body: pubData,
          styles: { fontSize: 8, cellPadding: 2, textColor: 40 },
          headStyles: { fillColor: [47, 85, 171], textColor: 255, fontStyle: 'bold' },
          margin: { left: 14, right: 14 }
        });
        
        yPosition = doc.lastAutoTable ? doc.lastAutoTable.finalY + 10 : yPosition + 40;
      }
      
      // Footer
      doc.setFontSize(8);
      doc.setTextColor(120, 120, 120);
      doc.text('This is an automatically generated report. Verify information with administration for official use.', 14, pageHeight - 10, { maxWidth: pageWidth - 28 });
      
      const filename = `Faculty_Report_${(faculty.fullName || faculty.name)?.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(filename);
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Failed to generate report');
    }
  };

  if (loading) {

    return (
      <Layout title="Loading Faculty Profile">
        <div className="flex flex-col items-center justify-center py-32 animate-pulse">
          <div className="w-24 h-24 bg-slate-100 rounded-xl mb-6" />
          <div className="w-48 h-4 bg-slate-100 rounded mb-2" />
          <div className="w-32 h-3 bg-slate-50 rounded" />
        </div>
      </Layout>
    );
  }

  if (error || !faculty) {
    return (
      <Layout title="Faculty Not Found">
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <span className="material-symbols-outlined text-6xl text-slate-300 mb-4">{error === 'Faculty not found' ? 'person_off' : 'cloud_off'}</span>
          <h2 className="text-xl font-bold text-slate-700 mb-2">{error === 'Faculty not found' ? 'Faculty Member Not Found' : 'Connection Error'}</h2>
          <p className="text-sm text-slate-500 mb-6">
            {error === 'Faculty not found' ? `No faculty record exists with ID "${id}"` : error}
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/faculty')}
              className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-50 transition-all"
            >
              Back to Faculty
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-5 py-2.5 bg-[#2563eb] text-white rounded-lg text-sm font-semibold hover:bg-[#1d4ed8] transition-all"
            >
              Reload Page
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Faculty Profile">
      <div className="page-container">
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={() => navigate('/faculty')}
          className="flex items-center gap-2.5 px-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-500 hover:text-[#1162d4] hover:border-[#1162d4] transition-all group uppercase tracking-wider"
        >
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          <span>Back to Faculty</span>
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

      <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm mb-8 relative overflow-hidden group">
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-slate-50 rounded-full opacity-50 group-hover:scale-125 transition-transform duration-1000" />
        <div className="absolute top-1/2 -right-12 w-32 h-32 bg-blue-50/30 rounded-full blur-3xl" />

        <div className="relative flex flex-col xl:flex-row xl:items-center justify-between gap-10">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-8">
            <div className="relative">
              <div className="w-32 h-32 rounded-xl bg-gradient-to-br from-[#1162d4] to-[#60a5fa] p-1 shadow-xl">
                <div className="w-full h-full rounded-lg bg-white flex items-center justify-center text-[#1162d4]">
                  <User size={46} />
                </div>
              </div>
              <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md">
                <div className={`w-5 h-5 rounded-full border-2 border-white ${faculty.status === 'Approved' ? 'bg-green-500' : 'bg-yellow-500'}`} />
              </div>
            </div>

            <div className="text-center sm:text-left">
              <div className="flex flex-col sm:flex-row items-center gap-3 mb-3">
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight leading-none">{faculty.fullName || faculty.name}</h1>
                <span className="px-2.5 py-0.5 bg-blue-50 text-[#1162d4] border border-blue-100 rounded-full text-[10px] font-bold uppercase tracking-wider mt-1 sm:mt-0">
                  {faculty.status || 'Pending'}
                </span>
              </div>

              <div className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-2">
                  <span className="text-base font-semibold text-slate-600">{faculty.role || faculty.designation || 'Faculty'}</span>
                  <span className="w-1 h-1 rounded-full bg-slate-300 hidden sm:block" />
                  <span className="text-base font-semibold text-slate-400">{faculty.department || 'N/A'}</span>
                </div>

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-5 mt-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                    <span className="material-symbols-outlined text-[20px] text-slate-300">mail</span>
                    <span className="uppercase tracking-wide">{faculty.email || 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                    <span className="material-symbols-outlined text-[20px] text-slate-300">phone</span>
                    <span className="uppercase tracking-wide">{faculty.phone || 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                    <span className="material-symbols-outlined text-[20px] text-slate-300">calendar_month</span>
                    <span className="uppercase tracking-wide">{faculty.dob ? new Date(faculty.dob).toLocaleDateString('en-IN') : 'N/A'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <button 
              onClick={generateReport}
              className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-lg text-sm font-semibold hover:bg-slate-50 transition-all shadow-sm hover:border-[#1162d4] hover:text-[#1162d4]">
              <span className="material-symbols-outlined text-[20px]">description</span>
              <span>Report</span>
            </button>
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="p-2.5 bg-white border border-slate-200 text-slate-400 rounded-lg hover:text-[#1162d4] hover:border-[#1162d4] transition-all shadow-sm group/edit"
            >
              <span className="material-symbols-outlined text-[20px] group-hover/edit:rotate-12 transition-transform">edit</span>
            </button>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-8 border-b border-slate-200 mb-8 px-4 overflow-x-auto">
        {profileTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`pb-4 text-sm font-semibold transition-all relative whitespace-nowrap ${
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

      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-4 bg-white rounded-xl border border-slate-200 p-8 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-3 mb-6 uppercase tracking-wider">
                <span className="material-symbols-outlined text-[#1162d4] text-[20px]">contact_page</span>
                Quick Info
              </h3>

              <div className="space-y-5 mb-6">
                <div className="flex items-center gap-3 text-sm font-medium text-slate-700">
                  <Mail size={18} className="text-slate-400 flex-shrink-0" />
                  <span className="break-all">{faculty.email || 'Not provided'}</span>
                </div>
                <div className="flex items-center gap-3 text-sm font-medium text-slate-700">
                  <Phone size={18} className="text-slate-400 flex-shrink-0" />
                  <span>{faculty.phone || 'Not provided'}</span>
                </div>
                <div className="flex items-center gap-3 text-sm font-medium text-slate-700">
                  <MapPin size={18} className="text-slate-400 flex-shrink-0" />
                  <span>{faculty.department || 'Department not assigned'}</span>
                </div>
                <div className="flex items-center gap-3 text-sm font-medium text-slate-700">
                  <Briefcase size={18} className="text-slate-400 flex-shrink-0" />
                  <span>{faculty.role || faculty.designation || 'Faculty Member'}</span>
                </div>
              </div>

              <div className="border-t border-slate-200 my-6" />

              <div className="mb-6">
                <h4 className="text-sm font-semibold text-slate-800 mb-3 uppercase tracking-wider">Status</h4>
                <div className="inline-block px-3 py-2 bg-blue-50 rounded-lg">
                  <p className={`text-sm font-semibold ${
                    faculty.status === 'Approved' ? 'text-green-600' : 
                    faculty.status === 'Rejected' ? 'text-red-600' : 
                    'text-orange-600'
                  }`}>
                    {faculty.status || 'Pending'}
                  </p>
                </div>
              </div>

              <div className="border-t border-slate-200 my-6" />

              <h4 className="text-sm font-semibold text-slate-800 mb-4 uppercase tracking-wider">Specializations</h4>
              {faculty.specialization ? (
                <div className="space-y-2">
                  <p className="px-2 py-1 bg-slate-50 rounded text-xs text-slate-600">
                    <p className="font-semibold text-slate-700">{faculty.specialization}</p>
                  </p>
                </div>
              ) : (
                <p className="text-sm text-slate-500 bg-slate-50 p-3 rounded">No specialization listed.</p>
              )}

              <div className="border-t border-slate-200 my-6" />

              <h4 className="text-sm font-semibold text-slate-800 mb-3 uppercase tracking-wider">Key Information</h4>
              {faculty.specialization ? (
                <div className="flex flex-wrap gap-2">
                  <span className="px-2 py-1 bg-blue-50 text-[#1162d4] rounded-full text-[10px] font-bold">
                    {faculty.specialization}
                  </span>
                </div>
              ) : (
                <p className="text-sm text-slate-500">None listed</p>
              )}
            </div>

            <div className="lg:col-span-8 space-y-8">
              <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm">
                <h3 className="text-sm font-semibold text-slate-800 mb-6 uppercase tracking-wider flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#1162d4]">badge</span>
                  Personal Information
                </h3>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Date of Birth</p>
                    <p className="text-sm font-semibold text-slate-800">
                      {faculty.dob ? new Date(faculty.dob).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Not provided'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Gender</p>
                    <p className="text-sm font-semibold text-slate-800">{faculty.gender || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Qualification</p>
                    <p className="text-sm font-semibold text-slate-800">{faculty.qualification || faculty.highestQualification || 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Experience</p>
                    <p className="text-sm font-semibold text-slate-800">
                      {faculty.experience || faculty.yearsOfExperience ? `${faculty.experience || faculty.yearsOfExperience} years` : 'Not provided'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm">
                <h3 className="text-sm font-semibold text-slate-800 mb-6 uppercase tracking-wider flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#1162d4]">work_history</span>
                  Professional Information
                </h3>
                <div className="grid grid-cols-2 gap-6 mb-6">
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Department</p>
                    <p className="text-sm font-semibold text-slate-800">
                      {faculty.department || 'Not assigned'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Status</p>
                    <p className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${
                      faculty.status === 'Approved' 
                        ? 'bg-green-50 text-green-700' 
                        : faculty.status === 'Rejected'
                        ? 'bg-red-50 text-red-700' 
                        : 'bg-yellow-50 text-yellow-700'
                    }`}>
                      {faculty.status || 'Pending'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Specialization</p>
                    <p className="text-sm font-semibold text-slate-800">
                      {faculty.specialization || 'Not specified'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Role</p>
                    <p className="text-sm font-semibold text-slate-800">
                      {faculty.role || faculty.designation || 'Faculty Member'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm">
                <h3 className="text-sm font-semibold text-slate-800 mb-6 uppercase tracking-wider">Qualification & Specialization</h3>
                <div className="grid gap-4">
                  <div className="p-4 bg-slate-50 rounded-lg">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Highest Qualification</p>
                    <p className="text-sm font-semibold text-slate-800">{faculty.qualification || faculty.highestQualification || 'Not provided'}</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-lg">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Area of Specialization</p>
                    <p className="text-sm font-semibold text-slate-800">{faculty.specialization || 'Not provided'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'performance' && (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider">Performance Evaluations</h3>
              <button
                className="flex items-center gap-2 px-4 py-2 bg-[#1162d4] text-white rounded-lg text-xs font-semibold uppercase tracking-wider hover:bg-[#1162d4]/90 transition-all shadow-sm"
                onClick={() => setIsEvalModalOpen(true)}
              >
                Add Evaluation
              </button>
            </div>

            {evaluations && evaluations.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {evaluations.map((evaluation, idx) => (
                  <div key={idx} className="p-6 hover:bg-slate-50/50 transition-colors">
                    <div className="grid grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Semester</p>
                        <p className="text-sm font-semibold text-slate-800">{evaluation.semester}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Academic Year</p>
                        <p className="text-sm font-semibold text-slate-800">{evaluation.academic_year}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Evaluator</p>
                        <p className="text-sm font-semibold text-slate-800">{evaluation.evaluator_id || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Overall Rating</p>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div className="bg-[#1162d4] h-full" style={{ width: `${(evaluation.overall_rating / 5) * 100}%` }} />
                          </div>
                          <span className="text-sm font-semibold text-slate-700">{evaluation.overall_rating?.toFixed(1)}/5</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 text-sm mb-4">
                      <div className="p-3 bg-slate-50 rounded-lg">
                        <p className="text-xs font-semibold text-slate-500 mb-1">Teaching Quality Avg</p>
                        <p className="font-semibold text-slate-700">
                          {(((evaluation.course_content || 0) + (evaluation.teaching_methodology || 0) + (evaluation.student_engagement || 0) + (evaluation.feedback_responsiveness || 0)) / 4).toFixed(1)}
                        </p>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-lg">
                        <p className="text-xs font-semibold text-slate-500 mb-1">Research Avg</p>
                        <p className="font-semibold text-slate-700">
                          {(((evaluation.research_output || 0) + (evaluation.publication_quality || 0) + (evaluation.research_collaboration || 0)) / 3).toFixed(1)}
                        </p>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-lg">
                        <p className="text-xs font-semibold text-slate-500 mb-1">Admin Avg</p>
                        <p className="font-semibold text-slate-700">
                          {(((evaluation.meeting_attendance || 0) + (evaluation.committee_participation || 0) + (evaluation.documentation || 0)) / 3).toFixed(1)}
                        </p>
                      </div>
                    </div>

                    {evaluation.strengths && (
                      <div className="mb-3 p-3 bg-green-50 border border-green-100 rounded-lg">
                        <p className="text-xs font-semibold text-green-600 uppercase tracking-wider mb-1">Strengths</p>
                        <p className="text-sm text-green-700">{evaluation.strengths}</p>
                      </div>
                    )}

                    {evaluation.areas_for_improvement && (
                      <div className="mb-3 p-3 bg-yellow-50 border border-yellow-100 rounded-lg">
                        <p className="text-xs font-semibold text-yellow-600 uppercase tracking-wider mb-1">Areas for Improvement</p>
                        <p className="text-sm text-yellow-700">{evaluation.areas_for_improvement}</p>
                      </div>
                    )}

                    {evaluation.recommendations && (
                      <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg">
                        <p className="text-xs font-semibold text-[#1162d4] uppercase tracking-wider mb-1">Recommendations</p>
                        <p className="text-sm text-blue-700">{evaluation.recommendations}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center">
                <span className="material-symbols-outlined text-slate-300 text-5xl mb-3 block">assessment</span>
                <p className="text-sm text-slate-500 font-medium">No performance evaluations recorded yet</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'payroll' && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <PayrollIntegrationPanel 
              facultyId={faculty._id || faculty.id || faculty.email}
              semester="Semester 1"
              academicYear="2024"
            />
          </div>
        )}

        {activeTab === 'career' && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <CareerPathwayTracking 
              facultyId={faculty._id || faculty.id || faculty.email}
            />
          </div>
        )}

        {activeTab === 'leave' && (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider">Leave History</h3>
              <button
                className="flex items-center gap-2 px-4 py-2 bg-[#1162d4] text-white rounded-lg text-xs font-semibold uppercase tracking-wider hover:bg-[#1162d4]/90 transition-all shadow-sm"
                onClick={() => setIsRequestLeaveOpen(true)}
              >
                Request Leave
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-[10px] font-semibold uppercase tracking-wider border-b border-slate-200">
                    <th className="px-8 py-4">Type</th>
                    <th className="px-4 py-4">Start Date</th>
                    <th className="px-4 py-4">End Date</th>
                    <th className="px-4 py-4">Status</th>
                    <th className="px-8 py-4">Applied On</th>
                    <th className="px-8 py-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {leaveRequests && leaveRequests.length > 0 ? (
                    leaveRequests.map((leaveReq, i) => (
                      <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-8 py-5 text-sm font-semibold text-slate-800">{leaveReq.leave_type}</td>
                        <td className="px-4 py-5 text-sm text-slate-700">{new Date(leaveReq.start_date).toLocaleDateString()}</td>
                        <td className="px-4 py-5 text-sm text-slate-700">{new Date(leaveReq.end_date).toLocaleDateString()}</td>
                        <td className="px-4 py-5">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${leaveReq.status === 'Approved' ? 'bg-green-50 text-green-600' : leaveReq.status === 'Rejected' ? 'bg-red-50 text-red-600' : 'bg-orange-50 text-orange-600'}`}>
                            {leaveReq.status}
                          </span>
                        </td>
                        <td className="px-8 py-5 text-sm text-slate-700">{new Date(leaveReq.applied_on).toLocaleDateString()}</td>
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleEditLeave(leaveReq)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all group"
                              title="Edit leave request"
                            >
                              <span className="material-symbols-outlined text-lg">edit</span>
                            </button>
                            <button
                              onClick={() => handleDeleteLeave(leaveReq)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all group"
                              title="Delete leave request"
                            >
                              <span className="material-symbols-outlined text-lg">delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="px-8 py-10 text-center text-sm text-slate-500">No leave records found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>

      <AddEditFacultyModal 
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={() => {
          setIsEditModalOpen(false);
          alert('Faculty information updated successfully');
        }}
        editMode={true}
        initialData={faculty}
      />
      
      <RequestLeaveModal
        isOpen={isRequestLeaveOpen}
        onClose={() => {
          setIsRequestLeaveOpen(false);
          setEditingLeave(null);
        }}
        onSuccess={() => {
          setIsRequestLeaveOpen(false);
          setEditingLeave(null);
          fetchLeaveRequests(faculty._id || faculty.id);
          alert('Leave request submitted successfully');
        }}
        facultyId={faculty._id || faculty.id || faculty.email}
        editingLeave={editingLeave}
      />

      <PerformanceEvaluationModal
        isOpen={isEvalModalOpen}
        onClose={() => setIsEvalModalOpen(false)}
        onSuccess={() => {
          setIsEvalModalOpen(false);
          fetchEvaluations(faculty._id || faculty.id);
          alert('Performance evaluation saved successfully');
        }}
        facultyId={faculty._id || faculty.id || faculty.email}
        facultyName={faculty.fullName || faculty.name}
      />

      {/* Delete Confirmation Popup */}
      {deleteConfirmation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 animate-in fade-in zoom-in duration-300">
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4v2m0 0v2m0-4v-2m0 0h2m-2 0h-2" />
                </svg>
              </div>
            </div>
            <h3 className="text-xl font-bold text-center text-slate-900 mb-2">Delete Leave Request?</h3>
            <p className="text-center text-slate-600 mb-6">
              Are you sure you want to delete this leave request (<span className="font-semibold text-slate-800">{deleteConfirmation.leave_type}</span>)? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirmation(null)}
                className="flex-1 px-4 py-2.5 rounded-lg border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteLeave}
                className="flex-1 px-4 py-2.5 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 transition-all shadow-sm"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
    </Layout>
  );
}
