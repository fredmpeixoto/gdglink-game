import React, { useEffect, useRef } from 'react';
import { Player, GOOGLE_COLORS } from '../types';
import { drawPokemonTrainer } from '../utils/spriteRenderer';
import { Trophy, Crown, Medal, Award, ExternalLink, X, Flame } from 'lucide-react';
import { sound } from '../utils/audio';

interface Top5ModalProps {
  isOpen: boolean;
  onClose: () => void;
  players: Player[];
  onSelectPlayer: (player: Player) => void;
}

export const Top5Modal: React.FC<Top5ModalProps> = ({
  isOpen,
  onClose,
  players,
  onSelectPlayer,
}) => {
  if (!isOpen) return null;

  // Sort by most connections (hitsLanded) descending
  const top5 = [...players]
    .sort((a, b) => b.hitsLanded - a.hitsLanded || a.hitsTaken - b.hitsTaken)
    .slice(0, 5);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-[#1e293b] border-4 border-amber-500/80 rounded-2xl shadow-2xl p-4 sm:p-6 relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b-2 border-slate-700 mb-4">
          <div className="flex items-center gap-2">
            <Trophy className="w-6 h-6 text-amber-400 animate-bounce" />
            <div>
              <h2 className="text-xs sm:text-sm font-bold font-['Press_Start_2P'] text-amber-300">
                TOP 5 MOST CONNECTED
              </h2>
              <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                LinkedIn Networking Hall of Fame
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              sound.playStep();
              onClose();
            }}
            className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Top 5 List */}
        <div className="space-y-2.5 max-h-[65vh] overflow-y-auto pr-1">
          {top5.map((player, idx) => {
            const colorData = GOOGLE_COLORS[player.avatarStyle.googleColor] || GOOGLE_COLORS.blue;
            const isFirst = idx === 0;

            let rankBadge = (
              <span className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-mono font-bold bg-slate-800 text-slate-400 border border-slate-700">
                #{idx + 1}
              </span>
            );

            if (idx === 0) {
              rankBadge = (
                <span className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-mono font-black bg-gradient-to-tr from-amber-400 to-yellow-300 text-slate-950 shadow-md shadow-amber-500/50 border border-amber-300">
                  <Crown className="w-4 h-4 fill-slate-950" />
                </span>
              );
            } else if (idx === 1) {
              rankBadge = (
                <span className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-mono font-bold bg-slate-300 text-slate-900 shadow-sm border border-slate-200">
                  <Medal className="w-4 h-4" />
                </span>
              );
            } else if (idx === 2) {
              rankBadge = (
                <span className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-mono font-bold bg-amber-700 text-amber-100 shadow-sm border border-amber-600">
                  <Award className="w-4 h-4" />
                </span>
              );
            }

            return (
              <div
                key={player.id}
                onClick={() => {
                  sound.playStep();
                  onSelectPlayer(player);
                  onClose();
                }}
                className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                  isFirst
                    ? 'bg-gradient-to-r from-amber-950/60 to-slate-900 border-amber-500 shadow-lg shadow-amber-500/10 ring-1 ring-amber-400/50'
                    : 'bg-[#0f172a] border-slate-800 hover:border-slate-700 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  {rankBadge}

                  {/* Google Color Indicator */}
                  <div
                    className="w-4 h-4 rounded-full border border-white/50 shrink-0"
                    style={{ backgroundColor: colorData.hex }}
                    title={`${colorData.name} Outfit`}
                  />

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs sm:text-sm font-bold text-slate-100 truncate">
                        {player.name}
                      </span>
                      {isFirst && (
                        <span className="text-[9px] font-black bg-amber-400 text-slate-950 px-1.5 py-0.5 rounded uppercase tracking-wider font-mono">
                          GRAND MASTER
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-blue-400 truncate flex items-center gap-1 mt-0.5">
                      <span className="bg-[#0a66c2] text-white px-1 rounded text-[8px] font-bold">
                        in
                      </span>
                      <span className="truncate max-w-[170px] sm:max-w-[220px]">
                        {player.linkedin.replace(/^https?:\/\/(www\.)?linkedin\.com\/in\//, '') || 'linkedin'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Score & Profile Link */}
                <div className="flex items-center gap-3 shrink-0">
                  <div className="flex flex-col items-end">
                    <span className="text-sm font-bold font-mono text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded-lg border border-emerald-800/80 flex items-center gap-1">
                      <Flame className="w-3.5 h-3.5 text-amber-400" />
                      {player.hitsLanded}
                    </span>
                    <span className="text-[9px] font-mono text-slate-400 mt-0.5">
                      connections
                    </span>
                  </div>

                  {player.linkedin && (
                    <a
                      href={player.linkedin.startsWith('http') ? player.linkedin : `https://${player.linkedin}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="p-2 bg-[#0a66c2] hover:bg-[#004182] text-white rounded-lg transition-colors shadow-sm"
                      title="Open LinkedIn Profile"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Close footer button */}
        <div className="mt-4 pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={() => {
              sound.playStep();
              onClose();
            }}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs font-mono border border-slate-700 transition-colors cursor-pointer"
          >
            CLOSE RANKINGS
          </button>
        </div>
      </div>
    </div>
  );
};
