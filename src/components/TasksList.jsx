import { motion, AnimatePresence } from 'framer-motion';
import { 
  IoPerson, IoTrash, IoChevronBack, IoChevronForward, 
  IoSearchOutline, IoLayersOutline, IoFilterOutline, IoCheckmarkCircle 
} from 'react-icons/io5';
import { useState, useMemo, useRef, useEffect } from 'react';

export default function TasksList({ tasks = [], onDeleteTask }) {
  const [filterDept, setFilterDept] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [showDeptDropdown, setShowDeptDropdown] = useState(false);
  
  const tasksPerPage = 8;

  const deptStyles = {
    'Process': 'text-blue-600 bg-blue-50 border-blue-100',
    'Product Development': 'text-violet-600 bg-violet-50 border-violet-100',
    'Business Development': 'text-rose-600 bg-rose-50 border-rose-100',
    'Document Controls': 'text-emerald-600 bg-emerald-50 border-emerald-100',
    'default': 'text-slate-600 bg-slate-50 border-slate-100'
  };

  const uniqueDepts = useMemo(() => 
    ['All', ...new Set(tasks.map(t => t.task_dept).filter(Boolean))]
  , [tasks]);

  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      const matchesDept = filterDept === 'All' || t.task_dept === filterDept;
      const matchesSearch = (t.task_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                            (t.task_id || '').toString().includes(searchQuery);
      return matchesDept && matchesSearch;
    });
  }, [tasks, filterDept, searchQuery]);

  const totalPages = Math.ceil(filteredTasks.length / tasksPerPage);
  const currentTasks = filteredTasks.slice((currentPage - 1) * tasksPerPage, currentPage * tasksPerPage);

  useEffect(() => setCurrentPage(1), [searchQuery, filterDept]);

  return (
    <div className="w-full min-h-screen bg-white">
      {/* --- PREMIUM FULL-WIDTH HEADER --- */}
      <header className="w-full border-b border-slate-100 bg-white/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-[2000px] mx-auto px-6 py-8 md:py-12 flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="space-y-2">
            <h1 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tight italic">
              Tasks <span className="text-blue-600">.</span>
            </h1>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
              Tracking {filteredTasks.length} Active Operational Nodes
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
            <div className="relative w-full sm:w-80 group">
              <IoSearchOutline className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
              <input 
                type="text"
                placeholder="Filter task index..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-14 pr-6 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
              />
            </div>
            
            {/* Custom Dept Dropdown */}
            <div className="relative w-full sm:w-auto">
              <button
                onClick={() => setShowDeptDropdown(!showDeptDropdown)}
                className="w-full flex items-center justify-between gap-3 px-6 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest outline-none hover:bg-blue-600 transition-all min-w-[200px]"
              >
                <span className="truncate">{filterDept}</span>
                <IoFilterOutline className="text-white/70 flex-shrink-0" size={16} />
              </button>
              
              <AnimatePresence>
                {showDeptDropdown && (
                  <>
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="fixed inset-0 z-40"
                      onClick={() => setShowDeptDropdown(false)}
                    />
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute top-full mt-2 left-0 right-0 bg-white rounded-2xl shadow-2xl border border-slate-200 py-2 z-50 max-h-64 overflow-y-auto"
                    >
                      {uniqueDepts.map(dept => (
                        <button
                          key={dept}
                          onClick={() => { setFilterDept(dept); setShowDeptDropdown(false); }}
                          className={`w-full px-6 py-3 text-left text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-between ${
                            filterDept === dept 
                              ? 'bg-blue-50 text-blue-600' 
                              : 'text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          <span>{dept}</span>
                          {filterDept === dept && <IoCheckmarkCircle size={16} />}
                        </button>
                      ))}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-[2000px] mx-auto px-6 py-12">
        {/* --- REFINED GRID --- */}
        {currentTasks.length === 0 ? (
          <div className="w-full py-40 text-center">
            <div className="w-20 h-20 bg-slate-50 rounded-[28px] flex items-center justify-center mx-auto mb-6">
               <IoLayersOutline size={32} className="text-slate-300" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 mb-2">Null Result</h2>
            <p className="text-slate-400 text-sm font-medium mb-8">No tasks match your current query index.</p>
            <button 
              onClick={() => {setFilterDept('All'); setSearchQuery('');}}
              className="text-xs font-black uppercase tracking-widest text-blue-600 underline"
            >
              Reset All Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            <AnimatePresence mode='popLayout'>
              {currentTasks.map((task, index) => (
                <TaskCard 
                  key={task.task_id || index}
                  task={task}
                  deptStyles={deptStyles}
                  onDelete={() => setTaskToDelete(task)}
                />
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* --- MOBILE-OPTIMIZED PAGINATION --- */}
        {totalPages > 1 && (
          <div className="mt-20 flex flex-col items-center gap-6 py-8 border-t border-slate-100">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
              Page {currentPage} of {totalPages}
            </p>
            
            <div className="flex items-center gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => p - 1)}
                className="p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-100 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <IoChevronBack size={16} className="sm:w-[18px] sm:h-[18px]" />
              </button>

              {/* Simple Mobile Pagination */}
              <div className="flex items-center gap-1 sm:gap-1.5">
                {(() => {
                  const pages = [];
                  const maxVisible = 5;
                  
                  let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
                  let end = Math.min(totalPages, start + maxVisible - 1);
                  
                  if (end - start < maxVisible - 1) {
                    start = Math.max(1, end - maxVisible + 1);
                  }
                  
                  if (start > 1) {
                    pages.push(
                      <button
                        key={1}
                        onClick={() => setCurrentPage(1)}
                        className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl text-xs font-black transition-all text-slate-400 hover:bg-slate-50"
                      >
                        1
                      </button>
                    );
                    if (start > 2) {
                      pages.push(<span key="dots1" className="text-slate-300 text-xs px-1">...</span>);
                    }
                  }
                  
                  for (let i = start; i <= end; i++) {
                    pages.push(
                      <button
                        key={i}
                        onClick={() => setCurrentPage(i)}
                        className={`w-9 h-9 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl text-xs font-black transition-all ${
                          currentPage === i ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-400 hover:bg-slate-50'
                        }`}
                      >
                        {i}
                      </button>
                    );
                  }
                  
                  if (end < totalPages) {
                    if (end < totalPages - 1) {
                      pages.push(<span key="dots2" className="text-slate-300 text-xs px-1">...</span>);
                    }
                    pages.push(
                      <button
                        key={totalPages}
                        onClick={() => setCurrentPage(totalPages)}
                        className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl text-xs font-black transition-all text-slate-400 hover:bg-slate-50"
                      >
                        {totalPages}
                      </button>
                    );
                  }
                  
                  return pages;
                })()}
              </div>

              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => p + 1)}
                className="p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-100 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <IoChevronForward size={16} className="sm:w-[18px] sm:h-[18px]" />
              </button>
            </div>
          </div>
        )}
      </main>

      {/* --- MINIMAL DELETE MODAL --- */}
      <AnimatePresence>
        {taskToDelete && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setTaskToDelete(null)} className="absolute inset-0 bg-slate-900/10 backdrop-blur-xl" />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative bg-white rounded-[32px] p-10 max-w-sm w-full shadow-2xl text-center">
              <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <IoTrash size={28} />
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-2">Remove Node</h3>
              <p className="text-sm text-slate-500 font-medium mb-8 leading-relaxed">Confirm permanent deletion of task index: <br/><b>{taskToDelete.task_name}</b></p>
              <div className="flex gap-3">
                <button onClick={() => setTaskToDelete(null)} className="flex-1 py-4 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors">Cancel</button>
                <button onClick={() => { onDeleteTask(taskToDelete.task_id); setTaskToDelete(null); }} className="flex-1 py-4 bg-rose-500 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-rose-100 hover:bg-rose-600 transition-all">Delete</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function TaskCard({ task, deptStyles, onDelete }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -8, scale: 1.02 }}
      className="group relative bg-gradient-to-br from-slate-50 to-slate-100/50 hover:from-white hover:to-blue-50/30 border border-slate-200/50 hover:border-blue-200 rounded-[28px] p-8 transition-all duration-500 flex flex-col justify-between h-64 shadow-sm hover:shadow-2xl hover:shadow-blue-100/50 overflow-hidden"
    >
      {/* Animated Background Accent */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-blue-500/0 group-hover:from-blue-500/5 group-hover:to-purple-500/5 transition-all duration-500 rounded-[28px]" />
      
      {/* Subtle Corner Decoration */}
      <div className="absolute -right-8 -top-8 w-24 h-24 bg-blue-100/0 group-hover:bg-blue-100/30 rounded-full blur-2xl transition-all duration-700" />
      
      <div className="relative z-10 space-y-4">
        <div className="flex justify-between items-start">
          <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider border ${deptStyles[task.task_dept] || deptStyles.default}`}>
            {task.task_dept}
          </span>
          <button 
            onClick={onDelete}
            className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 p-2.5 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all"
          >
            <IoTrash size={20} />
          </button>
        </div>
        <h4 className="text-xl font-black text-slate-900 group-hover:text-blue-900 leading-tight line-clamp-3 pr-2 transition-colors">
          {task.task_name}
        </h4>
      </div>

      <div className="relative z-10 flex items-center justify-between mt-auto pt-4 border-t border-slate-200/50">
        <div className="flex items-center gap-2 text-slate-500 group-hover:text-slate-700 transition-colors">
          <div className="p-1.5 bg-slate-200/50 group-hover:bg-blue-100 rounded-lg transition-colors">
            <IoPerson size={14} />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-widest">ID: {task.task_id}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">Active</span>
        </div>
      </div>
    </motion.div>
  );
}