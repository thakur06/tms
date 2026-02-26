import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IoAlertCircleOutline, IoTrashOutline } from 'react-icons/io5';
import ReactDOM from 'react-dom';

export default function ConfirmModal({ isOpen, onClose, onConfirm, title, message, confirmText = "Confirm", type = "danger" }) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    if (!mounted) return null;

    const isDanger = type === "danger";

    return ReactDOM.createPortal(
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 z-9998 bg-black/60 backdrop-blur-md"
                    />
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 20 }}
                        transition={{ type: "spring", duration: 0.3 }}
                        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-9999 w-full max-w-md px-4"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="bg-(--app-bg) rounded-3xl p-8 border border-(--glass-border) shadow-2xl relative overflow-hidden">
                            {/* Decorative background element */}
                            <div className={`absolute top-0 right-0 w-32 h-32 ${isDanger ? 'bg-red-500/5' : 'bg-amber-500/5'} rounded-full -mr-16 -mt-16 opacity-50`} />

                            <div className="text-center relative z-10">
                                <div className={`w-16 h-16 ${isDanger ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'} rounded-2xl flex items-center justify-center mx-auto mb-6 border shadow-sm rotate-3 transition-transform duration-300`}>
                                    {isDanger ? <IoTrashOutline size={32} /> : <IoAlertCircleOutline size={32} />}
                                </div>

                                <h3 className="text-xl font-black text-(--text-main) mb-3 tracking-tight">{title}</h3>
                                <p className="text-sm text-(--text-muted) mb-8 leading-relaxed font-medium">
                                    {message}
                                </p>

                                <div className="flex gap-3">
                                    <button
                                        onClick={onClose}
                                        className="flex-1 py-3.5 text-[11px] font-black text-(--text-muted) hover:text-(--text-main) hover:bg-(--hover-bg) rounded-2xl transition-all uppercase tracking-widest border border-transparent hover:border-(--glass-border)"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={() => {
                                            onConfirm();
                                            onClose();
                                        }}
                                        className={`flex-1 py-3.5 ${isDanger ? 'bg-red-600 hover:bg-red-700 shadow-red-500/20' : 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20'} text-zinc-900 rounded-2xl font-black shadow-lg transition-all flex items-center justify-center gap-2 active:scale-95 uppercase tracking-widest text-[11px]`}
                                    >
                                        {isDanger && <IoTrashOutline size={16} />}
                                        <span>{confirmText}</span>
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
