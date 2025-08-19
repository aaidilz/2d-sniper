"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import {
  RECOIL_POWER, RECOIL_SIDE, RECOIL_UP_VARIANCE,
  SHAKE_X, SHAKE_Y, SHAKE_SPEED,
  SCREEN_SHAKE_POWER, SCREEN_SHAKE_DECAY,
  SCREEN_SHAKE_POWER_RELOAD, SCREEN_SHAKE_DECAY_RELOAD,
  RELOAD_ROTATE, RELOAD_ZOOM
} from "./config";
import { PARALLAX_LAYERS } from "./parallaxLayers";
import { DustParticle, DustWindConfig, initDustParticles, updateAndDrawDust } from "./dustWind";

export default function ScopeCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scopeImgRef = useRef<HTMLImageElement | null>(null);
  // Parallax layer refs
  const parallaxImgsRef = useRef<HTMLImageElement[]>([]);
  // Dust wind particle refs
  const dustParticlesRef = useRef<DustParticle[]>([]);

  // Scope position state
  const scopePos = useRef({ x: 400, y: 300 });
  const recoilOrigin = useRef({ x: 400, y: 300 });
  const mouseTarget = useRef({ x: 400, y: 300 });

  // State: "idle" | "firing" | "reloading"
  type State = "idle" | "firing" | "reloading";
  const state = useRef<State>("idle");
  const reloadRotateDir = useRef(1);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;


    // Load parallax background layers
    parallaxImgsRef.current = PARALLAX_LAYERS.map((layer) => {
      const img = new window.Image();
      img.src = layer.src;
      return img;
    });

    // Load scope image
    const scopeImg = new window.Image();
    scopeImg.src = "/scope.png";
    scopeImgRef.current = scopeImg;

    // Breathing shake state
    let breathing = true;
    let breathTime = 0;

    // Screen shake state
    let shakePower = 0;

    // Dust wind config
    const dustCfg: DustWindConfig = {
      count: 40,
      color: 'rgba(255,255,255,0.18)',
      size: [1, 2.5],
      windSpeed: 0.7,
      windDir: 1,
      width: 800,
      height: 600,
    };
    if (dustParticlesRef.current.length === 0) {
      dustParticlesRef.current = initDustParticles(dustCfg);
    }

    // Bolt-action config
    const RELOAD_TIME = 0.5; // detik
    const RELOAD_DROP = 40; // seberapa jauh scope turun saat reload

    // Fungsi gambar parallax
    function drawParallax(ctx: CanvasRenderingContext2D, dx: number, dy: number, canvas: HTMLCanvasElement) {
      const scale = 1.2;
      const scaledW = canvas.width * scale;
      const scaledH = canvas.height * scale;
      for (let i = 0; i < PARALLAX_LAYERS.length; i++) {
        const img = parallaxImgsRef.current[i];
        const { speed } = PARALLAX_LAYERS[i];
        if (img && img.complete) {
          const offsetX = -dx * speed - (scaledW - canvas.width) / 2;
          const offsetY = -dy * speed - (scaledH - canvas.height) / 2;
          ctx.drawImage(img, offsetX, offsetY, scaledW, scaledH);
        }
      }
    }


    // Draw function modular
    const draw = () => {
      if (!canvas || !ctx) return;
      // Screen shake offset
      let shakeOffsetX = 0, shakeOffsetY = 0;
      if (shakePower > 0) {
        shakeOffsetX = (Math.random() - 0.5) * shakePower;
        shakeOffsetY = (Math.random() - 0.5) * shakePower;
      }
      ctx.save();
      ctx.translate(shakeOffsetX, shakeOffsetY);

      // Parallax effect
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const dx = scopePos.current.x - centerX;
      const dy = scopePos.current.y - centerY;
      drawParallax(ctx, dx, dy, canvas);

      // Dust wind effect
      updateAndDrawDust(ctx, dustParticlesRef.current, dustCfg);

      // If no layer loaded, fallback fill
      if (!parallaxImgsRef.current[0] || !parallaxImgsRef.current[0].complete) {
        ctx.fillStyle = "#fff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      // Draw scope
      if (scopeImg.complete) {
        const w = scopeImg.width;
        const h = scopeImg.height;
        let offsetX = 0, offsetY = 0, rotate = 0, zoom = 1;
        if (breathing && state.current === "idle") {
          offsetX = Math.sin(breathTime) * SHAKE_X;
          offsetY = Math.cos(breathTime * 0.7) * SHAKE_Y;
        }
        // Efek shake, rotasi, dan zoom khusus saat reload
        if (state.current === "reloading") {
          offsetY += RELOAD_DROP * Math.sin(Math.PI * reloadAnimProgress.current);
          rotate = reloadRotateDir.current * Math.sin(Math.PI * reloadAnimProgress.current) * RELOAD_ROTATE * (Math.PI / 180);
          zoom = 1 + Math.sin(Math.PI * reloadAnimProgress.current) * (RELOAD_ZOOM - 1);
        }
        ctx.save();
        ctx.translate(scopePos.current.x, scopePos.current.y);
        ctx.rotate(rotate);
        ctx.scale(zoom, zoom);
        ctx.drawImage(
          scopeImg,
          offsetX - w / 2,
          offsetY - h / 2
        );
        ctx.restore();
      }
      ctx.restore();
    };

    // Untuk animasi reload
    const reloadAnimProgress = { current: 0 };

    // Mouse move handler
    const handleMouseMove = (e: MouseEvent) => {
      if (state.current === "reloading") return; // Tidak bisa digerakkan saat reload
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      mouseTarget.current.x = x;
      mouseTarget.current.y = y;
      if (state.current === "idle") {
        recoilOrigin.current.x = x;
        recoilOrigin.current.y = y;
      }
    };

    // Recoil handler with sound, lalu reload/cocking setelah idle
    const handleMouseDown = () => {
      if (state.current !== "idle") return;
      // Play sniper shot sound
      const audio = new window.Audio("/sfx/sniper-shot.mp3");
      audio.currentTime = 0;
      audio.play();
      state.current = "firing";
      // Start screen shake
      shakePower = SCREEN_SHAKE_POWER;
      // Simulate recoil: up and random left/right
      const recoilY = recoilOrigin.current.y - RECOIL_POWER - Math.random() * RECOIL_UP_VARIANCE;
      const recoilX = recoilOrigin.current.x + (Math.random() - 0.5) * RECOIL_SIDE;
      gsap.to(scopePos.current, {
        x: recoilX,
        y: recoilY,
        duration: 0.09,
        onUpdate: draw,
        onComplete: () => {
          // Setelah recoil, kembali ke idle (scope bisa digerakkan)
          state.current = "idle";
          recoilOrigin.current.x = mouseTarget.current.x;
          recoilOrigin.current.y = mouseTarget.current.y;
          // Setelah idle, trigger reload/cocking
          setTimeout(() => {
            state.current = "reloading";
            reloadAnimProgress.current = 0;
            // Random arah rotasi: -1 (kiri) atau 1 (kanan)
            reloadRotateDir.current = Math.random() < 0.5 ? -1 : 1;
            // Screen shake khusus reload
            shakePower = SCREEN_SHAKE_POWER_RELOAD;
            // Play reload sound
            const reloadAudio = new window.Audio("/sfx/reload.mp3");
            reloadAudio.currentTime = 0;
            reloadAudio.play();
            // Animasi turun-naik scope
            gsap.to(reloadAnimProgress, {
              current: 1,
              duration: RELOAD_TIME,
              ease: "power1.inOut",
              onUpdate: draw,
              onComplete: () => {
                state.current = "idle";
                reloadAnimProgress.current = 0;
                shakePower = 0;
                recoilOrigin.current.x = mouseTarget.current.x;
                recoilOrigin.current.y = mouseTarget.current.y;
              },
            });
          }, 1000); // delay singkat agar transisi terasa natural
        },
      });
    };

    //
    let tickerId: number | null = null;
    const animateBreath = () => {
      breathTime += SHAKE_SPEED;
      // Animate screen shake decay
      if (shakePower > 0) {
        if (state.current === "reloading") {
          shakePower *= SCREEN_SHAKE_DECAY_RELOAD;
        } else {
          shakePower *= SCREEN_SHAKE_DECAY;
        }
        if (shakePower < 0.5) shakePower = 0;
      }
      // Smooth follow to mouseTarget if not animating
      if (state.current === "idle") {
        // Lerp to mouseTarget
        scopePos.current.x += (mouseTarget.current.x - scopePos.current.x) * 0.18;
        scopePos.current.y += (mouseTarget.current.y - scopePos.current.y) * 0.18;
      }
      draw();
      tickerId = requestAnimationFrame(animateBreath);
    };


    // Wait for all parallax layers and scope image to load before enabling events
    let loaded = 0;
    const totalToLoad = PARALLAX_LAYERS.length + 1;
    const tryEnable = () => {
      loaded++;
      if (loaded === totalToLoad) {
        draw();
        canvas.addEventListener("mousemove", handleMouseMove);
        canvas.addEventListener("mousedown", handleMouseDown);
        breathing = true;
        animateBreath();
      }
    };
    parallaxImgsRef.current.forEach((img) => {
      img.onload = tryEnable;
      if (img.complete) tryEnable();
    });
    scopeImg.onload = tryEnable;
    if (scopeImg.complete) tryEnable();

    return () => {
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mousedown", handleMouseDown);
      breathing = false;
      if (tickerId) cancelAnimationFrame(tickerId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      id="canvas"
      width="800"
      height="600"
      className="block border-2 border-white"
      style={{ background: "#fff", cursor: "none" }}
    >
      Your browser does not support the HTML5 canvas tag.
    </canvas>
  );
}
