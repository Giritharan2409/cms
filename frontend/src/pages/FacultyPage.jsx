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
        <div className="page-header">
        <div>
          <h1 className="page-title">Faculty Management</h1>
          <p className="page-subtitle">Manage faculty profiles, course mappings, and performance</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={() => { setEditFaculty(null); setIsModalOpen(true); }}>
            <UserPlus className="btn-icon" />
            Add Faculty
          </button>
        </div>
      </div>

      <div className="stats-grid">
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
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 className="card-title">Faculty Directory</h2>
          
          <div className="filters-group" style={{ display: 'flex', gap: '1rem' }}>
            <div className="search-bar" style={{ display: 'flex', alignItems: 'center', background: 'var(--surface-color)', padding: '0.5rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
              <Search size={18} style={{ color: 'var(--text-tertiary)', marginRight: '0.5rem' }} />
              <input 
                type="text" 
                placeholder="Search by name or ID..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ border: 'none', background: 'transparent', outline: 'none', color: 'var(--text-primary)' }}
              />
            </div>
            
            <select 
              className="select-input" 
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              style={{ padding: '0.5rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', background: 'var(--surface-color)', color: 'var(--text-primary)' }}
            >
              <option value="">All Departments</option>
              <option value="Computer Science">Computer Science</option>
              <option value="Electrical Engineering">Electrical Engineering</option>
              <option value="Mechanical Engineering">Mechanical Engineering</option>
              {/* Could be dynamically populated */}
            </select>
            
            <select 
               className="select-input"
               value={statusFilter}
               onChange={(e) => setStatusFilter(e.target.value)}
               style={{ padding: '0.5rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', background: 'var(--surface-color)', color: 'var(--text-primary)' }}
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
                <th>Faculty ID</th>
                <th>Name & Designation</th>
                <th>Department</th>
                <th>Contact</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>Loading Faculty Data...</td></tr>
              ) : filteredFaculty.length > 0 ? (
                filteredFaculty.map(faculty => (
                  <tr key={faculty._id}>
                    <td className="font-medium">{faculty.employeeId}</td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{faculty.name}</div>
                      <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{faculty.designation || 'Faculty'}</div>
                    </td>
                    <td>{faculty.departmentId}</td>
                    <td>
                      <div style={{ fontSize: '0.875rem' }}>{faculty.email}</div>
                      <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{faculty.phone}</div>
                    </td>
                    <td>
                      <span className={`status-badge ${
                        faculty.employment_status === 'Active' ? 'status-success' : 
                        faculty.employment_status === 'On-Leave' ? 'status-warning' : 'status-error'
                      }`}>
                        {faculty.employment_status || 'Active'}
                      </span>
                    </td>
                    <td>
                      <button 
                        className="btn btn-outline btn-sm"
                        onClick={() => navigate(`/faculty/${faculty.employeeId}`)}
                      >
                        View Profile
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="text-center py-8 text-secondary">
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
