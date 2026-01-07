import { motion, AnimatePresence } from 'framer-motion';
import { 
  IoPerson, IoTrash, IoChevronBack, IoChevronForward, 
  IoSearchOutline, IoLayersOutline 
} from 'react-icons/io5';
import { useState, useMemo, useRef } from 'react';

export default function TasksList({ tasks = [], onDeleteTask }) {
  const [filterDept, setFilterDept] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [taskToDelete, setTaskToDelete] = useState(null);
  
  const tasksPerPage = 6;
  const listTopRef = useRef(null); // Reference for smart scrolling

  const deptStyles = {
    'Process': 'text-blue-600 bg-blue-50',
    'Product Development': 'text-violet-600 bg-violet-50',
    'Business Development': 'text-rose-600 bg-rose-50',
    'Document Controls': 'text-emerald-600 bg-emerald-50',
    'default': 'text-slate-600 bg-slate-50'
  };

  // 1. Get ALL unique departments
  const uniqueDepts = useMemo(() => 
    ['All', ...new Set(tasks.map(t => t.task_dept).filter(Boolean))]
  , [tasks]);

  // 2. Multi-stage filtering (Search + Department)
  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      const matchesDept = filterDept === 'All' || t.task_dept === filterDept;
      const matchesSearch = (t.task_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                            (t.task_id || '').toString().includes(searchQuery);
      return matchesDept && matchesSearch;
    });
  }, [tasks, filterDept, searchQuery]);

  // 3. Pagination Logic
  const totalPages = Math.ceil(filteredTasks.length / tasksPerPage);
  const currentTasks = filteredTasks.slice((currentPage - 1) * tasksPerPage, currentPage * tasksPerPage);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    // Smart Scroll: Only scrolls the tasks container into view
    listTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="space-y-6" ref={listTopRef}>
      {/* --- Header & Control Panel --- */}
      <div className="bg-white rounded-[32px] p-6 lg:p-8 border border-slate-100 shadow-sm">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">Active Tasks</h2>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                Management & Progress Tracking
              </p>
            </div>

            {/* Search Bar */}
            <div className="relative group min-w-[280px]">
              <IoSearchOutline className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
              <input 
                type="text"
                placeholder="Search task or ID..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:bg-white focus:border-blue-200 transition-all font-medium"
              />
            </div>
          </div>

          {/* Department Chips (Full list, wraps to next line if needed) */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2">Filters:</span>
            {uniqueDepts.map((dept) => (
              <button
                key={dept}
                onClick={() => { setFilterDept(dept); setCurrentPage(1); }}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                  filterDept === dept 
                    ? 'bg-slate-900 text-white border-slate-900 shadow-lg shadow-slate-200' 
                    : 'bg-white text-slate-500 border-slate-100 hover:border-slate-300'
                }`}
              >
                {dept}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* --- Tasks Grid --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 min-h-[400px]">
        <AnimatePresence mode='popLayout'>
          {currentTasks.length > 0 ? (
            currentTasks.map((task, index) => (
              <motion.div
                key={task.task_id || index}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="group bg-white border border-slate-100 rounded-[24px] p-6 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] transition-all flex flex-col"
              >
                <div className="flex justify-between items-start mb-4">
                  <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter ${deptStyles[task.task_dept] || deptStyles.default}`}>
                    {task.task_dept}
                  </span>
                  <button 
                    onClick={() => setTaskToDelete(task)}
                    className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                  >
                    <IoTrash size={16} />
                  </button>
                </div>

                <h4 className="text-lg font-bold text-slate-800 leading-snug mb-6 flex-grow line-clamp-2">
                  {task.task_name}
                </h4>

                <div className="flex items-center justify-between pt-4 border-t border-slate-50 mt-auto">
                  <div className="flex items-center gap-2 text-slate-400">
                    <IoPerson size={14} />
                    <span className="text-xs font-bold uppercase tracking-tighter">ID: {task.task_id}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">In Progress</span>
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="col-span-full py-20 bg-slate-50/50 rounded-[32px] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center"
            >
              <div className="p-4 bg-white rounded-2xl shadow-sm mb-4">
                <IoLayersOutline size={32} className="text-slate-300" />
              </div>
              <p className="text-slate-500 font-bold">No tasks found matching your criteria</p>
              <button 
                onClick={() => {setFilterDept('All'); setSearchQuery('');}}
                className="mt-4 text-blue-600 font-bold text-xs uppercase tracking-widest hover:underline"
              >
                Clear all filters
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {totalPages > 1 && (
  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-[28px] border border-slate-100 shadow-sm mt-8">
    
    {/* Page Status: Minimalist on Mobile, Descriptive on Desktop */}
    <div className="order-2 sm:order-1">
      <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.15em] flex items-center gap-2">
        <span className="hidden sm:inline">Viewing</span>
        <span className="text-slate-900 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
          {currentPage}
        </span>
        <span className="text-slate-300">/</span>
        <span className="text-slate-500">{totalPages}</span>
        <span className="hidden sm:inline text-slate-400">Pages</span>
      </p>
    </div>

    {/* Navigation Controls */}
    <div className="flex items-center gap-2 order-1 sm:order-2 w-full sm:w-auto">
      {/* PREVIOUS BUTTON */}
      <button
        disabled={currentPage === 1}
        onClick={() => handlePageChange(currentPage - 1)}
        className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-3 sm:py-2.5 rounded-2xl border border-slate-100 hover:bg-slate-50 disabled:opacity-30 disabled:hover:bg-transparent transition-all active:scale-95 group"
      >
        <IoChevronBack className="text-slate-400 group-hover:text-blue-600 transition-colors" />
        <span className="text-sm font-bold text-slate-700">Prev</span>
      </button>

      {/* PAGE NUMBERS: Hidden on extra small mobile devices to prevent wrapping */}
      <div className="hidden md:flex items-center gap-1.5 mx-2">
        {Array.from({ length: totalPages }, (_, i) => i + 1)
          .filter(page => {
            // Logic to show: First, Last, and 1 neighbor around Current
            return page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1;
          })
          .map((page, index, array) => (
            <div key={page} className="flex items-center gap-1.5">
              {/* Add ellipses if there is a gap in page numbers */}
              {index > 0 && array[index - 1] !== page - 1 && (
                <span className="text-slate-300 font-bold px-1">...</span>
              )}
              <button
                onClick={() => handlePageChange(page)}
                className={`w-10 h-10 rounded-xl text-xs font-black transition-all active:scale-90 ${
                  currentPage === page
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-100 border border-blue-500'
                    : 'bg-white text-slate-400 border border-transparent hover:border-slate-200 hover:text-slate-600'
                }`}
              >
                {page}
              </button>
            </div>
          ))}
      </div>

      {/* NEXT BUTTON */}
      <button
        disabled={currentPage === totalPages}
        onClick={() => handlePageChange(currentPage + 1)}
        className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-3 sm:py-2.5 rounded-2xl border border-slate-100 hover:bg-slate-50 disabled:opacity-30 disabled:hover:bg-transparent transition-all active:scale-95 group"
      >
        <span className="text-sm font-bold text-slate-700">Next</span>
        <IoChevronForward className="text-slate-400 group-hover:text-blue-600 transition-colors" />
      </button>
    </div>
  </div>
)}
      {/* Minimal Delete Confirmation */}
      <AnimatePresence>
        {taskToDelete && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-[32px] p-8 max-w-sm w-full shadow-2xl"
            >
              <h3 className="text-xl font-black text-slate-900 mb-2">Delete Task?</h3>
              <p className="text-slate-500 text-sm mb-8 leading-relaxed">
                You're about to remove <span className="font-bold text-slate-700">{taskToDelete.task_name}</span>. This action is permanent.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => setTaskToDelete(null)} className="py-4 rounded-2xl font-bold text-slate-500 hover:bg-slate-50 transition-all">Cancel</button>
                <button 
                  onClick={() => { onDeleteTask(taskToDelete.task_id); setTaskToDelete(null); }} 
                  className="py-4 rounded-2xl font-bold bg-red-500 text-white shadow-lg shadow-red-100 hover:bg-red-600 transition-all"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}