import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();

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
  const totalPages = Math.ceil(filteredFaculty.length / ITEMS_PER_PAGE);
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

  return (
    <Layout title="Faculty Directory">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div className="flex-1">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Faculty Management</h1>
          <p className="text-slate-600 font-medium">Manage faculty profiles, course mappings, and performance metrics</p>
        </div>
      </div>

      {/* Statistics Cards Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard 
          icon="group" 
          label="Total Faculty" 
          value={facultyList.length}
          color="blue"
        />
        <StatCard 
          icon="task_alt" 
          label="Active Members" 
          value={activeFaculty}
          trend={`${onLeave} on leave`}
          color="green"
        />
        <StatCard 
          icon="domain" 
          label="Departments" 
          value={new Set(facultyList.map(f => f.department_id)).size}
          color="purple"
        />
      </div>

      {/* Search and Filter Toolbar */}
      <div className="mb-6">
        <SearchFilter 
          searchQuery={searchQuery}
          onSearchChange={handleSearch}
          onAddClick={handleAddFaculty}
          placeholder="Search faculty by name, ID, or email..."
          addButtonLabel="Add Faculty"
        />
      </div>

      {/* Faculty Table Section */}
      <div className="space-y-4">
        {loading ? (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="w-full h-96 flex flex-col items-center justify-center gap-4 animate-pulse">
              <div className="w-12 h-12 bg-slate-100 rounded-full" />
              <div className="w-48 h-4 bg-slate-100 rounded" />
              <div className="w-32 h-3 bg-slate-50 rounded" />
            </div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-8">
            <div className="flex items-start gap-4">
              <span className="material-symbols-outlined text-red-500 text-5xl">cloud_off</span>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-red-900 mb-1">Connection Error</h3>
                <p className="text-red-700 mb-6">{error}</p>
                <button 
                  onClick={fetchFaculty}
                  className="px-6 py-2.5 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-all shadow-sm"
                >
                  Retry Connection
                </button>
              </div>
            </div>
          </div>
        ) : paginatedFaculty.length > 0 ? (
          <>
            <FacultyTable 
              faculty={paginatedFaculty}
              onEdit={handleEditFaculty}
              onDelete={handleDeleteFaculty}
            />

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 px-6 py-6 bg-white rounded-2xl border border-slate-200 shadow-sm">
                <button 
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  title="Previous Page"
                >
                  <span className="material-symbols-outlined inline">chevron_left</span>
                </button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button 
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`min-w-10 h-10 rounded-lg text-sm font-bold transition-all ${
                        page === currentPage 
                          ? 'bg-[#1162d4] text-white shadow-md' 
                          : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>
                
                <button 
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  title="Next Page"
                >
                  <span className="material-symbols-outlined inline">chevron_right</span>
                </button>
                
                <div className="ml-4 px-4 py-2 bg-slate-50 rounded-lg text-sm font-semibold text-slate-600">
                  Page {currentPage} of {totalPages}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="px-10 py-24 text-center">
              <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
                  <span className="material-symbols-outlined text-4xl text-slate-400">group_off</span>
                </div>
                <div>
                  <p className="text-lg font-bold text-slate-900 mb-1">No faculty members found</p>
                  <p className="text-slate-500 text-sm mb-6">
                    {searchQuery ? 'Try adjusting your filters or search terms' : 'Get started by adding new faculty members'}
                  </p>
                </div>
                {!searchQuery && (
                  <button 
                    onClick={seedFacultyData}
                    className="flex items-center gap-2 px-6 py-3 bg-[#1162d4] text-white rounded-xl font-bold hover:bg-[#0d4fa8] transition-all shadow-md hover:shadow-lg"
                  >
                    <span className="material-symbols-outlined">download</span>
                    Load Demo Data
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Faculty Modal */}
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
