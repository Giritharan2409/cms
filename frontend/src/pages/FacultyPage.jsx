import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import StatCard from '../components/StatCard';
import FacultyTable from '../components/FacultyTable';
import SearchFilter from '../components/SearchFilter';
import AddEditFacultyModal from '../components/AddEditFacultyModal';
import '../styles.css';

const API_BASE_URL = '/api';

export default function FacultyPage() {
  const [facultyList, setFacultyList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFaculty, setEditingFaculty] = useState(null);
  
  const ITEMS_PER_PAGE = 8;

  useEffect(() => {
    fetchFaculty();
  }, []);

  const fetchFaculty = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/faculty`);
      if (!response.ok) throw new Error('Failed to fetch faculty');
      const data = await response.json();
      setFacultyList(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching faculty:', err);
      setError(err.message);
      setFacultyList([]);
    } finally {
      setLoading(false);
    }
  };

  const seedFacultyData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/faculty/seed/data`, {
        method: 'POST'
      });
      if (response.ok) {
        const data = await response.json();
        alert(`${data.message}`);
        await fetchFaculty();
      } else {
        alert('Failed to seed faculty data');
      }
    } catch (err) {
      console.error('Error seeding data:', err);
      alert('Error seeding data');
    } finally {
      setLoading(false);
    }
  };

  // Filter faculty based on search query
  const filteredFaculty = facultyList.filter(faculty =>
    faculty.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faculty.employeeId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faculty.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredFaculty.length / ITEMS_PER_PAGE));
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedFaculty = filteredFaculty.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handleSearch = (query) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  const handleAddFaculty = () => {
    setEditingFaculty(null);
    setIsModalOpen(true);
  };

  const handleEditFaculty = (faculty) => {
    setEditingFaculty(faculty);
    setIsModalOpen(true);
  };

  const handleDeleteFaculty = async (faculty) => {
    if (!window.confirm(`Are you sure you want to delete ${faculty.name}?`)) return;
    
    try {
      const facultyId = faculty._id || faculty.id || faculty.employeeId;
      const response = await fetch(`${API_BASE_URL}/faculty/${facultyId}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        setFacultyList(facultyList.filter(f => f._id !== faculty._id && f.employeeId !== faculty.employeeId));
        alert('Faculty member deleted successfully');
      } else {
        alert('Failed to delete faculty member');
      }
    } catch (err) {
      console.error('Error deleting faculty:', err);
      alert('Error deleting faculty member');
    }
  };

  const handleCloseFaculty = async () => {
    setIsModalOpen(false);
    setEditingFaculty(null);
    await fetchFaculty();
  };

  const handleModalSuccess = async () => {
    setIsModalOpen(false);
    setEditingFaculty(null);
    await fetchFaculty();
  };

  // Calculate stats
  const activeFaculty = facultyList.filter(f => f.employment_status === 'Active').length;
  const onLeave = facultyList.filter(f => f.employment_status === 'On-Leave').length;
  const departmentsCount = new Set(facultyList.map((f) => f.department_id || f.departmentId)).size;

  return (
    <Layout title="Faculty Directory">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Faculty</h1>
          <p className="text-slate-500 mt-1">Manage faculty profiles, subject assignments, and teaching performance records.</p>
        </div>
        <div className="bg-slate-50 px-4 py-2 rounded-xl border border-slate-200 hidden xl:block">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Last Updated</p>
          <p className="text-xs font-semibold text-slate-600">March 12, 2026 • 10:25 AM</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard 
          icon="group" 
          label="Total Faculty" 
          value={loading ? '...' : facultyList.length.toLocaleString()}
          color="blue"
        />
        <StatCard 
          icon="bolt" 
          label="Active Members" 
          value={loading ? '...' : activeFaculty.toLocaleString()}
          trend={`${onLeave} on leave`}
          color="green"
        />
        <StatCard 
          icon="domain" 
          label="Departments" 
          value={loading ? '...' : departmentsCount.toLocaleString()}
          color="purple"
        />
      </div>

      <div className="mb-6">
        <SearchFilter 
          searchQuery={searchQuery}
          onSearchChange={handleSearch}
          onAddClick={handleAddFaculty}
          placeholder="Search faculty by name, ID, or email..."
          addButtonLabel="Add Faculty"
        />
      </div>

      {error ? (
        <div className="bg-red-50 border border-red-100 rounded-xl p-8 text-center">
          <span className="material-symbols-outlined text-red-400 text-5xl mb-4">cloud_off</span>
          <h3 className="text-lg font-bold text-red-900">Connection Error</h3>
          <p className="text-red-700 mt-1 max-w-sm mx-auto">{error}</p>
          <button 
            onClick={fetchFaculty}
            className="mt-6 px-6 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-all shadow-sm"
          >
            Retry Connection
          </button>
        </div>
      ) : loading ? (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="w-full h-96 flex flex-col items-center justify-center gap-4 animate-pulse">
            <div className="w-12 h-12 bg-slate-100 rounded-full" />
            <div className="w-48 h-4 bg-slate-100 rounded" />
            <div className="w-32 h-3 bg-slate-50 rounded" />
          </div>
        </div>
      ) : (
        <FacultyTable 
          faculty={paginatedFaculty}
          onEdit={handleEditFaculty}
          onDelete={handleDeleteFaculty}
        />
      )}

      {!loading && !error && filteredFaculty.length === 0 && !searchQuery && (
        <div className="flex justify-center mt-6">
          <button 
            onClick={seedFacultyData}
            className="flex items-center gap-2 px-6 py-3 bg-[#1162d4] text-white rounded-xl font-bold hover:bg-[#0d4fa8] transition-all shadow-sm"
          >
            <span className="material-symbols-outlined">download</span>
            Load Demo Data
          </button>
        </div>
      )}

      {filteredFaculty.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between mt-8 gap-4 px-4 pb-10">
          <p className="text-sm text-slate-500">
            Showing <span className="font-semibold text-slate-900">{startIndex + 1}-{Math.min(startIndex + ITEMS_PER_PAGE, filteredFaculty.length)}</span> of <span className="font-semibold text-slate-900">{filteredFaculty.length}</span> results
          </p>
          <div className="flex items-center gap-2">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
              className="px-4 py-2 text-xs font-semibold rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
            >
              Previous
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-9 h-9 flex items-center justify-center text-xs font-semibold rounded-lg transition-all ${
                    page === currentPage
                      ? 'bg-[#1162d4] text-white shadow-sm'
                      : 'text-slate-500 hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  {page}
                </button>
              ))}
              {totalPages > 5 && <span className="text-slate-300 px-1">...</span>}
              {totalPages > 5 && (
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  className={`w-9 h-9 flex items-center justify-center text-xs font-semibold rounded-lg transition-all ${
                    totalPages === currentPage
                      ? 'bg-[#1162d4] text-white shadow-sm'
                      : 'text-slate-500 hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  {totalPages}
                </button>
              )}
            </div>
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
              className="px-5 py-2.5 text-xs font-bold rounded-[14px] border border-slate-100 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {isModalOpen && (
        <AddEditFacultyModal 
          isOpen={isModalOpen}
          onClose={handleCloseFaculty}
          onSuccess={handleModalSuccess}
          editMode={!!editingFaculty}
          initialData={editingFaculty}
        />
      )}
    </Layout>
  );
}
