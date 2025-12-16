import { useState, useEffect, useRef } from "react";
import {
  IoTime,
  IoFolder,
  IoLocation,
  IoDocumentText,
  IoCheckmarkCircle,
  IoClose,
  IoSearch,
  IoFilter,
} from "react-icons/io5";
import Modal from "./Modal";
import { toast } from "react-toastify";

export default function AddTimeModal({
  isOpen,
  onClose,
  dateStr,
  tasks,
  projects,
  selectedUser,
  onAdd,
  entry = null,
  onUpdate,
}) {
  const isEditMode = !!entry;

  const [selectedTask, setSelectedTask] = useState("");
  const [selectedProject, setSelectedProject] = useState("");
  const [selectedProjectCode, setSelectedProjectCode] = useState("");
  const [location, setLocation] = useState("");
  const [remarks, setRemarks] = useState("");
  const [hours, setHours] = useState("");
  const [minutes, setMinutes] = useState("");
  const [searchProject, setSearchProject] = useState("");
  const [showProjectDropdown, setShowProjectDropdown] = useState(false);
  const [searchTask, setSearchTask] = useState("");
  const [showTaskDropdown, setShowTaskDropdown] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New state for department filtering
  const [selectedDept, setSelectedDept] = useState("all");

  const taskDropdownRef = useRef(null);
  const projectDropdownRef = useRef(null);

  // Get the current task details
  const currentTask = tasks?.find(
    (t) => t.task_id === selectedTask || t.task_name === selectedTask
  );

  // Get unique departments from tasks
  const getUniqueDepartments = () => {
    if (!tasks) return [];

    const depts = tasks
      .map((task) => task.task_dept)
      .filter((dept) => dept && dept.trim() !== "")
      .filter((dept, index, self) => self.indexOf(dept) === index)
      .sort();

    return [
      { value: "all", label: "All Departments" },
      ...depts.map((dept) => ({ value: dept, label: dept })),
    ];
  };

  // Filter tasks based on selected department and search
  const filteredTasks = tasks
    ? tasks.filter((task) => {
        // Apply department filter
        if (selectedDept !== "all" && task.task_dept !== selectedDept) {
          return false;
        }

        // Apply search filter
        if (searchTask) {
          const searchLower = searchTask.toLowerCase();
          return (
            task.task_name.toLowerCase().includes(searchLower) ||
            (task.task_dept &&
              task.task_dept.toLowerCase().includes(searchLower))
          );
        }

        return true;
      })
    : [];

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen && entry) {
      // Pre-fill form with existing entry data
      // Use taskName directly from entry
      setSelectedTask(entry.taskName || entry.taskId || "");
      setSelectedProject(entry.project || "");
      setSelectedProjectCode(entry.project_code);
      setLocation(entry.location || "");
      setRemarks(entry.remarks || "");

      // Convert total minutes to hours and minutes
      let totalMinutes = 0;

      if (entry.hours !== undefined || entry.minutes !== undefined) {
        totalMinutes =
          (Number(entry.hours) || 0) * 60 + (Number(entry.minutes) || 0);
      } else if (entry.minutes !== undefined && entry.minutes !== null) {
        totalMinutes = Number(entry.minutes);
      }

      setHours(Math.floor(totalMinutes / 60) || "");
      setMinutes(totalMinutes % 60 || "");

      // Set search fields to show current values
      // Use taskName from entry
      setSearchTask(entry.taskName || "");
      setSearchProject(entry.project || "");

      // If editing, set department filter to match the task's department
      const task = tasks?.find(
        (t) => t.task_name === entry.taskName || t.task_id === entry.taskId
      );
      if (task?.task_dept) {
        setSelectedDept(task.task_dept);
      }
    } else if (isOpen && !entry) {
      // Reset for new entry
      setSelectedTask("");
      setSelectedProject("");
      setSelectedProjectCode("");
      setLocation("");
      setRemarks("");
      setHours("");
      setMinutes("");
      setSearchProject("");
      setSearchTask("");
      setSelectedDept("all");
    }
    setIsSubmitting(false);
  }, [entry, isOpen, tasks]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        taskDropdownRef.current &&
        !taskDropdownRef.current.contains(event.target)
      ) {
        setShowTaskDropdown(false);
      }
      if (
        projectDropdownRef.current &&
        !projectDropdownRef.current.contains(event.target)
      ) {
        setShowProjectDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredProjects = projects
    ? searchProject
      ? projects.filter(
          (p) =>
            p.name.toLowerCase().includes(searchProject.toLowerCase()) ||
            p.location?.toLowerCase().includes(searchProject.toLowerCase())
        )
      : projects
    : [];

    const handleSubmit = async (e) => {
      e.preventDefault()
    
      if (isSubmitting) return
    
      const totalHours = Number(hours) || 0
      const totalMinutesValue = Number(minutes) || 0
      const totalTimeInMinutes = (totalHours * 60) + totalMinutesValue
      
      if (!selectedTask || totalTimeInMinutes === 0) {
        toast.error('Please select a task and enter time', {
          position: "top-center",
          autoClose: 3000,
          theme: "colored",
        })
        return
      }
    
      setIsSubmitting(true)
    
      // Use selectedTask directly (it's the task name)
      const taskName = selectedTask // selectedTask is already the task name
    
      const payload = {
        taskName: taskName, // Send task name directly
        hours: totalHours,
        minutes: totalMinutesValue,
        project: selectedProject,
        project_code: selectedProjectCode,
        location,
        remarks,
        entry_date: dateStr,
      }
    
      try {
        if (isEditMode && entry?.id) {
          await onUpdate(entry.id, payload)
          toast.success('Time entry updated successfully!', {
            position: "top-center",
            autoClose: 3000,
            theme: "colored",
          })
        } else {
          const addPayload = { ...payload, user: selectedUser }
          // Pass selectedTask as task name
          await onAdd(dateStr, selectedTask, totalHours, totalMinutesValue, addPayload)
          toast.success('Time entry added successfully!', {
            position: "top-center",
            autoClose: 3000,
            theme: "colored",
          })
        }
    
        handleClose()
    
      } catch (error) {
        console.error('Error saving time entry:', error)
        toast.error('Failed to save time entry. Please try again.', {
          position: "top-center",
          autoClose: 5000,
          theme: "colored",
        })
      } finally {
        setIsSubmitting(false)
      }
    }

    const handleClose = () => {
      setSelectedTask('')
      setSelectedProject('')
      setSelectedProjectCode('')
      setLocation('')
      setRemarks('')
      setHours('')
      setMinutes('')
      setSearchProject('')
      setSearchTask('')
      setShowTaskDropdown(false)
      setShowProjectDropdown(false)
      onClose()
    }
  const handleTaskSelect = (taskName) => {
    setSelectedTask(taskName) // taskName is already the task name
    setSearchTask(taskName)
    setShowTaskDropdown(false)
  }

  const handleProjectSelect = (projectName, projectLocation, projectCode) => {
    setSelectedProject(projectName);
    setSelectedProjectCode(projectCode);
    setLocation(projectLocation || location);
    setSearchProject(projectName);
    setShowProjectDropdown(false);
  };

  const departmentOptions = getUniqueDepartments();

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <IoTime className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {isEditMode ? "Edit Time Entry" : "Add Time Entry"}
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {new Date(dateStr).toLocaleDateString("en-US", {
                weekday: "long",
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          </div>
        </div>
      }
    >
      <div className="space-y-6">
        {/* User Info Card */}
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 border border-indigo-100 p-4">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-200/20 to-purple-200/20 rounded-full blur-2xl" />
          <div className="relative">
            <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-1">
              Logged By
            </p>
            <p className="text-lg font-bold text-gray-900">
              {selectedUser || entry?.user || "Not specified"}
            </p>
            <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
              <IoCheckmarkCircle className="w-3 h-3" />
              Cannot be modified
            </p>
          </div>
        </div>

        {/* Task Selection with Department Filter */}
        <div className="relative" ref={taskDropdownRef}>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-semibold text-gray-900">
              Task <span className="text-red-500">*</span>
            </label>

            {/* Department Filter Dropdown */}
            {tasks && tasks.length > 0 && (
              <div className="relative">
                <div className="flex items-center gap-2">
                  <IoFilter className="w-4 h-4 text-gray-500" />
                  <select
                    value={selectedDept}
                    onChange={(e) => {
                      setSelectedDept(e.target.value);
                      setShowTaskDropdown(true);
                    }}
                    className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all appearance-none cursor-pointer pr-6"
                  >
                    {departmentOptions.map((dept) => (
                      <option key={dept.value} value={dept.value}>
                        {dept.label}{" "}
                        {dept.value === "all"
                          ? `(${tasks.length})`
                          : `(${filteredTasks.length})`}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-1 top-1/2 transform -translate-y-1/2 pointer-events-none">
                    <svg
                      className="w-4 h-4 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="relative">
            <IoSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            <input
              type="text"
              className="w-full pl-12 pr-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all"
              placeholder="Search for a task..."
              value={searchTask}
              onChange={(e) => {
                setSearchTask(e.target.value);
                setShowTaskDropdown(true);
                if (
                  selectedTask &&
                  currentTask &&
                  e.target.value !== currentTask.task_name
                ) {
                  setSelectedTask("");
                }
              }}
              onFocus={() => setShowTaskDropdown(true)}
              disabled={isSubmitting}
              autoComplete="off"
            />
            {selectedTask && (
              <button
                type="button"
                onClick={() => {
                  setSelectedTask("");
                  setSearchTask("");
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <IoClose className="w-5 h-5" />
              </button>
            )}
          </div>

          {selectedTask && currentTask && (
            <div className="mt-3 p-3 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl">
              <div className="flex items-start gap-2">
                <IoCheckmarkCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-green-900">
                    {currentTask.task_name}
                  </p>
                  {currentTask.task_dept && (
                    <p className="text-xs text-green-700 mt-1">
                      Department: {currentTask.task_dept}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {showTaskDropdown && (
            <div className="absolute z-50 w-full mt-2 max-h-64 overflow-y-auto border-2 border-gray-200 rounded-xl bg-white shadow-2xl">
              {filteredTasks.length > 0 ? (
                <div className="py-1">
                  <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
                    <p className="text-xs text-gray-600 font-medium">
                      Showing {filteredTasks.length} task
                      {filteredTasks.length !== 1 ? "s" : ""}
                      {selectedDept !== "all" && ` in ${selectedDept}`}
                    </p>
                  </div>
                  {filteredTasks.map((task) => (
                    <button
                      key={task.task_id}
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleTaskSelect(task.task_name); // Pass task name only
                      }}
                      disabled={isSubmitting}
                      className={`w-full text-left px-4 py-3 transition-all ${
                        selectedTask === task.task_name // Compare with task name
                          ? "bg-indigo-50 border-l-4 border-indigo-500"
                          : "hover:bg-gray-50 border-l-4 border-transparent"
                      } ${
                        isSubmitting
                          ? "opacity-50 cursor-not-allowed"
                          : "cursor-pointer"
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="font-medium text-gray-900">
                          {task.task_name}
                        </div>
                        {task.task_dept && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 ml-2">
                            {task.task_dept}
                          </span>
                        )}
                      </div>
                      {task.task_dept && (
                        <div className="text-xs text-gray-500 mt-1">
                          Department: {task.task_dept}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center">
                  <p className="text-sm text-gray-500">No tasks found</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {selectedDept !== "all"
                      ? `Try a different search term or select a different department`
                      : `Try a different search term`}
                  </p>
                  {selectedDept !== "all" && (
                    <button
                      type="button"
                      onClick={() => setSelectedDept("all")}
                      className="mt-2 text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                    >
                      Show all departments
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Project Selection */}
        <div className="relative" ref={projectDropdownRef}>
          <label className="block text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
            <IoFolder className="w-4 h-4 text-gray-500" />
            Project Name
            <span className="text-xs font-normal text-gray-500">
              (Optional)
            </span>
          </label>
          <div className="relative">
            <IoSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            <input
              type="text"
              className="w-full pl-12 pr-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all"
              placeholder="Search for a project..."
              value={searchProject}
              onChange={(e) => {
                setSearchProject(e.target.value);
                setShowProjectDropdown(true);
                if (selectedProject && e.target.value !== selectedProject) {
                  setSelectedProject("");
                  setSelectedProjectCode("");
                }
              }}
              onFocus={() => setShowProjectDropdown(true)}
              disabled={isSubmitting}
              autoComplete="off"
            />
            {selectedProject && (
              <button
                type="button"
                onClick={() => {
                  setSelectedProject("");
                  setSelectedProjectCode("");
                  setSearchProject("");
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <IoClose className="w-5 h-5" />
              </button>
            )}
          </div>

          {selectedProject && (
            <div className="mt-3 p-3 bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl">
              <div className="flex items-start gap-2">
                <IoCheckmarkCircle className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm font-semibold text-purple-900">
                  {selectedProject}
                </p>
              </div>
            </div>
          )}

          {showProjectDropdown && (
            <div className="absolute z-50 w-full mt-2 max-h-64 overflow-y-auto border-2 border-gray-200 rounded-xl bg-white shadow-2xl">
              {filteredProjects.length > 0 ? (
                <div className="py-1">
                  {filteredProjects.map((project) => (
                    <button
                      key={project.id}
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleProjectSelect(
                          project.name,
                          project.location,
                          project.code
                        );
                      }}
                      disabled={isSubmitting}
                      className={`w-full text-left px-4 py-3 transition-all ${
                        selectedProject === project.name
                          ? "bg-purple-50 border-l-4 border-purple-500"
                          : "hover:bg-gray-50 border-l-4 border-transparent"
                      } ${
                        isSubmitting
                          ? "opacity-50 cursor-not-allowed"
                          : "cursor-pointer"
                      }`}
                    >
                      <div className="font-medium text-gray-900">
                        {project.name}
                      </div>
                      {project.location && (
                        <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                          <IoLocation className="w-3 h-3" />
                          {project.location}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center">
                  <p className="text-sm text-gray-500">No projects found</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Try a different search term
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Location */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
            <IoLocation className="w-4 h-4 text-gray-500" />
            Location
            <span className="text-xs font-normal text-gray-500">
              (Optional)
            </span>
          </label>
          <input
            type="text"
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100 transition-all placeholder-gray-400"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Enter work location"
            disabled={isSubmitting}
          />
        </div>

        {/* Time Input */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
            <IoTime className="w-4 h-4 text-gray-500" />
            Time Spent <span className="text-red-500">*</span>
          </label>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="24"
                  placeholder="0"
                  className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl text-center text-2xl font-bold focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all"
                  value={hours}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 0;
                    setHours(value > 24 ? 24 : value);
                  }}
                  disabled={isSubmitting}
                />
                <p className="text-xs text-gray-500 text-center mt-2 font-medium">
                  HOURS
                </p>
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-300 pb-6">:</div>
            <div className="flex-1">
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="59"
                  placeholder="0"
                  className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl text-center text-2xl font-bold focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all"
                  value={minutes}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 0;
                    setMinutes(value > 59 ? 59 : value);
                  }}
                  disabled={isSubmitting}
                />
                <p className="text-xs text-gray-500 text-center mt-2 font-medium">
                  MINUTES
                </p>
              </div>
            </div>
          </div>

          {isEditMode && entry && (
            <div className="mt-4 p-4 bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 rounded-xl">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold text-amber-600 uppercase tracking-wider mb-1">
                    Previous
                  </p>
                  <p className="text-lg font-bold text-gray-900">
                    {entry.hours || 0}h {entry.minutes || 0}m
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-1">
                    New Total
                  </p>
                  <p className="text-lg font-bold text-indigo-600">
                    {hours || 0}h {minutes || 0}m
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {Number(hours) * 60 + Number(minutes) || 0} minutes
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Remarks */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
            <IoDocumentText className="w-4 h-4 text-gray-500" />
            Remarks
            <span className="text-xs font-normal text-gray-500">
              (Optional)
            </span>
          </label>
          <textarea
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-pink-500 focus:ring-4 focus:ring-pink-100 resize-none transition-all placeholder-gray-400"
            rows="4"
            placeholder="Add any notes, comments, or details about the work..."
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            disabled={isSubmitting}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className={`flex-1 px-6 py-4 border-2 border-gray-300 bg-white text-gray-700 rounded-xl font-semibold hover:bg-gray-50 hover:border-gray-400 transition-all ${
              isSubmitting ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className={`flex-1 px-6 py-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white rounded-xl font-bold hover:shadow-xl hover:scale-[1.02] transition-all flex items-center justify-center gap-2 ${
              isSubmitting ? "opacity-70 cursor-not-allowed" : ""
            }`}
          >
            {isSubmitting ? (
              <>
                <svg
                  className="animate-spin h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                {isEditMode ? "Updating..." : "Adding..."}
              </>
            ) : (
              <>
                <IoCheckmarkCircle className="w-5 h-5" />
                {isEditMode ? "Save Changes" : "Add Time Entry"}
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}
