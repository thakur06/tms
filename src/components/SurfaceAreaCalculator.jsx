import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    IoAddOutline, 
    IoTrashOutline, 
    IoDownloadOutline, 
    IoCalculatorOutline,
    IoInformationCircleOutline,
    IoSaveOutline,
    IoTimeOutline,
    IoSearchOutline,
    IoCloseOutline
} from 'react-icons/io5';
import { toast } from 'react-toastify';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

const Autocomplete = ({ value, onChange, options, placeholder, disabled, className }) => {
    const [suggestion, setSuggestion] = useState('');

    const filteredOptions = value 
        ? options.filter(opt => opt.toLowerCase().includes(value.toLowerCase()))
        : options;

    useEffect(() => {
        if (value && filteredOptions.length > 0) {
            const match = filteredOptions.find(opt => 
                opt.toLowerCase().startsWith(value.toLowerCase())
            );
            setSuggestion(match || '');
        } else {
            setSuggestion('');
        }
    }, [value, options]);

    const handleKeyDown = (e) => {
        if (e.key === 'Tab' && suggestion && suggestion.toLowerCase() !== value.toLowerCase()) {
            e.preventDefault();
            onChange(suggestion);
        }
    };

    return (
        <div className="relative w-full group/auto">
            {/* Ghost Text */}
            {suggestion && value && suggestion.toLowerCase().startsWith(value.toLowerCase()) && suggestion.toLowerCase() !== value.toLowerCase() && (
                <div className={`${className.replace(/text-[^ ]+/, '')} absolute left-0 top-0 p-1.5 pointer-events-none text-(--text-muted) opacity-50 whitespace-pre z-0`}>
                    <span className="invisible">{value}</span>
                    {suggestion.slice(value.length)}
                </div>
            )}
            
            <input
                type="text"
                value={value}
                onChange={(e) => {
                    onChange(e.target.value);
                }}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                disabled={disabled}
                className={`${className} relative z-10 w-full bg-transparent border border-(--glass-border) rounded-lg p-1.5 focus:border-(--primary) outline-none transition-all`}
            />
        </div>
    );
};

