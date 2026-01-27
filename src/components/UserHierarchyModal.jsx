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
              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-[#161efd] mb-4 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                Full Hierarchy
              </div>
            )}
            
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="ui-card p-3 min-w-[240px] border-gray-100 bg-gray-50/50 hover:bg-blue-50 hover:border-blue-200 transition-all group scale-90"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-bold text-sm border border-gray-200 group-hover:bg-[#161efd] group-hover:text-white transition-colors">
                  {manager.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-gray-900 font-bold text-sm">{manager.name}</h3>
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest font-black">{manager.dept}</p>
                </div>
              </div>
            </motion.div>

            {/* Down Arrow Connection */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.3 }}
              transition={{ delay: index * 0.1 + 0.05 }}
              className="h-6 w-px bg-[#161efd] my-1" 
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
            className="ui-card p-6 min-w-[300px] border-[#161efd] bg-blue-50/50 shadow-xl shadow-blue-500/10 ring-1 ring-blue-500/20"
          >
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 rounded-2xl bg-linear-to-br from-[#161efd] to-blue-700 flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-blue-500/20 border border-white/20">
                {user.name.charAt(0)}
              </div>
              <div>
                <h2 className="text-xl font-black text-gray-900">{user.name}</h2>
                <div className="flex flex-col gap-1 mt-1">
                  <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
                    <IoBusinessOutline className="text-[#161efd]" />
                    {user.dept}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
                    <IoMailOutline className="text-[#161efd]" />
                    {user.email}
                  </div>
                </div>
              </div>
            </div>
            
            {user.is_manager && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest bg-[#161efd] text-white shadow-lg shadow-blue-500/20">
                  Manager Role
                </span>
              </div>
            )}
          </motion.div>

          <div className="h-8 w-px bg-linear-to-b from-[#161efd] to-blue-50 mt-4" />
        </section>

        {/* Team Section (Reports to him/her) */}
        <section className="flex flex-col items-center">
          <div className="text-[10px] font-black uppercase tracking-[0.2em] text-[#161efd] mb-6 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
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
                    className="ui-card p-3 border-gray-100 bg-gray-50/50 hover:bg-blue-50 hover:border-blue-200 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400 font-bold group-hover:bg-[#161efd] group-hover:text-white transition-colors">
                        {member.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-gray-900 truncate">{member.name}</p>
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
          className="px-8 py-3 bg-gray-50 hover:bg-gray-100 text-gray-500 hover:text-gray-900 rounded-xl text-xs font-black uppercase tracking-widest transition-all border border-gray-200"
        >
          Close View
        </button>
      </div>
    </Modal>
  );
}
