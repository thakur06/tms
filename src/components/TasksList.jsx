import { motion, AnimatePresence } from 'framer-motion';
import { 
  IoFilter, 
  IoPerson, 
  IoTrash,
  IoClose,
  IoChevronDown,
  IoChevronUp
} from 'react-icons/io5';
import { useState } from 'react';

export default function TasksList({ tasks, onDeleteTask }) {
  const [filterDept, setFilterDept] = useState('All');
  const [showAllTasks, setShowAllTasks] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Professional color palette for departments
const deptColors = {
  'Process': 'bg-blue-100 text-blue-800 border border-blue-200',
  'Product Development': 'bg-violet-100 text-violet-800 border border-violet-200',
  'Business Development': 'bg-fuchsia-100 text-fuchsia-800 border border-fuchsia-200',
  'Document Controls': 'bg-emerald-100 text-emerald-800 border border-emerald-200',
  'Project Controls': 'bg-amber-100 text-amber-800 border border-amber-200',
  'Electrical': 'bg-rose-100 text-rose-800 border border-rose-200',
  'Mechanical': 'bg-indigo-100 text-indigo-800 border border-indigo-200',
  'Controls': 'bg-slate-100 text-slate-800 border border-slate-200',
  'IT': 'bg-cyan-100 text-cyan-800 border border-cyan-200',
  'Management': 'bg-purple-100 text-purple-800 border border-purple-200',
  'default': 'bg-gray-100 text-gray-800 border border-gray-200'
};

  const getDeptColor = (dept) => {
    return deptColors[dept] || deptColors.default;
  };

  // Get unique departments for filter
  const uniqueDepts = ['All', ...new Set(tasks.map(task => task.task_dept).filter(Boolean))];

  // Filter tasks based on selected department
  const filteredTasks = filterDept === 'All' 
    ? tasks 
    : tasks.filter(task => task.task_dept === filterDept);

  // Limit tasks to 6 by default (2 rows of 3)
  const initialTasksCount = 6;
  const displayedTasks = showAllTasks ? filteredTasks : filteredTasks.slice(0, initialTasksCount);

  const handleDeleteClick = (task) => {
    setTaskToDelete(task);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    if (taskToDelete && onDeleteTask) {
      onDeleteTask(taskToDelete.task_id || taskToDelete.id);
    }
    setShowDeleteModal(false);
    setTaskToDelete(null);
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setTaskToDelete(null);
  };

  return (
    <>
      <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium tracking-wider uppercase">Task Management</p>
                <h2 className="text-2xl font-bold text-slate-900">Active Tasks</h2>
              </div>
            </div>
            <div className="flex items-center gap-3 mt-2">
              <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-sm font-medium">
                {filteredTasks.length} tasks
              </span>
              {filterDept !== 'All' && (
                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                  Filtered by: {filterDept}
                </span>
              )}
            </div>
          </div>

          {/* Filter Dropdown */}
          <div className="relative">
            <div className="flex items-center gap-3">
              <div className="relative">
                <select
                  value={filterDept}
                  onChange={(e) => setFilterDept(e.target.value)}
                  className="appearance-none px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 hover:border-slate-300 hover:shadow-sm transition-all duration-300 pl-10 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {uniqueDepts.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
                <IoFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <IoChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        {/* Tasks Grid */}
        <div className="mb-6">
          {filteredTasks.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 mx-auto bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl flex items-center justify-center mb-6">
                <svg className="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-700 mb-2">No tasks found</h3>
              <p className="text-sm text-slate-500 max-w-md mx-auto">
                {filterDept === 'All' 
                  ? 'No tasks available. Create your first task to get started.'
                  : `No tasks found in ${filterDept} department. Try a different filter.`
                }
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {displayedTasks.map((task, index) => (
                <motion.div
                  key={task.task_id || task.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ 
                    y: -2,
                    boxShadow: "0 8px 20px rgba(0, 0, 0, 0.06)"
                  }}
                  className="group relative bg-white border border-slate-200 rounded-xl hover:border-slate-300 transition-all duration-300"
                >
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        {/* Task Name */}
                        <h4 className="text-base font-semibold text-slate-900 mb-3 line-clamp-2 leading-tight">
                          {task.task_name || task.name}
                        </h4>
                        
                        {/* Department Badge */}
                        <div className="flex items-center gap-2 mb-4">
                          <div className={`px-3 py-1.5 rounded-lg text-xs font-medium ${getDeptColor(task.task_dept)}`}>
                            <div className="flex items-center gap-1.5">
                              <IoPerson className="w-3 h-3" />
                              {task.task_dept}
                            </div>
                          </div>
                          
                          {task.status && (
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              task.status === 'active' 
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : task.status === 'pending'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-slate-50 text-slate-700 border border-slate-200'
                            }`}>
                              {task.status}
                            </span>
                          )}
                        </div>
                        
                        {/* Task ID */}
                        {task.task_id && (
                          <p className="text-xs text-slate-500">
                            ID: {task.task_id}
                          </p>
                        )}
                      </div>
                      
                      {/* Delete Button */}
                      <button 
                        onClick={() => handleDeleteClick(task)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 flex-shrink-0"
                        title="Delete Task"
                      >
                        <IoTrash className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* View All Toggle */}
        {filteredTasks.length > initialTasksCount && (
          <div className="flex justify-center mt-6">
            <button 
              onClick={() => setShowAllTasks(!showAllTasks)}
              className="px-5 py-3 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 hover:border-slate-300 hover:shadow-sm transition-all duration-300 flex items-center gap-2 group"
            >
              {showAllTasks ? (
                <>
                  <IoChevronUp className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" />
                  Show Less
                </>
              ) : (
                <>
                  View All Tasks ({filteredTasks.length - initialTasksCount} more)
                  <IoChevronDown className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
                </>
              )}
            </button>
          </div>
        )}

        {/* Department Statistics */}
        {filteredTasks.length > 0 && (
          <div className="mt-8 pt-6 border-t border-slate-200">
            <h3 className="text-sm font-semibold text-slate-900 mb-4">Tasks by Department</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {Object.entries(
                filteredTasks.reduce((acc, task) => {
                  const dept = task.task_dept || 'Unassigned';
                  acc[dept] = (acc[dept] || 0) + 1;
                  return acc;
                }, {})
              )
              .sort((a, b) => b[1] - a[1])
              .slice(0, 8)
              .map(([dept, count]) => (
                <div key={dept} className="bg-gradient-to-br from-slate-50 to-white p-4 rounded-xl border border-slate-200">
                  <div className="flex items-center justify-between mb-2">
                    <div className={`w-8 h-8 rounded-lg ${getDeptColor(dept)} flex items-center justify-center`}>
                      <IoPerson className="w-4 h-4" />
                    </div>
                    <span className="text-lg font-bold text-slate-900">{count}</span>
                  </div>
                  <p className="text-xs text-slate-700 font-medium truncate">{dept}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && taskToDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="p-6 border-b border-slate-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
                      <IoTrash className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">Delete Task</h3>
                      <p className="text-sm text-slate-600">This action cannot be undone</p>
                    </div>
                  </div>
                  <button
                    onClick={cancelDelete}
                    className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <IoClose className="w-5 h-5 text-slate-400" />
                  </button>
                </div>
              </div>

              <div className="p-6">
                <div className="mb-6">
                  <p className="text-slate-700 mb-3">
                    Are you sure you want to delete this task?
                  </p>
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-lg ${getDeptColor(taskToDelete.task_dept)} flex items-center justify-center`}>
                        <IoPerson className="w-6 h-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-900 truncate">
                          {taskToDelete.task_name || taskToDelete.name}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-sm text-slate-600">{taskToDelete.task_dept}</span>
                          {taskToDelete.task_id && (
                            <span className="text-xs text-slate-500">• ID: {taskToDelete.task_id}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 text-red-600 mt-0.5">⚠️</div>
                    <div>
                      <p className="text-sm font-medium text-red-800 mb-1">Important Notice</p>
                      <p className="text-sm text-red-700">
                        This task will be permanently deleted along with all associated time entries and data.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={cancelDelete}
                    className="flex-1 px-4 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-all duration-200 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDelete}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition-all duration-200 font-medium shadow-sm hover:shadow flex items-center justify-center"
                  >
                    <IoTrash className="w-4 h-4 mr-2" />
                    Delete Task
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}