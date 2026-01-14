import { motion } from 'framer-motion'
import { IoArrowUpOutline } from 'react-icons/io5'

export default function StatsCards({ cards = [] }) {
  // Color mapping to ensure Tailwind classes are purged correctly
  const colorMap = {
    indigo: { bg: 'bg-indigo-50', icon: 'text-indigo-600', ring: 'ring-indigo-100', glow: 'shadow-indigo-100' },
    amber: { bg: 'bg-amber-50', icon: 'text-amber-600', ring: 'ring-amber-100', glow: 'shadow-amber-100' },
    cyan: { bg: 'bg-cyan-50', icon: 'text-cyan-600', ring: 'ring-cyan-100', glow: 'shadow-cyan-100' },
    emerald: { bg: 'bg-emerald-50', icon: 'text-emerald-600', ring: 'ring-emerald-100', glow: 'shadow-emerald-100' },
    green: { bg: 'bg-emerald-50', icon: 'text-emerald-600', ring: 'ring-emerald-100', glow: 'shadow-emerald-100' },
    rose: { bg: 'bg-rose-50', icon: 'text-rose-600', ring: 'ring-rose-100', glow: 'shadow-rose-100' },
  }

  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 mt-10">
      {cards.map((card, index) => {
        const Icon = card.icon
        const style = colorMap[card.color] || colorMap.indigo
        
        // Better icon detection: check if Icon is a valid React component
        const hasIcon = Icon && (
          typeof Icon === 'function' || 
          (typeof Icon === 'object' && Icon.$$typeof === Symbol.for('react.element'))
        )

        return (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, ease: "easeOut" }}
            whileHover={{ y: -5 }}
            className="group relative bg-white rounded-3xl p-6 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.08)] hover:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.12)] border border-slate-100 transition-all duration-300"
          >
            {/* Soft background glow on hover */}
            <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-2xl rounded-3xl -z-10 ${style.bg}`} />

            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between mb-5">
                {/* Icon Wrapper - Always render, but conditionally show icon */}
                <div className={`p-3 rounded-2xl ${style.bg} ${style.ring} ring-1 transition-transform duration-500 group-hover:scale-110`}>
                  {hasIcon ? (
                    <Icon className={`w-6 h-6 ${style.icon}`} />
                  ) : (
                    <div className={`w-6 h-6 rounded-full ${style.bg} ${style.ring} ring-1`} />
                  )}
                </div>
                
                {/* Optional Trend Badge */}
                {card.trend && (
                  <span className="flex items-center gap-1 text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full uppercase tracking-wider">
                    <IoArrowUpOutline /> 12%
                  </span>
                )}
              </div>

              <div className="space-y-1">
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.15em]">
                  {card.label}
                </p>
                <h3 className="text-4xl font-black text-slate-900 tracking-tighter">
                  {card.value}
                </h3>
              </div>

              {/* Refined Hint Section */}
              <div className="mt-4 pt-4 border-t border-slate-50">
                <p className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
                   <span className={`w-1.5 h-1.5 rounded-full ${style.icon} bg-current opacity-40`} />
                   {typeof card.hint === 'string' ? card.hint : card.hint}
                </p>
              </div>
            </div>
          </motion.div>
        )
      })}
    </section>
  )
}