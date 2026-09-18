import React, { useEffect, useRef } from 'react';
import { Player, GOOGLE_COLORS, SKIN_TONES } from '../types';
import { drawPokemonTrainer } from '../utils/spriteRenderer';
import { X, ExternalLink, Target, Zap, Shield, Sparkles } from 'lucide-react';
import { sound } from '../utils/audio';

interface TrainerCardModalProps {
  player: Player | null;
  onClose: () => void;
}

export const TrainerCardModal: React.FC<TrainerCardModalProps> = ({ player, onClose }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!player) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawPokemonTrainer(ctx, 16, 12, 5, player.avatarStyle, 'down', 0, false);
  }, [player]);

  if (!player) return null;

  const colorData = GOOGLE_COLORS[player.avatarStyle.googleColor] || GOOGLE_COLORS.blue;
  const skinData = SKIN_TONES[player.avatarStyle.skinTone] || SKIN_TONES[0];
  const cleanLink = player.linkedin.startsWith('http') ? player.linkedin : `https://${player.linkedin}`;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-[#1e293b] border-4 border-[#475569] rounded-2xl shadow-2xl p-5 relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Retro Top Bar */}
        <div className="flex items-center justify-between pb-3 border-b-2 border-slate-700 mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs font-bold font-['Press_Start_2P'] text-amber-300">
              TRAINER CARD
            </h3>
          </div>
          <button
            onClick={() => {
              sound.playStep();
              onClose();
            }}
            className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Card Content */}
        <div className="bg-[#0f172a] border-2 border-slate-800 rounded-xl p-4 flex flex-col items-center">
          {/* Sprite Box */}
          <div className="relative w-28 h-28 bg-[#8ba478] border-4 border-[#526447] rounded-lg flex items-center justify-center shadow-inner overflow-hidden mb-3">
            <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.05)_50%,transparent_50%)] bg-[length:100%_4px] pointer-events-none z-10" />
            <canvas
              ref={canvasRef}
              width={112}
              height={100}
              className="drop-shadow-md z-0"
              style={{ imageRendering: 'pixelated' }}
            />
          </div>

          {/* Trainer Name */}
          <h2 className="text-lg font-bold text-slate-100 font-['Silkscreen'] text-center">
            {player.name}
          </h2>

          {/* Attributes */}
          <div className="flex flex-wrap items-center justify-center gap-1.5 mt-2 mb-4">
            <span
              className="text-[10px] px-2 py-0.5 rounded font-mono font-bold text-white border border-white/20"
              style={{ backgroundColor: colorData.hex }}
            >
              {colorData.name}
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded font-mono bg-slate-800 text-slate-300 border border-slate-700">
              Skin: {skinData.name}
            </span>
            {player.avatarStyle.hasHat && (
              <span className="text-[10px] px-2 py-0.5 rounded font-mono bg-slate-800 text-amber-300 border border-slate-700">
                🧢 Cap
              </span>
            )}
            {player.avatarStyle.hasGlasses && (
              <span className="text-[10px] px-2 py-0.5 rounded font-mono bg-slate-800 text-sky-300 border border-slate-700">
                👓 Glasses
              </span>
            )}
          </div>

          {/* Stats Badges */}
          <div className="grid grid-cols-2 gap-3 w-full mb-4">
            <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-2.5 flex items-center gap-2.5">
              <div className="p-2 rounded-md bg-emerald-950/60 text-emerald-400">
                <Target className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[10px] font-mono text-slate-400">Throws Landed</div>
                <div className="text-base font-bold font-mono text-emerald-400">
                  {player.hitsLanded}
                </div>
              </div>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-2.5 flex items-center gap-2.5">
              <div className="p-2 rounded-md bg-rose-950/60 text-rose-400">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[10px] font-mono text-slate-400">Times Hit</div>
                <div className="text-base font-bold font-mono text-rose-400">
                  {player.hitsTaken}
                </div>
              </div>
            </div>
          </div>

          {/* LinkedIn Profile Action */}
          {player.linkedin && (
            <a
              href={cleanLink}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 px-4 bg-[#0a66c2] hover:bg-[#004182] text-white rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-md shadow-blue-500/20"
            >
              <span className="bg-white text-[#0a66c2] font-black text-[10px] px-1 rounded">in</span>
              <span>Connect on LinkedIn</span>
              <ExternalLink className="w-4 h-4 ml-1" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
};
