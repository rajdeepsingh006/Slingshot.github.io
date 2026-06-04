/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useEffect, useState, useMemo } from 'react';
import { GameLevel, Vector2D, SpaceProbe, CelestialBody, Asteroid, SpaceProbeStatus } from '../types';
import { sfx } from '../utils/audio';

interface GameCanvasProps {
  level: GameLevel;
  probe: SpaceProbe;
  setProbe: React.Dispatch<React.SetStateAction<SpaceProbe>>;
  isFlying: boolean;
  angle: number; // in degrees
  thrust: number; // 0 to 100
  onLaunchChange: (angle: number, thrust: number) => void;
  onProbeStateChange: (status: SpaceProbeStatus) => void;
  showGridWarp: boolean;
  showPrediction: boolean;
  simulationSpeed: number; // 1x, 1.5x, 2x
}

// Gravity constant scaled for game dimensions
const G = 0.15;

export default function GameCanvas({
  level,
  probe,
  setProbe,
  isFlying,
  angle,
  thrust,
  onLaunchChange,
  onProbeStateChange,
  showGridWarp = true,
  showPrediction = true,
  simulationSpeed = 1
}: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [isHoveringLauncher, setIsHoveringLauncher] = useState(false);
  const [currentLevelBodies, setCurrentLevelBodies] = useState<CelestialBody[]>([]);
  const [currentLevelAsteroids, setCurrentLevelAsteroids] = useState<Asteroid[]>([]);

  // Particle engine state
  const particlesRef = useRef<{ x: number; y: number; vx: number; vy: number; color: string; size: number; alpha: number; life: number }[]>([]);

  // Keep a reference to physics parameters for the animation frame loop
  const physicsStateRef = useRef({
    isFlying: false,
    probeX: level.launcher.x,
    probeY: level.launcher.y,
    probeVx: 0,
    probeVy: 0,
    probeTrail: [] as Vector2D[],
    probeStatus: 'ready' as SpaceProbeStatus,
    flightTime: 0
  });

  // Track dynamic levels and elements locally when level changes
  useEffect(() => {
    // Deep copy bodies so we can safely update angles/orbits
    const copiedBodies = level.bodies.map(b => ({
      ...b,
      currentAngle: b.currentAngle !== undefined ? b.currentAngle : 0
    }));
    setCurrentLevelBodies(copiedBodies);

    // Deep copy asteroids
    const copiedAsteroids = level.asteroids.map(a => ({ ...a }));
    setCurrentLevelAsteroids(copiedAsteroids);

    // Reset physics state ref
    physicsStateRef.current = {
      isFlying: false,
      probeX: level.launcher.x,
      probeY: level.launcher.y,
      probeVx: 0,
      probeVy: 0,
      probeTrail: [],
      probeStatus: 'ready',
      flightTime: 0
    };
  }, [level]);

  // Sync isFlying and probe change states back to Ref state for ultra-fast render loops
  useEffect(() => {
    physicsStateRef.current.isFlying = isFlying;
    if (!isFlying) {
      physicsStateRef.current.probeX = level.launcher.x;
      physicsStateRef.current.probeY = level.launcher.y;
      physicsStateRef.current.probeVx = 0;
      physicsStateRef.current.probeVy = 0;
      physicsStateRef.current.probeTrail = [];
      physicsStateRef.current.probeStatus = probe.status;
      physicsStateRef.current.flightTime = 0;
    } else if (probe.status === 'flying') {
      if (physicsStateRef.current.probeStatus !== 'flying') {
        physicsStateRef.current.probeVx = probe.vx;
        physicsStateRef.current.probeVy = probe.vy;
        physicsStateRef.current.probeX = probe.x;
        physicsStateRef.current.probeY = probe.y;
        physicsStateRef.current.probeStatus = 'flying';
      }
    }
  }, [isFlying, probe.status, probe.vx, probe.vy, probe.x, probe.y, level]);

  // Handle Resize beautifully
  useEffect(() => {
    if (!containerRef.current) return;
    const updateSize = () => {
      const { clientWidth } = containerRef.current!;
      // Enforce 4:3 or similar aspect ratio but bounded nicely
      const calculatedHeight = Math.min(600, Math.max(450, Math.floor(clientWidth * 0.7)));
      setDimensions({ width: clientWidth, height: calculatedHeight });
    };

    updateSize();
    const resizeObserver = new ResizeObserver(updateSize);
    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // Calculate scaling factors between internal virtual game units (800x600 coordinate layout) and actual canvas render size
  const scaleX = dimensions.width / 800;
  const scaleY = dimensions.height / 600;

  // Convert game coordinates logic (800x600) to actual canvas pixel space
  const gameToCanvas = (pt: Vector2D): Vector2D => ({
    x: pt.x * scaleX,
    y: pt.y * scaleY
  });

  // Convert canvas pixel space back to internal game coordinate space (800x600)
  const canvasToGame = (pt: Vector2D): Vector2D => ({
    x: pt.x / scaleX,
    y: pt.y / scaleY
  });

  // Trajectory projection logic (Predictive orbit drafting)
  // Computes trajectory path up to 300 steps forward
  const predictedPoints = useMemo(() => {
    if (!showPrediction || isFlying) return [];

    const pts: Vector2D[] = [];
    let px = level.launcher.x;
    let py = level.launcher.y;

    // Convert polar velocity inputs to vector values
    const theta = (angle * Math.PI) / 180;
    const forceFactor = 0.14; // Tuned launch coefficient
    let pvx = Math.cos(theta) * thrust * forceFactor;
    let pvy = Math.sin(theta) * thrust * forceFactor;

    const maxSteps = 220;
    let step = 0;
    let hitSomething = false;

    // Create a local shallow state of celestial positions
    const localBodies = currentLevelBodies.map(b => {
      if (b.orbitCenter && b.orbitRadius && b.orbitSpeed !== undefined && b.currentAngle !== undefined) {
        // Run planet positions a bit ahead to keep simulation feeling solid
        return b;
      }
      return b;
    });

    while (step < maxSteps && !hitSomething) {
      pts.push({ x: px, y: py });

      // Apply universal gravity acceleration from all bodies
      let ax = 0;
      let ay = 0;

      for (const body of localBodies) {
        const dx = body.x - px;
        const dy = body.y - py;
        const distSq = dx * dx + dy * dy;
        const dist = Math.sqrt(distSq);

        if (dist > 5) {
          // Accurate Newtonian acceleration pulls
          const gravityPull = (G * body.mass) / (distSq * dist);
          ax += dx * gravityPull;
          ay += dy * gravityPull;
        }

        // Virtual collision stops previewing
        if (dist < body.radius) {
          hitSomething = true;
          break;
        }
      }

      // Check collision with Target
      const tx = level.target.x - px;
      const ty = level.target.y - py;
      const targetDist = Math.sqrt(tx * tx + ty * ty);
      if (targetDist < level.target.radius) {
        hitSomething = true;
        break;
      }

      pvx += ax;
      pvy += ay;
      px += pvx;
      py += pvy;

      // Escape bounds
      if (px < -100 || px > 900 || py < -100 || py > 700) {
        break;
      }

      step++;
    }

    return pts;
  }, [level, angle, thrust, currentLevelBodies, showPrediction, isFlying]);

  // Spacetime Grid warping displacement function
  const getWarpedPoint = (x: number, y: number, bodies: CelestialBody[]): Vector2D => {
    if (!showGridWarp) return { x, y };

    let dx = 0;
    let dy = 0;

    for (const body of bodies) {
      let bx = body.x;
      let by = body.y;

      const rx = bx - x;
      const ry = by - y;
      const distSq = rx * rx + ry * ry;
      const dist = Math.sqrt(distSq);

      if (dist > body.radius * 0.7) {
        // Space-time warp gravity pull coefficient
        // Warping scale represents mass/density warping spacetime fabric
        const warpStrength = body.type === 'blackhole' ? 1.5 : 0.8;
        const force = (body.mass * 0.28 * warpStrength) / (dist + 30) ** 1.35;
        const displacement = Math.min(dist - body.radius * 0.6, force);
        
        dx += (rx / dist) * displacement;
        dy += (ry / dist) * displacement;
      }
    }

    return { x: x + dx, y: y + dy };
  };

  // Drag handlers for direct vector aiming inside the canvas
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (isFlying) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    // Actual pixels Clicked
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Convert to native 800x600 units
    const gamePt = canvasToGame({ x: clickX, y: clickY });

    // Check click distance to Launcher head or base
    const startX = level.launcher.x;
    const startY = level.launcher.y;

    // Check launcher distance
    const dist = Math.sqrt((gamePt.x - startX) ** 2 + (gamePt.y - startY) ** 2);

    // Set Launcher active if clicking within a reasonable handle range (100 units radial vector)
    if (dist <= 110) {
      setDragActive(true);
      e.currentTarget.setPointerCapture(e.pointerId);
      updateVectorFromDrag(gamePt);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    const gamePt = canvasToGame({ x: clickX, y: clickY });

    // Hover detection for launcher
    const dist = Math.sqrt((gamePt.x - level.launcher.x) ** 2 + (gamePt.y - level.launcher.y) ** 2);
    setIsHoveringLauncher(dist <= 110 && !isFlying);

    if (dragActive) {
      updateVectorFromDrag(gamePt);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (dragActive) {
      setDragActive(false);
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  };

  const updateVectorFromDrag = (gamePt: Vector2D) => {
    const lx = level.launcher.x;
    const ly = level.launcher.y;

    let dx = gamePt.x - lx;
    let dy = gamePt.y - ly;

    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 4) return;

    // Angle in degrees (-180 to 180, normalize to standard 0-360 mapped neatly or directly let react handle ranges)
    let newAngle = Math.atan2(dy, dx) * (180 / Math.PI);
    if (newAngle < 0) {
      newAngle += 360;
    }

    // Thrust mapped to length of vector (scale max vector to 120 pixels representing thrust 100)
    const newThrust = Math.min(100, Math.max(5, Math.round((dist / 120) * 100)));

    onLaunchChange(Math.round(newAngle), newThrust);
    sfx.playTick();
  };

  // Primary animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let frameCount = 0;

    // Simulation steps
    const updatePhysics = () => {
      const state = physicsStateRef.current;
      if (!state.isFlying || state.probeStatus !== 'flying') return;

      // Make physics run faster based on selected simulation speed (1x, 1.5x, 2x)
      // Done via executing sub-steps per animation frame
      const steps = Math.ceil(simulationSpeed);

      for (let s = 0; s < steps; s++) {
        // Add current point to trail
        state.probeTrail.push({ x: state.probeX, y: state.probeY });
        // Max trail preservation to avoid memory drag
        if (state.probeTrail.length > 1000) {
          state.probeTrail.shift();
        }

        // Apply velocities
        let ax = 0;
        let ay = 0;

        // Force sum
        for (const body of currentLevelBodies) {
          const dx = body.x - state.probeX;
          const dy = body.y - state.probeY;
          const distSq = dx * dx + dy * dy;
          const dist = Math.sqrt(distSq);

          if (dist > 2) {
            const pull = (G * body.mass) / (distSq * dist);
            ax += dx * pull;
            ay += dy * pull;

            // Trigger gravitational sound tick occasionally if entering massive wells
            if (dist < body.radius * 2.2 && Math.random() < 0.015) {
              sfx.playGravityContact();
            }
          }

          // Check landing / collision with celestial body
          if (dist < body.radius) {
            state.probeStatus = 'crashed';
            state.isFlying = false;
            onProbeStateChange('crashed');
            sfx.playCrash();
            break;
          }
        }

        // If crashed, stop executing physics steps
        if (state.probeStatus === 'crashed') break;

        // Check Asteroid hazards
        for (const ast of currentLevelAsteroids) {
          const dx = ast.x - state.probeX;
          const dy = ast.y - state.probeY;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < ast.radius + 6) {
            state.probeStatus = 'crashed';
            state.isFlying = false;
            onProbeStateChange('crashed');
            sfx.playCrash();
            break;
          }
        }

        if (state.probeStatus === 'crashed') break;

        // Check Target victory overlap
        const tx = level.target.x - state.probeX;
        const ty = level.target.y - state.probeY;
        const targetDist = Math.sqrt(tx * tx + ty * ty);

        if (targetDist < level.target.radius + 5) {
          state.probeStatus = 'success';
          state.isFlying = false;
          onProbeStateChange('success');
          sfx.playSuccess();
          break;
        }

        // Boundary escape trigger (Left room of the screen boundaries)
        if (state.probeX < -180 || state.probeX > 980 || state.probeY < -180 || state.probeY > 780) {
          state.probeStatus = 'escaped';
          state.isFlying = false;
          onProbeStateChange('escaped');
          break;
        }

        // Perform standard integration
        state.probeVx += ax;
        state.probeVy += ay;
        state.probeX += state.probeVx;
        state.probeY += state.probeVy;
        state.flightTime += 1;

        // Spawn rocket spark particles
        if (Math.random() < 0.35) {
          const sparkAngle = Math.atan2(state.probeVy, state.probeVx) + Math.PI + (Math.random() * 0.4 - 0.2);
          const speed = Math.sqrt(state.probeVx ** 2 + state.probeVy ** 2) * 0.4;
          particlesRef.current.push({
            x: state.probeX,
            y: state.probeY,
            vx: Math.cos(sparkAngle) * speed + (Math.random() * 0.4 - 0.2),
            vy: Math.sin(sparkAngle) * speed + (Math.random() * 0.4 - 0.2),
            color: '#06b6d4',
            size: Math.random() * 2 + 1.5,
            alpha: 1.0,
            life: Math.random() * 25 + 15
          });
        }
      }

      // Safe update react state periodically to update stats gracefully
      setProbe(prev => ({
        ...prev,
        x: state.probeX,
        y: state.probeY,
        vx: state.probeVx,
        vy: state.probeVy,
        trail: [...state.probeTrail],
        status: state.probeStatus,
        flightTime: state.flightTime
      }));
    };

    // Main animation frame handler
    const render = () => {
      frameCount++;
      ctx.clearRect(0, 0, dimensions.width, dimensions.height);

      // 1. Draw Space background starry ambiance
      ctx.fillStyle = '#020617';
      ctx.fillRect(0, 0, dimensions.width, dimensions.height);

      // Local references for speed values
      const bodiesRef = currentLevelBodies;

      // Rotate orbiting planets
      bodiesRef.forEach(body => {
        if (body.orbitCenter && body.orbitRadius && body.orbitSpeed !== undefined && body.currentAngle !== undefined) {
          body.currentAngle += body.orbitSpeed;
          body.x = body.orbitCenter.x + Math.cos(body.currentAngle) * body.orbitRadius;
          body.y = body.orbitCenter.y + Math.sin(body.currentAngle) * body.orbitRadius;
        }
      });

      // Move drifting asteroids in loop
      currentLevelAsteroids.forEach(ast => {
        ast.x += ast.vx;
        ast.y += ast.vy;

        // Screen wraps asteroids safely
        if (ast.x < 150) { ast.x = 650; }
        if (ast.x > 650) { ast.x = 150; }
        if (ast.y < 50) { ast.y = 550; }
        if (ast.y > 550) { ast.y = 50; }
      });

      // Update particle physics
      const particles = particlesRef.current;
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life--;
        p.alpha = Math.max(0, p.life / 30);
        if (p.life <= 0) {
          particles.splice(i, 1);
        }
      }

      // 2. Draw Warped Spacetime Grid Webbing
      if (showGridWarp) {
        ctx.strokeStyle = 'rgba(6, 182, 212, 0.08)';
        ctx.lineWidth = 1.0;

        const gridStep = 40;
        // Draw vertical columns
        for (let gx = 0; gx <= 800; gx += gridStep) {
          ctx.beginPath();
          let drawing = false;

          for (let gy = 0; gy <= 600; gy += 15) {
            const originalPt = { x: gx, y: gy };
            const warpedGlobalPt = getWarpedPoint(originalPt.x, originalPt.y, bodiesRef);
            const canvasPt = gameToCanvas(warpedGlobalPt);

            if (!drawing) {
              ctx.moveTo(canvasPt.x, canvasPt.y);
              drawing = true;
            } else {
              ctx.lineTo(canvasPt.x, canvasPt.y);
            }
          }
          ctx.stroke();
        }

        // Draw horizontal rows
        for (let gy = 0; gy <= 600; gy += gridStep) {
          ctx.beginPath();
          let drawing = false;

          for (let gx = 0; gx <= 800; gx += 15) {
            const originalPt = { x: gx, y: gy };
            const warpedGlobalPt = getWarpedPoint(originalPt.x, originalPt.y, bodiesRef);
            const canvasPt = gameToCanvas(warpedGlobalPt);

            if (!drawing) {
              ctx.moveTo(canvasPt.x, canvasPt.y);
              drawing = true;
            } else {
              ctx.lineTo(canvasPt.x, canvasPt.y);
            }
          }
          ctx.stroke();
        }
      }

      // 3. Draw Orbit Track Rings for moving planets
      bodiesRef.forEach(body => {
        if (body.orbitCenter && body.orbitRadius) {
          const centerCanvas = gameToCanvas(body.orbitCenter);
          ctx.beginPath();
          ctx.arc(centerCanvas.x, centerCanvas.y, body.orbitRadius * scaleX, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
          ctx.setLineDash([4, 6]);
          ctx.lineWidth = 1.2;
          ctx.stroke();
          ctx.setLineDash([]); // Reset
        }
      });

      // Update physics simulations
      updatePhysics();

      // 4. Draw Obstacles / Space Asteroids
      currentLevelAsteroids.forEach(ast => {
        const drawPt = gameToCanvas(ast);
        ctx.save();
        ctx.beginPath();
        ctx.arc(drawPt.x, drawPt.y, ast.radius * scaleX, 0, Math.PI * 2);
        
        ctx.fillStyle = '#64748b'; // Rock gray
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 2.0;
        ctx.fill();
        ctx.stroke();

        // Draw craters
        ctx.fillStyle = '#334155';
        ctx.beginPath();
        ctx.arc(drawPt.x - ast.radius * 0.3 * scaleX, drawPt.y - ast.radius * 0.2 * scaleY, ast.radius * 0.28 * scaleX, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.arc(drawPt.x + ast.radius * 0.4 * scaleX, drawPt.y + ast.radius * 0.3 * scaleY, ast.radius * 0.22 * scaleX, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      });

      // 5. Draw Target Green Telemetry beacon
      const tgtCanvas = gameToCanvas(level.target);
      const tgtRad = level.target.radius * scaleX;
      
      ctx.save();
      // Target glow ring aura
      const pulseScalar = 1 + Math.sin(frameCount * 0.05) * 0.08;
      ctx.beginPath();
      ctx.arc(tgtCanvas.x, tgtCanvas.y, tgtRad * pulseScalar, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(34, 197, 94, 0.12)';
      ctx.strokeStyle = 'rgba(34, 197, 94, 0.45)';
      ctx.lineWidth = 2.0;
      ctx.fill();
      ctx.stroke();

      // Inner Target core
      ctx.beginPath();
      ctx.arc(tgtCanvas.x, tgtCanvas.y, tgtRad * 0.4, 0, Math.PI * 2);
      ctx.fillStyle = '#22c55e'; // Green solid
      ctx.shadowColor = '#22c55e';
      ctx.shadowBlur = 12;
      ctx.fill();

      // Grid scanning radial ticks
      ctx.shadowBlur = 0;
      ctx.strokeStyle = 'rgba(34, 197, 94, 0.65)';
      ctx.lineWidth = 1.0;
      ctx.beginPath();
      ctx.moveTo(tgtCanvas.x - tgtRad, tgtCanvas.y);
      ctx.lineTo(tgtCanvas.x + tgtRad, tgtCanvas.y);
      ctx.moveTo(tgtCanvas.x, tgtCanvas.y - tgtRad);
      ctx.lineTo(tgtCanvas.x, tgtCanvas.y + tgtRad);
      ctx.stroke();

      // Text beacon label
      ctx.fillStyle = '#4ade80';
      ctx.font = '9px monospace';
      ctx.textAlign = 'center';
      ctx.fillText("BEACON", tgtCanvas.x, tgtCanvas.y - tgtRad - 6);
      ctx.restore();

      // 6. Draw Celestial Gravity Bodies (Suns, Planets, Black Holes)
      bodiesRef.forEach(body => {
        const bodyCanvas = gameToCanvas(body);
        const radiusCanvas = body.radius * scaleX;

        ctx.save();

        if (body.type === 'blackhole') {
          // Spinning purple accretion disk
          const rotationAngle = frameCount * 0.03;
          ctx.translate(bodyCanvas.x, bodyCanvas.y);
          ctx.rotate(rotationAngle);

          // Outer accretion aura
          const auraGrad = ctx.createRadialGradient(0, 0, radiusCanvas * 0.5, 0, 0, radiusCanvas * 3.2);
          auraGrad.addColorStop(0, 'rgba(189, 0, 255, 0.8)');
          auraGrad.addColorStop(0.3, 'rgba(147, 51, 234, 0.35)');
          auraGrad.addColorStop(0.6, 'rgba(147, 51, 234, 0.08)');
          auraGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

          ctx.fillStyle = auraGrad;
          ctx.beginPath();
          ctx.arc(0, 0, radiusCanvas * 3.2, 0, Math.PI * 2);
          ctx.fill();

          // Accretion spiral swirls
          ctx.strokeStyle = 'rgba(232, 121, 249, 0.5)';
          ctx.lineWidth = 2.0;
          ctx.beginPath();
          ctx.arc(0, 0, radiusCanvas * 1.5, 0, Math.PI * 0.8);
          ctx.stroke();

          ctx.beginPath();
          ctx.arc(0, 0, radiusCanvas * 2.1, Math.PI, Math.PI * 1.7);
          ctx.stroke();

          // Absolute Pitch Black singularity core
          ctx.beginPath();
          ctx.arc(0, 0, radiusCanvas, 0, Math.PI * 2);
          ctx.fillStyle = '#000000';
          ctx.fill();

          // Glow neon event horizon ring boundary
          ctx.strokeStyle = '#bd00ff';
          ctx.lineWidth = 2.5;
          ctx.stroke();

        } else if (body.type === 'sun') {
          // Solar blinding plasma crown
          const radialPls = 1 + Math.sin(frameCount * 0.08) * 0.04;
          const sunGrad = ctx.createRadialGradient(bodyCanvas.x, bodyCanvas.y, radiusCanvas * 0.2, bodyCanvas.x, bodyCanvas.y, radiusCanvas * 1.8 * radialPls);
          sunGrad.addColorStop(0, '#ffffff');
          sunGrad.addColorStop(0.35, '#fffbeb');
          sunGrad.addColorStop(0.6, '#f59e0b'); // Amber
          sunGrad.addColorStop(0.85, '#ef4444'); // Crimson corona
          sunGrad.addColorStop(1, 'rgba(239, 68, 68, 0)');

          ctx.fillStyle = sunGrad;
          ctx.beginPath();
          ctx.arc(bodyCanvas.x, bodyCanvas.y, radiusCanvas * 1.8 * radialPls, 0, Math.PI * 2);
          ctx.fill();

          // Solid white solar surface core
          ctx.beginPath();
          ctx.arc(bodyCanvas.x, bodyCanvas.y, radiusCanvas, 0, Math.PI * 2);
          ctx.fillStyle = '#ffffff';
          ctx.shadowColor = '#f59e0b';
          ctx.shadowBlur = 18;
          ctx.fill();

        } else {
          // Standard Gaea / Mineral Planet
          // Multi-layer shading gradient for 3D sphere feel
          const pGrad = ctx.createRadialGradient(
            bodyCanvas.x - radiusCanvas * 0.3, 
            bodyCanvas.y - radiusCanvas * 0.3, 
            radiusCanvas * 0.1, 
            bodyCanvas.x, 
            bodyCanvas.y, 
            radiusCanvas
          );
          pGrad.addColorStop(0, '#ffffff');
          pGrad.addColorStop(0.3, body.color || '#00ffcc');
          pGrad.addColorStop(0.9, '#090d16');
          pGrad.addColorStop(1, '#020617');

          // Atmosphere gas glow aura ring
          ctx.beginPath();
          ctx.arc(bodyCanvas.x, bodyCanvas.y, radiusCanvas * 1.25, 0, Math.PI * 2);
          const memoBgColor = body.color || '#00ffcc';
          ctx.fillStyle = `rgba(${memoBgColor.includes('rgb') ? '0,246,255' : '6,182,212'}, 0.07)`;
          ctx.fill();

          // Planet main body
          ctx.beginPath();
          ctx.arc(bodyCanvas.x, bodyCanvas.y, radiusCanvas, 0, Math.PI * 2);
          ctx.fillStyle = pGrad;
          ctx.fill();

          // Draw planet rings if it is Gaea Prime (Level 1) or Aegis
          if (body.name === "Gaea Prime" || body.name === "Outer Aegis") {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
            ctx.lineWidth = 4.0;
            ctx.save();
            ctx.translate(bodyCanvas.x, bodyCanvas.y);
            ctx.scale(2.2, 0.45); // Rotate and flatten ellipse for 3D rings
            ctx.rotate(-Math.PI / 10);
            ctx.beginPath();
            ctx.arc(0, 0, radiusCanvas * 0.72, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
          }

          // Delicate aesthetic surface detail lines
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)";';
          ctx.lineWidth = 1.0;
          ctx.beginPath();
          ctx.arc(bodyCanvas.x, bodyCanvas.y, radiusCanvas, Math.PI * 0.2, Math.PI * 0.8);
          ctx.stroke();
        }

        ctx.restore();

        // Technical HUD Label overlay next to body
        ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
        ctx.font = '8px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(body.name.toUpperCase(), bodyCanvas.x, bodyCanvas.y + radiusCanvas + 12);
        ctx.fillStyle = 'rgba(6, 182, 212, 0.7)';
        ctx.fillText(`M: ${body.mass / 1000}T`, bodyCanvas.x, bodyCanvas.y + radiusCanvas + 20);
      });

      // 7. Draw Trajectory prediction dotted design (Preview Phase only)
      if (!isFlying && showPrediction && predictedPoints.length > 1) {
        ctx.save();
        ctx.strokeStyle = 'rgba(6, 182, 212, 0.35)';
        ctx.lineWidth = 1.8;
        ctx.setLineDash([4, 6]);
        ctx.beginPath();

        const canvasStart = gameToCanvas(predictedPoints[0]);
        ctx.moveTo(canvasStart.x, canvasStart.y);

        for (let i = 1; i < predictedPoints.length; i++) {
          const pt = gameToCanvas(predictedPoints[i]);
          ctx.lineTo(pt.x, pt.y);
        }
        ctx.stroke();
        ctx.restore();
      }

      // 8. Draw launch starting point / Gantry
      const launcherCanvasPoint = gameToCanvas(level.launcher);
      ctx.save();
      ctx.translate(launcherCanvasPoint.x, launcherCanvasPoint.y);

      // Launcher base structural HUD circle
      ctx.beginPath();
      ctx.arc(0, 0, 16 * scaleX, 0, Math.PI * 2);
      ctx.fillStyle = '#0f172a';
      ctx.strokeStyle = 'rgba(6,182,212,0.5)';
      ctx.lineWidth = 2.0;
      ctx.fill();
      ctx.stroke();

      // Launch Gantry Core pointing to target launch angle
      const visualAngle = (angle * Math.PI) / 180;
      ctx.rotate(visualAngle);

      ctx.beginPath();
      ctx.rect(0, -4 * scaleY, 26 * scaleX, 8 * scaleY);
      ctx.fillStyle = '#06b6d4';
      ctx.fill();

      // Draw vector laser nozzle guide line (scaled based on thrust)
      const maxMultiplier = 1.25; // scaling launch visual draft size
      const guideLength = thrust * maxMultiplier * scaleX;
      
      ctx.beginPath();
      ctx.moveTo(26 * scaleX, 0);
      ctx.lineTo(guideLength, 0);
      ctx.strokeStyle = dragActive ? '#f43f5e' : '#06b6d4'; // Red if adjusting, Cyan normally
      ctx.lineWidth = 2.0;
      ctx.setLineDash([2, 4]);
      ctx.stroke();

      // Laser arrow nozzle tip at the end of vectors
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(guideLength, -5 * scaleY);
      ctx.lineTo(guideLength + 10 * scaleX, 0);
      ctx.lineTo(guideLength, 5 * scaleY);
      ctx.fillStyle = dragActive ? '#f43f5e' : '#06b6d4';
      ctx.fill();

      ctx.restore();

      // Ring indicating direct click pointer detection radius
      if (isHoveringLauncher && !isFlying) {
        ctx.beginPath();
        ctx.arc(launcherCanvasPoint.x, launcherCanvasPoint.y, 110 * scaleX, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(6, 182, 212, 0.16)';
        ctx.stroke();
      }

      // 9. Draw the Flying Space Probe!
      const physicsState = physicsStateRef.current;
      if (physicsState.isFlying || physicsState.probeStatus !== 'ready') {
        const probeCanvasPt = gameToCanvas({ x: physicsState.probeX, y: physicsState.probeY });

        // A. Draw Neon Trail gradient sweep
        if (physicsState.probeTrail.length > 1) {
          ctx.save();
          ctx.lineWidth = 2.5;
          ctx.shadowBlur = 8;
          ctx.shadowColor = '#06b6d4';

          for (let i = 1; i < physicsState.probeTrail.length; i++) {
            const startPt = gameToCanvas(physicsState.probeTrail[i - 1]);
            const endPt = gameToCanvas(physicsState.probeTrail[i]);
            // Alpha fade as trail moves back in history
            const trailAlpha = i / physicsState.probeTrail.length;
            ctx.strokeStyle = `rgba(6, 182, 212, ${trailAlpha * 0.75})`;
            ctx.beginPath();
            ctx.moveTo(startPt.x, startPt.y);
            ctx.lineTo(endPt.x, endPt.y);
            ctx.stroke();
          }
          ctx.restore();
        }

        // B. Draw Spark Particles combustion emissions
        particles.forEach(p => {
          const pt = gameToCanvas(p);
          ctx.fillStyle = p.color;
          ctx.globalAlpha = p.alpha;
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, p.size * scaleX, 0, Math.PI * 2);
          ctx.fill();
        });
        ctx.globalAlpha = 1.0; // Reset

        // C. Draw actual Core Probe capsule (Cyan probe triangle)
        ctx.save();
        ctx.translate(probeCanvasPt.x, probeCanvasPt.y);

        // Face the velocity vector orientation
        const probeAngle = Math.atan2(physicsState.probeVy, physicsState.probeVx);
        ctx.rotate(probeAngle);

        ctx.beginPath();
        ctx.moveTo(10 * scaleX, 0);
        ctx.lineTo(-6 * scaleX, -5 * scaleY);
        ctx.lineTo(-6 * scaleX, 5 * scaleY);
        ctx.closePath();
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#06b6d4';
        ctx.lineWidth = 1.5;
        ctx.shadowColor = '#06b6d4';
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.stroke();

        ctx.restore();
      }

      // 10. Frame Counter stats for debugging or visual interest
      ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.font = '7px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`GRID WARPING: READY  |  STEPS PER SEC: ${60 * simulationSpeed}  |  STATUS: ${isFlying ? "ENGAGED" : "DRAFTING"}`, 15, dimensions.height - 15);

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [dimensions, currentLevelBodies, currentLevelAsteroids, isFlying, angle, thrust, showGridWarp, showPrediction, simulationSpeed, level]);

  return (
    <div ref={containerRef} className="w-full relative select-none">
      <div className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur-md border border-cyan-500/20 rounded px-2.5 py-1 text-[11px] font-mono text-cyan-400 z-10 flex items-center gap-1.5 shadow-lg">
        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
        {isFlying ? 'TELEMETRY LIVE' : 'AIMS VECTOR INPUT MODE'}
      </div>

      <canvas
        id="game-viewport-canvas"
        ref={canvasRef}
        width={dimensions.width}
        height={dimensions.height}
        style={{ touchAction: 'none' }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className="w-full rounded-2xl block bg-slate-950 border border-slate-800 shadow-[inset_0_4px_30px_rgba(0,0,0,0.8)] cursor-crosshair transition-all duration-300"
      />
    </div>
  );
}
