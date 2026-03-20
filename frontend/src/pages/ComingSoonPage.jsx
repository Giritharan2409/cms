import { useLocation } from 'react-router-dom'
import Layout from '../components/Layout'

const TITLE_BY_PATH = {
  '/faculty': 'Faculty',
  '/department': 'Department',
  '/my-courses': 'My Courses',
  '/reports': 'Reports',
}

export default function ComingSoonPage() {
  const location = useLocation()
  const title = TITLE_BY_PATH[location.pathname] || 'Page'

  return (
    <Layout title={title}>
      <div className="bg-white rounded-xl border border-slate-200 p-10 shadow-sm text-center">
        <p className="text-lg font-semibold text-slate-800">{title}</p>
        <p className="text-slate-500 text-sm mt-2">This module is available in navigation and will be expanded with full functionality soon.</p>
      </div>
    </Layout>
  )
}
