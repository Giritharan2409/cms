import React, { useState, useMemo } from 'react';
import Layout from '../components/Layout';
import { useAdmission } from '../context/AdmissionContext';
import { getUserSession } from '../auth/sessionController';
import AddMemberModal from '../components/AddMemberModal';
import AdmissionDetailsModal from '../components/AdmissionDetailsModal';

const statusColors = {
  Approved: 'bg-green-100 text-green-800',
  Rejected: 'bg-red-100 text-red-800',
  Pending: 'bg-orange-100 text-orange-800',
};

export default function AdmissionPage() {
  const session = getUserSession();
  const {
    studentApps,
    facultyApps,
    approvedStudents,
    updateStudentStatus,
    updateFacultyStatus,
    deleteStudentApp,
    deleteFacultyApp,
  } = useAdmission();

  const [activeTab, setActiveTab] = useState('students');
  const [searchName, setSearchName] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedApp, setSelectedApp] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const filteredApps = useMemo(() => {
    const apps = activeTab === 'students' ? studentApps : facultyApps;
    return apps.filter((app) =>
      app.name?.toLowerCase().includes(searchName.toLowerCase()) ||
      app.fullName?.toLowerCase().includes(searchName.toLowerCase())
    );
  }, [activeTab, studentApps, facultyApps, searchName]);

  const stats = [
    {
      value: studentApps.length,
      label: 'Total Student Adm',
      icon: 'group',
    },
    {
      value: facultyApps.length,
      label: 'Total Faculty',
      icon: 'person',
    },
    {
      value:
        studentApps.filter((a) => a.status === 'Approved').length +
        facultyApps.filter((a) => a.status === 'Approved').length,
      label: 'Approved',
      icon: 'check_circle',
    },
    {
      value:
        studentApps.filter((a) => a.status === 'Rejected').length +
        facultyApps.filter((a) => a.status === 'Rejected').length,
      label: 'Rejected',
      icon: 'cancel',
    },
  ];

  const handleApprove = (id) => {
    if (activeTab === 'students') {
      updateStudentStatus(id, 'Approved');
    } else {
      updateFacultyStatus(id, 'Approved');
    }
  };

  const handleReject = (id) => {
    if (activeTab === 'students') {
      updateStudentStatus(id, 'Rejected');
    } else {
      updateFacultyStatus(id, 'Rejected');
    }
  };

  const handleDelete = (id) => {
    if (confirm('Are you sure you want to delete this application?')) {
      if (activeTab === 'students') {
        deleteStudentApp(id);
      } else {
        deleteFacultyApp(id);
      }
    }
  };

  const handleView = (app) => {
    setSelectedApp({
      ...app,
      type: activeTab === 'students' ? 'student' : 'faculty',
    });
    setShowDetailsModal(true);
  };

  return (
    <Layout title="Admission Management">
      <div className="space-y-8">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-6 border-t-4 border-teal-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total Student Adm</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{studentApps.length}</p>
              </div>
              <span className="material-symbols-outlined text-4xl text-teal-500">group</span>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6 border-t-4 border-teal-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total Faculty</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{facultyApps.length}</p>
              </div>
              <span className="material-symbols-outlined text-4xl text-teal-500">person</span>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6 border-t-4 border-teal-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Approved</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {studentApps.filter((a) => a.status === 'Approved').length +
                    facultyApps.filter((a) => a.status === 'Approved').length}
                </p>
              </div>
              <span className="material-symbols-outlined text-4xl text-teal-500">done</span>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6 border-t-4 border-teal-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Rejected</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {studentApps.filter((a) => a.status === 'Rejected').length +
                    facultyApps.filter((a) => a.status === 'Rejected').length}
                </p>
              </div>
              <span className="material-symbols-outlined text-4xl text-teal-500">close</span>
            </div>
          </div>
        </div>

        {/* Tabs and Search */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div className="flex gap-2">
              {['students', 'faculty'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => {
                    setActiveTab(tab);
                    setSearchName('');
                  }}
                  className={`px-4 py-2 font-medium rounded-lg transition-all ${
                    activeTab === tab
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>

            <div className="flex gap-2 w-full md:w-auto">
              <input
                type="text"
                placeholder="Search by name..."
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                className="flex-1 md:flex-none px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2"
              >
                <span className="material-symbols-outlined">add</span>
                Add {activeTab === 'students' ? 'Student' : 'Staff'}
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">
                    {activeTab === 'students' ? 'Application ID' : 'Staff ID'}
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Name</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">
                    {activeTab === 'students' ? 'Course' : 'Role'}
                  </th>
                  {activeTab === 'faculty' && (
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">
                      Department
                    </th>
                  )}
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">
                    Payment Status
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredApps.map((app) => (
                  <tr key={app.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-gray-700">{app.id}</td>
                    <td className="py-3 px-4 text-gray-700">
                      {app.name || app.fullName}
                    </td>
                    <td className="py-3 px-4 text-gray-700">
                      {activeTab === 'students' ? app.course : app.role}
                    </td>
                    {activeTab === 'faculty' && (
                      <td className="py-3 px-4 text-gray-700">{app.department}</td>
                    )}
                    <td className="py-3 px-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColors[app.status]}`}>
                        {app.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-800">
                        Pending
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleView(app)}
                          className="p-2 hover:bg-blue-100 text-blue-600 rounded transition"
                          title="View details"
                        >
                          <span className="material-symbols-outlined text-lg">visibility</span>
                        </button>
                        {app.status === 'Pending' && (
                          <>
                            <button
                              onClick={() => handleApprove(app.id)}
                              className="p-2 hover:bg-green-100 text-green-600 rounded transition"
                              title="Approve"
                            >
                              <span className="material-symbols-outlined text-lg">check_circle</span>
                            </button>
                            <button
                              onClick={() => handleReject(app.id)}
                              className="p-2 hover:bg-red-100 text-red-600 rounded transition"
                              title="Reject"
                            >
                              <span className="material-symbols-outlined text-lg">cancel</span>
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => handleDelete(app.id)}
                          className="p-2 hover:bg-red-100 text-red-600 rounded transition"
                          title="Delete"
                        >
                          <span className="material-symbols-outlined text-lg">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredApps.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No applications found
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {showAddModal && (
        <AddMemberModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          type={activeTab === 'students' ? 'student' : 'faculty'}
        />
      )}

      {showDetailsModal && selectedApp && (
        <AdmissionDetailsModal
          isOpen={showDetailsModal}
          onClose={() => setShowDetailsModal(false)}
          application={selectedApp}
        />
      )}
    </Layout>
  );
}
