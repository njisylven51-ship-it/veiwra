import { useEffect, useRef, useState } from 'react';
import { LiveKitRoom, RoomAudioRenderer, VideoConference } from '@livekit/components-react';
import { Radio, VideoOff, Mic, MicOff, Video as CamIcon, Settings, RefreshCw } from 'lucide-react';

interface VideoPlayerProps {
  token: string;
  serverUrl: string;
  isMock: boolean;
  isStreamer: boolean;
  streamId: string;
}

export default function VideoPlayer({ token, serverUrl, isMock, isStreamer, streamId }: VideoPlayerProps) {
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [stream, setLocalStream] = useState<MediaStream | null>(null);
  const [cameraActive, setCameraActive] = useState(true);
  const [micActive, setMicActive] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);
  const animationRef = useRef<number | null>(null);

  // Handle Mock/Fallback camera recording for developer review
  useEffect(() => {
    if (!isMock) return;

    if (isStreamer) {
      async function activateCamera() {
        try {
          const media = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true
          });
          setLocalStream(media);
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = media;
          }
          setInitError(null);
        } catch (err: any) {
          console.warn('Sandbox: Camera access rejected or unavailable. Loading animation fallback instead.', err);
          setInitError('Could not gain camera/microphone access. Rendering animated graphic fallback.');
        }
      }

      if (cameraActive) {
        activateCamera();
      } else {
        if (stream) {
          stream.getTracks().forEach(t => t.stop());
          setLocalStream(null);
        }
      }
    } else {
      // Viewer simulation rendering a gorgeous visual particle stream on Canvas
      const ctx = canvasRef.current?.getContext('2d');
      if (!ctx || !canvasRef.current) return;

      const canvas = canvasRef.current;
      let particles: Array<{ x: number; y: number; size: number; speed: number; color: string }> = [];

      // Create fake visual stream particles
      for (let i = 0; i < 35; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: Math.random() * 4 + 2,
          speed: Math.random() * 1.5 + 0.5,
          color: `hsla(${240 + Math.random() * 40}, 80%, 65%, ${Math.random() * 0.4 + 0.3})`
        });
      }

      function draw() {
        if (!ctx || !canvas) return;
        ctx.fillStyle = '#0d0d10'; // Immersive dark zinc bg
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Grid scan lines in violet/purple hues
        ctx.strokeStyle = 'rgba(139, 92, 246, 0.04)';
        ctx.lineWidth = 1;
        for (let i = 0; i < canvas.width; i += 30) {
          ctx.beginPath();
          ctx.moveTo(i, 0);
          ctx.lineTo(i, canvas.height);
          ctx.stroke();
        }
        for (let j = 0; j < canvas.height; j += 30) {
          ctx.beginPath();
          ctx.moveTo(0, j);
          ctx.lineTo(canvas.width, j);
          ctx.stroke();
        }

        // Draw pulsing logo in center (violet shadow)
        const pulse = Math.sin(Date.now() * 0.003) * 8 + 90;
        ctx.save();
        ctx.shadowBlur = 25;
        ctx.shadowColor = 'rgba(139, 92, 246, 0.4)';
        ctx.fillStyle = `rgba(139, 92, 246, ${0.08 + Math.sin(Date.now() * 0.003) * 0.04})`;
        ctx.beginPath();
        ctx.arc(canvas.width / 2, canvas.height / 2, pulse, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Particle stream lines
        particles.forEach(p => {
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();

          p.y -= p.speed;
          if (p.y < 0) {
            p.y = canvas.height;
            p.x = Math.random() * canvas.width;
          }
        });

        // Frame indicator text
        ctx.fillStyle = '#f4f4f5';
        ctx.font = 'bold 15px Space Grotesk, system-ui';
        ctx.textAlign = 'center';
        ctx.fillText('VIEWRA ACTIVE BROADCAST', canvas.width / 2, canvas.height / 2 - 15);

        ctx.fillStyle = 'rgba(167, 139, 250, 1)'; // violet-400
        ctx.font = '500 11px JetBrains Mono';
        ctx.fillText('REAL-TIME FEED OVER SECURE SOCKET PROTOCOL', canvas.width / 2, canvas.height / 2 + 15);

        ctx.strokeStyle = 'rgba(139, 92, 246, 0.2)';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);

        animationRef.current = requestAnimationFrame(draw);
      }

      draw();
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach(t => t.stop());
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isMock, isStreamer, cameraActive]);

  const toggleCamera = () => {
    if (stream) {
      const vTrack = stream.getVideoTracks()[0];
      if (vTrack) {
        vTrack.enabled = !vTrack.enabled;
        setCameraActive(vTrack.enabled);
      }
    } else {
      setCameraActive(!cameraActive);
    }
  };

  const toggleMic = () => {
    if (stream) {
      const aTrack = stream.getAudioTracks()[0];
      if (aTrack) {
        aTrack.enabled = !aTrack.enabled;
        setMicActive(aTrack.enabled);
      }
    } else {
      setMicActive(!micActive);
    }
  };

  // 1. LiveKit Standard Components Implementation for Production URLs
  if (!isMock && token && serverUrl) {
    return (
      <div className="bg-[#0d0d10] border border-white/5 rounded-2xl overflow-hidden aspect-video relative flex flex-col items-center justify-center text-zinc-100 shadow-2xl">
        <LiveKitRoom
          video={isStreamer}
          audio={isStreamer}
          token={token}
          serverUrl={serverUrl}
          data-lk-theme="default"
          style={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column' }}
        >
          {/* LiveKit Video Feed Renderer */}
          <VideoConference />
          {/* Audio output routing */}
          <RoomAudioRenderer />
        </LiveKitRoom>

        <div className="absolute top-4 left-4 bg-rose-600 flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] z-20 font-bold uppercase tracking-wider animate-pulse shadow-md text-white">
          <Radio className="w-3.5 h-3.5" />
          <span>Real Cloud Live</span>
        </div>
      </div>
    );
  }

  // 2. High-Fidelity Sandbox Emulator Mode (Default preview path)
  return (
    <div className="bg-[#0b0b0d] border border-white/5 rounded-2xl overflow-hidden aspect-video relative flex flex-col items-center justify-center text-zinc-200 shadow-2xl group">
      {isStreamer ? (
        <>
          {/* Streamer Camera view */}
          {cameraActive && !initError ? (
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex flex-col items-center gap-4 text-center p-6 max-w-sm">
              <div className="bg-zinc-900 p-5 rounded-full border border-white/5 text-zinc-500">
                <VideoOff className="w-10 h-10" />
              </div>
              <div>
                <p className="font-display font-medium text-white text-sm">
                  {initError ? 'Permission Missing' : 'Camera Switched Off'}
                </p>
                <p className="text-zinc-400 text-xs mt-1 leading-relaxed">
                  {initError || 'Turn on your camera below to start broadcasting live to your viewers.'}
                </p>
              </div>
            </div>
          )}

          {/* Streamer Overlay Controls */}
          <div className="absolute top-4 left-4 flex gap-2 items-center z-10">
            <div className="bg-rose-600 flex items-center gap-1.5 px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider shadow-lg animate-pulse text-white">
              <Radio className="w-3.5 h-3.5" />
              <span>Simulated Feed</span>
            </div>
            <div className="bg-black/80 backdrop-blur-md border border-white/5 text-zinc-350 text-[9px] font-mono py-1 px-2.5 rounded">
              1080p • 60 FPS • STUDIO
            </div>
          </div>

          <div className="absolute right-4 top-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center z-10">
            <button className="p-2 bg-zinc-900/95 border border-white/5 rounded-lg hover:border-violet-400/50 text-zinc-300 transition-colors">
              <Settings className="w-4 h-4" />
            </button>
          </div>

          {/* Control Bar */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-[#0d0d10]/95 backdrop-blur-lg border border-white/5 px-4 py-2 rounded-xl shadow-2xl z-10">
            <button
              onClick={toggleCamera}
              className={`p-2 rounded-lg transition-all hover:scale-105 ${
                cameraActive
                  ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-white/5'
                  : 'bg-rose-600 text-white'
              }`}
              title={cameraActive ? 'Mute Camera' : 'Unmute Camera'}
            >
              <CamIcon className="w-4 h-4" />
            </button>
            <button
              onClick={toggleMic}
              className={`p-2 rounded-lg transition-all hover:scale-105 ${
                micActive
                  ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-white/5'
                  : 'bg-rose-600 text-white'
              }`}
              title={micActive ? 'Mute Microphone' : 'Unmute Microphone'}
            >
              {micActive ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
            </button>
          </div>
        </>
      ) : (
        <>
          {/* Viewer Simulated canvas loop */}
          <canvas
            ref={canvasRef}
            width={640}
            height={360}
            className="w-full h-full object-cover"
          />

          {/* Viewer Overlay badge */}
          <div className="absolute top-4 left-4 flex gap-2 items-center">
            <div className="bg-rose-600 flex items-center gap-1.5 px-3 py-1 rounded text-[10px] font-bold uppercase tracking-wider text-white shadow-xl animate-pulse">
              <Radio className="w-3.5 h-3.5" />
              <span>Watch Live</span>
            </div>
            <div className="bg-black/60 backdrop-blur-md text-white border border-white/10 text-[10px] font-medium px-2 py-1 rounded">
              00:42:15
            </div>
          </div>
        </>
      )}
    </div>
  );
}
