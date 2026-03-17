import { useState } from 'react'
import AcademicSidebar from './AcademicSidebar'
import TopBar from './TopBar'

export default function Layout({ children, title }) {
  const [isSidebarVisible, setIsSidebarVisible] = useState(true)

  function toggleSidebar() {
    setIsSidebarVisible((prev) => !prev)
  }

  return (
    <div className="flex min-h-screen bg-[#f8fafc] text-[#1e293b]">
      <AcademicSidebar isSidebarVisible={isSidebarVisible} onToggleSidebar={toggleSidebar} />

      <main className={`flex-1 flex flex-col transition-all duration-300 ${isSidebarVisible ? 'ml-64' : 'ml-0'}`}>
        <TopBar title={title} />
        <div className="flex-1 p-8">
          {children}
        </div>
      </main>
    </div>
  )
}
