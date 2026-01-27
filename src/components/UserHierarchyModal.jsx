import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  IoChevronDown, IoChevronUp, IoGitNetworkOutline, IoPersonOutline, 
  IoArrowDownOutline, IoArrowUpOutline, IoMailOutline, IoBusinessOutline
} from 'react-icons/io5';
import Modal from './Modal';
import axios from 'axios';

export default function UserHierarchyModal({ isOpen, onClose, user, allUsers = [] }) {
   const server=import.meta.env.VITE_SERVER_ADDRESS;
  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && user) {
      fetchTeam();
    }
  }, [isOpen, user]);

  const upwardChain = useMemo(() => {
    if (!user || !allUsers.length) return [];
    const chain = [];
    let current = user;
    let depth = 0;
    while (current && current.reporting_manager_id && depth < 15) { // Safety limit to prevent infinite loops
      const managerId = parseInt(current.reporting_manager_id);
      const manager = allUsers.find(u => u.id === managerId);
      
      if (manager && !chain.some(m => m.id === manager.id)) {
        chain.unshift(manager); // Add to the beginning to keep top-down order
        current = manager;
        depth++;
      } else {
        break;
      }
    }
    return chain;
  }, [user, allUsers]);

  const fetchTeam = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${server}/api/users/${user.id}/team`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTeam(response.data);
    } catch (error) {
      console.error('Failed to fetch team members:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${user.name}'s Hierarchy`}
      shellClassName="max-w-xl"
    >
      <div className="space-y-2 py-4">
        {/* Full Upward Hierarchy */}
        {upwardChain.map((manager, index) => (
          <div key={manager.id} className="flex flex-col items-center">
            {index === 0 && (
              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-500 mb-4 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
                Full Hierarchy
              </div>
            )}
            
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="ui-card p-3 min-w-[240px] border-white/5 bg-zinc-800 hover:bg-amber-500/10 hover:border-amber-500/30 transition-all group scale-90"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center text-gray-300 font-bold text-sm border border-white/10 group-hover:bg-amber-500 group-hover:text-zinc-950 transition-colors">
                  {manager.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-white font-bold text-sm">{manager.name}</h3>
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest font-black">{manager.dept}</p>
                </div>
              </div>
            </motion.div>

            {/* Down Arrow Connection */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.3 }}
              transition={{ delay: index * 0.1 + 0.05 }}
              className="h-6 w-px bg-amber-500/50 my-1" 
            />
          </div>
        ))}

        {!upwardChain.length && !user.manager_name && (
          <div className="text-center text-gray-500 text-sm italic mb-8 font-medium">This user is at the top of the hierarchy</div>
        )}

        {/* Selected User Section (Hero) */}
        <section className="relative flex flex-col items-center">
          <motion.div 
            layoutId={`user-${user.id}`}
            className="ui-card p-6 min-w-[300px] border-amber-500/50 bg-amber-500/5 shadow-xl shadow-amber-500/10 ring-1 ring-amber-500/20"
          >
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 rounded-2xl bg-linear-to-br from-amber-500 to-amber-600 flex items-center justify-center text-zinc-950 font-black text-2xl shadow-lg shadow-amber-500/20 border border-white/20">
                {user.name.charAt(0)}
              </div>
              <div>
                <h2 className="text-xl font-black text-white">{user.name}</h2>
                <div className="flex flex-col gap-1 mt-1">
                  <div className="flex items-center gap-2 text-xs text-gray-400 font-medium">
                    <IoBusinessOutline className="text-amber-500" />
                    {user.dept}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-400 font-medium">
                    <IoMailOutline className="text-amber-500" />
                    {user.email}
                  </div>
                </div>
              </div>
            </div>
            
            {user.is_manager && (
              <div className="mt-4 pt-4 border-t border-white/10">
                <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest bg-amber-500 text-zinc-950 shadow-lg shadow-amber-500/20">
                  Manager Role
                </span>
              </div>
            )}
          </motion.div>

          <div className="h-8 w-px bg-linear-to-b from-amber-500 to-transparent mt-4" />
        </section>

        {/* Team Section (Reports to him/her) */}
        <section className="flex flex-col items-center">
          <div className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-500 mb-6 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
            Team Members
          </div>

          {loading ? (
            <div className="animate-pulse flex flex-col items-center gap-4">
              <div className="h-12 w-48 bg-gray-50 rounded-xl" />
              <div className="h-12 w-48 bg-gray-50 rounded-xl" />
            </div>
          ) : team.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
              <AnimatePresence>
                {team.map((member, idx) => (
                  <motion.div
                    key={member.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.05 }}
                    className="ui-card p-3 border-white/5 bg-zinc-800 hover:bg-amber-500/10 hover:border-amber-500/30 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-zinc-700 flex items-center justify-center text-gray-400 font-bold group-hover:bg-amber-500 group-hover:text-zinc-950 transition-colors">
                        {member.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-white truncate">{member.name}</p>
                        <p className="text-[10px] text-gray-500 truncate">{member.dept}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <div className="text-gray-400 text-sm italic flex flex-col items-center gap-2 mt-4 font-medium">
              <IoPersonOutline size={24} className="opacity-20" />
              No direct reports
            </div>
          )}
        </section>
      </div>

      <div className="mt-8 flex justify-center">
        <button
          onClick={onClose}
          className="px-8 py-3 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all border border-white/10"
        >
          Close View
        </button>
      </div>
    </Modal>
  );
}
