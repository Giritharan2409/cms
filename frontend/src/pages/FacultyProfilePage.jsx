import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import StatCard from '../components/StatCard';
import AddEditFacultyModal from '../components/AddEditFacultyModal';
import AssignCourseModal from '../components/AssignCourseModal';
import LogDevelopmentModal from '../components/LogDevelopmentModal';
import { 
  ArrowLeft, User, BookOpen, BarChart2, Award,
  Mail, Phone, MapPin, Clock, Briefcase, Calendar
} from 'lucide-react';
import '../styles.css';
import { API_BASE } from '../api/apiBase';

export default function FacultyProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [faculty, setFaculty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAssignCourseOpen, setIsAssignCourseOpen] = useState(false);
  const [isLogDevModalOpen, setIsLogDevModalOpen] = useState(false);

  useEffect(() => {
    fetchFacultyDetails();
  }, [id]);

  const fetchFacultyDetails = async () => {
    try {
      const response = await fetch(`${API_BASE}/faculty/${id}`);
      if (!response.ok) throw new Error('Failed to fetch faculty details');
      const data = await response.json();
      setFaculty(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout title="Loading Faculty Profile">
        <div className="page-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Loading Profile...</div>
      </Layout>
    );
  }

  if (!faculty) {
    return (
      <Layout title="Faculty Not Found">
        <div className="page-container">
          <div style={{ textAlign: 'center', padding: '4rem' }}>
            <h2>Faculty Member Not Found</h2>
            <button className="btn btn-primary mt-4" onClick={() => navigate('/faculty')}>Return to Directory</button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Faculty Profile">
    <div className="page-container">
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
        <button className="btn btn-icon btn-outline" onClick={() => navigate('/faculty')}>
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="page-title">{faculty.name}</h1>
          <p className="page-subtitle">{faculty.designation} • {faculty.departmentId}</p>
        </div>
        <div className="page-actions" style={{ marginLeft: 'auto' }}>
          <span className={`status-badge ${faculty.employment_status === 'Active' ? 'status-success' : 'status-warning'}`}>
            {faculty.employment_status || 'Active'}
          </span>
          <button className="btn btn-outline" onClick={() => setIsEditModalOpen(true)}>Edit Profile</button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', marginBottom: '1.5rem', overflowX: 'auto' }}>
        {[
          { id: 'overview', label: 'Overview', icon: User },
          { id: 'teaching', label: 'Teaching Load', icon: BookOpen },
          { id: 'performance', label: 'Performance', icon: BarChart2 },
          { id: 'development', label: 'Development', icon: Award }
        ].map(tab => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{ 
              display: 'flex', alignItems: 'center', gap: '0.5rem', 
              padding: '1rem 1.5rem', background: 'none', border: 'none',
              borderBottom: activeTab === tab.id ? '2px solid var(--primary-color)' : '2px solid transparent',
              color: activeTab === tab.id ? 'var(--primary-color)' : 'var(--text-secondary)',
              fontWeight: activeTab === tab.id ? '600' : '500',
              cursor: 'pointer', transition: 'all 0.2s'
            }}
          >
            <tab.icon size={18} />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="tab-content">
        {activeTab === 'overview' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) 2fr', gap: '1.5rem' }}>
            <div className="card">
              <h3 className="card-title" style={{ marginBottom: '1rem' }}>Contact & Info</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-secondary)' }}>
                  <Mail size={18} /> <span>{faculty.email}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-secondary)' }}>
                  <Phone size={18} /> <span>{faculty.phone || 'N/A'}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-secondary)' }}>
                  <MapPin size={18} /> <span>Room: {faculty.office_location || 'Not Assigned'}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-secondary)' }}>
                  <Briefcase size={18} /> <span>Employee ID: {faculty.employeeId}</span>
                </div>
              </div>
              
              <hr style={{ margin: '1.5rem 0', borderColor: 'var(--border-color)' }} />
              
              <h3 className="card-title" style={{ marginBottom: '1rem' }}>Office Hours</h3>
              {faculty.office_hours && faculty.office_hours.length > 0 ? (
                <ul style={{ paddingLeft: '1rem', color: 'var(--text-secondary)' }}>
                   {faculty.office_hours.map((oh, i) => (
                     <li key={i}>{oh.day}: {oh.start_time} - {oh.end_time}</li>
                   ))}
                </ul>
              ) : (
                <p className="text-secondary">No office hours posted.</p>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div className="card">
                <h3 className="card-title" style={{ marginBottom: '1rem' }}>Qualifications</h3>
                {faculty.qualifications && faculty.qualifications.length > 0 ? (
                  <div className="table-container">
                    <table className="data-table">
                      <thead>
                        <tr><th>Degree</th><th>Institution</th><th>Year</th></tr>
                      </thead>
                      <tbody>
                        {faculty.qualifications.map((q, i) => (
                          <tr key={i}>
                            <td><strong>{q.degree}</strong></td>
                            <td>{q.institution}</td>
                            <td>{q.year}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-secondary p-4 bg-surface rounded text-center">No qualifications recorded yet.</p>
                )}
              </div>

              <div className="card">
                <h3 className="card-title" style={{ marginBottom: '1rem' }}>Research & Specialization</h3>
                <div style={{ marginBottom: '1.5rem' }}>
                  <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Specializations</h4>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {faculty.specializations?.map((spec, i) => (
                      <span key={i} style={{ padding: '0.25rem 0.75rem', background: 'var(--primary-color-light)', color: 'var(--primary-color)', borderRadius: '999px', fontSize: '0.875rem' }}>{spec}</span>
                    ))}
                    {(!faculty.specializations || faculty.specializations.length === 0) && <span className="text-secondary">None listed</span>}
                  </div>
                </div>
                
                <div>
                  <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Publications</h4>
                  {faculty.publications && faculty.publications.length > 0 ? (
                    <ul style={{ paddingLeft: '1.5rem', color: 'var(--text-secondary)' }}>
                      {faculty.publications.map((pub, i) => (
                        <li key={i} style={{ marginBottom: '0.5rem' }}>
                         {pub.title} ({pub.year}) {pub.journal_link && <a href={pub.journal_link} target="_blank" rel="noreferrer" style={{ color: 'var(--primary-color)' }}>[Link]</a>}
                        </li>
                      ))}
                    </ul>
                  ) : <span className="text-secondary">No publications</span>}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'teaching' && (
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 className="card-title">Teaching Load</h3>
              <button className="btn btn-primary btn-sm" onClick={() => setIsAssignCourseOpen(true)}>Assign Course</button>
            </div>
            
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Course Code</th>
                    <th>Course Name</th>
                    <th>Semester</th>
                    <th>Academic Year</th>
                    <th>Credits</th>
                  </tr>
                </thead>
                <tbody>
                  {faculty.teaching_load && faculty.teaching_load.length > 0 ? (
                    faculty.teaching_load.map((course, i) => (
                      <tr key={i}>
                        <td className="font-medium">{course.courseId}</td>
                        <td>{course.course_name}</td>
                        <td>{course.semester}</td>
                        <td>{course.academic_year}</td>
                        <td>{course.credits}</td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan="5" className="text-center py-8 text-secondary">No courses assigned to this faculty member.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'performance' && (
          <div className="card">
            <h3 className="card-title" style={{ marginBottom: '1rem' }}>Performance Metrics</h3>
             <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Semester</th>
                    <th>Academic Year</th>
                    <th>Student Feedback (5.0)</th>
                    <th>Completion Rate</th>
                    <th>Attendance %</th>
                  </tr>
                </thead>
                <tbody>
                  {faculty.performance_metrics && faculty.performance_metrics.length > 0 ? (
                    faculty.performance_metrics.map((metric, i) => (
                      <tr key={i}>
                        <td className="font-medium">{metric.semester}</td>
                        <td>{metric.academic_year}</td>
                        <td>
                           <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                             <div style={{ flex: 1, background: 'var(--surface-color)', height: '6px', borderRadius: '3px', overflow: 'hidden' }}>
                               <div style={{ width: `${(metric.student_feedback_score / 5) * 100}%`, background: 'var(--primary-color)', height: '100%' }}></div>
                             </div>
                             <span>{metric.student_feedback_score.toFixed(1)}</span>
                           </div>
                        </td>
                        <td>{metric.course_completion_rate}%</td>
                        <td>{metric.attendance_rate}%</td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan="5" className="text-center py-8 text-secondary">No performance metrics recorded yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'development' && (
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 className="card-title">Professional Development</h3>
              <button className="btn btn-primary btn-sm" onClick={() => setIsLogDevModalOpen(true)}>Log Activity</button>
            </div>
             <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Title</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Credits Earned</th>
                  </tr>
                </thead>
                <tbody>
                  {faculty.professional_development && faculty.professional_development.length > 0 ? (
                    faculty.professional_development.map((dev, i) => (
                      <tr key={i}>
                        <td><span className="badge" style={{ background: 'var(--surface-color)', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>{dev.activity_type}</span></td>
                        <td className="font-medium">{dev.title}</td>
                        <td>{new Date(dev.date).toLocaleDateString()}</td>
                        <td>
                          <span className={`status-badge ${dev.status === 'Completed' ? 'status-success' : 'status-warning'}`}>
                             {dev.status}
                          </span>
                        </td>
                        <td>{dev.credits_earned || '-'}</td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan="5" className="text-center py-8 text-secondary">No professional development records found.</td></tr>
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
        onSuccess={fetchFacultyDetails}
        editMode={true}
        initialData={faculty}
      />
      
      <AssignCourseModal 
        isOpen={isAssignCourseOpen}
        onClose={() => setIsAssignCourseOpen(false)}
        onSuccess={fetchFacultyDetails}
        facultyId={faculty.employeeId}
      />

      <LogDevelopmentModal
        isOpen={isLogDevModalOpen}
        onClose={() => setIsLogDevModalOpen(false)}
        onSuccess={fetchFacultyDetails}
        facultyId={faculty.employeeId}
      />

    </div>
    </Layout>
  );
}
