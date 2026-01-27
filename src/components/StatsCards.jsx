import { motion } from 'framer-motion'
import { IoArrowUpOutline, IoArrowDownOutline, IoTrendingUpOutline } from 'react-icons/io5'

export default function StatsCards({ cards = [] }) {
  const colorMap = {
    blue: { 
      bg: 'bg-blue-50', 
      icon: 'text-blue-600', 
      ring: 'ring-blue-100', 
      blob: 'bg-blue-100/40',
      dot: 'bg-blue-500'
    },
    indigo: { 
      bg: 'bg-indigo-50', 
      icon: 'text-indigo-600', 
      ring: 'ring-indigo-100', 
      blob: 'bg-indigo-100/40',
      dot: 'bg-indigo-500'
    },
    violet: { 
      bg: 'bg-violet-50', 
      icon: 'text-violet-600', 
      ring: 'ring-violet-100', 
      blob: 'bg-violet-100/40',
      dot: 'bg-violet-500'
    },
    emerald: { 
      bg: 'bg-emerald-50', 
      icon: 'text-emerald-600', 
      ring: 'ring-emerald-100', 
      blob: 'bg-emerald-100/40',
      dot: 'bg-emerald-500'
    },
    rose: { 
      bg: 'bg-rose-50', 
      icon: 'text-rose-600', 
      ring: 'ring-rose-100', 
      blob: 'bg-rose-100/40',
      dot: 'bg-rose-500'
    },
    amber: { 
      bg: 'bg-amber-50', 
      icon: 'text-amber-600', 
      ring: 'ring-amber-100', 
      blob: 'bg-amber-100/40',
      dot: 'bg-amber-500'
    },
  }

  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 my-8 px-1">
      {cards.map((card, index) => {
        const Icon = card.icon
        const style = colorMap[card.color] || colorMap.blue
        
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
            whileHover={{ y: -8, transition: { duration: 0.2 } }}
            className="group relative ui-card overflow-hidden transition-all duration-300 border-gray-100/80 bg-white hover:shadow-2xl hover:shadow-blue-500/10"
          >
            {/* Soft Ambient Background */}
            <div className={`absolute -right-8 -top-8 w-32 h-32 rounded-full opacity-40 blur-3xl ${style.blob}`} />
            
            <div className="relative z-10 p-7 flex flex-col h-full">
              <div className="flex items-center justify-between mb-6">
                <div className={`p-4 rounded-[1.25rem] ${style.bg} ${style.ring} ring-1 transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 shadow-sm`}>
                  {hasIcon ? (
                    <Icon className={`w-7 h-7 ${style.icon}`} />
                  ) : (
                    <div className={`w-7 h-7 rounded-full ${style.bg}`} />
                  )}
                </div>
                
                {card.trend && (
                  <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider border transition-all ${
                    card.trendType === 'down' 
                      ? 'bg-rose-50 text-rose-600 border-rose-100' 
                      : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                  }`}>
                    {card.trendType === 'down' ? <IoArrowDownOutline /> : <IoArrowUpOutline />}
                    {card.trend}
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <p className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] leading-none mb-1">
                  {card.label}
                </p>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-3xl font-black text-gray-900 tracking-tighter leading-none">
                    {card.value}
                  </h3>
                  {card.unit && <span className="text-xs font-bold text-gray-400">{card.unit}</span>}
                </div>
              </div>

              {card.hint && (
                <div className="mt-6 pt-6 border-t border-gray-50/80">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-1.5 h-1.5 rounded-full ${style.dot} shadow-sm animate-pulse`} />
                    <span className="text-xs font-bold text-gray-500 italic truncate">
                      {card.hint}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )
      })}
    </section>
  )
}
