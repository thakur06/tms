import { useEffect, useMemo, useState } from "react";
import { toast, Zoom } from "react-toastify";
import "react-datepicker/dist/react-datepicker.css";
import DatePicker from "react-datepicker";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
    IoPeopleSharp,
  IoGameController,
  IoTimeOutline,
  IoStatsChartOutline,
  IoFolderOutline,
  IoArrowUp,
  IoLocationOutline,
  IoPeopleOutline,
  IoClose,
  IoFilter,
  IoSearchOutline,
  IoChevronDown,
  IoCheckmarkCircle,
  IoRefreshOutline,
  IoAnalytics,
} from "react-icons/io5";
import { RiBeerFill } from "react-icons/ri";
import {MdBusiness, MdMeetingRoom, MdModelTraining } from "react-icons/md";
import { GiBrain, GiSuitcase } from "react-icons/gi";
import { FiCalendar, FiUsers, FiLayers } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";

// Helper to format duration
const formatDuration = (hours, minutes) => {
  const h = hours + Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m}m`;
};

const CustomInput = ({ value, onClick, placeholder, icon: Icon }) => (
  <button
    className="w-full border border-white/10 rounded-xl px-4 py-3 text-left text-white placeholder-gray-500 focus:outline-none focus:ring-4 focus:ring-amber-500/20 focus:border-amber-500 flex items-center gap-3 transition-all shadow-sm bg-zinc-900"
    onClick={onClick}
  >
    {Icon && <Icon className="text-amber-500" size={18} />}
    <span className={value ? "text-white font-bold" : "text-gray-500"}>
      {value || placeholder}
    </span>
  </button>
);

const MultiSelect = ({
  label,
  options,
  selectedValues,
  onChange,
  icon: Icon,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useState(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isOpen && !event.target.closest(".multiselect-container")) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const filtered = options.filter((opt) =>
    String(opt).toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-2 multiselect-container">
      <label className="text-[10px] font-black text-gray-400 flex items-center justify-between uppercase tracking-widest">
        <div className="flex items-center gap-2">
            {Icon && <Icon className="text-amber-500" size={14} />}
            {label}
        </div>
        {selectedValues.length > 0 && (
            <button 
                onClick={(e) => {
                    e.stopPropagation();
                    onChange([]);
                }}
                className="text-amber-500 hover:text-white transition-colors"
                title="Clear Selection"
            >
                <IoClose size={14} />
            </button>
        )}
      </label>
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full flex items-center justify-between px-3 py-2 border rounded-xl text-xs font-bold transition-all bg-zinc-900 ${
            isOpen
              ? "border-amber-500 ring-4 ring-amber-500/20"
              : "border-white/10 text-white"
          }`}
        >
          <span
            className={
              selectedValues.length > 0 ? "text-white" : "text-gray-500"
            }
          >
            {selectedValues.length > 0
              ? `${selectedValues.length} selected`
              : `All`} 
          </span>
          <IoChevronDown
            className={`text-amber-500 transition-transform ${isOpen ? "rotate-180" : ""}`}
            size={14}
          />
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute top-full left-0 right-0 mt-2 border border-white/10 rounded-xl overflow-hidden z-50 shadow-2xl bg-zinc-900"
            >
              <div className="p-2 border-b border-white/5 space-y-2">
                <div className="relative">
                  <IoSearchOutline
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
                    size={12}
                  />
                  <input
                    className="w-full pl-8 pr-3 py-1.5 bg-black/20 rounded-lg text-xs outline-none focus:focus:ring-2 focus:ring-amber-500/20 transition-all font-bold text-white placeholder-gray-500"
                    placeholder={`Search ${label}...`}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    autoFocus
                  />
                </div>
                <div className="flex justify-between px-1">
                    <button 
                        onClick={() => onChange(options)}
                        className="text-[10px] text-amber-500 hover:text-amber-400 font-bold uppercase tracking-wider"
                    >
                        Select All
                    </button>
                    <button 
                        onClick={() => onChange([])}
                        className="text-[10px] text-gray-500 hover:text-white font-bold uppercase tracking-wider"
                    >
                        Clear
                    </button>
                </div>
              </div>
              <div className="max-h-48 overflow-y-auto custom-scrollbar p-1">
                {filtered.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => {
                      const newSelected = selectedValues.includes(opt)
                        ? selectedValues.filter((s) => s !== opt)
                        : [...selectedValues, opt];
                      onChange(newSelected);
                      // setSearch(""); // Keep search open
                    }}
                    className="w-full px-3 py-1.5 text-left text-xs text-gray-400 hover:bg-amber-500/10 hover:text-amber-500 transition-all flex items-center justify-between rounded-lg font-bold"
                  >
                    {opt}
                    {selectedValues.includes(opt) && (
                      <IoCheckmarkCircle
                        className="text-amber-500"
                        size={14}
                      />
                    )}
                  </button>
                ))}
                {filtered.length === 0 && (
                  <div className="p-4 text-xs text-gray-500 text-center italic">
                    No matches found
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export const Analytics = () => {
  const server = import.meta.env.VITE_SERVER_ADDRESS;

  // State
  const [startDate, setStartDate] = useState(
    new Date(new Date().setDate(new Date().getDate() - 30)),
  );
  const [endDate, setEndDate] = useState(new Date());

  const [reportData, setReportData] = useState([]);
  const [projectsList, setProjectsList] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [deptsList, setDeptsList] = useState([]);

  // Applied Filters (Used for analytics calculation)
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [selectedDepts, setSelectedDepts] = useState([]);
  const [selectedProjects, setSelectedProjects] = useState([]);
  const [selectedLocations, setSelectedLocations] = useState([]);

  // Temporary Filters (Connected to UI inputs)
  const [tempSelectedUsers, setTempSelectedUsers] = useState([]);
  const [tempSelectedDepts, setTempSelectedDepts] = useState([]);
  const [tempSelectedProjects, setTempSelectedProjects] = useState([]);
  const [tempSelectedLocations, setTempSelectedLocations] = useState([]);

  const [pageTitle, setPageTitle] = useState("Overall Analytics");

  const [isLoading, setIsLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState({
    title: "",
    data: [],
    type: "",
    detail: "",
  });

  // Derived Lists
  const locationsList = useMemo(() => {
     return [...new Set(projectsList.map(p => p.location).filter(Boolean))];
  }, [projectsList]);

  // Fetch Filters Data (Users, Projects for global counts)
  useEffect(() => {
    const fetchBasics = async () => {
      try {
        const token = localStorage.getItem("token");
        const [usersRes, projectsRes] = await Promise.all([
          axios.get(`${server}/api/users?limit=1000`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`${server}/api/projects`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        setUsersList(usersRes.data.users || []);
        setProjectsList(projectsRes.data || []);

        // Extract Depts
        const depts = [
          ...new Set(
            (usersRes.data.users || []).map((u) => u.dept).filter(Boolean),
          ),
        ];
        setDeptsList(depts);
      } catch (error) {
        console.error("Failed to load basic data", error);
        toast.error("Failed to load users or projects data");
      }
    };
    fetchBasics();
  }, [server]);

  // Handle Clear Filters
  const handleClearFilters = () => {
    setTempSelectedUsers([]);
    setTempSelectedDepts([]);
    setTempSelectedProjects([]);
    setTempSelectedLocations([]);
    
    setSelectedUsers([]);
    setSelectedDepts([]);
    setSelectedProjects([]);
    setSelectedLocations([]);

    // Default to last 30 days
    setStartDate(new Date(new Date().setDate(new Date().getDate() - 30)));
    setEndDate(new Date());

    setPageTitle("Overall Analytics");
    toast.info("Filters cleared");
    // Trigger re-fetch with clean state? 
    // Effect dependency on [startDate] might handle it or we call fetch manually later
    // For now, let's just let the user click "Apply Filters" or "Fetch"
  };

  // Core Fetch Logic
  const fetchReportData = async (filters = {}) => {
    if (!startDate || !endDate) return;
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      const startStr = startDate.toISOString().split("T")[0];
      const endStr = endDate.toISOString().split("T")[0];
      
      const params = {
          startDate: startStr,
          endDate: endStr,
          users: filters.users,
          projects: filters.projects,
          locations: filters.locations,
          depts: filters.depts
      };
      
      // Axios handles array params serialization? 
      // Default: indices (users[0]=a). We might need paramsSerializer for comma handling or repeated keys.
      // Let's use `qs` or just let backend handle axios default.
      // Backend (Express) usually understands `users[]`.
      // My backend implementation used parseArray checked for single or array.
      
      const response = await axios.get(`${server}/api/reports/time-entries`, {
        params,
        headers: { Authorization: `Bearer ${token}` },
      });
      
      setReportData(response.data.users || []);
    } catch (error) {
      console.error("Failed to fetch report data", error);
      toast.error("Failed to load analytics data");
    } finally {
      setIsLoading(false);
    }
  };

  // Apply Filters Button Handler
  const handleApplyFilters = () => {
      // Commit temps to actuals
      setSelectedUsers(tempSelectedUsers);
      setSelectedDepts(tempSelectedDepts);
      setSelectedProjects(tempSelectedProjects);
      setSelectedLocations(tempSelectedLocations);
      
      fetchReportData({
          users: tempSelectedUsers,
          depts: tempSelectedDepts,
          projects: tempSelectedProjects,
          locations: tempSelectedLocations
      });
      
      // Update Title
      if (tempSelectedUsers.length > 0) setPageTitle("Filtered: Specific Users");
      else if (tempSelectedProjects.length > 0) setPageTitle("Filtered: Specific Projects");
      else if (tempSelectedDepts.length > 0) setPageTitle("Filtered: Specific Departments");
      else setPageTitle("Overall Analytics");
  };

  const handleExportExcel = async () => {
      if (!startDate || !endDate) return;
      try {
          const token = localStorage.getItem("token");
          const startStr = startDate.toISOString().split("T")[0];
          const endStr = endDate.toISOString().split("T")[0];
          
          const params = {
            startDate: startStr,
            endDate: endStr,
            users: selectedUsers,
            projects: selectedProjects,
            locations: selectedLocations,
            depts: selectedDepts
          };

          const response = await axios.get(`${server}/api/reports/export`, {
             params,
             headers: { Authorization: `Bearer ${token}` },
             responseType: 'blob' // Important
          });
          
          // Create download link
          const url = window.URL.createObjectURL(new Blob([response.data]));
          const link = document.createElement('a');
          link.href = url;
          link.setAttribute('download', `TimeReport_${startStr}_to_${endStr}.xlsx`);
          document.body.appendChild(link);
          link.click();
          link.remove();
          
          toast.success("Excel exported successfully!");
      } catch (err) {
          console.error("Export failed", err);
          toast.error("Failed to export Excel");
      }
  };

  // Initial Fetch on mount
  useEffect(() => {
    // Initial load: 30 days, no extra filters
    fetchReportData({
        users: [],
        depts: [],
        projects: [],
        locations: []
    });
  }, []); // Only on mount

  // Metrics Calculation
  const analytics = useMemo(() => {
    // Data is already filtered by backend
    let filteredUsers = reportData;

    // 2. Aggregate Entries
    const allEntries = (filteredUsers || []).flatMap((u) => u.entries || []);

    // 3. Compute Metrics
    const totalMinutes = allEntries.reduce(
      (sum, e) => sum + (e.hours * 60 + e.minutes),
      0,
    );
    const totalTimeStr = formatDuration(
      Math.floor(totalMinutes / 60),
      totalMinutes % 60,
    );

    // Categories
     const entriesByCat = {
      project: [],
      pto: [],
      training: [],
      rd: [],
      bd: [],
      tb: [],
      meetings:[],
      holidays:[],

    };

    // Lookup map
    const projectCategoryMap = new Map();
    projectsList.forEach((p) => {
      // Key by name or code. Report uses project_name mostly.
      projectCategoryMap.set(p.name, p.category?.toLowerCase() || "project");
      projectCategoryMap.set(p.code, p.category?.toLowerCase() || "project");
    });

    allEntries.forEach((e) => {
      // Find category
      let cat = "project";
      if (projectCategoryMap.has(e.project)) {
        cat = projectCategoryMap.get(e.project);
      } else if (
        e.project?.toLowerCase().includes("pto") ||
        e.task_id?.toLowerCase().includes("pto")
      ) {
        cat = "pto";
      } else if (e.project?.toLowerCase().includes("training")) {
        cat = "training";
      } else if (e.project?.toLowerCase().includes("r&d")) {
        cat = "r&d";
      }
      else if (e.project?.toLowerCase().includes("bd")) {
        cat = "bd";
      }
      else if (e.project?.toLowerCase().includes("Meetings")) {
        cat = "meetings";
      }
      else if (e.project?.toLowerCase().includes("Public Holiday")) {
        cat = "public holiday";
      }
      else if (e.project?.toLowerCase().includes("Team Building")) {
        cat = "team building";
      }
      if (cat === "pto") entriesByCat.pto.push(e);
      else if (cat === "training") entriesByCat.training.push(e);
      else if (cat === "r&d" || cat === "research") entriesByCat.rd.push(e);
      else if (cat === "bd") entriesByCat.bd.push(e);
      else if (cat === "meetings") entriesByCat.meetings.push(e);
      else if (cat === "public holiday") entriesByCat.holidays.push(e);
      else if (cat === "team building") entriesByCat.tb.push(e);
      else entriesByCat.project.push(e);

    });

    // Unique counts
    const uniqueProjects = new Set(entriesByCat.project.map((e) => e.project))
      .size;
    const uniqueTasks = new Set(allEntries.map((e) => e.task_id)).size;

    // Utilization
    const days = Math.max(
      1,
      Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)),
    );
    const workingDays = Math.floor(days * (5 / 7));
    const totalCapacityHours = workingDays * 8 * (filteredUsers.length || 1); // Capacity scaling by number of users considered
    const utilization =
      totalCapacityHours > 0
        ? (totalMinutes / 60 / totalCapacityHours) * 100
        : 0;

    // Charts Data
    const dailyMap = new Map();
    allEntries.forEach((e) => {
      const date = e.date.split("T")[0];
      const mins = e.hours * 60 + e.minutes;
      dailyMap.set(date, (dailyMap.get(date) || 0) + mins);
    });

    const chartData = Array.from(dailyMap.entries())
      .map(([date, mins]) => ({
        date,
        hours: Number((mins / 60).toFixed(1)),
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const locationMap = new Map();
    allEntries.forEach((e) => {
      const loc = e.location || "Unknown";
      const mins = e.hours * 60 + e.minutes;
      locationMap.set(loc, (locationMap.get(loc) || 0) + mins);
    });

    const locationData = Array.from(locationMap.entries()).map(
      ([name, mins]) => ({
        name,
        hours: Number((mins / 60).toFixed(1)),
      }),
    );

    return {
      totalTimeStr,
      totalMinutes,
      activeProjectsCount: uniqueProjects,
      tasksCount: uniqueTasks,
      utilization: utilization.toFixed(1),
      entriesByCat,
      chartData,
      locationData,
    };
  }, [
    reportData,
    selectedUsers,
    selectedDepts,
    projectsList,
    startDate,
    endDate,
  ]);

  const cards = [
    {
      label: "Active Projects",
      value: analytics.activeProjectsCount,
      icon: IoFolderOutline,
      color: "from-gray-700 to-gray-900",
      type: "projects",
      data: analytics.entriesByCat.project,
      detail: "Unique projects worked on",
    },
    {
      label: "Tasks Worked",
      value: analytics.tasksCount,
      icon: IoStatsChartOutline,
      color: "from-gray-800 to-gray-900",
      type: "tasks",
      data: Object.values(analytics.entriesByCat).flat(),
      detail: "Unique tasks logged",
    },
    {
      label: "Total Time",
      value: analytics.totalTimeStr,
      icon: IoTimeOutline,
      color: "from-amber-600 to-yellow-500",
      type: "time",
      data: Object.values(analytics.entriesByCat).flat(),
      detail: "Total hours logged",
    },
    {
      label: "Business Development",
      value: formatDuration(
        0,
        analytics.entriesByCat.bd.reduce(
          (s, e) => s + e.hours * 60 + e.minutes,
          0,
        ),
      ),
      icon: MdBusiness,
      color: "from-yellow-600 to-amber-500",
      type: "bd",
      data: analytics.entriesByCat.bd,
      detail: "Business Development",
    },
    {
      label: "Meetings",
      value: formatDuration(
        0,
        analytics.entriesByCat.meetings.reduce(
          (s, e) => s + e.hours * 60 + e.minutes,
          0,
        ),
      ),
      icon: MdMeetingRoom,
      color: "from-amber-700 to-amber-900",
      type: "meetings",
      data: analytics.entriesByCat.meetings,
      detail: "Daily Meetings",
    },
    {
      label: "Public Holiday",
      value: formatDuration(
        0,
        analytics.entriesByCat.holidays.reduce(
          (s, e) => s + e.hours * 60 + e.minutes,
          0,
        ),
      ),
      icon: IoGameController,
      color: "from-yellow-700 to-yellow-900",
      type: "holidays",
      data: analytics.entriesByCat.holidays,
      detail: "Holidays",
    },
    {
      label: "Team Building",
      value: formatDuration(
        0,
        analytics.entriesByCat.tb.reduce(
          (s, e) => s + e.hours * 60 + e.minutes,
          0,
        ),
      ),
      icon: IoPeopleSharp,
      color: "from-amber-800 to-yellow-700",
      type: "teambuilding",
      data: analytics.entriesByCat.tb,
      detail: "Team Building",
    },
    {
      label: "PTO",
      value: formatDuration(
        0,
        analytics.entriesByCat.pto.reduce(
          (s, e) => s + e.hours * 60 + e.minutes,
          0,
        ),
      ),
      icon: RiBeerFill,
      color: "from-yellow-800 to-amber-700",
      type: "pto",
      data: analytics.entriesByCat.pto,
      detail: "Time off logged",
    },
    {
      label: "Training",
      value: formatDuration(
        0,
        analytics.entriesByCat.training.reduce(
          (s, e) => s + e.hours * 60 + e.minutes,
          0,
        ),
      ),
      icon: MdModelTraining,
      color: "from-gray-700 to-amber-800",
      type: "training",
      data: analytics.entriesByCat.training,
      detail: "Training sessions",
    },
    {
      label: "R&D",
      value: formatDuration(
        0,
        analytics.entriesByCat.rd.reduce(
          (s, e) => s + e.hours * 60 + e.minutes,
          0,
        ),
      ),
      icon: GiBrain,
      color: "from-gray-800 to-yellow-800",
      type: "rd",
      data: analytics.entriesByCat.rd,
      detail: "Research & Development",
    },
  ];

  const handleCardClick = (card) => {
    if (card.data && card.data.length > 0) {
      // Group distinct items for modal
      let displayData = card.data;
      let type = card.type;

      // Helper to aggregate simple lists (PTO, Training, R&D, Tasks)
      const aggregateData = (items, keyField) => {
        const map = new Map();
        items.forEach((e) => {
          // For tasks, key is task_id. For others, project name or task_id.
          const key =
            keyField === "task_id" ? e.task_id : e.project || e.task_id;

          if (!map.has(key)) {
            map.set(key, {
              id: key,
              name: key,
              // Keep other metadata from the first occurrence
              date: e.date,
              user_name: e.user_name,
              // Accumulate sorting metrics
              hours: 0,
              minutes: 0,
              count: 0,
            });
          }
          const entry = map.get(key);
          entry.hours += e.hours;
          entry.minutes += e.minutes;
          entry.count += 1;
        });
        return Array.from(map.values())
          .map((p) => ({
            ...p,
            totalDisplay: formatDuration(p.hours, p.minutes),
          }))
          .sort(
            (a, b) => b.hours * 60 + b.minutes - (a.hours * 60 + a.minutes),
          ); // Sort by duration
      };

      if (type === "projects") {
        displayData = aggregateData(card.data, "project");
      } else if (type === "tasks") {
        displayData = aggregateData(card.data, "task_id");
      } else if (["pto", "training", "rd"].includes(type)) {
        // Group these by task_id usually, or project name if available
        displayData = aggregateData(card.data, "task_id");
      }
      // 'time' type can remain as list or grouped? Let's leave 'time' as raw list or group by Date?
      // 'utilization' has no data list.

      setModalContent({
        title: card.label,
        data: displayData,
        type: type,
        detail: card.detail,
      });
      setModalOpen(true);
    } else {
      toast.info("No detailed data available for this metric");
    }
  };

  const renderModalContent = () => {
    // Simple list rendering based on type
    if (
      ["projects", "pto", "training", "rd", "tasks"].includes(modalContent.type)
    ) {
      return (
        <div className="space-y-3 max-h-[60vh] overflow-y-auto custom-scrollbar pr-1">
          {modalContent.data.map((item, idx) => (
            <div
              key={idx}
              className="flex justify-between items-center p-3 rounded-lg border border-white/5 bg-zinc-900 hover:bg-white/5 hover:border-amber-500/20 transition-all group"
            >
              <div>
                <div className="font-bold text-gray-200 group-hover:text-amber-500 transition-colors">
                  {item.name}
                </div>
                {item.code && (
                  <div className="text-xs text-gray-500">{item.code}</div>
                )}
                {item.count && (
                  <div className="text-xs text-gray-500">
                    {item.count} entries
                  </div>
                )}
              </div>
              <div className="text-amber-500 font-mono font-bold">
                {item.totalDisplay}
              </div>
            </div>
          ))}
        </div>
      );
    }

    // For others list entries
    return (
      <div className="space-y-3 max-h-[60vh] overflow-y-auto custom-scrollbar">
        {modalContent.data.map((item, idx) => (
          <div
            key={idx}
            className="p-3 border border-white/5 bg-zinc-900 rounded-lg hover:border-amber-500/20 transition-all"
          >
            <div className="flex justify-between">
              <div className="font-bold text-gray-200">
                {item.project}
              </div>
              <div className="text-sm text-gray-500">
                {new Date(item.date).toLocaleDateString()}
              </div>
            </div>
            <div className="text-sm text-amber-500 font-semibold">{item.task_id}</div>
            <div className="flex justify-between mt-2 text-xs text-gray-400">
              <div>{item.user_name}</div>
              <div className="font-mono text-white font-bold">
                {item.hours}h {item.minutes}m
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-8 pb-10 p-3 min-h-screen transition-colors duration-300">
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <nav className="flex items-center gap-2 text-xs font-black text-gray-400 uppercase tracking-widest mb-2">
            <span>Intelligence</span>
            <span className="opacity-30">/</span>
            <span className="text-amber-500">Analytics</span>
          </nav>
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 shadow-sm">
              <IoAnalytics size={28} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight leading-none">
                Intelligent Analytics 
              </h1>
              <p className="text-gray-400 mt-1.5 text-xs font-bold italic">Track your Project Management Activities here....</p>
            </div>
          </div>
        </div>
      </header>
      {/* Filters Section */}
      {/* Filters Section */}
      <div className="relative z-10 p-4 border border-white/5 shadow-sm rounded-2xl bg-zinc-900">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-end">
          
          {/* 1. Date Range */}
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
              <FiCalendar className="text-amber-500" /> Date Range
            </label>
            <div className="flex gap-2">
              <div className="w-1/2 relative z-30">
                <DatePicker
                  selected={startDate}
                  onChange={setStartDate}
                  selectsStart
                  startDate={startDate}
                  endDate={endDate}
                  customInput={
                    <CustomInput placeholder="Start" icon={null} />
                  }
                />
              </div>
              <div className="w-1/2 relative z-20">
                <DatePicker
                  selected={endDate}
                  onChange={setEndDate}
                  selectsEnd
                  startDate={startDate}
                  endDate={endDate}
                  minDate={startDate}
                  customInput={
                    <CustomInput placeholder="End" icon={null} />
                  }
                />
              </div>
            </div>
          </div>

          {/* 2. Departments & Locations */}
          <div className="space-y-3">
             <MultiSelect
                label="By Department"
                options={deptsList}
                selectedValues={tempSelectedDepts}
                onChange={setTempSelectedDepts}
                icon={FiLayers}
              />
              <MultiSelect
                label="By Location"
                options={locationsList}
                selectedValues={tempSelectedLocations}
                onChange={setTempSelectedLocations}
                icon={IoLocationOutline}
              />
          </div>

          {/* 3. Users & Projects */}
          <div className="space-y-3">
              <MultiSelect
                label="By User"
                options={usersList.map((u) => u.name)}
                selectedValues={tempSelectedUsers}
                onChange={setTempSelectedUsers}
                icon={FiUsers}
              />
              <MultiSelect
                label="By Project"
                options={projectsList.map(p => p.name)}
                selectedValues={tempSelectedProjects}
                onChange={setTempSelectedProjects}
                icon={IoFolderOutline}
              />
          </div>

          {/* 4. Actions */}
          <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                   <button
                    onClick={handleApplyFilters}
                    className="flex-1 ui-btn ui-btn-primary h-12 flex items-center justify-center gap-2 text-xs uppercase font-black tracking-widest"
                  >
                    <IoFilter size={16} />
                    Apply Filters
                  </button>
                  <button
                    onClick={handleClearFilters}
                    className="w-12 h-12 flex items-center justify-center rounded-xl border border-white/10 hover:bg-white/5 hover:border-red-500/50 hover:text-red-500 transition-all text-gray-400"
                    title="Clear Filters"
                  >
                    <IoClose size={20} />
                  </button>
              </div>

               <button
                  onClick={handleExportExcel}
                  className="w-full h-12 flex items-center justify-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-500 font-bold text-xs uppercase tracking-widest hover:bg-emerald-500/20 transition-all"
                >
                  <IoArrowUp size={16} className="rotate-45" />
                  Export to Excel
                </button>
          </div>

        </div>
      </div>

      {/* Dynamic Title */}
      <motion.div
        className="flex items-center gap-3 px-2 border-l-4 border-amber-500"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        key={pageTitle}
      >
        <h2 className="text-2xl font-bold text-white">{pageTitle}</h2>
      </motion.div>

      {/* STATS CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {cards.map((card, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            whileHover={{ scale: 1.03, y: -5 }}
            whileTap={{ scale: 0.98 }}
            className="relative group cursor-pointer"
            onClick={() => handleCardClick(card)}
          >
            <div className="absolute inset-0 bg-linear-to-br from-amber-500/5 via-transparent to-amber-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="bg-zinc-900 rounded-3xl p-6 cursor-pointer border border-white/5 hover:border-amber-500/20 transition-all group relative">
              <div className="flex justify-between items-start mb-4">
                <div
                  className={`p-3 rounded-xl bg-linear-to-br ${card.color} shadow-lg group-hover:scale-110 transition-transform duration-300`}
                >
                  <card.icon size={24} className="text-white" />
                </div>
                {card.data && card.data.length > 0 && (
                  <IoArrowUp className="text-gray-500 -rotate-45 group-hover:text-amber-500 group-hover:scale-110 transition-all font-bold" />
                )}
              </div>
              <div>
                <div className="text-gray-400 text-xs font-bold uppercase tracking-tight mb-1">
                  {card.label}
                </div>
                <div className="text-2xl font-black text-white tracking-tight group-hover:text-amber-500 transition-all">
                  {card.value}
                </div>
                <div className="text-[10px] font-bold text-gray-500 mt-2 uppercase">{card.detail}</div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activity Chart */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="p-6 border border-white/5 rounded-2xl bg-zinc-900 hover:border-amber-500/50 transition-all shadow-sm"
        >
          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <div className="p-2 bg-amber-500/10 rounded-lg border border-amber-500/20">
              <IoStatsChartOutline className="text-amber-500" size={18} />
            </div>
            Activity Trend
          </h3>
          <div className="h-[300px] w-full flex items-center justify-center">
            {analytics.chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analytics.chartData}>
                  <defs>
                    <linearGradient id="colorActivity" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#fbbf24" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#fbbf24" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#374151"
                  />
                  <XAxis
                    dataKey="date"
                    stroke="#9ca3af"
                    fontSize={12}
                    tickFormatter={(str) =>
                      new Date(str).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                      })
                    }
                  />
                  <YAxis stroke="#9ca3af" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1f2937",
                      borderColor: "#fbbf24",
                      borderRadius: "12px",
                      boxShadow: "0 10px 40px rgba(0,0,0,0.3)",
                      color: "#fbbf24"
                    }}
                    itemStyle={{ color: "#fbbf24" }}
                    labelStyle={{ color: "#9ca3af" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="hours"
                    stroke="#fbbf24"
                    strokeWidth={3}
                    dot={{ r: 5, fill: "#fbbf24", strokeWidth: 2, stroke: "#1f2937" }}
                    activeDot={{ r: 7, fill: "#f59e0b", stroke: "#fbbf24", strokeWidth: 2 }}
                    fill="url(#colorActivity)"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-gray-500 flex flex-col items-center">
                <IoStatsChartOutline size={48} className="mb-2 opacity-10" />
                <p className="text-sm font-bold uppercase tracking-widest text-gray-600">No activity data</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Location Chart */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="p-6 border border-white/5 rounded-2xl bg-zinc-900 hover:border-amber-500/20 transition-all shadow-sm"
        >
          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <div className="p-2 bg-amber-500/10 rounded-lg border border-amber-500/20">
              <IoLocationOutline className="text-amber-500" size={18} />
            </div>
            Location Split
          </h3>
          <div className="h-[300px] w-full flex items-center justify-center">
            {analytics.locationData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analytics.locationData}
                    dataKey="hours"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                  >
                     {analytics.locationData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          ["#6366f1", "#10b981", "#f59e0b", "#ef4444"][
                            index % 4
                          ]
                        }
                      />
                    ))}
                  </Pie>
                   <Tooltip
                    contentStyle={{
                      backgroundColor: "#18181b",
                      borderColor: "#f59e0b",
                      color: "#fff",
                      borderRadius: "12px",
                      boxShadow: "0 10px 40px rgba(0,0,0,0.3)",
                      border: "1px solid #f59e0b"
                    }}
                    itemStyle={{ color: "#fff" }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-gray-500 flex flex-col items-center">
                <IoLocationOutline size={48} className="mb-2 opacity-10" />
                <p className="text-sm font-bold uppercase tracking-widest text-gray-600">No location data</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {modalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm"
            onClick={() => setModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-2xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl bg-zinc-900"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-white/5 flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-bold text-white">
                    {modalContent.title}
                  </h3>
                  <p className="text-sm text-gray-400">
                    {modalContent.detail}
                  </p>
                </div>
                <button
                  onClick={() => setModalOpen(false)}
                  className="p-2 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white"
                >
                  <IoClose size={24} />
                </button>
              </div>
              <div className="p-6">{renderModalContent()}</div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};