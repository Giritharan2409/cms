import React, { useMemo, useState } from 'react';
import { jsPDF } from 'jspdf';
import Layout from '../components/Layout';
import StatCard from '../components/StatCard';
import { API_BASE } from '../api/apiBase';

const DEFAULT_BREAKDOWN = {
  tuitionFee: 0,
  hostelFee: 0,
  examFee: 0,
  miscFee: 0,
};

const DEFAULT_ASSIGN_FORM = {
  academicYear: '',
  course: '',
  dueDate: '',
  assignedDate: new Date().toISOString().slice(0, 10),
  lateFeePerDay: 100,
  feeTemplateId: '',
  useTemplate: true,
  breakdown: DEFAULT_BREAKDOWN,
  templateName: '',
};

const DEFAULT_FILTERS = {
  status: '',
  course: '',
  search: '',
};

const DEFAULT_PAYMENT = {
  amount: '',
  paymentMethod: 'UPI',
  transactionId: '',
  date: new Date().toISOString().slice(0, 10),
};

const DEFAULT_STUDENT_FILTERS = {
  academicYear: '',
  course: '',
  studentId: '',
  studentName: '',
};

const DEFAULT_STUDENT_RECORD_FILTERS = {
  year: '',
  department: '',
  studentId: '',
};

const ACADEMIC_YEARS = ['2024-2025', '2025-2026', '2026-2027'];

const PAYMENT_METHODS = ['UPI', 'Card', 'Net Banking'];

function formatCurrency(value) {
  return `Rs.${Number(value || 0).toLocaleString()}`;
}

function normalizeName(student) {
  return student?.name || student?.fullName || 'Unknown Student';
}

