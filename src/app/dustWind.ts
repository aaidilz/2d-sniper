// dustWind.ts

export type DustParticle = {
  x: number;
  y: number;
  r: number;
  v: number;
  vy: number;
  alpha: number;
};

export interface DustWindConfig {
  count: number;
  color: string;
  size: [number, number];
  windSpeed: number;
  windDir: number;
  width: number;
  height: number;
}

export function initDustParticles(cfg: DustWindConfig): DustParticle[] {
  return Array.from({ length: cfg.count }, () => ({
    x: Math.random() * cfg.width,
    y: Math.random() * cfg.height,
    r: Math.random() * (cfg.size[1] - cfg.size[0]) + cfg.size[0],
    v: cfg.windSpeed * (0.7 + Math.random() * 0.6) * (Math.random() > 0.2 ? cfg.windDir : -cfg.windDir),
    vy: (Math.random() - 0.5) * 0.2,
    alpha: 0.12 + Math.random() * 0.18,
  }));
}

export function updateAndDrawDust(ctx: CanvasRenderingContext2D, dustParticles: DustParticle[], cfg: DustWindConfig) {
  for (let i = 0; i < dustParticles.length; i++) {
    const p = dustParticles[i];
    ctx.save();
    ctx.globalAlpha = p.alpha;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fillStyle = cfg.color;
    ctx.shadowColor = cfg.color;
    ctx.shadowBlur = 6;
    ctx.fill();
    ctx.restore();
    // Update posisi partikel
    p.x += p.v;
    p.y += p.vy;
    if (p.x < -10) p.x = cfg.width + 10;
    if (p.x > cfg.width + 10) p.x = -10;
    if (p.y < -10) p.y = cfg.height + 10;
    if (p.y > cfg.height + 10) p.y = -10;
  }
}
