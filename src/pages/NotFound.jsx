import { Link } from 'react-router-dom';
import { FiHome, FiArrowLeft } from 'react-icons/fi';

const NotFound = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f172a] px-4">
      <div className="text-center max-w-md w-full relative">
        {/* Ambient background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 mb-8">
          <h1 className="text-9xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-cyan-500 mb-4 drop-shadow-[0_0_15px_rgba(99,102,241,0.5)]">
            404
          </h1>
          <h2 className="text-3xl font-bold text-white mb-4">Page Not Found</h2>
          <p className="text-slate-400 text-lg">
            The page you're looking for doesn't exist or has been moved into a black hole.
          </p>
        </div>

        <div className="relative z-10 flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/dashboard"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-500 transition-all transform hover:scale-105 shadow-lg shadow-indigo-500/25"
          >
            <FiHome />
            Go to Dashboard
          </Link>
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white/5 text-slate-300 font-bold rounded-xl border border-white/10 hover:bg-white/10 transition-all transform hover:scale-105"
          >
            <FiArrowLeft />
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
