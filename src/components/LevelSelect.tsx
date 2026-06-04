/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { GameLevel } from '../types';
import { Star, Lock, Play, Flame, Award, Navigation } from 'lucide-react';
import { motion } from 'motion/react';

interface LevelSelectProps {
  levels: GameLevel[];
  unlockedLevels: number[];
  currentLevelId: number;
  onSelectLevel: (levelId: number) => void;
  levelStars: { [levelId: number]: number };
  highScores: { [levelId: number]: number };
  onClose?: () => void;
}

export default function LevelSelect({
  levels,
  unlockedLevels,
  currentLevelId,
  onSelectLevel,
  levelStars,
  highScores,
  onClose
}: LevelSelectProps) {

  // Difficulty style helper
  const getDifficultyBadge = (difficulty: GameLevel['difficulty']) => {
    switch (difficulty) {
      case 'Easy':
        return 'text-emerald-400 bg-emerald-950/20 border-emerald-500/20';
      case 'Medium':
        return 'text-amber-400 bg-amber-950/20 border-amber-500/20';
      case 'Hard':
        return 'text-orange-400 bg-orange-950/20 border-orange-500/20';
      case 'Expert':
        return 'text-fuchsia-400 bg-fuchsia-950/20 border-fuchsia-500/20';
      default:
        return 'text-slate-400 bg-slate-900 border-slate-700';
    }
  };

  return (
    <div className="w-full hologram-panel p-5 rounded-xl">
      <div className="flex items-center justify-between mb-5 border-b border-cyan-500/20 pb-3">
        <div>
          <h3 className="text-xs font-mono tracking-widest text-cyan-400 uppercase flex items-center gap-1.5 font-bold glow-text">
            <Navigation className="w-4 h-4 text-cyan-400" /> MISSION NAVIGATOR
          </h3>
          <p className="text-[11px] text-slate-350 font-sans mt-0.5">Select a sector course to launch physics simulation.</p>
        </div>
        
        {/* Statistics total */}
        <div className="flex gap-4 text-xs font-mono">
          <div className="flex items-center gap-1 bg-slate-950/70 py-1 px-2.5 border border-cyan-500/30 rounded">
            <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            <span className="text-cyan-300 font-bold">
              {Object.values(levelStars).reduce((t, c) => t + c, 0)}/{levels.length * 3}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {levels.map((lvl) => {
          const isUnlocked = unlockedLevels.includes(lvl.id);
          const isSelected = currentLevelId === lvl.id;
          const starsEarned = levelStars[lvl.id] || 0;
          const bestThr = highScores[lvl.id];

          return (
            <motion.div
              id={`lvl-card-${lvl.id}`}
              key={lvl.id}
              whileHover={isUnlocked ? { y: -2, scale: 1.01 } : {}}
              onClick={() => isUnlocked && onSelectLevel(lvl.id)}
              className={`p-4 rounded border flex flex-col justify-between transition-all relative overflow-hidden select-none cursor-pointer ${
                isSelected
                  ? 'bg-cyan-950/25 border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.3)]'
                  : isUnlocked
                  ? 'bg-slate-950/60 hover:bg-cyan-950/15 border-cyan-500/10 hover:border-cyan-500/30 text-slate-300'
                  : 'bg-slate-950/10 border-slate-900 opacity-40 cursor-not-allowed'
              }`}
            >
              <div>
                {/* Sector Level Indicator & Difficulty */}
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono tracking-wider text-slate-400">
                    SECTOR 0{lvl.id}
                  </span>
                  <span className={`text-[9px] font-mono border px-1.5 py-0.5 rounded ${getDifficultyBadge(lvl.difficulty)}`}>
                    {lvl.difficulty}
                  </span>
                </div>

                {/* Level Title */}
                <h4 className="text-sm font-bold text-white tracking-tight leading-snug flex items-center gap-1.5 font-display">
                  {lvl.name.toUpperCase()}
                  {!isUnlocked && <Lock className="w-3.5 h-3.5 text-slate-600" />}
                </h4>

                {/* Short Briefing Description */}
                <p className="text-[11px] text-slate-350 font-sans mt-1.5 line-clamp-2 leading-relaxed">
                  {lvl.description}
                </p>
              </div>

              {/* Stars & Efficiency score details */}
              <div className="mt-4 pt-3 border-t border-cyan-500/10 flex items-center justify-between">
                {/* Render Stars */}
                <div className="flex gap-0.5">
                  {[1, 2, 3].map((val) => (
                    <Star
                      key={val}
                      className={`w-3.5 h-3.5 ${
                        val <= starsEarned
                          ? 'text-amber-400 fill-amber-400 filter drop-shadow-[0_0_5px_rgba(245,158,11,0.4)]'
                          : 'text-slate-800 fill-transparent'
                      }`}
                    />
                  ))}
                </div>

                {/* Best Result display */}
                <div className="text-[10px] font-mono text-slate-450">
                  {bestThr !== undefined ? (
                    <div className="flex items-center gap-1">
                      <Flame className="w-3 h-3 text-cyan-400" />
                      <span>BEST: <strong className="text-cyan-400 font-bold glow-text">{bestThr}%</strong></span>
                    </div>
                  ) : (
                    <span className="text-slate-600">NO ATTEMPTS</span>
                  )}
                </div>
              </div>

              {/* Selected visual corner overlay */}
              {isSelected && (
                <div className="absolute top-0 right-0 w-3 h-3 bg-cyan-400" />
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
