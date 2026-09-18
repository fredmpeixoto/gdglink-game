import React, { useState } from 'react';
import { GameEvent } from '../types';
import { Volume2, VolumeX, MessageSquare, Radio } from 'lucide-react';
import { sound } from '../utils/audio';

interface RetroDialogBoxProps {
  events: GameEvent[];
}

export const RetroDialogBox: React.FC<RetroDialogBoxProps> = ({ events }) => {
  const [isMuted, setIsMuted] = useState(sound.getMuted());

  const toggleSound = () => {
    const muted = sound.toggleMute();
    setIsMuted(muted);
  };

  const latestEvent = events[0] || {
    id: 'init',
    type: 'join',
    text: 'Welcome to Route Link! Explore, meet trainers, and press SPACE or [A] to throw LinkedIn invites!',
    timestamp: Date.now(),
  };

  return (
    <div className="w-full bg-[#1e293b] border-2 border-slate-700 rounded-xl p-3 sm:p-4 shadow-xl flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-700/80 mb-2">
        <div className="flex items-center gap-2">
          <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
          <span className="text-[11px] font-bold font-['Press_Start_2P'] text-slate-200">
            POKÉ-COMM FEED
          </span>
        </div>

        {/* Audio Toggle */}
        <button
          type="button"
          onClick={toggleSound}
          className="flex items-center gap-1.5 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono border border-slate-700"
          title="Toggle 8-bit chiptune audio"
        >
          {isMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
          <span>{isMuted ? 'Muted' : '8-Bit BGM'}</span>
        </button>
      </div>

      {/* Classic Pokémon Text Box Frame */}
      <div className="bg-[#0a0f1d] border-2 border-[#475569] rounded-lg p-3 relative min-h-[68px] flex items-center shadow-inner">
        <p className="text-xs sm:text-sm font-['Silkscreen'] text-amber-300 leading-relaxed">
          {latestEvent.text}
        </p>
      </div>

      {/* Mini Scrolling Event Log */}
      <div className="mt-2 space-y-1 max-h-[85px] overflow-y-auto pr-1">
        {events.slice(1, 6).map((evt) => (
          <div
            key={evt.id}
            className="text-[11px] font-mono text-slate-400 truncate flex items-center justify-between hover:text-slate-200 transition-colors"
          >
            <span className="truncate">{evt.text}</span>
            {evt.link && (
              <a
                href={evt.link.startsWith('http') ? evt.link : `https://${evt.link}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[9px] text-blue-400 hover:underline shrink-0 ml-2"
              >
                Profile ↗
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
