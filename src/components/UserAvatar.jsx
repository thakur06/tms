import { useMemo } from 'react';

export default function UserAvatar({ name = 'User', email = '', size = 'md', className = '' }) {
  // Premium palette for avatars
  const colors = [
    'from-blue-500 to-indigo-600',
    'from-emerald-500 to-teal-600',
    'from-violet-500 to-purple-600',
    'from-rose-500 to-pink-600',
    'from-amber-500 to-orange-600',
    'from-cyan-500 to-blue-600',
    'from-fuchsia-500 to-purple-600',
  ];

  // Helper to hash string to a stable index
  const hashString = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash);
  };

  const initials = useMemo(() => {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
    }
    return name.charAt(0).toUpperCase();
  }, [name]);

  const colorGradient = useMemo(() => {
    const hash = hashString(email || name);
    return colors[hash % colors.length];
  }, [email, name]);

  const sizeClasses = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-xl',
  };

  return (
    <div 
      className={`shrink-0 rounded-xl bg-linear-to-tr ${colorGradient} flex items-center justify-center text-white font-black shadow-lg shadow-blue-500/10 ${sizeClasses[size]} ${className}`}
      title={name}
    >
      {initials}
    </div>
  );
}
