import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import StatCard from '../components/StatCard';
import FacultyTable from '../components/FacultyTable';
import SearchFilter from '../components/SearchFilter';
import AddEditFacultyModal from '../components/AddEditFacultyModal';
import { useAdmission } from '../context/AdmissionContext';
import { API_BASE } from '../api/apiBase';
import '../styles.css';

export default function FacultyPage() {
  const { facultyApps } = useAdmission();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFaculty, setEditingFaculty] = useState(null);
  
  const ITEMS_PER_PAGE = 8;

  useEffect(() => {
    // Load admission data
    if (facultyApps && facultyApps.length > 0) {
      setError(null);
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, [facultyApps]);

  // Filter faculty based on search query
  const filteredFaculty = (facultyApps || []).filter(faculty =>
    faculty.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faculty.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
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
    if (!window.confirm(`Are you sure you want to delete ${faculty.fullName || faculty.name}?`)) return;
    
    try {
      const facultyId = faculty._id || faculty.id;
      const response = await fetch(`${API_BASE}/admissions/faculty/${facultyId}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        alert('Faculty member deleted successfully from admission');
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
  };

  const handleModalSuccess = async () => {
    setIsModalOpen(false);
    setEditingFaculty(null);
  };

  // Calculate stats from admission data
  const activeFaculty = (facultyApps || []).filter(f => f.status === 'Approved').length;
  const pendingFaculty = (facultyApps || []).filter(f => f.status === 'Pending').length;
  const totalFaculty = (facultyApps || []).length;

  return (
    <Layout title="Faculty Directory">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Faculty</h1>
          <p className="text-slate-500 mt-1">Manage faculty profiles, subject assignments, and teaching performance records.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard 
          icon="group" 
          label="Total Faculty" 
          value={loading ? '...' : totalFaculty.toLocaleString()}
          color="blue"
        />
        <StatCard 
          icon="check_circle" 
          label="Approved" 
          value={loading ? '...' : activeFaculty.toLocaleString()}
          trend={`${pendingFaculty} pending`}
          color="green"
        />
        <StatCard 
          icon="person" 
          label="Pending" 
          value={loading ? '...' : pendingFaculty.toLocaleString()}
          color="orange"
        />
      </div>

      <div className="mb-6">
        <SearchFilter 
          searchQuery={searchQuery}
          onSearchChange={handleSearch}
          placeholder="Search faculty by name, ID, or email..."
        />
      </div>

      {error ? (
        <div className="bg-red-50 border border-red-100 rounded-xl p-8 text-center">
          <span className="material-symbols-outlined text-red-400 text-5xl mb-4">cloud_off</span>
          <h3 className="text-lg font-bold text-red-900">No Faculty Available</h3>
          <p className="text-red-700 mt-1 max-w-sm mx-auto">No faculty members have been added to the admission system yet. Visit the admission page to add faculty.</p>
        </div>
      ) : loading ? (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="w-full h-96 flex flex-col items-center justify-center gap-4 animate-pulse">
            <div className="w-12 h-12 bg-slate-100 rounded-full" />
            <div className="w-48 h-4 bg-slate-100 rounded" />
            <div className="w-32 h-3 bg-slate-50 rounded" />
          </div>
        </div>
      ) : filteredFaculty.length === 0 ? (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-12 text-center">
          <span className="material-symbols-outlined text-slate-300 text-6xl mb-4 block">groups</span>
          <h3 className="text-lg font-bold text-slate-900">No Faculty Found</h3>
          <p className="text-slate-600 mt-2">
            {searchQuery 
              ? 'No faculty members match your search. Try different keywords.'
              : 'No faculty members in the admission system yet.'}
          </p>
        </div>
      ) : (
        <FacultyTable 
          faculty={paginatedFaculty}
          onEdit={handleEditFaculty}
          onDelete={handleDeleteFaculty}
        />
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
