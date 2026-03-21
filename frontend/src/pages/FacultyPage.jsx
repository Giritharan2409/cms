import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import StatCard from '../components/StatCard';
import AddEditFacultyModal from '../components/AddEditFacultyModal';
import { 
  Users, UserPlus, Filter, Search, BookOpen, Clock, 
  MapPin, Award, CheckCircle, XCircle 
} from 'lucide-react';
import '../styles.css';
import { API_BASE } from '../api/apiBase';

export default function FacultyPage() {
  const [facultyList, setFacultyList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editFaculty, setEditFaculty] = useState(null);
  
  const navigate = useNavigate();

  useEffect(() => {
    fetchFaculty();
  }, [departmentFilter, statusFilter]);

  const fetchFaculty = async () => {
    setLoading(true);
    try {
      let url = `${API_BASE}/faculty?`;
      if (departmentFilter) url += `departmentId=${departmentFilter}&`;
      if (statusFilter) url += `employmentStatus=${statusFilter}&`;
      
      const response = await fetch(url);
      const data = await response.json();
      setFacultyList(data);
    } catch (error) {
      console.error('Error fetching faculty mapping:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredFaculty = facultyList.filter(f => 
    f.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.employeeId?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Layout title="Faculty Directory">
      <div className="page-container">
        <div className="page-header" style={{ marginBottom: '2rem' }}>
          <div>
            <h1 className="page-title">Faculty Management</h1>
            <p className="page-subtitle">Manage faculty profiles, course mappings, and performance</p>
          </div>
          <div className="page-actions">
            <button 
              className="btn btn-primary" 
              onClick={() => { setEditFaculty(null); setIsModalOpen(true); }}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem', fontSize: '0.95rem' }}
            >
              <UserPlus size={18} />
              Add Faculty
            </button>
          </div>
        </div>

      <div className="stats-grid" style={{ marginBottom: '2rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
        <StatCard 
          icon="group" 
          title="Total Faculty" 
          value={facultyList.length} 
          trend="+2" 
          trendUp={true} 
          color="blue" 
        />
        <StatCard 
          icon="workspace_premium" 
          title="Active Members" 
          value={facultyList.filter(f => f.employment_status === 'Active').length} 
          trend="0" 
          trendUp={true} 
          color="green" 
        />
        <StatCard 
          icon="domain" 
          title="Departments" 
          value={new Set(facultyList.map(f => f.departmentId)).size} 
          trend="Stable" 
          trendUp={true} 
          color="purple" 
        />
      </div>

      <div className="card">
        <div className="card-header">
          <div style={{ marginBottom: '1.5rem' }}>
            <h2 className="card-title">Faculty Directory</h2>
          </div>
          
          <div className="filters-group" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            <div className="search-bar" style={{ display: 'flex', alignItems: 'center', background: 'var(--surface-color)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', gridColumn: 'span 1' }}>
              <Search size={18} style={{ color: 'var(--text-tertiary)', marginRight: '0.75rem', flexShrink: 0 }} />
              <input 
                type="text" 
                placeholder="Search by name or ID..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ border: 'none', background: 'transparent', outline: 'none', color: 'var(--text-primary)', width: '100%', fontSize: '0.95rem' }}
              />
            </div>
            
            <select 
              className="select-input" 
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              style={{ padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', background: 'var(--surface-color)', color: 'var(--text-primary)', fontSize: '0.95rem', cursor: 'pointer' }}
            >
              <option value="">All Departments</option>
              <option value="Computer Science">Computer Science</option>
              <option value="Electrical Engineering">Electrical Engineering</option>
              <option value="Mechanical Engineering">Mechanical Engineering</option>
            </select>
            
            <select 
               className="select-input"
               value={statusFilter}
               onChange={(e) => setStatusFilter(e.target.value)}
               style={{ padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', background: 'var(--surface-color)', color: 'var(--text-primary)', fontSize: '0.95rem', cursor: 'pointer' }}
            >
              <option value="">All Statuses</option>
              <option value="Active">Active</option>
              <option value="On-Leave">On Leave</option>
              <option value="Terminated">Terminated</option>
            </select>
          </div>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '12%' }}>Faculty ID</th>
                <th style={{ width: '25%' }}>Name & Designation</th>
                <th style={{ width: '18%' }}>Department</th>
                <th style={{ width: '25%' }}>Contact</th>
                <th style={{ width: '12%' }}>Status</th>
                <th style={{ width: '8%', textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>Loading Faculty Data...</td></tr>
              ) : filteredFaculty.length > 0 ? (
                filteredFaculty.map(faculty => (
                  <tr key={faculty._id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td className="font-medium" style={{ color: 'var(--primary)' }}>{faculty.employeeId}</td>
                    <td>
                      <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{faculty.name}</div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>{faculty.designation || 'Faculty Member'}</div>
                    </td>
                    <td style={{ color: 'var(--text-primary)' }}>{faculty.departmentId}</td>
                    <td>
                      <div style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>{faculty.email}</div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>{faculty.phone || 'N/A'}</div>
                    </td>
                    <td>
                      <span className={`status-badge ${
                        faculty.employment_status === 'Active' ? 'status-success' : 
                        faculty.employment_status === 'On-Leave' ? 'status-warning' : 'status-error'
                      }`} style={{ display: 'inline-block', padding: '0.4rem 0.8rem', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', fontWeight: 500 }}>
                        {faculty.employment_status || 'Active'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button 
                        className="btn btn-outline btn-sm"
                        onClick={() => navigate(`/faculty/${faculty.employeeId}`)}
                        style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', whiteSpace: 'nowrap' }}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="text-center py-8 text-secondary" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    No faculty members found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AddEditFacultyModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchFaculty}
        editMode={!!editFaculty}
        initialData={editFaculty}
      />
    </div>
    </Layout>
  );
}
