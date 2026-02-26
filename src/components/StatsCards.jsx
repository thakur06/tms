import { motion } from 'framer-motion'
import { IoArrowUpOutline, IoArrowDownOutline, IoTrendingUpOutline } from 'react-icons/io5'

export default function StatsCards({ cards = [] }) {
  const colorMap = {
    blue: {
      bg: 'bg-blue-500/10',
      icon: 'text-blue-500',
      ring: 'ring-blue-500/20',
      blob: 'bg-blue-500/40',
      dot: 'bg-blue-500'
    },
    indigo: {
      bg: 'bg-indigo-500/10',
      icon: 'text-indigo-500',
      ring: 'ring-indigo-500/20',
      blob: 'bg-indigo-500/40',
      dot: 'bg-indigo-500'
    },
    violet: {
      bg: 'bg-violet-500/10',
      icon: 'text-violet-500',
      ring: 'ring-violet-500/20',
      blob: 'bg-violet-500/40',
      dot: 'bg-violet-500'
    },
    emerald: {
      bg: 'bg-emerald-500/10',
      icon: 'text-emerald-500',
      ring: 'ring-emerald-500/20',
      blob: 'bg-emerald-500/40',
      dot: 'bg-emerald-500'
    },
    rose: {
      bg: 'bg-rose-500/10',
      icon: 'text-rose-600',
      ring: 'ring-rose-500/20',
      blob: 'bg-rose-500/40',
      dot: 'bg-rose-500'
    },
    amber: {
      bg: 'bg-amber-500/10',
      icon: 'text-amber-500',
      ring: 'ring-amber-500/20',
      blob: 'bg-amber-500/40',
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
            className="group relative ui-card overflow-hidden transition-all duration-300 border-(--glass-border) bg-(--glass-surface) hover:shadow-2xl hover:shadow-amber-500/10"
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
                  <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider border transition-all ${card.trendType === 'down'
                    ? 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                    : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                    }`}>
                    {card.trendType === 'down' ? <IoArrowDownOutline /> : <IoArrowUpOutline />}
                    {card.trend}
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <p className="text-[11px] font-black text-(--text-muted) uppercase tracking-[0.2em] leading-none mb-1">
                  {card.label}
                </p>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-3xl font-black text-(--text-main) tracking-tighter leading-none">
                    {card.value}
                  </h3>
                  {card.unit && <span className="text-xs font-bold text-(--text-muted)">{card.unit}</span>}
                </div>
              </div>

              {card.hint && (
                <div className="mt-6 pt-6 border-t border-(--glass-border)">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-1.5 h-1.5 rounded-full ${style.dot} shadow-sm animate-pulse`} />
                    <span className="text-xs font-bold text-(--text-muted) italic truncate">
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
