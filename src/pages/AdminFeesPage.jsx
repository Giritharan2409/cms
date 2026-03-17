import React, { useState, useMemo } from 'react';
import Layout from '../components/Layout';
import { useAdmission } from '../context/AdmissionContext';
import { getUserSession } from '../auth/sessionController';

export default function AdminFeesPage() {
  const session = getUserSession();
  const { approvedStudents } = useAdmission();
  const [feeAssignments, setFeeAssignments] = useState(
    JSON.parse(localStorage.getItem('fee_assignments') || '[]')
  );
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleteReason, setDeleteReason] = useState('');
  const [assignFormData, setAssignFormData] = useState({
    semester: '',
    course: '',
    isFirstGraduate: false,
    needsHostel: false,
    isAcHostel: false,
  });

  // Save to localStorage whenever feeAssignments changes
  React.useEffect(() => {
    localStorage.setItem('fee_assignments', JSON.stringify(feeAssignments));
  }, [feeAssignments]);

  const studentsWithoutFees = useMemo(() => {
    return approvedStudents.filter(
      (student) => !feeAssignments.some((fee) => fee.studentId === student.id)
    );
  }, [approvedStudents, feeAssignments]);

  const calculateFees = (semester, isFirstGraduate, needsHostel, isAcHostel) => {
    const semesterFee = isFirstGraduate ? 85000 : 110000;
    const bookFee = 3950;
    const examFee = 250;
    const hostelFee = needsHostel
      ? isAcHostel
        ? 55000 + 60000
        : 55000 + 30000
      : 0;
    const miscFee = 10000;

    return {
      semesterFee,
      bookFee,
      examFee,
      hostelFee,
      miscFee,
      totalFee: semesterFee + bookFee + examFee + hostelFee + miscFee,
    };
  };

  const handleAssignClick = (student) => {
    setSelectedStudent(student);
    setShowAssignModal(true);
  };

  const handleConfirmAssignFee = () => {
    if (!selectedStudent || !assignFormData.semester) {
      alert('Please fill required fields');
      return;
    }

    const fees = calculateFees(
      assignFormData.semester,
      assignFormData.isFirstGraduate,
      assignFormData.needsHostel,
      assignFormData.isAcHostel
    );

    const newAssignment = {
      id: `FEE${Date.now()}`,
      studentId: selectedStudent.id,
      studentName: selectedStudent.name || selectedStudent.fullName,
      applicationId: selectedStudent.id,
      semester: assignFormData.semester,
      course: assignFormData.course || selectedStudent.course,
      ...fees,
      assignedDate: new Date().toISOString().split('T')[0],
      status: 'Assigned',
      paymentStatus: 'pending',
    };

    setFeeAssignments([...feeAssignments, newAssignment]);
    setShowAssignModal(false);
    setSelectedStudent(null);
    setAssignFormData({
      semester: '',
      course: '',
      isFirstGraduate: false,
      needsHostel: false,
      isAcHostel: false,
    });

    alert('Fee assigned successfully!');
  };

  const handleDeleteClick = (assignment) => {
    setDeleteConfirm(assignment);
    setDeleteReason('');
  };

  const handleConfirmDelete = () => {
    if (!deleteReason.trim()) {
      alert('Please provide a deletion reason');
      return;
    }

    setFeeAssignments(feeAssignments.filter((fee) => fee.id !== deleteConfirm.id));
    setDeleteConfirm(null);
    setDeleteReason('');
    alert('Fee assignment deleted successfully');
  };

  const handleGenerateInvoice = (assignment) => {
    const invoice = {
      id: `BILL${Date.now()}`,
      studentId: assignment.studentId,
      studentName: assignment.studentName,
      applicationId: assignment.applicationId,
      semester: assignment.semester,
      course: assignment.course,
      items: [
        { description: 'Semester Fee', amount: assignment.semesterFee },
        { description: 'Book Fee', amount: assignment.bookFee },
        { description: 'Exam Fee', amount: assignment.examFee },
      ],
      total: assignment.totalFee,
      generatedDate: new Date().toISOString().split('T')[0],
      status: 'Pending',
      paymentStatus: 'Pending',
      generatedFrom: assignment.id,
    };

    if (assignment.hostelFee > 0) {
      invoice.items.push({ description: 'Hostel Fee', amount: assignment.hostelFee });
    }
    if (assignment.miscFee > 0) {
      invoice.items.push({ description: 'Misc Fee', amount: assignment.miscFee });
    }

    const invoices = JSON.parse(localStorage.getItem('admin_invoices') || '[]');
    invoices.push(invoice);
    localStorage.setItem('admin_invoices', JSON.stringify(invoices));

    alert(`Invoice ${invoice.id} generated successfully!`);
  };

  return (
    <Layout title="Fee Management">
      <div className="space-y-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-8 rounded-lg shadow-lg">
          <h1 className="text-3xl font-bold mb-2">Fee Management</h1>
          <p className="text-blue-100">Assign fees to approved students</p>
        </div>

        {/* Section 1: Students Awaiting Fee Assignment */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold mb-6 text-gray-800">
            Students Awaiting Fee Assignment
          </h2>

          {studentsWithoutFees.length === 0 ? (
            <div className="bg-green-50 border border-green-300 rounded-lg p-8 text-center">
              <span className="material-symbols-outlined text-4xl text-green-600 block mb-4">
                check_circle
              </span>
              <p className="text-green-800 font-semibold">
                ✓ All approved students have been assigned fees
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {studentsWithoutFees.map((student) => (
                <div
                  key={student.id}
                  className="bg-white border-l-4 border-blue-500 rounded-lg shadow p-6 hover:shadow-lg transition"
                >
                  <div className="flex items-start justify-between mb-4">
                    <span className="material-symbols-outlined text-3xl text-blue-500">
                      check_circle
                    </span>
                    <span className="bg-green-100 text-green-800 text-xs font-semibold px-3 py-1 rounded-full">
                      Approved
                    </span>
                  </div>
                  <h3 className="font-bold text-gray-800 text-lg mb-4">
                    {student.name || student.fullName}
                  </h3>
                  <div className="space-y-2 text-sm text-gray-600 mb-6">
                    <p>
                      <span className="font-semibold">Application ID:</span> {student.id}
                    </p>
                    <p>
                      <span className="font-semibold">Course:</span> {student.course}
                    </p>
                    <p>
                      <span className="font-semibold">Email:</span> {student.email}
                    </p>
                    <p>
                      <span className="font-semibold">Phone:</span> {student.phone}
                    </p>
                  </div>
                  <button
                    onClick={() => handleAssignClick(student)}
                    className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition font-medium"
                  >
                    Assign Fee
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section 2: Fee Assignments */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold mb-6 text-gray-800">Fee Assignments</h2>

          {feeAssignments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <span className="material-symbols-outlined text-4xl block mb-4 text-gray-300">
                receipt_long
              </span>
              <p>No fees assigned yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {feeAssignments.map((assignment) => (
                <div
                  key={assignment.id}
                  className="bg-green-50 border border-green-300 rounded-lg shadow p-6 hover:shadow-lg transition"
                >
                  <div className="flex items-start justify-between mb-4">
                    <span className="material-symbols-outlined text-3xl text-green-600">
                      receipt_long
                    </span>
                    <span className="bg-green-100 text-green-800 text-xs font-semibold px-3 py-1 rounded-full">
                      Fee Assigned
                    </span>
                  </div>

                  <h3 className="font-bold text-gray-800 text-lg mb-4">
                    {assignment.studentName}
                  </h3>

                  <div className="space-y-2 text-sm text-gray-700 mb-4">
                    <p>
                      <span className="font-semibold">Application ID:</span>{' '}
                      {assignment.applicationId}
                    </p>
                    <p>
                      <span className="font-semibold">Semester:</span> {assignment.semester}
                    </p>
                    <p>
                      <span className="font-semibold">Course:</span> {assignment.course}
                    </p>
                    <p>
                      <span className="font-semibold">Total Fee:</span> ₹{assignment.totalFee}
                    </p>
                    <p>
                      <span className="font-semibold">Assigned Date:</span>{' '}
                      {assignment.assignedDate}
                    </p>
                    <p>
                      <span className="font-semibold">Payment Status:</span>{' '}
                      <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-xs font-semibold">
                        {assignment.paymentStatus}
                      </span>
                    </p>
                  </div>

                  {/* Fee Breakdown */}
                  <div className="bg-white rounded p-4 mb-4 max-h-48 overflow-y-auto">
                    <p className="font-bold text-gray-800 mb-2">Fee Breakdown:</p>
                    <div className="space-y-1 text-sm">
                      <p>
                        • Semester Fee: <span className="font-semibold">₹{assignment.semesterFee}</span>
                      </p>
                      <p>
                        • Book Fee: <span className="font-semibold">₹{assignment.bookFee}</span>
                      </p>
                      <p>
                        • Exam Fee: <span className="font-semibold">₹{assignment.examFee}</span>
                      </p>
                      {assignment.hostelFee > 0 && (
                        <p>
                          • Hostel Fee:{' '}
                          <span className="font-semibold">₹{assignment.hostelFee}</span>
                        </p>
                      )}
                      {assignment.miscFee > 0 && (
                        <p>
                          • Misc Fee: <span className="font-semibold">₹{assignment.miscFee}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleGenerateInvoice(assignment)}
                      className="flex-1 bg-yellow-500 text-white py-2 rounded-lg hover:bg-yellow-600 transition font-medium text-sm"
                    >
                      Generate Invoice
                    </button>
                    <button
                      onClick={() => handleDeleteClick(assignment)}
                      className="flex-1 bg-red-500 text-white py-2 rounded-lg hover:bg-red-600 transition font-medium text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Assign Fee Modal */}
      {showAssignModal && selectedStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-2xl w-full mx-4 shadow-xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-6">
              Assign Fee for {selectedStudent.name || selectedStudent.fullName}
            </h2>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-600">
                <span className="font-semibold">Application ID:</span> {selectedStudent.id}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-semibold">Course:</span> {selectedStudent.course}
              </p>
            </div>

            <div className="space-y-4 mb-8">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Semester *
                </label>
                <select
                  value={assignFormData.semester}
                  onChange={(e) =>
                    setAssignFormData({
                      ...assignFormData,
                      semester: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Semester</option>
                  {['Semester 1', 'Semester 2', 'Semester 3', 'Semester 4', 'Semester 5', 'Semester 6', 'Semester 7', 'Semester 8'].map(
                    (sem) => (
                      <option key={sem} value={sem}>
                        {sem}
                      </option>
                    )
                  )}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Course
                </label>
                <input
                  type="text"
                  value={assignFormData.course}
                  onChange={(e) =>
                    setAssignFormData({
                      ...assignFormData,
                      course: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter course name"
                />
              </div>

              <div className="space-y-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={assignFormData.isFirstGraduate}
                    onChange={(e) =>
                      setAssignFormData({
                        ...assignFormData,
                        isFirstGraduate: e.target.checked,
                      })
                    }
                    className="w-4 h-4 rounded"
                  />
                  <span className="text-gray-700">First Graduate (₹85,000 semester fee)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={assignFormData.needsHostel}
                    onChange={(e) =>
                      setAssignFormData({
                        ...assignFormData,
                        needsHostel: e.target.checked,
                      })
                    }
                    className="w-4 h-4 rounded"
                  />
                  <span className="text-gray-700">Needs Hostel</span>
                </label>

                {assignFormData.needsHostel && (
                  <label className="flex items-center gap-2 cursor-pointer ml-6">
                    <input
                      type="checkbox"
                      checked={assignFormData.isAcHostel}
                      onChange={(e) =>
                        setAssignFormData({
                          ...assignFormData,
                          isAcHostel: e.target.checked,
                        })
                      }
                      className="w-4 h-4 rounded"
                    />
                    <span className="text-gray-700">AC Hostel (₹115,000/year)</span>
                  </label>
                )}
              </div>
            </div>

            {/* Fee Preview */}
            {assignFormData.semester && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-8">
                <p className="font-bold text-gray-800 mb-3">Fee Summary:</p>
                <div className="space-y-2 text-sm">
                  {Object.entries(
                    calculateFees(
                      assignFormData.semester,
                      assignFormData.isFirstGraduate,
                      assignFormData.needsHostel,
                      assignFormData.isAcHostel
                    )
                  ).map(([key, value]) => (
                    <p key={key}>
                      <span className="text-gray-600 capitalize">
                        {key.replace(/([A-Z])/g, ' $1')}:
                      </span>
                      <span className="font-semibold float-right">₹{value}</span>
                    </p>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowAssignModal(false);
                  setSelectedStudent(null);
                }}
                className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmAssignFee}
                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
              >
                Confirm & Assign
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 shadow-xl">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">Delete Fee Assignment</h2>

            <div className="bg-red-50 border border-red-300 rounded-lg p-4 mb-6">
              <p className="text-sm text-red-800 font-semibold mb-2">⚠ Warning</p>
              <p className="text-sm text-red-700">
                This will delete the fee assignment and all related invoices and payment history.
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for Deletion *
              </label>
              <textarea
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="Enter reason for deletion"
                rows="4"
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setDeleteConfirm(null);
                  setDeleteReason('');
                }}
                className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
