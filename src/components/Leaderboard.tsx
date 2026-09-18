import React, { useState } from 'react';
import { Player, GOOGLE_COLORS } from '../types';
import { Trophy, ExternalLink, Target, Zap, Crown, Medal, Award, Flame } from 'lucide-react';
import { sound } from '../utils/audio';

interface LeaderboardProps {
  players: Player[];
  myPlayerId: string;
  onSelectPlayer: (player: Player) => void;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({
  players,
  myPlayerId,
  onSelectPlayer,
}) => {
  const [activeTab, setActiveTab] = useState<'top5' | 'all'>('top5');

  // Sort players by hitsLanded (descending = most connected on LinkedIn), then hitsTaken (ascending)
  const sortedPlayers = [...players].sort((a, b) => {
    if (b.hitsLanded !== a.hitsLanded) {
      return b.hitsLanded - a.hitsLanded;
    }
    return a.hitsTaken - b.hitsTaken;
  });

  const top5Players = sortedPlayers.slice(0, 5);
  const displayPlayers = activeTab === 'top5' ? top5Players : sortedPlayers;

  return (
    <div className="w-full bg-[#1e293b] border-2 border-slate-700 rounded-xl p-3 sm:p-4 shadow-xl">
      {/* Header with Title & Active Tab Toggle */}
      <div className="flex flex-col gap-2 pb-3 border-b border-slate-700/80 mb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            <h2 className="text-xs sm:text-sm font-bold font-['Press_Start_2P'] text-amber-300">
              LINKEDIN RANKINGS
            </h2>
          </div>
          <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
            {players.length} Trainers
          </span>
        </div>

        {/* Tab Switcher: Top 5 Most Connected vs All Active */}
        <div className="grid grid-cols-2 gap-1.5 p-1 bg-[#0f172a] rounded-lg border border-slate-800">
          <button
            type="button"
            onClick={() => {
              sound.playStep();
              setActiveTab('top5');
            }}
            className={`py-1.5 px-2 rounded-md text-[11px] font-bold font-mono uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'top5'
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-md font-extrabold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Crown className="w-3.5 h-3.5" />
            Top 5 Connected
          </button>
          <button
            type="button"
            onClick={() => {
              sound.playStep();
              setActiveTab('all');
            }}
            className={`py-1.5 px-2 rounded-md text-[11px] font-bold font-mono uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'all'
                ? 'bg-blue-600 text-white shadow-md font-extrabold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            All Trainers ({players.length})
          </button>
        </div>
      </div>

      {/* Sub-header columns */}
      <div className="text-[10px] text-slate-400 font-mono mb-2 flex items-center justify-between px-2">
        <span>{activeTab === 'top5' ? 'TOP 5 RANK & NAME' : 'RANK & TRAINER'}</span>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-emerald-400 font-bold" title="LinkedIn Connections Landed">
            <Target className="w-3 h-3" /> CONNECTED
          </span>
          <span className="w-14 text-right">LINKEDIN</span>
        </div>
      </div>

      {/* Rankings List */}
      <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-1 select-text">
        {displayPlayers.map((player, idx) => {
          const isMe = player.id === myPlayerId;
          const colorData = GOOGLE_COLORS[player.avatarStyle.googleColor] || GOOGLE_COLORS.blue;

          // Rank Badge with Badges for Top 5
          let rankIcon = null;
          let rankBg = 'bg-slate-800 text-slate-400 border-slate-700';

          if (idx === 0) {
            rankBg = 'bg-gradient-to-tr from-amber-400 to-yellow-300 text-slate-950 font-black shadow-md shadow-amber-500/40 border-amber-300';
            rankIcon = <Crown className="w-3 h-3 fill-slate-950" />;
          } else if (idx === 1) {
            rankBg = 'bg-slate-300 text-slate-900 font-bold shadow-sm border-slate-200';
            rankIcon = <Medal className="w-3 h-3" />;
          } else if (idx === 2) {
            rankBg = 'bg-amber-700 text-amber-100 font-bold shadow-sm border-amber-600';
            rankIcon = <Award className="w-3 h-3" />;
          } else if (idx < 5) {
            rankBg = 'bg-slate-800 text-amber-300 font-bold border-slate-700';
          }

          return (
            <div
              key={player.id}
              onClick={() => {
                sound.playStep();
                onSelectPlayer(player);
              }}
              className={`flex items-center justify-between p-2 rounded-lg border transition-all cursor-pointer ${
                idx === 0 && activeTab === 'top5'
                  ? 'bg-amber-950/40 border-amber-500/70 shadow-md ring-1 ring-amber-400/30'
                  : isMe
                  ? 'bg-blue-950/60 border-amber-400/80 shadow-sm ring-1 ring-amber-400/40'
                  : 'bg-slate-900/70 border-slate-800 hover:border-slate-600 hover:bg-slate-800/80'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                {/* Rank Badge */}
                <span
                  className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-mono shrink-0 border ${rankBg}`}
                >
                  {rankIcon || idx + 1}
                </span>

                {/* Google Outfit Color Dot */}
                <div
                  className="w-3.5 h-3.5 rounded-full border border-white/50 shrink-0"
                  style={{ backgroundColor: colorData.hex }}
                  title={`${colorData.name} Outfit`}
                />

                {/* Name & LinkedIn handle */}
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold truncate text-slate-200">
                      {player.name}
                    </span>
                    {idx === 0 && (
                      <span className="text-[8px] bg-amber-400 text-slate-950 font-black px-1 rounded uppercase tracking-tighter">
                        #1 LEAD
                      </span>
                    )}
                    {isMe && (
                      <span className="text-[9px] bg-amber-400/20 text-amber-300 px-1 rounded font-mono font-bold">
                        YOU
                      </span>
                    )}
                    {player.isBot && (
                      <span className="text-[9px] bg-slate-800 text-slate-400 px-1 rounded font-mono">
                        NPC
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-blue-400 truncate max-w-[130px] sm:max-w-[150px] flex items-center gap-1">
                    <span className="bg-[#0a66c2] text-white px-0.5 rounded text-[7px] font-bold">
                      in
                    </span>
                    <span className="truncate">
                      {player.linkedin.replace(/^https?:\/\/(www\.)?linkedin\.com\/in\//, '') || 'linkedin'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Connections Score & LinkedIn Action */}
              <div className="flex items-center gap-2.5 shrink-0">
                {/* Connections Count (Hits Landed) */}
                <div className="flex flex-col items-end">
                  <span className="text-xs font-bold font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/60 flex items-center gap-1">
                    <Flame className="w-3 h-3 text-amber-400" />
                    {player.hitsLanded}
                  </span>
                  <span className="text-[8px] font-mono text-slate-400">
                    {player.hitsLanded === 1 ? 'connection' : 'connections'}
                  </span>
                </div>

                {/* Direct LinkedIn Profile Link Button */}
                {player.linkedin ? (
                  <a
                    href={player.linkedin.startsWith('http') ? player.linkedin : `https://${player.linkedin}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="p-1.5 bg-[#0a66c2] hover:bg-[#004182] text-white rounded-md transition-colors flex items-center justify-center shadow-xs"
                    title={`Connect with ${player.name} on LinkedIn`}
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                ) : (
                  <span className="w-6" />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Top 5 Networking Tip Footer */}
      {activeTab === 'top5' && (
        <div className="mt-3 pt-2.5 border-t border-slate-800 text-[10px] text-slate-400 font-mono flex items-center justify-between">
          <span className="flex items-center gap-1 text-amber-400">
            <Crown className="w-3 h-3" /> Throw links to enter Top 5!
          </span>
          <span className="text-slate-400">Target other avatars [SPACE]</span>
        </div>
      )}
    </div>
  );
};
