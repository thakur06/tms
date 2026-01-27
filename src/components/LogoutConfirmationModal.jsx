import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IoLogOutOutline } from 'react-icons/io5';
import ReactDOM from 'react-dom';

export default function LogoutConfirmationModal({ isOpen, onClose, onConfirm }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!mounted) return null;

  return ReactDOM.createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="ui-modal-overlay z-[9998] bg-black/40 backdrop-blur-sm"
          />
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ type: "spring", duration: 0.3 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[9999] w-full max-w-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="ui-card p-8 border border-gray-100 shadow-2xl bg-white">
              <div className="text-center">
                <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-5 border border-red-100 shadow-sm">
                  <IoLogOutOutline size={32} />
                </div>
                
                <h3 className="text-xl font-black text-gray-900 mb-2">Confirm Logout</h3>
                <p className="text-sm text-gray-600 mb-8 leading-relaxed font-bold">
                  Are you sure you want to end your session?
                </p>
                
                <div className="flex gap-4">
                  <button
                    onClick={onClose}
                    className="flex-1 py-3 text-xs font-black text-gray-400 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-all uppercase tracking-wider"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={onConfirm}
                    className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-black shadow-lg shadow-red-500/20 transition-all flex items-center justify-center gap-2 active:scale-95 uppercase tracking-wider text-xs"
                  >
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}
