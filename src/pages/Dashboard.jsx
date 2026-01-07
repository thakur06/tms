import { useEffect, useMemo, useState } from "react";
import { ToastContainer, toast, Zoom } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import StatsCards from "../components/StatsCards";
import ProjectsList from "../components/ProjectsList";
import Timeline from "../components/Timeline";
import TasksList from "../components/TasksList";
import Calendar from "../components/Calendar";
import CreateTaskModal from "../components/CreateTaskModal";
import CreateProjectModal from "../components/CreateProjectModal";
import CreateUserModal from "../components/CreateUserModal";

export default function Dashboard() {
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [tick, setTick] = useState(0);
  const [timers, setTimers] = useState(() => ({}));
  const [dept, setDept] = useState([]);
  const notifyError = (msg) =>
    toast.error(msg, {
      position: "top-center",
      autoClose: 3000,
      hideProgressBar: true,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      theme: "colored",
      transition: Zoom,
    });

  const notifySuccess = (msg) =>
    toast.success(msg, {
      position: "top-center",
      autoClose: 3000,
      hideProgressBar: true,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      theme: "colored",
      transition: Zoom,
    });

  // Helper function to transform project data from backend format to frontend format
  const transformProject = (project) => ({
    ...project,
    name: project.name || project.project_name || "Unnamed Project",
    code: project.code || project.project_code || "N/A",
    location: project.location || project.project_location || "Not specified",
  });

  // Fetch data on component mount
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch projects
        const projectsResponse = await fetch(
          "http://localhost:4000/api/projects"
        );
        if (projectsResponse.ok) {
          const projectsData = await projectsResponse.json();
          // Transform all projects to match frontend expectations
          const transformedProjects = projectsData.map(transformProject);
          setProjects(transformedProjects);
        } else {
          toast.error("Failed to fetch projects", {
            position: "top-right",
            autoClose: 3000,
            theme: "colored",
          });
        }

        // Fetch dept
        const deptResponse = await fetch("http://localhost:4000/api/dept");
        if (deptResponse.ok) {
          const deptData = await deptResponse.json();
          // Transform all projects to match frontend expectations
          const transformedDept = deptData.map(transformProject);
          const deptNames = transformedDept.map((item) => item.dept_name);
          setDept(deptNames); // Store array of names
          
        } else {
          toast.error("Failed to fetch dept", {
            position: "top-right",
            autoClose: 3000,
            theme: "colored",
          });
        }

        // Fetch tasks
        const tasksResponse = await fetch("http://localhost:4000/api/tasks");
        if (tasksResponse.ok) {
          const tasksData = await tasksResponse.json();
          setTasks(tasksData);

          // Initialize timers for tasks
          const initialTimers = tasksData.reduce((acc, task) => {
            acc[task.task_id] = {
              running: false,
              elapsed: task.logged ? task.logged * 3600 : 0,
              startTime: null,
            };
            return acc;
          }, {});
          setTimers(initialTimers);
        } else {
          toast.error("Failed to fetch tasks", {
            position: "top-right",
            autoClose: 3000,
            theme: "colored",
          });
        }

        // Fetch timeline (mock data for now)
        setTimeline([]);

        // Fetch calendar events (mock data for now)
        setCalendarEvents([]);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load data from server", {
          position: "top-right",
          autoClose: 5000,
          theme: "colored",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const hasRunning = Object.values(timers).some((t) => t.running);
    if (!hasRunning) return;
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [timers]);

  const getElapsed = (taskId) => {
    const timer = timers[taskId];
    if (!timer) return 0;
    if (!timer.running || !timer.startTime) return timer.elapsed;
    return timer.elapsed + Math.floor((Date.now() - timer.startTime) / 1000);
  };

  const toggleTimer = (taskId) => {
    setTimers((prev) => {
      const next = { ...prev };
      const t = next[taskId];
      if (t.running) {
        const updatedElapsed =
          t.elapsed + Math.floor((Date.now() - t.startTime) / 1000);
        next[taskId] = {
          running: false,
          elapsed: updatedElapsed,
          startTime: null,
        };

        // Update the task's logged time in the database
        updateTaskLoggedTime(taskId, updatedElapsed / 3600);
      } else {
        next[taskId] = { ...t, running: true, startTime: Date.now() };
      }
      return next;
    });
  };

  const updateTaskLoggedTime = async (taskId, loggedHours) => {
    try {
      const response = await fetch(
        `http://localhost:4000/api/tasks/${taskId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ logged: loggedHours }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update task logged time");
      }
    } catch (error) {
      console.error("Error updating task logged time:", error);
      toast.error("Failed to update task time", {
        position: "top-right",
        autoClose: 3000,
        theme: "colored",
      });
    }
  };

  // Function to handle project deletion
  const handleDeleteProject = async (projectId) => {
    try {
      const response = await fetch(
        `http://localhost:4000/api/projects/${projectId}`,
        {
          method: "DELETE",
        }
      );
      console.log();
      if (response.ok) {
        // Remove project from state
        setProjects((prev) =>
          prev.filter(
            (project) => (project.id || project.project_id) !== projectId
          )
        );
        notifySuccess("Project deleted successfully!");
      } else {
        const errorData = await response.json();
        notifyError(errorData.error || "Failed to delete project");
      }
    } catch (error) {
      console.error("Error deleting project:", error);
      notifyError("Failed to delete project");
    }
  };

  // Function to handle task deletion
  const handleDeleteTask = async (taskId) => {
    try {
      const response = await fetch(
        `http://localhost:4000/api/tasks/${taskId}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        // Remove task from state
        setTasks((prev) => prev.filter((task) => task.task_id !== taskId));
        // Remove timer for this task
        setTimers((prev) => {
          const newTimers = { ...prev };
          delete newTimers[taskId];
          return newTimers;
        });
        notifySuccess("Task deleted successfully!");
      } else {
        const errorData = await response.json();
        notifyError(errorData.error || "Failed to delete task");
      }
    } catch (error) {
      console.error("Error deleting task:", error);
      notifyError("Failed to delete task");
    }
  };

  // Function to handle user deletion
  const handleDeleteUser = async (userId) => {
    try {
      const response = await fetch(
        `http://localhost:4000/api/users/${userId}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        notifySuccess("User deleted successfully!");
      } else {
        const errorData = await response.json();
        notifyError(errorData.error || "Failed to delete user");
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      notifyError("Failed to delete user");
    }
  };

  // General delete handler for header delete button
  const handleDelete = (type) => {
    switch (type) {
      case "task":
        toast.info("Select a task to delete from the Tasks List", {
          position: "top-center",
          autoClose: 3000,
        });
        break;
      case "project":
        toast.info("Click the trash icon on any project to delete it", {
          position: "top-center",
          autoClose: 3000,
        });
        break;
      case "user":
        toast.info("User deletion available in user management panel", {
          position: "top-center",
          autoClose: 3000,
        });
        break;
      default:
        toast.info("Select an item to delete from its respective section", {
          position: "top-center",
          autoClose: 3000,
        });
    }
  };

  // Add this function to handle user creation
  const handleCreateUser = async (userData) => {
    try {
      const response = await fetch("http://localhost:4000/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        notifyError(errorData.error || "Failed to create user");
        throw new Error(errorData.error || "Failed to create user");
      }

      const newUser = await response.json();
      notifySuccess("User created successfully!");
      return newUser;
    } catch (error) {
      notifyError(error.message || "Failed to create user");
      throw error;
    }
  };

  const handleCreateTask = async (taskData) => {
    try {
      const response = await fetch("http://localhost:4000/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(taskData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        notifyError(errorData.error || "Failed to create task");
        return;
      }

      const newTask = await response.json();

      setTasks([...tasks, newTask]);
      setTimers((prev) => ({
        ...prev,
        [newTask.task_id]: {
          running: false,
          elapsed: 0,
          startTime: null,
        },
      }));
      notifySuccess("Task created successfully!");
    } catch (error) {
      notifyError(error.message || "Failed to create task");
    }
  };

  const handleCreateProject = async (projectData) => {
    try {
      const response = await fetch("http://localhost:4000/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(projectData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        notifyError(errorData.error || "Failed to create project");
        return;
      }

      const newProject = await response.json();

      // Transform the project data to match frontend expectations
      const transformedProject = transformProject(newProject[0] || newProject);
      setProjects([...projects, transformedProject]);
      notifySuccess("Project created successfully!");
    } catch (error) {
      notifyError(error.message || "Failed to create project");
    }
  };

  const stats = useMemo(() => {
    const open = tasks.filter((t) => t.status !== "Done").length;
    const approvals = tasks.filter(
      (t) => t.approvals && t.approvals.length
    ).length;
    const today = calendarEvents.length;
    const totalLoggedSeconds = tasks.reduce(
      (sum, task) => sum + getElapsed(task.task_id),
      0
    );
    const utilization =
      Math.round((totalLoggedSeconds / (tasks.length * 8 * 3600)) * 100) || 0;

    const formatTime = (seconds) => {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      return `${hours}h ${minutes}m`;
    };

    return {
      open,
      approvals,
      today,
      utilization: Number.isFinite(utilization) ? utilization : 0,
      logged: formatTime(totalLoggedSeconds),
    };
  }, [tick, timers, tasks]);

  return (
    <div className="w-full relative">
      <ToastContainer
        position="top-center"
        autoClose={2000}
        limit={1}
        hideProgressBar
        newestOnTop={false}
        closeOnClick={true}
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
        transition={Zoom}
      />

      <div className="w-full relative space-y-6">
        {/* Local quick actions for creating items */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-semibold text-slate-900">
            Dashboard Overview
          </h2>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setShowTaskModal(true)}
              className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              + Task
            </button>
            <button
              onClick={() => setShowProjectModal(true)}
              className="px-3 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors"
            >
              + Project
            </button>
            <button
              onClick={() => setShowUserModal(true)}
              className="px-3 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700 transition-colors"
            >
              + User
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
          </div>
        ) : (
          <>
            <StatsCards stats={stats} />
            <ProjectsList
              projects={projects}
              onDeleteProject={handleDeleteProject}
            />
            <TasksList
              tasks={tasks}
              timers={timers}
              getElapsed={getElapsed}
              toggleTimer={toggleTimer}
              onDeleteTask={handleDeleteTask}
            />
          </>
        )}
      </div>

      <CreateTaskModal
        isOpen={showTaskModal}
        onClose={() => setShowTaskModal(false)}
        projects={projects}
        depts={dept}
        onCreateTask={handleCreateTask}
      />

      <CreateProjectModal
        isOpen={showProjectModal}
        onClose={() => setShowProjectModal(false)}
        onCreateProject={handleCreateProject}
      />

      <CreateUserModal
        isOpen={showUserModal}
        onClose={() => setShowUserModal(false)}
        depts={dept}
        onCreateUser={handleCreateUser}
      />
    </div>
  );
}
