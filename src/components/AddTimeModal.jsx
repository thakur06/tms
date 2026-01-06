import { useState, useEffect, useRef } from "react";
import {
  IoTime,
  IoLocation,
  IoDocumentText,
  IoCheckmarkCircle,
  IoClose,
  IoSearch,
  IoFilter,
  IoBusiness,
  IoGlobe,
  IoFolder,
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
  clients
}) {
  const isEditMode = !!entry;

  const [selectedTask, setSelectedTask] = useState("");
  const [selectedProject, setSelectedProject] = useState("");
  const [selectedClient, setSelectedClient] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("US");
  const [remarks, setRemarks] = useState("");
  const [hours, setHours] = useState("");
  const [minutes, setMinutes] = useState("");
  const [searchTask, setSearchTask] = useState("");
  const [showTaskDropdown, setShowTaskDropdown] = useState(false);
  const [searchProject, setSearchProject] = useState("");
  const [showProjectDropdown, setShowProjectDropdown] = useState(false);
  const [searchClient, setSearchClient] = useState("");
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedDept, setSelectedDept] = useState("all");

  const taskDropdownRef = useRef(null);
  const projectDropdownRef = useRef(null);
  const clientDropdownRef = useRef(null);

  // Country options
  const countryOptions = [
    { value: "US", label: "United States" },
    { value: "IND", label: "India" }
  ];

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
        if (selectedDept !== "all" && task.task_dept !== selectedDept) {
          return false;
        }
        if (searchTask) {
          const searchLower = searchTask.toLowerCase();
          return (
            task.task_name.toLowerCase().includes(searchLower) ||
            (task.task_dept && task.task_dept.toLowerCase().includes(searchLower))
          );
        }
        return true;
      })
    : [];

  // Filter projects based on search
  const filteredProjects = projects
    ? searchProject
      ? projects.filter(project =>
          project.name.toLowerCase().includes(searchProject.toLowerCase()) ||
          project.code?.toLowerCase().includes(searchProject.toLowerCase())
        )
      : projects
    : [];

  // Filter clients based on search
  const filteredClients = clients
    ? searchClient
      ? clients.filter(client =>
          client.name.toLowerCase().includes(searchClient.toLowerCase()) ||
          client.code?.toLowerCase().includes(searchClient.toLowerCase())
        )
      : clients
    : [];

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen && entry) {
      setSelectedTask(entry.taskName || entry.taskId || "");
      setSelectedProject(entry.project || "");
      setSelectedClient(entry.client || "");
      setSelectedCountry(entry.country || "US");
      setRemarks(entry.remarks || "");

      let totalMinutes = 0;
      if (entry.hours !== undefined || entry.minutes !== undefined) {
        totalMinutes =
          (Number(entry.hours) || 0) * 60 + (Number(entry.minutes) || 0);
      } else if (entry.minutes !== undefined && entry.minutes !== null) {
        totalMinutes = Number(entry.minutes);
      }

      setHours(Math.floor(totalMinutes / 60) || "");
      setMinutes(totalMinutes % 60 || "");
      setSearchTask(entry.taskName || "");
      setSearchProject(entry.project || "");
      setSearchClient(entry.client || "");

      const task = tasks?.find(
        (t) => t.task_name === entry.taskName || t.task_id === entry.taskId
      );
      if (task?.task_dept) {
        setSelectedDept(task.task_dept);
      }
    } else if (isOpen && !entry) {
      setSelectedTask("");
      setSelectedProject("");
      setSelectedClient("");
      setSelectedCountry("US");
      setRemarks("");
      setHours("");
      setMinutes("");
      setSearchTask("");
      setSearchProject("");
      setSearchClient("");
      setSelectedDept("all");
    }
    setIsSubmitting(false);
  }, [entry, isOpen, tasks, projects, clients]);

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
      if (
        clientDropdownRef.current &&
        !clientDropdownRef.current.contains(event.target)
      ) {
        setShowClientDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isSubmitting) return;

    const totalHours = Number(hours) || 0;
    const totalMinutesValue = Number(minutes) || 0;
    const totalTimeInMinutes = (totalHours * 60) + totalMinutesValue;
    
    if (!selectedTask || totalTimeInMinutes === 0) {
      toast.error('Please select a task and enter time', {
        position: "top-center",
        autoClose: 3000,
        theme: "colored",
      });
      return;
    }

    setIsSubmitting(true);

    const taskName = selectedTask;
    const payload = {
      taskName: taskName,
      hours: totalHours,
      minutes: totalMinutesValue,
      project: selectedProject,
      project_code: selectedProject ? filteredProjects.find(p => p.name === selectedProject)?.code || "" : "",
      client: selectedClient,
      country: selectedCountry,
      remarks: remarks,
      entry_date: dateStr,
    };

    try {
      if (isEditMode && entry?.id) {
        await onUpdate(entry.id, payload);
        toast.success('Time entry updated successfully!', {
          position: "top-center",
          autoClose: 3000,
          theme: "colored",
        });
      } else {
        const addPayload = { ...payload, user: selectedUser };
        await onAdd(dateStr, selectedTask, totalHours, totalMinutesValue, addPayload);
        toast.success('Time entry added successfully!', {
          position: "top-center",
          autoClose: 3000,
          theme: "colored",
        });
      }

      handleClose();
    } catch (error) {
      console.error('Error saving time entry:', error);
      toast.error('Failed to save time entry. Please try again.', {
        position: "top-center",
        autoClose: 5000,
        theme: "colored",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedTask('');
    setSelectedProject('');
    setSelectedClient('');
    setSelectedCountry('US');
    setRemarks('');
    setHours('');
    setMinutes('');
    setSearchTask('');
    setSearchProject('');
    setSearchClient('');
    setShowTaskDropdown(false);
    setShowProjectDropdown(false);
    setShowClientDropdown(false);
    setSelectedDept('all');
    onClose();
  };

  const handleTaskSelect = (taskName) => {
    setSelectedTask(taskName);
    setSearchTask(taskName);
    setShowTaskDropdown(false);
  };

  const handleProjectSelect = (projectName) => {
    setSelectedProject(projectName);
    setSearchProject(projectName);
    setShowProjectDropdown(false);
  };

  const handleClientSelect = (clientName) => {
    setSelectedClient(clientName);
    setSearchClient(clientName);
    setShowClientDropdown(false);
  };

  const departmentOptions = getUniqueDepartments();

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center">
            <IoTime className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              {isEditMode ? "Edit Time Entry" : "Add Time Entry"}
            </h2>
            <p className="text-sm text-slate-500 mt-0.5">
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
      <div className="space-y-5">
        {/* User Info */}
        <div className="rounded-lg bg-slate-50 border border-slate-200 p-3">
          <p className="text-xs font-medium text-slate-600 uppercase tracking-wider mb-1">
            Logged By
          </p>
          <p className="text-base font-semibold text-slate-900">
            {selectedUser || entry?.user || "Not specified"}
          </p>
        </div>

        {/* Task Selection */}
        <div className="relative" ref={taskDropdownRef}>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-slate-700">
              Task <span className="text-red-500">*</span>
            </label>
            {tasks && tasks.length > 0 && (
              <div className="relative">
                <select
                  value={selectedDept}
                  onChange={(e) => {
                    setSelectedDept(e.target.value);
                    setShowTaskDropdown(true);
                  }}
                  className="px-2 py-1 bg-white border border-slate-300 rounded text-slate-700 text-xs focus:outline-none focus:ring-1 focus:ring-slate-500 focus:border-slate-500"
                >
                  {departmentOptions.map((dept) => (
                    <option key={dept.value} value={dept.value}>
                      {dept.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="relative">
            <IoSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-500 focus:border-slate-500 transition-all"
              placeholder="Search for a task..."
              value={searchTask}
              onChange={(e) => {
                setSearchTask(e.target.value);
                setShowTaskDropdown(true);
                if (
                  selectedTask &&
                  e.target.value !== selectedTask
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
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <IoClose className="w-4 h-4" />
              </button>
            )}
          </div>

          {showTaskDropdown && filteredTasks.length > 0 && (
            <div className="absolute z-50 w-full mt-1 max-h-60 overflow-y-auto border border-slate-300 rounded-lg bg-white shadow-lg">
              <div className="py-1">
                {filteredTasks.map((task) => (
                  <button
                    key={task.task_id}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleTaskSelect(task.task_name);
                    }}
                    disabled={isSubmitting}
                    className={`w-full text-left px-3 py-2 text-sm transition-all ${
                      selectedTask === task.task_name
                        ? "bg-slate-100 border-l-2 border-slate-600"
                        : "hover:bg-slate-50 border-l-2 border-transparent"
                    } ${isSubmitting ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                  >
                    <div className="font-medium text-slate-900">
                      {task.task_name}
                    </div>
                    {task.task_dept && (
                      <div className="text-xs text-slate-500 mt-0.5">
                        {task.task_dept}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Project Selection */}
        <div className="relative" ref={projectDropdownRef}>
          <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-1">
            <IoFolder className="w-3 h-3" />
            Project
          </label>
          <div className="relative">
            <IoSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-500 focus:border-slate-500 transition-all"
              placeholder="Search for a project..."
              value={searchProject}
              onChange={(e) => {
                setSearchProject(e.target.value);
                setShowProjectDropdown(true);
                if (selectedProject && e.target.value !== selectedProject) {
                  setSelectedProject("");
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
                  setSearchProject("");
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <IoClose className="w-4 h-4" />
              </button>
            )}
          </div>

          {showProjectDropdown && filteredProjects.length > 0 && (
            <div className="absolute z-50 w-full mt-1 max-h-60 overflow-y-auto border border-slate-300 rounded-lg bg-white shadow-lg">
              <div className="py-1">
                <div className="px-3 py-2 bg-slate-50 border-b border-slate-200">
                  <p className="text-xs text-slate-600">
                    Showing {filteredProjects.length} project{filteredProjects.length !== 1 ? "s" : ""}
                  </p>
                </div>
                {filteredProjects.slice(0, 3).map((project) => (
                  <button
                    key={project.id || project.name}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleProjectSelect(project.name);
                    }}
                    disabled={isSubmitting}
                    className={`w-full text-left px-3 py-2 text-sm transition-all ${
                      selectedProject === project.name
                        ? "bg-slate-100 border-l-2 border-slate-600"
                        : "hover:bg-slate-50 border-l-2 border-transparent"
                    } ${isSubmitting ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                  >
                    <div className="font-medium text-slate-900">
                      {project.name}
                    </div>
                    {project.code && (
                      <div className="text-xs text-slate-500 mt-0.5">
                        Code: {project.code}
                      </div>
                    )}
                  </button>
                ))}
                {filteredProjects.length > 3 && (
                  <>
                    <div className="px-3 py-1 border-t border-slate-200">
                      <p className="text-xs text-slate-500 text-center">
                        Scroll for more ({filteredProjects.length - 3} more)
                      </p>
                    </div>
                    {filteredProjects.slice(3).map((project) => (
                      <button
                        key={project.id || project.name}
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleProjectSelect(project.name);
                        }}
                        disabled={isSubmitting}
                        className={`w-full text-left px-3 py-2 text-sm transition-all ${
                          selectedProject === project.name
                            ? "bg-slate-100 border-l-2 border-slate-600"
                            : "hover:bg-slate-50 border-l-2 border-transparent"
                        } ${isSubmitting ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                      >
                        <div className="font-medium text-slate-900">
                          {project.name}
                        </div>
                      </button>
                    ))}
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Client Selection */}
        <div className="relative" ref={clientDropdownRef}>
          <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-1">
            <IoBusiness className="w-3 h-3" />
            Client
          </label>
          <div className="relative">
            <IoSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-500 focus:border-slate-500 transition-all"
              placeholder="Search for a client..."
              value={searchClient}
              onChange={(e) => {
                setSearchClient(e.target.value);
                setShowClientDropdown(true);
                if (selectedClient && e.target.value !== selectedClient) {
                  setSelectedClient("");
                }
              }}
              onFocus={() => setShowClientDropdown(true)}
              disabled={isSubmitting}
              autoComplete="off"
            />
            {selectedClient && (
              <button
                type="button"
                onClick={() => {
                  setSelectedClient("");
                  setSearchClient("");
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <IoClose className="w-4 h-4" />
              </button>
            )}
          </div>

          {showClientDropdown && filteredClients.length > 0 && (
            <div className="absolute z-50 w-full mt-1 max-h-60 overflow-y-auto border border-slate-300 rounded-lg bg-white shadow-lg">
              <div className="py-1">
                <div className="px-3 py-2 bg-slate-50 border-b border-slate-200">
                  <p className="text-xs text-slate-600">
                    Showing {filteredClients.length} client{filteredClients.length !== 1 ? "s" : ""}
                  </p>
                </div>
                {filteredClients.slice(0, 3).map((client) => (
                  <button
                    key={client.id || client.name}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleClientSelect(client.name);
                    }}
                    disabled={isSubmitting}
                    className={`w-full text-left px-3 py-2 text-sm transition-all ${
                      selectedClient === client.name
                        ? "bg-slate-100 border-l-2 border-slate-600"
                        : "hover:bg-slate-50 border-l-2 border-transparent"
                    } ${isSubmitting ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                  >
                    <div className="font-medium text-slate-900">
                      {client.name}
                    </div>
                    {client.code && (
                      <div className="text-xs text-slate-500 mt-0.5">
                        Code: {client.code}
                      </div>
                    )}
                  </button>
                ))}
                {filteredClients.length > 3 && (
                  <>
                    <div className="px-3 py-1 border-t border-slate-200">
                      <p className="text-xs text-slate-500 text-center">
                        Scroll for more ({filteredClients.length - 3} more)
                      </p>
                    </div>
                    {filteredClients.slice(3).map((client) => (
                      <button
                        key={client.id || client.name}
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleClientSelect(client.name);
                        }}
                        disabled={isSubmitting}
                        className={`w-full text-left px-3 py-2 text-sm transition-all ${
                          selectedClient === client.name
                            ? "bg-slate-100 border-l-2 border-slate-600"
                            : "hover:bg-slate-50 border-l-2 border-transparent"
                        } ${isSubmitting ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                      >
                        <div className="font-medium text-slate-900">
                          {client.name}
                        </div>
                      </button>
                    ))}
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Country Selection */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-1">
            <IoGlobe className="w-3 h-3" />
            Location
          </label>
          <div className="relative">
            <select
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(e.target.value)}
              className="w-fit md:w-full px-3 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-500 focus:border-slate-500 appearance-none cursor-pointer"
              disabled={isSubmitting}
            >
              {countryOptions.map((country) => (
                <option key={country.value} value={country.value}>
                  {country.label}
                </option>
              ))}
            </select>
            <div className="hidden md:block absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>

        {/* Time Input */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Time Spent <span className="text-red-500">*</span>
          </label>
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="24"
                  placeholder="0"
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-center text-lg font-semibold focus:outline-none focus:ring-1 focus:ring-slate-500 focus:border-slate-500"
                  value={hours}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 0;
                    setHours(value > 24 ? 24 : value);
                  }}
                  disabled={isSubmitting}
                />
                <p className="text-xs text-slate-500 text-center mt-1">
                  HOURS
                </p>
              </div>
            </div>
            <div className="text-xl font-semibold text-slate-400 pb-5">:</div>
            <div className="flex-1">
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="59"
                  placeholder="0"
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-center text-lg font-semibold focus:outline-none focus:ring-1 focus:ring-slate-500 focus:border-slate-500"
                  value={minutes}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 0;
                    setMinutes(value > 59 ? 59 : value);
                  }}
                  disabled={isSubmitting}
                />
                <p className="text-xs text-slate-500 text-center mt-1">
                  MINUTES
                </p>
              </div>
            </div>
          </div>

          {isEditMode && entry && (
            <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <div className="flex justify-between text-sm">
                <div>
                  <span className="text-slate-600">Previous:</span>
                  <span className="ml-2 font-medium text-slate-900">
                    {entry.hours || 0}h {entry.minutes || 0}m
                  </span>
                </div>
                <div>
                  <span className="text-slate-600">New:</span>
                  <span className="ml-2 font-medium text-slate-900">
                    {hours || 0}h {minutes || 0}m
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Remarks */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-1">
            <IoDocumentText className="w-3 h-3" />
            Remarks
          </label>
          <textarea
            className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-500 focus:border-slate-500 resize-none placeholder-slate-400"
            rows="3"
            placeholder="Add any notes or comments..."
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            disabled={isSubmitting}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4 border-t border-slate-200">
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="flex-1 px-4 py-2.5 border border-slate-300 bg-white text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex-1 px-4 py-2.5 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {isEditMode ? "Saving..." : "Adding..."}
              </>
            ) : (
              <>
                <IoCheckmarkCircle className="w-4 h-4" />
                {isEditMode ? "Save Changes" : "Add Entry"}
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}