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
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [showProcessing, setShowProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [selectedFee, setSelectedFee] = useState(null);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [paymentDetails, setPaymentDetails] = useState({
    cardHolderName: '',
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    upiId: '',
  });

  // Save to localStorage whenever fees change
  React.useEffect(() => {
    localStorage.setItem('fee_assignments', JSON.stringify(feeAssignments));
  }, [feeAssignments]);

  // Listen for fee assignment updates from admin side
  React.useEffect(() => {
    const handleFeeUpdate = () => {
      const updatedFees = JSON.parse(localStorage.getItem('fee_assignments') || '[]');
      setFeeAssignments(updatedFees);
    };

    window.addEventListener('feeAssignmentUpdated', handleFeeUpdate);
    return () => window.removeEventListener('feeAssignmentUpdated', handleFeeUpdate);
  }, []);

  // Listen for invoice updates that might affect fee status
  React.useEffect(() => {
    const handleInvoiceUpdate = () => {
      // Refresh fee assignments to sync with latest invoice data
      const updatedFees = JSON.parse(localStorage.getItem('fee_assignments') || '[]');
      setFeeAssignments(updatedFees);
    };

    window.addEventListener('invoiceUpdated', handleInvoiceUpdate);
    return () => window.removeEventListener('invoiceUpdated', handleInvoiceUpdate);
  }, []);

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
    setPaymentMethod('');
    setPaymentDetails({
      cardHolderName: '',
      cardNumber: '',
      expiryDate: '',
      cvv: '',
      upiId: '',
    });
    setShowPaymentModal(true);
  };

  const handlePaymentDetailsChange = (e) => {
    const { name, value } = e.target;
    let formattedValue = value;

    if (name === 'cardNumber') {
      formattedValue = value.replace(/\D/g, '').slice(0, 16);
      if (formattedValue.length > 0) {
        formattedValue = formattedValue.match(/.{1,4}/g).join(' ');
      }
    } else if (name === 'expiryDate') {
      formattedValue = value.replace(/\D/g, '').slice(0, 4);
      if (formattedValue.length >= 2) {
        formattedValue = formattedValue.slice(0, 2) + '/' + formattedValue.slice(2, 4);
      }
    } else if (name === 'cvv') {
      formattedValue = value.replace(/\D/g, '').slice(0, 3);
    }

    setPaymentDetails((prev) => ({
      ...prev,
      [name]: formattedValue,
    }));
  };

  const handleSelectPaymentMethod = () => {
    if (!paymentMethod) {
      alert('Please select a payment method');
      return;
    }
    setShowPaymentForm(true);
  };

  const handleProcessPayment = () => {
    // Validate payment details based on payment method
    if (paymentMethod === 'Debit Card' || paymentMethod === 'Credit Card') {
      if (!paymentDetails.cardHolderName || !paymentDetails.cardNumber || !paymentDetails.expiryDate || !paymentDetails.cvv) {
        alert('Please fill all card details');
        return;
      }
    } else if (paymentMethod === 'UPI') {
      if (!paymentDetails.upiId) {
        alert('Please enter UPI ID');
        return;
      }
    }

    setShowPaymentForm(false);
    setShowPaymentModal(false);
    setShowProcessing(true);

    // Simulate payment processing with 90% success rate
    const paymentSuccess = Math.random() > 0.1; // 90% success

    setTimeout(() => {
      setShowProcessing(false);

      if (paymentSuccess) {
        // Generate transaction ID
        const txnId = `TXN${Math.random().toString().slice(2, 8)}`;
        setTransactionId(txnId);

        // 1️⃣ Update fee_assignments status
        const updatedFeeAssignments = feeAssignments.map((fee) =>
          fee.id === selectedFee.id
            ? {
                ...fee,
                paymentStatus: 'paid',
                paidDate: new Date().toISOString().split('T')[0],
                transactionId: txnId,
                paymentMethod: paymentMethod,
              }
            : fee
        );
        setFeeAssignments(updatedFeeAssignments);
        localStorage.setItem('fee_assignments', JSON.stringify(updatedFeeAssignments));

        // Dispatch event to notify admin and other components about fee update
        window.dispatchEvent(new CustomEvent('feeAssignmentUpdated', { detail: updatedFeeAssignments }));

        // 2️⃣ CRITICAL: Update corresponding invoice in admin_invoices
        const invoices = JSON.parse(localStorage.getItem('admin_invoices') || '[]');
        const existingInvoice = invoices.find((inv) => inv.generatedFrom === selectedFee.id);

        if (existingInvoice) {
          // Update status to Paid (capital P)
          existingInvoice.paymentStatus = 'Paid';
          existingInvoice.status = 'Paid';
          existingInvoice.paidDate = new Date().toISOString().split('T')[0];
          existingInvoice.paymentMethod = paymentMethod;
          existingInvoice.transactionId = txnId;
        }

        localStorage.setItem('admin_invoices', JSON.stringify(invoices));

        // Dispatch custom event for real-time updates in other components
        window.dispatchEvent(new CustomEvent('invoiceUpdated', { detail: invoices }));

        setShowSuccess(true);
      } else {
        // Payment failed
        alert('Payment failed. Please try again.');
        setSelectedFee(null);
      }
    }, 2000);
  };

  const handleViewInvoice = (fee) => {
    const invoices = JSON.parse(localStorage.getItem('admin_invoices') || '[]');
    const invoice = invoices.find((inv) => inv.generatedFrom === fee.id);
    if (invoice) {
      setSelectedInvoice(invoice);
      setShowInvoiceModal(true);
    } else {
      alert('Invoice not found. Please contact admin.');
    }
  };

  const handleDownloadInvoice = (invoice) => {
    downloadInvoicePDF(invoice);
    setShowInvoiceModal(false);
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
      {showPaymentModal && selectedFee && !showPaymentForm && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 shadow-xl">
            <h2 className="text-2xl font-bold mb-6">Pay {selectedFee.semester} Fee</h2>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-600 mb-2">
                <span className="font-semibold">Amount:</span> ₹{selectedFee.totalFee.toLocaleString()}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-semibold">Course:</span> {selectedFee.course}
              </p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Select Payment Method *
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Select Payment Method --</option>
                <option value="Debit Card">Debit Card</option>
                <option value="Credit Card">Credit Card</option>
                <option value="UPI">UPI</option>
                <option value="Net Banking">Net Banking</option>
              </select>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowPaymentModal(false);
                  setSelectedFee(null);
                  setPaymentMethod('');
                }}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSelectPaymentMethod}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Form Modal */}
      {showPaymentForm && selectedFee && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 shadow-xl my-8">
            <h2 className="text-2xl font-bold mb-6">
              Complete Payment - ₹{selectedFee.totalFee.toLocaleString()}
            </h2>

            <div className="bg-gray-100 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-600">
                <span className="font-semibold">Amount:</span> ₹{selectedFee.totalFee.toLocaleString()}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-semibold">Payment Method:</span> {paymentMethod}
              </p>
            </div>

            {/* Card Payment Fields */}
            {(paymentMethod === 'Credit Card' || paymentMethod === 'Debit Card') && (
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Card Holder Name *
                  </label>
                  <input
                    type="text"
                    name="cardHolderName"
                    value={paymentDetails.cardHolderName}
                    onChange={handlePaymentDetailsChange}
                    placeholder="John Doe"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Card Number *
                  </label>
                  <input
                    type="text"
                    name="cardNumber"
                    value={paymentDetails.cardNumber}
                    onChange={handlePaymentDetailsChange}
                    placeholder="1234 5678 9012 3456"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Expiry Date *
                    </label>
                    <input
                      type="text"
                      name="expiryDate"
                      value={paymentDetails.expiryDate}
                      onChange={handlePaymentDetailsChange}
                      placeholder="MM/YY"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      CVV *
                    </label>
                    <input
                      type="text"
                      name="cvv"
                      value={paymentDetails.cvv}
                      onChange={handlePaymentDetailsChange}
                      placeholder="123"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* UPI Payment Fields */}
            {paymentMethod === 'UPI' && (
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    UPI ID / Mobile Number *
                  </label>
                  <input
                    type="text"
                    name="upiId"
                    value={paymentDetails.upiId}
                    onChange={handlePaymentDetailsChange}
                    placeholder="username@upi or 9876543210"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="bg-blue-50 p-4 rounded-lg text-center">
                  <p className="text-sm text-blue-800 mb-3">Quick Response Code (QR)</p>
                  <div className="bg-white p-4 rounded border-2 border-blue-200 flex items-center justify-center h-40">
                    <div className="text-gray-400 text-sm text-center">
                      📲 QR Code<br />
                      (Scan for UPI Payment)
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Net Banking */}
            {paymentMethod === 'Net Banking' && (
              <div className="space-y-4 mb-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    You will be redirected to your bank's website to complete the payment.
                  </p>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowPaymentForm(false);
                  setShowPaymentModal(true);
                  setPaymentDetails({
                    cardHolderName: '',
                    cardNumber: '',
                    expiryDate: '',
                    cvv: '',
                    upiId: '',
                  });
                }}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition"
              >
                Back
              </button>
              <button
                onClick={handleProcessPayment}
                className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition font-medium"
              >
                Pay Now
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
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 shadow-xl text-center">
            <span className="material-symbols-outlined text-6xl text-green-500 block mb-4">
              check_circle
            </span>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Payment Successful!</h2>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 text-left">
              <p className="text-gray-600 mb-2 text-sm">
                <span className="font-semibold">Amount Paid:</span> ₹{selectedFee.totalFee.toLocaleString()}
              </p>
              <p className="text-gray-600 text-sm">
                <span className="font-semibold">Transaction ID:</span> {transactionId}
              </p>
              <p className="text-gray-600 text-sm">
                <span className="font-semibold">Date:</span> {new Date().toLocaleString()}
              </p>
            </div>

            <button
              onClick={() => {
                setShowSuccess(false);
                setSelectedFee(null);
                setPaymentMethod('');
                setPaymentDetails({
                  cardHolderName: '',
                  cardNumber: '',
                  expiryDate: '',
                  cvv: '',
                  upiId: '',
                });
              }}
              className="w-full px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition font-medium"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Invoice Modal */}
      {showInvoiceModal && selectedInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-lg p-8 max-w-2xl w-full mx-4 shadow-xl my-8">
            <h2 className="text-2xl font-bold mb-6">Invoice Details</h2>

            {/* Invoice Header */}
            <div className="border-b-2 border-gray-200 pb-6 mb-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-600 mb-1">
                    <span className="font-semibold">Invoice ID:</span> {selectedInvoice.id}
                  </p>
                  <p className="text-sm text-gray-600 mb-1">
                    <span className="font-semibold">Date:</span> {selectedInvoice.generatedDate}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">
                    <span className="font-semibold">Student:</span> {selectedInvoice.studentName}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-semibold">Course:</span> {selectedInvoice.course}
                  </p>
                </div>
              </div>
            </div>

            {/* Fee Items */}
            <div className="mb-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Fee Breakdown</h3>
              <div className="space-y-2">
                {selectedInvoice.items?.map((item, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span className="text-gray-600">{item.description}</span>
                    <span className="font-semibold text-gray-800">₹{item.amount.toLocaleString()}</span>
                  </div>
                ))}
              </div>
              <div className="border-t-2 border-gray-200 mt-4 pt-4">
                <div className="flex justify-between text-lg">
                  <span className="font-bold text-gray-800">Total Amount</span>
                  <span className="font-bold text-orange-600">₹{selectedInvoice.total.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Payment Status */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <p className="text-sm mb-2">
                <span className="font-semibold">Payment Status:</span>
                <span
                  className={`ml-2 px-3 py-1 rounded-full text-xs font-semibold ${
                    selectedInvoice.paymentStatus === 'Paid'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-orange-100 text-orange-800'
                  }`}
                >
                  {selectedInvoice.paymentStatus}
                </span>
              </p>
              {selectedInvoice.paymentStatus === 'Paid' && (
                <>
                  <p className="text-sm text-gray-600">
                    <span className="font-semibold">Paid Date:</span> {selectedInvoice.paidDate}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-semibold">Payment Method:</span> {selectedInvoice.paymentMethod}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-semibold">Transaction ID:</span> {selectedInvoice.transactionId}
                  </p>
                </>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowInvoiceModal(false)}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition"
              >
                Close
              </button>
              <button
                onClick={() => handleDownloadInvoice(selectedInvoice)}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition font-medium"
              >
                📥 Download PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
