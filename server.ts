import express from 'express';
import http from 'http';
import path from 'path';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer as createViteServer } from 'vite';

interface AvatarStyle {
  googleColor: 'blue' | 'red' | 'yellow' | 'green';
  skinTone: number;
  hasHat: boolean;
  hasGlasses: boolean;
}

interface PlayerState {
  id: string;
  name: string;
  linkedin: string;
  avatarStyle: AvatarStyle;
  x: number;
  y: number;
  direction: 'up' | 'down' | 'left' | 'right';
  isMoving: boolean;
  walkFrame: number;
  hitsLanded: number;
  hitsTaken: number;
  lastHitBy?: {
    name: string;
    linkedin: string;
    timestamp: number;
  };
  lastHitAt?: number;
  isBot?: boolean;
}

interface ProjectileState {
  id: string;
  ownerId: string;
  ownerName: string;
  ownerLinkedin: string;
  color: 'blue' | 'red' | 'yellow' | 'green';
  x: number;
  y: number;
  dx: number;
  dy: number;
  createdAt: number;
}

interface GameEvent {
  id: string;
  type: 'hit' | 'join' | 'leave' | 'throw' | 'chat';
  text: string;
  timestamp: number;
  link?: string;
  color?: string;
}

const PORT = 3000;
const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

app.use(express.json());

// API health endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', playersCount: players.size });
});

// Real-time Game State
const players = new Map<string, PlayerState>();
const clientSockets = new Map<WebSocket, string>();
const projectiles = new Map<string, ProjectileState>();
const recentEvents: GameEvent[] = [];

function broadcast(type: string, payload: any) {
  const message = JSON.stringify({ type, payload });
  for (const client of wss.clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  }
}

function addEvent(event: Omit<GameEvent, 'id' | 'timestamp'>) {
  const fullEvent: GameEvent = {
    ...event,
    id: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    timestamp: Date.now()
  };
  recentEvents.unshift(fullEvent);
  if (recentEvents.length > 30) {
    recentEvents.pop();
  }
  broadcast('event:new', fullEvent);
}

// Initial default friendly NPC trainers (so the world feels lively immediately even with 1 player)
const NPC_TRAINERS: PlayerState[] = [
  {
    id: 'npc_ash',
    name: 'Ash Ketchum',
    linkedin: 'https://www.linkedin.com/in/ash-ketchum-pokemon-master',
    avatarStyle: { googleColor: 'red', skinTone: 1, hasHat: true, hasGlasses: false },
    x: 270,
    y: 280,
    direction: 'down',
    isMoving: false,
    walkFrame: 0,
    hitsLanded: 3,
    hitsTaken: 1,
    isBot: true
  },
  {
    id: 'npc_misty',
    name: 'Misty Waterflower',
    linkedin: 'https://www.linkedin.com/in/misty-cerulean-gym-leader',
    avatarStyle: { googleColor: 'yellow', skinTone: 0, hasHat: false, hasGlasses: false },
    x: 180,
    y: 460,
    direction: 'up',
    isMoving: false,
    walkFrame: 0,
    hitsLanded: 2,
    hitsTaken: 2,
    isBot: true
  },
  {
    id: 'npc_oak',
    name: 'Prof. Samuel Oak',
    linkedin: 'https://www.linkedin.com/in/professor-oak-researcher',
    avatarStyle: { googleColor: 'blue', skinTone: 2, hasHat: false, hasGlasses: true },
    x: 420,
    y: 240,
    direction: 'left',
    isMoving: false,
    walkFrame: 0,
    hitsLanded: 5,
    hitsTaken: 0,
    isBot: true
  },
  {
    id: 'npc_gary',
    name: 'Gary Oak',
    linkedin: 'https://www.linkedin.com/in/gary-oak-top-tier-architect',
    avatarStyle: { googleColor: 'green', skinTone: 1, hasHat: false, hasGlasses: true },
    x: 580,
    y: 400,
    direction: 'right',
    isMoving: false,
    walkFrame: 0,
    hitsLanded: 4,
    hitsTaken: 3,
    isBot: true
  }
];

// Seed NPC trainers
NPC_TRAINERS.forEach(npc => {
  players.set(npc.id, npc);
});

