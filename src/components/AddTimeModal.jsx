import { useState, useEffect, useRef } from "react";
import { 
  IoCheckmarkCircle, IoFolder, IoLocation 
} from "react-icons/io5";
import Modal from "./Modal";
import { toast } from "react-toastify";

export default function AddTimeModal({
  isOpen, onClose, dateStr, tasks = [], projects = [], selectedUser, onAdd, entry = null, onUpdate, clients = []
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
      user: selectedUser,
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
      <div className="grid items-center grid-cols-3 w-full pr-8"> 
        {/* 1. Left Side: Date String */}
        <div className="">
          <span className="text-[10px] font-black uppercase text-slate-400 tracking-tight whitespace-nowrap">
            {dateStr}
          </span>
        </div>
  
        {/* 2. Middle: Save Button */}
        <div className=" justify-center items-center w-32">
          <button
            onClick={validateAndSubmit}
            disabled={isSubmitting}
            className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.15em] text-white bg-indigo-600 px-4 py-1.5 rounded-full shadow-lg shadow-indigo-100 active:scale-95 transition-all disabled:opacity-50"
          >
            {isSubmitting ? (
              <span className="animate-pulse">...</span>
            ) : (
              <>
                <IoCheckmarkCircle size={14} />
                {isEditMode ? "Update" : "Save"}
              </>
            )}
          </button>
        </div>
  
        
      </div>
    }
  >
      
      {/* LAYOUT FIX: 
         1. h-full and flex-col ensures form takes available space.
         2. max-h-[80vh] is better for mobile keyboards than fixed 60vh.
         3. overflow-y-auto enables scrolling ONLY inside the form body.
      */}
      <form onSubmit={validateAndSubmit} className="flex flex-col h-full max-h-[55vh] md:max-h-[65vh] px-1 pt-2 pb-4 overflow-y-auto no-scrollbar">
        
        <div className="space-y-4 flex-1">
          
          {/* TASK (MANDATORY) - Z-INDEX HIGH */}
          <div className="relative z-50" ref={taskRef}>
            <div className="flex justify-between items-center mb-1">
              <label className="text-[10px] font-black text-slate-500 uppercase">Task <span className="text-rose-500">*</span></label>
              <select className="text-[9px] font-black bg-slate-100 rounded px-1 h-6 outline-none border border-transparent focus:border-indigo-300" value={selectedDept} onChange={(e) => setSelectedDept(e.target.value)}>
                <option value="all">ALL DEPTS</option>
                {[...new Set(tasks.map(t => t.task_dept))].filter(Boolean).map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div className="relative">
              <input className="w-full pl-9 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition-all"
                placeholder="Select Task..." value={search.task} onFocus={() => setDropdowns(p => ({ ...p, task: true }))} onChange={(e) => setSearch(p => ({ ...p, task: e.target.value }))} />
              <IoFolder className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>
            {dropdowns.task && (
              <div className="absolute top-full left-0 w-full mt-1 bg-white border border-slate-900 rounded-xl shadow-2xl max-h-48 overflow-y-auto  hide-y-scroll z-50">
                {fTasks.map(t => (
                  <div key={t.task_id} className="p-3 hover:bg-slate-50 cursor-pointer border-b border-slate-50 text-xs font-bold" onClick={() => handleSelect('task', t.task_name)}>
                    {t.task_name}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* PROJECT & CLIENT (MANDATORY) - Z-INDEX MID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 relative z-40">
            <div className="relative" ref={projectRef}>
              <label className="text-[10px] font-black text-slate-500 uppercase mb-1 block">Project <span className="text-rose-500">*</span></label>
              <input className="w-full px-3 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition-all"
                placeholder="Search..." value={search.project} onFocus={() => setDropdowns(p => ({ ...p, project: true }))} onChange={(e) => setSearch(p => ({ ...p, project: e.target.value }))} />
              {dropdowns.project && (
                <div className="absolute top-full left-0 w-full mt-1 bg-white border border-slate-900 rounded-xl shadow-2xl max-h-40 overflow-y-auto hide-y-scroll z-50">
                  {fProjects.map(p => (
                    <div key={p.id} className="p-2.5 hover:bg-indigo-50 text-xs font-bold cursor-pointer" onClick={() => handleSelect('project', p.name, p.code)}>
                      {p.name} <span className="text-[9px] opacity-40 block">{p.code}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="relative" ref={clientRef}>
              <label className="text-[10px] font-black text-slate-500 uppercase mb-1 block">Client <span className="text-rose-500">*</span></label>
              <input className="w-full px-3 md:py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition-all"
                placeholder="Search..." value={search.client} onFocus={() => setDropdowns(p => ({ ...p, client: true }))} onChange={(e) => setSearch(p => ({ ...p, client: e.target.value }))} />
              {dropdowns.client && (
                <div className="absolute top-full left-0 w-full mt-1 bg-white border border-slate-900 rounded-xl shadow-2xl max-h-40 overflow-y-auto hide-y-scroll -50">
                  {fClients.map(c => (
                    <div key={c.id} className="p-2.5 hover:bg-indigo-50 text-xs font-bold cursor-pointer" onClick={() => handleSelect('client', c.name)}>
                      {c.name}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* REGION & TIME - Z-INDEX LOW */}
          <div className="grid grid-cols-2 gap-3 relative z-10">
  {/* Left Column: Region */}
  <div className="flex flex-col">
    <label className="text-[10px] font-black text-slate-500 uppercase flex items-center gap-1 mb-1 tracking-tight">
      <IoLocation className="text-indigo-500" /> Region <span className="text-rose-500">*</span>
    </label>
    <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 h-[52px]">
      {['US', 'IND'].map(c => (
        <button 
          key={c} 
          type="button" 
          onClick={() => setFormData(p => ({ ...p, country: c }))} 
          className={`flex-1 text-[10px] font-black rounded-lg transition-all ${
            formData.country === c ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400"
          }`}
        >
          {c}
        </button>
      ))}
    </div>
  </div>

  {/* Right Column: Time */}
  <div className="flex flex-col">
    <label className="text-[10px] font-black text-slate-500 uppercase mb-1 tracking-tight">
      Duration <span className="text-rose-500">*</span>
    </label>
    <div className="flex items-center gap-1 bg-slate-900 px-2 rounded-xl h-[52px]">
      <div className="flex-1 flex flex-col items-center">
        <input 
          type="text" 
          inputMode="numeric" 
          className="w-full bg-transparent text-center text-white text-lg font-black outline-none border-b border-slate-700 focus:border-indigo-400 leading-none" 
          placeholder="0" 
          value={formData.hours} 
          onChange={(e) => handleTimeChange('hours', e.target.value)} 
        />
        <p className="text-[7px] text-slate-500 font-bold mt-1 uppercase">Hrs</p>
      </div>
      
      <span className="text-slate-600 font-bold self-center pb-3">:</span>
      
      <div className="flex-1 flex flex-col items-center">
        <input 
          type="text" 
          inputMode="numeric" 
          className="w-full bg-transparent text-center text-white text-lg font-black outline-none border-b border-slate-700 focus:border-indigo-400 leading-none" 
          placeholder="00" 
          value={formData.minutes} 
          onChange={(e) => handleTimeChange('minutes', e.target.value)} 
        />
        <p className="text-[7px] text-slate-500 font-bold mt-1 uppercase">Min</p>
      </div>
    </div>
  </div>
</div>

          <textarea className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-indigo-600 transition-all resize-none" rows="2" placeholder="Remarks (Optional)..." value={formData.remarks} onChange={(e) => setFormData(p => ({ ...p, remarks: e.target.value }))} />
        </div>

        {/* Footer Button - Always at bottom */}
        <div className="mt-4 pt-2 border-t border-slate-100">
          
        </div>

      </form>
    </Modal>
  );
}