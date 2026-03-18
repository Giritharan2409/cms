
import AcademicSidebar from './AcademicSidebar'
import TopBar from './TopBar'
import { useState } from 'react'

export default function Layout({ children, title }) {
  const [sidebarVisible, setSidebarVisible] = useState(true)

  const handleToggleSidebar = () => setSidebarVisible((v) => !v)

  return (
    <div className="flex min-h-screen bg-[#f8fafc] text-[#1e293b]">
      {sidebarVisible && (
        <AcademicSidebar onToggleSidebar={handleToggleSidebar} />
      )}
      <main className={sidebarVisible ? "ml-64 flex-1 flex flex-col" : "flex-1 flex flex-col"}>
        <TopBar title={title} />
        <div className="flex-1 p-8">
          {children}
        </div>
      </main>
    </div>
  )
}
