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
  const fProjects = projects.filter(p => p.name.toLowerCase().includes(search.project.toLowerCase()) || p.code?.toString().toLowerCase().includes(search.project.toLowerCase()));
  const fClients = clients.filter(c => c.name.toLowerCase().includes(search.client.toLowerCase()));

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={
        <div className="flex items-center justify-between w-full h-12 transition-all"> 
          <div className="flex flex-col">
            <h2 className="text-xl font-black text-gray-900 tracking-tight leading-none uppercase">
              {isEditMode ? "Edit Entry" : "Track Time"}
            </h2>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{isEditMode ? "Modify existing" : "Record new activity"}</span>
              <span className="w-1 h-1 rounded-full bg-gray-300"></span>
              <span className="text-[10px] font-mono font-bold text-[#161efd]">{dateStr}</span>
            </div>
          </div>
    
          <button
            onClick={validateAndSubmit}
            disabled={isSubmitting}
            className="ui-btn ui-btn-primary h-10 px-6 text-xs font-black shadow-none hover:shadow-lg hover:shadow-blue-500/10"
          >
            {isSubmitting ? (
               <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              isEditMode ? "Update" : "Save Entry"
            )}
          </button>
        </div>
      }
      shellClassName="z-[9999]"
      overlayClassName="z-[9998]"
    >
      <form onSubmit={validateAndSubmit} className="flex flex-col h-full max-h-[55vh] md:max-h-[65vh] px-1 pt-2 pb-4 overflow-y-auto custom-scrollbar">
        <div className="space-y-4 flex-1">
          {/* PROJECT - Changed to be first */}
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
              <div className="absolute top-full left-0 w-full mt-1 bg-white border border-gray-100 rounded-xl shadow-xl max-h-40 overflow-y-auto z-50">
                {fProjects.map(p => (
                  <div key={p.id} className="p-2.5 hover:bg-blue-50 text-gray-700 text-xs font-bold cursor-pointer" 
                    onClick={() => {
                      // Auto-set client and country (region) from project
                      setFormData(prev => ({ 
                        ...prev, 
                        project: p.name, 
                        project_code: p.code,
                        client: p.client || "",        // Auto-fetch client
                        country: p.location || "US"   // Auto-fetch location (region)
                      }));
                      setSearch(prev => ({ 
                        ...prev, 
                        project: p.name,
                        client: p.client || ""         // Update client search display too
                      }));
                      setDropdowns(prev => ({ ...prev, project: false }));
                    }}
                  >
                    {p.name} <span className="text-[9px] opacity-40 block">{p.code}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* TASK - Moved below project */}
          <div className="relative" ref={taskRef}>
            {/* <div className="flex justify-between items-center mb-1">
              <label className="ui-label">Task <span className="text-rose-500">*</span></label>
              <select 
                className="text-[9px] font-black bg-gray-800 text-slate-300 rounded px-1 h-6 outline-none border border-slate-700 focus:border-indigo-500" 
                value={selectedDept} 
                onChange={(e) => setSelectedDept(e.target.value)}
              >
                <option value="all">ALL DEPTS</option>
                {[...new Set(tasks.map(t => t.task_dept))].filter(Boolean).map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div> */}
            <div className="relative">
              <input 
                className="ui-input pl-9 font-bold"
                placeholder="Select Task..." 
                value={search.task} 
                onFocus={() => setDropdowns(p => ({ ...p, task: true }))} 
                onChange={(e) => setSearch(p => ({ ...p, task: e.target.value }))} 
              />
              <IoFolder className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            </div>
            {dropdowns.task && (
              <div className="absolute top-full left-0 w-full mt-1 bg-white border border-gray-100 rounded-xl shadow-xl max-h-48 overflow-y-auto z-50">
                {fTasks.map(t => (
                  <div key={t.task_id} className="p-3 hover:bg-blue-50 text-gray-700 cursor-pointer border-b border-gray-50 last:border-0 text-xs font-bold" onClick={() => handleSelect('task', t.task_name)}>
                    {t.task_name}
                  </div>
                ))}
                {fTasks.length === 0 && <div className="p-3 text-gray-400 text-xs italic">No tasks found</div>}
              </div>
            )}
          </div>

          {/* AUTO INFO DISPLAY (Client & Region) */}
          <div className="flex items-center gap-6 py-1 px-1">
             <div className="flex-1">
                <span className="text-[10px] text-gray-400 uppercase font-black tracking-widest block mb-0.5">Client</span>
                <div className="text-sm font-bold text-gray-900 truncate">
                  {formData.client || <span className="text-gray-300 italic">Not set</span>}
                </div>
             </div>
             <div className="h-8 w-[1px] bg-gray-100"></div>
             <div className="flex-1">
                <span className="text-[10px] text-gray-400 uppercase font-black tracking-widest block mb-0.5">Region</span>
                 <div className="flex items-center gap-1.5 text-sm font-bold text-gray-900">
                    <IoLocation className="text-[#161efd]/50" size={14}/>
                    {formData.country || <span className="text-gray-300 italic">Not set</span>}
                 </div>
             </div>
          </div>

          {/* DURATION */}
          <div className="flex flex-col">
            <label className="ui-label mb-2 tracking-tight">Time Duration <span className="text-rose-500">*</span></label>
            <div className="flex items-center gap-4 bg-gray-50/50 p-2 rounded-2xl border border-gray-100 w-fit">
              <div className="flex items-center gap-2">
                <input 
                  type="text" 
                  inputMode="numeric" 
                  className="w-12 h-10 bg-white border border-gray-200 rounded-xl text-center text-gray-900 text-lg font-black outline-none focus:border-[#161efd] focus:ring-4 focus:ring-blue-500/5 transition-all shadow-sm" 
                  placeholder="0" 
                  value={formData.hours} 
                  onChange={(e) => handleTimeChange('hours', e.target.value)} 
                />
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Hrs</span>
              </div>
              
              <span className="text-gray-300 font-black text-xl">:</span>
              
              <div className="flex items-center gap-2">
                <input 
                  type="text" 
                  inputMode="numeric" 
                  className="w-12 h-10 bg-white border border-gray-200 rounded-xl text-center text-gray-900 text-lg font-black outline-none focus:border-[#161efd] focus:ring-4 focus:ring-blue-500/5 transition-all shadow-sm" 
                  placeholder="00" 
                  value={formData.minutes} 
                  onChange={(e) => handleTimeChange('minutes', e.target.value)} 
                />
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Min</span>
              </div>
            </div>
          </div>

          <textarea 
            className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold outline-none focus:border-[#161efd] focus:bg-white transition-all resize-none text-gray-700" 
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