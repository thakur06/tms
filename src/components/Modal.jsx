import { motion, AnimatePresence } from 'framer-motion'
import { IoClose } from 'react-icons/io5'
import { createPortal } from 'react-dom'
import { useEffect, useState } from 'react'

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  overlayClassName = '',
  shellClassName = '',
}) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      setMounted(false)
      document.body.style.overflow = 'unset';
    }
  }, [isOpen])

  if (!mounted) return null

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className={`ui-modal-overlay z-[9998] ${overlayClassName}`}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', duration: 0.3 }}
            className={`fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[9999] w-full max-w-lg ${shellClassName}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="ui-modal max-h-[85vh] flex flex-col shadow-2xl shadow-black/50">
              <div className="ui-modal-header shrink-0">
                <h2 className="ui-modal-title">{title}</h2>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/10 rounded-xl transition-colors text-slate-400 hover:text-white"
                >
                  <IoClose className="w-5 h-5" />
                </button>
              </div>
              <div className="ui-modal-body flex-1 overflow-y-auto custom-scrollbar">{children}</div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  )
}

