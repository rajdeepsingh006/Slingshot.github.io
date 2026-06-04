/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { GameLevel, SpaceProbe, PlayerProgress, SpaceProbeStatus } from './types';
import { LEVELS } from './data/levels';
import { sfx } from './utils/audio';
import GameCanvas from './components/GameCanvas';
import GameHUD from './components/GameHUD';
import LevelSelect from './components/LevelSelect';
import InstructionModal from './components/InstructionModal';
import { motion, AnimatePresence } from 'motion/react';
import { Orbit, Star, AlertTriangle, Play, RefreshCw, Trophy, Skull, HelpCircle, Navigation, Music } from 'lucide-react';

export default function App() {
  // Sector select Course state
  const [currentLevelId, setCurrentLevelId] = useState<number>(1);
  const activeLevel = LEVELS.find(l => l.id === currentLevelId) || LEVELS[0];

  // Launcher input parameters state
  const [userAngle, setUserAngle] = useState<number>(activeLevel.launcher.defaultAngle);
  const [userThrust, setUserThrust] = useState<number>(activeLevel.launcher.defaultThrust);

  // Probe physics integration tracking
  const [probe, setProbe] = useState<SpaceProbe>({
    x: activeLevel.launcher.x,
    y: activeLevel.launcher.y,
    vx: 0,
    vy: 0,
    trail: [],
    status: 'ready',
    flightTime: 0
  });

  const [isFlying, setIsFlying] = useState<boolean>(false);

  // Cockpit view preferences & features toggling
  const [showGridWarp, setShowGridWarp] = useState<boolean>(true);
  const [showPrediction, setShowPrediction] = useState<boolean>(true);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [simulationSpeed, setSimulationSpeed] = useState<number>(1.0);
  const [tutorialIsOpen, setTutorialIsOpen] = useState<boolean>(false);

  // Persisted player progress
  const [progress, setProgress] = useState<PlayerProgress>({
    unlockedLevels: [1],
    highScores: {},
    levelStars: {}
  });

  // Load progress on cold-boot bootstrap
  useEffect(() => {
    try {
      const stored = localStorage.getItem('gravity_slingshot_progress');
      if (stored) {
        const parsed: PlayerProgress = JSON.parse(stored);
        // Ensure at least level 1 is always unlocked
        if (!parsed.unlockedLevels || parsed.unlockedLevels.length === 0) {
          parsed.unlockedLevels = [1];
        }
        setProgress(parsed);
      } else {
        // Show tutorial modal automatically on very first visit
        setTutorialIsOpen(true);
      }
    } catch (e) {
      console.warn("Could not load local savings course history:", e);
    }
  }, []);

  // Save progress changes
  const saveProgress = (newProgress: PlayerProgress) => {
    try {
      localStorage.setItem('gravity_slingshot_progress', JSON.stringify(newProgress));
      setProgress(newProgress);
    } catch (e) {
      console.error("Save course tracking failed:", e);
    }
  };

  // Sync parameters slider controls when jumping levels
  useEffect(() => {
    setUserAngle(activeLevel.launcher.defaultAngle);
    setUserThrust(activeLevel.launcher.defaultThrust);
    setIsFlying(false);
    setProbe({
      x: activeLevel.launcher.x,
      y: activeLevel.launcher.y,
      vx: 0,
      vy: 0,
      trail: [],
      status: 'ready',
      flightTime: 0
    });
  }, [currentLevelId, activeLevel]);

  // Audio system state tracking syncer
  useEffect(() => {
    sfx.toggle(soundEnabled);
  }, [soundEnabled]);

  // LAUNCH Probe ignition sequence
  const startFlight = useCallback(() => {
    if (isFlying) return;

    // Direct translation of polar coordinates to acceleration velocity vector
    const theta = (userAngle * Math.PI) / 180;
    const forceFactor = 0.14; // scale coefficients for 800x600 units
    const initialVx = Math.cos(theta) * userThrust * forceFactor;
    const initialVy = Math.sin(theta) * userThrust * forceFactor;

    setProbe({
      x: activeLevel.launcher.x,
      y: activeLevel.launcher.y,
      vx: initialVx,
      vy: initialVy,
      trail: [],
      status: 'flying',
      flightTime: 0
    });

    setIsFlying(true);
    sfx.playLaunch();
  }, [isFlying, userAngle, userThrust, activeLevel]);

  // ABORT flight retraction command
  const stopFlight = useCallback(() => {
    setIsFlying(false);
    setProbe(prev => ({
      ...prev,
      status: 'ready',
      vx: 0,
      vy: 0,
      trail: []
    }));
  }, []);

  // Soft level parameters reset
  const resetLevel = useCallback(() => {
    setIsFlying(false);
    setProbe({
      x: activeLevel.launcher.x,
      y: activeLevel.launcher.y,
      vx: 0,
      vy: 0,
      trail: [],
      status: 'ready',
      flightTime: 0
    });
  }, [activeLevel]);

  // Physics status updates pipeline callback hook
  const handleProbeStateChange = useCallback((status: SpaceProbeStatus) => {
    if (status === 'success') {
      setIsFlying(false);

      // Stars calculation grading rule based on fuel par rating limit bounds
      // High fuel saving equals higher efficiency ratings
      let stars = 1;
      if (userThrust <= activeLevel.parThrust) {
        stars = 3;
      } else if (userThrust <= activeLevel.parThrust + 12) {
        stars = 2;
      }

      const currentStars = progress.levelStars[currentLevelId] || 0;
      const currentBest = progress.highScores[currentLevelId];

      const updatedUnlocked = [...progress.unlockedLevels];
      const nextId = currentLevelId + 1;
      if (nextId <= LEVELS.length && !updatedUnlocked.includes(nextId)) {
        updatedUnlocked.push(nextId);
      }

      const nextStars = Math.max(currentStars, stars);
      // High score logs the lowest fuel percentage achieved to succeed
      const nextBestThrust = currentBest !== undefined ? Math.min(currentBest, userThrust) : userThrust;

      const nextProgress: PlayerProgress = {
        unlockedLevels: updatedUnlocked,
        levelStars: {
          ...progress.levelStars,
          [currentLevelId]: nextStars
        },
        highScores: {
          ...progress.highScores,
          [currentLevelId]: nextBestThrust
        }
      };

      saveProgress(nextProgress);
    } else if (status === 'crashed' || status === 'escaped') {
      setIsFlying(false);
    }
  }, [currentLevelId, userThrust, activeLevel, progress]);

  // Level selector course bindings
  const selectLevel = (levelId: number) => {
    setCurrentLevelId(levelId);
  };

  const jumpNextLevel = () => {
    if (currentLevelId < LEVELS.length && progress.unlockedLevels.includes(currentLevelId + 1)) {
      setCurrentLevelId(prev => prev + 1);
    }
  };

  const jumpPrevLevel = () => {
    if (currentLevelId > 1) {
      setCurrentLevelId(prev => prev - 1);
    }
  };

  // Keyboard navigation hotkeys bindings layout
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Avoid blocking keyboard default actions on input elements if any
      if (document.activeElement?.tagName === 'INPUT') return;

      switch (e.key.toLowerCase()) {
        case ' ': // Spacebar Launches / Aborts simulation
          e.preventDefault();
          if (isFlying) {
            stopFlight();
          } else {
            startFlight();
          }
          break;
        case 'r': // R resets course retraction parameters
          e.preventDefault();
          resetLevel();
          break;
        case 'arrowup': // fine-grain thrust modifiers
          e.preventDefault();
          setUserThrust(prev => Math.min(100, prev + 1));
          sfx.playTick();
          break;
        case 'arrowdown':
          e.preventDefault();
          setUserThrust(prev => Math.max(5, prev - 1));
          sfx.playTick();
          break;
        case 'arrowleft': // fine-grain angle adjustment modifiers
          e.preventDefault();
          setUserAngle(prev => (prev - 1 + 360) % 360);
          sfx.playTick();
          break;
        case 'arrowright':
          e.preventDefault();
          setUserAngle(prev => (prev + 1) % 360);
          sfx.playTick();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFlying, startFlight, stopFlight, resetLevel]);

  // Helper crash messages based on celestial contact coordinates
  const getCrashCauseMessage = () => {
    let message = "Thermal hull breach detected. Structure integrity critical.";
    
    // Look which planet or black hole is closest to current coordinates
    let minDistance = Infinity;
    let closestBodyName = "";
    let closestBodyType = "";

    activeLevel.bodies.forEach(body => {
      const dx = body.x - probe.x;
      const dy = body.y - probe.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < minDistance) {
        minDistance = dist;
        closestBodyName = body.name;
        closestBodyType = body.type;
      }
    });

    if (minDistance < 100) {
      if (closestBodyType === 'blackhole') {
         message = `Spacetime point crushed. Probe crossing Event Horizon of ${closestBodyName}.`;
      } else if (closestBodyType === 'sun') {
         message = `Solar radiation shield override. Incineration complete near ${closestBodyName}'s core.`;
      } else {
         message = `Kinetic impact core crash registering at ${closestBodyName}'s landing coordinates.`;
      }
    } else if (activeLevel.asteroids.length > 0) {
      message = "Meteoroid debris cloud collision! Navigation sensor relay detached.";
    }

    return message;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-slate-950 overflow-x-hidden pb-10 grid-bg">
      
      {/* Visual background ambient twilight canvas decoration (zero margin-clutter) */}
      <div className="absolute top-0 inset-x-0 h-[450px] bg-gradient-to-b from-cyan-950/30 via-transparent to-transparent pointer-events-none" />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-6 pt-5 flex flex-col gap-6 relative z-10">
        
        {/* Holographic Header Bar */}
        <header className="flex items-center justify-between border-b border-cyan-500/10 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 border border-cyan-500/30 rounded bg-cyan-950/10 shadow-[0_0_15px_rgba(34,211,238,0.25)]">
              <Orbit className="w-6 h-6 text-cyan-400 animate-spin-slow animate-pulse" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5 font-display glow-text">
                GRAVITY SLINGSHOT
                <span className="text-[9px] font-mono border border-cyan-400/30 px-1.5 py-0.5 rounded text-cyan-400 font-bold bg-cyan-950/30">BETA V1.4</span>
              </h1>
              <p className="text-[10px] text-cyan-400/60 font-mono tracking-widest mt-0.5 uppercase font-bold">SOLAR GRAVITY ASSIST INTERACTIVE</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Quick sound toggle */}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-2 border border-slate-800 rounded-lg text-slate-400 hover:text-white hover:border-slate-700 transition-all cursor-pointer flex items-center gap-1.5 text-xs font-mono"
            >
              <Music className={`w-3.5 h-3.5 ${soundEnabled ? 'text-cyan-400' : 'text-slate-600'}`} />
              <span className="hidden sm:inline">{soundEnabled ? 'AUDIO ON' : 'MUTED'}</span>
            </button>

            <button
              onClick={() => setTutorialIsOpen(true)}
              className="p-2 border border-cyan-500/20 bg-cyan-950/5 hover:bg-cyan-950/15 rounded-lg text-cyan-400 hover:text-cyan-300 transition-all cursor-pointer flex items-center gap-1.5 text-xs font-mono"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">COCKPIT GUIDE</span>
            </button>
          </div>
        </header>

        {/* Outer Grid (Controls HUD and Game Screen Frame) */}
        <section className="grid grid-cols-1 gap-6 relative">
          
          <div className="relative">
            {/* Main Interactive Game Canvas */}
            <GameCanvas
              level={activeLevel}
              probe={probe}
              setProbe={setProbe}
              isFlying={isFlying}
              angle={userAngle}
              thrust={userThrust}
              onLaunchChange={(ang, thr) => {
                setUserAngle(ang);
                setUserThrust(thr);
              }}
              onProbeStateChange={handleProbeStateChange}
              showGridWarp={showGridWarp}
              showPrediction={showPrediction}
              simulationSpeed={simulationSpeed}
            />

            {/* INTERACTIVE HUD TERMINAL SCREENS OVERLAYS */}
            <AnimatePresence>
              
              {/* SUCCESS STATE TELEMETRY CELEBRATION */}
              {probe.status === 'success' && (
                <motion.div
                  initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
                  animate={{ opacity: 1, backdropFilter: 'blur(5px)' }}
                  exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
                  className="absolute inset-0 flex items-center justify-center p-4 bg-slate-950/80 rounded-xl z-20 overflow-hidden border border-emerald-500/30"
                >
                  <motion.div
                    initial={{ scale: 0.92, y: 12, opacity: 0 }}
                    animate={{ scale: 1, y: 0, opacity: 1 }}
                    className="w-full max-w-md bg-slate-950/90 border-2 border-emerald-500 p-6 md:p-8 rounded-lg text-center shadow-[0_0_30px_rgba(16,185,129,0.3)] relative overflow-hidden"
                  >
                    <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-emerald-400 to-transparent" />
                    
                    <div className="inline-flex p-3 rounded border border-emerald-500/35 bg-emerald-950/20 mb-4 animate-bounce">
                      <Trophy className="w-8 h-8 text-emerald-400 filter drop-shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
                    </div>

                    <h3 className="text-xl font-bold text-white tracking-tight font-display glow-text">MISSION COMPLETED!</h3>
                    <p className="text-xs text-emerald-400 font-mono uppercase tracking-wider mt-1">TELEMETRY LINK SECURED</p>

                    <p className="text-xs text-slate-300 mt-3 font-sans leading-relaxed">
                      The space probe has successfully touched down inside the beacon's target threshold coordinates, establishing stable orbit paths.
                    </p>

                    {/* Stars Grade display */}
                    <div className="flex justify-center gap-2 my-5">
                      {[1, 2, 3].map((num) => {
                        // Grade Stars
                        let earned = 1;
                        if (userThrust <= activeLevel.parThrust) {
                          earned = 3;
                        } else if (userThrust <= activeLevel.parThrust + 12) {
                          earned = 2;
                        }
                        const isEarned = num <= earned;

                        return (
                          <motion.div
                            key={num}
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.1 * num, type: 'spring' }}
                          >
                            <Star
                              className={`w-8 h-8 ${
                                isEarned ? 'text-amber-400 fill-amber-400 filter drop-shadow-[0_0_10px_rgba(245,158,11,0.6)]' : 'text-slate-800'
                              }`}
                            />
                          </motion.div>
                        );
                      })}
                    </div>

                    {/* Stats feedback summary details */}
                    <div className="bg-slate-950/80 border border-emerald-500/20 rounded p-3.5 space-y-2 text-xs font-mono text-left mb-6">
                      <div className="flex justify-between">
                        <span className="text-slate-400">LAUNCH THRUST UTILIZED:</span>
                        <span className="text-cyan-400 font-bold glow-text">{userThrust}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">SECTOR EFFICIENCY PAR:</span>
                        <span className="text-emerald-400 font-bold">{activeLevel.parThrust}%</span>
                      </div>
                      <div className="flex justify-between border-t border-cyan-500/10 pt-2 text-[11px]">
                        <span className="text-slate-300 font-bold uppercase">EFFICIENCY SCORING:</span>
                        <span className={userThrust <= activeLevel.parThrust ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                          {userThrust <= activeLevel.parThrust ? 'EXCELLENT STAR RATED' : 'CONSERVE FUEL FOR 3 STARS'}
                        </span>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-col sm:flex-row gap-2.5 justify-center font-mono">
                      <button
                        onClick={resetLevel}
                        className="px-5 py-2.5 rounded border border-slate-700 text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-900 transition-all cursor-pointer flex-1 text-center"
                      >
                        REPLAY COURSE
                      </button>
                      
                      {currentLevelId < LEVELS.length && progress.unlockedLevels.includes(currentLevelId + 1) ? (
                        <button
                          onClick={() => {
                            selectLevel(currentLevelId + 1);
                          }}
                          className="px-5 py-2.5 rounded bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold text-xs transition-all cursor-pointer flex-grow text-center shadow-[0_0_15px_rgba(16,185,129,0.4)]"
                        >
                          NEXT SECTOR &rarr;
                        </button>
                      ) : (
                        <button
                          onClick={resetLevel}
                          className="px-5 py-2.5 rounded bg-cyan-455 bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-xs transition-all cursor-pointer flex-grow text-center"
                        >
                          OK APPROVED
                        </button>
                      )}
                    </div>

                  </motion.div>
                </motion.div>
              )}

              {/* CRASHED / DESTROYED COCKPIT ALARMS OVERLAY */}
              {probe.status === 'crashed' && (
                <motion.div
                  initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
                  animate={{ opacity: 1, backdropFilter: 'blur(3px)' }}
                  exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
                  className="absolute inset-0 flex items-center justify-center p-4 bg-slate-950/80 rounded-xl z-20 overflow-hidden border border-rose-500/30"
                >
                  <motion.div
                    initial={{ scale: 0.92, y: 12, opacity: 0 }}
                    animate={{ scale: 1, y: 0, opacity: 1 }}
                    className="w-full max-w-sm bg-slate-950/90 border-2 border-rose-500 p-6 rounded-lg text-center shadow-[0_0_30px_rgba(244,63,94,0.3)] relative overflow-hidden"
                  >
                    <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-rose-500 to-transparent" />
                    
                    <div className="inline-flex p-3 rounded border border-rose-505/30 bg-rose-950/20 mb-3.5">
                      <Skull className="w-7 h-7 text-rose-455 text-rose-400 keyframe-pulse" />
                    </div>

                    <h3 className="text-lg font-bold text-white font-display uppercase tracking-tight">PROBE SIGNAL LOST</h3>
                    <p className="text-xs text-rose-400 font-mono uppercase tracking-wider mt-0.5">COLLISION REGISTERED</p>

                    <p className="text-xs text-slate-300 mt-3 font-sans leading-relaxed">
                      {getCrashCauseMessage()}
                    </p>

                    <div className="mt-5 p-2 bg-slate-950/85 border border-rose-500/20 rounded font-mono text-[10px] text-slate-400 max-w-xs mx-auto">
                      HOT-CORE TIP: Adjust launch vector angles slightly or reduce thrust output to slip safely past local gravity curves.
                    </div>

                    <div className="mt-6 flex gap-2 justify-center font-mono">
                      <button
                        onClick={resetLevel}
                        className="px-6 py-2.5 rounded bg-rose-500 hover:bg-rose-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer flex-1 flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(244,63,94,0.3)]"
                      >
                        <RefreshCw className="w-3.5 h-3.5" /> RE-FIRE LAUNCHER [R]
                      </button>
                    </div>

                  </motion.div>
                </motion.div>
              )}

              {/* BOUNDARY ESCAPED DEEP VOID ALARMS OVERLAY */}
              {probe.status === 'escaped' && (
                <motion.div
                  initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
                  animate={{ opacity: 1, backdropFilter: 'blur(3px)' }}
                  exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
                  className="absolute inset-0 flex items-center justify-center p-4 bg-slate-950/80 rounded-xl z-20 overflow-hidden border border-violet-500/30"
                >
                  <motion.div
                    initial={{ scale: 0.92, y: 12, opacity: 0 }}
                    animate={{ scale: 1, y: 0, opacity: 1 }}
                    className="w-full max-w-sm bg-slate-950/90 border-2 border-violet-500 p-6 rounded-lg text-center shadow-[0_0_30px_rgba(139,92,246,0.3)] relative overflow-hidden"
                  >
                    <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-violet-500 to-transparent" />
                    
                    <div className="inline-flex p-3 rounded border border-violet-500/30 bg-violet-950/20 mb-3.5">
                      <AlertTriangle className="w-7 h-7 text-violet-400" />
                    </div>

                    <h3 className="text-lg font-bold text-white font-display uppercase tracking-tight">PROBE DE-SYNCED</h3>
                    <p className="text-xs text-violet-400 font-mono uppercase tracking-wider mt-0.5">TELEMETRY RANGE ESCAPED</p>

                    <p className="text-xs text-slate-300 mt-3 font-sans leading-relaxed">
                      Your probe broke past the solar radar grid parameters and is gliding unpowered into empty, dark, open stellar dust voids.
                    </p>

                    <div className="mt-5 p-2 bg-slate-950/80 border border-violet-500/20 rounded font-mono text-[10px] text-slate-400 max-w-xs mx-auto">
                      HOT-CORE TIP: Reduce thrust output so local massive gravity fields can pull and warp your flight vector downwards!
                    </div>

                    <div className="mt-6 flex gap-2 justify-center font-mono">
                      <button
                        onClick={resetLevel}
                        className="px-6 py-2.5 rounded bg-violet-500 hover:bg-violet-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer flex-grow flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(139,92,246,0.3)]"
                      >
                        <RefreshCw className="w-3.5 h-3.5" /> RE-CALIBRATE LAUNCHER
                      </button>
                    </div>

                  </motion.div>
                </motion.div>
              )}

            </AnimatePresence>
          </div>

          {/* Core Cockpit HUD Control Board parameters Panel */}
          <GameHUD
            level={activeLevel}
            angle={userAngle}
            thrust={userThrust}
            onAngleChange={setUserAngle}
            onThrustChange={setUserThrust}
            isFlying={isFlying}
            probeStatus={probe.status}
            onLaunch={startFlight}
            onStop={stopFlight}
            onReset={resetLevel}
            showGridWarp={showGridWarp}
            setShowGridWarp={setShowGridWarp}
            showPrediction={showPrediction}
            setShowPrediction={setShowPrediction}
            soundEnabled={soundEnabled}
            setSoundEnabled={setSoundEnabled}
            simulationSpeed={simulationSpeed}
            setSimulationSpeed={setSimulationSpeed}
            onNextLevel={jumpNextLevel}
            onPrevLevel={jumpPrevLevel}
            hasNext={currentLevelId < LEVELS.length && progress.unlockedLevels.includes(currentLevelId + 1)}
            hasPrev={currentLevelId > 1}
            onShowTutorial={() => setTutorialIsOpen(true)}
          />

          {/* Grid course Navigator Browser list selection overlay drawers */}
          <LevelSelect
            levels={LEVELS}
            unlockedLevels={progress.unlockedLevels}
            currentLevelId={currentLevelId}
            onSelectLevel={selectLevel}
            levelStars={progress.levelStars}
            highScores={progress.highScores}
          />

        </section>

      </main>

      {/* Futuristic instruction handbook details Modal overlay component */}
      <AnimatePresence>
        <InstructionModal
          isOpen={tutorialIsOpen}
          onClose={() => setTutorialIsOpen(false)}
          onStartGame={resetLevel}
        />
      </AnimatePresence>

      {/* Subtle system coordinates in simple footer margins */}
      <footer className="mt-14 max-w-7xl w-full mx-auto px-4 md:px-6 font-mono text-[9px] text-slate-600/90 text-center border-t border-slate-900/40 pt-5 flex flex-col md:flex-row items-center justify-between gap-3">
        <span>COSMIC TELEMETRY LINKED VIA HTML5 GRAPHICS WEBBINGS ENGINE © 2026</span>
        <span className="flex items-center gap-1.5 font-bold">
          <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
          PILOT HIGHSCORE RATING RECORD: {Object.keys(progress.levelStars).length}/{LEVELS.length} COURSES CLEARED
        </span>
      </footer>

    </div>
  );
}