// NPC wandering loop
setInterval(() => {
  NPC_TRAINERS.forEach(npc => {
    const p = players.get(npc.id);
    if (!p) return;

    // 40% chance to move or turn
    if (Math.random() < 0.4) {
      const dirs: ('up' | 'down' | 'left' | 'right')[] = ['up', 'down', 'left', 'right'];
      const newDir = dirs[Math.floor(Math.random() * dirs.length)];
      p.direction = newDir;

      let nx = p.x;
      let ny = p.y;
      const step = 16;
      if (newDir === 'up') ny -= step;
      if (newDir === 'down') ny += step;
      if (newDir === 'left') nx -= step;
      if (newDir === 'right') nx += step;

      // Keep within map boundaries
      if (nx >= 48 && nx <= 820 && ny >= 72 && ny <= 660) {
        p.x = nx;
        p.y = ny;
        p.isMoving = true;
        p.walkFrame = (p.walkFrame + 1) % 3;
      }

      broadcast('player:moved', {
        id: p.id,
        x: p.x,
        y: p.y,
        direction: p.direction,
        isMoving: p.isMoving,
        walkFrame: p.walkFrame
      });
    }

    // Rare chance (5%) for NPC to throw LinkedIn link if human players are around
    if (Math.random() < 0.05) {
      const projId = `proj_${Date.now()}_${p.id}`;
      const speed = 7;
      let dx = 0;
      let dy = 0;
      if (p.direction === 'up') dy = -speed;
      if (p.direction === 'down') dy = speed;
      if (p.direction === 'left') dx = -speed;
      if (p.direction === 'right') dx = speed;

      const proj: ProjectileState = {
        id: projId,
        ownerId: p.id,
        ownerName: p.name,
        ownerLinkedin: p.linkedin,
        color: p.avatarStyle.googleColor,
        x: p.x + 12,
        y: p.y + 12,
        dx,
        dy,
        createdAt: Date.now()
      };
      projectiles.set(projId, proj);
      broadcast('projectile:new', proj);
    }
  });
}, 1600);

// Projectile physics and collision detection loop (60 FPS / ~16ms)
setInterval(() => {
  const now = Date.now();
  const deadProjIds: string[] = [];

  for (const [projId, proj] of projectiles.entries()) {
    // Projectile movement
    proj.x += proj.dx;
    proj.y += proj.dy;

    // Lifespan: 2.2 seconds or bounds
    if (now - proj.createdAt > 2200 || proj.x < 0 || proj.x > 900 || proj.y < 0 || proj.y > 750) {
      deadProjIds.push(projId);
      continue;
    }

    // Collision check against every other player
    for (const [playerId, target] of players.entries()) {
      if (playerId === proj.ownerId) continue; // Cannot hit self

      // Hitbox: 24x24 box around target
      const dist = Math.hypot(proj.x - (target.x + 12), proj.y - (target.y + 16));
      if (dist < 18) {
        // HIT DETECTED!
        deadProjIds.push(projId);

        // Update stats
        const shooter = players.get(proj.ownerId);
        if (shooter) {
          shooter.hitsLanded += 1;
        }

        target.hitsTaken += 1;
        target.lastHitAt = now;
        target.lastHitBy = {
          name: proj.ownerName,
          linkedin: proj.ownerLinkedin,
          timestamp: now
        };

        // Broadcast hit event
        broadcast('player:hit', {
          projectileId: projId,
          shooterId: proj.ownerId,
          shooterName: proj.ownerName,
          shooterLinkedin: proj.ownerLinkedin,
          targetId: target.id,
          targetName: target.name,
          targetLinkedin: target.linkedin,
          hitX: target.x + 12,
          hitY: target.y + 12,
          shooterHitsLanded: shooter?.hitsLanded || 0,
          targetHitsTaken: target.hitsTaken
        });

        addEvent({
          type: 'hit',
          text: `⚡ ${proj.ownerName} connected with ${target.name}!`,
          link: proj.ownerLinkedin,
          color: proj.color
        });

        break;
      }
    }
  }

  for (const id of deadProjIds) {
    projectiles.delete(id);
    broadcast('projectile:removed', { id });
  }
}, 33);

