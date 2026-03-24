import React, { createContext, useContext, useState, useEffect } from 'react';

const AdmissionContext = createContext();

export function AdmissionProvider({ children }) {
  const [studentApps, setStudentApps] = useState([]);
  const [facultyApps, setFacultyApps] = useState([]);
  const [approvedStudents, setApprovedStudents] = useState([]);

  // Load from localStorage on mount
  useEffect(() => {
    const savedStudentApps = localStorage.getItem('admissions_students');
    const savedFacultyApps = localStorage.getItem('admissions_faculty');
    const savedApprovedStudents = localStorage.getItem('approved_students_for_fees');

    if (savedStudentApps) setStudentApps(JSON.parse(savedStudentApps));
    if (savedFacultyApps) setFacultyApps(JSON.parse(savedFacultyApps));
    if (savedApprovedStudents) setApprovedStudents(JSON.parse(savedApprovedStudents));
  }, []);

  // Save to localStorage whenever data changes
  useEffect(() => {
    localStorage.setItem('admissions_students', JSON.stringify(studentApps));
  }, [studentApps]);

  useEffect(() => {
    localStorage.setItem('admissions_faculty', JSON.stringify(facultyApps));
  }, [facultyApps]);

  useEffect(() => {
    localStorage.setItem('approved_students_for_fees', JSON.stringify(approvedStudents));
  }, [approvedStudents]);

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
