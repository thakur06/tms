import { motion } from 'framer-motion'
import { IoCheckmarkCircle, IoDocumentText, IoCalendar, IoTime } from 'react-icons/io5'

export default function StatsCards({ stats }) {
  const cards = [
    { icon: IoCheckmarkCircle, label: 'Open tasks', value: stats.open, hint: '+4 vs last week', color: 'indigo' },
    { icon: IoDocumentText, label: 'Approvals pending', value: stats.approvals, hint: 'Includes design & legal', color: 'amber' },
    { icon: IoCalendar, label: 'Calendar items', value: stats.today, hint: 'Week of Mar 3', color: 'cyan' },
    { icon: IoTime, label: 'Utilization', value: `${stats.utilization}%`, hint: `Logged ${stats.logged} this week`, color: 'green' },
  ]

  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
      {cards.map((card, index) => {
        const Icon = card.icon
        return (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.02 }}
            className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-gray-500">{card.label}</p>
              <Icon className={`w-5 h-5 text-${card.color}-500`} />
            </div>
            <p className="text-3xl font-bold text-gray-900 my-1">{card.value}</p>
            <p className="text-xs text-gray-500">{card.hint}</p>
          </motion.div>
        )
      })}
    </section>
  )
}

