import React from 'react';
import { X, Gamepad2, Send, Trophy, ExternalLink, Sparkles, UserCheck } from 'lucide-react';
import { sound } from '../utils/audio';

interface HowToPlayModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HowToPlayModal: React.FC<HowToPlayModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const handleClose = () => {
    sound.playFanfare();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
      onClick={handleClose}
    >
      <div
        className="w-full max-w-lg bg-[#1e293b] border-4 border-[#475569] rounded-2xl shadow-2xl p-4 sm:p-6 relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b-2 border-slate-700 mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <h2 className="text-xs sm:text-sm font-bold font-['Press_Start_2P'] text-amber-300">
              HOW TO PLAY GDGLINK
            </h2>
          </div>
          <button
            type="button"
            onClick={() => {
              sound.playStep();
              onClose();
            }}
            className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Instructions Grid */}
        <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1 text-slate-200">
          {/* Step 1: Move */}
          <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-3 flex items-start gap-3">
            <div className="p-2 rounded-lg bg-blue-950/70 border border-blue-800/40 text-blue-400 shrink-0 mt-0.5">
              <Gamepad2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-amber-300 font-['Press_Start_2P'] text-[10px] mb-1">
                1. EXPLORE THE MAP
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                Use <strong className="text-amber-400">WASD</strong> or <strong className="text-amber-400">Arrow Keys</strong> to wander through Pallet Town and Route 1. Hold <strong className="text-rose-400">SHIFT</strong> (or the red [B] button) to sprint. Touch/Mobile users can use the on-screen D-Pad.
              </p>
            </div>
          </div>

          {/* Step 2: Throw LinkedIn Projectile */}
          <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-3 flex items-start gap-3">
            <div className="p-2 rounded-lg bg-sky-950/70 border border-sky-800/40 text-sky-400 shrink-0 mt-0.5">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-amber-300 font-['Press_Start_2P'] text-[10px] mb-1">
                2. THROW YOUR LINKEDIN LINK
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                Press <strong className="text-sky-300">SPACEBAR</strong> or tap the blue <strong className="text-sky-300">[A] THROW</strong> button. Your custom LinkedIn card flies across the map in the direction your avatar is facing!
              </p>
            </div>
          </div>

          {/* Step 3: Hit & Connect */}
          <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-3 flex items-start gap-3">
            <div className="p-2 rounded-lg bg-emerald-950/70 border border-emerald-800/40 text-emerald-400 shrink-0 mt-0.5">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-amber-300 font-['Press_Start_2P'] text-[10px] mb-1">
                3. HIT AVATARS TO CONNECT
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                When your flying link strikes another trainer, a collision is scored! You earn <strong className="text-emerald-400">+1 Landed Throw</strong>, play an 8-bit connection fanfare, and send them your LinkedIn profile!
              </p>
            </div>
          </div>

          {/* Step 4: Leaderboard & Networking */}
          <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-3 flex items-start gap-3">
            <div className="p-2 rounded-lg bg-amber-950/70 border border-amber-800/40 text-amber-400 shrink-0 mt-0.5">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-amber-300 font-['Press_Start_2P'] text-[10px] mb-1">
                4. CLIMB THE RANKINGS
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                Check the <strong className="text-amber-400">Trainer Rankings</strong> to see top networkers. Click any player on the map or leaderboard to view their 8-bit Trainer Card and open their real LinkedIn profile in a new tab!
              </p>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="mt-4 pt-3 border-t-2 border-slate-700">
          <button
            type="button"
            onClick={handleClose}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-slate-950 font-extrabold text-xs sm:text-sm tracking-wider uppercase shadow-lg shadow-amber-500/20 hover:from-amber-400 hover:to-orange-500 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 border-2 border-amber-300 font-['Press_Start_2P'] cursor-pointer"
          >
            LET'S PLAY! [START]
          </button>
        </div>
      </div>
    </div>
  );
};
