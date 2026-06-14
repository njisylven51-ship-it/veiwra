import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { Video, Type, AlignLeft, AlertCircle, PlayCircle } from 'lucide-react';

interface CreateStreamProps {
  user: { id: string; username: string } | null;
}

export default function CreateStream({ user }: CreateStreamProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Guard routing - redirect to login if unauthenticated
  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('A stream title is required to publish.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await api.post('/api/streams', {
        title: title.trim(),
        description: description.trim()
      });

      const { stream } = response.data;
      // Navigate to stream room
      navigate(`/streams/${stream.id}`);
    } catch (err: any) {
      console.error('Failed to create stream:', err);
      setError(
        err.response?.data?.error || 'Could not instantiate stream channel. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="flex-grow flex flex-col justify-center items-center px-4 py-16 bg-[#09090b]">
      <div className="w-full max-w-[480px] bg-[#0d0d10] border border-white/5 rounded-2xl p-8 shadow-2xl relative">
        
        {/* Brand Banner Header */}
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="bg-violet-600 p-3 rounded-xl text-white mb-3 shadow-lg shadow-violet-900/10">
            <Video className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-display font-medium tracking-tight text-white">Configure studio</h2>
          <p className="text-zinc-400 text-xs mt-1.5 font-sans">Configure your broadcast metadata before going live</p>
        </div>

        {/* Error Callout */}
        {error && (
          <div className="mb-5 bg-rose-500/10 border border-rose-500/25 text-rose-450 p-3.5 rounded-lg text-xs flex gap-2.5 items-start">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
            <span className="font-medium leading-relaxed">{error}</span>
          </div>
        )}

        {/* Create stream form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title input */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider pl-1">
              Stream Title
            </label>
            <div className="relative">
              <Type className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-zinc-500" />
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={80}
                placeholder="e.g. Speedcoding full-stack MVP Viewra!"
                className="w-full bg-zinc-950/40 border border-white/10 hover:border-white/15 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 rounded-lg pl-10 pr-4 py-2.5 text-zinc-100 placeholder-zinc-500 focus:outline-none transition-all text-xs"
              />
            </div>
            <div className="flex justify-between items-center pl-1 text-[10px] text-zinc-500">
              <span>Be catchy and descriptive</span>
              <span>{title.length}/80</span>
            </div>
          </div>

          {/* Description input */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider pl-1">
              Description (Optional)
            </label>
            <div className="relative">
              <AlignLeft className="absolute left-3.5 top-3 w-4.5 h-4.5 text-zinc-500" />
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={400}
                rows={4}
                placeholder="Describe your stream goals, topics, or links..."
                className="w-full bg-zinc-950/40 border border-white/10 hover:border-white/15 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 rounded-lg pl-10 pr-4 py-2.5 text-zinc-100 placeholder-zinc-500 focus:outline-none transition-all text-xs"
              />
            </div>
            <div className="flex justify-between items-center pl-1 text-[10px] text-zinc-500">
              <span>Supports up to 400 characters</span>
              <span>{description.length}/400</span>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-violet-600 hover:bg-violet-750 disabled:bg-zinc-805 disabled:cursor-not-allowed text-white font-bold py-2.5 px-4 rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg shadow-violet-900/15 mt-4 text-xs"
          >
            {loading ? (
              <span className="flex items-center gap-1.5">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin font-semibold"></span>
                <span>Opening studio...</span>
              </span>
            ) : (
              <>
                <PlayCircle className="w-4 h-4 text-white" />
                <span>Initialize Channel</span>
              </>
            )}
          </button>
        </form>

      </div>
    </div>
  );
}
