import { motion } from 'framer-motion'
import { IoArrowUpOutline } from 'react-icons/io5'

export default function StatsCards({ cards = [] }) {
  // Color mapping with explicit light/dark classes
  const colorMap = {
    indigo: { 
      bg: 'bg-indigo-50 dark:bg-indigo-500/10', 
      icon: 'text-indigo-600 dark:text-indigo-400', 
      ring: 'ring-indigo-100 dark:ring-indigo-500/20', 
      blob: 'bg-indigo-100/50 dark:bg-indigo-500'
    },
    amber: { 
      bg: 'bg-amber-50 dark:bg-amber-500/10', 
      icon: 'text-amber-600 dark:text-amber-400', 
      ring: 'ring-amber-100 dark:ring-amber-500/20', 
      blob: 'bg-amber-100/50 dark:bg-amber-500' 
    },
    cyan: { 
      bg: 'bg-cyan-50 dark:bg-cyan-500/10', 
      icon: 'text-cyan-600 dark:text-cyan-400', 
      ring: 'ring-cyan-100 dark:ring-cyan-500/20', 
      blob: 'bg-cyan-100/50 dark:bg-cyan-500' 
    },
    emerald: { 
      bg: 'bg-emerald-50 dark:bg-emerald-500/10', 
      icon: 'text-emerald-600 dark:text-emerald-400', 
      ring: 'ring-emerald-100 dark:ring-emerald-500/20', 
      blob: 'bg-emerald-100/50 dark:bg-emerald-500' 
    },
    green: { 
      bg: 'bg-emerald-50 dark:bg-emerald-500/10', 
      icon: 'text-emerald-600 dark:text-emerald-400', 
      ring: 'ring-emerald-100 dark:ring-emerald-500/20', 
      blob: 'bg-emerald-100/50 dark:bg-emerald-500' 
    },
    rose: { 
      bg: 'bg-rose-50 dark:bg-rose-500/10', 
      icon: 'text-rose-600 dark:text-rose-400', 
      ring: 'ring-rose-100 dark:ring-rose-500/20', 
      blob: 'bg-rose-100/50 dark:bg-rose-500' 
    },
  }

  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 my-8 px-1">
      {cards.map((card, index) => {
        const Icon = card.icon
        const style = colorMap[card.color] || colorMap.indigo
        
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
            className="group relative ui-card overflow-hidden hover:shadow-lg dark:hover:shadow-indigo-500/10 transition-all duration-300 border-slate-200 dark:border-white/5 bg-white dark:bg-slate-900/50"
          >
            {/* Background Blob Gradient - cleaner in light mode */}
            <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-60 dark:opacity-20 blur-2xl ${style.blob}`} />

            <div className="relative flex flex-col h-full z-10 p-6">
              <div className="flex items-center justify-between mb-5">
                <div className={`p-3 rounded-xl backdrop-blur-md ${style.bg} ${style.ring} ring-1 transition-transform duration-500 group-hover:scale-110 shadow-sm`}>
                  {hasIcon ? (
                    <Icon className={`w-6 h-6 ${style.icon}`} />
                  ) : (
                    <div className={`w-6 h-6 rounded-full ${style.bg}`} />
                  )}
                </div>
                
                {card.trend && (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-500/10 px-2 py-1 rounded-full uppercase tracking-wider border border-emerald-200 dark:border-emerald-500/20">
                    <IoArrowUpOutline /> 12%
                  </span>
                )}
              </div>

              <div className="space-y-1">
                <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                  {card.label}
                </p>
                <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                  {card.value}
                </h3>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-100 dark:border-white/5">
                <div className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-2">
                   <div className={`w-1.5 h-1.5 rounded-full ${style.blob.split(' ')[0].replace('/50','')}`} />
                   {typeof card.hint === 'string' ? card.hint : card.hint}
                </div>
              </div>
            </div>
          </motion.div>
        )
      })}
    </section>
  )
}
