"use client";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { RECOIL_POWER, RECOIL_SIDE, RECOIL_UP_VARIANCE, SHAKE_X, SHAKE_Y, SHAKE_SPEED } from "./config";

export default function ScopeCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scopeImgRef = useRef<HTMLImageElement | null>(null);
  const bgImgRef = useRef<HTMLImageElement | null>(null);

  // Scope position state
  const scopePos = useRef({ x: 400, y: 300 });
  const recoilOrigin = useRef({ x: 400, y: 300 });
  const animating = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Load background image
    const bgImg = new window.Image();
    bgImg.src = "/bg.png";
    bgImgRef.current = bgImg;

    // Load scope image
    const scopeImg = new window.Image();
    scopeImg.src = "/scope.png";
    scopeImgRef.current = scopeImg;

    // Breathing shake state
    let breathing = true;
    let breathTime = 0;

    // Draw function with breathing shake
    const draw = () => {
      if (!canvas || !ctx) return;
      if (bgImg.complete) {
        ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);
      } else {
        ctx.fillStyle = "#fff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      if (scopeImg.complete) {
        const w = scopeImg.width;
        const h = scopeImg.height;
        // Breathing shake offset
        let offsetX = 0, offsetY = 0;
        if (breathing && !animating.current) {
          offsetX = Math.sin(breathTime) * SHAKE_X;
          offsetY = Math.cos(breathTime * 0.7) * SHAKE_Y;
        }
        ctx.drawImage(
          scopeImg,
          scopePos.current.x + offsetX - w / 2,
          scopePos.current.y + offsetY - h / 2
        );
      }
    };

    // Mouse move handler
    const handleMouseMove = (e: MouseEvent) => {
      if (animating.current) return; // Disable move during recoil
      const rect = canvas.getBoundingClientRect();
      scopePos.current.x = e.clientX - rect.left;
      scopePos.current.y = e.clientY - rect.top;
      recoilOrigin.current.x = scopePos.current.x;
      recoilOrigin.current.y = scopePos.current.y;
      draw();
    };

    // Recoil handler with sound
    const handleMouseDown = () => {
      if (animating.current) return;
      // Play sniper shot sound
      const audio = new window.Audio("/sfx/sniper-shot.mp3");
      audio.currentTime = 0;
      audio.play();
      animating.current = true;
      // Simulate recoil: up and random left/right
      const recoilY = recoilOrigin.current.y - RECOIL_POWER - Math.random() * RECOIL_UP_VARIANCE;
      const recoilX = recoilOrigin.current.x + (Math.random() - 0.5) * RECOIL_SIDE;
      gsap.to(scopePos.current, {
        x: recoilX,
        y: recoilY,
        duration: 0.09,
        onUpdate: draw,
        onComplete: () => {
          gsap.to(scopePos.current, {
            x: recoilOrigin.current.x,
            y: recoilOrigin.current.y,
            duration: 0.25,
            ease: "power2.out",
            onUpdate: draw,
            onComplete: () => {
              animating.current = false;
            },
          });
        },
      });
    };

    // Animate breathing shake
    let tickerId: number | null = null;
    const animateBreath = () => {
      breathTime += SHAKE_SPEED;
      draw();
      tickerId = requestAnimationFrame(animateBreath);
    };

    // Wait for both images to load before enabling events
    let loaded = 0;
    const tryEnable = () => {
      loaded++;
      if (loaded === 2) {
        // Draw initial background
        draw();
        canvas.addEventListener("mousemove", handleMouseMove);
        canvas.addEventListener("mousedown", handleMouseDown);
        // Start breathing shake
        breathing = true;
        animateBreath();
      }
    };
    bgImg.onload = tryEnable;
    scopeImg.onload = tryEnable;
    if (bgImg.complete) tryEnable();
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
