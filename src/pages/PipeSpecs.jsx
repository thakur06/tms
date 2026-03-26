import { useState } from 'react';
import { motion } from 'framer-motion';
import PipeSpecificationsTable from '../components/PipeSpecificationsTable';
import SurfaceAreaCalculator from '../components/SurfaceAreaCalculator';
import { IoLayersOutline, IoCalculatorOutline, IoListOutline } from 'react-icons/io5';

export default function PipeSpecs() {
    const [activeTab, setActiveTab] = useState('calculator'); // Default to calculator as requested

    return (
        <div className="space-y-8">
            <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6">
                <div>
                    <nav className="flex items-center gap-2 text-xs font-black text-gray-400 uppercase tracking-widest mb-2">
                        <span>Workspace</span>
                        <span className="opacity-30">/</span>
                        <span className="text-(--primary)">Pipe Specifications</span>
                    </nav>
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-(--primary-glow) rounded-2xl border border-(--primary-glow) text-(--primary) shadow-sm">
                            <IoLayersOutline size={28} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-(--text-main) tracking-tight leading-none">
                                Engineering Reference
                            </h1>
                            <p className="text-(--text-muted) mt-1.5 text-xs font-bold italic">Standard pipe & flange dimensions</p>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex p-1.5 bg-(--glass-surface) rounded-2xl border border-(--glass-border) w-fit shadow-sm">
                    <button
                        onClick={() => setActiveTab('calculator')}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                            activeTab === 'calculator' 
                                ? 'bg-(--gradient-primary) text-white shadow-lg shadow-(--primary-glow)' 
                                : 'text-(--text-muted) hover:text-(--text-main) hover:bg-(--hover-bg)'
                        }`}
                    >
                        <IoCalculatorOutline size={16} />
                        Calculator
                    </button>
                    <button
                        onClick={() => setActiveTab('reference')}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                            activeTab === 'reference' 
                                ? 'bg-(--gradient-primary) text-white shadow-lg shadow-(--primary-glow)' 
                                : 'text-(--text-muted) hover:text-(--text-main) hover:bg-(--hover-bg)'
                        }`}
                    >
                        <IoListOutline size={16} />
                        Reference Data
                    </button>
                </div>
            </div>

            <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
            >
                {activeTab === 'calculator' ? <SurfaceAreaCalculator /> : <PipeSpecificationsTable />}
            </motion.div>
        </div>
    );
}
