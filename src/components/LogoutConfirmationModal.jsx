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
            className="ui-modal-overlay z-[9998] bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ type: "spring", duration: 0.3 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[9999] w-full max-w-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="ui-card p-6 border border-white/10 shadow-2xl bg-[#0b1221] ring-1 ring-white/10">
              <div className="text-center">
                <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-5 border border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.2)]">
                  <IoLogOutOutline size={32} />
                </div>
                
                <h3 className="text-xl font-bold text-white mb-2">Confirm Logout</h3>
                <p className="text-sm text-slate-400 mb-8 leading-relaxed">
                  Are you sure you want to end your session?
                </p>
                
                <div className="flex gap-3">
                  <button
                    onClick={onClose}
                    className="flex-1 py-3 text-sm font-bold text-slate-300 hover:text-white hover:bg-white/5 rounded-xl transition-colors border border-transparent hover:border-white/10"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={onConfirm}
                    className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold shadow-lg shadow-red-900/20 transition-all flex items-center justify-center gap-2 active:scale-95"
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
