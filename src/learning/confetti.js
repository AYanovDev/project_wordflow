import confetti from "canvas-confetti";

export function celebrate() {
  const colors = [
    "#ff595e",
    "#ffca3a",
    "#8ac926",
    "#1982c4",
    "#6a4c93",
    "#ff70a6",
  ];

  // Left side — shoots up and toward the center
  confetti({
    particleCount: 100,
    angle: 60,
    spread: 70,
    startVelocity: 45,
    gravity: 1,
    scalar: 1.1,
    colors,
    origin: {
      x: 0,
      y: 0.7,
    },
  });

  // Right side — shoots up and toward the center
  confetti({
    particleCount: 100,
    angle: 120,
    spread: 70,
    startVelocity: 45,
    gravity: 1,
    scalar: 1.1,
    colors,
    origin: {
      x: 1,
      y: 0.7,
    },
  });

  // Top left
  confetti({
    particleCount: 70,
    angle: 60,
    spread: 80,
    startVelocity: 35,
    gravity: 1.2,
    scalar: 1.1,
    colors,
    origin: {
      x: 0.15,
      y: 0,
    },
  });

  // Top right
  confetti({
    particleCount: 70,
    angle: 120,
    spread: 80,
    startVelocity: 35,
    gravity: 1.2,
    scalar: 1.1,
    colors,
    origin: {
      x: 0.85,
      y: 0,
    },
  });
}
