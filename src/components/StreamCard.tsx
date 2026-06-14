import { Link } from 'react-router-dom';
import { Stream } from '../types';
import { Tv } from 'lucide-react';

interface StreamCardProps {
  stream: Stream;
}

export default function StreamCard({ stream }: StreamCardProps) {
  return (
    <div className="bg-[#0b0b0e] rounded-xl border border-white/5 overflow-hidden shadow-lg hover:border-violet-500/50 hover:shadow-violet-950/20 transition-all duration-300 flex flex-col group h-full">
      {/* Visual Dummy Card Banner */}
      <div className="relative bg-[#050507] aspect-video flex items-center justify-center border-b border-white/5 overflow-hidden">
        {/* Pulsing Red Indicator */}
        <div className="absolute top-3 left-3 z-20 flex items-center gap-1.5 bg-rose-600 text-white font-bold text-[10px] tracking-widest uppercase px-2 py-0.5 rounded shadow">
          <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse shrink-0"></span>
          <span>LIVE</span>
        </div>

        {/* Elegant ambient backdrop gradient matching the video banner */}
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 via-violet-955/15 to-zinc-950 opacity-90 transition-transform duration-500 group-hover:scale-105"></div>

        {/* Streaming Placeholder graphics */}
        <div className="relative z-10 text-zinc-500 group-hover:text-violet-400 group-hover:scale-110 transition-transform duration-300 flex flex-col items-center">
          <Tv className="w-10 h-10 stroke-[1.5]" />
          <span className="text-[9px] uppercase tracking-widest mt-2 font-semibold font-mono">Channel Session</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex-grow flex flex-col justify-between">
        <div>
          <h3 className="font-display font-medium text-base text-zinc-100 group-hover:text-violet-400 transition-colors line-clamp-1">
            {stream.title}
          </h3>
          <p className="text-violet-400 text-xs font-semibold mt-1">
            @{stream.streamerName}
          </p>
          {stream.description && (
            <p className="text-zinc-400 text-xs mt-2 line-clamp-2 italic h-8 leading-relaxed">
              {stream.description}
            </p>
          )}
        </div>

        <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
          <div className="text-violet-400/80 text-[10px] font-bold uppercase tracking-wider font-mono">
            On Air
          </div>
          <Link
            to={`/streams/${stream.id}`}
            className="inline-flex items-center justify-center bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs px-3.5 py-1.5 rounded-lg transition-colors group-hover:shadow"
          >
            Watch
          </Link>
        </div>
      </div>
    </div>
  );
}

