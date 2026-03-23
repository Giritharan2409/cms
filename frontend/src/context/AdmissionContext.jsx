import React, { createContext, useContext, useState, useEffect } from 'react';
import { API_BASE } from '../api/apiBase';

const AdmissionContext = createContext();

export function AdmissionProvider({ children }) {
  const [studentApps, setStudentApps] = useState([]);
  const [facultyApps, setFacultyApps] = useState([]);
  const [approvedStudents, setApprovedStudents] = useState([]);
  const [isHydrated, setIsHydrated] = useState(false);

  // Sanitize student data to ensure course is always a string
  const sanitizeStudent = (student) => {
    if (!student) return student;
    return {
      ...student,
      course: typeof student.course === 'object' 
        ? (student.course?.course || student.course?.name || 'N/A')
        : (student.course || 'N/A'),
    };
  };

  const parseStoredArray = (key) => {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      // Sanitize all students
      return parsed.map(item => sanitizeStudent(item));
    } catch {
      return [];
    }
  };

  // Fetch approved students from backend (only those with valid records in database)
  const fetchApprovedStudents = async () => {
    try {
      // First, purge any invalid approved records from the database
      console.log('[AdmissionContext] Purging invalid records...');
      try {
        await fetch(`${API_BASE}/admissions/purge-invalid-approved`, { method: 'DELETE' });
      } catch (e) {
        console.warn('[AdmissionContext] Purge failed (endpoint may not exist yet)', e);
      }

      // Now fetch approved students from backend (only those with valid records in database)
      const response = await fetch(`${API_BASE}/admissions/students/approved-for-fees`);
      if (response.ok) {
        const data = await response.json();
        const sanitizedData = Array.isArray(data.approved_students) 
          ? data.approved_students.map(item => sanitizeStudent(item))
          : [];
        console.log('[AdmissionContext] Fetched approved students:', sanitizedData.length);
        setApprovedStudents(sanitizedData);
        // Save to localStorage as backup
        localStorage.setItem('approved_students_for_fees', JSON.stringify(sanitizedData));
      }
    } catch (err) {
      console.error('Error fetching approved students:', err);
      // Fall back to localStorage
      setApprovedStudents(parseStoredArray('approved_students_for_fees'));
    }
  };

  // Fetch faculty admissions from backend
  const fetchFacultyAdmissions = async () => {
    try {
      const response = await fetch(`${API_BASE}/admissions/faculty`);
      if (response.ok) {
        const data = await response.json();
        const sanitizedData = Array.isArray(data) 
          ? data.map(item => sanitizeStudent(item))
          : [];
        setFacultyApps(sanitizedData);
      }
    } catch (err) {
      console.error('Error fetching faculty admissions:', err);
      // Fall back to localStorage
      setFacultyApps(parseStoredArray('admissions_faculty'));
    }
  };

  // Load from localStorage and backend on mount
  useEffect(() => {
    setStudentApps(parseStoredArray('admissions_students'));
    // Fetch approved students from backend (only those with valid DB records)
    fetchApprovedStudents();
    fetchFacultyAdmissions();
    setIsHydrated(true);
  }, []);

  // Cleanup old stale localStorage data on mount (one time)
  useEffect(() => {
    // Remove old fee assignments from localStorage that aren't matching current approved students
    const oldFees = JSON.parse(localStorage.getItem('fee_assignments') || '[]');
    if (oldFees.length > 0 && approvedStudents.length > 0) {
      // Only keep fees for students that exist in approved students
      const validFees = oldFees.filter(fee => 
        approvedStudents.some(student => student.id === fee.applicationId)
      );
      if (validFees.length !== oldFees.length) {
        localStorage.setItem('fee_assignments', JSON.stringify(validFees));
      }
    }
  }, [approvedStudents]);

  // Save to localStorage whenever data changes
  useEffect(() => {
    if (!isHydrated) return;
    localStorage.setItem('admissions_students', JSON.stringify(studentApps));
  }, [studentApps, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    localStorage.setItem('admissions_faculty', JSON.stringify(facultyApps));
  }, [facultyApps, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    localStorage.setItem('approved_students_for_fees', JSON.stringify(approvedStudents));
  }, [approvedStudents, isHydrated]);

  const addStudentApp = (student) => {
    const newStudent = {
      ...sanitizeStudent(student),
      id: `STU-${Date.now()}`,
      status: 'Pending',
      createdDate: new Date().toISOString().split('T')[0],
    };
    setStudentApps([...studentApps, newStudent]);
    return newStudent;
  };

  const addFacultyApp = (faculty) => {
    const newFaculty = {
      ...faculty,
      id: `STAFF-${Date.now()}`,
      status: 'Pending',
      createdDate: new Date().toISOString().split('T')[0],
    };
    setFacultyApps([...facultyApps, newFaculty]);
    return newFaculty;
  };

  const deleteStudentApp = (id) => {
    setStudentApps(studentApps.filter((app) => app.id !== id));
    setApprovedStudents(approvedStudents.filter((app) => app.id !== id));
  };

  const deleteFacultyApp = async (id) => {
    try {
      // Try to delete from backend
      await fetch(`${API_BASE}/admissions/faculty/${id}`, {
        method: 'DELETE',
      });
    } catch (err) {
      console.error('Error deleting faculty admission from backend:', err);
    }
    
    // Remove from local state
    setFacultyApps(facultyApps.filter((app) => app.id !== id));
  };

  const updateStudentStatus = (id, status) => {
    setStudentApps(
      studentApps.map((app) => (app.id === id ? { ...sanitizeStudent(app), status } : app))
    );

    // If approved, add to approved students pool
    if (status === 'Approved') {
      const student = studentApps.find((app) => app.id === id);
      if (student && !approvedStudents.some((s) => s.id === id)) {
        setApprovedStudents([...approvedStudents, sanitizeStudent({ ...student, status: 'Approved' })]);
      }
    } else {
      // If not approved, remove from pool
      setApprovedStudents(approvedStudents.filter((app) => app.id !== id));
    }
  };

  const updateFacultyStatus = async (id, status) => {
    try {
      // Update in backend
      const endpoint = status === 'Approved' 
        ? `${API_BASE}/admissions/faculty/approve/${id}`
        : `${API_BASE}/admissions/faculty/reject/${id}`;
      
      await fetch(endpoint, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
      });
    } catch (err) {
      console.error('Error updating faculty status:', err);
    }
    
    // Update local state
    setFacultyApps(
      facultyApps.map((app) => (app.id === id ? { ...app, status } : app))
    );
  };

  const value = {
    studentApps: studentApps.map(s => sanitizeStudent(s)),
    facultyApps: facultyApps.map(s => sanitizeStudent(s)),
    approvedStudents: approvedStudents.map(s => sanitizeStudent(s)),
    addStudentApp,
    addFacultyApp,
    deleteStudentApp,
    deleteFacultyApp,
    updateStudentStatus,
    updateFacultyStatus,
  };

  return (
    <AdmissionContext.Provider value={value}>
      {children}
    </AdmissionContext.Provider>
  );
}

export function useAdmission() {
  const context = useContext(AdmissionContext);
  if (!context) {
    throw new Error('useAdmission must be used within AdmissionProvider');
  }
  return context;
}
