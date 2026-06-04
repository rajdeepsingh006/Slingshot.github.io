/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { HelpCircle, Orbit, Zap, Skull, ShieldAlert, Award, X, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';

interface InstructionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartGame?: () => void;
}

export default function InstructionModal({ isOpen, onClose, onStartGame }: InstructionModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="w-full max-w-2xl hologram-panel p-6 md:p-8 text-slate-100 rounded-xl relative overflow-hidden max-h-[90vh] overflow-y-auto"
      >
        {/* Holographic scanning effect */}
        <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 to-transparent pointer-events-none" />
        
        {/* Subtle decorative grid lines */}
        <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-cyan-400 hover:text-cyan-300 p-1.5 rounded border border-cyan-500/25 hover:border-cyan-500/60 bg-cyan-950/10 transition-all cursor-pointer shadow-[0_0_8px_rgba(34,211,238,0.2)]"
          aria-label="Close instructions"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 border border-cyan-500/30 rounded bg-cyan-950/20 shadow-[0_0_15px_rgba(34,211,238,0.1)]">
            <Orbit className="w-8 h-8 text-cyan-455 text-cyan-400 animate-spin-slow" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-white font-sans flex items-center gap-2 font-display">
              GRAVITY SLINGSHOT <span className="text-[10px] bg-cyan-950 text-cyan-400 border border-cyan-500/30 px-2 py-0.5 rounded font-mono glow-text">MISSION DEBRIEF</span>
            </h2>
            <p className="text-[10px] text-cyan-400/70 font-mono tracking-wider mt-0.5">SUBJECT: SPACETIME BENDING & PROBE PILOTING</p>
          </div>
        </div>

        {/* Body content */}
        <div className="space-y-6 text-sm text-slate-300 leading-relaxed font-sans">
          
          {/* Mission Concept */}
          <div className="p-4 bg-cyan-950/20 border border-cyan-500/20 rounded">
            <p className="text-slate-200 text-xs">
              Welcome, Cadet. Your objective is simple: navigate an unpowered space probe from the starting launcher to the green static telemetry target. Once launched, you lose direct thrust. You must rely purely on <strong className="text-cyan-350 text-cyan-300 glow-text">Newtonian physics</strong> and the gravity wells of huge celestial bodies.
            </p>
          </div>

          <h3 className="text-xs font-mono text-cyan-400 tracking-widest uppercase border-b border-cyan-500/20 pb-1.5 flex items-center gap-1.5 glow-text">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" /> MISSION RULES & PHYSICS
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Rule 1: Orbitals */}
            <div className="flex gap-3">
              <div className="flex-shrink-0 mt-1">
                <Orbit className="w-4 h-4 text-cyan-400" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white font-display uppercase tracking-wider">Gravity Wells</h4>
                <p className="text-xs text-slate-400 mt-1">
                  Massive planets bend space. The force follows Newtonian gravity: <code className="text-[10px] text-cyan-400 font-mono bg-cyan-950/40 px-1 rounded">F = G(m1*m2)/r²</code>. Fire close to planets to curve or speed up your flight.
                </p>
              </div>
            </div>

            {/* Rule 2: Launch Panel */}
            <div className="flex gap-3">
              <div className="flex-shrink-0 mt-1">
                <Zap className="w-4 h-4 text-cyan-455 text-cyan-400" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white font-display uppercase tracking-wider">Angle & Thrust</h4>
                <p className="text-xs text-slate-400 mt-1">
                  Adjust parameters using cockpit controls, keyboard arrow hotkeys, or click and drag the launcher's neon trajectory line.
                </p>
              </div>
            </div>

            {/* Rule 3: Black Holes */}
            <div className="flex gap-3">
              <div className="flex-shrink-0 mt-1">
                <Skull className="w-4 h-4 text-fuchsia-400" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white font-display uppercase tracking-wider">Event Horizon</h4>
                <p className="text-xs text-slate-400 mt-1">
                  Black Holes are extremely dense. Crossing their pitch black event horizon destroys the probe instantly. However, gravity is highly useful for whipping loops.
                </p>
              </div>
            </div>

            {/* Rule 4: Scoring */}
            <div className="flex gap-3">
              <div className="flex-shrink-0 mt-1">
                <Award className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white font-display uppercase tracking-wider">Efficiency Par</h4>
                <p className="text-xs text-slate-400 mt-1">
                  Efficiency is key. Launching with low initial thrust conserves fuel. Beat the level's benchmark thrust (<b>Par</b>) to earn maximum Stars!
                </p>
              </div>
            </div>

          </div>

          {/* Quick-controls HUD */}
          <div className="border border-cyan-500/20 p-4 rounded bg-slate-950/65 text-xs font-mono">
            <h4 className="text-xs font-bold text-cyan-400 mb-2 tracking-wider flex items-center gap-1.5 glow-text">
              <ShieldAlert className="w-4 h-4 text-cyan-400" /> INSTRUMENT PANEL HOTKEYS
            </h4>
            <ul className="space-y-1.5 text-slate-400 text-xs">
              <li>• <span className="text-cyan-400">[SPACEBAR]</span> : Launch Probe / Stop Flight</li>
              <li>• <span className="text-cyan-400">[R]</span> : Reset and reload launcher coordinates</li>
              <li>• <span className="text-cyan-400 font-bold">[ARROW UP / DOWN]</span> : Adjust launch thrust finer</li>
              <li>• <span className="text-cyan-400 font-bold">[ARROW LEFT / RIGHT]</span> : Adjust trajectory angle finer</li>
              <li>• <span className="text-cyan-400">[Mouse Click/Drag Canvas]</span> : Direct line targeting</li>
            </ul>
          </div>
        </div>

        {/* Footer actions */}
        <div className="mt-8 pt-6 border-t border-cyan-500/20 flex justify-end gap-3 text-xs font-mono">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
          >
            DISMISS
          </button>
          {onStartGame && (
            <button
              onClick={() => {
                onClose();
                onStartGame();
              }}
              className="px-6 py-2.5 rounded bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold transition-all cursor-pointer shadow-[0_0_15px_rgba(34,211,238,0.4)]"
            >
              LAUNCH SIMULATION
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
