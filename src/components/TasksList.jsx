import { motion, AnimatePresence } from 'framer-motion';
import { 
  IoPerson, IoTrash, IoChevronBack, IoChevronForward, 
  IoSearchOutline, IoLayersOutline, IoFilterOutline, IoCheckmarkCircle,
  IoEllipsisVertical, IoDocumentText
} from 'react-icons/io5';
import { useState, useMemo, useEffect } from 'react';

// Smooth transition configuration
const smoothTransition = {
  duration: 0.2,
  ease: "easeOut"
};

export default function TasksList({ tasks = [], onDeleteTask, headerAction }) {
  const [filterDept, setFilterDept] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [showDeptDropdown, setShowDeptDropdown] = useState(false);
  const [expandedRow, setExpandedRow] = useState(null);
  
  const tasksPerPage = 10;

  const deptColors = {
    'Process': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    'Product Development': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    'Business Development': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    'Document Controls': 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    'default': 'bg-slate-500/10 text-slate-400 border-slate-500/20'
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

  const toggleRow = (taskId) => {
    setExpandedRow(expandedRow === taskId ? null : taskId);
  };

  return (
    <div className="space-y-6">
      {/* Controls Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">Tasks Overview</h2>
          <p className="text-sm text-slate-400 mt-1">
            {filteredTasks.length} tasks • {filterDept !== 'All' ? `${filterDept} only` : 'All departments'}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
          {headerAction}
          <div className="relative w-full sm:w-64">
            <IoSearchOutline className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="ui-input pl-10 py-2 h-10 w-full"
            />
          </div>
          
          <div className="relative w-full sm:w-auto">
            <button
              onClick={() => setShowDeptDropdown(!showDeptDropdown)}
              onBlur={() => setTimeout(() => setShowDeptDropdown(false), 200)}
              className="ui-btn ui-btn-secondary w-full justify-between h-10"
            >
              <span>{filterDept}</span>
              <IoFilterOutline size={14} />
            </button>
            
            <AnimatePresence>
              {showDeptDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: -5, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -5, scale: 0.95 }}
                  transition={smoothTransition}
                  className="absolute top-full mt-1 left-0 right-0 bg-[#1e293b] rounded-xl shadow-xl border border-white/10 py-1 z-50 max-h-60 overflow-y-auto custom-scrollbar"
                >
                  {uniqueDepts.map(dept => (
                    <button
                      key={dept}
                      onClick={() => { setFilterDept(dept); setShowDeptDropdown(false); }}
                      className={`w-full px-4 py-2 text-left text-sm flex items-center justify-between transition-colors ${
                        filterDept === dept 
                          ? 'bg-indigo-500/20 text-indigo-300' 
                          : 'text-slate-400 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      <span>{dept}</span>
                      {filterDept === dept && <IoCheckmarkCircle size={14} />}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="ui-card overflow-hidden">
        {currentTasks.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={smoothTransition}
            className="text-center py-16"
          >
            <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/10">
              <IoLayersOutline size={32} className="text-slate-500" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">No tasks found</h3>
            <p className="text-slate-400 text-sm mb-6">Try adjusting your search or filter</p>
            <button 
              onClick={() => {setFilterDept('All'); setSearchQuery('');}}
              className="text-sm font-semibold text-indigo-400 hover:text-indigo-300 underline"
            >
              Clear filters
            </button>
          </motion.div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/[0.02] border-b border-white/5">
                <tr>
                  <th className="text-left py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-widest">
                    Task ID
                  </th>
                  <th className="text-left py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-widest">
                    Task Name
                  </th>
                  <th className="text-left py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-widest">
                    Department
                  </th>
                  <th className="text-left py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-widest">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {currentTasks.map((task, index) => (
                  <motion.tr
                    key={task.task_id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ ...smoothTransition, delay: index * 0.02 }}
                    className="group hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <IoDocumentText className="text-slate-600 group-hover:text-indigo-400 transition-colors" size={16} />
                        <span className="font-mono text-sm text-slate-400 group-hover:text-white transition-colors">
                          {task.task_id}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div 
                        className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors cursor-pointer"
                        onClick={() => toggleRow(task.task_id)}
                      >
                        {task.task_name}
                        <AnimatePresence>
                          {expandedRow === task.task_id && (
                            <motion.div 
                              initial={{ opacity: 0, height: 0, marginTop: 0 }}
                              animate={{ opacity: 1, height: "auto", marginTop: 8 }}
                              exit={{ opacity: 0, height: 0, marginTop: 0 }}
                              transition={smoothTransition}
                              className="overflow-hidden"
                            >
                              <div className="text-xs text-slate-400 bg-white/5 p-3 rounded-lg border border-white/5">
                                <div className="flex items-center gap-2 mb-1">
                                  <IoPerson size={12} className="text-slate-500" />
                                  <span className="font-semibold text-slate-300">Task ID:</span> {task.task_id}
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-slate-300">Department:</span> {task.task_dept || 'Not assigned'}
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border ${deptColors[task.task_dept] || deptColors.default}`}>
                        {task.task_dept || 'Unassigned'}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                        {/* <button
                          onClick={() => toggleRow(task.task_id)}
                          className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                        >
                          <IoEllipsisVertical size={16} />
                        </button> */}
                        <button
                          onClick={() => setTaskToDelete(task)}
                          className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                        >
                          <IoTrash size={16} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 border-t border-white/5">
            <div className="text-sm text-slate-500">
              Showing <span className="text-white font-medium">{(currentPage - 1) * tasksPerPage + 1}</span> to <span className="text-white font-medium">{Math.min(currentPage * tasksPerPage, filteredTasks.length)}</span> of <span className="text-white font-medium">{filteredTasks.length}</span> tasks
            </div>
            
            <div className="flex items-center gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => p - 1)}
                className="p-2 rounded-lg border border-white/10 text-slate-400 hover:bg-white/5 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <IoChevronBack size={16} />
              </button>

              <div className="flex items-center gap-1">
                {(() => {
                  const pages = [];
                  const maxVisible = 5;
                  
                  let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
                  let end = Math.min(totalPages, start + maxVisible - 1);
                  
                  if (end - start < maxVisible - 1) {
                    start = Math.max(1, end - maxVisible + 1);
                  }
                  
                  for (let i = start; i <= end; i++) {
                    pages.push(
                      <motion.button
                        key={i}
                        onClick={() => setCurrentPage(i)}
                        whileTap={{ scale: 0.95 }}
                        className={`w-8 h-8 text-sm font-medium rounded-lg transition-colors ${
                          currentPage === i 
                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25' 
                            : 'text-slate-400 hover:bg-white/5 hover:text-white'
                        }`}
                      >
                        {i}
                      </motion.button>
                    );
                  }
                  
                  return pages;
                })()}
              </div>

              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => p + 1)}
                className="p-2 rounded-lg border border-white/10 text-slate-400 hover:bg-white/5 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <IoChevronForward size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Modal */}
      <AnimatePresence>
        {taskToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setTaskToDelete(null)} 
              className="absolute inset-0 bg-[#000000]/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.95, opacity: 0 }} 
              transition={smoothTransition}
              className="relative w-full max-w-sm ui-card p-6 border border-white/10 shadow-2xl"
            >
              <div className="text-center">
                <div className="w-14 h-14 bg-red-500/10 text-red-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/20">
                  <IoTrash size={24} />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Delete Task</h3>
                <p className="text-sm text-slate-400 mb-6 leading-relaxed">
                  Are you sure you want to delete <span className="text-white font-semibold">{taskToDelete.task_name}</span>? This action cannot be undone.
                </p>
                <div className="flex gap-3">
                  <button 
                    onClick={() => setTaskToDelete(null)} 
                    className="flex-1 py-2.5 text-sm font-bold text-slate-300 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={() => { onDeleteTask(taskToDelete.task_id); setTaskToDelete(null); }} 
                    className="flex-1 py-2.5 bg-red-600 text-white rounded-xl font-bold hover:bg-red-500 shadow-lg shadow-red-900/20 transition-all"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}