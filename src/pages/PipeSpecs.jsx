import { motion } from 'framer-motion';
import PipeSpecificationsTable from '../components/PipeSpecificationsTable';
import { IoLayersOutline } from 'react-icons/io5';

export default function PipeSpecs() {
    return (
        <div className="space-y-8">
            <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-4">
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
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
            >
                <PipeSpecificationsTable />
            </motion.div>
        </div>
    );
}
