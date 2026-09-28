declare module "canvas-confetti" {
  interface ConfettiOptions { particleCount?: number; angle?: number; spread?: number; startVelocity?: number; gravity?: number; scalar?: number; colors?: string[]; origin?: { x: number; y: number }; }
  export default function confetti(options: ConfettiOptions): void;
}
