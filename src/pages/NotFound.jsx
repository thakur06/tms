import { Link } from 'react-router-dom';
import { FiHome, FiArrowLeft } from 'react-icons/fi';

const NotFound = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] px-4">
      <div className="text-center max-w-md w-full relative">
        {/* Ambient background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 mb-8">
          <h1 className="text-9xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#161efd] to-blue-700 mb-4 tracking-tighter">
            404
          </h1>
          <h2 className="text-3xl font-black text-gray-900 mb-4 tracking-tight">Page Not Found</h2>
          <p className="text-gray-500 text-lg font-medium">
            The page you're looking for doesn't exist or has been moved into a black hole.
          </p>
        </div>

        <div className="relative z-10 flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/dashboard"
            className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-[#161efd] text-white font-black rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 uppercase tracking-widest text-xs"
          >
            <FiHome />
            Dashboard
          </Link>
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-white text-gray-500 font-black rounded-xl border border-gray-200 hover:bg-gray-50 hover:text-gray-900 transition-all shadow-sm uppercase tracking-widest text-xs"
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
