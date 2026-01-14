import { motion, AnimatePresence } from 'framer-motion'
import { IoClose } from 'react-icons/io5'

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  overlayClassName = '',
  shellClassName = '',
}) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className={`ui-modal-overlay ${overlayClassName}`}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', duration: 0.3 }}
            className={`ui-modal-shell ${shellClassName}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="ui-modal">
              <div className="ui-modal-header">
                <h2 className="ui-modal-title">{title}</h2>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-500 hover:text-slate-900"
                >
                  <IoClose className="w-5 h-5" />
                </button>
              </div>
              <div className="ui-modal-body">{children}</div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

