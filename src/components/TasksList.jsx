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
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [expandedRow, setExpandedRow] = useState(null);

  const tasksPerPage = 15;

  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      const matchesSearch = (t.task_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.task_id || '').toString().includes(searchQuery);
      return matchesSearch;
    });
  }, [tasks, searchQuery]);

  const totalPages = Math.ceil(filteredTasks.length / tasksPerPage);
  const currentTasks = filteredTasks.slice((currentPage - 1) * tasksPerPage, currentPage * tasksPerPage);

  useEffect(() => setCurrentPage(1), [searchQuery]);

  const toggleRow = (taskId) => {
    setExpandedRow(expandedRow === taskId ? null : taskId);
  };

  return (
    <div className="space-y-6">
      {/* Controls Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-(--text-main) uppercase tracking-tight flex items-center gap-2">
            Tasks Repository
          </h2>
          <p className="text-[10px] text-(--text-muted) mt-1 font-black uppercase tracking-widest italic leading-none">
            Manage and track all unit objectives
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
          {headerAction}
          <div className="relative w-full sm:w-64">
            <IoSearchOutline className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="ui-input pl-10 py-2 h-10 w-full bg-(--input-bg) border-(--glass-border) text-(--text-main) placeholder-(--text-muted) focus:border-(--primary)"
            />
          </div>
        </div>
      </div>

      {/* Minimalist Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {currentTasks.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="col-span-full text-center py-20 bg-(--hover-bg) rounded-3xl border border-dashed border-(--glass-border)"
          >
            <IoLayersOutline size={40} className="text-(--text-muted) mx-auto mb-4" />
            <h3 className="text-lg font-bold text-(--text-main)">No tasks found</h3>
            <p className="text-(--text-muted) text-sm">Try adjusting your search query</p>
          </motion.div>
        ) : (
          currentTasks.map((task, index) => (
            <motion.div
              key={task.task_id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="group bg-(--hover-bg) p-4 rounded-xl border border-(--glass-border) hover:border-(--primary-glow) hover:shadow-lg hover:shadow-(--primary-glow) transition-all flex flex-col gap-3 relative"
            >
              <div className="flex items-start justify-between">
                <div className="w-8 h-8 rounded-lg bg-(--primary-glow) flex items-center justify-center text-(--primary) group-hover:bg-(--primary) group-hover:text-(--text-inverse) transition-all shrink-0">
                  <IoDocumentText size={16} />
                </div>
                <button
                  onClick={() => setTaskToDelete(task)}
                  className="p-1.5 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                  title="Delete Task"
                >
                  <IoTrash size={14} />
                </button>
              </div>

              <div className="space-y-1">
                <h4 className="font-bold text-(--text-main) text-sm line-clamp-2 group-hover:text-(--primary) transition-colors leading-tight">
                  {task.task_name}
                </h4>
                <div className="mt-2">
                  <span className="text-[9px] font-black text-(--text-muted) uppercase tracking-widest bg-(--hover-bg) px-1.5 py-0.5 rounded border border-(--glass-border) italic">
                    #{task.task_id}
                  </span>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 border-t border-white/5 bg-white/5 rounded-xl">
          <div className="text-sm text-(--text-muted) font-medium italic">
            Showing <span className="text-(--text-main) font-black">{(currentPage - 1) * tasksPerPage + 1}</span> to <span className="text-(--text-main) font-black">{Math.min(currentPage * tasksPerPage, filteredTasks.length)}</span> of <span className="text-(--text-main) font-black">{filteredTasks.length}</span> tasks
          </div>

          <div className="flex items-center gap-2">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => p - 1)}
              className="p-2 rounded-lg border border-(--glass-border) text-(--text-muted) hover:bg-(--hover-bg) hover:text-(--text-main) disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
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
                      className={`w-8 h-8 text-sm font-black rounded-lg transition-all ${currentPage === i
                        ? 'bg-(--gradient-primary) text-(--text-inverse) shadow-lg shadow-(--primary-glow)'
                        : 'text-(--text-muted) hover:bg-(--hover-bg) hover:text-(--text-main)'
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
              className="p-2 rounded-lg border border-(--glass-border) text-(--text-muted) hover:bg-(--hover-bg) hover:text-(--text-main) disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <IoChevronForward size={16} />
            </button>
          </div>
        </div>
      )}

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
              className="relative w-full max-w-sm ui-modal p-6 shadow-2xl bg-(--app-bg) border-(--glass-border)"
            >
              <div className="text-center">
                <div className="w-14 h-14 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/20">
                  <IoTrash size={24} />
                </div>
                <h3 className="text-xl font-black text-(--text-main) mb-2">Delete Task</h3>
                <p className="text-sm text-(--text-muted) mb-6 leading-relaxed font-medium">
                  Are you sure you want to delete <span className="text-(--text-main) font-black">{taskToDelete.task_name}</span>? This action cannot be undone.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setTaskToDelete(null)}
                    className="flex-1 py-2.5 text-sm font-black text-(--text-muted) hover:text-(--text-main) hover:bg-(--hover-bg) rounded-xl transition-all uppercase tracking-wider"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => { onDeleteTask(taskToDelete.task_id); setTaskToDelete(null); }}
                    className="flex-1 py-2.5 bg-red-600 text-white rounded-xl font-black hover:bg-red-700 shadow-lg shadow-red-500/20 transition-all uppercase tracking-wider"
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