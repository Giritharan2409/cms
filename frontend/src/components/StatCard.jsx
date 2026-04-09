const colorMap = {
  blue: { bg: 'bg-green-50', text: 'text-green-600', iconBg: 'bg-green-100' },
  green: { bg: 'bg-green-50', text: 'text-green-600', iconBg: 'bg-green-100' },
  purple: { bg: 'bg-purple-50', text: 'text-purple-600', iconBg: 'bg-purple-100' },
  orange: { bg: 'bg-orange-50', text: 'text-orange-600', iconBg: 'bg-orange-100' },
  red: { bg: 'bg-red-50', text: 'text-red-600', iconBg: 'bg-red-100' },
}

export default function StatCard({ icon, label, value, trend, color = 'blue' }) {
  const theme = colorMap[color] || colorMap.blue

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow duration-300">
      <div className={`p-3 rounded-lg ${theme.iconBg} flex items-center justify-center ${theme.text}`}>
        <span className="material-symbols-outlined text-2xl">{icon}</span>
      </div>
      <div className="flex-1">
        <div className="mb-2">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</p>
        </div>
        <div className="flex items-baseline gap-2">
          <h3 className="text-3xl font-bold text-slate-900">{value}</h3>
          {trend && (
            <span className="text-sm font-semibold text-slate-400">
              {trend}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
