import { motion } from 'framer-motion'
import { IoFolder, IoFlash, IoCheckmarkCircle, IoWarning, IoCloseCircle } from 'react-icons/io5'

export default function ProjectsList({ projects }) {
  const getHealthIcon = (health) => {
    switch (health) {
      case 'on-track':
        return <IoCheckmarkCircle className="w-4 h-4 text-green-600" />
      case 'at-risk':
        return <IoWarning className="w-4 h-4 text-amber-600" />
      case 'off-track':
        return <IoCloseCircle className="w-4 h-4 text-red-600" />
      default:
        return null
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-5 shadow-sm">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-3 mb-3">
        <div>
          <p className="text-xs text-gray-500 mb-0.5">Projects</p>
          <h3 className="text-lg font-semibold text-gray-900">Portfolio health</h3>
        </div>
        <button className="px-3.5 py-2 border border-gray-300 bg-white text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-all flex items-center gap-2">
          <IoFlash className="w-4 h-4" />
          Automation
        </button>
      </div>
      <div className="flex flex-col gap-3">
        {projects.map((project, index) => (
          <motion.div
            key={project.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            whileHover={{ scale: 1.01 }}
            className="flex flex-col sm:flex-row justify-between gap-3 items-start p-3 bg-gray-50 border border-gray-100 rounded-xl hover:shadow-md transition-all"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <IoFolder className="w-5 h-5 text-indigo-500 flex-shrink-0" />
                <p className="font-semibold text-gray-900">{project.name}</p>
              </div>
              <p className="text-sm text-gray-600 mb-2">
                Owner {project.owner} · Due {project.due}
              </p>
              <div className="flex gap-1.5 flex-wrap">
                {project.automation.map((rule) => (
                  <span key={rule} className="bg-gray-100 border border-gray-200 text-gray-700 px-2 py-1 rounded-full text-xs">
                    {rule}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-2.5 w-full sm:w-auto">
              <div className="w-full sm:w-28 h-2 bg-gray-200 rounded-full overflow-hidden">
                <motion.span
                  initial={{ width: 0 }}
                  animate={{ width: `${project.progress}%` }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="block h-full bg-gradient-to-r from-indigo-500 to-cyan-400"
                />
              </div>
              <div className="flex items-center gap-1">
                {getHealthIcon(project.health)}
                <p
                  className={`text-sm font-semibold capitalize ${
                    project.health === 'on-track'
                      ? 'text-green-600'
                      : project.health === 'at-risk'
                      ? 'text-amber-600'
                      : 'text-red-600'
                  }`}
                >
                  {project.health}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

