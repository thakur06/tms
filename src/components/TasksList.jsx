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

export default function TasksList({ tasks = [], onDeleteTask }) {
  const [filterDept, setFilterDept] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [showDeptDropdown, setShowDeptDropdown] = useState(false);
  const [expandedRow, setExpandedRow] = useState(null);
  
  const tasksPerPage = 10;

  const deptColors = {
    'Process': 'bg-blue-50 text-blue-700',
    'Product Development': 'bg-emerald-50 text-emerald-700',
    'Business Development': 'bg-amber-50 text-amber-700',
    'Document Controls': 'bg-purple-50 text-purple-700',
    'default': 'bg-slate-50 text-slate-700'
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
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-slate-200 bg-white">
        <div className="max-w-[2000px] mx-auto px-4 sm:px-6 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Tasks</h1>
              <p className="text-sm text-slate-500 mt-1">
                {filteredTasks.length} tasks • {filterDept !== 'All' ? `${filterDept} only` : 'All departments'}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
              <div className="relative w-full sm:w-64">
                <IoSearchOutline className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                  type="text"
                  placeholder="Search tasks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400"
                />
              </div>
              
              <div className="relative w-full sm:w-auto">
                <button
                  onClick={() => setShowDeptDropdown(!showDeptDropdown)}
                  onBlur={() => setTimeout(() => setShowDeptDropdown(false), 200)}
                  className="w-full flex items-center justify-between gap-2 px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-700 hover:bg-slate-50"
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
                      className="absolute top-full mt-1 left-0 right-0 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-50 max-h-60 overflow-y-auto"
                    >
                      {uniqueDepts.map(dept => (
                        <button
                          key={dept}
                          onClick={() => { setFilterDept(dept); setShowDeptDropdown(false); }}
                          className={`w-full px-4 py-2 text-left text-sm flex items-center justify-between ${
                            filterDept === dept 
                              ? 'bg-slate-900 text-white' 
                              : 'text-slate-700 hover:bg-slate-50'
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
        </div>
      </div>

      {/* Table */}
      <div className="max-w-[2000px] mx-auto px-4 sm:px-6 py-4">
        {currentTasks.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={smoothTransition}
            className="text-center py-16"
          >
            <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <IoLayersOutline size={24} className="text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-2">No tasks found</h3>
            <p className="text-slate-500 text-sm mb-6">Try adjusting your search or filter</p>
            <button 
              onClick={() => {setFilterDept('All'); setSearchQuery('');}}
              className="text-sm text-slate-600 hover:text-slate-900 underline"
            >
              Clear filters
            </button>
          </motion.div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Task ID
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Task Name
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Department
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {currentTasks.map((task, index) => (
                    <motion.tr
                      key={task.task_id}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ ...smoothTransition, delay: index * 0.02 }}
                      className="hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <IoDocumentText className="text-slate-400" size={14} />
                          <span className="font-mono text-sm text-slate-900">
                            {task.task_id}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div 
                          className="text-sm text-slate-900 cursor-pointer"
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
                                <div className="text-xs text-slate-500 bg-slate-50 p-2 rounded border border-slate-100">
                                  <div className="flex items-center gap-1 mb-1">
                                    <IoPerson size={10} className="text-slate-400" />
                                    <span className="font-medium">Task ID:</span> {task.task_id}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <span className="font-medium">Department:</span> {task.task_dept || 'Not assigned'}
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${deptColors[task.task_dept] || deptColors.default}`}>
                          {task.task_dept || 'Unassigned'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => toggleRow(task.task_id)}
                            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors"
                          >
                            <IoEllipsisVertical size={16} />
                          </button>
                          <button
                            onClick={() => setTaskToDelete(task)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
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
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={smoothTransition}
            className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 pt-6 border-t border-slate-200"
          >
            <div className="text-sm text-slate-500">
              Showing {(currentPage - 1) * tasksPerPage + 1} to {Math.min(currentPage * tasksPerPage, filteredTasks.length)} of {filteredTasks.length} tasks
            </div>
            
            <div className="flex items-center gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => p - 1)}
                className="p-2 rounded border border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <IoChevronBack size={14} />
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
                        className={`w-8 h-8 text-sm rounded transition-colors ${
                          currentPage === i 
                            ? 'bg-slate-900 text-white' 
                            : 'text-slate-700 hover:bg-slate-100'
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
                className="p-2 rounded border border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <IoChevronForward size={14} />
              </button>
            </div>
          </motion.div>
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
              className="absolute inset-0 bg-black/20 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.95, opacity: 0 }} 
              transition={smoothTransition}
              className="relative bg-white rounded-lg p-6 max-w-sm w-full shadow-lg border border-slate-200"
            >
              <div className="text-center">
                <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <IoTrash size={20} />
                </div>
                <h3 className="text-lg font-medium text-slate-900 mb-2">Delete Task</h3>
                <p className="text-sm text-slate-600 mb-6">
                  Are you sure you want to delete <span className="font-semibold">{taskToDelete.task_name}</span>? This action cannot be undone.
                </p>
                <div className="flex gap-3">
                  <button 
                    onClick={() => setTaskToDelete(null)} 
                    className="flex-1 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={() => { onDeleteTask(taskToDelete.task_id); setTaskToDelete(null); }} 
                    className="flex-1 py-2 bg-red-600 text-white rounded font-medium hover:bg-red-700 transition-colors"
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