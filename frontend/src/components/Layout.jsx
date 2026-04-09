import { useState } from 'react'
import AcademicSidebar from './AcademicSidebar'
import TopBar from './TopBar'

export default function Layout({ children, title }) {
  const [isSidebarVisible, setIsSidebarVisible] = useState(true)

  function toggleSidebar() {
    setIsSidebarVisible((prev) => !prev)
  }

  return (
    <div className="flex min-h-screen bg-white text-[#1e293b]">
      <AcademicSidebar isSidebarVisible={isSidebarVisible} onToggleSidebar={toggleSidebar} />

      {!isSidebarVisible && (
        <button
          onClick={toggleSidebar}
          className="fixed top-4 left-6 z-[60] p-3 rounded-xl shadow-lg bg-[#0d6947] border border-green-600 hover:shadow-xl hover:scale-105 transition-all duration-300 flex items-center justify-center"
          title="Show sidebar"
        >
          <span className="material-symbols-outlined text-[28px] text-white font-semibold">menu</span>
        </button>
      )}

      <main className={`flex-1 flex flex-col transition-all duration-300 ${isSidebarVisible ? 'ml-64' : 'ml-0'}`}>
        <TopBar title={title} isSidebarVisible={isSidebarVisible} />
        <div className="flex-1 p-8 bg-white">
          {children}
        </div>
      </main>
    </div>
  )
}
