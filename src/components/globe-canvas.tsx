"use client";

import { useEffect, useRef, useState } from "react";
import createGlobe from "cobe";

export function GlobeCanvas({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // Panel bu bileşeni yalnızca lg+ genişlikte gösterir (`hidden lg:flex`), ama
  // display:none altında da React effect'i çalışır — mobilde boşuna WebGL/rAF
  // döngüsü başlatmamak için burada da aynı breakpoint'i izliyoruz. `change`
  // dinleyicisi olmadan tek seferlik kontrol, mount sonrası pencere/tablet
  // döndürmede breakpoint'i geçince yanlış tarafta kalırdı.
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia("(min-width: 1024px)");
    setIsDesktop(mql.matches);
    const onChange = () => setIsDesktop(mql.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !isDesktop) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let phi = 0;
    // Wrapper sabit boyutlu (h-[560px] w-[560px]) — canvas'ın kendi genişliği
    // mount sonrası değişmez, bu yüzden resize dinleyicisine gerek yok.
    const diameter = canvas.offsetWidth * 2;

    const globe = createGlobe(canvas, {
      devicePixelRatio: Math.min(window.devicePixelRatio || 1, 2),
      width: diameter,
      height: diameter,
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
        globe.update({ phi });
        frameId = requestAnimationFrame(animate);
      };
      frameId = requestAnimationFrame(animate);
    }

    requestAnimationFrame(() => {
      canvas.style.opacity = "1";
    });

    return () => {
      if (frameId !== null) cancelAnimationFrame(frameId);
      globe.destroy();
    };
  }, [isDesktop]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ width: "100%", height: "100%", opacity: 0, transition: "opacity 0.8s ease" }}
    />
  );
}
