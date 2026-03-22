import React, { useState, useEffect, useMemo } from 'react';
import Layout from '../components/Layout';
import { API_BASE } from '../api/apiBase';

export default function FinanceInvoicePage() {
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');

    const fetchInvoices = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE}/invoices`);
            if (response.ok) {
                const data = await response.json();
                // Filter to only show payroll-linked invoices for this page
                setInvoices(data.filter(inv => inv.payroll_id));
            }
        } catch (error) {
            console.error('Failed to fetch invoices:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInvoices();
    }, []);

    const handleStatusUpdate = async (invoiceId, newStatus) => {
        try {
            const response = await fetch(`${API_BASE}/invoices/${invoiceId}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    payment_status: newStatus,
                    paid_date: newStatus === 'Paid' ? new Date().toISOString() : null
                }),
            });

            if (response.ok) {
                // Refresh invoices
                fetchInvoices();
                alert(`Invoice status updated to ${newStatus}`);
            } else {
                alert('Failed to update status');
            }
        } catch (error) {
            console.error('Error updating status:', error);
            alert('Error updating status');
        }
    };

    const filteredInvoices = useMemo(() => {
        return invoices.filter((invoice) => {
            // Focus on Giritharan and Jeevan as requested
            const staffName = invoice.staff_name?.toLowerCase() || '';
            const isRequestedStaff = staffName.includes('giritharan') || staffName.includes('jeevan');

            if (!isRequestedStaff) return false;

            const matchesSearch =
                staffName.includes(searchTerm.toLowerCase()) ||
                invoice.invoice_id?.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesStatus =
                statusFilter === 'all' ||
                invoice.payment_status?.toLowerCase() === statusFilter.toLowerCase();

            return matchesSearch && matchesStatus;
        });
    }, [invoices, searchTerm, statusFilter]);

    const stats = useMemo(() => {
        return {
            total: invoices.length,
            pending: invoices.filter(inv => inv.payment_status === 'Draft' || inv.payment_status === 'Processing').length,
            paid: invoices.filter(inv => inv.payment_status === 'Paid').length,
        };
    }, [invoices]);

    return (
        <Layout title="Payroll Invoices">
            <div className="space-y-6">
                {/* Stats Header */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                        <div className="flex items-center gap-4">
                            <div className="bg-blue-50 p-3 rounded-xl text-blue-600">
                                <span className="material-symbols-outlined text-2xl">description</span>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Invoices</p>
                                <p className="text-2xl font-bold text-slate-800">{stats.total}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                        <div className="flex items-center gap-4">
                            <div className="bg-amber-50 p-3 rounded-xl text-amber-600">
                                <span className="material-symbols-outlined text-2xl">pending_actions</span>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pending Action</p>
                                <p className="text-2xl font-bold text-slate-800">{stats.pending}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                        <div className="flex items-center gap-4">
                            <div className="bg-emerald-50 p-3 rounded-xl text-emerald-600">
                                <span className="material-symbols-outlined text-2xl">check_circle</span>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Paid</p>
                                <p className="text-2xl font-bold text-slate-800">{stats.paid}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters & Search */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
                        <div className="relative w-full md:w-96">
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
                            <input
                                type="text"
                                placeholder="Search staff name or invoice ID..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
                            />
                        </div>
                        <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-1">
                            {['all', 'Draft', 'Processing', 'Paid'].map((status) => (
                                <button
                                    key={status}
                                    onClick={() => setStatusFilter(status)}
                                    className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${statusFilter === status
                                        ? 'bg-blue-600 text-white shadow-md'
                                        : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                                        }`}
                                >
                                    {status.charAt(0).toUpperCase() + status.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Invoices Table */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 border-b border-slate-100">
                                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Invoice ID</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Staff Details</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pay Period</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Amount</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {loading ? (
                                    <tr>
                                        <td colSpan="6" className="px-6 py-12 text-center text-slate-400">Loading invoices...</td>
                                    </tr>
                                ) : filteredInvoices.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="px-6 py-12 text-center text-slate-400">No invoices found.</td>
                                    </tr>
                                ) : (
                                    filteredInvoices.map((invoice) => (
                                        <tr key={invoice.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <span className="text-sm font-mono font-bold text-slate-800">{invoice.invoice_id}</span>
                                                <p className="text-[10px] text-slate-400 mt-1">Ref: {invoice.payroll_id.substring(0, 8)}...</p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-slate-800">{invoice.staff_name}</span>
                                                    <span className="text-[10px] text-slate-400 font-medium">ID: {invoice.staff_id}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2 text-slate-600">
                                                    <span className="material-symbols-outlined text-sm">calendar_month</span>
                                                    <span className="text-sm font-medium">{invoice.pay_period}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm font-bold text-slate-900">₹{invoice.total_amount.toLocaleString()}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-3 py-1 rounded-lg text-[10px] font-bold border uppercase tracking-widest ${invoice.payment_status === 'Paid'
                                                    ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                                    : invoice.payment_status === 'Processing'
                                                        ? 'bg-blue-50 text-blue-600 border-blue-100'
                                                        : 'bg-slate-100 text-slate-500 border-slate-200'
                                                    }`}>
                                                    {invoice.payment_status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex gap-2 justify-end">
                                                    {invoice.payment_status === 'Draft' && (
                                                        <button
                                                            onClick={() => handleStatusUpdate(invoice.id, 'Processing')}
                                                            className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition shadow-sm"
                                                        >
                                                            Process Payment
                                                        </button>
                                                    )}
                                                    {invoice.payment_status === 'Processing' && (
                                                        <button
                                                            onClick={() => handleStatusUpdate(invoice.id, 'Paid')}
                                                            className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 transition shadow-sm"
                                                        >
                                                            Mark as Paid
                                                        </button>
                                                    )}
                                                    {invoice.payment_status === 'Paid' && (
                                                        <div className="flex items-center gap-1 text-emerald-600 text-xs font-bold">
                                                            <span className="material-symbols-outlined text-sm">verified_user</span>
                                                            Completed
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </Layout>
    );
}
