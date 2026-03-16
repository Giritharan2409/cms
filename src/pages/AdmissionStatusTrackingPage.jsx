import { useState, useMemo, useEffect } from 'react'
import Layout from '../components/Layout'
import { getAdmissionTracking, updateTrackingStage, rejectApplication } from '../services/dataService'

export default function AdmissionStatusTrackingPage() {
  const [expandedId, setExpandedId] = useState(null)
  const [filterStage, setFilterStage] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [tracking, setTracking] = useState([])

  useEffect(() => {
    loadTracking()
    window.addEventListener('storage', loadTracking)
    return () => window.removeEventListener('storage', loadTracking)
  }, [])

  const loadTracking = () => {
    setTracking(getAdmissionTracking())
  }

  // Filter tracking data
  const filteredTracking = useMemo(() => {
    let filtered = tracking

    if (filterStage !== 'All') {
      filtered = filtered.filter(t => t.currentStage === filterStage)
    }

    if (searchQuery) {
      filtered = filtered.filter(t =>
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.applicationId.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    return filtered
  }, [tracking, filterStage, searchQuery])

  const stages = ['Application', 'Under Review', 'Approved', 'Enrollment', 'Fee Payment']
  const stageColors = {
    'Application': 'bg-blue-100 text-blue-700',
    'Under Review': 'bg-yellow-100 text-yellow-700',
    'Approved': 'bg-green-100 text-green-700',
    'Enrollment': 'bg-purple-100 text-purple-700',
    'Fee Payment': 'bg-orange-100 text-orange-700',
  }

  const statusColors = {
    'completed': 'text-green-600 bg-green-50',
    'in-progress': 'text-blue-600 bg-blue-50',
    'pending': 'text-gray-600 bg-gray-50',
    'rejected': 'text-red-600 bg-red-50',
  }

  const getStageIndex = (stage) => stages.indexOf(stage)
  const getCurrentStageIndex = (currentStage) => {
    const index = stages.indexOf(currentStage)
    return index === -1 ? 0 : index
  }

  // Action handlers
  const handleApprove = (applicationId) => {
    updateTrackingStage(applicationId, 'Approved', 'Application approved by admin')
    loadTracking()
  }

  const handleReject = (applicationId) => {
    rejectApplication(applicationId, 'Application rejected by admin')
    loadTracking()
  }

  const handleMoveToEnrollment = (applicationId) => {
    updateTrackingStage(applicationId, 'Enrollment', 'Moved to enrollment process')
    loadTracking()
  }

  const handleGenerateFeeInvoice = (applicationId) => {
    updateTrackingStage(applicationId, 'Fee Payment', 'Fee invoice generated')
    loadTracking()
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admission Status Tracking</h1>
          <p className="text-gray-600 mt-1">Monitor each application through the enrollment workflow</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search by name or application ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {['All', 'Approved', 'Under Review', 'Enrolled', 'Rejected'].map((stage) => (
                <button
                  key={stage}
                  onClick={() => setFilterStage(stage === 'All' ? 'All' : stage)}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition ${
                    filterStage === stage
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-gray-700 hover:bg-slate-200'
                  }`}
                >
                  {stage}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Stage Legend */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Workflow Stages</h3>
          <div className="flex flex-wrap gap-4">
            {stages.map((stage) => (
              <div key={stage} className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${stageColors[stage]}`}></div>
                <span className="text-sm text-gray-700">{stage}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Applications List */}
        <div className="space-y-4">
          {filteredTracking.map((tracking) => {
            const isExpanded = expandedId === tracking.applicationId
            const currentStageIdx = getCurrentStageIndex(tracking.currentStage)

            return (
              <div
                key={tracking.applicationId}
                className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"
              >
                {/* Collapsed View */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : tracking.applicationId)}
                  className="w-full p-6 text-left hover:bg-slate-50 transition"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-4">
                        <div>
                          <h3 className="font-semibold text-gray-900">{tracking.name}</h3>
                          <p className="text-sm text-gray-600">{tracking.course} • {tracking.applicationId}</p>
                        </div>
                      </div>
                    </div>

                    {/* Stage Progress Bar */}
                    <div className="hidden md:flex items-center gap-2 mx-6 flex-1">
                      {stages.map((stage, idx) => (
                        <div key={stage} className="flex-1">
                          <div className="flex items-center">
                            <div
                              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                                idx <= currentStageIdx
                                  ? 'bg-green-600 text-white'
                                  : 'bg-slate-200 text-gray-600'
                              }`}
                            >
                              ✓
                            </div>
                            {idx < stages.length - 1 && (
                              <div
                                className={`flex-1 h-1 mx-1 ${
                                  idx < currentStageIdx ? 'bg-green-600' : 'bg-slate-200'
                                }`}
                              ></div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Current Stage Badge */}
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${
                        tracking.currentStage === 'Approved' ? 'bg-green-50 text-green-700 border-green-200' :
                        tracking.currentStage === 'Under Review' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                        tracking.currentStage === 'Enrolled' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                        tracking.currentStage === 'Fee Payment' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                        'bg-red-50 text-red-700 border-red-200'
                      }`}>
                        {tracking.currentStage}
                      </span>
                      <span className="text-gray-400">
                        <material-icon>{isExpanded ? 'expand_less' : 'expand_more'}</material-icon>
                      </span>
                    </div>
                  </div>
                </button>

                {/* Expanded View - Timeline */}
                {isExpanded && (
                  <div className="border-t border-slate-200 p-6 bg-slate-50">
                    <h4 className="font-semibold text-gray-900 mb-4">Workflow Timeline</h4>
                    <div className="relative pl-8">
                      {tracking.timeline.map((event, idx) => {
                        const isLast = idx === tracking.timeline.length - 1
                        return (
                          <div key={idx} className="mb-6 last:mb-0">
                            {/* Timeline dot */}
                            <div className={`absolute -left-5 top-1 w-4 h-4 rounded-full border-2 ${
                              event.status === 'completed' ? 'bg-green-600 border-green-600' :
                              event.status === 'in-progress' ? 'bg-blue-600 border-blue-600' :
                              event.status === 'rejected' ? 'bg-red-600 border-red-600' :
                              'bg-gray-300 border-gray-300'
                            }`}></div>

                            {/* Timeline line */}
                            {!isLast && (
                              <div className={`absolute -left-3 top-4 w-0.5 h-12 ${
                                event.status === 'completed' ? 'bg-green-600' : 'bg-gray-300'
                              }`}></div>
                            )}

                            {/* Event content */}
                            <div className={`p-3 rounded-lg ${statusColors[event.status]}`}>
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="font-medium">{event.stage}</p>
                                  <p className="text-sm opacity-75">{event.notes || 'No notes'}</p>
                                </div>
                                <div className="text-right text-sm font-medium">
                                  {event.date ? new Date(event.date).toLocaleDateString('en-IN') : 'Not yet'}
                                </div>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-6 pt-6 border-t border-slate-200 flex gap-3">
                      {tracking.currentStage === 'Under Review' && (
                        <>
                          <button 
                            onClick={() => handleApprove(tracking.applicationId)}
                            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition"
                          >
                            Approve
                          </button>
                          <button 
                            onClick={() => handleReject(tracking.applicationId)}
                            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition"
                          >
                            Reject
                          </button>
                        </>
                      )}
                      {tracking.currentStage === 'Approved' && (
                        <button 
                          onClick={() => handleMoveToEnrollment(tracking.applicationId)}
                          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
                        >
                          Move to Enrollment
                        </button>
                      )}
                      {tracking.currentStage === 'Enrollment' && (
                        <button 
                          onClick={() => handleGenerateFeeInvoice(tracking.applicationId)}
                          className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 transition"
                        >
                          Generate Fee Invoice
                        </button>
                      )}
                      <button className="px-4 py-2 bg-slate-200 text-gray-700 rounded-lg font-medium hover:bg-slate-300 transition">
                        View Details
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}

          {filteredTracking.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <p>No applications found matching your criteria</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
