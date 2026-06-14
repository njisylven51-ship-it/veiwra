import { Link, useNavigate } from 'react-router-dom';
import { Tv, LogOut, User as UserIcon, Plus } from 'lucide-react';

interface NavbarProps {
  user: { id: string; username: string } | null;
  onLogout: () => void;
}

export default function Navbar({ user, onLogout }: NavbarProps) {
  const navigate = useNavigate();

  return (
    <nav className="h-14 bg-[#0d0d10] border-b border-white/5 text-zinc-100 flex items-center justify-between px-6 shrink-0 sticky top-0 z-50 shadow-md">
      <Link to="/" className="flex items-center gap-2.5 hover:opacity-90 transition-opacity">
        <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(139,92,246,0.3)]">
          <Tv className="w-4.5 h-4.5 text-white" />
        </div>
        <span className="font-display font-bold text-lg tracking-wider text-white uppercase">VIEWRA</span>
        <span className="text-violet-400 font-bold text-[10px] tracking-wider uppercase py-0.5 px-2 bg-violet-500/10 rounded-full border border-violet-500/20">
          Live
        </span>
      </Link>

      <div className="flex items-center gap-4">
        {user ? (
          <>
            <Link
              to="/create"
              className="flex items-center gap-1.5 px-4 py-1.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-xs font-bold transition-all shadow-lg shadow-violet-900/20"
            >
              <Plus className="w-4 h-4" />
              <span>Go Live</span>
            </Link>

            <div className="flex items-center gap-3 border-l border-white/5 pl-4">
              <div className="flex items-center gap-2 bg-zinc-900 border border-white/5 py-1 px-3 rounded-lg text-xs font-semibold text-zinc-300">
                <UserIcon className="w-3.5 h-3.5 text-violet-400" />
                <span className="max-w-[120px] truncate">{user.username}</span>
              </div>

              {/* Avatar decoration */}
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-violet-500 to-fuchsia-500 p-[1px] hidden sm:block shrink-0">
                <div className="w-full h-full rounded-full bg-zinc-900 flex items-center justify-center overflow-hidden">
                  <img
                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`}
                    alt="User"
                    className="w-full h-full"
                    referrerPolicy="no-referrer"
                  />
                </div>
              </div>

              <button
                onClick={() => {
                  onLogout();
                  navigate('/login');
                }}
                title="Sign Out"
                className="p-1.5 text-zinc-400 hover:text-rose-455 hover:bg-rose-500/10 rounded-lg transition-colors border border-transparent hover:border-rose-500/10"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </>
        ) : (
          <div className="flex items-center gap-2">
            <Link
              to="/login"
              className="text-zinc-300 hover:text-white font-semibold text-xs py-1.5 px-3.5 rounded-lg hover:bg-zinc-800/40 transition-colors"
            >
              Log In
            </Link>
            <Link
              to="/register"
              className="bg-zinc-800/60 hover:bg-zinc-800 text-white font-semibold text-xs py-1.5 px-4 rounded-lg border border-white/5 transition-colors"
            >
              Sign Up
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}

