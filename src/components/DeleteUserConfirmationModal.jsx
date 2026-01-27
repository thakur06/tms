import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IoTrashOutline, IoWarningOutline } from 'react-icons/io5';
import ReactDOM from 'react-dom';

export default function DeleteUserConfirmationModal({ isOpen, onClose, onConfirm, userName }) {
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
            className="fixed inset-0 z-[9998] bg-black/40 backdrop-blur-sm"
          />
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ type: "spring", duration: 0.3 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[9999] w-full max-w-sm px-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-2xl relative overflow-hidden">
               {/* Decorative background element */}
               <div className="absolute top-0 right-0 w-32 h-32 bg-red-50 rounded-full -mr-16 -mt-16 opacity-50" />
               
              <div className="text-center relative z-10">
                <div className="w-16 h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-red-100 shadow-sm rotate-3 group-hover:rotate-0 transition-transform duration-300">
                  <IoTrashOutline size={32} />
                </div>
                
                <h3 className="text-xl font-black text-gray-900 mb-3 tracking-tight">Confirm Deletion</h3>
                <p className="text-sm text-gray-500 mb-8 leading-relaxed font-medium">
                  Are you sure you want to delete <span className="text-gray-900 font-bold">"{userName}"</span>? This action is permanent and cannot be undone.
                </p>
                
                <div className="flex gap-3">
                  <button
                    onClick={onClose}
                    className="flex-1 py-3.5 text-[11px] font-black text-gray-500 hover:text-gray-900 hover:bg-gray-50 rounded-2xl transition-all uppercase tracking-widest border border-transparent hover:border-gray-100"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      onConfirm();
                      onClose();
                    }}
                    className="flex-1 py-3.5 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-black shadow-lg shadow-red-500/20 transition-all flex items-center justify-center gap-2 active:scale-95 uppercase tracking-widest text-[11px]"
                  >
                    <IoTrashOutline size={16} />
                    <span>Delete User</span>
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
