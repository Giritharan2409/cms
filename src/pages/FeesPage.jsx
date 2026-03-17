import React, { useState, useMemo } from 'react';
import Layout from '../components/Layout';
import { getUserSession } from '../auth/sessionController';
import { jsPDF } from 'jspdf';

export default function FeesPage() {
  const session = getUserSession();
  const studentId = session?.userId;

  const [feeAssignments, setFeeAssignments] = useState(
    JSON.parse(localStorage.getItem('fee_assignments') || '[]')
  );
  const [searchName, setSearchName] = useState('');
  const [searchDept, setSearchDept] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showProcessing, setShowProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [selectedFee, setSelectedFee] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('debitCard');
  const [transactionId, setTransactionId] = useState('');

  // Save to localStorage whenever fees change
  React.useEffect(() => {
    localStorage.setItem('fee_assignments', JSON.stringify(feeAssignments));
  }, [feeAssignments]);

  // Filter fees for current student
  const studentFees = useMemo(() => {
    let fees = feeAssignments;

    // Filter by student ID
    if (studentId) {
      fees = fees.filter((fee) => fee.studentId === studentId);
    }

    // Filter by name
    if (searchName) {
      fees = fees.filter((fee) =>
        fee.studentName?.toLowerCase().includes(searchName.toLowerCase())
      );
    }

    // Filter by course
    if (searchDept) {
      fees = fees.filter((fee) =>
        fee.course?.toLowerCase().includes(searchDept.toLowerCase())
      );
    }

    return fees;
  }, [feeAssignments, studentId, searchName, searchDept]);

  const handlePayClick = (fee) => {
    setSelectedFee(fee);
    setPaymentMethod('debitCard');
    setShowPaymentModal(true);
  };

  const handleProcessPayment = () => {
    setShowPaymentModal(false);
    setShowProcessing(true);

    // Simulate payment processing
    setTimeout(() => {
      setShowProcessing(false);
      setShowSuccess(true);

      // Generate transaction ID
      const txnId = `TXN${Math.random().toString().slice(2, 8)}`;
      setTransactionId(txnId);

      // Update fee status
      setFeeAssignments(
        feeAssignments.map((fee) =>
          fee.id === selectedFee.id
            ? {
                ...fee,
                paymentStatus: 'paid',
                paidDate: new Date().toISOString().split('T')[0],
                transactionId: txnId,
                paymentMethod,
              }
            : fee
        )
      );

      // Auto-generate invoice
      const invoice = {
        id: `BILL${Date.now()}`,
        studentId: selectedFee.studentId,
        studentName: selectedFee.studentName,
        applicationId: selectedFee.applicationId,
        semester: selectedFee.semester,
        course: selectedFee.course,
        items: [
          { description: 'Semester Fee', amount: selectedFee.semesterFee },
          { description: 'Book Fee', amount: selectedFee.bookFee },
          { description: 'Exam Fee', amount: selectedFee.examFee },
        ],
        total: selectedFee.totalFee,
        generatedDate: new Date().toISOString().split('T')[0],
        status: 'Paid',
        paymentStatus: 'Paid',
        paidDate: new Date().toISOString().split('T')[0],
        paymentMethod,
        transactionId: txnId,
        generatedFrom: selectedFee.id,
      };

      if (selectedFee.hostelFee > 0) {
        invoice.items.push({ description: 'Hostel Fee', amount: selectedFee.hostelFee });
      }
      if (selectedFee.miscFee > 0) {
        invoice.items.push({ description: 'Misc Fee', amount: selectedFee.miscFee });
      }

      const invoices = JSON.parse(localStorage.getItem('admin_invoices') || '[]');
      invoices.push(invoice);
      localStorage.setItem('admin_invoices', JSON.stringify(invoices));
    }, 2000);
  };

  const handleViewInvoice = (fee) => {
    const invoices = JSON.parse(localStorage.getItem('admin_invoices') || '[]');
    const invoice = invoices.find((inv) => inv.generatedFrom === fee.id);
    if (invoice) {
      downloadInvoicePDF(invoice);
    }
  };

  const downloadInvoicePDF = (invoice) => {
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    let yPosition = 20;

    // Header
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(18);
    pdf.text('INVOICE', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 10;

    // College info
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.text('College Management System', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 5;
    pdf.text('123 University Road, Education City', pageWidth / 2, yPosition, {
      align: 'center',
    });
    yPosition += 5;
    pdf.text('Phone: +91-9876543210', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 10;

    // Line separator
    pdf.setDrawColor(200);
    pdf.line(20, yPosition, pageWidth - 20, yPosition);
    yPosition += 10;

    // Student Information
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    pdf.text('Student Information', 20, yPosition);
    yPosition += 7;

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.text(`Student ID: ${invoice.studentId}`, 20, yPosition);
    yPosition += 5;
    pdf.text(`Name: ${invoice.studentName}`, 20, yPosition);
    yPosition += 5;
    pdf.text(`Course: ${invoice.course}`, 20, yPosition);
    yPosition += 10;

    // Invoice Details
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    pdf.text('Invoice Details', pageWidth / 2, yPosition);
    yPosition += 7;

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.text(`Invoice #: ${invoice.id}`, pageWidth / 2, yPosition);
    yPosition += 5;
    pdf.text(`Date: ${invoice.generatedDate}`, pageWidth / 2, yPosition);
    yPosition += 5;
    pdf.text(`Status: ${invoice.paymentStatus}`, pageWidth / 2, yPosition);
    yPosition += 10;

    // Fee Breakdown Table
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    pdf.text('Fee Breakdown', 20, yPosition);
    yPosition += 7;

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);

    // Table headers
    pdf.setFont('helvetica', 'bold');
    pdf.text('Description', 20, yPosition);
    pdf.text('Amount (₹)', pageWidth - 40, yPosition, { align: 'right' });
    yPosition += 5;

    // Table separator
    pdf.setDrawColor(200);
    pdf.line(20, yPosition, pageWidth - 20, yPosition);
    yPosition += 5;

    // Table rows
    pdf.setFont('helvetica', 'normal');
    if (invoice.items && Array.isArray(invoice.items)) {
      invoice.items.forEach((item) => {
        pdf.text(item.description, 20, yPosition);
        pdf.text(item.amount.toString(), pageWidth - 40, yPosition, { align: 'right' });
        yPosition += 5;
      });
    }

    // Total
    yPosition += 3;
    pdf.setDrawColor(200);
    pdf.line(20, yPosition, pageWidth - 20, yPosition);
    yPosition += 5;

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10);
    pdf.text('Total Amount', 20, yPosition);
    pdf.text(`₹${invoice.total}`, pageWidth - 40, yPosition, { align: 'right' });
    yPosition += 10;

    // Payment Confirmation
    if (invoice.paymentStatus === 'Paid') {
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(11);
      pdf.text('Payment Confirmation', 20, yPosition);
      yPosition += 7;

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      pdf.text(`Payment Date: ${invoice.paidDate}`, 20, yPosition);
      yPosition += 5;
      pdf.text(`Method: ${invoice.paymentMethod}`, 20, yPosition);
      yPosition += 5;
      pdf.text(`Transaction ID: ${invoice.transactionId}`, 20, yPosition);
    }

    pdf.save(`invoice_${invoice.id}.pdf`);
  };

  return (
    <Layout title="Fee Management">
      <div className="space-y-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-8 rounded-lg shadow-lg">
          <h1 className="text-3xl font-bold mb-2">Fee Management</h1>
          <p className="text-blue-100">Track and pay semester fees</p>
        </div>

        {/* Search Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search by Student Name
              </label>
              <input
                type="text"
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter name..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search by Course
              </label>
              <input
                type="text"
                value={searchDept}
                onChange={(e) => setSearchDept(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter course..."
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={() => {
                  setSearchName('');
                  setSearchDept('');
                }}
                className="w-full px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition"
              >
                Clear
              </button>
            </div>
          </div>
        </div>

        {/* Fee Cards Grid */}
        <div className="bg-white rounded-lg shadow p-6">
          {studentFees.length === 0 ? (
            <div className="text-center py-12">
              <span className="material-symbols-outlined text-6xl text-gray-300 block mb-4">
                receipt_long
              </span>
              <p className="text-gray-500 text-lg">No fees assigned yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {studentFees.map((fee) => (
                <div
                  key={fee.id}
                  className={`rounded-lg shadow border-l-4 p-6 ${
                    fee.paymentStatus === 'paid'
                      ? 'bg-green-50 border-l-green-500'
                      : 'bg-orange-50 border-l-orange-500'
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <span className="material-symbols-outlined text-3xl text-orange-500">
                      receipt_long
                    </span>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        fee.paymentStatus === 'paid'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-orange-100 text-orange-800'
                      }`}
                    >
                      {fee.paymentStatus === 'paid' ? 'Paid' : 'Pending'}
                    </span>
                  </div>

                  <h3 className="font-bold text-gray-800 text-lg mb-4">{fee.studentName}</h3>

                  <div className="space-y-2 text-sm text-gray-700 mb-4">
                    <p>
                      <span className="font-semibold">Application ID:</span> {fee.applicationId}
                    </p>
                    <p>
                      <span className="font-semibold">Semester:</span> {fee.semester}
                    </p>
                    <p>
                      <span className="font-semibold">Course:</span> {fee.course}
                    </p>
                    <p className="text-2xl font-bold text-orange-600 mt-3">
                      Total Fee: ₹{fee.totalFee}
                    </p>
                    <p>
                      <span className="font-semibold">Assigned Date:</span> {fee.assignedDate}
                    </p>
                    <p>
                      <span className="font-semibold">Payment Status:</span> {fee.paymentStatus}
                    </p>
                  </div>

                  {/* Fee Breakdown */}
                  <div className="bg-white rounded p-4 mb-4">
                    <p className="font-bold text-gray-800 mb-2">Fee Breakdown:</p>
                    <div className="space-y-1 text-sm">
                      <p>
                        • Semester Fee:{' '}
                        <span className="font-semibold float-right">₹{fee.semesterFee}</span>
                      </p>
                      <p>
                        • Book Fee:{' '}
                        <span className="font-semibold float-right">₹{fee.bookFee}</span>
                      </p>
                      <p>
                        • Exam Fee:{' '}
                        <span className="font-semibold float-right">₹{fee.examFee}</span>
                      </p>
                      {fee.hostelFee > 0 && (
                        <p>
                          • Hostel Fee:{' '}
                          <span className="font-semibold float-right">₹{fee.hostelFee}</span>
                        </p>
                      )}
                      {fee.miscFee > 0 && (
                        <p>
                          • Misc Fee:{' '}
                          <span className="font-semibold float-right">₹{fee.miscFee}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Action Button */}
                  {fee.paymentStatus === 'pending' ? (
                    <button
                      onClick={() => handlePayClick(fee)}
                      className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition font-medium"
                    >
                      Pay Now
                    </button>
                  ) : (
                    <button
                      onClick={() => handleViewInvoice(fee)}
                      className="w-full bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 transition font-medium"
                    >
                      View Invoice
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Payment Method Modal */}
      {showPaymentModal && selectedFee && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 shadow-xl">
            <h2 className="text-2xl font-bold mb-6">
              Pay {selectedFee.semester} Fee
            </h2>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-600">
                <span className="font-semibold">Amount:</span> ₹{selectedFee.totalFee}
              </p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Payment Method:
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="debitCard">Debit Card</option>
                <option value="upi">UPI</option>
                <option value="netBanking">Net Banking</option>
              </select>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowPaymentModal(false)}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleProcessPayment}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
              >
                Process Payment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Processing Modal */}
      {showProcessing && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 shadow-xl">
            <div className="text-center">
              <span className="material-symbols-outlined text-6xl text-blue-500 block mb-4 animate-spin">
                payments
              </span>
              <h2 className="text-xl font-bold text-gray-800 mb-2">Processing Payment...</h2>
              <p className="text-gray-600 mb-6">Please wait while we process your payment</p>

              {/* Progress Bar */}
              <div className="w-full bg-gray-300 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccess && selectedFee && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w- w-full mx-4 shadow-xl text-center">
            <span className="material-symbols-outlined text-6xl text-green-500 block mb-4">
              check_circle
            </span>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Payment Successful!</h2>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <p className="text-gray-600 mb-2">
                <span className="font-semibold">Amount Paid:</span> ₹{selectedFee.totalFee}
              </p>
              <p className="text-gray-600">
                <span className="font-semibold">Transaction ID:</span> {transactionId}
              </p>
            </div>

            <button
              onClick={() => {
                setShowSuccess(false);
                setSelectedFee(null);
              }}
              className="w-full px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </Layout>
  );
}
