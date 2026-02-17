import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { IoChevronDown, IoSearchOutline, IoClose, IoCheckmarkCircle } from "react-icons/io5";

const SearchableSelect = ({
    label,
    options, // Array of { label, value, ... }
    value, // Current value
    onChange,
    icon: Icon,
    placeholder = "Select an option...",
    className = "",
    showLabel = true,
    error = "",
    disabled = false
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });
    const containerRef = useRef(null);
    const triggerRef = useRef(null);

    // Close when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target) &&
                !event.target.closest('.portal-dropdown')) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Update coordinates when opening or scrolling
    const updateCoords = () => {
        if (triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            setCoords({
                top: rect.bottom + window.scrollY,
                left: rect.left + window.scrollX,
                width: rect.width
            });
        }
    };

    useEffect(() => {
        if (isOpen) {
            updateCoords();
        }
    }, [isOpen]);

    // Update position on scroll/resize instead of closing
    useEffect(() => {
        if (isOpen) {
            window.addEventListener("resize", updateCoords);
            window.addEventListener("scroll", updateCoords, true);
            return () => {
                window.removeEventListener("resize", updateCoords);
                window.removeEventListener("scroll", updateCoords, true);
            };
        }
    }, [isOpen]);

    const selectedOption = options.find((opt) => String(opt.value) === String(value));

    const filtered = options.filter((opt) =>
        (opt.label || "").toLowerCase().includes(search.toLowerCase())
    );

    const dropdownMenu = (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ type: "spring", damping: 30, stiffness: 400 }}
                    style={{
                        position: "absolute",
                        top: coords.top + 8,
                        left: coords.left,
                        width: coords.width,
                        zIndex: 10000,
                    }}
                    className="portal-dropdown border border-white/10 rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] bg-zinc-900 border-white/10 ring-1 ring-white/10"
                >
                    <div className="p-3 border-b border-white/5 space-y-2 bg-zinc-950/50">
                        <div className="relative">
                            <IoSearchOutline
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
                                size={14}
                            />
                            <input
                                className="w-full pl-9 pr-3 py-2 bg-black/40 rounded-xl text-xs outline-none focus:ring-2 focus:ring-amber-500/20 transition-all font-medium text-white placeholder-gray-600 border border-white/5 focus:border-amber-500/50"
                                placeholder={`Search...`}
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                autoFocus
                            />
                        </div>
                    </div>
                    <div className="max-h-60 overflow-y-auto custom-scrollbar p-1.5 bg-zinc-900">
                        {filtered.map((opt) => (
                            <button
                                key={opt.value}
                                type="button"
                                onClick={() => {
                                    onChange(opt.value, opt);
                                    setIsOpen(false);
                                    setSearch("");
                                }}
                                className={`w-full px-4 py-3 text-left text-[11px] rounded-xl transition-all flex items-center justify-between group ${String(value) === String(opt.value)
                                    ? "bg-amber-500/10 text-amber-500 font-black"
                                    : "text-gray-400 hover:bg-white/10 hover:text-white"
                                    }`}
                            >
                                <div className="flex flex-col">
                                    <span className="truncate">{opt.label}</span>
                                    {opt.subLabel && <span className="text-[10px] opacity-50 font-medium">{opt.subLabel}</span>}
                                </div>
                                {String(value) === String(opt.value) && (
                                    <IoCheckmarkCircle className="shrink-0 text-amber-500" size={16} />
                                )}
                            </button>
                        ))}
                        {filtered.length === 0 && (
                            <div className="py-6 text-center text-gray-500 text-[10px] font-bold italic uppercase tracking-widest">
                                No matching results
                            </div>
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );

    return (
        <div
            className={`searchable-select-container flex-1 transition-all ${showLabel ? 'space-y-1.5' : ''} ${className} ${disabled ? 'opacity-50 pointer-events-none' : ''}`}
            ref={containerRef}
        >
            {showLabel && (
                <label className="text-[9px] font-black text-gray-500 flex items-center gap-1.5 uppercase tracking-widest px-1">
                    {Icon && <Icon className="text-amber-500" size={12} />}
                    {label}
                </label>
            )}

            <div className="relative">
                <button
                    ref={triggerRef}
                    type="button"
                    disabled={disabled}
                    onClick={() => setIsOpen(!isOpen)}
                    className={`w-full flex items-center justify-between px-4 py-2.5 border rounded-xl text-xs font-bold transition-all bg-zinc-900 ${isOpen
                        ? "border-amber-500 ring-4 ring-amber-500/10"
                        : error
                            ? "border-red-500/50 text-white shadow-sm"
                            : "border-white/5 text-white shadow-sm hover:border-white/10"
                        }`}
                >
                    <span className={`truncate ${selectedOption ? "text-white" : "text-gray-500"}`}>
                        {selectedOption ? selectedOption.label : placeholder}
                    </span>
                    <IoChevronDown
                        className={`text-amber-500 shrink-0 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
                        size={14}
                    />
                </button>

                {createPortal(dropdownMenu, document.body)}
            </div>
            {error && <p className="text-[10px] text-red-500 font-bold px-1 mt-1">{error}</p>}
        </div>
    );
};

export default SearchableSelect;

