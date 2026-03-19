import React, { useState, useMemo } from 'react';
import Layout from '../components/Layout';
import { getUserSession } from '../auth/sessionController';
import { jsPDF } from 'jspdf';

export default function InvoicePage() {
  const session = getUserSession();
  const isAdmin = session?.userRole === 'admin';
  const studentId = session?.userId;

  const [invoices, setInvoices] = useState(
    JSON.parse(localStorage.getItem('admin_invoices') || '[]')
  );
  const [searchName, setSearchName] = useState('');
  const [searchDept, setSearchDept] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleteReason, setDeleteReason] = useState('');

  // Listen for invoice updates
  React.useEffect(() => {
    const handleInvoiceUpdate = () => {
      const updatedInvoices = JSON.parse(localStorage.getItem('admin_invoices') || '[]');
      setInvoices(updatedInvoices);
    };

    window.addEventListener('invoiceUpdated', handleInvoiceUpdate);
    return () => window.removeEventListener('invoiceUpdated', handleInvoiceUpdate);
  }, []);

  // Create sample invoices for demonstration (only if admin and no invoices exist)
  React.useEffect(() => {
    if (isAdmin && invoices.length === 0) {
      const sampleInvoices = [
        {
          id: 'BILL1716138000000',
          studentId: 'STU001',
          studentName: 'John Doe',
          applicationId: 'APP001',
          semester: '1st Semester',
          course: 'ECE',
          total: 99200,
          paymentStatus: 'Paid',
          generatedDate: '2026-03-19',
          paidDate: '2026-03-19',
          paymentMethod: 'Debit Card',
          transactionId: 'TXN332064',
          generatedFrom: 'FEE001',
          items: [
            { description: 'Semester Fee', amount: 50000 },
            { description: 'Book Fee', amount: 12000 },
            { description: 'Exam Fee', amount: 5000 },
            { description: 'Lab Fee', amount: 8000 },
            { description: 'Library Fee', amount: 4200 }
          ]
        },
        {
          id: 'BILL1716138000001',
          studentId: 'STU002',
          studentName: 'Jane Smith',
          applicationId: 'APP002',
          semester: '1st Semester',
          course: 'ECE',
          total: 209200,
          paymentStatus: 'Pending',
          generatedDate: '2026-03-19',
          generatedFrom: 'FEE002',
          items: [
            { description: 'Semester Fee', amount: 50000 },
            { description: 'Book Fee', amount: 12000 },
            { description: 'Exam Fee', amount: 5000 },
            { description: 'Lab Fee', amount: 8000 },
            { description: 'Library Fee', amount: 4200 },
            { description: 'Hostel Fee', amount: 120000 },
            { description: 'Mess Fee', amount: 10000 }
          ]
        },
        {
          id: 'BILL1716138000002',
          studentId: 'STU003',
          studentName: 'Mike Johnson',
          applicationId: 'APP003',
          semester: '1st Semester',
          course: 'ECE',
          total: 184200,
          paymentStatus: 'Pending',
          generatedDate: '2026-03-19',
          generatedFrom: 'FEE003',
          items: [
            { description: 'Semester Fee', amount: 50000 },
            { description: 'Book Fee', amount: 12000 },
            { description: 'Exam Fee', amount: 5000 },
            { description: 'Lab Fee', amount: 8000 },
            { description: 'Library Fee', amount: 4200 },
            { description: 'Hostel Fee', amount: 120000 },
            { description: 'Misc Fee', amount: 5000 }
          ]
        }
      ];
      
      localStorage.setItem('admin_invoices', JSON.stringify(sampleInvoices));
      setInvoices(sampleInvoices);
    }
  }, [isAdmin, invoices.length]);

  // Filter invoices based on user role
  const filteredInvoices = useMemo(() => {
    let filtered = invoices;

    // If not admin, filter by student ID
    if (!isAdmin && studentId) {
      filtered = filtered.filter((inv) => inv.studentId === studentId);
    }

    // Filter by name
    if (searchName) {
      filtered = filtered.filter((inv) =>
        inv.studentName?.toLowerCase().includes(searchName.toLowerCase())
      );
    }

    // Filter by course
    if (searchDept) {
      filtered = filtered.filter((inv) =>
        inv.course?.toLowerCase().includes(searchDept.toLowerCase())
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter((inv) =>
        inv.paymentStatus?.toLowerCase() === statusFilter.toLowerCase()
      );
    }

    return filtered;
  }, [invoices, studentId, searchName, searchDept, statusFilter, isAdmin]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'Paid':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'Pending':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'Failed':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-300';
    }
  };

  const handleDownloadPDF = (invoice) => {
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
      pdf.text(`Payment Date: ${invoice.paidDate || 'N/A'}`, 20, yPosition);
      yPosition += 5;
      pdf.text(`Method: ${invoice.paymentMethod || 'N/A'}`, 20, yPosition);
      yPosition += 5;
      pdf.text(`Transaction ID: ${invoice.transactionId || 'N/A'}`, 20, yPosition);
    }

    pdf.save(`invoice_${invoice.id}.pdf`);
  };

  const handleDeleteInvoice = (invoice) => {
    setDeleteConfirm(invoice);
    setDeleteReason('');
  };

  const handleConfirmDelete = () => {
    if (!deleteReason.trim()) {
      alert('Please provide a deletion reason');
      return;
    }

    const updatedInvoices = invoices.filter((inv) => inv.id !== deleteConfirm.id);
    setInvoices(updatedInvoices);
    localStorage.setItem('admin_invoices', JSON.stringify(updatedInvoices));
    
    // Dispatch event for real-time updates
    window.dispatchEvent(new CustomEvent('invoiceUpdated', { detail: updatedInvoices }));
    
    setDeleteConfirm(null);
    setDeleteReason('');
    alert('Invoice deleted successfully');
  };

  const handlePrintInvoice = (invoice) => {
    const printWindow = window.open('', '_blank');
    const printContent = `
      <html>
        <head>
          <title>Invoice ${invoice.id}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .info { margin-bottom: 20px; }
            .table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            .table th, .table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            .table th { background-color: #f2f2f2; }
            .total { font-weight: bold; font-size: 18px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>INVOICE</h1>
            <p>College Management System</p>
            <p>123 University Road, Education City</p>
          </div>
          <div class="info">
            <p><strong>Invoice #:</strong> ${invoice.id}</p>
            <p><strong>Date:</strong> ${invoice.generatedDate}</p>
            <p><strong>Status:</strong> ${invoice.paymentStatus}</p>
          </div>
          <div class="info">
            <p><strong>Student ID:</strong> ${invoice.studentId}</p>
            <p><strong>Student Name:</strong> ${invoice.studentName}</p>
            <p><strong>Course:</strong> ${invoice.course}</p>
          </div>
          <table class="table">
            <thead>
              <tr>
                <th>Description</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              ${invoice.items?.map(item => `<tr><td>${item.description}</td><td>₹${item.amount}</td></tr>`).join('') || ''}
              <tr class="total">
                <td>Total</td>
                <td>₹${invoice.total}</td>
              </tr>
            </tbody>
          </table>
          ${invoice.paymentStatus === 'Paid' ? `
            <div class="info">
              <p><strong>Payment Date:</strong> ${invoice.paidDate}</p>
              <p><strong>Payment Method:</strong> ${invoice.paymentMethod}</p>
              <p><strong>Transaction ID:</strong> ${invoice.transactionId}</p>
            </div>
          ` : ''}
        </body>
      </html>
    `;
    
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <Layout title={isAdmin ? "Invoice Management" : "Invoices & Bills"}>
      <div className="space-y-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-8 rounded-lg shadow-lg">
          <h1 className="text-3xl font-bold mb-2">{isAdmin ? "Invoice Management" : "Invoices & Bills"}</h1>
          <p className="text-blue-100">{isAdmin ? "Manage all generated invoices" : "Your invoices and payment details"}</p>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-bold text-blue-900 mb-3">About This Page</h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li>• See all your generated invoices</li>
            <li>• Review fee breakdowns</li>
            <li>• Filter by status</li>
            <li>• Download as PDF/Text</li>
            <li>• Click to view full details</li>
          </ul>
        </div>

        {/* Search Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search by Name
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
                  setStatusFilter('all');
                }}
                className="w-full px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition"
              >
                Clear Filters
              </button>
            </div>
          </div>

          {/* Status Filter Tabs */}
          <div className="flex flex-wrap gap-2">
            {['all', 'Paid', 'Pending', 'Failed'].map((status) => (
              <button
                key={status}
                onClick={() =>
                  setStatusFilter(status === 'all' ? 'all' : status)
                }
                className={`px-4 py-2 rounded-lg transition ${
                  statusFilter === status || (statusFilter === 'all' && status === 'all')
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Invoice Cards Grid */}
        <div className="bg-white rounded-lg shadow p-6">
          {filteredInvoices.length === 0 ? (
            <div className="text-center py-12">
              <span className="material-symbols-outlined text-6xl text-gray-300 block mb-4">
                receipt
              </span>
              <p className="text-gray-500 text-lg">No invoices found</p>
              <p className="text-gray-400 text-sm">{isAdmin ? "No invoices have been generated yet. Please go to Admin Fee Page and click 'Generate Invoice' button." : "Your invoices will appear here once generated"}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredInvoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className={`rounded-lg shadow-lg p-6 hover:shadow-xl transition ${
                    invoice.paymentStatus === 'Paid'
                      ? 'bg-green-100 border-2 border-green-300'
                      : invoice.paymentStatus === 'Pending'
                      ? 'bg-orange-100 border-2 border-orange-300'
                      : 'bg-red-100 border-2 border-red-300'
                  }`}
                >
                  {/* Header with Status Badge */}
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-gray-800 mb-1">
                        {invoice.course} Bill
                      </h3>
                      <p className="text-sm text-gray-600">{invoice.id}</p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold ${
                        invoice.paymentStatus === 'Paid'
                          ? 'bg-green-500 text-white'
                          : invoice.paymentStatus === 'Pending'
                          ? 'bg-orange-500 text-white'
                          : 'bg-red-500 text-white'
                      }`}
                    >
                      {invoice.paymentStatus}
                    </span>
                  </div>

                  {/* Amount Display */}
                  <div className="bg-white rounded-lg p-4 mb-4 border border-gray-200">
                    <p className="text-3xl font-bold text-gray-800">₹{invoice.total.toLocaleString()}</p>
                  </div>

                  {/* Student Information */}
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Student:</span>
                      <span className="text-sm font-semibold text-gray-800">{invoice.studentName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Course:</span>
                      <span className="text-sm font-semibold text-gray-800">{invoice.course}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Date:</span>
                      <span className="text-sm font-semibold text-gray-800">{invoice.generatedDate}</span>
                    </div>
                    {invoice.paymentStatus === 'Paid' && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Method:</span>
                          <span className="text-sm font-semibold text-gray-800">{invoice.paymentMethod || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">TXN ID:</span>
                          <span className="text-sm font-semibold text-gray-800">{invoice.transactionId || 'N/A'}</span>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownloadPDF(invoice);
                      }}
                      className="flex-1 bg-blue-500 text-white py-2 rounded text-sm hover:bg-blue-600 transition font-medium"
                    >
                      Download as PDF
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePrintInvoice(invoice);
                      }}
                      className="flex-1 bg-purple-500 text-white py-2 rounded text-sm hover:bg-purple-600 transition font-medium"
                    >
                      Print
                    </button>
                    {isAdmin && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteInvoice(invoice);
                        }}
                        className="p-2 bg-red-500 text-white rounded text-sm hover:bg-red-600 transition"
                        title="Delete"
                      >
                        <span className="material-symbols-outlined text-lg">delete</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 shadow-xl">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">Delete Invoice</h2>

            <div className="bg-red-50 border border-red-300 rounded-lg p-4 mb-6">
              <p className="text-sm text-red-800 font-semibold mb-2">⚠ Warning</p>
              <p className="text-sm text-red-700">
                This will delete the invoice and all related payment history. This action cannot be undone.
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
