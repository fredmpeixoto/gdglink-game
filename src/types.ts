export type GoogleColor = 'blue' | 'red' | 'yellow' | 'green';

export interface AvatarStyle {
  googleColor: GoogleColor;
  skinTone: number; // 0: Light, 1: Medium-Light, 2: Medium, 3: Medium-Dark, 4: Dark
  hasHat: boolean;
  hasGlasses: boolean;
}

export type Direction = 'up' | 'down' | 'left' | 'right';

export interface Player {
  id: string;
  name: string;
  linkedin: string;
  avatarStyle: AvatarStyle;
  x: number;
  y: number;
  direction: Direction;
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

export interface Projectile {
  id: string;
  ownerId: string;
  ownerName: string;
  ownerLinkedin: string;
  color: GoogleColor;
  x: number;
  y: number;
  dx: number;
  dy: number;
  createdAt: number;
}

export interface GameEvent {
  id: string;
  type: 'hit' | 'join' | 'leave' | 'throw';
  text: string;
  timestamp: number;
  link?: string;
  color?: string;
}

export interface HitEffect {
  id: string;
  x: number;
  y: number;
  text: string;
  createdAt: number;
}

export const GOOGLE_COLORS: Record<GoogleColor, { name: string; hex: string; light: string; dark: string; border: string }> = {
  blue: {
    name: 'Google Blue',
    hex: '#4285F4',
    light: '#8AB4F8',
    dark: '#1A73E8',
    border: '#174EA6'
  },
  red: {
    name: 'Google Red',
    hex: '#EA4335',
    light: '#F28B82',
    dark: '#D93025',
    border: '#A50E0E'
  },
  yellow: {
    name: 'Google Yellow',
    hex: '#FBBC05',
    light: '#FDD663',
    dark: '#F9AB00',
    border: '#E37400'
  },
  green: {
    name: 'Google Green',
    hex: '#34A853',
    light: '#81C995',
    dark: '#1E8E3E',
    border: '#0D652D'
  }
};

export const SKIN_TONES = [
  { id: 0, name: 'Light', hex: '#FFDFBE', shadow: '#E4BF98' },
  { id: 1, name: 'Medium-Light', hex: '#ECB287', shadow: '#CB9066' },
  { id: 2, name: 'Medium', hex: '#B87B4E', shadow: '#965E32' },
  { id: 3, name: 'Medium-Dark', hex: '#814A27', shadow: '#623517' },
  { id: 4, name: 'Dark', hex: '#442717', shadow: '#2E180C' }
];