export default function SurfaceAreaCalculator() {
    const [rows, setRows] = useState([
        { id: Date.now(), items: '', class: '', spec: 'CS1', size1: '', qty: 1, surfaceArea: 0, remarks: '' }
    ]);
    const [specs, setSpecs] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [lastCalculated, setLastCalculated] = useState(null);
    
    // Persistence State
    const [history, setHistory] = useState([]);
    const [showHistory, setShowHistory] = useState(false);
    const [calculationId, setCalculationId] = useState(null);
    const [calculationName, setCalculationName] = useState('New Calculation');
    const [isSaving, setIsSaving] = useState(false);

    const server = import.meta.env.VITE_SERVER_ADDRESS;
    const token = localStorage.getItem('token');

    useEffect(() => {
        const fetchSpecs = async () => {
            try {
                const response = await fetch(`${server}/api/pipe-specifications`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (response.ok) {
                    const data = await response.json();
                    setSpecs(data);
                }
            } catch (error) {
                console.error("Error fetching specs:", error);
            } finally {
                setIsLoading(false);
            }
        };

        const fetchHistory = async () => {
            try {
                const response = await fetch(`${server}/api/surface-area-calculations`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (response.ok) {
                    const data = await response.json();
                    setHistory(data);
                }
            } catch (error) {
                console.error("Error fetching history:", error);
            }
        };

        fetchSpecs();
        fetchHistory();
    }, []);

    // Ensure surface area is recalculated when specs are loaded
    useEffect(() => {
        if (specs.length > 0) {
            setRows(prev => prev.map(row => ({
                ...row,
                surfaceArea: calculateRowSurfaceArea(row.items, row.class, row.size1, row.qty)
            })));
        }
    }, [specs]);

    const uniqueItems = useMemo(() => {
        return [...new Set(specs.map(s => s.items))].sort();
    }, [specs]);
    
    const getClassesForItem = (item) => {
        if (!item) return [];
        const normalizedItem = item.trim().toUpperCase();
        return [...new Set(specs.filter(s => s.items.toUpperCase() === normalizedItem).map(s => s.class_label))].sort();
    };

    const getSizesForItemAndClass = (item, cls) => {
        if (!item || !cls) return [];
        const normalizedItem = item.trim().toUpperCase();
        const normalizedCls = cls.trim().toUpperCase();
        return [...new Set(specs.filter(s => 
            s.items.toUpperCase() === normalizedItem && 
            s.class_label.toUpperCase() === normalizedCls
        ).map(s => s.size_label))].sort((a, b) => {
            const val = (s) => parseFloat(s.replace(/"/g, '')) || 0;
            return val(a) - val(b);
        });
    };

    const calculateRowSurfaceArea = (item, cls, size1, qty) => {
        if (!item || !size1 || !qty) return 0;
        
        const normalizedItem = item.trim().toUpperCase();
        const normalizedCls = String(cls).trim().toUpperCase();
        const normalizedSize = String(size1).trim();

        const spec = specs.find(s => 
            s.items.toUpperCase() === normalizedItem && 
            s.class_label.toUpperCase() === normalizedCls && 
            s.size_label === normalizedSize
        );
        if (!spec) return 0;

        const od = parseFloat(spec.pipe_flange_od);
        const length = parseFloat(spec.value_length);
        const quantity = parseFloat(qty);

        // Logic: AREA = PI * OD * LENGTH * QTY
        // For Pipe, 'value_length' in our DB is actually OD (as per seeder), 
        // but in the user's excel image, Pipe SA = PI * OD * QTY (where Qty is length in inches).
        // For fittings/valves, SA = PI * OD * Table_Length * User_Qty.
        
        if (item.trim().toUpperCase() === 'PIPE') {
            return Math.PI * od * quantity;
        } else {
            return Math.PI * od * length * quantity;
        }
    };

    const updateRow = (id, field, value) => {
        setRows(prev => prev.map(row => {
            if (row.id === id) {
                let updatedRow = { ...row, [field]: value };
                
                // Auto-normalize items to uppercase if exact match found
                if (field === 'items') {
                    const normalized = value.trim().toUpperCase();
                    const match = uniqueItems.find(u => u.toUpperCase() === normalized);
                    if (match) updatedRow.items = match;
                    
                    updatedRow.class = '';
                    updatedRow.size1 = '';
                } else if (field === 'class') {
                    const normalized = value.trim().toUpperCase();
                    const availableClasses = getClassesForItem(updatedRow.items);
                    const match = availableClasses.find(c => c.toUpperCase() === normalized);
                    if (match) updatedRow.class = match;
                    
                    updatedRow.size1 = '';
                }

                // Recalculate Surface Area
                updatedRow.surfaceArea = calculateRowSurfaceArea(
                    updatedRow.items, 
                    updatedRow.class, 
                    updatedRow.size1, 
                    updatedRow.qty
                );
                
                setLastCalculated(new Date());
                return updatedRow;
            }
            return row;
        }));
    };

    const addRow = () => {
        setRows([...rows, { id: Date.now(), items: '', class: '', spec: 'CS1', size1: '', qty: 1, surfaceArea: 0, remarks: '' }]);
    };

    const removeRow = (id) => {
        if (rows.length === 1) {
            setRows([{ id: Date.now(), items: '', class: '', spec: 'CS1', size1: '', qty: 1, surfaceArea: 0, remarks: '' }]);
            return;
        }
        setRows(rows.filter(r => r.id !== id));
    };

    const handleSave = async () => {
        if (!calculationName.trim()) {
            toast.error("Please provide a name for this calculation");
            return;
        }

        setIsSaving(true);
        try {
            const totalArea = rows.reduce((acc, row) => acc + (row.surfaceArea || 0), 0);
            const response = await fetch(`${server}/api/surface-area-calculations`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    id: calculationId,
                    name: calculationName,
                    data: rows,
                    total_area: totalArea
                })
            });

            if (response.ok) {
                const saved = await response.json();
                setCalculationId(saved.id);
                toast.success(calculationId ? "Calculation updated!" : "Calculation saved!");
                
                // Refresh history
                const histRes = await fetch(`${server}/api/surface-area-calculations`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (histRes.ok) setHistory(await histRes.json());
            } else {
                toast.error("Failed to save calculation");
            }
        } catch (error) {
            console.error("Save error:", error);
            toast.error("An error occurred while saving");
        } finally {
            setIsSaving(false);
        }
    };

    const loadCalculation = async (id) => {
        setIsLoading(true);
        try {
            const response = await fetch(`${server}/api/surface-area-calculations/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.ok) {
                const calc = await response.json();
                setCalculationId(calc.id);
                setCalculationName(calc.name);
                setRows(calc.data);
                setShowHistory(false);
                toast.info(`Loaded: ${calc.name}`);
            }
        } catch (error) {
            console.error("Load error:", error);
            toast.error("Failed to load calculation");
        } finally {
            setIsLoading(false);
        }
    };

    const startNew = () => {
        setCalculationId(null);
        setCalculationName('New Calculation');
        setRows([{ id: Date.now(), items: '', class: '', spec: 'CS1', size1: '', qty: 1, surfaceArea: 0, remarks: '' }]);
        toast.info("Started new calculation sheet");
    };

    const exportToExcel = async () => {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Surface Area Report');

        // Modern Palette
        const palette = {
            primary: '4F46E5', // Indigo 600
            secondary: '1E293B', // Slate 800
            accent: 'EC4899', // Pink 500
            muted: '64748B', // Slate 500
            border: 'E2E8F0', // Slate 200
            zebra: 'F8FAFC'  // Slate 50
        };

        // Add Logo
        try {
            const response = await fetch('/logo.png');
            const blob = await response.blob();
            const arrayBuffer = await blob.arrayBuffer();
            const imageId = workbook.addImage({
                buffer: arrayBuffer,
                extension: 'png',
            });
            worksheet.addImage(imageId, {
                tl: { col: 0.1, row: 0.1 },
                ext: { width: 140, height: 45 }
            });
        } catch (e) {
            console.warn("Logo not found");
        }

        // Header Metadata (Clean Sidebar Style)
        const metadata = [
            ['REPORT TYPE', 'SURFACE AREA ANALYSIS'],
            ['DOCUMENT ID', 'TMS-CALC-SERIES-A'],
            ['GENERATED ON', new Date().toLocaleString('en-GB', { 
                day: '2-digit', month: 'short', year: 'numeric',
                hour: '2-digit', minute: '2-digit', second: '2-digit'
            })],
            ['STATUS', 'FINAL VERSION']
        ];

        metadata.forEach((item, i) => {
            const row = i + 1;
            worksheet.getCell(`G${row}`).value = item[0];
            worksheet.getCell(`H${row}`).value = item[1];
            worksheet.getCell(`G${row}`).font = { bold: true, size: 8, color: { argb: palette.muted } };
            worksheet.getCell(`H${row}`).font = { bold: true, size: 8, color: { argb: palette.secondary } };
            worksheet.getCell(`H${row}`).alignment = { horizontal: 'right' };
        });

        // Main Title
        worksheet.mergeCells('A5:H5');
        const titleCell = worksheet.getCell('A5');
        titleCell.value = 'SURFACE AREA SPECIFICATION SHEET';
        titleCell.font = { bold: true, size: 16, color: { argb: palette.secondary } };
        titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
        worksheet.getRow(5).height = 40;

        // Table Headers
        const headerRow = worksheet.getRow(7);
        headerRow.values = ['NO', 'ITEM DESCRIPTION', 'CLASS', 'SPEC', 'SIZE', 'QUANTITY', 'SURFACE AREA (SQ.IN)', 'REMARKS'];
        headerRow.height = 30;
        headerRow.eachCell((cell) => {
            cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 9 };
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: palette.secondary }
            };
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
            cell.border = {
                bottom: { style: 'medium', color: { argb: palette.primary } }
            };
        });

        // Add Data with Zebra Striping
        rows.forEach((row, index) => {
            const isZebra = index % 2 === 1;
            const r = worksheet.addRow([
                index + 1,
                row.items.toUpperCase(),
                row.class,
                row.spec,
                row.size1,
                row.qty,
                parseFloat(row.surfaceArea.toFixed(2)),
                row.remarks
            ]);
            r.height = 25;
            r.alignment = { vertical: 'middle', horizontal: 'center' };
            r.font = { size: 9, color: { argb: 'FF334155' } };
            
            r.eachCell((cell, colIndex) => {
                if (isZebra) {
                    cell.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: palette.zebra }
                    };
                }
                cell.border = {
                    bottom: { style: 'thin', color: { argb: palette.border } }
                };

                // Highlight specific columns
                if (colIndex === 2) cell.font = { bold: true, color: { argb: palette.primary } };
                if (colIndex === 6) cell.font = { bold: true, color: { argb: palette.accent } };
                if (colIndex === 7) cell.font = { bold: true, color: { argb: palette.secondary } };
            });
        });

        // Footer Summary Row
        const totalArea = rows.reduce((acc, row) => acc + (row.surfaceArea || 0), 0);
        const footerRow = worksheet.addRow(['', '', '', '', '', 'TOTAL CALCULATED AREA', parseFloat(totalArea.toFixed(2)), '']);
        footerRow.height = 35;
        footerRow.eachCell((cell, colIndex) => {
            if (colIndex === 6) {
                cell.font = { bold: true, size: 10, color: { argb: palette.secondary } };
                cell.alignment = { horizontal: 'right', vertical: 'middle' };
            }
            if (colIndex === 7) {
                cell.font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' } };
                cell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: palette.primary }
                };
                cell.alignment = { horizontal: 'center', vertical: 'middle' };
            }
        });

        // Disclaimer Footer
        const finalRow = worksheet.addRow([]);
        worksheet.mergeCells(`A${finalRow.number + 1}:H${finalRow.number + 1}`);
        const disclaimer = worksheet.getCell(`A${finalRow.number + 1}`);
        disclaimer.value = 'Generated via Biogas TMS | Calculation based on standard engineering formulas (PI * OD * L * Q).';
        disclaimer.font = { italic: true, size: 8, color: { argb: palette.muted } };
        disclaimer.alignment = { horizontal: 'center' };

        // Column Widths
        worksheet.columns = [
            { width: 6 }, { width: 35 }, { width: 12 }, { width: 10 }, 
            { width: 12 }, { width: 15 }, { width: 25 }, { width: 25 }
        ];

        const buffer = await workbook.xlsx.writeBuffer();
        saveAs(new Blob([buffer]), `TMS_SurfaceArea_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
        toast.success("Modern Report Exported!");
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-10 w-10 border-4 border-(--primary) border-t-transparent"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-(--glass-surface) p-4 rounded-2xl border border-(--glass-border)">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-(--primary-glow) rounded-xl border border-(--primary-glow) text-(--primary)">
                        <IoCalculatorOutline size={20} />
                    </div>
                    <div className="flex flex-col">
                        <input 
                            value={calculationName}
                            onChange={(e) => setCalculationName(e.target.value)}
                            className="bg-transparent text-lg font-black text-(--text-main) leading-none outline-none border-b border-transparent focus:border-(--primary) transition-all"
                            placeholder="Calculation Name..."
                        />
                        <div className="flex items-center gap-2 mt-1">
                            <p className="text-[10px] font-bold text-(--text-muted) uppercase tracking-wider">Estimator Tool</p>
                            {lastCalculated && (
                                <>
                                    <span className="w-1 h-1 rounded-full bg-(--glass-border)"></span>
                                    <p className="text-[9px] font-bold text-indigo-500 uppercase tracking-widest">
                                        Calculated: {lastCalculated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button 
                        onClick={() => setShowHistory(!showHistory)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-xs font-black uppercase tracking-widest transition-all active:scale-95 ${
                            showHistory 
                            ? 'bg-(--primary) text-white border-(--primary)' 
                            : 'bg-(--hover-bg) text-(--text-muted) border-(--glass-border)'
                        }`}
                        title="View History"
                    >
                        <IoTimeOutline size={16} />
                        History
                    </button>

                    <button 
                        onClick={startNew}
                        className="flex items-center gap-2 px-4 py-2 bg-(--hover-bg) text-(--text-muted) border border-(--glass-border) hover:bg-white/5 rounded-xl text-xs font-black uppercase tracking-widest transition-all active:scale-95"
                    >
                        <IoAddOutline size={16} />
                        New
                    </button>

                    <button 
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-500/10 text-indigo-500 hover:bg-indigo-500/20 rounded-xl border border-indigo-500/20 text-xs font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50"
                    >
                        <IoSaveOutline size={16} className={isSaving ? 'animate-pulse' : ''} />
                        {isSaving ? 'Saving...' : 'Save'}
                    </button>

                    <div className="w-px h-6 bg-(--glass-border) mx-1"></div>

                    <button 
                        onClick={exportToExcel}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 rounded-xl border border-emerald-500/20 text-xs font-black uppercase tracking-widest transition-all active:scale-95"
                    >
                        <IoDownloadOutline size={16} />
                        Export
                    </button>
                </div>
            </div>

            <AnimatePresence>
                {showHistory && (
                    <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden bg-(--glass-surface) border border-(--glass-border) rounded-2xl"
                    >
                        <div className="p-4 border-b border-(--glass-border) flex justify-between items-center bg-(--hover-bg)">
                            <h3 className="text-xs font-black uppercase tracking-widest text-(--text-muted) flex items-center gap-2">
                                <IoTimeOutline />
                                Calculation History
                            </h3>
                            <button onClick={() => setShowHistory(false)} className="text-(--text-muted) hover:text-(--primary)">
                                <IoCloseOutline size={20} />
                            </button>
                        </div>
                        <div className="max-h-[300px] overflow-y-auto custom-scrollbar p-2">
                            {history.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    {history.map(item => (
                                        <div 
                                            key={item.id}
                                            className="group flex flex-col gap-1 p-3 rounded-xl border border-(--glass-border) bg-white/5 hover:border-(--primary) hover:bg-(--primary-glow) cursor-pointer transition-all"
                                            onClick={() => loadCalculation(item.id)}
                                        >
                                            <div className="flex justify-between">
                                                <span className="font-black text-(--text-main) group-hover:text-(--primary)">{item.name}</span>
                                                <span className="text-[10px] font-mono text-emerald-500">{item.total_area} sq.in</span>
                                            </div>
                                            <span className="text-[10px] text-(--text-muted)">
                                                {new Date(item.updated_at).toLocaleDateString()} at {new Date(item.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-10 text-center text-(--text-muted) text-xs italic">
                                    No saved calculations found.
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="overflow-x-auto rounded-2xl border border-(--glass-border) bg-(--glass-surface) shadow-sm custom-scrollbar">
                <table className="w-full border-collapse min-w-[1000px]">
                    <thead>
                        <tr className="bg-(--hover-bg) border-b border-(--glass-border)">
                            <th className="p-3 text-center text-[10px] font-black uppercase text-(--text-muted) tracking-widest w-12">Sr No</th>
                            <th className="p-3 text-left text-[10px] font-black uppercase text-(--text-muted) tracking-widest">Items</th>
                            <th className="p-3 text-center text-[10px] font-black uppercase text-(--text-muted) tracking-widest w-24">CLASS</th>
                            <th className="p-3 text-center text-[10px] font-black uppercase text-(--text-muted) tracking-widest w-20">Spec</th>
                            <th className="p-3 text-center text-[10px] font-black uppercase text-(--text-muted) tracking-widest w-24">Size1</th>
                            <th className="p-3 text-center text-[10px] font-black uppercase text-(--text-muted) tracking-widest w-32 text-rose-500">Qty (EA/In)</th>
                            <th className="p-3 text-center text-[10px] font-black uppercase text-(--text-muted) tracking-widest w-32">Surface Area</th>
                            <th className="p-3 text-left text-[10px] font-black uppercase text-(--text-muted) tracking-widest">Remarks</th>
                            <th className="p-3 text-center text-[10px] font-black uppercase text-(--text-muted) tracking-widest w-16"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-(--glass-border) text-[11px] font-bold text-(--text-main)">
                        <AnimatePresence>
                            {rows.map((row, index) => (
                                <motion.tr 
                                    key={row.id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 10 }}
                                    className="hover:bg-white/5 transition-colors group"
                                >
                                    <td className="p-2 text-center text-(--text-muted)">{index + 1}</td>
                                    
                                    <td className="p-2">
                                        <Autocomplete
                                            value={row.items}
                                            onChange={(val) => updateRow(row.id, 'items', val)}
                                            options={uniqueItems}
                                            placeholder="Item Name..."
                                            className="text-rose-500 uppercase font-black"
                                        />
                                    </td>

                                    <td className="p-2">
                                        <Autocomplete
                                            value={row.class}
                                            onChange={(val) => updateRow(row.id, 'class', val)}
                                            options={getClassesForItem(row.items)}
                                            placeholder="-"
                                            disabled={!row.items}
                                            className="text-center"
                                        />
                                    </td>

                                    <td className="p-2">
                                        <input 
                                            type="text"
                                            value={row.spec}
                                            onChange={(e) => updateRow(row.id, 'spec', e.target.value)}
                                            className="w-full bg-(--input-bg) border border-(--glass-border) rounded-lg p-1.5 focus:border-(--primary) outline-none transition-all text-center"
                                        />
                                    </td>

                                    <td className="p-2 text-center">
                                        <Autocomplete
                                            value={row.size1}
                                            onChange={(val) => updateRow(row.id, 'size1', val)}
                                            options={getSizesForItemAndClass(row.items, row.class)}
                                            placeholder="-"
                                            disabled={!row.class}
                                            className="text-center"
                                        />
                                    </td>

                                    <td className="p-2">
                                        <input 
                                            type="number"
                                            value={row.qty}
                                            onChange={(e) => updateRow(row.id, 'qty', e.target.value)}
                                            className="w-full bg-(--input-bg) border border-(--glass-border) rounded-lg p-1.5 focus:border-(--primary) outline-none transition-all text-center font-mono text-rose-500"
                                            step="0.01"
                                            min="0"
                                        />
                                    </td>

                                    <td className="p-2 text-center font-mono text-emerald-500 bg-emerald-500/5 rounded-lg">
                                        {row.surfaceArea?.toFixed(2)}
                                    </td>

                                    <td className="p-2">
                                        <input 
                                            type="text"
                                            value={row.remarks}
                                            onChange={(e) => updateRow(row.id, 'remarks', e.target.value)}
                                            placeholder="..."
                                            className="w-full bg-(--input-bg) border border-(--glass-border) rounded-lg p-1.5 focus:border-(--primary) outline-none transition-all"
                                        />
                                    </td>

                                    <td className="p-2 text-center">
                                        <button 
                                            onClick={() => removeRow(row.id)}
                                            className="p-1.5 text-rose-500 opacity-0 group-hover:opacity-100 hover:bg-rose-500/10 rounded-lg transition-all"
                                            title="Remove Row"
                                        >
                                            <IoTrashOutline size={14} />
                                        </button>
                                    </td>
                                </motion.tr>
                            ))}
                        </AnimatePresence>
                    </tbody>
                </table>
            </div>

            <div className="flex justify-between items-center bg-(--glass-surface) p-4 rounded-2xl border border-(--glass-border)">
                <button 
                    onClick={addRow}
                    className="flex items-center gap-2 px-6 py-2 bg-(--primary-glow) text-(--primary) hover:bg-(--primary) hover:text-white rounded-xl border border-(--primary-glow) text-xs font-black uppercase tracking-widest transition-all active:scale-95"
                >
                    <IoAddOutline size={18} />
                    Add Row
                </button>

                <div className="flex gap-4">
                    <div className="px-6 py-2 bg-(--hover-bg) rounded-xl border border-(--glass-border) text-right">
                        <p className="text-[10px] font-black uppercase text-(--text-muted) tracking-widest">Total Area</p>
                        <p className="text-xl font-black text-(--text-main) font-mono">
                            {rows.reduce((acc, row) => acc + (row.surfaceArea || 0), 0).toFixed(2)}
                        </p>
                    </div>
                </div>
            </div>

            <div className="flex items-start gap-4 p-4 bg-amber-500/5 border border-amber-500/10 rounded-2xl text-[10px] text-amber-600/80 font-bold leading-relaxed">
                <IoInformationCircleOutline size={20} className="shrink-0" />
                <div>
                    <p className="uppercase tracking-widest mb-1 font-black">Calculation Basis</p>
                    <p>Surface Area = PI * OD * Effective Length * Quantity. For Pipe, the quantity input represents the active length in inches. For valves and fittings, the surface area is calculated per unit based on standard face-to-face dimensions found in the reference database.</p>
                </div>
            </div>
        </div>
    );
}
