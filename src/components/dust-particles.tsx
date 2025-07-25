"use client";

import { useEffect, useState, useRef } from "react";

interface Particle {
  id: number;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  opacity: number;
  size: number;
}

interface DustParticlesProps {
  isActive: boolean;
}

export const DustParticles = ({ isActive }: DustParticlesProps) => {
  const [particles, setParticles] = useState<Particle[]>([]);
  const animationRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isActive) {
      setParticles([]);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      return;
    }

    // Create initial particles
    const initialParticles: Particle[] = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      z: Math.random() * 1000,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.3,
      vz: (Math.random() - 0.5) * 2,
      opacity: Math.random() * 0.6 + 0.1,
      size: Math.random() * 3 + 1,
    }));

    setParticles(initialParticles);

    const animate = () => {
      setParticles((prevParticles) =>
        prevParticles.map((particle) => {
          let newX = particle.x + particle.vx;
          let newY = particle.y + particle.vy;
          let newZ = particle.z + particle.vz;

          // Wrap around screen edges
          if (newX > 100) newX = -5;
          if (newX < -5) newX = 100;
          if (newY > 100) newY = -5;
          if (newY < -5) newY = 100;
          if (newZ > 1000) newZ = 0;
          if (newZ < 0) newZ = 1000;

          // Vary opacity based on z position
          const opacity = (newZ / 1000) * 0.6 + 0.1;

          return {
            ...particle,
            x: newX,
            y: newY,
            z: newZ,
            opacity,
          };
        })
      );

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isActive]);

  if (!isActive) return null;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden"
      style={{
        perspective: "1000px",
      }}
    >
      {particles.map((particle) => {
        const scale = (particle.z / 1000) * 0.8 + 0.2;
        const blur = Math.max(0, (1000 - particle.z) / 200);
        
        return (
          <div
            key={particle.id}
            className="absolute rounded-full bg-white"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              width: `${particle.size * scale}px`,
              height: `${particle.size * scale}px`,
              opacity: particle.opacity,
              transform: `translateZ(${particle.z}px) scale(${scale})`,
              filter: `blur(${blur}px)`,
              transition: "all 0.1s linear",
            }}
          />
        );
      })}
    </div>
  );
};
