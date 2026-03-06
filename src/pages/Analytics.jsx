import { useEffect, useMemo, useState } from "react";
import MultiSelect from "../components/MultiSelect";
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
import { MdBusiness, MdMeetingRoom, MdModelTraining } from "react-icons/md";
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
    className="w-full border rounded-xl px-3 py-2 text-left text-(--text-main) placeholder-(--text-muted) focus:outline-none focus:ring-2 focus:ring-(--hard-pink-glow) focus:border-(--hard-pink) flex items-center gap-2 transition-all shadow-sm bg-(--input-bg) border-(--glass-border)"
    onClick={onClick}
  >
    {Icon && <Icon className="text-(--hard-pink)" size={16} />}
    <span className={`text-[11px] truncate ${value ? "text-(--text-main) font-bold" : "text-(--text-muted)"}`}>
      {value || placeholder}
    </span>
  </button>
);

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

  const [pageTitle, setPageTitle] = useState("Reports & Analytics");

  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview"); // "overview" or "reports"

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

  // Filter Users by selected Departments for the filter dropdown
  const filteredUsersForFilter = useMemo(() => {
    if (tempSelectedDepts.length === 0) return usersList;
    return usersList.filter(u => tempSelectedDepts.includes(u.dept));
  }, [usersList, tempSelectedDepts]);

  // Auto-clear users that are no longer in the selected departments
  useEffect(() => {
    if (tempSelectedDepts.length > 0) {
      setTempSelectedUsers(prev => prev.filter(userName => {
        const user = usersList.find(u => u.name === userName);
        return user && tempSelectedDepts.includes(user.dept);
      }));
    }
  }, [tempSelectedDepts, usersList]);

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
        paramsSerializer: {
          indexes: null // users=a&users=b instead of users[0]=a&users[1]=b
        },
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
        paramsSerializer: {
          indexes: null
        },
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
      meetings: [],
      holidays: [],

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
      color: "from-indigo-600 to-blue-500",
      type: "projects",
      data: analytics.entriesByCat.project,
      detail: "Unique projects worked on",
    },
    {
      label: "Tasks Worked",
      value: analytics.tasksCount,
      icon: IoStatsChartOutline,
      color: "from-violet-600 to-fuchsia-500",
      type: "tasks",
      data: Object.values(analytics.entriesByCat).flat(),
      detail: "Unique tasks logged",
    },
    {
      label: "Total Time",
      value: analytics.totalTimeStr,
      icon: IoTimeOutline,
      color: "from-emerald-600 to-teal-500",
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
      color: "from-rose-600 to-pink-500",
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
      color: "from-orange-600 to-rose-500",
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
      color: "from-sky-600 to-blue-500",
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
      color: "from-indigo-700 to-violet-500",
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
      color: "from-fuchsia-600 to-pink-500",
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
      color: "from-cyan-600 to-blue-500",
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
      color: "from-rose-700 to-orange-500",
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
              className="flex justify-between items-center p-3 rounded-lg border border-(--glass-border) bg-(--hover-bg) hover:bg-white/5 hover:border-(--primary-glow) transition-all group"
            >
              <div>
                <div className="font-bold text-(--text-main) group-hover:text-(--primary) transition-colors">
                  {item.name}
                </div>
                {item.code && (
                  <div className="text-xs text-(--text-muted)">{item.code}</div>
                )}
                {item.count && (
                  <div className="text-xs text-(--text-muted)">
                    {item.count} entries
                  </div>
                )}
              </div>
              <div className="text-(--primary) font-mono font-bold">
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
            className="p-3 border border-(--glass-border) bg-(--hover-bg) rounded-lg hover:border-(--primary-glow) transition-all"
          >
            <div className="flex justify-between">
              <div className="font-bold text-(--text-main)">
                {item.project}
              </div>
              <div className="text-sm text-(--text-muted)">
                {new Date(item.date).toLocaleDateString()}
              </div>
            </div>
            <div className="text-sm text-(--primary) font-semibold">{item.task_id}</div>
            <div className="flex justify-between mt-2 text-xs text-(--text-muted)">
              <div>{item.user_name}</div>
              <div className="font-mono text-(--text-main) font-bold">
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
          <nav className="flex items-center gap-2 text-xs font-black text-(--text-muted) uppercase tracking-widest mb-2">
            <span>Intelligence</span>
            <span className="opacity-30">/</span>
            <span className="text-(--primary) uppercase">Reports & Analytics</span>
          </nav>
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-(--primary-glow) border border-(--primary-glow) text-(--primary) shadow-sm">
              <IoAnalytics size={28} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-(--text-main) tracking-tight leading-none">
                Intelligence Hub
              </h1>
              <p className="text-(--text-muted) mt-1.5 text-xs font-bold italic">Centralized project intelligence and detailed reporting</p>
            </div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex p-1 bg-(--hover-bg) border border-(--glass-border) rounded-2xl shadow-inner">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === "overview"
              ? "bg-(--pink) text-(--text-inverse) shadow-(--pink-glow)"
              : "text-(--text-muted) hover:text-(--text-main)"
              }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab("reports")}
            className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === "reports"
              ? "bg-(--pink) text-(--text-inverse) shadow-(--pink-glow)"
              : "text-(--text-muted) hover:text-(--text-main)"
              }`}
          >
            Detailed Reports
          </button>
        </div>
      </header>

      {/* Filters Section */}
      <div className="relative z-10 p-5 border border-(--glass-border) shadow-2xl rounded-3xl bg-(--glass-surface) backdrop-blur-xl">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 items-end">

          {/* 1. Date Range Group */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-(--text-muted) uppercase tracking-widest flex items-center gap-2 px-1">
              <FiCalendar className="text-(--primary)" /> Date Range
            </label>
            <div className="flex gap-2">
              <div className="relative z-30 flex-1">
                <DatePicker
                  selected={startDate}
                  onChange={setStartDate}
                  selectsStart
                  startDate={startDate}
                  endDate={endDate}
                  customInput={<CustomInput placeholder="From" />}
                />
              </div>
              <div className="relative z-20 flex-1">
                <DatePicker
                  selected={endDate}
                  onChange={setEndDate}
                  selectsEnd
                  startDate={startDate}
                  endDate={endDate}
                  minDate={startDate}
                  customInput={<CustomInput placeholder="To" />}
                />
              </div>
            </div>
          </div>

          {/* 2. Organizations Group */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-(--text-muted) uppercase tracking-widest flex items-center gap-2 px-1">
              <MdBusiness className="text-(--primary)" /> Organization
            </label>
            <div className="flex gap-2">
              <MultiSelect
                label="Dept"
                options={deptsList}
                selectedValues={tempSelectedDepts}
                onChange={setTempSelectedDepts}
                icon={FiLayers}
              />
              <MultiSelect
                label="Location"
                options={locationsList}
                selectedValues={tempSelectedLocations}
                onChange={setTempSelectedLocations}
                icon={IoLocationOutline}
              />
            </div>
          </div>

          {/* 3. Entities Group */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-(--text-muted) uppercase tracking-widest flex items-center gap-2 px-1">
              <FiUsers className="text-(--hard-pink)" /> Entities
            </label>
            <div className="flex gap-2">
              <MultiSelect
                label="User"
                options={filteredUsersForFilter.map((u) => u.name)}
                selectedValues={tempSelectedUsers}
                onChange={setTempSelectedUsers}
                icon={IoPeopleOutline}
              />
              <MultiSelect
                label="Project"
                options={projectsList.map(p => p.name)}
                selectedValues={tempSelectedProjects}
                onChange={setTempSelectedProjects}
                icon={IoFolderOutline}
              />
            </div>
          </div>

          {/* 4. Actions Group */}
          <div className="flex items-center flex-wrap gap-2">
            <button
              onClick={handleApplyFilters}
              className="flex-1 h-10 px-4 bg-(--hard-pink) text-(--text-inverse) rounded-xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-(--hard-pink-glow)"
            >
              <IoFilter size={14} />
              Filter Results
            </button>
            <button
              onClick={handleClearFilters}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 border border-(--glass-border) text-(--text-muted) hover:border-red-500/50 hover:text-red-500 hover:bg-red-500/5 transition-all"
              title="Reset"
            >
              <IoClose size={18} />
            </button>
            <button
              onClick={handleExportExcel}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 hover:bg-emerald-500/20 transition-all"
              title="Export Excel"
            >
              <IoArrowUp size={14} className="rotate-45" />
            </button>
          </div>


        </div>
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === "overview" ? (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-8"
          >
            {/* Dynamic Title */}
            <div className="flex items-center gap-3 px-2 border-l-4 border-(--primary)">
              <h2 className="text-2xl font-bold text-(--text-main) uppercase tracking-tight">Intelligence Dashboard</h2>
            </div>

            {/* STATS CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
              {cards.map((card, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  whileHover={{ scale: 1.03, y: -5 }}
                  className="relative group cursor-pointer"
                  onClick={() => handleCardClick(card)}
                >
                  <div className="absolute inset-0 bg-linear-to-br from-amber-500/5 via-transparent to-amber-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="bg-(--hover-bg) rounded-3xl p-4 border border-(--glass-border) hover:border-amber-500/20 transition-all group relative">
                    <div className="flex justify-between items-start mb-3">
                      <div className={`p-2 rounded-xl bg-linear-to-br ${card.color} shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                        <card.icon size={18} className="text-white" />
                      </div>
                      {card.data && card.data.length > 0 && (
                        <IoArrowUp className="text-(--text-muted) -rotate-45 group-hover:text-amber-500 transition-all font-bold" size={12} />
                      )}
                    </div>
                    <div className="text-(--text-muted) text-[9px] font-bold uppercase tracking-tight mb-0.5">{card.label}</div>
                    <div className="text-xl font-black text-(--text-main) tracking-tight group-hover:text-amber-500 transition-all">{card.value}</div>
                    <div className="text-[9px] font-bold text-(--text-muted) mt-1 uppercase">{card.detail}</div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <motion.div className="p-6 border border-(--glass-border) rounded-3xl bg-(--hover-bg) shadow-sm">
                <h3 className="text-lg font-bold text-(--text-main) mb-6 flex items-center gap-2">
                  <div className="p-2 bg-amber-500/10 rounded-lg"><IoStatsChartOutline className="text-amber-500" size={18} /></div>
                  Activity Trend
                </h3>
                <div className="h-[300px]">
                  {analytics.chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={analytics.chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis dataKey="date" stroke="#9ca3af" fontSize={10} tickFormatter={(str) => new Date(str).toLocaleDateString(undefined, { month: "short", day: "numeric" })} />
                        <YAxis stroke="#9ca3af" fontSize={10} />
                        <Tooltip contentStyle={{ backgroundColor: "var(--app-bg)", borderColor: "var(--primary-glow)", borderRadius: "12px", color: "var(--text-main)" }} />
                        <Line type="monotone" dataKey="hours" stroke="var(--primary)" strokeWidth={3} dot={{ r: 4 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : <div className="h-full flex items-center justify-center text-gray-500 italic uppercase tracking-widest text-xs font-black opacity-20">No data</div>}
                </div>
              </motion.div>

              <motion.div className="p-6 border border-(--glass-border) rounded-3xl bg-(--hover-bg) shadow-sm">
                <h3 className="text-lg font-bold text-(--text-main) mb-6 flex items-center gap-2">
                  <div className="p-2 bg-amber-500/10 rounded-lg"><IoLocationOutline className="text-amber-500" size={18} /></div>
                  Location Split
                </h3>
                <div className="h-[300px]">
                  {analytics.locationData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={analytics.locationData} dataKey="hours" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5}>
                          {analytics.locationData.map((_, index) => <Cell key={`cell-${index}`} fill={["#6366f1", "#10b981", "#f59e0b", "#ef4444"][index % 4]} />)}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : <div className="h-full flex items-center justify-center text-gray-500 italic uppercase tracking-widest text-xs font-black opacity-20">No data</div>}
                </div>
              </motion.div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="reports"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between gap-3 px-2">
              <div className="flex items-center gap-3 border-l-4 border-(--primary) px-3">
                <h2 className="text-2xl font-bold text-(--text-main) uppercase tracking-tight">Detailed Time Reports</h2>
              </div>
              <div className="flex gap-2">
                <div className="px-3 py-1.5 bg-(--primary-glow) text-(--primary) border border-(--primary-glow) rounded-xl text-[10px] font-black uppercase tracking-widest">
                  Total Users: {reportData.length}
                </div>
                <div className="px-3 py-1.5 bg-(--hover-bg) text-(--text-muted) border border-(--glass-border) rounded-xl text-[10px] font-black uppercase tracking-widest">
                  {startDate.toLocaleDateString()} - {endDate.toLocaleDateString()}
                </div>
              </div>
            </div>

            {reportData.length === 0 ? (
              <div className="p-20 flex flex-col items-center justify-center bg-(--hover-bg) border border-(--glass-border) rounded-3xl">
                <IoTimeOutline size={64} className="text-(--text-muted) mb-4" />
                <p className="text-(--text-muted) font-black uppercase tracking-widest text-xs">No time entries found for the selected filters</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6 font-poppins">
                {reportData.map((user) => (
                  <div key={user.user_email} className="group bg-(--hover-bg) border border-(--glass-border) rounded-3xl p-6 hover:border-amber-500/30 transition-all duration-300 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full -mr-16 -mt-16 blur-3xl pointer-events-none" />

                    <div className="flex items-center gap-4 mb-6 relative">
                      <div className="w-14 h-14 bg-amber-500/10 rounded-2xl flex items-center justify-center text-xl font-black text-amber-500 border border-amber-500/20 group-hover:bg-amber-500 group-hover:text-white transition-all duration-500">
                        {user.user_name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-lg font-black text-(--text-main) truncate leading-tight tracking-tight">{user.user_name}</h4>
                        <p className="text-[10px] text-(--text-muted) font-black uppercase tracking-widest mt-0.5">{user.user_dept || 'General'}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="bg-black/20 rounded-2xl p-4 border border-white/5 group-hover:bg-(--primary-glow) transition-colors">
                        <div className="text-[9px] uppercase font-black text-(--text-muted) tracking-widest mb-1">Weekly Hours</div>
                        <div className="text-xl font-black text-(--text-main)">{user.total_hours}h {user.total_minutes}m</div>
                      </div>
                      <div className="bg-black/20 rounded-2xl p-4 border border-white/5 group-hover:bg-(--primary-glow) transition-colors">
                        <div className="text-[9px] uppercase font-black text-(--text-muted) tracking-widest mb-1">Total Entries</div>
                        <div className="text-xl font-black text-(--text-main)">{user.entries.length}</div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="text-[10px] font-black text-(--text-muted) uppercase tracking-[0.2em] mb-2 px-1">Recent Activities</div>
                      {user.entries.slice(0, 3).map((entry, eidx) => (
                        <div key={eidx} className="bg-black/10 rounded-xl p-3 border border-white/5 flex items-start gap-3">
                          <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-(--primary) shrink-0 border border-white/5">
                            <IoFolderOutline size={14} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start gap-2">
                              <div className="text-[11px] font-bold text-(--text-main) truncate">{entry.project}</div>
                              <div className="text-[10px] font-black text-(--primary) whitespace-nowrap">{entry.hours}h {entry.minutes}m</div>
                            </div>
                            <div className="text-[9px] text-(--text-muted) truncate mt-0.5">{new Date(entry.date).toLocaleDateString()} • {entry.task_id}</div>
                          </div>
                        </div>
                      ))}
                      {user.entries.length > 3 && (
                        <button
                          onClick={() => handleCardClick({ label: user.user_name, data: user.entries, type: 'user_detail', detail: `Activities for ${user.user_name}` })}
                          className="w-full py-2 text-[10px] font-black uppercase tracking-widest text-(--text-muted) hover:text-(--text-main) hover:bg-white/5 rounded-xl transition-all border border-dashed border-(--glass-border) mt-2"
                        >
                          View {user.entries.length - 3} More Activities
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

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
              className="w-full max-w-2xl border border-(--glass-border) rounded-2xl overflow-hidden shadow-2xl bg-(--app-bg)"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-white/5 flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-bold text-(--text-main)">
                    {modalContent.title}
                  </h3>
                  <p className="text-sm text-(--text-muted)">
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
    </div >
  );
};