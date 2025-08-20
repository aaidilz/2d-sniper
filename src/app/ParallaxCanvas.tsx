import React, { useEffect, useRef } from 'react';
import bgLayer1 from '../../public/bg-layer1.png';
import bgLayer2 from '../../public/bg-layer2.png';
import bgLayer3 from '../../public/bg-layer3.png';
import bgLayer4 from '../../public/bg-layer4.png';
import scopeImage from '../../public/scope.png';

interface ParallaxCanvasProps {
  width: number;
  height: number;
  showScope?: boolean; // opsional untuk toggle scope
  scopeScale?: number; // skala relatif terhadap tinggi canvas (contoh 0.8 = 80%)
  reticleSize?: number; // panjang garis reticle dari pusat
}

const ParallaxCanvas: React.FC<ParallaxCanvasProps> = ({ width, height, showScope = true, scopeScale = 0.8, reticleSize = 12 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
 
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // High DPI support
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    ctx.scale(dpr, dpr);

    const layers = [
      { image: new Image(), speed: 0.025, position: { x: 0, y: 0 } }, // bg-layer4
      { image: new Image(), speed: 0.05, position: { x: 0, y: 0 } }, // bg-layer3
      { image: new Image(), speed: 0.1, position: { x: 0, y: 0 } },  // bg-layer2
      { image: new Image(), speed: 0.2, position: { x: 0, y: 0 } },  // bg-layer1
    ];

    // Set sources
    layers[0].image.src = bgLayer4.src;
    layers[1].image.src = bgLayer3.src;
    layers[2].image.src = bgLayer2.src;
    layers[3].image.src = bgLayer1.src;

    const scope = new Image();
    scope.src = scopeImage.src;

    const mouseForParallax = { x: 0, y: 0 }; // offset dari center untuk parallax
    const rawMouse = { x: width / 2, y: height / 2 }; // posisi absolut di canvas

    const handleMouseMove = (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const inside =
        event.clientX >= rect.left &&
        event.clientX <= rect.right &&
        event.clientY >= rect.top &&
        event.clientY <= rect.bottom;
      if (inside) {
        const localX = event.clientX - rect.left;
        const localY = event.clientY - rect.top;
        rawMouse.x = localX;
        rawMouse.y = localY;
        mouseForParallax.x = localX - width / 2;
        mouseForParallax.y = localY - height / 2;
      }
    };

    window.addEventListener('mousemove', handleMouseMove);

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      const sensitivity = 0.5; // parallax sensitivity

      layers.forEach((layer, index) => {
        const xOffset = mouseForParallax.x * layer.speed * sensitivity + layer.position.x;
        const yOffset = mouseForParallax.y * layer.speed * sensitivity + layer.position.y;
        const zoomFactor = 1 + index * 0.1; // Per-layer zoom
        const layerWidth = width * zoomFactor;
        const layerHeight = height * zoomFactor;
        ctx.drawImage(
          layer.image,
          xOffset - (layerWidth - width) / 2,
          yOffset - (layerHeight - height) / 2,
          layerWidth,
          layerHeight
        );
      });

      if (showScope) {
        // Pastikan gambar scope sudah loaded sebelum menggambar
        if (scope.complete && scope.naturalWidth > 0) {
          const size = Math.min(width, height) * scopeScale; // diameter scope
          const drawX = rawMouse.x - size / 2;
          const drawY = rawMouse.y - size / 2;
          ctx.save();
          ctx.drawImage(scope, drawX, drawY, size, size);
          ctx.restore();
        }
      }

      requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [width, height, showScope, scopeScale, reticleSize]);

  return <canvas ref={canvasRef} style={{ display: 'block', cursor: 'none' }} />;
};

export default ParallaxCanvas;
