import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IoChevronDown, IoSearchOutline, IoClose, IoCheckmarkCircle } from "react-icons/io5";

const MultiSelect = ({
  label,
  options,
  selectedValues,
  onChange,
  icon: Icon,
  className = "",
  showLabel = true,
  maxSelectedDisplay = 0
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isOpen && !event.target.closest(".multiselect-container")) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const filtered = options.filter((opt) =>
    String(opt).toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className={`multiselect-container flex-1 min-w-[140px] max-w-[200px] ${showLabel ? 'space-y-1.5' : ''} ${className}`}>
      {showLabel && (
        <label className="text-[9px] font-black text-gray-500 flex items-center justify-between uppercase tracking-widest px-1">
          <div className="flex items-center gap-1.5">
            {Icon && <Icon className="text-(--primary)" size={12} />}
            {label}
          </div>
          {selectedValues.length > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onChange([]);
              }}
              className="text-(--primary) hover:text-(--secondary) transition-colors"
              title="Clear"
            >
              <IoClose size={12} />
            </button>
          )}
        </label>
      )}
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full flex items-center justify-between px-3 py-2 border rounded-xl text-[11px] font-bold transition-all bg-(--input-bg) border-(--input-border) ${isOpen
            ? "border-(--primary) ring-4 ring-(--primary-glow)"
            : "text-(--text-main) shadow-sm"
            }`}
        >
          <span
            className={`truncate ${selectedValues.length > 0 ? "text-(--text-main)" : "text-(--text-muted)"
              }`}
          >
            {selectedValues.length > 0
              ? `${selectedValues.length} Selected`
              : `All`}
          </span>
          <IoChevronDown
            className={`text-(--primary) shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`}
            size={12}
          />
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute top-full left-0 right-0 mt-2 border border-(--glass-border) rounded-xl overflow-hidden z-100 shadow-2xl bg-(--glass-surface)/98 backdrop-blur-xl"
            >
              <div className="p-2 border-b border-(--glass-border) space-y-2">
                <div className="relative">
                  <IoSearchOutline
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-(--text-muted)"
                    size={12}
                  />
                  <input
                    className="w-full pl-8 pr-3 py-1.5 bg-(--hover-bg) rounded-lg text-xs outline-none focus:ring-2 focus:ring-(--primary-glow) transition-all font-bold text-(--text-main) placeholder-gray-500 border border-transparent focus:border-(--primary-glow)"
                    placeholder={`Search ${label}...`}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    autoFocus
                  />
                </div>
                <div className="flex justify-between px-1">
                  <button
                    onClick={() => onChange(options)}
                    className="text-[10px] text-(--primary) hover:text-(--secondary) font-bold uppercase tracking-wider"
                  >
                    Select All
                  </button>
                  <button
                    onClick={() => onChange([])}
                    className="text-[10px] text-(--text-muted) hover:text-(--text-main) font-bold uppercase tracking-wider"
                  >
                    Clear
                  </button>
                </div>
              </div>
              <div className="max-h-48 overflow-y-auto custom-scrollbar p-1">
                {filtered.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => {
                      const newSelected = selectedValues.includes(opt)
                        ? selectedValues.filter((s) => s !== opt)
                        : [...selectedValues, opt];
                      onChange(newSelected);
                    }}
                    className={`w-full px-3 py-2 text-left text-[11px] rounded-lg transition-all flex items-center justify-between group ${selectedValues.includes(opt)
                      ? "bg-(--primary-glow) text-(--primary) font-black shadow-inner"
                      : "text-(--text-muted) hover:bg-(--hover-bg) hover:text-(--text-main)"
                      }`}
                  >
                    <span className="truncate">{opt}</span>
                    {selectedValues.includes(opt) && (
                      <IoCheckmarkCircle className="shrink-0" size={14} />
                    )}
                  </button>
                ))}
                {filtered.length === 0 && (
                  <div className="py-4 text-center text-(--text-muted) text-[10px] font-bold italic">
                    No results found
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default MultiSelect;
