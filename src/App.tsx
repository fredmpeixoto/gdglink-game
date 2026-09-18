import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Player, AvatarStyle, Projectile, GameEvent } from './types';
import { ProfileCreator } from './components/ProfileCreator';
import { GameBoyCanvas } from './components/GameBoyCanvas';
import { Leaderboard } from './components/Leaderboard';
import { TrainerCardModal } from './components/TrainerCardModal';
import { RetroDialogBox } from './components/RetroDialogBox';
import { HowToPlayModal } from './components/HowToPlayModal';
import { Top5Modal } from './components/Top5Modal';
import { sound } from './utils/audio';
import { Sparkles, UserCheck, RefreshCw, Trophy, Gamepad2, HelpCircle, Crown, Wifi, WifiOff } from 'lucide-react';

export default function App() {
  const [hasProfile, setHasProfile] = useState(false);
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [showTop5, setShowTop5] = useState(false);

  // Persistent profile stored in localStorage
  const [profileData, setProfileData] = useState<{
    name: string;
    linkedin: string;
    avatarStyle: AvatarStyle;
  }>(() => {
    try {
      const item = localStorage.getItem('gdglink_profile');
      if (item) return JSON.parse(item);
    } catch {}
    return {
      name: 'Fred Peixoto',
      linkedin: 'https://www.linkedin.com/in/peixoto',
      avatarStyle: { googleColor: 'blue', skinTone: 1, hasHat: true, hasGlasses: false },
    };
  });

  const [myPlayer, setMyPlayer] = useState<Player | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [projectiles, setProjectiles] = useState<Projectile[]>([]);
  const [events, setEvents] = useState<GameEvent[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);

  // Setup WebSocket connection once profile is created
  const connectWebSocket = useCallback((playerInfo: { name: string; linkedin: string; avatarStyle: AvatarStyle }) => {
    // If socket is already open, immediately send player:join with the updated name!
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(
        JSON.stringify({
          type: 'player:join',
          payload: {
            name: playerInfo.name,
            linkedin: playerInfo.linkedin,
            avatarStyle: playerInfo.avatarStyle,
          },
        })
      );
      return;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    try {
      const ws = new WebSocket(wsUrl);
      socketRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        // Send join payload with user's inputted name
        ws.send(
          JSON.stringify({
            type: 'player:join',
            payload: {
              name: playerInfo.name,
              linkedin: playerInfo.linkedin,
              avatarStyle: playerInfo.avatarStyle,
            },
          })
        );
      };

      ws.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data);
          const { type, payload } = msg;

          switch (type) {
            case 'init': {
              setPlayers(payload.players || []);
              setProjectiles(payload.projectiles || []);
              setEvents(payload.events || []);
              break;
            }

            case 'player:joined_ack': {
              setMyPlayer(payload.player);
              break;
            }

            case 'player:joined': {
              setPlayers((prev) => {
                if (prev.some((p) => p.id === payload.id)) return prev;
                return [...prev, payload];
              });
              break;
            }

            case 'player:moved': {
              setPlayers((prev) =>
                prev.map((p) => (p.id === payload.id ? { ...p, ...payload } : p))
              );
              break;
            }

            case 'player:hit': {
              const {
                shooterId,
                targetId,
                shooterHitsLanded,
                targetHitsTaken,
                shooterName,
                targetName,
                shooterLinkedin,
              } = payload;

              // Play hit or fanfare sound
              sound.playHit();

              // Update players list stats
              setPlayers((prev) =>
                prev.map((p) => {
                  if (p.id === shooterId) {
                    return { ...p, hitsLanded: shooterHitsLanded };
                  }
                  if (p.id === targetId) {
                    return {
                      ...p,
                      hitsTaken: targetHitsTaken,
                      lastHitAt: Date.now(),
                      lastHitBy: {
                        name: shooterName,
                        linkedin: shooterLinkedin,
                        timestamp: Date.now(),
                      },
                    };
                  }
                  return p;
                })
              );

              // If my player was the shooter or target, update local state
              setMyPlayer((prev) => {
                if (!prev) return null;
                if (prev.id === shooterId) {
                  sound.playFanfare();
                  return { ...prev, hitsLanded: shooterHitsLanded };
                }
                if (prev.id === targetId) {
                  return {
                    ...prev,
                    hitsTaken: targetHitsTaken,
                    lastHitAt: Date.now(),
                    lastHitBy: {
                      name: shooterName,
                      linkedin: shooterLinkedin,
                      timestamp: Date.now(),
                    },
                  };
                }
                return prev;
              });
              break;
            }

            case 'projectile:new': {
              setProjectiles((prev) => {
                if (prev.some((proj) => proj.id === payload.id)) return prev;
                return [...prev, payload];
              });
              break;
            }

            case 'projectile:removed': {
              setProjectiles((prev) => prev.filter((proj) => proj.id !== payload.id));
              break;
            }

            case 'player:left': {
              setPlayers((prev) => prev.filter((p) => p.id !== payload.id));
              break;
            }

            case 'event:new': {
              setEvents((prev) => [payload, ...prev.slice(0, 25)]);
              break;
            }
          }
        } catch {
          // Ignore JSON errors
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        // Attempt automatic reconnect after 2 seconds
        reconnectTimeoutRef.current = window.setTimeout(() => {
          if (hasProfile && playerInfo) {
            connectWebSocket(playerInfo);
          }
        }, 2000);
      };

      ws.onerror = () => {
        setIsConnected(false);
      };
    } catch {
      setIsConnected(false);
    }
  }, [hasProfile]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []);

  const handleStartGame = (name: string, linkedin: string, avatarStyle: AvatarStyle) => {
    const finalProfile = { name, linkedin, avatarStyle };
    setProfileData(finalProfile);
    try {
      localStorage.setItem('gdglink_profile', JSON.stringify(finalProfile));
    } catch {}

    // Immediately create / update myPlayer with the chosen name
    setMyPlayer((prev) => ({
      id: prev?.id || `p_${Date.now()}`,
      name,
      linkedin,
      avatarStyle,
      x: prev?.x ?? 320,
      y: prev?.y ?? 350,
      direction: prev?.direction ?? 'down',
      isMoving: false,
      walkFrame: 0,
      hitsLanded: prev?.hitsLanded ?? 0,
      hitsTaken: prev?.hitsTaken ?? 0,
      isBot: false,
    }));

    setHasProfile(true);
    setShowHowToPlay(true);
    connectWebSocket(finalProfile);
  };

  const handleMove = (
    x: number,
    y: number,
    direction: 'up' | 'down' | 'left' | 'right',
    isMoving: boolean,
    walkFrame: number
  ) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(
        JSON.stringify({
          type: 'player:move',
          payload: { x, y, direction, isMoving, walkFrame },
        })
      );
    }
  };

  const handleThrow = () => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(
        JSON.stringify({
          type: 'projectile:throw',
          payload: {},
        })
      );
    }
  };

  const handleSendChat = (text: string) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(
        JSON.stringify({
          type: 'player:chat',
          payload: { text },
        })
      );
    }
  };

  if (!hasProfile) {
    return <ProfileCreator initialProfile={profileData} onStartGame={handleStartGame} />;
  }

  // Active player with exact user entered name guaranteed
  const activePlayer: Player = myPlayer || {
    id: 'local_temp',
    name: profileData.name,
    linkedin: profileData.linkedin,
    avatarStyle: profileData.avatarStyle,
    x: 320,
    y: 350,
    direction: 'down',
    isMoving: false,
    walkFrame: 0,
    hitsLanded: 0,
    hitsTaken: 0,
    isBot: false,
  };

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col font-sans selection:bg-blue-500 selection:text-white">
      {/* Top Navigation Bar */}
      <header className="border-b border-slate-800 bg-[#0f172a]/90 backdrop-blur sticky top-0 z-40 px-3 sm:px-6 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-amber-500 flex items-center justify-center font-['Press_Start_2P'] text-[10px] text-white shadow-md">
            G
          </div>
          <div>
            <h1 className="text-xs sm:text-sm font-bold font-['Press_Start_2P'] text-amber-300 drop-shadow-sm">
              GDGLINK
            </h1>
            <p className="text-[10px] text-slate-400 font-mono hidden sm:block">
              Route 1 Multiplayer • Game Boy 8-Bit Open World
            </p>
          </div>
        </div>

        {/* Status Indicators */}
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-700/80 text-[11px] font-mono">
            {isConnected ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-emerald-300 font-bold">Multiplayer Live</span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <span className="text-amber-300">Syncing...</span>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={() => {
              sound.playFanfare();
              setShowTop5(true);
            }}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gradient-to-r from-amber-500/30 to-orange-500/30 hover:from-amber-500/40 hover:to-orange-500/40 text-amber-300 text-xs font-mono font-bold border border-amber-500/60 shadow-sm transition-all cursor-pointer"
            title="View Top 5 Most Connected on LinkedIn"
          >
            <Crown className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Top 5</span>
          </button>

          <button
            type="button"
            onClick={() => {
              sound.playStep();
              setShowHowToPlay(true);
            }}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono border border-slate-700 transition-colors cursor-pointer"
            title="How to play GDGLink"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Guide</span>
          </button>

          <button
            type="button"
            onClick={() => setHasProfile(false)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono border border-slate-700 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Change Avatar</span>
          </button>
        </div>
      </header>

      {/* Main Game Screen */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-2 sm:p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-start">
        {/* Left / Center: The Game Boy Canvas (Open Map) */}
        <div className="lg:col-span-8 flex flex-col items-center">
          <GameBoyCanvas
            myPlayer={activePlayer}
            players={players.length > 0 ? players : [activePlayer]}
            projectiles={projectiles}
            onMove={handleMove}
            onThrow={handleThrow}
            onSelectPlayer={setSelectedPlayer}
            onSendChat={handleSendChat}
          />
        </div>

        {/* Right: Leaderboard & Poke-Comm Dialogue Feed */}
        <div className="lg:col-span-4 space-y-4 w-full">
          {/* Real-time Rankings Table */}
          <Leaderboard
            players={players.length > 0 ? players : [activePlayer]}
            myPlayerId={activePlayer.id}
            onSelectPlayer={setSelectedPlayer}
          />

          {/* Retro Dialogue Box & Chiptune BGM */}
          <RetroDialogBox events={events} />
        </div>
      </main>

      {/* Trainer Card Modal (shown when clicking any player) */}
      <TrainerCardModal
        player={selectedPlayer}
        onClose={() => setSelectedPlayer(null)}
      />

      {/* How to Play Tutorial Modal (pops up right after entering Route 1) */}
      <HowToPlayModal
        isOpen={showHowToPlay}
        onClose={() => setShowHowToPlay(false)}
      />

      {/* Top 5 Most Connected on LinkedIn Hall of Fame Modal */}
      <Top5Modal
        isOpen={showTop5}
        onClose={() => setShowTop5(false)}
        players={players.length > 0 ? players : [activePlayer]}
        onSelectPlayer={setSelectedPlayer}
      />
    </div>
  );
}
