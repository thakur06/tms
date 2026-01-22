import { useEffect, useMemo, useState } from "react";
import { ToastContainer, toast, Zoom } from "react-toastify";

import "react-toastify/dist/ReactToastify.css";
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
    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-left text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent flex items-center gap-3"
    onClick={onClick}
  >
    {Icon && <Icon className="text-indigo-400" size={18} />}
    <span className={value ? "text-white" : "text-slate-400"}>
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
      <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
        {Icon && <Icon className="text-indigo-400" size={14} />}
        {label}
      </label>
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full flex items-center justify-between px-3 py-3 bg-white/5 border rounded-xl text-xs font-medium transition-all ${
            isOpen
              ? "border-indigo-500 bg-white/10 text-white"
              : "border-white/10 text-slate-400"
          }`}
        >
          <span
            className={
              selectedValues.length > 0 ? "text-white" : "text-slate-500"
            }
          >
            {selectedValues.length > 0
              ? `${selectedValues.length} selected`
              : `Select ${label}...`}
          </span>
          <IoChevronDown
            className={`text-indigo-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
            size={14}
          />
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="absolute top-full left-0 right-0 mt-2 bg-[#0f172a] border border-white/10 rounded-xl overflow-hidden z-50 shadow-xl"
            >
              <div className="p-2 border-b border-white/5">
                <div className="relative">
                  <IoSearchOutline
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                    size={12}
                  />
                  <input
                    className="w-full pl-8 pr-3 py-1.5 bg-black/20 rounded-lg text-xs outline-none border border-transparent focus:border-indigo-500/50 text-white"
                    placeholder={`Search ${label}...`}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    autoFocus
                  />
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
                      setSearch(""); // Clear search after selection
                    }}
                    className="w-full px-3 py-2 text-left text-xs text-slate-300 hover:bg-white/5 hover:text-white transition-all flex items-center justify-between rounded-lg"
                  >
                    {opt}
                    {selectedValues.includes(opt) && (
                      <IoCheckmarkCircle
                        className="text-indigo-400"
                        size={14}
                      />
                    )}
                  </button>
                ))}
                {filtered.length === 0 && (
                  <div className="p-2 text-xs text-slate-500 text-center">
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

  // Temporary Filters (Connected to UI inputs)
  const [tempSelectedUsers, setTempSelectedUsers] = useState([]);
  const [tempSelectedDepts, setTempSelectedDepts] = useState([]);

  const [pageTitle, setPageTitle] = useState("Overall Analytics");

  const [isLoading, setIsLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState({
    title: "",
    data: [],
    type: "",
    detail: "",
  });

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

  // Core Fetch Logic (Just gets the raw data based on Date)
  const fetchRawData = async () => {
    if (!startDate || !endDate) return null;
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      const startStr = startDate.toISOString().split("T")[0];
      const endStr = endDate.toISOString().split("T")[0];

      const response = await axios.get(`${server}/api/reports/time-entries`, {
        params: { startDate: startStr, endDate: endStr },
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data.users || [];
    } catch (error) {
      console.error("Failed to fetch report data", error);
      toast.error("Failed to load analytics data");
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  // 1. Fetch User Data Button
  const handleFetchUsers = async () => {
    // Always refresh data to be safe, or check if dates changed. For simplicity, refetch.
    const data = await fetchRawData();
    if (data) {
      setReportData(data);
      setSelectedUsers(tempSelectedUsers);
      setSelectedDepts([]); // Clear dept filter

      // Set Title
      if (tempSelectedUsers.length === 0) setPageTitle("All Users Analytics");
      else setPageTitle(`Data for ${tempSelectedUsers.join(", ")}`);
    }
  };

  // 2. Fetch Dept Data Button
  const handleFetchDepts = async () => {
    const data = await fetchRawData();
    if (data) {
      setReportData(data);
      setSelectedDepts(tempSelectedDepts);
      setSelectedUsers([]); // Clear user filter

      // Set Title
      if (tempSelectedDepts.length === 0)
        setPageTitle("All Departments Analytics");
      else setPageTitle(`Data for ${tempSelectedDepts.join(", ")}`);
    }
  };

  // Initial Fetch on mount
  useEffect(() => {
    // Initial load - acts getting everything
    handleFetchUsers();
  }, []); // Only on mount

  // Metrics Calculation
  const analytics = useMemo(() => {
    // 1. Filter Data based on selection
    let filteredUsers = reportData;

    if (selectedUsers.length > 0) {
      filteredUsers = filteredUsers.filter((u) =>
        selectedUsers.includes(u.user_name),
      );
    }

    if (selectedDepts.length > 0) {
      filteredUsers = filteredUsers.filter((u) =>
        selectedDepts.includes(u.user_dept),
      );
    }

    // 2. Aggregate Entries
    const allEntries = filteredUsers.flatMap((u) => u.entries);

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
      color: "from-blue-500 to-cyan-500",
      type: "projects",
      data: analytics.entriesByCat.project,
      detail: "Unique projects worked on",
    },
    {
      label: "Tasks Worked",
      value: analytics.tasksCount,
      icon: IoStatsChartOutline, // Placeholder, maybe Change
      color: "from-amber-500 to-orange-500",
      type: "tasks",
      data: Object.values(analytics.entriesByCat).flat(), // All entries
      detail: "Unique tasks logged",
    },
    {
      label: "Total Time",
      value: analytics.totalTimeStr,
      icon: IoTimeOutline,
      color: "from-emerald-500 to-teal-500",
      type: "time",
      data: Object.values(analytics.entriesByCat).flat(),
      detail: "Total hours logged",
    },
    {
      label: "Utilization",
      value: `${analytics.utilization}%`,
      icon: IoStatsChartOutline,
      color: "from-purple-500 to-pink-500",
      type: "utilization",
      data: [], // No specific data list
      detail: "Based on 8h/day capacity",
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
      color: "from-red-500 to-rose-500",
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
      color: "from-green-500 to-lime-500",
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
      color: "from-indigo-500 to-violet-500",
      type: "rd",
      data: analytics.entriesByCat.rd,
      detail: "Research & Development",
    },
    {
         label: "Buisness Development",
         value: formatDuration(
           0,
           analytics.entriesByCat.bd.reduce(
             (s, e) => s + e.hours * 60 + e.minutes,
             0,
           ),
         ),
         icon: MdBusiness,
         color: "from-yellow-400 to-yellow-600",
         type: "bd",
         data: analytics.entriesByCat.bd,
         detail: "Buisness Development",
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
         color: "from-yellow-400 to-yellow-600",
         type: "meetings",
         data: analytics.entriesByCat.meetings,
         detail: "Meetings",
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
         color: "from-yellow-400 to-yellow-600",
         type: "BD",
         data: analytics.entriesByCat.holidays,
         detail: "publicholiday",
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
         color: "from-yellow-400 to-yellow-600",
         type: "teambuilding",
         data: analytics.entriesByCat.tb,
         detail: "Team Building",
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
    // Simple list rendering based on type
    if (
      ["projects", "pto", "training", "rd", "tasks"].includes(modalContent.type)
    ) {
      return (
        <div className="space-y-3">
          {modalContent.data.map((item, idx) => (
            <div
              key={idx}
              className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800 rounded-lg"
            >
              <div>
                <div className="font-bold text-slate-900 dark:text-white">
                  {item.name}
                </div>
                {item.code && (
                  <div className="text-xs text-slate-500">{item.code}</div>
                )}
                {item.count && (
                  <div className="text-xs text-slate-500">
                    {item.count} entries
                  </div>
                )}
              </div>
              <div className="text-indigo-400 font-mono font-bold">
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
            className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg"
          >
            <div className="flex justify-between">
              <div className="font-semibold text-slate-900 dark:text-white">
                {item.project}
              </div>
              <div className="text-sm text-slate-400">
                {new Date(item.date).toLocaleDateString()}
              </div>
            </div>
            <div className="text-sm text-indigo-300">{item.task_id}</div>
            <div className="flex justify-between mt-2 text-xs text-slate-500">
              <div>{item.user_name}</div>
              <div className="font-mono text-slate-900 dark:text-white">
                {item.hours}h {item.minutes}m
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-8 pb-10 min-h-screen transition-colors duration-300">
      <ToastContainer theme="colored" />
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <IoAnalytics size={28} />
            </div>
            Analytics 
          </h1>
          <p className="text-slate-400 mt-2 text-sm">
           Track your Project Management Activities here....
          </p>
        </div>
      </header>
      {/* Filters Section */}
      {/* Filters Section */}
      <div className="relative z-10 p-6 bg-gradient-to-r from-white/5 to-white/10 dark:from-slate-900/50 dark:to-slate-800/50 backdrop-blur-sm rounded-2xl border border-white/10 shadow-lg space-y-6">
        {/* Row 1: Date Range (Global) */}
        <div className="flex flex-col md:flex-row gap-4 items-center border-b border-white/5 pb-6">
          <div className="w-full md:w-auto">
            <label className="text-sm font-medium text-slate-300 block mb-2">
              Date Range
            </label>
            <div className="flex gap-4">
              <div className="w-40 relative z-20">
                <DatePicker
                  selected={startDate}
                  onChange={setStartDate}
                  selectsStart
                  startDate={startDate}
                  endDate={endDate}
                  customInput={
                    <CustomInput placeholder="Start Date" icon={FiCalendar} />
                  }
                />
              </div>
              <div className="w-40 relative z-20">
                <DatePicker
                  selected={endDate}
                  onChange={setEndDate}
                  selectsEnd
                  startDate={startDate}
                  endDate={endDate}
                  minDate={startDate}
                  customInput={
                    <CustomInput placeholder="End Date" icon={FiCalendar} />
                  }
                />
              </div>
            </div>
          </div>
          <div className="hidden md:block flex-1 h-[1px] bg-white/5 mx-4" />
        </div>

        {/* Row 2: Split Columns */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {/* Column 1: Departments */}
          <div className="bg-white/5 rounded-xl p-5 border border-white/5 flex flex-col gap-4">
            <div className="flex items-center gap-2 text-indigo-400 font-medium border-b border-white/5 pb-2">
              <FiLayers /> By Department
            </div>
            <MultiSelect
              label="Select Departments"
              options={deptsList}
              selectedValues={tempSelectedDepts}
              onChange={setTempSelectedDepts}
            />
            <button
              onClick={handleFetchDepts}
              disabled={isLoading}
              className="mt-2 w-full h-[40px] bg-indigo-600/20 hover:bg-indigo-600 hover:text-white text-indigo-300 border border-indigo-500/30 rounded-lg flex items-center justify-center gap-2 transition-all font-medium text-sm"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                "Fetch Dept Data"
              )}
            </button>
          </div>

          {/* Column 2: Users */}
          <div className="bg-white/5 rounded-xl p-5 border border-white/5 flex flex-col gap-4">
            <div className="flex items-center gap-2 text-emerald-400 font-medium border-b border-white/5 pb-2">
              <FiUsers /> By User
            </div>
            <MultiSelect
              label="Select Users"
              options={usersList.map((u) => u.name)}
              selectedValues={tempSelectedUsers}
              onChange={setTempSelectedUsers}
            />
            <button
              onClick={handleFetchUsers}
              disabled={isLoading}
              className="mt-2 w-full h-[40px] bg-emerald-600/20 hover:bg-emerald-600 hover:text-white text-emerald-300 border border-emerald-500/30 rounded-lg flex items-center justify-center gap-2 transition-all font-medium text-sm"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                "Fetch User Data"
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Dynamic Title */}
      <motion.div
        className="flex items-center gap-3 px-2"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        key={pageTitle}
      >
        <div className="h-8 w-1 bg-indigo-500 rounded-full" />
        <h2 className="text-2xl font-bold text-white">{pageTitle}</h2>
      </motion.div>

      {/* STATS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="relative group cursor-pointer"
            onClick={() => handleCardClick(card)}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative p-6 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-sm hover:border-indigo-500/30 transition-colors">
              <div className="flex justify-between items-start mb-4">
                <div
                  className={`p-3 rounded-xl bg-gradient-to-br ${card.color} bg-opacity-10 text-white`}
                >
                  <card.icon size={24} />
                </div>
                {card.data && card.data.length > 0 && (
                  <IoArrowUp className="text-slate-500 -rotate-45 group-hover:text-white transition-colors" />
                )}
              </div>
              <div>
                <div className="text-slate-400 text-sm font-medium mb-1">
                  {card.label}
                </div>
                <div className="text-2xl font-bold text-white tracking-tight">
                  {card.value}
                </div>
                <div className="text-xs text-slate-500 mt-2">{card.detail}</div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activity Chart */}
        <div className="p-6 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-sm">
          <h3 className="text-lg font-bold text-white mb-6">Activity Trend</h3>
          <div className="h-[300px] w-full flex items-center justify-center">
            {analytics.chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analytics.chartData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(255,255,255,0.1)"
                  />
                  <XAxis
                    dataKey="date"
                    stroke="#94a3b8"
                    fontSize={12}
                    tickFormatter={(str) =>
                      new Date(str).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                      })
                    }
                  />
                  <YAxis stroke="#94a3b8" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1e293b",
                      borderColor: "rgba(255,255,255,0.1)",
                    }}
                    itemStyle={{ color: "#fff" }}
                    labelStyle={{ color: "#94a3b8" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="hours"
                    stroke="#818cf8"
                    strokeWidth={3}
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-slate-500 flex flex-col items-center">
                <IoStatsChartOutline size={48} className="mb-2 opacity-20" />
                <p>No activity data available</p>
              </div>
            )}
          </div>
        </div>

        {/* Location Chart */}
        <div className="p-6 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-sm">
          <h3 className="text-lg font-bold text-white mb-6">Location Split</h3>
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
                    outerRadius={100}
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                  >
                    {analytics.locationData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          [
                            "#818cf8",
                            "#34d399",
                            "#fbbf24",
                            "#f87171",
                            "#c084fc",
                          ][index % 5]
                        }
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-slate-500 flex flex-col items-center">
                <IoLocationOutline size={48} className="mb-2 opacity-20" />
                <p>No location data available</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {modalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => setModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-2xl bg-slate-900 border border-white/10 rounded-2xl overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-white/10 flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-bold text-white">
                    {modalContent.title}
                  </h3>
                  <p className="text-sm text-slate-400">
                    {modalContent.detail}
                  </p>
                </div>
                <button
                  onClick={() => setModalOpen(false)}
                  className="p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white"
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
