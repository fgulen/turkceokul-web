"use client";

import { useEffect, useRef } from "react";
import createGlobe from "cobe";

export function GlobeCanvas({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    // Panel bu bileşeni yalnızca lg+ genişlikte gösterir (`hidden lg:flex`), ama
    // display:none altında da React effect'i çalışır — mobilde boşuna WebGL/rAF
    // döngüsü başlatmamak için burada da aynı breakpoint'i kontrol ediyoruz.
    if (!window.matchMedia("(min-width: 1024px)").matches) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let phi = 0;
    let width = canvas.offsetWidth;

    const onResize = () => {
      if (canvas) width = canvas.offsetWidth;
    };
    window.addEventListener("resize", onResize);

    const globe = createGlobe(canvas, {
      devicePixelRatio: Math.min(window.devicePixelRatio || 1, 2),
      width: width * 2,
      height: width * 2,
      phi: 0,
      theta: 0.32,
      dark: 1,
      diffuse: 1.15,
      mapSamples: 12000,
      mapBrightness: 14,
      mapBaseBrightness: 0.1,
      baseColor: [0.2, 0.5, 0.85],
      markerColor: [1, 1, 1],
      glowColor: [0, 0, 0],
      opacity: 1,
    });

    let frameId: number | null = null;
    if (!reduceMotion) {
      const animate = () => {
        phi += 0.0035;
        globe.update({ phi, width: width * 2, height: width * 2 });
        frameId = requestAnimationFrame(animate);
      };
      frameId = requestAnimationFrame(animate);
    }

    requestAnimationFrame(() => {
      if (canvas) canvas.style.opacity = "1";
    });

    return () => {
      window.removeEventListener("resize", onResize);
      if (frameId !== null) cancelAnimationFrame(frameId);
      globe.destroy();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ width: "100%", height: "100%", opacity: 0, transition: "opacity 0.8s ease" }}
    />
  );
}
