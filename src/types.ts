export interface Vector2D {
  x: number;
  y: number;
}

export type CelestialBodyType = 'planet' | 'blackhole' | 'sun';

export interface CelestialBody {
  id: string;
  type: CelestialBodyType;
  x: number; // Current X (may update if moving)
  y: number; // Current Y (may update if moving)
  radius: number;
  mass: number;
  name: string;
  color?: string; // Hex code or gradient settings
  
  // Optional parameters for moving celestial bodies
  orbitCenter?: Vector2D;
  orbitRadius?: number;
  orbitSpeed?: number; // radians per frame or second
  currentAngle?: number; // current angle in its orbit
}

export interface Asteroid {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
}

export type SpaceProbeStatus = 'ready' | 'flying' | 'crashed' | 'escaped' | 'success';

export interface SpaceProbe {
  x: number;
  y: number;
  vx: number;
  vy: number;
  trail: Vector2D[];
  status: SpaceProbeStatus;
  flightTime: number;
  lastCrashPoint?: Vector2D;
}

export interface GameLevel {
  id: number;
  name: string;
  description: string;
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Expert';
  
  // Starting parameters
  launcher: {
    x: number;
    y: number;
    defaultAngle: number; // in degrees
    defaultThrust: number; // 0 to 100
  };
  
  // Target parameter
  target: {
    x: number;
    y: number;
    radius: number;
  };
  
  // Gravitational bodies
  bodies: CelestialBody[];
  
  // Static obstacles / Hazard belts
  asteroids: Asteroid[];
  
  // Scoring thresholds
  parThrust: number; // thrust lower than this receives bonus stars
}

export interface PlayerProgress {
  unlockedLevels: number[];
  highScores: { [levelId: number]: number };
  levelStars: { [levelId: number]: number }; // 0 to 3
}
