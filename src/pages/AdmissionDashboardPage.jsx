import { useState, useMemo, useEffect } from 'react'
import Layout from '../components/Layout'
import StatCard from '../components/StatCard'
import { getAdmissions, getAdmissionTracking, getAdmissionStats, getTrackingStats } from '../services/dataService'

export default function AdmissionDashboardPage() {
  const [applications, setApplications] = useState([])
  const [tracking, setTracking] = useState([])

  useEffect(() => {
    loadData()
    window.addEventListener('storage', loadData)
    return () => window.removeEventListener('storage', loadData)
  }, [])

  const loadData = () => {
    setApplications(getAdmissions())
    setTracking(getAdmissionTracking())
  }

  const admissionStats = useMemo(() => getAdmissionStats(), [applications])
  const trackingStats = useMemo(() => getTrackingStats(), [tracking])
  // Calculate funnel stages
  const funnelData = useMemo(() => {
    const appCount = admissionStats.total
    const approved = trackingStats.approved
    const enrolled = trackingStats.enrolled
    const feePaid = trackingStats.feePaid
    
    return [
      { stage: 'Applications', count: appCount, percentage: 100 },
      { stage: 'Approved', count: approved, percentage: appCount > 0 ? (approved / appCount * 100).toFixed(1) : 0 },
      { stage: 'Enrolled', count: enrolled, percentage: appCount > 0 ? (enrolled / appCount * 100).toFixed(1) : 0 },
      { stage: 'Fee Paid', count: feePaid, percentage: appCount > 0 ? (feePaid / appCount * 100).toFixed(1) : 0 },
    ]
  }, [admissionStats, trackingStats])

  // Split by category
  const studentStaff = useMemo(() => {
    const students = applications.length
    return {
      students,
      staff: 0,
      ratio: `${students}:0`
    }
  }, [applications])

  // Recent applications
  const recentApplications = useMemo(() => {
    return applications
      .sort((a, b) => new Date(b.appliedDate) - new Date(a.appliedDate))
      .slice(0, 5)
  }, [applications])

  const colorMap = {
    Pending: 'bg-blue-50 text-blue-700 border-blue-200',
    Approved: 'bg-green-50 text-green-700 border-green-200',
    Rejected: 'bg-red-50 text-red-700 border-red-200',
    'Under Review': 'bg-yellow-50 text-yellow-700 border-yellow-200',
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admission Dashboard</h1>
          <p className="text-gray-600 mt-1">Comprehensive overview of admissions workflow and KPIs</p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard
            label="Total Applications"
            value={admissionStats.total}
            color="blue"
            icon="description"
          />
          <StatCard
            label="Approved"
            value={trackingStats.approved}
            color="green"
            icon="check_circle"
          />
          <StatCard
            label="Under Review"
            value={admissionStats.underReview}
            color="yellow"
            icon="history"
          />
          <StatCard
            label="Enrolled"
            value={trackingStats.enrolled}
            color="purple"
            icon="school"
          />
          <StatCard
            label="Fee Pending"
            value={trackingStats.enrolled - trackingStats.feePaid}
            color="orange"
            icon="payment"
          />
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Admission Funnel */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Admission Funnel</h2>
            <div className="space-y-4">
              {funnelData.map((item, idx) => (
                <div key={idx}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">{item.stage}</span>
                    <span className="text-sm font-semibold text-gray-900">{item.count} ({item.percentage}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-3">
                    <div
                      className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Student vs Staff */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Classification</h2>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="flex items-center text-sm font-medium text-gray-700">
                    <span className="inline-block w-3 h-3 bg-blue-600 rounded-full mr-2"></span>
                    Student Admissions
                  </span>
                  <span className="text-sm font-semibold text-gray-900">{studentStaff.students}</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-3">
                  <div className="bg-blue-600 h-3 rounded-full" style={{ width: '100%' }} />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="flex items-center text-sm font-medium text-gray-700">
                    <span className="inline-block w-3 h-3 bg-purple-600 rounded-full mr-2"></span>
                    Staff Recruitment
                  </span>
                  <span className="text-sm font-semibold text-gray-900">{studentStaff.staff}</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-3">
                  <div className="bg-purple-600 h-3 rounded-full" style={{ width: '0%' }} />
                </div>
              </div>
              <div className="pt-4 border-t border-slate-200">
                <p className="text-xs text-gray-500">Current ratio: <span className="font-semibold text-gray-900">{studentStaff.ratio}</span></p>
              </div>
            </div>
          </div>
        </div>

        {/* Approval Statistics */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Application Status Breakdown</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 border border-slate-200 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Pending</p>
              <p className="text-2xl font-bold text-blue-600">{admissionStats.pending}</p>
              <p className="text-xs text-gray-500 mt-1">{((admissionStats.pending / admissionStats.total) * 100).toFixed(1)}% of total</p>
            </div>
            <div className="p-4 border border-slate-200 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Approved</p>
              <p className="text-2xl font-bold text-green-600">{trackingStats.approved}</p>
              <p className="text-xs text-gray-500 mt-1">{((trackingStats.approved / admissionStats.total) * 100).toFixed(1)}% of total</p>
            </div>
            <div className="p-4 border border-slate-200 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Under Review</p>
              <p className="text-2xl font-bold text-yellow-600">{admissionStats.underReview}</p>
              <p className="text-xs text-gray-500 mt-1">{((admissionStats.underReview / admissionStats.total) * 100).toFixed(1)}% of total</p>
            </div>
            <div className="p-4 border border-slate-200 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Rejected</p>
              <p className="text-2xl font-bold text-red-600">{admissionStats.rejected}</p>
              <p className="text-xs text-gray-500 mt-1">{((admissionStats.rejected / admissionStats.total) * 100).toFixed(1)}% of total</p>
            </div>
          </div>
        </div>

        {/* Recent Applications */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Recent Applications</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Name</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Course</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Merit</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Status</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Applied</th>
                </tr>
              </thead>
              <tbody>
                {recentApplications.map((app) => (
                  <tr key={app.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{app.name}</td>
                    <td className="px-4 py-3 text-gray-700">{app.course}</td>
                    <td className="px-4 py-3 text-gray-700">{app.merit.toFixed(1)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${colorMap[app.status]}`}>
                        {app.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{new Date(app.appliedDate).toLocaleDateString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Workflow Summary */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Workflow Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{admissionStats.total}</div>
              <p className="text-sm text-gray-600 mt-1">Total Applications</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{trackingStats.approved}</div>
              <p className="text-sm text-gray-600 mt-1">Ready for Enrollment</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">{trackingStats.enrolled}</div>
              <p className="text-sm text-gray-600 mt-1">Enrolled Students</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600">{trackingStats.enrolled - trackingStats.feePaid}</div>
              <p className="text-sm text-gray-600 mt-1">Awaiting Fee Payment</p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
