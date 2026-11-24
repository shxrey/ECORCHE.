/**
 * A burst of confetti over the page (about 3.5 s), on its own canvas that
 * removes itself. For a completed week (and, from Phase 3b, a PR).
 */
const COLORS = ['#369973', '#E8B23D', '#E45228', '#5389B4', '#A574E8'];

export function fireConfetti(): void {
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:fixed;inset:0;z-index:500;pointer-events:none;width:100vw;height:100vh;';
  // At most 2× pixel density: on 3× phones that's 4/9 of the drawing work, with no visible loss.
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const width = window.innerWidth;
  const height = window.innerHeight;
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    canvas.remove();
    return;
  }
  ctx.scale(dpr, dpr);
  const pieces = Array.from({ length: 120 }, () => ({
    x: Math.random() * width,
    y: -20 - Math.random() * height * 0.3,
    w: 6 + Math.random() * 5,
    h: 8 + Math.random() * 6,
    speed: 2 + Math.random() * 3,
    drift: (Math.random() - 0.5) * 2,
    rot: Math.random() * Math.PI,
    rotSpeed: (Math.random() - 0.5) * 0.2,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
  }));
  let frame = 0;
  const draw = () => {
    ctx.clearRect(0, 0, width, height);
    for (const p of pieces) {
      p.y += p.speed;
      p.x += p.drift;
      p.rot += p.rotSpeed;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    }
    frame++;
    if (frame < 220) requestAnimationFrame(draw);
    else canvas.remove();
  };
  draw();
}