// WebSocket Connections
wss.on('connection', (ws) => {
  let playerId: string | null = null;

  // Send initial world state
  ws.send(JSON.stringify({
    type: 'init',
    payload: {
      players: Array.from(players.values()),
      projectiles: Array.from(projectiles.values()),
      events: recentEvents
    }
  }));

  ws.on('message', (data) => {
    try {
      const parsed = JSON.parse(data.toString());
      const { type, payload } = parsed;

      switch (type) {
        case 'player:join': {
          // Remove previous player session if rejoining with new profile
          const prevId = clientSockets.get(ws);
          if (prevId && players.has(prevId)) {
            players.delete(prevId);
            broadcast('player:left', { id: prevId });
          }

          playerId = `p_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
          clientSockets.set(ws, playerId);

          // Clean up any existing duplicate ID
          const newPlayer: PlayerState = {
            id: playerId,
            name: (payload.name || 'Trainer').trim().substring(0, 24),
            linkedin: (payload.linkedin || '').trim().substring(0, 160),
            avatarStyle: {
              googleColor: ['blue', 'red', 'yellow', 'green'].includes(payload.avatarStyle?.googleColor)
                ? payload.avatarStyle.googleColor
                : 'blue',
              skinTone: Math.max(0, Math.min(4, payload.avatarStyle?.skinTone ?? 0)),
              hasHat: Boolean(payload.avatarStyle?.hasHat),
              hasGlasses: Boolean(payload.avatarStyle?.hasGlasses)
            },
            x: payload.x || 300 + Math.floor(Math.random() * 80),
            y: payload.y || 340 + Math.floor(Math.random() * 80),
            direction: 'down',
            isMoving: false,
            walkFrame: 0,
            hitsLanded: 0,
            hitsTaken: 0,
            isBot: false
          };

          players.set(playerId, newPlayer);

          // Acknowledge join to player
          ws.send(JSON.stringify({
            type: 'player:joined_ack',
            payload: { player: newPlayer }
          }));

          // Notify everyone
          broadcast('player:joined', newPlayer);

          addEvent({
            type: 'join',
            text: `🎮 ${newPlayer.name} joined Route Link!`,
            link: newPlayer.linkedin,
            color: newPlayer.avatarStyle.googleColor
          });
          break;
        }

        case 'player:move': {
          if (!playerId) return;
          const p = players.get(playerId);
          if (!p) return;

          p.x = payload.x;
          p.y = payload.y;
          p.direction = payload.direction;
          p.isMoving = payload.isMoving;
          p.walkFrame = payload.walkFrame;

          broadcast('player:moved', {
            id: p.id,
            x: p.x,
            y: p.y,
            direction: p.direction,
            isMoving: p.isMoving,
            walkFrame: p.walkFrame
          });
          break;
        }

        case 'projectile:throw': {
          if (!playerId) return;
          const p = players.get(playerId);
          if (!p) return;

          const projId = `proj_${Date.now()}_${playerId}`;
          const speed = 8.5;
          let dx = 0;
          let dy = 0;

          if (p.direction === 'up') dy = -speed;
          if (p.direction === 'down') dy = speed;
          if (p.direction === 'left') dx = -speed;
          if (p.direction === 'right') dx = speed;

          const proj: ProjectileState = {
            id: projId,
            ownerId: p.id,
            ownerName: p.name,
            ownerLinkedin: p.linkedin,
            color: p.avatarStyle.googleColor,
            x: p.x + 12,
            y: p.y + 14,
            dx,
            dy,
            createdAt: Date.now()
          };

          projectiles.set(projId, proj);
          broadcast('projectile:new', proj);

          addEvent({
            type: 'throw',
            text: `📩 ${p.name} threw a LinkedIn invite!`,
            link: p.linkedin,
            color: p.avatarStyle.googleColor
          });
          break;
        }

        case 'player:chat': {
          if (!playerId) return;
          const p = players.get(playerId);
          if (!p) return;

          const text = (payload.text || '').trim().substring(0, 100);
          if (text) {
            broadcast('player:chatted', {
              id: p.id,
              name: p.name,
              text,
              color: p.avatarStyle.googleColor
            });

            addEvent({
              type: 'chat',
              text: `💬 ${p.name}: "${text}"`,
              link: p.linkedin
            });
          }
          break;
        }
      }
    } catch (err) {
      console.error('WS parse error', err);
    }
  });

  ws.on('close', () => {
    if (playerId) {
      const p = players.get(playerId);
      if (p && !p.isBot) {
        players.delete(playerId);
        broadcast('player:left', { id: playerId, name: p.name });
        addEvent({
          type: 'leave',
          text: `👋 ${p.name} logged out.`
        });
      }
      clientSockets.delete(ws);
    }
  });
});

// Vite Setup (Development vs Production)
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`GDGLink Multiplayer Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
