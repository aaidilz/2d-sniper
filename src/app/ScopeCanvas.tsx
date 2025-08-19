"use client";
import { useEffect, useRef } from "react";

export default function ScopeCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scopeImgRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Load scope image
    const scopeImg = new window.Image();
    scopeImg.src = "/scope.png";
    scopeImgRef.current = scopeImg;

    // Draw white background
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Mouse move handler
    const handleMouseMove = (e: MouseEvent) => {
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      if (scopeImg.complete) {
        const w = scopeImg.width;
        const h = scopeImg.height;
        ctx.drawImage(scopeImg, x - w / 2, y - h / 2);
      }
    };

    scopeImg.onload = () => {
      canvas.addEventListener("mousemove", handleMouseMove);
    };

    return () => {
      canvas.removeEventListener("mousemove", handleMouseMove);
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
