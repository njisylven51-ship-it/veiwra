import React, { useState, useRef, useEffect } from 'react';
import { Message } from '../types';
import { Send, User as UserIcon, ShieldAlert, Cpu } from 'lucide-react';

interface ChatBoxProps {
  messages: Message[];
  onSendMessage: (content: string) => void;
  currentUser: { id: string; username: string } | null;
  streamerId: string;
}

export default function ChatBox({ messages, onSendMessage, currentUser, streamerId }: ChatBoxProps) {
  const [content, setContent] = useState('');
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanContent = content.trim();
    if (!cleanContent) return;

    onSendMessage(cleanContent);
    setContent('');
  };

  return (
    <div className="bg-[#0b0b0e] border border-white/5 rounded-2xl flex flex-col h-[520px] overflow-hidden shadow-xl">
      {/* Header */}
      <div className="bg-[#0d0d10] px-4 py-3 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-500"></span>
          </span>
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-200">Stream Chat</h3>
        </div>
        <span className="text-[10px] text-zinc-400 font-mono tracking-wider uppercase bg-zinc-900 px-2.5 py-0.5 rounded-md border border-white/5">
          {messages.length} lines
        </span>
      </div>

      {/* Messages list */}
      <div className="flex-grow overflow-y-auto p-4 space-y-3.5 flex flex-col">
        {messages.length === 0 ? (
          <div className="flex-grow flex flex-col items-center justify-center text-center p-6 text-zinc-500">
            <div className="bg-zinc-900 p-4 rounded-full border border-white/5 mb-3 text-zinc-650">
              <Cpu className="w-6 h-6 text-violet-400" />
            </div>
            <p className="text-xs font-bold text-zinc-300">Welcome to Stream Chat!</p>
            <p className="text-[11px] text-zinc-500 mt-1 max-w-[200px] leading-relaxed">
              Message dispatching is active. Direct questions to the caster!
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isSystem = msg.userId === 'system';
            const isStreamer = msg.userId === streamerId;
            const isMe = currentUser && msg.userId === currentUser.id;

            if (isSystem) {
              return (
                <div
                  key={msg.id}
                  className="bg-violet-500/10 border border-violet-500/20 text-violet-300 py-1.5 px-3 rounded-lg text-[11px] leading-relaxed text-center self-center max-w-[90%] font-medium inline-flex items-center gap-1.5"
                >
                  <ShieldAlert className="w-3.5 h-3.5 text-violet-400 shrink-0" />
                  <span className="font-mono text-[10px] uppercase font-bold text-violet-400">System</span>
                  <span>{msg.content}</span>
                </div>
              );
            }

            return (
              <div
                key={msg.id}
                className={`flex flex-col max-w-[85%] ${isMe ? 'self-end items-end' : 'self-start items-start'}`}
              >
                {/* Meta details */}
                <div className="flex items-center gap-1.5 mb-1 text-[11px] font-semibold text-zinc-400 px-1">
                  <span
                    className={`font-semibold hover:underline cursor-pointer ${
                      isStreamer ? 'text-violet-400' : isMe ? 'text-fuchsia-400' : 'text-blue-400'
                    }`}
                  >
                    {msg.username}
                  </span>
                  {isStreamer && (
                    <span className="bg-violet-500/20 text-violet-400 font-extrabold text-[8px] tracking-wider uppercase px-1 rounded border border-violet-500/30 shrink-0">
                      Caster
                    </span>
                  )}
                  <span className="text-[9px] text-zinc-500 font-mono">
                    {new Date(msg.createdAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>

                {/* Bubble content */}
                <div
                  className={`py-2 px-3.5 rounded-xl text-xs leading-normal shadow break-all ${
                    isMe
                      ? 'bg-violet-605 text-white bg-violet-600 rounded-tr-none shadow-[0_0_12px_rgba(139,92,246,0.18)]'
                      : isStreamer
                      ? 'bg-zinc-900 text-zinc-100 border border-violet-500/25 rounded-tl-none font-medium'
                      : 'bg-zinc-900 text-zinc-200 rounded-tl-none border border-white/5'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form at Bottom */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-white/5 bg-[#09090b] flex flex-col gap-2">
        <div className="flex gap-2">
          <input
            type="text"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            disabled={!currentUser}
            maxLength={300}
            placeholder={currentUser ? 'Send a message...' : 'Sign in to chat...'}
            className="flex-grow bg-zinc-900 border border-white/10 hover:border-white/15 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 rounded-lg px-3.5 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none disabled:bg-zinc-950 disabled:cursor-not-allowed transition-all"
          />
          <button
            type="submit"
            disabled={!content.trim() || !currentUser}
            className="bg-violet-605 bg-violet-600 hover:bg-violet-750 disabled:bg-zinc-800 disabled:text-zinc-500 text-white p-2.5 rounded-lg transition-all shadow flex items-center justify-center shrink-0"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
        {currentUser && content.length > 0 && (
          <div className="flex justify-between items-center text-[10px] text-zinc-500 font-mono px-1">
            <span>Keep chat friendly</span>
            <span className={content.length > 250 ? 'text-amber-500 font-bold' : ''}>
              {content.length}/300
            </span>
          </div>
        )}
      </form>
    </div>
  );
}
