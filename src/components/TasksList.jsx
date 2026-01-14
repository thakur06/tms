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
    'Process': 'text-slate-700 bg-slate-100 border-slate-200',
    'Product Development': 'text-slate-700 bg-slate-100 border-slate-200',
    'Business Development': 'text-slate-700 bg-slate-100 border-slate-200',
    'Document Controls': 'text-slate-700 bg-slate-100 border-slate-200',
    'default': 'text-slate-700 bg-slate-100 border-slate-200'
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
      {/* --- SIMPLE HEADER --- */}
      <header className="w-full border-b border-slate-200 bg-white sticky top-0 z-30">
        <div className="max-w-[2000px] mx-auto px-6 py-6 md:py-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
              Tasks
            </h1>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              {filteredTasks.length} tasks
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
            <div className="relative w-full sm:w-80 group">
              <IoSearchOutline className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-600 transition-colors" size={18} />
              <input 
                type="text"
                placeholder="Filter tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-14 pr-6 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-slate-500/30 outline-none transition-all"
              />
            </div>
            
            {/* Custom Dept Dropdown */}
            <div className="relative w-full sm:w-auto">
              <button
                onClick={() => setShowDeptDropdown(!showDeptDropdown)}
                className="w-full flex items-center justify-between gap-3 px-6 py-3 bg-white text-slate-800 rounded-2xl font-black text-xs uppercase tracking-widest outline-none hover:bg-slate-50 transition-all min-w-[200px] border border-slate-200"
              >
                <span className="truncate">{filterDept}</span>
                <IoFilterOutline className="text-white/70 shrink-0" size={16} />
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
                      className="absolute top-full mt-2 left-0 right-0 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 max-h-64 overflow-y-auto hide-y-scroll"
                    >
                      {uniqueDepts.map(dept => (
                        <button
                          key={dept}
                          onClick={() => { setFilterDept(dept); setShowDeptDropdown(false); }}
                          className={`w-full px-6 py-3 text-left text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-between ${
                            filterDept === dept 
                              ? 'bg-slate-900 text-white' 
                              : 'text-slate-700 hover:bg-slate-50'
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

      <main className="max-w-[2000px] mx-auto px-6 py-8">
        {/* --- REFINED GRID --- */}
        {currentTasks.length === 0 ? (
          <div className="w-full py-24 text-center">
            <div className="w-20 h-20 bg-white border border-slate-200 rounded-[28px] flex items-center justify-center mx-auto mb-6">
               <IoLayersOutline size={32} className="text-slate-400" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 mb-2">No Results</h2>
            <p className="text-slate-500 text-sm font-medium mb-8">No tasks match your current filters.</p>
            <button 
              onClick={() => {setFilterDept('All'); setSearchQuery('');}}
              className="text-xs font-black uppercase tracking-widest text-slate-600 underline"
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
          <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setTaskToDelete(null)} className="absolute inset-0 bg-black/20" />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative bg-white rounded-[24px] p-8 max-w-sm w-full shadow-2xl text-center border border-slate-200">
              <div className="w-16 h-16 bg-slate-100 text-slate-700 rounded-full flex items-center justify-center mx-auto mb-6">
                <IoTrash size={28} />
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-2">Delete Task</h3>
              <p className="text-sm text-slate-600 font-medium mb-8 leading-relaxed">Confirm permanent deletion of task:<br/><b className="text-slate-900">{taskToDelete.task_name}</b></p>
              <div className="flex gap-3">
                <button onClick={() => setTaskToDelete(null)} className="flex-1 py-3 text-xs font-black uppercase tracking-widest text-slate-500 hover:text-slate-900 transition-colors">Cancel</button>
                <button onClick={() => { onDeleteTask(taskToDelete.task_id); setTaskToDelete(null); }} className="flex-1 py-3 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-black transition-all">Delete</button>
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
      className="group relative bg-white border border-slate-200 hover:border-slate-300 rounded-[28px] p-8 transition-all duration-300 flex flex-col justify-between h-64 shadow-sm hover:shadow-md overflow-hidden"
    >
      <div className="relative z-10 space-y-4">
        <div className="flex justify-between items-start">
          <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider border ${deptStyles[task.task_dept] || deptStyles.default}`}>
            {task.task_dept}
          </span>
          <button 
            onClick={onDelete}
            className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 p-2.5 rounded-xl text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-all"
          >
            <IoTrash size={20} />
          </button>
        </div>
        <h4 className="text-xl font-black text-slate-900 leading-tight line-clamp-3 pr-2 transition-colors">
          {task.task_name}
        </h4>
      </div>

      <div className="relative z-10 flex items-center justify-between mt-auto pt-4 border-top border-slate-100">
        <div className="flex items-center gap-2 text-slate-500 group-hover:text-slate-800 transition-colors">
          <div className="p-1.5 bg-slate-100 group-hover:bg-slate-200 rounded-lg transition-colors">
            <IoPerson size={14} />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600">ID: {task.task_id}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-slate-600" />
          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Active</span>
        </div>
      </div>
    </motion.div>
  );
}