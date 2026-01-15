import { useState, useEffect, useRef } from "react";
import { 
  IoCheckmarkCircle, IoFolder, IoLocation 
} from "react-icons/io5";
import Modal from "./Modal";
import { toast } from "react-toastify";

export default function AddTimeModal({
  isOpen, onClose, dateStr, tasks = [], projects = [], onAdd, entry = null, onUpdate, clients = []
}) {
  const isEditMode = !!entry;

  // State handles inputs as strings to allow empty states while typing
  const [formData, setFormData] = useState({
    task: "", project: "", project_code: "", client: "", country: "US", remarks: "", hours: "", minutes: ""
  });

  const [dropdowns, setDropdowns] = useState({ task: false, project: false, client: false });
  const [search, setSearch] = useState({ task: "", project: "", client: "" });
  const [selectedDept, setSelectedDept] = useState("all");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const taskRef = useRef(null);
  const projectRef = useRef(null);
  const clientRef = useRef(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (taskRef.current && !taskRef.current.contains(event.target)) setDropdowns(prev => ({ ...prev, task: false }));
      if (projectRef.current && !projectRef.current.contains(event.target)) setDropdowns(prev => ({ ...prev, project: false }));
      if (clientRef.current && !clientRef.current.contains(event.target)) setDropdowns(prev => ({ ...prev, client: false }));
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen) {
      if (entry) {
        setFormData({
          task: entry.taskName || "", project: entry.project || "", project_code: entry.project_code || "",
          client: entry.client || "", country: entry.country || "US", remarks: entry.remarks || "",
          hours: String(entry.hours || ""), minutes: String(entry.minutes || "")
        });
        setSearch({ task: entry.taskName || "", project: entry.project || "", client: entry.client || "" });
      } else {
        setFormData({ task: "", project: "", project_code: "", client: "", country: "US", remarks: "", hours: "", minutes: "" });
        setSearch({ task: "", project: "", client: "" });
      }
    }
  }, [isOpen, entry]);

  const handleSelect = (field, name, code = "") => {
    setFormData(prev => ({ ...prev, [field]: name, ...(field === 'project' ? { project_code: code } : {}) }));
    setSearch(prev => ({ ...prev, [field]: name }));
    setDropdowns(prev => ({ ...prev, [field]: false }));
  };

  const handleTimeChange = (field, value) => {
    // Only allow numbers
    const cleaned = value.replace(/[^0-9]/g, "").slice(0, 2);
    setFormData(prev => ({ ...prev, [field]: cleaned }));
  };

  const validateAndSubmit = async (e) => {
    e.preventDefault();
    
    // STRICT MANDATORY CHECK
    if (!formData.task) return toast.error("Task is required");
    if (!formData.project) return toast.error("Project is required");
    if (!formData.client) return toast.error("Client is required");
    if (!formData.country) return toast.error("Region is required");
    
    // Check if hours is valid number greater than 0
    const hrsInt = parseInt(formData.hours || "0", 10);
    const minInt = parseInt(formData.minutes || "0", 10);

    if (hrsInt === 0 && minInt === 0) return toast.error("Time must be greater than 0");

    setIsSubmitting(true);
    
    // CONVERT TO INTEGER FOR BACKEND
    const payload = {
      ...formData,
      taskName: formData.task,
      entry_date: dateStr,
      hours: hrsInt,     // Sending as INT
      minutes: minInt    // Sending as INT
    };

    try {
      if (isEditMode) {
        await onUpdate(entry.id, payload);
      } else {
        await onAdd(dateStr, formData.task, hrsInt, minInt, payload);
      }
      onClose();
    } catch (err) {
      console.error(err);
      toast.error("Failed to save entry");
    } finally {
      setIsSubmitting(false);
    }
  };

  const fTasks = tasks.filter(t => (selectedDept === "all" || t.task_dept === selectedDept) && t.task_name.toLowerCase().includes(search.task.toLowerCase()));
  const fProjects = projects.filter(p => p.name.toLowerCase().includes(search.project.toLowerCase()) || p.code?.toLowerCase().includes(search.project.toLowerCase()));
  const fClients = clients.filter(c => c.name.toLowerCase().includes(search.client.toLowerCase()));

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={
        <div className="flex items-center justify-between w-full pr-8"> 
          <div className="flex items-center gap-4">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider hidden sm:block">
              {isEditMode ? "Manage" : "New"}
            </span>
            
            <div className="h-4 w-[1px] bg-white/10 hidden sm:block"></div>

            <div className="flex items-center gap-3">
              <span className="text-lg font-black bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent tracking-tight">
                {isEditMode ? "Edit Time" : "Add Time"}
              </span>
              <span className="text-[10px] font-mono bg-white/10 text-slate-300 px-2 py-0.5 rounded border border-white/5">
                {dateStr}
              </span>
            </div>
          </div>
    
          <div className="flex items-center">
            <button
              onClick={validateAndSubmit}
              disabled={isSubmitting}
              className="flex items-center ml-5 gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg shadow-lg shadow-indigo-500/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                 <div className="w-3 h-3 border-2 border-white/50 border-t-white rounded-full animate-spin" />
              ) : (
                <IoCheckmarkCircle size={16} />
              )}
              {isEditMode ? "Update" : "Save"}
            </button>
          </div>
        </div>
      }
      shellClassName="z-[9999]"
      overlayClassName="z-[9998]"
    >
      <form onSubmit={validateAndSubmit} className="flex flex-col h-full max-h-[55vh] md:max-h-[65vh] px-1 pt-2 pb-4 overflow-y-auto custom-scrollbar">
        <div className="space-y-4 flex-1">
          {/* TASK */}
          <div className="relative" ref={taskRef}>
            <div className="flex justify-between items-center mb-1">
              <label className="ui-label">Task <span className="text-rose-500">*</span></label>
              <select 
                className="text-[9px] font-black bg-slate-800 text-slate-300 rounded px-1 h-6 outline-none border border-slate-700 focus:border-indigo-500" 
                value={selectedDept} 
                onChange={(e) => setSelectedDept(e.target.value)}
              >
                <option value="all">ALL DEPTS</option>
                {[...new Set(tasks.map(t => t.task_dept))].filter(Boolean).map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div className="relative">
              <input 
                className="ui-input pl-9 font-bold"
                placeholder="Select Task..." 
                value={search.task} 
                onFocus={() => setDropdowns(p => ({ ...p, task: true }))} 
                onChange={(e) => setSearch(p => ({ ...p, task: e.target.value }))} 
              />
              <IoFolder className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            </div>
            {dropdowns.task && (
              <div className="absolute top-full left-0 w-full mt-1 bg-[#1e293b] border border-slate-700 rounded-xl shadow-xl max-h-48 overflow-y-auto z-50">
                {fTasks.map(t => (
                  <div key={t.task_id} className="p-3 hover:bg-slate-800 text-slate-300 cursor-pointer border-b border-slate-700 last:border-0 text-xs font-bold" onClick={() => handleSelect('task', t.task_name)}>
                    {t.task_name}
                  </div>
                ))}
                {fTasks.length === 0 && <div className="p-3 text-slate-500 text-xs italic">No tasks found</div>}
              </div>
            )}
          </div>

          {/* PROJECT & CLIENT */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="relative" ref={projectRef}>
              <label className="ui-label block">Project <span className="text-rose-500">*</span></label>
              <input 
                className="ui-input font-bold"
                placeholder="Search..." 
                value={search.project} 
                onFocus={() => setDropdowns(p => ({ ...p, project: true }))} 
                onChange={(e) => setSearch(p => ({ ...p, project: e.target.value }))} 
              />
              {dropdowns.project && (
                <div className="absolute top-full left-0 w-full mt-1 bg-[#1e293b] border border-slate-700 rounded-xl shadow-xl max-h-40 overflow-y-auto z-50">
                  {fProjects.map(p => (
                    <div key={p.id} className="p-2.5 hover:bg-slate-800 text-slate-300 text-xs font-bold cursor-pointer" onClick={() => handleSelect('project', p.name, p.code)}>
                      {p.name} <span className="text-[9px] opacity-40 block">{p.code}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="relative" ref={clientRef}>
              <label className="ui-label block">Client <span className="text-rose-500">*</span></label>
              <input 
                className="ui-input font-bold"
                placeholder="Search..." 
                value={search.client} 
                onFocus={() => setDropdowns(p => ({ ...p, client: true }))} 
                onChange={(e) => setSearch(p => ({ ...p, client: e.target.value }))} 
              />
              {dropdowns.client && (
                <div className="absolute top-full left-0 w-full mt-1 bg-[#1e293b] border border-slate-700 rounded-xl shadow-xl max-h-40 overflow-y-auto z-50">
                  {fClients.map(c => (
                    <div key={c.id} className="p-2.5 hover:bg-slate-800 text-slate-300 text-xs font-bold cursor-pointer" onClick={() => handleSelect('client', c.name)}>
                      {c.name}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* REGION & TIME */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col">
              <label className="ui-label flex items-center gap-1 tracking-tight">
                <IoLocation className="text-indigo-500" /> Region <span className="text-rose-500">*</span>
              </label>
              <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-700 h-[42px]">
                {['US', 'IND'].map(c => (
                  <button 
                    key={c} 
                    type="button" 
                    onClick={() => setFormData(p => ({ ...p, country: c }))} 
                    className={`flex-1 text-[10px] font-black rounded-lg transition-all ${
                      formData.country === c ? "bg-white/10 text-emerald-400 shadow-sm border border-emerald-500/30" : "text-slate-500 hover:text-slate-300"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col">
              <label className="ui-label mb-1 tracking-tight">
                Duration <span className="text-rose-500">*</span>
              </label>
              <div className="flex items-center gap-1 bg-slate-900 px-2 rounded-xl h-[42px] border border-slate-700">
                <div className="flex-1 flex flex-col items-center justify-center">
                  <input 
                    type="text" 
                    inputMode="numeric" 
                    className="w-full bg-transparent text-center text-white text-lg font-black outline-none focus:text-indigo-400 leading-none h-6" 
                    placeholder="0" 
                    value={formData.hours} 
                    onChange={(e) => handleTimeChange('hours', e.target.value)} 
                  />
                  <p className="text-[7px] text-slate-500 font-bold uppercase leading-none mt-0.5">Hrs</p>
                </div>
                
                <span className="text-slate-600 font-bold self-center pb-2">:</span>
                
                <div className="flex-1 flex flex-col items-center justify-center">
                  <input 
                    type="text" 
                    inputMode="numeric" 
                    className="w-full bg-transparent text-center text-white text-lg font-black outline-none focus:text-indigo-400 leading-none h-6" 
                    placeholder="00" 
                    value={formData.minutes} 
                    onChange={(e) => handleTimeChange('minutes', e.target.value)} 
                  />
                  <p className="text-[7px] text-slate-500 font-bold uppercase leading-none mt-0.5">Min</p>
                </div>
              </div>
            </div>
          </div>

          <textarea 
            className="w-full p-3 bg-slate-900 border border-slate-700 rounded-xl text-xs font-bold outline-none focus:border-indigo-500 transition-all resize-none text-slate-300" 
            rows="2" 
            placeholder="Remarks (Optional)..." 
            value={formData.remarks} 
            onChange={(e) => setFormData(p => ({ ...p, remarks: e.target.value }))} 
          />
        </div>
      </form>
    </Modal>
  );
}