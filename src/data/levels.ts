import { GameLevel } from '../types';

export const LEVELS: GameLevel[] = [
  {
    id: 1,
    name: "Orbital Insertion",
    description: "Learn the fundamentals of cosmic steering. A massive Gas Giant sits directly between your space station and the destination beacon. Direct travel is impossible; you must curve your trajectory around the planet's gravity well.",
    difficulty: "Easy",
    launcher: {
      x: 120,
      y: 300,
      defaultAngle: 15,
      defaultThrust: 35
    },
    target: {
      x: 700,
      y: 300,
      radius: 24
    },
    bodies: [
      {
        id: "p1",
        type: "planet",
        name: "Gaea Prime",
        x: 400,
        y: 300,
        radius: 65,
        mass: 32000,
        color: "#1fb6ff" // Glowing Cyano-Blue
      }
    ],
    asteroids: [],
    parThrust: 40
  },
  {
    id: 2,
    name: "Binary Alley",
    description: "Navigate a narrow gravitational channel created by the tug of two contrasting celestial worlds. Hook around the crimson dwarf star and sling over the turquoise mineral planet.",
    difficulty: "Easy",
    launcher: {
      x: 100,
      y: 200,
      defaultAngle: 10,
      defaultThrust: 38
    },
    target: {
      x: 720,
      y: 400,
      radius: 24
    },
    bodies: [
      {
        id: "p2_1",
        type: "planet",
        name: "Crimson Forge",
        x: 320,
        y: 150,
        radius: 45,
        mass: 18000,
        color: "#ff3e44" // Deep Red
      },
      {
        id: "p2_2",
        type: "planet",
        name: "Aero Prime",
        x: 520,
        y: 450,
        radius: 40,
        mass: 16000,
        color: "#00f6ff" // Vapor Cyan
      }
    ],
    asteroids: [],
    parThrust: 42
  },
  {
    id: 3,
    name: "Event Horizon",
    description: "Your route contains a micro-black hole. Singularity points are extremely dense and display absolute, lethal gravity. Steer clear of its immediate core boundary, but use its sheer pull for a high-speed orbital pivot.",
    difficulty: "Medium",
    launcher: {
      x: 100,
      y: 450,
      defaultAngle: -45,
      defaultThrust: 45
    },
    target: {
      x: 700,
      y: 150,
      radius: 22
    },
    bodies: [
      {
        id: "bh1",
        type: "blackhole",
        name: "Cygnus-X1 Singularity",
        x: 400,
        y: 300,
        radius: 18,
        mass: 65000, // Immeasurably massive gravity
        color: "#bd00ff" // Purple Aura Void
      },
      {
        id: "p3_1",
        type: "planet",
        name: "Solis Shield",
        x: 250,
        y: 200,
        radius: 35,
        mass: 10000,
        color: "#ffd200" // Glowing yellow
      }
    ],
    asteroids: [],
    parThrust: 48
  },
  {
    id: 4,
    name: "Asteroid Drift Reef",
    description: "A dense cluster of volatile, rich space debris is blocking deep space travel. Plot an elegant overhead slingshot around a dense binary sun system to drift pristine past the orbital mines.",
    difficulty: "Medium",
    launcher: {
      x: 100,
      y: 120,
      defaultAngle: 30,
      defaultThrust: 45
    },
    target: {
      x: 720,
      y: 480,
      radius: 22
    },
    bodies: [
      {
        id: "p4_1",
        type: "planet",
        name: "Helios Binary",
        x: 400,
        y: 220,
        radius: 50,
        mass: 25000,
        color: "#ff6c00" // Plasma Orange
      }
    ],
    asteroids: [
      // Asteroids creating an interactive minefield
      { id: "a1", x: 380, y: 400, vx: 0.1, vy: -0.2, radius: 10 },
      { id: "a2", x: 420, y: 420, vx: -0.15, vy: 0.1, radius: 12 },
      { id: "a3", x: 460, y: 380, vx: 0.2, vy: -0.1, radius: 11 },
      { id: "a4", x: 340, y: 440, vx: -0.05, vy: -0.15, radius: 14 },
      { id: "a5", x: 500, y: 430, vx: 0.12, vy: 0.18, radius: 9 }
    ],
    parThrust: 52
  },
  {
    id: 5,
    name: "Kepler's Mechanical Dance",
    description: "Spacetime isn't static! Helios Star has a core-bound planet orbiting it rapidly. Wait for the orbital window, calculate the transit time, and slingshot off the moving planet to reach the outer terminal.",
    difficulty: "Hard",
    launcher: {
      x: 100,
      y: 500,
      defaultAngle: -50,
      defaultThrust: 40
    },
    target: {
      x: 700,
      y: 480,
      radius: 20
    },
    bodies: [
      {
        id: "sun1",
        type: "sun",
        name: "Sol Core",
        x: 400,
        y: 280,
        radius: 55,
        mass: 35000,
        color: "#ffffff" // Intense White light
      },
      {
        id: "orbit1",
        type: "planet",
        name: "Chronos",
        x: 400,
        y: 110,
        radius: 25,
        mass: 14000,
        color: "#00ff66", // Jade Bio-world
        orbitCenter: { x: 400, y: 280 },
        orbitRadius: 170,
        orbitSpeed: 0.012, // radians per frame (medium speed)
        currentAngle: 1.5 // Initial angle in radians (90 deg)
      }
    ],
    asteroids: [],
    parThrust: 45
  },
  {
    id: 6,
    name: "Tug-of-War S-Gates",
    description: "Two dense solar objects pull spacetime in opposing directions. Thread the needle exactly between the double stars to execute a perfect figure-8 flight path and land cleanly in the research hub.",
    difficulty: "Hard",
    launcher: {
      x: 100,
      y: 150,
      defaultAngle: 25,
      defaultThrust: 55
    },
    target: {
      x: 700,
      y: 450,
      radius: 20
    },
    bodies: [
      {
        id: "p6_1",
        type: "sun",
        name: "Alpha Star",
        x: 320,
        y: 350,
        radius: 45,
        mass: 26000,
        color: "#ffc11a"
      },
      {
        id: "p6_2",
        type: "sun",
        name: "Beta Star",
        x: 520,
        y: 250,
        radius: 45,
        mass: 28000,
        color: "#ff33a1"
      }
    ],
    asteroids: [],
    parThrust: 58
  },
  {
    id: 7,
    name: "Singularity Maze",
    description: "A decaying pocket of space containing dual miniature singularities and rogue, gravity-heavy metal moons. Zero collision tolerance. Every angle adjustment determines life or instant thermal disintegration.",
    difficulty: "Expert",
    launcher: {
      x: 80,
      y: 300,
      defaultAngle: 0,
      defaultThrust: 42
    },
    target: {
      x: 750,
      y: 300,
      radius: 18
    },
    bodies: [
      {
        id: "p7_bh1",
        type: "blackhole",
        name: "Minor Horizon A",
        x: 340,
        y: 180,
        radius: 14,
        mass: 38000,
        color: "#bd00ff"
      },
      {
        id: "p7_bh2",
        type: "blackhole",
        name: "Minor Horizon B",
        x: 440,
        y: 420,
        radius: 14,
        mass: 38000,
        color: "#9d00ff"
      },
      {
        id: "p7_m1",
        type: "planet",
        name: "Titan Shell",
        x: 230,
        y: 380,
        radius: 30,
        mass: 10000,
        color: "#4671cf"
      },
      {
        id: "p7_m2",
        type: "planet",
        name: "Zephyr Forge",
        x: 580,
        y: 200,
        radius: 35,
        mass: 14000,
        color: "#03dac6"
      }
    ],
    asteroids: [
      { id: "a7_1", x: 340, y: 300, vx: 0.1, vy: -0.2, radius: 9 },
      { id: "a7_2", x: 440, y: 300, vx: -0.1, vy: 0.2, radius: 9 }
    ],
    parThrust: 46
  },
  {
    id: 8,
    name: "Grand Slingshot Championship",
    description: "The ultimate astronautics examination. Execute three individual gravitational assists: loop around a central mega-star, sync off an inner hot-world orbit, and time an outer frost-world capture to brake onto the finish platform.",
    difficulty: "Expert",
    launcher: {
      x: 80,
      y: 100,
      defaultAngle: 38,
      defaultThrust: 43
    },
    target: {
      x: 740,
      y: 480,
      radius: 18
    },
    bodies: [
      {
        id: "p8_star",
        type: "sun",
        name: "Vega Stellar Core",
        x: 400,
        y: 300,
        radius: 60,
        mass: 36000,
        color: "#ffffff"
      },
      {
        id: "p8_orb1",
        type: "planet",
        name: "Inner Vulcan",
        x: 400,
        y: 200,
        radius: 20,
        mass: 10000,
        color: "#ff007f",
        orbitCenter: { x: 400, y: 300 },
        orbitRadius: 130,
        orbitSpeed: -0.012, // Counter-clockwise, fast
        currentAngle: 1.0
      },
      {
        id: "p8_orb2",
        type: "planet",
        name: "Outer Aegis",
        x: 400,
        y: 450,
        radius: 26,
        mass: 13000,
        color: "#00e5ff",
        orbitCenter: { x: 400, y: 300 },
        orbitRadius: 210,
        orbitSpeed: 0.007, // Clockwise, slow
        currentAngle: -0.5
      }
    ],
    asteroids: [
      { id: "a8_1", x: 200, y: 250, vx: 0, vy: -0.15, radius: 10 },
      { id: "a8_2", x: 600, y: 350, vx: 0, vy: 0.15, radius: 11 },
      { id: "a8_3", x: 300, y: 450, vx: 0.1, vy: 0, radius: 8 }
    ],
    parThrust: 45
  }
];