export default function AdminFeesPage() {
  const [activeSection, setActiveSection] = useState('records');
  const [feeAssignments, setFeeAssignments] = useState([]);
  const [feeTemplates, setFeeTemplates] = useState([]);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignTargets, setAssignTargets] = useState([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState({});
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleteReason, setDeleteReason] = useState('');
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [assignFormData, setAssignFormData] = useState(DEFAULT_ASSIGN_FORM);
  const [templateForm, setTemplateForm] = useState({
    name: '',
    course: '',
    breakdown: DEFAULT_BREAKDOWN,
  });
  const [templateAmount, setTemplateAmount] = useState('');
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showTransactionsModal, setShowTransactionsModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [paymentForm, setPaymentForm] = useState(DEFAULT_PAYMENT);
  const [studentFilters, setStudentFilters] = useState(DEFAULT_STUDENT_FILTERS);
  const [loading, setLoading] = useState(false);
  const [invoiceGeneratingFor, setInvoiceGeneratingFor] = useState(null);
  const [courses, setCourses] = useState([]);
  const [studentsFromApi, setStudentsFromApi] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [studentRecordFilters, setStudentRecordFilters] = useState(DEFAULT_STUDENT_RECORD_FILTERS);
  const [studentRecordOptions, setStudentRecordOptions] = useState([]);
  const [loadingStudentRecordOptions, setLoadingStudentRecordOptions] = useState(false);
  const [studentFeeRecord, setStudentFeeRecord] = useState(null);
  const [loadingStudentFeeRecord, setLoadingStudentFeeRecord] = useState(false);
  const [studentRecordAssignments, setStudentRecordAssignments] = useState([]);

  // Load courses from API when academic year changes
  React.useEffect(() => {
    const loadCourses = async () => {
      try {
        const response = await fetch(`${API_BASE}/admissions/courses`);
        if (!response.ok) throw new Error('Failed to load courses');
        const data = await response.json();
        // Extract unique courses from the data array
        const courseList = data.data ? data.data.map(c => c.code || c.name || c) : [];
        setCourses(courseList);
      } catch (error) {
        console.error('Error loading courses:', error);
        setCourses([]);
      }
    };
    loadCourses();
  }, []);

  // Load students based on filters
  React.useEffect(() => {
    const loadStudents = async () => {
      if (!studentFilters.academicYear || !studentFilters.course) {
        setStudentsFromApi([]);
        setFilteredStudents([]);
        return;
      }

      setLoadingStudents(true);
      try {
        const params = new URLSearchParams({
          academicYear: studentFilters.academicYear,
          course: studentFilters.course,
        });

        const response = await fetch(`${API_BASE}/admissions/students?${params}`);
        if (!response.ok) throw new Error('Failed to load students');
        const data = await response.json();
        const studentData = Array.isArray(data) ? data : (data.data || []);
        setStudentsFromApi(studentData);
      } catch (error) {
        console.error('Error loading students:', error);
        setStudentsFromApi([]);
        setFilteredStudents([]);
      } finally {
        setLoadingStudents(false);
      }
    };

    loadStudents();
  }, [studentFilters.academicYear, studentFilters.course]);

  // Apply client-side ID/name filters on the already fetched student list.
  React.useEffect(() => {
    let filtered = studentsFromApi;
    const idNeedle = studentFilters.studentId.trim().toLowerCase();
    const nameNeedle = studentFilters.studentName.trim().toLowerCase();

    if (idNeedle) {
      filtered = filtered.filter((student) =>
        String(student.id || student.studentId || '').toLowerCase().includes(idNeedle)
      );
    }
    if (nameNeedle) {
      filtered = filtered.filter((student) => normalizeName(student).toLowerCase().includes(nameNeedle));
    }

    setFilteredStudents(filtered);
  }, [studentsFromApi, studentFilters.studentId, studentFilters.studentName]);

  const filteredAssignments = useMemo(() => {
    return feeAssignments.filter((assignment) => {
      if (assignment.isDeleted) return false;
      if (filters.status && assignment.status !== filters.status) return false;
      if (filters.course && assignment.course !== filters.course) return false;
      if (
        filters.search &&
        !String(assignment.studentName || '')
          .toLowerCase()
          .includes(filters.search.toLowerCase())
      ) {
        return false;
      }
      return true;
    });
  }, [feeAssignments, filters]);

  const stats = useMemo(() => {
    const totalAssigned = filteredAssignments.length;
    const paidCount = filteredAssignments.filter((fee) => fee.status === 'Paid').length;
    const pendingCount = filteredAssignments.filter((fee) => fee.status !== 'Paid').length;
    const totalRevenue = filteredAssignments.reduce((sum, fee) => sum + (fee.paidAmount || 0), 0);

    return { totalAssigned, paidCount, pendingCount, totalRevenue };
  }, [filteredAssignments]);

  const availableCourses = useMemo(
    () => [...new Set(feeAssignments.map((assignment) => assignment.course).filter(Boolean))],
    [feeAssignments]
  );

  React.useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [assignmentRes, templateRes] = await Promise.all([
        fetch(`${API_BASE}/fees/assignments`),
        fetch(`${API_BASE}/fees/templates`),
      ]);

      if (!assignmentRes.ok || !templateRes.ok) {
        throw new Error('Failed to load fees data');
      }

      const assignmentsJson = await assignmentRes.json();
      const templatesJson = await templateRes.json();

      setFeeAssignments(assignmentsJson.data || []);
      setFeeTemplates(templatesJson.data || []);

      fetch(`${API_BASE}/fees/send-overdue-reminders`, { method: 'POST' }).catch(() => {});
    } catch (error) {
      console.error('Failed to load fee data:', error);
      alert('Unable to load fee data from server.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusClass = (status) => {
    if (status === 'Paid') return 'bg-green-100 text-green-800';
    if (status === 'Partially Paid') return 'bg-blue-100 text-blue-800';
    if (status === 'Overdue') return 'bg-red-100 text-red-800';
    return 'bg-orange-100 text-orange-800';
  };

  const getStatusLabel = (status) => status || 'Assigned';

  const getStudentRecordStatusClass = (status) => {
    if (status === 'Paid') return 'bg-green-100 text-green-800';
    if (status === 'Partial') return 'bg-orange-100 text-orange-800';
    return 'bg-red-100 text-red-800';
  };

  const openAssignModal = (students) => {
    if (!students.length) {
      alert('Select at least one student.');
      return;
    }

    const defaultCourse = students.length === 1 ? students[0].course || '' : '';
    const defaultAcademicYear =
      studentFilters.academicYear ||
      students[0]?.academicYear ||
      students[0]?.academic_year ||
      '';

    setAssignTargets(
      students.map((student) => ({
        studentId: student.id,
        studentName: normalizeName(student),
        academicYear: student.academicYear || student.academic_year || defaultAcademicYear,
        course: student.course || '',
      }))
    );
    setAssignFormData((prev) => ({
      ...DEFAULT_ASSIGN_FORM,
      academicYear: defaultAcademicYear,
      course: defaultCourse,
      dueDate: prev.dueDate || '',
      assignedDate: new Date().toISOString().slice(0, 10),
    }));
    setShowAssignModal(true);
  };

  const handleAssignClick = (student) => {
    openAssignModal([student]);
  };

  const handleBulkAssignClick = () => {
    const targets = filteredStudents.filter((student) => selectedStudentIds[student.id]);
    openAssignModal(targets);
  };

  const getSelectedTemplate = () =>
    feeTemplates.find((template) => template.id === assignFormData.feeTemplateId) || null;

  const calculateManualTotal = () =>
    Object.values(assignFormData.breakdown || {}).reduce((sum, value) => sum + Number(value || 0), 0);

  const calculateTotal = () => {
    const selectedTemplate = getSelectedTemplate();
    if (assignFormData.useTemplate && selectedTemplate) {
      return Number(selectedTemplate.totalAmount || 0);
    }
    return calculateManualTotal();
  };

  const getBreakdown = () => {
    const selectedTemplate = getSelectedTemplate();
    if (assignFormData.useTemplate && selectedTemplate) {
      return selectedTemplate.breakdown || DEFAULT_BREAKDOWN;
    }
    return assignFormData.breakdown;
  };

  const handleTemplateSelection = (templateId) => {
    const selectedTemplate = feeTemplates.find((template) => template.id === templateId);
    setAssignFormData((prev) => ({
      ...prev,
      feeTemplateId: templateId,
      course: selectedTemplate?.course || prev.course,
      templateName: selectedTemplate?.name || '',
      breakdown: selectedTemplate?.breakdown || prev.breakdown,
    }));
  };

  const handleConfirmAssignFee = async () => {
    if (!assignTargets.length || !assignFormData.academicYear || !assignFormData.course || !assignFormData.dueDate) {
      alert('Please complete academic year, course and due date.');
      return;
    }

    if (!assignFormData.useTemplate && calculateManualTotal() <= 0) {
      alert('Manual total amount must be greater than zero.');
      return;
    }

    const payload = {
      students: assignTargets.map((target) => ({
        studentId: target.studentId,
        studentName: target.studentName,
      })),
      academicYear: assignFormData.academicYear,
      course: assignFormData.course,
      feeTemplateId: assignFormData.useTemplate ? assignFormData.feeTemplateId || null : null,
      breakdown: assignFormData.useTemplate ? null : getBreakdown(),
      totalAmount: calculateTotal(),
      dueDate: assignFormData.dueDate,
      assignedDate: assignFormData.assignedDate,
      lateFeePerDay: Number(assignFormData.lateFeePerDay || 100),
    };

    try {
      const response = await fetch(`${API_BASE}/fees/assignments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorBody = await response.json();
        throw new Error(errorBody.detail || 'Failed to assign fee');
      }

      setShowAssignModal(false);
      setAssignTargets([]);
      setSelectedStudentIds({});
      setAssignFormData(DEFAULT_ASSIGN_FORM);
      await loadData();
      alert('Fee assigned successfully.');
    } catch (error) {
      alert(error.message || 'Unable to assign fee.');
    }
  };

  const handleDeleteClick = (assignment) => {
    setDeleteConfirm(assignment);
    setDeleteReason('');
  };

  const handleConfirmDelete = async () => {
    if (!deleteReason.trim()) {
      alert('Please provide a deletion reason');
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/fees/assignments/${deleteConfirm.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: deleteReason, softDelete: true }),
      });

      if (!response.ok) {
        throw new Error('Failed to archive fee assignment');
      }

      setDeleteConfirm(null);
      setDeleteReason('');
      await loadData();
      alert('Fee assignment archived successfully.');
    } catch (error) {
      alert(error.message || 'Unable to archive assignment.');
    }
  };

  const openPaymentModal = (assignment) => {
    setSelectedAssignment(assignment);
    setPaymentForm({
      ...DEFAULT_PAYMENT,
      amount: String(assignment.dueAmount || 0),
      transactionId: `TXN-${Date.now()}`,
    });
    setShowPaymentModal(true);
  };

  const submitPayment = async () => {
    if (!selectedAssignment) return;

    const amount = Number(paymentForm.amount || 0);
    if (amount <= 0) {
      alert('Payment amount must be greater than zero.');
      return;
    }

    if (!paymentForm.transactionId.trim()) {
      alert('Transaction ID is required.');
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/fees/assignments/${selectedAssignment.id}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          paymentMethod: paymentForm.paymentMethod,
          transactionId: paymentForm.transactionId,
          date: paymentForm.date,
        }),
      });

      if (!response.ok) {
        const body = await response.json();
        throw new Error(body.detail || 'Failed to add payment');
      }

      setShowPaymentModal(false);
      setSelectedAssignment(null);
      setPaymentForm(DEFAULT_PAYMENT);
      await loadData();
      alert('Payment recorded successfully.');
    } catch (error) {
      alert(error.message || 'Unable to record payment.');
    }
  };

  const viewTransactions = async (assignment) => {
    try {
      const response = await fetch(`${API_BASE}/fees/assignments/${assignment.id}/transactions`);
      if (!response.ok) {
        throw new Error('Failed to fetch transactions');
      }
      const data = await response.json();
      setSelectedAssignment(assignment);
      setTransactions(data.transactions || []);
      setShowTransactionsModal(true);
    } catch (error) {
      alert(error.message || 'Unable to fetch transactions.');
    }
  };

  const downloadInvoice = async (assignment, transaction) => {
    setInvoiceGeneratingFor(assignment.id);
    let invoice = null;

    try {
      const response = await fetch(`${API_BASE}/invoices/generate-from-fee-assignment/${assignment.id}`, {
        method: 'POST',
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.detail || 'Failed to generate invoice record');
      }
      invoice = await response.json();
    } catch (error) {
      setInvoiceGeneratingFor(null);
      alert(error.message || 'Unable to generate invoice.');
      return;
    }

    const invoiceId = invoice?.invoice_id || invoice?.id || `INV-${assignment.studentId}`;
    const generatedDateRaw = invoice?.generated_date || invoice?.generatedDate || new Date().toISOString();
    const generatedDate = String(generatedDateRaw).slice(0, 10);
    const paymentStatus = invoice?.payment_status || invoice?.paymentStatus || assignment?.status || 'Pending';

    const pdf = new jsPDF();
    let y = 20;

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(18);
    pdf.text('Invoice', 105, y, { align: 'center' });
    y += 12;

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.text('College Management System', 105, y, { align: 'center' });
    y += 10;

    pdf.line(20, y, 190, y);
    y += 10;

    pdf.setFont('helvetica', 'bold');
    pdf.text('Student Details', 20, y);
    y += 7;
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Student: ${assignment.studentName}`, 20, y);
    y += 6;
    pdf.text(`Student ID: ${assignment.studentId}`, 20, y);
    y += 6;
    pdf.text(`Course: ${assignment.course}`, 20, y);
    y += 6;
    pdf.text(`Academic Year: ${assignment.academicYear || 'N/A'}`, 20, y);
    y += 10;

    pdf.setFont('helvetica', 'bold');
    pdf.text('Invoice Details', 20, y);
    y += 7;
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Invoice ID: ${invoiceId}`, 20, y);
    y += 6;
    pdf.text(`Invoice Date: ${generatedDate}`, 20, y);
    y += 6;
    pdf.text(`Status: ${paymentStatus}`, 20, y);
    y += 6;
    pdf.text(`Amount: ${formatCurrency(transaction.amount)}`, 20, y);
    y += 6;
    pdf.text(`Payment Method: ${transaction.paymentMethod}`, 20, y);
    y += 6;
    pdf.text(`Transaction ID: ${transaction.transactionId}`, 20, y);
    y += 6;
    pdf.text(`Date: ${transaction.date}`, 20, y);

    pdf.save(`invoice-${invoiceId}.pdf`);
    setInvoiceGeneratingFor(null);
    alert('Invoice downloaded. It is now available on the Invoice page.');
  };

  const handleCreateTemplate = async () => {
    const amount = Number(templateAmount || 0);
    if (!templateForm.name || !templateForm.course || amount <= 0) {
      alert('Please fill template name, course and valid amount.');
      return;
    }

    const payload = {
      name: templateForm.name,
      course: templateForm.course,
      // Keep backend schema compatibility while using simplified UI input.
      breakdown: {
        tuitionFee: amount,
        hostelFee: 0,
        examFee: 0,
        miscFee: 0,
      },
    };

    try {
      const response = await fetch(`${API_BASE}/fees/templates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Failed to create template');
      }

      setShowTemplateModal(false);
      setTemplateForm({
        name: '',
        course: '',
        breakdown: DEFAULT_BREAKDOWN,
      });
      setTemplateAmount('');
      await loadData();
      alert('Template created successfully.');
    } catch (error) {
      alert(error.message || 'Unable to create template.');
    }
  };

  const openCreateTemplateFromAssign = () => {
    setTemplateForm((prev) => ({
      ...prev,
      course: assignFormData.course || prev.course,
    }));
    setShowTemplateModal(true);
  };

  const toggleStudentSelection = (studentId, checked) => {
    setSelectedStudentIds((prev) => ({ ...prev, [studentId]: checked }));
  };

  const handleSelectAllFilteredStudents = (checked) => {
    if (checked) {
      const selectedMap = {};
      filteredStudents.forEach((student) => {
        selectedMap[student.id] = true;
      });
      setSelectedStudentIds((prev) => ({ ...prev, ...selectedMap }));
      return;
    }

    setSelectedStudentIds((prev) => {
      const next = { ...prev };
      filteredStudents.forEach((student) => {
        delete next[student.id];
      });
      return next;
    });
  };

  const selectedCountInFilteredResults = useMemo(
    () => filteredStudents.filter((student) => Boolean(selectedStudentIds[student.id])).length,
    [filteredStudents, selectedStudentIds]
  );

  const totalSelectedCount = useMemo(
    () => Object.values(selectedStudentIds).filter(Boolean).length,
    [selectedStudentIds]
  );

  React.useEffect(() => {
    setSelectedStudentIds({});
  }, [studentFilters.academicYear, studentFilters.course, studentFilters.studentId, studentFilters.studentName]);

  React.useEffect(() => {
    const loadStudentRecordOptions = async () => {
      if (!studentRecordFilters.year || !studentRecordFilters.department) {
        setStudentRecordOptions([]);
        return;
      }

      setLoadingStudentRecordOptions(true);
      try {
        const params = new URLSearchParams({
          academicYear: studentRecordFilters.year,
          course: studentRecordFilters.department,
        });
        const response = await fetch(`${API_BASE}/fees/assignments?${params}`);
        if (!response.ok) {
          throw new Error('Failed to load students for selected filters');
        }

        const payload = await response.json();
        const rows = payload.data || [];
        const map = new Map();

        rows.forEach((row) => {
          const id = String(row.studentId || '').trim();
          if (!id || map.has(id)) return;
          map.set(id, {
            id,
            name: row.studentName || id,
          });
        });

        setStudentRecordOptions(Array.from(map.values()));
      } catch (error) {
        console.error('Error loading student record options:', error);
        setStudentRecordOptions([]);
      } finally {
        setLoadingStudentRecordOptions(false);
      }
    };

    loadStudentRecordOptions();
  }, [studentRecordFilters.year, studentRecordFilters.department]);

  React.useEffect(() => {
    const loadStudentFeeRecord = async () => {
      if (!studentRecordFilters.year || !studentRecordFilters.department || !studentRecordFilters.studentId) {
        setStudentFeeRecord(null);
        setStudentRecordAssignments([]);
        return;
      }

      setLoadingStudentFeeRecord(true);
      try {
        const params = new URLSearchParams({
          year: studentRecordFilters.year,
          department: studentRecordFilters.department,
          student_id: studentRecordFilters.studentId,
        });
        const response = await fetch(`${API_BASE}/fees/student-record?${params}`);
        if (!response.ok) {
          if (response.status === 404) {
            setStudentFeeRecord(null);
            return;
          }
          const body = await response.json().catch(() => ({}));
          throw new Error(body.detail || 'Failed to load student fee record');
        }

        const payload = await response.json();
        setStudentFeeRecord(payload);

        const recordsResponse = await fetch(
          `${API_BASE}/fees/students/${studentRecordFilters.studentId}/records`
        );
        if (recordsResponse.ok) {
          const recordsPayload = await recordsResponse.json();
          const matchingAssignments = (recordsPayload.data || []).filter((item) => {
            const yearMatches = String(item.academicYear || '') === studentRecordFilters.year;
            const deptMatches = String(item.course || '').toLowerCase() ===
              String(studentRecordFilters.department || '').toLowerCase();
            return yearMatches && deptMatches;
          });
          setStudentRecordAssignments(matchingAssignments);
        } else {
          setStudentRecordAssignments([]);
        }
      } catch (error) {
        console.error('Error loading student fee record:', error);
        setStudentFeeRecord(null);
        setStudentRecordAssignments([]);
      } finally {
        setLoadingStudentFeeRecord(false);
      }
    };

    loadStudentFeeRecord();
  }, [studentRecordFilters.year, studentRecordFilters.department, studentRecordFilters.studentId]);

  const currentStudentRecordAssignment = useMemo(
    () => studentRecordAssignments[0] || null,
    [studentRecordAssignments]
  );

  const currentStudentRecordTransaction = useMemo(() => {
    if (!currentStudentRecordAssignment) return null;
    const txns = currentStudentRecordAssignment.transactions || [];
    return txns[txns.length - 1] || null;
  }, [currentStudentRecordAssignment]);

  const studentPaidPercentage = useMemo(() => {
    const assigned = Number(studentFeeRecord?.total_assigned || 0);
    const paid = Number(studentFeeRecord?.total_paid || 0);
    if (assigned <= 0) return 0;
    return Math.max(0, Math.min(100, Math.round((paid / assigned) * 100)));
  }, [studentFeeRecord]);

  const renderStudentFeeRecordsSection = () => (
    <div className="bg-white rounded-lg shadow p-4">
      <h2 className="text-lg font-bold text-gray-800 mb-4">Student Fee Records</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Academic Year</label>
          <select
            value={studentRecordFilters.year}
            onChange={(e) => {
              const year = e.target.value;
              setStudentRecordFilters({ year, department: '', studentId: '' });
              setStudentRecordOptions([]);
              setStudentFeeRecord(null);
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          >
            <option value="">Select Academic Year</option>
            {ACADEMIC_YEARS.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Department</label>
          <select
            value={studentRecordFilters.department}
            disabled={!studentRecordFilters.year}
            onChange={(e) => {
              const department = e.target.value;
              setStudentRecordFilters((prev) => ({ ...prev, department, studentId: '' }));
              setStudentFeeRecord(null);
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-100 disabled:text-gray-500"
          >
            <option value="">Select Department</option>
            {courses.map((course) => (
              <option key={course} value={course}>
                {course}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Student</label>
          <select
            value={studentRecordFilters.studentId}
            disabled={!studentRecordFilters.year || !studentRecordFilters.department || loadingStudentRecordOptions}
            onChange={(e) =>
              setStudentRecordFilters((prev) => ({
                ...prev,
                studentId: e.target.value,
              }))
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-100 disabled:text-gray-500"
          >
            <option value="">{loadingStudentRecordOptions ? 'Loading students...' : 'Search Student'}</option>
            {studentRecordOptions.map((student) => (
              <option key={student.id} value={student.id}>
                {student.name} ({student.id})
              </option>
            ))}
          </select>
        </div>
      </div>

      {!studentRecordFilters.year ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm text-gray-600">
          Select filters to view student fee details
        </div>
      ) : !studentRecordFilters.department ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm text-gray-600">
          Select filters to view student fee details
        </div>
      ) : loadingStudentRecordOptions ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm text-gray-600">
          Loading students...
        </div>
      ) : studentRecordOptions.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm text-gray-600">
          No students found for selected Academic Year and Department.
        </div>
      ) : !studentRecordFilters.studentId ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm text-gray-600">
          Select filters to view student fee details
        </div>
      ) : loadingStudentFeeRecord ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm text-gray-600">
          Loading student fee record...
        </div>
      ) : !studentFeeRecord ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm text-gray-600">
          No fee record found for the selected student.
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <StatCard icon="account_balance_wallet" label="Total Fee Assigned" value={formatCurrency(studentFeeRecord.total_assigned)} color="blue" />
            <StatCard icon="payments" label="Total Paid" value={formatCurrency(studentFeeRecord.total_paid)} color="green" />
            <StatCard icon="hourglass_bottom" label="Pending Amount" value={formatCurrency(studentFeeRecord.pending)} color="orange" />
            <StatCard icon="flag" label="Status" value={studentFeeRecord.status} color={studentFeeRecord.status === 'Paid' ? 'green' : studentFeeRecord.status === 'Partial' ? 'orange' : 'red'} />
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-gray-800">Student Fee Record</h3>
            <span className={`text-xs font-bold px-2 py-1 rounded-full ${getStudentRecordStatusClass(studentFeeRecord.status)}`}>
              {studentFeeRecord.status}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-sm font-bold text-gray-800 mb-2">Student Info</p>
              <div className="text-sm text-gray-700 space-y-1">
                <p><span className="font-semibold">Name:</span> {studentFeeRecord.student?.name || 'N/A'}</p>
                <p><span className="font-semibold">Student ID:</span> {studentFeeRecord.student?.id || 'N/A'}</p>
                <p><span className="font-semibold">Department:</span> {studentFeeRecord.student?.department || 'N/A'}</p>
                <p><span className="font-semibold">Academic Year:</span> {studentFeeRecord.student?.academic_year || 'N/A'}</p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-sm font-bold text-gray-800 mb-2">Fee Summary</p>
              <div className="text-sm text-gray-700 space-y-1">
                <p><span className="font-semibold">Total Fee Assigned:</span> {formatCurrency(studentFeeRecord.total_assigned)}</p>
                <p><span className="font-semibold">Total Paid:</span> {formatCurrency(studentFeeRecord.total_paid)}</p>
                <p><span className="font-semibold">Pending Amount:</span> {formatCurrency(studentFeeRecord.pending)}</p>
                <p><span className="font-semibold">Status:</span> {studentFeeRecord.status}</p>
              </div>

              <div className="mt-4">
                <div className="flex items-center justify-between text-xs font-medium text-gray-600 mb-1">
                  <span>Payment Progress</span>
                  <span>{studentPaidPercentage}% Paid</span>
                </div>
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-2 bg-green-500 rounded-full transition-all"
                    style={{ width: `${studentPaidPercentage}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-sm font-bold text-gray-800 mb-2">Fee Breakdown</p>
            <div className="text-sm text-gray-700 divide-y divide-gray-200">
              <div className="flex items-center justify-between py-2">
                <span className="font-semibold">Tuition Fee</span>
                <span>{formatCurrency(studentFeeRecord.breakdown?.tuition)}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="font-semibold">Hostel Fee</span>
                <span>{formatCurrency(studentFeeRecord.breakdown?.hostel)}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="font-semibold">Exam Fee</span>
                <span>{formatCurrency(studentFeeRecord.breakdown?.exam)}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="font-semibold">Misc Fee</span>
                <span>{formatCurrency(studentFeeRecord.breakdown?.misc)}</span>
              </div>
            </div>
          </div>

          </div>
        </div>
      )}
    </div>
  );

  return (
    <Layout title="Fee Management">
      <div className="space-y-8">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveSection('assign')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                activeSection === 'assign' ? 'bg-blue-500 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
              }`}
            >
              Assign Fee
            </button>
            <button
              onClick={() => setActiveSection('records')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                activeSection === 'records' ? 'bg-blue-500 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
              }`}
            >
              Fee Records
            </button>
            <button
              onClick={() => setActiveSection('student-records')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                activeSection === 'student-records' ? 'bg-blue-500 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
              }`}
            >
              Student Records
            </button>
          </div>
        </div>

        {activeSection === 'student-records' && renderStudentFeeRecordsSection()}

        {activeSection === 'records' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <StatCard icon="assign" label="Total Assigned" value={stats.totalAssigned} color="blue" />
              <StatCard icon="check_circle" label="Paid Fees" value={stats.paidCount} color="green" />
              <StatCard icon="schedule" label="Pending Fees" value={stats.pendingCount} color="orange" />
              <StatCard
                icon="trending_up"
                label="Total Revenue"
                value={formatCurrency(stats.totalRevenue)}
                color="purple"
              />
            </div>

            <div className="bg-white rounded-lg shadow p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <select
                  value={filters.status}
                  onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
                  className="px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">All Status</option>
                  <option value="Assigned">Assigned</option>
                  <option value="Partially Paid">Partially Paid</option>
                  <option value="Paid">Paid</option>
                  <option value="Overdue">Overdue</option>
                </select>
                <select
                  value={filters.course}
                  onChange={(e) => setFilters((prev) => ({ ...prev, course: e.target.value }))}
                  className="px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">All Courses</option>
                  {availableCourses.map((course) => (
                    <option key={course} value={course}>
                      {course}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-800">All Fee Assignments</h2>
                <button
                  onClick={loadData}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-sm font-medium"
                >
                  Refresh
                </button>
              </div>

              {loading ? (
                <div className="bg-white rounded-lg shadow p-12 text-center text-gray-500">Loading...</div>
              ) : filteredAssignments.length === 0 ? (
                <div className="bg-white rounded-lg shadow p-12 text-center text-gray-500">
                  <span className="material-symbols-outlined text-4xl block mb-4 text-gray-300">receipt_long</span>
                  <p className="font-medium">No fee assignments found</p>
                  <p className="text-sm">Start by assigning fees to approved students</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {filteredAssignments.map((assignment) => {
                    const lastTransaction = assignment.transactions?.[assignment.transactions.length - 1] || null;
                    return (
                      <div
                        key={assignment.id}
                        className="bg-green-50 border-2 border-green-100 rounded-lg p-4 shadow hover:shadow-md transition"
                      >
                        <div className="mb-2">
                          <span
                            className={`text-xs font-bold px-2 py-1 rounded-full ${getStatusClass(
                              assignment.status
                            )}`}
                          >
                            {getStatusLabel(assignment.status)}
                          </span>
                        </div>

                        <h3 className="text-base font-bold text-gray-900 mb-2">{assignment.studentName}</h3>

                        <div className="text-xs text-gray-600 mb-2 space-y-1">
                          <p>
                            <span className="font-semibold">Student ID:</span> {assignment.studentId}
                          </p>
                          <p>
                            <span className="font-semibold">Academic Year:</span> {assignment.academicYear || 'N/A'}
                          </p>
                          <p>
                            <span className="font-semibold">Course:</span> {assignment.course}
                          </p>
                        </div>

                        <div className="bg-white rounded-lg p-2 mb-2 border border-green-200">
                          <p className="text-sm text-gray-700 mb-1">
                            <span className="font-semibold">Paid / Total:</span> {formatCurrency(assignment.paidAmount)} /
                            {' '}
                            {formatCurrency(assignment.totalAmount + (assignment.lateFeeAmount || 0))}
                          </p>
                          <p className="text-xl font-bold text-orange-600 mb-1">{formatCurrency(assignment.dueAmount)}</p>
                          <p className="text-xs text-gray-600">Due Amount</p>
                        </div>

                        <div className="text-xs text-gray-600 mb-2 space-y-1">
                          <p>
                            <span className="font-semibold">Assigned Date:</span> {assignment.assignedDate}
                          </p>
                          <p>
                            <span className="font-semibold">Due Date:</span> {assignment.dueDate}
                          </p>
                          <p>
                            <span className="font-semibold">Late Fee:</span> {formatCurrency(assignment.lateFeeAmount)}
                          </p>
                        </div>

                        <div className="bg-white rounded-lg p-2 mb-3">
                          <p className="text-xs font-bold text-gray-800 mb-1">Fee Breakdown:</p>
                          <ul className="text-xs text-gray-700 space-y-0.5">
                            <li>
                              Tuition Fee: <span className="float-right font-semibold">{formatCurrency(assignment.breakdown?.tuitionFee)}</span>
                            </li>
                            <li>
                              Hostel Fee: <span className="float-right font-semibold">{formatCurrency(assignment.breakdown?.hostelFee)}</span>
                            </li>
                            <li>
                              Exam Fee: <span className="float-right font-semibold">{formatCurrency(assignment.breakdown?.examFee)}</span>
                            </li>
                            <li>
                              Misc Fee: <span className="float-right font-semibold">{formatCurrency(assignment.breakdown?.miscFee)}</span>
                            </li>
                          </ul>
                        </div>

                        <div className="grid grid-cols-1 gap-2 mb-2">
                          <button
                            onClick={() => viewTransactions(assignment)}
                            className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-1.5 text-sm rounded-lg transition"
                          >
                            View Transactions
                          </button>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <button
                            disabled={!lastTransaction || invoiceGeneratingFor === assignment.id}
                            onClick={() => lastTransaction && downloadInvoice(assignment, lastTransaction)}
                            className="bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white font-semibold py-1.5 text-sm rounded-lg transition"
                          >
                            {invoiceGeneratingFor === assignment.id ? 'Generating...' : 'Download Invoice'}
                          </button>
                          <button
                            onClick={() => handleDeleteClick(assignment)}
                            className="bg-red-500 hover:bg-red-600 text-white font-semibold py-1.5 text-sm rounded-lg transition"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}

        {activeSection === 'assign' && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
              {/* Academic Year Filter */}
              <select
                value={studentFilters.academicYear}
                onChange={(e) => setStudentFilters((prev) => ({ ...prev, academicYear: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">Academic Year</option>
                {ACADEMIC_YEARS.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>

              {/* Course Filter - from API */}
              <select
                value={studentFilters.course}
                onChange={(e) => setStudentFilters((prev) => ({ ...prev, course: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">Course</option>
                {courses.map((course) => (
                  <option key={course} value={course}>
                    {course}
                  </option>
                ))}
              </select>

              {/* Search - Student ID or Name */}
              <div className="col-span-1 flex gap-2">
                <input
                  type="text"
                  value={studentFilters.studentId}
                  onChange={(e) => setStudentFilters((prev) => ({ ...prev, studentId: e.target.value }))}
                  placeholder="Search Student ID"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                />
                <input
                  type="text"
                  value={studentFilters.studentName}
                  onChange={(e) => setStudentFilters((prev) => ({ ...prev, studentName: e.target.value }))}
                  placeholder="Search Name"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>

            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-800">
                Students For Fee Assignment ({filteredStudents.length})
              </h2>
              <button
                onClick={handleBulkAssignClick}
                disabled={selectedCountInFilteredResults === 0}
                className="bg-blue-500 disabled:bg-gray-300 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition font-medium"
              >
                Assign Fee to Selected
              </button>
            </div>

            <div className="mb-4">
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-700">
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    disabled={filteredStudents.length === 0}
                    checked={
                      filteredStudents.length > 0 &&
                      selectedCountInFilteredResults === filteredStudents.length
                    }
                    onChange={(e) => handleSelectAllFilteredStudents(e.target.checked)}
                    className="w-4 h-4 rounded"
                  />
                  Select All Students
                </label>
                <span>Selected: {totalSelectedCount} students</span>
              </div>
            </div>

            {loadingStudents ? (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center text-gray-600">
                Loading students...
              </div>
            ) : !studentFilters.academicYear || !studentFilters.course ? (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-sm text-gray-600">
                Select Academic Year and Course to load students.
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-sm text-gray-600">
                No students found for the selected filters.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredStudents.map((student) => (
                <div
                  key={student.id}
                  className="bg-blue-50 border border-blue-200 rounded-lg p-6 hover:shadow-lg transition"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <span className="bg-green-100 text-green-800 text-xs font-semibold px-3 py-1 rounded-full">
                      Approved
                    </span>
                    <input
                      type="checkbox"
                      checked={Boolean(selectedStudentIds[student.id])}
                      onChange={(e) => toggleStudentSelection(student.id, e.target.checked)}
                      className="w-4 h-4 rounded"
                    />
                  </div>
                  <h3 className="font-bold text-gray-800 text-base mb-3">{normalizeName(student)}</h3>
                  <div className="space-y-1 text-sm text-gray-600 mb-6">
                    <p>
                      <span className="font-semibold">ID:</span> {student.id}
                    </p>
                    <p>
                      <span className="font-semibold">Course:</span> {student.course}
                    </p>
                    <p>
                      <span className="font-semibold">Academic Year:</span> {student.academicYear || student.academic_year || studentFilters.academicYear}
                    </p>
                    <p>
                      <span className="font-semibold">Email:</span> {student.email}
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
        )}


      </div>

      {showAssignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-3xl w-full mx-4 shadow-xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-2">
              Assign Fee {assignTargets.length > 1 ? `for ${assignTargets.length} Students` : `for ${assignTargets[0]?.studentName || ''}`}
            </h2>
            <p className="text-sm text-gray-600 mb-6">Single and bulk assignment both use this form.</p>

            <div className="space-y-4 mb-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Academic Year *</label>
                  <input
                    type="text"
                    value={assignFormData.academicYear}
                    onChange={(e) => setAssignFormData((prev) => ({ ...prev, academicYear: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    placeholder="e.g. 2025-2026"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Course *</label>
                  <input
                    type="text"
                    value={assignFormData.course}
                    onChange={(e) => setAssignFormData((prev) => ({ ...prev, course: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    placeholder="Enter course name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Due Date *</label>
                  <input
                    type="date"
                    value={assignFormData.dueDate}
                    onChange={(e) => setAssignFormData((prev) => ({ ...prev, dueDate: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Late Fee / Day</label>
                  <input
                    type="number"
                    value={assignFormData.lateFeePerDay}
                    onChange={(e) =>
                      setAssignFormData((prev) => ({ ...prev, lateFeePerDay: Number(e.target.value || 0) }))
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={assignFormData.useTemplate}
                    onChange={() => setAssignFormData((prev) => ({ ...prev, useTemplate: true }))}
                  />
                  <span className="text-sm text-gray-700">Use Fee Template</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={!assignFormData.useTemplate}
                    onChange={() => setAssignFormData((prev) => ({ ...prev, useTemplate: false, feeTemplateId: '' }))}
                  />
                  <span className="text-sm text-gray-700">Manual Entry</span>
                </label>
              </div>

              {assignFormData.useTemplate ? (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">Fee Template</label>
                    <button
                      type="button"
                      onClick={openCreateTemplateFromAssign}
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >
                      + Create Template
                    </button>
                  </div>
                  <select
                    value={assignFormData.feeTemplateId}
                    onChange={(e) => handleTemplateSelection(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="">Select Template</option>
                    {feeTemplates.map((template) => (
                      <option key={template.id} value={template.id}>
                        {template.name} ({template.course})
                      </option>
                    ))}
                  </select>
                  {feeTemplates.length === 0 && (
                    <p className="text-xs text-gray-500 mt-2">
                      No templates available. Click "Create Template" to add one.
                    </p>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {['tuitionFee', 'hostelFee', 'examFee', 'miscFee'].map((field) => (
                    <div key={field}>
                      <label className="block text-sm font-medium text-gray-700 mb-2">{field}</label>
                      <input
                        type="number"
                        value={assignFormData.breakdown[field]}
                        onChange={(e) =>
                          setAssignFormData((prev) => ({
                            ...prev,
                            breakdown: {
                              ...prev.breakdown,
                              [field]: Number(e.target.value || 0),
                            },
                          }))
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-8">
              <p className="font-bold text-gray-800 mb-3">Fee Summary:</p>
              <div className="space-y-2 text-sm">
                {Object.entries(getBreakdown()).map(([key, value]) => (
                  <p key={key}>
                    <span className="text-gray-600 capitalize">{key.replace(/([A-Z])/g, ' $1')}:</span>
                    <span className="font-semibold float-right">{formatCurrency(value)}</span>
                  </p>
                ))}
                <p className="font-bold border-t border-gray-300 pt-2">
                  <span>Total Amount:</span>
                  <span className="float-right">{formatCurrency(calculateTotal())}</span>
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowAssignModal(false);
                  setAssignTargets([]);
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

      {showTemplateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-2xl w-full mx-4 shadow-xl">
            <h2 className="text-2xl font-bold mb-6">Create Fee Template</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <input
                type="text"
                value={templateForm.name}
                onChange={(e) => setTemplateForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Fee Name"
                className="px-4 py-2 border border-gray-300 rounded-lg"
              />
              <input
                type="text"
                value={templateForm.course}
                onChange={(e) => setTemplateForm((prev) => ({ ...prev, course: e.target.value }))}
                placeholder="Course"
                className="px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>

            <div className="mb-2">
              <input
                type="number"
                value={templateAmount}
                onChange={(e) => setTemplateAmount(e.target.value)}
                placeholder="Fee Amount"
                min="0"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>

            <div className="mb-6 text-xs text-gray-500">
              This amount will be used as the total template fee.
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowTemplateModal(false)}
                className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateTemplate}
                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {showPaymentModal && selectedAssignment && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-xl w-full mx-4 shadow-xl">
            <h2 className="text-2xl font-bold mb-6">Add Payment</h2>

            <div className="space-y-4 mb-6">
              <p className="text-sm text-gray-700">
                <span className="font-semibold">Student:</span> {selectedAssignment.studentName}
              </p>
              <p className="text-sm text-gray-700">
                <span className="font-semibold">Due Amount:</span> {formatCurrency(selectedAssignment.dueAmount)}
              </p>

              <input
                type="number"
                value={paymentForm.amount}
                onChange={(e) => setPaymentForm((prev) => ({ ...prev, amount: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                placeholder="Payment Amount"
              />

              <select
                value={paymentForm.paymentMethod}
                onChange={(e) => setPaymentForm((prev) => ({ ...prev, paymentMethod: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              >
                {PAYMENT_METHODS.map((method) => (
                  <option key={method} value={method}>
                    {method}
                  </option>
                ))}
              </select>

              <input
                type="text"
                value={paymentForm.transactionId}
                onChange={(e) => setPaymentForm((prev) => ({ ...prev, transactionId: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                placeholder="Transaction ID"
              />

              <input
                type="date"
                value={paymentForm.date}
                onChange={(e) => setPaymentForm((prev) => ({ ...prev, date: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowPaymentModal(false)}
                className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition"
              >
                Cancel
              </button>
              <button
                onClick={submitPayment}
                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
              >
                Submit Payment
              </button>
            </div>
          </div>
        </div>
      )}

      {showTransactionsModal && selectedAssignment && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-2xl w-full mx-4 shadow-xl max-h-[85vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-2">Transaction History</h2>
            <p className="text-sm text-gray-600 mb-6">
              {selectedAssignment.studentName} ({selectedAssignment.studentId})
            </p>

            {transactions.length === 0 ? (
              <p className="text-gray-500">No transactions recorded.</p>
            ) : (
              <div className="space-y-3">
                {transactions.map((txn) => (
                  <div key={txn.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-700">
                      <p>
                        <span className="font-semibold">Amount:</span> {formatCurrency(txn.amount)}
                      </p>
                      <p>
                        <span className="font-semibold">Method:</span> {txn.paymentMethod}
                      </p>
                      <p>
                        <span className="font-semibold">Transaction ID:</span> {txn.transactionId}
                      </p>
                      <p>
                        <span className="font-semibold">Date:</span> {txn.date}
                      </p>
                    </div>
                    <div className="mt-3">
                      <button
                        onClick={() => downloadInvoice(selectedAssignment, txn)}
                        className="bg-green-500 hover:bg-green-600 text-white font-semibold py-1.5 px-3 text-sm rounded-lg transition"
                      >
                        Download Invoice
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowTransactionsModal(false)}
                className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 shadow-xl">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">Delete Fee Assignment</h2>

            <div className="bg-red-50 border border-red-300 rounded-lg p-4 mb-6">
              <p className="text-sm text-red-800 font-semibold mb-2">Warning</p>
              <p className="text-sm text-red-700">
                This action archives the assignment (soft delete) and keeps audit history.
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Reason for Deletion *</label>
              <textarea
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
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
