import confetti from "canvas-confetti";

export function celebrate() {
  const colors = ["#ff595e", "#ffca3a", "#8ac926", "#1982c4", "#6a4c93", "#ff70a6"];
  [{ x: 0, y: 0.7, angle: 60, count: 100, velocity: 45, spread: 70 }, { x: 1, y: 0.7, angle: 120, count: 100, velocity: 45, spread: 70 }, { x: 0.15, y: 0, angle: 60, count: 70, velocity: 35, spread: 80 }, { x: 0.85, y: 0, angle: 120, count: 70, velocity: 35, spread: 80 }].forEach(({ x, y, angle, count, velocity, spread }) => confetti({ particleCount: count, angle, spread, startVelocity: velocity, gravity: y === 0 ? 1.2 : 1, scalar: 1.1, colors, origin: { x, y } }));
}
