import React, { createContext, useContext, useState, useEffect } from 'react';
import { API_BASE } from '../api/apiBase';

const AdmissionContext = createContext();

export function AdmissionProvider({ children }) {
  const [studentApps, setStudentApps] = useState([]);
  const [facultyApps, setFacultyApps] = useState([]);
  const [approvedStudents, setApprovedStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  // ================= SANITIZE STUDENT =================
  const sanitizeStudent = (item) => {
    if (!item) return item;
    return {
      ...item,
      course:
        typeof item.course === 'object'
          ? item.course?.course || item.course?.name || 'N/A'
          : item.course || 'N/A',
    };
  };

  // ================= SANITIZE FACULTY =================
  const sanitizeFaculty = (item) => {
    if (!item) return item;

    return {
      ...item,
      id: item.id || item._id,

      // 🔥 IMPORTANT mapping for UI
      staffId: item.admission_id || item.employeeId || 'N/A',
      name: item.fullName || item.name || 'N/A',
      role: item.designation || 'Faculty',
      department: item.department || 'N/A',
      status: item.status || 'Pending',
      paymentStatus: item.paymentStatus || 'Pending',
    };
  };

  // ================= FETCH STUDENTS =================
  const fetchStudentAdmissions = async () => {
    try {
      const res = await fetch(`${API_BASE}/admissions/students`);
      if (res.ok) {
        const data = await res.json();
        setStudentApps(data.map(sanitizeStudent));
      }
    } catch (err) {
      console.error('❌ Error fetching students:', err);
    }
  };

  // ================= FETCH FACULTY =================
  const fetchFacultyAdmissions = async () => {
    try {
      const res = await fetch(`${API_BASE}/faculty`);
      if (res.ok) {
        const data = await res.json();

        console.log("🔥 Faculty API Data:", data);

        // 🔥 IMPORTANT: map properly
        setFacultyApps(data.map(sanitizeFaculty));
      }
    } catch (err) {
      console.error('❌ Error fetching faculty:', err);
    }
  };

  // ================= FETCH APPROVED =================
  const fetchApprovedStudents = async () => {
    try {
      await fetch(`${API_BASE}/admissions/purge-invalid-approved`, {
        method: 'DELETE',
      });

      const res = await fetch(`${API_BASE}/admissions/students/approved-for-fees`);

      if (res.ok) {
        const data = await res.json();
        setApprovedStudents(
          (data.approved_students || []).map(sanitizeStudent)
        );
      }
    } catch (err) {
      console.error('❌ Error fetching approved students:', err);
    }
  };

  // ================= INITIAL LOAD =================
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        fetchStudentAdmissions(),
        fetchFacultyAdmissions(),
        fetchApprovedStudents(),
      ]);
      setLoading(false);
    };

    loadData();
  }, []);

  // ================= DELETE =================
  const deleteStudentApp = async (id) => {
    await fetch(`${API_BASE}/admissions/${id}`, { method: 'DELETE' });
    fetchStudentAdmissions();
  };

  const deleteFacultyApp = async (id) => {
    await fetch(`${API_BASE}/faculty/${id}`, { method: 'DELETE' });
    fetchFacultyAdmissions();
  };

  // ================= UPDATE =================
  const updateStudentStatus = async (id, status) => {
    const endpoint =
      status === 'Approved'
        ? `${API_BASE}/admissions/approve/${id}`
        : `${API_BASE}/admissions/reject/${id}`;

    await fetch(endpoint, { method: 'PUT' });

    fetchStudentAdmissions();
    fetchApprovedStudents();
  };

  const updateFacultyStatus = async (id, updates) => {
    await fetch(`${API_BASE}/faculty/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });

    fetchFacultyAdmissions();
  };

  // ================= ADD FACULTY =================
  const addFacultyApp = async (facultyData) => {
    try {
      const res = await fetch(`${API_BASE}/faculty`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(facultyData),
      });

      const data = await res.json();

      // Silently continue even if faculty exists - data is already saved to backend
      if (res.ok) {
        console.log('✓ Faculty added to context');
        fetchFacultyAdmissions();
        return true;
      } else {
        console.warn('⚠ Faculty context sync skipped:', data.detail || 'Faculty may already exist');
        return false;
      }
    } catch (err) {
      console.warn('⚠ Error syncing faculty to context:', err);
      return false;
    }
  };

  // ================= ADD STUDENT =================
  const addStudentApp = async (studentData) => {
    try {
      const cleanData = { ...studentData };

      delete cleanData.id;
      delete cleanData.admission_id;

      const res = await fetch(`${API_BASE}/admissions/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cleanData),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.detail || 'Failed to add student');
        return false;
      }

      fetchStudentAdmissions();
      return true;
    } catch (err) {
      console.error('❌ Error adding student:', err);
      alert('Server error');
      return false;
    }
  };

  // ================= CONTEXT =================
  const value = {
    studentApps,
    facultyApps,
    approvedStudents,
    loading,
    deleteStudentApp,
    deleteFacultyApp,
    updateStudentStatus,
    updateFacultyStatus,
    addFacultyApp,
    addStudentApp,
  };

  return (
    <AdmissionContext.Provider value={value}>
      {children}
    </AdmissionContext.Provider>
  );
}

export function useAdmission() {
  return useContext(AdmissionContext);
}