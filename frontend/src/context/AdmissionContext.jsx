import React, { createContext, useContext, useState, useEffect } from 'react';

const AdmissionContext = createContext();

export function AdmissionProvider({ children }) {
  const [studentApps, setStudentApps] = useState([]);
  const [facultyApps, setFacultyApps] = useState([]);
  const [approvedStudents, setApprovedStudents] = useState([]);
  const [isHydrated, setIsHydrated] = useState(false);

  const parseStoredArray = (key) => {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  // Load from localStorage on mount
  useEffect(() => {
    setStudentApps(parseStoredArray('admissions_students'));
    setFacultyApps(parseStoredArray('admissions_faculty'));
    setApprovedStudents(parseStoredArray('approved_students_for_fees'));
    setIsHydrated(true);
  }, []);

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
      ...student,
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

  const deleteFacultyApp = (id) => {
    setFacultyApps(facultyApps.filter((app) => app.id !== id));
  };

  const updateStudentStatus = (id, status) => {
    setStudentApps(
      studentApps.map((app) => (app.id === id ? { ...app, status } : app))
    );

    // If approved, add to approved students pool
    if (status === 'Approved') {
      const student = studentApps.find((app) => app.id === id);
      if (student && !approvedStudents.some((s) => s.id === id)) {
        setApprovedStudents([...approvedStudents, { ...student, status: 'Approved' }]);
      }
    } else {
      // If not approved, remove from pool
      setApprovedStudents(approvedStudents.filter((app) => app.id !== id));
    }
  };

  const updateFacultyStatus = (id, status) => {
    setFacultyApps(
      facultyApps.map((app) => (app.id === id ? { ...app, status } : app))
    );
  };

  const value = {
    studentApps,
    facultyApps,
    approvedStudents,
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
