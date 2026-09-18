import React, { useState, useEffect, useRef } from 'react';
import { AvatarStyle, GoogleColor, GOOGLE_COLORS, SKIN_TONES } from '../types';
import { drawPokemonTrainer } from '../utils/spriteRenderer';
import { sound } from '../utils/audio';
import { Sparkles, User, Link as LinkIcon, Palette, Glasses, HardHat, Play } from 'lucide-react';

interface ProfileCreatorProps {
  initialProfile?: {
    name: string;
    linkedin: string;
    avatarStyle: AvatarStyle;
  };
  onStartGame: (name: string, linkedin: string, style: AvatarStyle) => void;
}

export const ProfileCreator: React.FC<ProfileCreatorProps> = ({ initialProfile, onStartGame }) => {
  // Read saved profile if available
  const saved = (() => {
    if (initialProfile) return initialProfile;
    try {
      const item = localStorage.getItem('gdglink_profile');
      return item ? JSON.parse(item) : null;
    } catch {
      return null;
    }
  })();

  const [name, setName] = useState(saved?.name || 'Fred Peixoto');
  const [linkedin, setLinkedin] = useState(saved?.linkedin || 'https://www.linkedin.com/in/peixoto');
  const [selectedColor, setSelectedColor] = useState<GoogleColor>(saved?.avatarStyle?.googleColor || 'blue');
  const [selectedSkin, setSelectedSkin] = useState<number>(saved?.avatarStyle?.skinTone ?? 1);
  const [hasHat, setHasHat] = useState<boolean>(saved?.avatarStyle?.hasHat ?? true);
  const [hasGlasses, setHasGlasses] = useState<boolean>(saved?.avatarStyle?.hasGlasses ?? false);

  // Animated preview state
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [previewDir, setPreviewDir] = useState<'down' | 'up' | 'left' | 'right'>('down');
  const [previewFrame, setPreviewFrame] = useState<number>(0);

  // Auto cycle walking animation in preview
  useEffect(() => {
    const interval = setInterval(() => {
      setPreviewFrame((f) => (f + 1) % 3);
    }, 280);
    return () => clearInterval(interval);
  }, []);

  // Draw sprite preview
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const style: AvatarStyle = {
      googleColor: selectedColor,
      skinTone: selectedSkin,
      hasHat,
      hasGlasses,
    };

    // Draw at 5x scale for large, retro preview
    const scale = 5.5;
    const x = (canvas.width - 16 * scale) / 2;
    const y = (canvas.height - 16 * scale) / 2 - 4;

    drawPokemonTrainer(ctx, x, y, scale, style, previewDir, previewFrame, false);
  }, [selectedColor, selectedSkin, hasHat, hasGlasses, previewDir, previewFrame]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    sound.playFanfare();
    onStartGame(name.trim(), linkedin.trim(), {
      googleColor: selectedColor,
      skinTone: selectedSkin,
      hasHat,
      hasGlasses,
    });
  };

  return (
    <div className="min-h-screen bg-[#090d16] flex items-center justify-center p-3 sm:p-6 font-sans text-slate-100 selection:bg-blue-500 selection:text-white">
      {/* Game Boy Styled Enclosure */}
      <div className="w-full max-w-2xl bg-[#1e293b] border-4 border-[#334155] rounded-2xl shadow-2xl p-4 sm:p-8 relative overflow-hidden">
        {/* Retro Header Banner */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-950/80 border border-blue-600/40 text-blue-300 text-xs font-mono uppercase tracking-widest mb-2">
            <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
            Pokémon Game Boy Multiplayer
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-['Press_Start_2P'] text-amber-300 drop-shadow-[2px_2px_0px_#000000]">
            GDGLINK
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-2 font-mono">
            Create your retro Game Boy trainer & throw LinkedIn invites on Route 1!
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            {/* Left Column: Live 8-bit Sprite Preview */}
            <div className="md:col-span-5 flex flex-col items-center">
              <div className="w-full bg-[#0a0f1d] border-2 border-[#475569] rounded-xl p-4 flex flex-col items-center relative shadow-inner">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1">
                  TRAINER PREVIEW
                </span>

                {/* Overhead Preview Screen */}
                <div className="relative w-36 h-36 bg-[#8ba478] border-4 border-[#526447] rounded-lg flex items-center justify-center shadow-inner overflow-hidden">
                  {/* Retro pixel grid scanline overlay */}
                  <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.05)_50%,transparent_50%)] bg-[length:100%_4px] pointer-events-none z-10" />
                  <canvas
                    ref={canvasRef}
                    width={110}
                    height={110}
                    className="image-render-pixelated drop-shadow-md z-0"
                    style={{ imageRendering: 'pixelated' }}
                  />
                </div>

                {/* Facing Direction Controls */}
                <div className="flex gap-1 mt-3">
                  {(['down', 'up', 'left', 'right'] as const).map((dir) => (
                    <button
                      key={dir}
                      type="button"
                      onClick={() => {
                        sound.playStep();
                        setPreviewDir(dir);
                      }}
                      className={`px-2 py-1 text-[10px] font-mono uppercase rounded border transition-colors ${
                        previewDir === dir
                          ? 'bg-amber-400 text-slate-900 border-amber-500 font-bold'
                          : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                      }`}
                    >
                      {dir}
                    </button>
                  ))}
                </div>

                {/* Trainer Tag Simulation */}
                <div className="mt-3 text-center w-full px-2">
                  <div className="text-xs font-bold text-amber-300 truncate font-['Silkscreen']">
                    {name || 'Trainer'}
                  </div>
                  <div className="text-[10px] text-blue-400 truncate flex items-center justify-center gap-1 mt-0.5">
                    <span className="bg-[#0a66c2] text-white px-1 rounded text-[8px] font-bold">in</span>
                    <span className="truncate max-w-[130px]">{linkedin || 'linkedin.com'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: The 3 Inputs (Name, LinkedIn, Avatar Styles) */}
            <div className="md:col-span-7 space-y-4">
              {/* INPUT 1: Name */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-blue-400" />
                  1. Trainer Name
                </label>
                <input
                  type="text"
                  required
                  maxLength={20}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Satoshi Peixoto"
                  className="w-full px-3 py-2 bg-[#0a0f1d] border border-slate-700 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all font-mono"
                />
              </div>

              {/* INPUT 2: LinkedIn Link */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <LinkIcon className="w-3.5 h-3.5 text-blue-400" />
                  2. LinkedIn Profile Link
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                    <span className="bg-[#0a66c2] text-white text-[9px] font-bold px-1 rounded">in</span>
                  </div>
                  <input
                    type="text"
                    required
                    value={linkedin}
                    onChange={(e) => setLinkedin(e.target.value)}
                    placeholder="https://www.linkedin.com/in/yourname"
                    className="w-full pl-9 pr-3 py-2 bg-[#0a0f1d] border border-slate-700 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all font-mono"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  This link is what you throw at other avatars to network & connect!
                </p>
              </div>

              {/* INPUT 3: Avatar Styles */}
              <div className="bg-[#0a0f1d] border border-slate-700/80 rounded-xl p-3 space-y-3">
                <label className="block text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-amber-400" />
                  3. Avatar Styles & Google Colors
                </label>

                {/* 3a. 4 Google Colors */}
                <div>
                  <span className="text-[11px] text-slate-400 block mb-1.5">
                    Outfit Color (4 Google Colors):
                  </span>
                  <div className="grid grid-cols-4 gap-2">
                    {(Object.keys(GOOGLE_COLORS) as GoogleColor[]).map((cKey) => {
                      const cData = GOOGLE_COLORS[cKey];
                      const isSelected = selectedColor === cKey;
                      return (
                        <button
                          key={cKey}
                          type="button"
                          onClick={() => {
                            sound.playStep();
                            setSelectedColor(cKey);
                          }}
                          className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg border text-xs font-bold transition-all ${
                            isSelected
                              ? 'border-white ring-2 ring-white/50 scale-105'
                              : 'border-transparent opacity-80 hover:opacity-100'
                          }`}
                          style={{ backgroundColor: cData.hex, color: cKey === 'yellow' ? '#1e293b' : '#ffffff' }}
                        >
                          <span className="capitalize">{cKey}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 3b. Skin Tone (WhatsApp Emoji Tones) */}
                <div>
                  <span className="text-[11px] text-slate-400 block mb-1.5">
                    Skin Tone (WhatsApp emoji palette):
                  </span>
                  <div className="flex gap-2">
                    {SKIN_TONES.map((tone) => (
                      <button
                        key={tone.id}
                        type="button"
                        onClick={() => {
                          sound.playStep();
                          setSelectedSkin(tone.id);
                        }}
                        className={`flex-1 h-7 rounded-md border transition-all ${
                          selectedSkin === tone.id
                            ? 'border-white ring-2 ring-amber-400 scale-110'
                            : 'border-slate-600 hover:scale-105'
                        }`}
                        style={{ backgroundColor: tone.hex }}
                        title={tone.name}
                      />
                    ))}
                  </div>
                </div>

                {/* 3c. Hat & Glasses Toggles */}
                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => {
                      sound.playStep();
                      setHasHat(!hasHat);
                    }}
                    className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg border text-xs font-medium transition-all ${
                      hasHat
                        ? 'bg-blue-900/60 border-blue-500 text-blue-200'
                        : 'bg-slate-800 border-slate-700 text-slate-400'
                    }`}
                  >
                    <HardHat className="w-3.5 h-3.5" />
                    {hasHat ? 'Cap: ON' : 'Cap: OFF'}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      sound.playStep();
                      setHasGlasses(!hasGlasses);
                    }}
                    className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg border text-xs font-medium transition-all ${
                      hasGlasses
                        ? 'bg-blue-900/60 border-blue-500 text-blue-200'
                        : 'bg-slate-800 border-slate-700 text-slate-400'
                    }`}
                  >
                    <Glasses className="w-3.5 h-3.5" />
                    {hasGlasses ? 'Glasses: ON' : 'Glasses: OFF'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Submit Action */}
          <button
            type="submit"
            className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-slate-950 font-extrabold text-sm sm:text-base tracking-wider uppercase shadow-lg shadow-amber-500/20 hover:from-amber-400 hover:to-orange-500 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 border-2 border-amber-300 font-['Press_Start_2P']"
          >
            <Play className="w-4 h-4 fill-slate-950" />
            ENTER ROUTE 1 (START)
          </button>
        </form>
      </div>
    </div>
  );
};
