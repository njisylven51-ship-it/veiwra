import { useEffect, useRef, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import api from '../utils/api';
import { Stream, Message } from '../types';
import VideoPlayer from '../components/VideoPlayer';
import ChatBox from '../components/ChatBox';
import { Radio, Users, Eye, ArrowLeft, AlertCircle, PlayCircle, StopCircle, Tv } from 'lucide-react';

interface StreamRoomProps {
  user: { id: string; username: string } | null;
}

export default function StreamRoom({ user }: StreamRoomProps) {
  const { id: streamId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [stream, setStream] = useState<Stream | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [viewerCount, setViewerCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // LiveKit token details
  const [lkToken, setLkToken] = useState<string>('');
  const [lkUrl, setLkUrl] = useState<string>('');
  const [lkIsMock, setLkIsMock] = useState(true);

  const socketRef = useRef<Socket | null>(null);

  // Protect route - Redirect guest to login
  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  // Step 1: Download initial stream metadata and LiveKit token
  const fetchStreamDataAndToken = async () => {
    if (!streamId || !user) return;
    try {
      setLoading(true);
      setError(null);

      // Download Stream metadata
      const streamRes = await api.get(`/api/streams/${streamId}`);
      setStream(streamRes.data);

      // Get secure LiveKit Cloud casting token
      const tokenRes = await api.post('/api/livekit/token', { streamId });
      setLkToken(tokenRes.data.token);
      setLkUrl(tokenRes.data.serverUrl);
      setLkIsMock(!!tokenRes.data.isMock);

    } catch (err: any) {
      console.error('Failed to load stream components:', err);
      setError(err.response?.data?.error || 'Could not join stream room.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStreamDataAndToken();
  }, [streamId, user]);

  // Step 2: Establish Socket.IO chat and presence connection
  useEffect(() => {
    if (!streamId || !user || !stream) return;

    // Direct Socket connection pointing to the fullstack host url
    const socketUrl = (import.meta as any).env.VITE_API_URL || window.location.origin;
    const socket = io(socketUrl, {
      transports: ['websocket', 'polling']
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Socket client connected to realtime endpoint:', socket.id);
      // Join targeted stream room channel
      socket.emit('join_room', {
        streamId,
        username: user.username,
        userId: user.id
      });
    });

    // Receive historical messages
    socket.on('chat_history', (history: Message[]) => {
      setMessages(history);
    });

    // Receive live incoming message
    socket.on('chat_message', (msg: Message) => {
      setMessages((prev) => {
        // Idempotency: verify no duplicate ID exists already
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    });

    // Receive viewer metrics updates
    socket.on('viewer_count_update', ({ viewerCount }: { viewerCount: number }) => {
      setViewerCount(viewerCount);
    });

    // Receive stream state updates
    socket.on('stream_status_broadcast', ({ status }: { status: 'IDLE' | 'LIVE' | 'ENDED' }) => {
      setStream((prev) => {
        if (!prev) return prev;
        return { ...prev, status };
      });
    });

    return () => {
      if (socket) {
        socket.emit('leave_room');
        socket.disconnect();
        console.log('Socket client disconnected cleanly from room');
      }
    };
  }, [streamId, user, !!stream]);

  // Start Broadcast call (Streamer)
  const handleStartBroadcast = async () => {
    if (!stream || !user) return;
    try {
      const res = await api.patch(`/api/streams/${stream.id}/start`);
      const updatedStream = res.data.stream;
      setStream((prev) => prev ? { ...prev, status: 'LIVE' } : null);

      // Distribute state transition down the Socket pipeline
      if (socketRef.current) {
        socketRef.current.emit('stream_status_update', {
          streamId: stream.id,
          status: 'LIVE'
        });
      }
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to start broadcast.');
    }
  };

  // End Broadcast call (Streamer)
  const handleEndBroadcast = async () => {
    if (!stream || !user) return;
    if (!confirm('Are you ready to end your live stream?')) return;
    try {
      const res = await api.patch(`/api/streams/${stream.id}/end`);
      setStream((prev) => prev ? { ...prev, status: 'ENDED' } : null);

      if (socketRef.current) {
        socketRef.current.emit('stream_status_update', {
          streamId: stream.id,
          status: 'ENDED'
        });
      }
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to end stream.');
    }
  };

  // Post live chat message
  const handleSendMessage = (content: string) => {
    if (socketRef.current && stream && user) {
      socketRef.current.emit('send_message', {
        streamId: stream.id,
        userId: user.id,
        content
      });
    }
  };

  if (loading) {
    return (
      <div className="flex-grow flex flex-col items-center justify-center p-12 bg-[#09090b] text-zinc-400">
        <div className="w-12 h-12 border-4 border-violet-500/10 border-t-violet-500 rounded-full animate-spin mb-4"></div>
        <p className="font-semibold text-xs tracking-wide">Synchronizing Room & Media Feeds...</p>
      </div>
    );
  }

  if (error || !stream) {
    return (
      <div className="flex-grow flex flex-col items-center justify-center p-8 bg-[#09090b] text-zinc-100 max-w-md mx-auto text-center">
        <div className="bg-rose-500/10 p-4 rounded-full text-rose-500 mb-4 border border-rose-500/20">
          <AlertCircle className="w-10 h-10" />
        </div>
        <h2 className="text-xl font-display font-medium">Room Initialization Failed</h2>
        <p className="text-zinc-450 text-xs mt-2 leading-relaxed">{error || 'This stream room does not exist or has been deleted.'}</p>
        <Link
          to="/"
          className="mt-6 flex items-center gap-1 bg-[#0d0d10] hover:bg-zinc-800 py-2 px-5 rounded-lg text-xs font-semibold transition-all border border-white/5 hover:border-white/10"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Go to Dashboard</span>
        </Link>
      </div>
    );
  }

  const isOwner = user && stream.streamerId === user.id;

  return (
    <div className="flex-grow bg-[#09090b] p-4 md:p-8 text-zinc-100 max-w-7xl mx-auto w-full flex flex-col gap-6">
      
      {/* Return Row */}
      <div className="flex items-center justify-between">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-zinc-400 hover:text-white text-xs font-semibold transition-colors bg-[#0d0d10] px-3.5 py-1.5 rounded-lg border border-white/5 hover:border-white/10"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Exit Room</span>
        </Link>

        {/* Live Indicator or ended details */}
        <div className="flex items-center gap-3">
          {stream.status === 'LIVE' ? (
            <div className="flex items-center gap-1.5 bg-rose-600 text-white font-bold text-[10px] tracking-wider uppercase px-2.5 py-1 rounded-md shadow-md animate-pulse">
              <Radio className="w-3.5 h-3.5" />
              <span>LIVE</span>
            </div>
          ) : stream.status === 'IDLE' ? (
            <div className="bg-[#0d0d10] border border-white/5 text-zinc-400 font-bold text-[10px] tracking-wider uppercase px-2.5 py-1 rounded-md">
              Prep Room
            </div>
          ) : (
            <div className="bg-[#0d0d10] border border-white/5 text-zinc-500 font-bold text-[10px] tracking-wider uppercase px-2.5 py-1 rounded-md">
              Ended
            </div>
          )}

          {/* Active Viewer counter */}
          <div className="flex items-center gap-1.5 bg-[#0d0d10] border border-white/5 text-zinc-350 text-xs px-3 py-1.5 rounded-lg font-medium">
            <Eye className="w-4 h-4 text-violet-400 shrink-0" />
            <span className="font-mono text-zinc-100">{viewerCount}</span>
            <span className="text-zinc-500 font-bold text-[10px] uppercase">viewers</span>
          </div>
        </div>
      </div>

      {/* Main double column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start flex-grow">
        
        {/* Left Col (2/3): Stream Player + Channel Metrics */}
        <div className="lg:col-span-2 flex flex-col gap-5">
          {/* Stream Stage Area */}
          <div className="relative">
            {stream.status === 'IDLE' ? (
              <div className="bg-[#0d0d10] border border-white/5 rounded-2xl aspect-video flex flex-col items-center justify-center p-8 text-center text-zinc-200">
                <div className="w-16 h-16 bg-zinc-900 border border-white/5 text-violet-400 rounded-full flex items-center justify-center mb-5 animate-pulse shadow">
                  <Tv className="w-8 h-8" />
                </div>
                {isOwner ? (
                  <div className="max-w-md">
                    <h3 className="text-xl font-display font-medium text-white mb-2 tracking-tight">Your Studio is Ready</h3>
                    <p className="text-zinc-400 text-xs leading-relaxed mb-6">
                      Adjust your microphone and video camera input parameters on the active terminal overlay before selecting "Go Live".
                    </p>
                    <button
                      onClick={handleStartBroadcast}
                      className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold px-6 py-2.5 rounded-lg transition-all shadow-lg shadow-violet-900/20"
                    >
                      <PlayCircle className="w-5 h-5" />
                      <span>Start Live Streaming</span>
                    </button>
                  </div>
                ) : (
                  <div className="max-w-md">
                    <h3 className="text-xl font-display font-medium text-white mb-2">Preparing Broadcast</h3>
                    <p className="text-zinc-400 text-xs leading-relaxed">
                      @{stream.streamerName} is configuring things behind the scenes. Chat is active and ready right now!
                    </p>
                  </div>
                )}
              </div>
            ) : stream.status === 'ENDED' ? (
              <div className="bg-[#0d0d10] border border-white/5 rounded-2xl aspect-video flex flex-col items-center justify-center p-8 text-center text-zinc-300">
                <div className="w-16 h-16 bg-zinc-900 border border-white/5 text-rose-500 rounded-full flex items-center justify-center mb-5">
                  <StopCircle className="w-8 h-8 text-rose-500" />
                </div>
                <h3 className="text-xl font-display font-medium text-white mb-1.5">Broadcast Concluded</h3>
                <p className="text-zinc-455 text-xs max-w-sm mx-auto leading-relaxed">
                  This live streaming connection was ended by the broadcaster.
                </p>
                <Link
                  to="/"
                  className="mt-6 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-semibold text-xs py-2 px-4 rounded-lg border border-white/5 transition-colors"
                >
                  Return to Channels
                </Link>
              </div>
            ) : (
              /* ACTIVE VIDEO PLAYER STAGE */
              <VideoPlayer
                token={lkToken}
                serverUrl={lkUrl}
                isMock={lkIsMock}
                isStreamer={isOwner}
                streamId={stream.id}
              />
            )}
          </div>

          {/* Broadcaster Stream Details Box */}
          <div className="bg-[#0d0d10] border border-white/5 rounded-2xl p-5 md:p-6 shadow-xl flex flex-col md:flex-row md:items-start justify-between gap-5">
            <div>
              <h2 className="text-xl md:text-2xl font-display font-medium text-white tracking-tight leading-snug">
                {stream.title}
              </h2>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-violet-400 font-semibold text-xs">@{stream.streamerName}</span>
                <span className="text-zinc-700">•</span>
                <span className="text-zinc-500 text-xs font-mono">
                  Created {new Date(stream.createdAt).toLocaleDateString()}
                </span>
              </div>
              {stream.description && (
                <p className="text-zinc-400 text-xs mt-4 bg-zinc-950/30 p-4 rounded-xl leading-relaxed italic border border-white/5">
                  {stream.description}
                </p>
              )}
            </div>

            {/* Streamer Broadcast Termination controller */}
            {isOwner && stream.status === 'LIVE' && (
              <button
                onClick={handleEndBroadcast}
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs py-2.5 px-4 rounded-lg transition-all shadow flex items-center gap-1.5 uppercase tracking-wider shrink-0"
              >
                <StopCircle className="w-4 h-4" />
                <span>End Broadcast</span>
              </button>
            )}
          </div>
        </div>

        {/* Right Col (1/3): Dynamic Chatbox */}
        <div className="lg:col-span-1">
          <ChatBox
            messages={messages}
            onSendMessage={handleSendMessage}
            currentUser={user}
            streamerId={stream.streamerId}
          />
        </div>

      </div>

    </div>
  );
}
