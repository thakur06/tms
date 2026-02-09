import { Link } from 'react-router-dom';
import { FiHome, FiArrowLeft } from 'react-icons/fi';

const NotFound = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 px-4">
      <div className="text-center max-w-md w-full relative">
        {/* Ambient background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 mb-8">
          <h1 className="text-9xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-600 to-amber-400 mb-4 tracking-tighter">
            404
          </h1>
          <h2 className="text-3xl font-black text-white mb-4 tracking-tight">Page Not Found</h2>
          <p className="text-gray-500 text-lg font-medium">
            The page you're looking for doesn't exist or has been moved into a black hole.
          </p>
        </div>

        <div className="relative z-10 flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-amber-500 text-zinc-900 font-black rounded-xl hover:bg-amber-400 transition-all shadow-lg shadow-amber-500/20 uppercase tracking-widest text-xs"
          >
            <FiHome />
            Home
          </Link>
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-white/5 text-gray-400 font-black rounded-xl border border-white/10 hover:bg-white/10 hover:text-white transition-all shadow-sm uppercase tracking-widest text-xs"
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
