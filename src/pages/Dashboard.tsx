import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { Stream } from '../types';
import StreamCard from '../components/StreamCard';
import { RefreshCw, Play, Plus, Tv, HelpCircle, Activity } from 'lucide-react';

interface DashboardProps {
  user: { id: string; username: string } | null;
}

export default function Dashboard({ user }: DashboardProps) {
  const [streams, setStreams] = useState<Stream[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchLiveStreams = async (showRefreshState = false) => {
    if (showRefreshState) {
      setIsRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const response = await api.get('/api/streams');
      setStreams(response.data);
    } catch (err) {
      console.error('Failed to retrieve live stream listings:', err);
      setError('Could not download active stream directory. Retrying...');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLiveStreams();

    // Auto poll directory list every 20 seconds
    const interval = setInterval(() => {
      fetchLiveStreams(true);
    }, 20000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex-grow bg-[#09090b] p-6 md:p-10 text-zinc-100 max-w-7xl w-full mx-auto">
      
      {/* Banner / Header Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10 pb-5 border-b border-white/5">
        <div>
          <h1 className="text-3xl md:text-4xl font-display font-bold tracking-tight text-white flex items-center gap-3">
            <Activity className="w-8 h-8 text-violet-500 animate-pulse shrink-0" />
            <span>Browse Channels</span>
          </h1>
          <p className="text-zinc-400 mt-2 text-sm leading-relaxed max-w-xl">
            Watch low-latency web streams instantly, join real-time chat rooms, and broadcast directly from your browser.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchLiveStreams(true)}
            disabled={loading || isRefreshing}
            className="flex items-center gap-1.5 bg-zinc-900 border border-white/5 hover:bg-zinc-800 text-zinc-300 hover:text-white text-xs font-semibold py-2 px-4 rounded-lg transition-all disabled:opacity-50"
            title="Refresh stream listings"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'Reloading...' : 'Refresh'}</span>
          </button>

          {user ? (
            <Link
              to="/create"
              className="flex items-center gap-1.5 bg-violet-600 hover:bg-violet-750 text-white text-xs font-bold py-2 px-4 rounded-lg transition-all shadow-lg shadow-violet-900/20"
            >
              <Plus className="w-4 h-4" />
              <span>Go Live</span>
            </Link>
          ) : (
            <Link
              to="/login"
              className="flex items-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold py-2 px-4 rounded-lg border border-white/5 transition-all shadow-md"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Start Casting</span>
            </Link>
          )}
        </div>
      </div>

      {/* Main Grid display area */}
      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center text-center">
          <div className="w-10 h-10 border-4 border-violet-500/20 border-t-violet-500 rounded-full animate-spin mb-4"></div>
          <p className="text-zinc-405 font-medium text-sm">Downloading active directories...</p>
        </div>
      ) : error ? (
        <div className="py-16 bg-zinc-900 border border-white/5 rounded-2xl text-center p-8 max-w-md mx-auto">
          <div className="w-12 h-12 bg-rose-500/10 text-rose-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-rose-500/20">
            <HelpCircle className="w-6 h-6" />
          </div>
          <h3 className="text-zinc-200 font-semibold text-lg">Failed to grab channels</h3>
          <p className="text-zinc-400 text-xs mt-1.5 leading-relaxed">{error}</p>
          <button
            onClick={() => fetchLiveStreams(false)}
            className="mt-5 bg-violet-600 hover:bg-violet-700 text-white font-semibold text-xs py-2 px-4 rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      ) : streams.length === 0 ? (
        /* Expanded Empty State */
        <div className="py-20 bg-[#0d0d10] border border-white/5 rounded-2xl text-center px-6 max-w-2xl mx-auto flex flex-col items-center">
          <div className="bg-violet-600/10 text-violet-400 p-5 rounded-full border border-violet-500/20 mb-5">
            <Tv className="w-12 h-12 stroke-[1.5]" />
          </div>
          <h2 className="text-xl md:text-2xl font-display font-semibold text-white">No active streams</h2>
          <p className="text-zinc-450 mt-2 text-sm leading-relaxed max-w-md">
            All channels are currently offline. {user ? 'You can start your own stream now and be the first to broadcast!' : 'Sign in to create a channel and start broadcasting.'}
          </p>
          
          <div className="mt-8 flex gap-3">
            {user ? (
              <Link
                to="/create"
                className="bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs py-2.5 px-5 rounded-lg transition-all shadow-lg shadow-violet-900/20"
              >
                Create a Broadcast
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs py-2.5 px-5 rounded-lg transition-all shadow-lg shadow-violet-900/20"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white font-bold text-xs py-2.5 px-5 rounded-lg border border-white/5 transition-colors"
                >
                  Create Account
                </Link>
              </>
            )}
          </div>
        </div>
      ) : (
        /* Live channels Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {streams.map((stream) => (
            <div key={stream.id}>
              <StreamCard stream={stream} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
