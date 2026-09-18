import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Player, Projectile, GameEvent, HitEffect, GOOGLE_COLORS } from '../types';
import { drawPokemonTrainer, drawLinkedInProjectile } from '../utils/spriteRenderer';
import { drawMap, isPositionBlocked, WORLD_WIDTH, WORLD_HEIGHT } from '../utils/mapData';
import { sound } from '../utils/audio';

interface GameBoyCanvasProps {
  myPlayer: Player;
  players: Player[];
  projectiles: Projectile[];
  onMove: (x: number, y: number, direction: 'up' | 'down' | 'left' | 'right', isMoving: boolean, walkFrame: number) => void;
  onThrow: () => void;
  onSelectPlayer: (player: Player) => void;
  onSendChat: (text: string) => void;
}

export const GameBoyCanvas: React.FC<GameBoyCanvasProps> = ({
  myPlayer,
  players,
  projectiles,
  onMove,
  onThrow,
  onSelectPlayer,
  onSendChat,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Local movement state for smooth 60fps interpolation
  const posRef = useRef({
    x: myPlayer.x,
    y: myPlayer.y,
    dir: myPlayer.direction,
    isMoving: false,
    walkFrame: 0,
    speed: 3.2,
  });

  const keysPressed = useRef<{ [key: string]: boolean }>({});
  const lastEmitTime = useRef(0);
  const [hitEffects, setHitEffects] = useState<HitEffect[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [showVirtualControls, setShowVirtualControls] = useState(true);

  // Synchronize local ref if server updates myPlayer significantly
  useEffect(() => {
    const dx = Math.abs(posRef.current.x - myPlayer.x);
    const dy = Math.abs(posRef.current.y - myPlayer.y);
    if (dx > 40 || dy > 40) {
      posRef.current.x = myPlayer.x;
      posRef.current.y = myPlayer.y;
    }
  }, [myPlayer.x, myPlayer.y]);

  // Handle keyboard inputs
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't capture when typing in an input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        return;
      }

      keysPressed.current[e.key.toLowerCase()] = true;
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }

      if (e.key === ' ' || e.key.toLowerCase() === 'z' || e.key.toLowerCase() === 'j') {
        onThrow();
        sound.playThrow();
      }

      // Shift key for sprint
      if (e.shiftKey) {
        posRef.current.speed = 4.8;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current[e.key.toLowerCase()] = false;
      if (!e.shiftKey) {
        posRef.current.speed = 3.2;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [onThrow]);

  // Main game loop (Movement & Rendering)
  useEffect(() => {
    let animId: number;
    let stepCycle = 0;

    const gameLoop = () => {
      const pos = posRef.current;
      let dx = 0;
      let dy = 0;
      let newDir = pos.dir;

      const keys = keysPressed.current;
      if (keys['arrowup'] || keys['w']) {
        dy -= pos.speed;
        newDir = 'up';
      }
      if (keys['arrowdown'] || keys['s']) {
        dy += pos.speed;
        newDir = 'down';
      }
      if (keys['arrowleft'] || keys['a']) {
        dx -= pos.speed;
        newDir = 'left';
      }
      if (keys['arrowright'] || keys['d']) {
        dx += pos.speed;
        newDir = 'right';
      }

      const isMoving = dx !== 0 || dy !== 0;

      if (isMoving) {
        // Diagonal normalization
        if (dx !== 0 && dy !== 0) {
          dx *= 0.7071;
          dy *= 0.7071;
        }

        const nextX = pos.x + dx;
        const nextY = pos.y + dy;

        // Collision check with world tiles
        if (!isPositionBlocked(nextX, nextY, 7)) {
          pos.x = nextX;
          pos.y = nextY;
        } else if (!isPositionBlocked(nextX, pos.y, 7)) {
          pos.x = nextX; // slide horizontally
        } else if (!isPositionBlocked(pos.x, nextY, 7)) {
          pos.y = nextY; // slide vertically
        }

        pos.dir = newDir;
        pos.isMoving = true;

        // Walk frame cycle
        stepCycle += 0.18;
        pos.walkFrame = Math.floor(stepCycle) % 3;
      } else {
        pos.isMoving = false;
        pos.walkFrame = 0;
      }

      // Throttle network broadcasts to ~20-30 times/sec
      const now = performance.now();
      if (now - lastEmitTime.current > 40 && (isMoving || pos.isMoving !== myPlayer.isMoving)) {
        lastEmitTime.current = now;
        onMove(Math.round(pos.x), Math.round(pos.y), pos.dir, pos.isMoving, pos.walkFrame);
      }

      // Render Canvas
      render();

      animId = requestAnimationFrame(gameLoop);
    };

    const render = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const viewW = canvas.width;
      const viewH = canvas.height;

      // Center camera on my player within map bounds
      let cameraX = posRef.current.x + 8 - viewW / 2;
      let cameraY = posRef.current.y + 8 - viewH / 2;

      // Clamp camera
      cameraX = Math.max(0, Math.min(WORLD_WIDTH - viewW, cameraX));
      cameraY = Math.max(0, Math.min(WORLD_HEIGHT - viewH, cameraY));

      // 1. Draw Map Tiles
      drawMap(ctx, cameraX, cameraY, viewW, viewH);

      // 2. Draw Projectiles (Flying LinkedIn Envelopes)
      projectiles.forEach((proj) => {
        const screenX = proj.x - cameraX;
        const screenY = proj.y - cameraY;

        // Flying angle
        const angle = Math.atan2(proj.dy, proj.dx);

        // Projectile shadow
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.beginPath();
        ctx.ellipse(screenX, screenY + 8, 8, 3, 0, 0, Math.PI * 2);
        ctx.fill();

        // Projectile trail
        ctx.strokeStyle = GOOGLE_COLORS[proj.color]?.hex || '#4285F4';
        ctx.lineWidth = 2;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(screenX - proj.dx * 1.5, screenY - proj.dy * 1.5);
        ctx.lineTo(screenX, screenY);
        ctx.stroke();
        ctx.setLineDash([]);

        // Projectile Envelope
        drawLinkedInProjectile(ctx, screenX, screenY, 1, angle);

        // Owner mini name
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 9px monospace';
        ctx.textAlign = 'center';
        ctx.shadowColor = '#000000';
        ctx.shadowBlur = 3;
        ctx.fillText(proj.ownerName.split(' ')[0], screenX, screenY - 12);
        ctx.shadowBlur = 0;
      });

      // 3. Draw All Players (sorted by Y coordinate for natural depth)
      const allPlayers = [...players];
      // Update my player's coordinates with local smooth prediction and ensure name is preserved
      const myIdx = allPlayers.findIndex((p) => p.id === myPlayer.id);
      if (myIdx >= 0) {
        allPlayers[myIdx] = {
          ...allPlayers[myIdx],
          name: myPlayer.name,
          linkedin: myPlayer.linkedin,
          avatarStyle: myPlayer.avatarStyle,
          x: posRef.current.x,
          y: posRef.current.y,
          direction: posRef.current.dir,
          isMoving: posRef.current.isMoving,
          walkFrame: posRef.current.walkFrame,
        };
      } else {
        // Always include myPlayer on the canvas even before server roundtrip
        allPlayers.push({
          ...myPlayer,
          x: posRef.current.x,
          y: posRef.current.y,
          direction: posRef.current.dir,
          isMoving: posRef.current.isMoving,
          walkFrame: posRef.current.walkFrame,
        });
      }

      allPlayers.sort((a, b) => a.y - b.y);

      allPlayers.forEach((p) => {
        const screenX = Math.round(p.x - cameraX);
        const screenY = Math.round(p.y - cameraY);

        // Check flashing effect if recently hit (within 600ms)
        const isFlashing = p.lastHitAt && Date.now() - p.lastHitAt < 600 ? Math.floor(Date.now() / 80) % 2 === 0 : false;

        // Draw Game Boy Trainer Sprite (scale: 2.2x)
        drawPokemonTrainer(ctx, screenX, screenY, 2.2, p.avatarStyle, p.direction, p.walkFrame, Boolean(isFlashing));

        // Draw Player Tag above head
        ctx.save();
        const tagY = screenY - 14;

        // Name tag background
        const isMe = p.id === myPlayer.id;
        const displayName = isMe ? myPlayer.name : p.name;
        const nameText = isMe ? `★ ${displayName}` : displayName;
        ctx.font = isMe ? 'bold 11px sans-serif' : '10px sans-serif';
        const textWidth = ctx.measureText(nameText).width;

        const badgeW = Math.max(textWidth + 14, 52);
        const badgeH = 16;
        const badgeX = screenX + 16 - badgeW / 2;

        ctx.fillStyle = isMe ? 'rgba(30, 58, 138, 0.85)' : 'rgba(15, 23, 42, 0.85)';
        ctx.strokeStyle = isMe ? '#f59e0b' : '#475569';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(badgeX, tagY - badgeH, badgeW, badgeH, 4);
        ctx.fill();
        ctx.stroke();

        // Name text
        ctx.fillStyle = isMe ? '#fde047' : '#ffffff';
        ctx.textAlign = 'center';
        ctx.fillText(nameText, screenX + 16, tagY - 3);

        // LinkedIn & Stats Pill
        const statsText = `🎯 ${p.hitsLanded} | ⚡ ${p.hitsTaken}`;
        ctx.font = 'bold 9px monospace';
        const statsW = ctx.measureText(statsText).width + 10;
        const statsX = screenX + 16 - statsW / 2;

        ctx.fillStyle = '#0a66c2';
        ctx.beginPath();
        ctx.roundRect(statsX, tagY - badgeH - 14, statsW, 13, 3);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.fillText(statsText, screenX + 16, tagY - badgeH - 4);

        // Hit alert popover if hit within 2.5s
        if (p.lastHitBy && Date.now() - p.lastHitBy.timestamp < 2500) {
          const hitMsg = `💥 Hit by ${p.lastHitBy.name}!`;
          ctx.font = 'bold 10px sans-serif';
          ctx.fillStyle = '#dc2626';
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.5;
          ctx.strokeText(hitMsg, screenX + 16, tagY - badgeH - 20);
          ctx.fillText(hitMsg, screenX + 16, tagY - badgeH - 20);
        }

        ctx.restore();
      });

      // 4. Draw Floating Hit / Connect Effects
      hitEffects.forEach((eff) => {
        const screenX = eff.x - cameraX;
        const screenY = eff.y - cameraY - (Date.now() - eff.createdAt) * 0.03;
        ctx.save();
        ctx.font = 'bold 12px "Press Start 2P", monospace';
        ctx.fillStyle = '#fde047';
        ctx.shadowColor = '#000000';
        ctx.shadowBlur = 4;
        ctx.textAlign = 'center';
        ctx.fillText(eff.text, screenX, screenY);
        ctx.restore();
      });
    };

    animId = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animId);
  }, [myPlayer, players, projectiles, hitEffects, onMove]);

  // Click canvas to inspect player
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const clickX = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const clickY = ((e.clientY - rect.top) / rect.height) * canvas.height;

    // View camera offset
    let cameraX = posRef.current.x + 8 - canvas.width / 2;
    let cameraY = posRef.current.y + 8 - canvas.height / 2;
    cameraX = Math.max(0, Math.min(WORLD_WIDTH - canvas.width, cameraX));
    cameraY = Math.max(0, Math.min(WORLD_HEIGHT - canvas.height, cameraY));

    const worldClickX = clickX + cameraX;
    const worldClickY = clickY + cameraY;

    // Find clicked player
    for (const p of players) {
      const dist = Math.hypot(worldClickX - (p.x + 16), worldClickY - (p.y + 16));
      if (dist < 32) {
        sound.playStep();
        onSelectPlayer(p);
        return;
      }
    }
  };

  // Virtual D-Pad buttons for mobile & touch
  const handleDpadDown = (dir: 'up' | 'down' | 'left' | 'right') => {
    sound.playStep();
    keysPressed.current[dir === 'up' ? 'w' : dir === 'down' ? 's' : dir === 'left' ? 'a' : 'd'] = true;
  };

  const handleDpadUp = (dir: 'up' | 'down' | 'left' | 'right') => {
    keysPressed.current[dir === 'up' ? 'w' : dir === 'down' ? 's' : dir === 'left' ? 'a' : 'd'] = false;
  };

  return (
    <div ref={containerRef} className="relative w-full flex flex-col items-center">
      {/* Game View Screen with Retro Game Boy Bezel */}
      <div className="relative w-full max-w-4xl bg-[#1e293b] border-4 border-[#334155] rounded-2xl p-2 sm:p-4 shadow-2xl overflow-hidden">
        {/* Top Status Bar */}
        <div className="flex items-center justify-between px-2 py-1 mb-2 bg-[#090d16] border border-slate-700/80 rounded-lg text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-slate-300 font-bold">ROUTE 1 • OPEN WORLD</span>
          </div>
          <div className="flex items-center gap-3 text-slate-400">
            <span className="hidden sm:inline">Online: <strong className="text-amber-400">{players.length}</strong> trainers</span>
            <span>Your Throws: <strong className="text-blue-400">{myPlayer.hitsLanded}</strong></span>
            <span>Hits Taken: <strong className="text-red-400">{myPlayer.hitsTaken}</strong></span>
          </div>
        </div>

        {/* The HTML5 Retro Canvas */}
        <div className="relative w-full aspect-[4/3] sm:aspect-[16/10] bg-[#4ca2f5] rounded-xl overflow-hidden border-2 border-slate-800 shadow-inner flex items-center justify-center">
          {/* Subtle Retro Scanlines */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.06)_50%,transparent_50%)] bg-[length:100%_4px] pointer-events-none z-10" />

          <canvas
            ref={canvasRef}
            width={720}
            height={460}
            onClick={handleCanvasClick}
            className="w-full h-full object-contain cursor-crosshair"
            style={{ imageRendering: 'pixelated' }}
          />

          {/* Quick HUD Overlay */}
          <div className="absolute top-3 left-3 z-20 pointer-events-none flex flex-col gap-1">
            <div className="bg-slate-900/85 backdrop-blur border border-slate-700 rounded-lg px-2.5 py-1 text-[10px] text-slate-200 font-mono flex items-center gap-2">
              <span className="font-bold text-amber-400">Controls:</span>
              <span>[WASD / Arrows] Move</span>
              <span>•</span>
              <span className="text-blue-300 font-bold">[SPACE] Throw LinkedIn</span>
            </div>
          </div>
        </div>

        {/* Bottom Game Boy Console Controls (Desktop Helper & Touch Friendly) */}
        <div className="mt-3 pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
          {/* Virtual D-Pad */}
          <div className="flex items-center gap-1">
            <div className="grid grid-cols-3 gap-1 w-28 h-28 bg-slate-900/90 p-1.5 rounded-xl border border-slate-700">
              <div />
              <button
                type="button"
                onMouseDown={() => handleDpadDown('up')}
                onMouseUp={() => handleDpadUp('up')}
                onTouchStart={() => handleDpadDown('up')}
                onTouchEnd={() => handleDpadUp('up')}
                className="bg-slate-700 hover:bg-slate-600 active:bg-amber-400 active:text-slate-950 text-slate-200 rounded text-xs font-bold flex items-center justify-center"
              >
                ▲
              </button>
              <div />
              <button
                type="button"
                onMouseDown={() => handleDpadDown('left')}
                onMouseUp={() => handleDpadUp('left')}
                onTouchStart={() => handleDpadDown('left')}
                onTouchEnd={() => handleDpadUp('left')}
                className="bg-slate-700 hover:bg-slate-600 active:bg-amber-400 active:text-slate-950 text-slate-200 rounded text-xs font-bold flex items-center justify-center"
              >
                ◀
              </button>
              <div className="bg-slate-800 rounded flex items-center justify-center text-[9px] text-slate-500 font-mono">
                +
              </div>
              <button
                type="button"
                onMouseDown={() => handleDpadDown('right')}
                onMouseUp={() => handleDpadUp('right')}
                onTouchStart={() => handleDpadDown('right')}
                onTouchEnd={() => handleDpadUp('right')}
                className="bg-slate-700 hover:bg-slate-600 active:bg-amber-400 active:text-slate-950 text-slate-200 rounded text-xs font-bold flex items-center justify-center"
              >
                ▶
              </button>
              <div />
              <button
                type="button"
                onMouseDown={() => handleDpadDown('down')}
                onMouseUp={() => handleDpadUp('down')}
                onTouchStart={() => handleDpadDown('down')}
                onTouchEnd={() => handleDpadUp('down')}
                className="bg-slate-700 hover:bg-slate-600 active:bg-amber-400 active:text-slate-950 text-slate-200 rounded text-xs font-bold flex items-center justify-center"
              >
                ▼
              </button>
              <div />
            </div>
          </div>

          {/* Quick Chat / Shout Input */}
          <div className="flex-1 min-w-[200px] max-w-sm">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (chatInput.trim()) {
                  onSendChat(chatInput.trim());
                  setChatInput('');
                }
              }}
              className="flex gap-1.5"
            >
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Shout message to players..."
                maxLength={60}
                className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500 font-mono"
              />
              <button
                type="submit"
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg text-xs font-bold border border-slate-700 font-mono"
              >
                Shout
              </button>
            </form>
          </div>

          {/* Action Buttons (A = Throw LinkedIn, B = Sprint) */}
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-center">
              <button
                type="button"
                onClick={() => {
                  sound.playThrow();
                  onThrow();
                }}
                className="w-14 h-14 rounded-full bg-gradient-to-tr from-blue-600 to-sky-400 text-white font-['Press_Start_2P'] text-[10px] shadow-lg shadow-blue-500/30 active:scale-95 border-2 border-sky-300 flex items-center justify-center transition-transform cursor-pointer"
              >
                A
              </button>
              <span className="text-[10px] font-mono text-slate-300 mt-1 font-bold">
                THROW [SPACE]
              </span>
            </div>

            <div className="flex flex-col items-center">
              <button
                type="button"
                onMouseDown={() => {
                  posRef.current.speed = 5.0;
                }}
                onMouseUp={() => {
                  posRef.current.speed = 3.2;
                }}
                onTouchStart={() => {
                  posRef.current.speed = 5.0;
                }}
                onTouchEnd={() => {
                  posRef.current.speed = 3.2;
                }}
                className="w-14 h-14 rounded-full bg-gradient-to-tr from-red-600 to-rose-400 text-white font-['Press_Start_2P'] text-[10px] shadow-lg shadow-red-500/30 active:scale-95 border-2 border-rose-300 flex items-center justify-center transition-transform cursor-pointer"
              >
                B
              </button>
              <span className="text-[10px] font-mono text-slate-300 mt-1 font-bold">
                RUN [SHIFT]
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
