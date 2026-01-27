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
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className={`ui-modal-overlay ${overlayClassName}`}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={`fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[9999] w-full max-w-lg ${shellClassName}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-white rounded-4xl max-h-[85vh] flex flex-col shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-gray-100/50">
              <div className="px-8 py-6 flex items-center justify-between shrink-0">
                <div className="ui-modal-title flex-1">{title}</div>
                <button
                  onClick={onClose}
                  className="p-2.5 hover:bg-gray-50 rounded-2xl transition-all text-gray-400 hover:text-gray-900 group duration-500"
                >
                  <IoClose className="w-6 h-6 group-hover:rotate-90 transition-transform duration-500" />
                </button>
              </div>
              <div className="px-8 pb-8 flex-1 overflow-y-auto custom-scrollbar">{children}</div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  )
}

