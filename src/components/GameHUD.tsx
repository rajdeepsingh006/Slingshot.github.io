/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { GameLevel, SpaceProbeStatus } from '../types';
import { Play, Square, RefreshCw, Volume2, VolumeX, Eye, EyeOff, FastForward, Compass, Sliders, ChevronLeft, ChevronRight, HelpCircle } from 'lucide-react';
import { motion } from 'motion/react';

interface GameHUDProps {
  level: GameLevel;
  angle: number;
  thrust: number;
  onAngleChange: (angle: number) => void;
  onThrustChange: (thrust: number) => void;
  isFlying: boolean;
  probeStatus: SpaceProbeStatus;
  onLaunch: () => void;
  onStop: () => void;
  onReset: () => void;
  
  // Settings & toggles
  showGridWarp: boolean;
  setShowGridWarp: (show: boolean) => void;
  showPrediction: boolean;
  setShowPrediction: (show: boolean) => void;
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  simulationSpeed: number;
  setSimulationSpeed: (speed: number) => void;
  
  // Navigation
  onNextLevel: () => void;
  onPrevLevel: () => void;
  hasNext: boolean;
  hasPrev: boolean;
  onShowTutorial: () => void;
}

export default function GameHUD({
  level,
  angle,
  thrust,
  onAngleChange,
  onThrustChange,
  isFlying,
  probeStatus,
  onLaunch,
  onStop,
  onReset,
  showGridWarp,
  setShowGridWarp,
  showPrediction,
  setShowPrediction,
  soundEnabled,
  setSoundEnabled,
  simulationSpeed,
  setSimulationSpeed,
  onNextLevel,
  onPrevLevel,
  hasNext,
  hasPrev,
  onShowTutorial
}: GameHUDProps) {

  // Helper to normalize sliders safely
  const handleAngleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onAngleChange(Number(e.target.value));
  };

  const handleThrustSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onThrustChange(Number(e.target.value));
  };

  // Adjust in smaller increments
  const adjustAngle = (amt: number) => {
    let next = (angle + amt) % 360;
    if (next < 0) next += 360;
    onAngleChange(next);
  };

  const adjustThrust = (amt: number) => {
    let next = Math.max(5, Math.min(100, thrust + amt));
    onThrustChange(next);
  };

  return (
    <div className="w-full hologram-panel p-5 grid grid-cols-1 lg:grid-cols-12 gap-6 select-none rounded-xl">
      
      {/* SECTION 1: Sector Header & Navigation (Left 4 cols) */}
      <div className="lg:col-span-4 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-cyan-500/20 pb-5 lg:pb-0 lg:pr-6">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono tracking-widest text-cyan-400 font-bold bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-500/30 glow-text">
              SECTOR COURSE BRIEF
            </span>
            <button
              onClick={onShowTutorial}
              className="text-slate-450 hover:text-cyan-405 p-1 rounded hover:bg-cyan-950/25 border border-transparent hover:border-cyan-500/20 transition-all cursor-pointer text-cyan-400"
              title="View Mission Manual"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-3 mt-3">
            <button
              onClick={onPrevLevel}
              disabled={!hasPrev}
              className="p-1 px-1.5 rounded bg-slate-950/80 hover:bg-cyan-950/30 border border-slate-800 hover:border-cyan-500/40 text-slate-400 hover:text-cyan-300 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <h2 className="text-base font-bold text-white tracking-tight leading-none text-center flex-1 font-display">
              SECTOR 0{level.id}: {level.name.toUpperCase()}
            </h2>

            <button
              onClick={onNextLevel}
              disabled={!hasNext}
              className="p-1 px-1.5 rounded bg-slate-950/80 hover:bg-cyan-950/30 border border-slate-800 hover:border-cyan-500/40 text-slate-400 hover:text-cyan-300 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <p className="text-xs text-slate-300 mt-2 leading-relaxed line-clamp-3">
            {level.description}
          </p>
        </div>

        {/* Level Telemetry constraints */}
        <div className="mt-4 p-3 bg-cyan-950/20 border border-cyan-500/20 rounded-lg space-y-1.5 font-mono text-[10px]">
          <div className="flex justify-between text-slate-400">
            <span>LAUNCH ORIGIN:</span>
            <span className="text-cyan-300">X: {level.launcher.x}, Y: {level.launcher.y}</span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>TARGET POINT:</span>
            <span className="text-cyan-300">X: {level.target.x}, Y: {level.target.y}</span>
          </div>
          <div className="flex justify-between text-slate-405">
            <span>FUEL PAR RATING:</span>
            <span className="text-emerald-400 font-bold">THRUST &le; {level.parThrust}%</span>
          </div>
        </div>
      </div>

      {/* SECTION 2: Launch Parameters Dialers (Middle 5 cols) */}
      <div className="lg:col-span-5 flex flex-col justify-center space-y-4 lg:px-2">
        
        {/* Thrust Panel Slider */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs font-mono text-slate-300">
            <span className="flex items-center gap-1.5 text-slate-205">
              <Sliders className="w-3.5 h-3.5 text-cyan-400" />
              LAUNCH THRUST
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={isFlying}
                onClick={() => adjustThrust(-5)}
                className="w-5 h-5 flex items-center justify-center bg-slate-950 hover:bg-cyan-950 border border-slate-705 hover:border-cyan-500/40 rounded text-[10px] text-slate-300 disabled:opacity-30 cursor-pointer"
              >
                -
              </button>
              <span className="font-bold text-cyan-400 bg-slate-950/90 py-0.5 px-2.5 rounded border border-cyan-500/30 min-w-[50px] text-center glow-text">
                {thrust}%
              </span>
              <button
                disabled={isFlying}
                onClick={() => adjustThrust(5)}
                className="w-5 h-5 flex items-center justify-center bg-slate-950 hover:bg-cyan-950 border border-slate-705 hover:border-cyan-500/40 rounded text-[10px] text-slate-300 disabled:opacity-30 cursor-pointer"
              >
                +
              </button>
            </div>
          </div>

          <div className="relative pt-1">
            <input
              type="range"
              min="5"
              max="100"
              value={thrust}
              disabled={isFlying}
              onChange={handleThrustSliderChange}
              className="w-full h-1.5 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-cyan-400 focus:outline-none disabled:opacity-40"
            />
            {/* Markers showing star thresholds */}
            <div
              className="absolute h-3 w-0.5 bg-emerald-500 top-0 pointer-events-none"
              style={{ left: `${level.parThrust}%` }}
              title="Par thrust (3 Star bar)"
            />
          </div>
        </div>

        {/* Angle Panel Slider */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs font-mono text-slate-300">
            <span className="flex items-center gap-1.5 text-slate-205">
              <Compass className="w-3.5 h-3.5 text-cyan-400" />
              VECTOR ANGLE
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={isFlying}
                onClick={() => adjustAngle(-5)}
                className="w-5 h-5 flex items-center justify-center bg-slate-950 hover:bg-cyan-950 border border-slate-705 hover:border-cyan-500/40 rounded text-[10px] text-slate-300 disabled:opacity-30 cursor-pointer"
              >
                -5
              </button>
              <button
                disabled={isFlying}
                onClick={() => adjustAngle(-1)}
                className="w-5 h-5 flex items-center justify-center bg-slate-950 hover:bg-cyan-950 border border-slate-705 hover:border-cyan-500/40 rounded text-[10px] text-slate-300 disabled:opacity-30 cursor-pointer"
              >
                -1
              </button>
              <span className="font-bold text-cyan-400 bg-slate-950/90 py-0.5 px-2.5 rounded border border-cyan-500/30 min-w-[50px] text-center glow-text">
                {angle}°
              </span>
              <button
                disabled={isFlying}
                onClick={() => adjustAngle(1)}
                className="w-5 h-5 flex items-center justify-center bg-slate-950 hover:bg-cyan-950 border border-slate-705 hover:border-cyan-500/40 rounded text-[10px] text-slate-300 disabled:opacity-30 cursor-pointer"
              >
                +1
              </button>
              <button
                disabled={isFlying}
                onClick={() => adjustAngle(5)}
                className="w-5 h-5 flex items-center justify-center bg-slate-950 hover:bg-cyan-950 border border-slate-705 hover:border-cyan-500/40 rounded text-[10px] text-slate-300 disabled:opacity-30 cursor-pointer"
              >
                +5
              </button>
            </div>
          </div>

          <input
            type="range"
            min="0"
            max="359"
            value={angle}
            disabled={isFlying}
            onChange={handleAngleSliderChange}
            className="w-full h-1.5 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-cyan-450 focus:outline-none disabled:opacity-40"
          />
        </div>
      </div>

      {/* SECTION 3: Main Dynamic Controls & Filters (Right 3 cols) */}
      <div className="lg:col-span-3 flex flex-col justify-between space-y-4">
        
        {/* Big Launch Trigger Button */}
        <div>
          {!isFlying ? (
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={onLaunch}
              className="w-full py-3.5 rounded bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold font-mono tracking-wider text-xs shadow-[0_0_15px_rgba(34,211,238,0.4)] transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4 fill-current" />
              FIRE SPACE PROBE
            </motion.button>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={onStop}
                className="py-3.5 rounded bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/50 text-rose-300 font-bold font-mono text-[10px] uppercase tracking-wider cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Square className="w-3 h-3 fill-current" />
                ABORT
              </motion.button>
              
              <button
                onClick={onReset}
                className="py-3.5 rounded bg-slate-950 hover:bg-slate-850 border border-slate-800 text-slate-300 font-bold font-mono text-[10px] uppercase tracking-wider cursor-pointer flex items-center justify-center gap-1.5"
              >
                <RefreshCw className="w-3 h-3 animate-spin-slow" />
                RELOAD
              </button>
            </div>
          )}
        </div>

        {/* Auxiliary Cockpit Filters */}
        <div className="grid grid-cols-4 gap-2 pt-1 border-t border-cyan-500/20">
          {/* Sound Toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 rounded border text-center flex items-center justify-center cursor-pointer transition-all ${
              soundEnabled
                ? 'bg-cyan-950/30 border-cyan-500/40 text-cyan-400 hover:bg-cyan-950/50 font-bold'
                : 'bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-300 hover:bg-slate-900'
            }`}
            title={soundEnabled ? "Mute Web Audio synth" : "Enable Web Audio synth"}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Grid Warping Filter Toggle */}
          <button
            onClick={() => setShowGridWarp(!showGridWarp)}
            className={`p-2 rounded border text-center flex items-center justify-center cursor-pointer transition-all ${
              showGridWarp
                ? 'bg-cyan-950/30 border-cyan-500/40 text-cyan-400 hover:bg-cyan-950/50 font-bold'
                : 'bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-300 hover:bg-slate-900'
            }`}
            title={showGridWarp ? "Disable space-time warped grid background" : "Enable space-time warped grid background"}
          >
            {showGridWarp ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </button>

          {/* Path Prediction Line Toggle */}
          <button
            onClick={() => setShowPrediction(!showPrediction)}
            className={`p-2 rounded border text-center flex items-center justify-center cursor-pointer transition-all ${
              showPrediction
                ? 'bg-cyan-950/30 border-cyan-500/40 text-cyan-400 hover:bg-cyan-950/50 font-bold'
                : 'bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-300 hover:bg-slate-900'
            }`}
            title={showPrediction ? "Disable predictive vector paths" : "Enable predictive vector paths"}
          >
            <span className="text-[9px] font-mono font-bold leading-none">PRED</span>
          </button>

          {/* Simulation Rate Booster */}
          <button
            onClick={() => {
              const nextRate = simulationSpeed === 1 ? 1.5 : simulationSpeed === 1.5 ? 2.5 : 1;
              setSimulationSpeed(nextRate);
            }}
            className={`p-2 rounded border text-center flex items-center justify-center cursor-pointer transition-all ${
              simulationSpeed > 1
                ? 'bg-cyan-950/30 border-cyan-500/40 text-cyan-400 hover:bg-cyan-950/50 font-bold'
                : 'bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-300 hover:bg-slate-900'
            }`}
            title="Accelerate orbital speed physics rate (1.0x / 1.5x / 2.5x)"
          >
            <div className="flex items-center gap-0.5">
              <FastForward className="w-3.5 h-3.5" />
              <span className="text-[8px] font-mono">{simulationSpeed}x</span>
            </div>
          </button>
        </div>

      </div>

    </div>
  );
}
