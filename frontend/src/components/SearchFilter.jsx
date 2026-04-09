export default function SearchFilter({ searchQuery, onSearchChange, onAddClick }) {
  return (
    <div className="flex flex-col lg:flex-row items-center gap-4 mb-8">
      <div className="relative flex-1 group w-full lg:w-auto">
        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[green-600] text-[20px] transition-colors">search</span>
        <input
          type="text"
          placeholder="Search students by name, ID, or department..."
          className="w-full bg-white border border-slate-200 rounded-lg pl-11 pr-5 py-2.5 text-sm focus:ring-2 focus:ring-[green-600]/20 focus:border-[green-600] outline-none transition-all placeholder:text-slate-400 shadow-sm"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      <div className="flex items-center gap-3 w-full lg:w-auto">
        <button className="flex items-center justify-center gap-2 h-10 px-4 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm">
          <span className="material-symbols-outlined text-lg">filter_list</span>
          <span className="hidden sm:inline">Filter</span>
        </button>
        <button className="flex items-center justify-center gap-2 h-10 px-4 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm">
          <span className="material-symbols-outlined text-lg">ios_share</span>
          <span className="hidden sm:inline">Export</span>
        </button>
      </div>
    </div>
  )
}
