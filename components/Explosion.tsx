import React, { useEffect, useMemo } from 'react';
import type { Position } from '../types';

interface ExplosionProps {
  position: Position;
  onComplete: () => void;
}

const PARTICLE_COUNT = 30;
const DURATION = 1500;

export const Explosion: React.FC<ExplosionProps> = ({ position, onComplete }) => {
  useEffect(() => {
    const timer = setTimeout(onComplete, DURATION);
    return () => clearTimeout(timer);
  }, [onComplete]);

  const particles = useMemo(() => {
    return Array.from({ length: PARTICLE_COUNT }).map((_, i) => {
      const angle = Math.random() * 2 * Math.PI;
      const distance = 200 + Math.random() * 300; // Travel long distances
      const duration = (DURATION * 0.7) + (Math.random() * (DURATION * 0.3));
      const delay = Math.random() * (DURATION * 0.2);
      const size = 5 + Math.random() * 10;
      const color = ['#FFC700', '#FF8F00', '#FF5722', '#F44336'][Math.floor(Math.random() * 4)];
      
      return {
        id: i,
        style: {
          '--tx': `${Math.cos(angle) * distance}px`,
          '--ty': `${Math.sin(angle) * distance}px`,
          background: color,
          width: `${size}px`,
          height: `${size}px`,
          animation: `explosion-particle ${duration}ms ease-out ${delay}ms forwards`,
        } as React.CSSProperties,
      };
    });
  }, []);

  return (
    <div 
      className="absolute pointer-events-none" 
      style={{ 
        left: `${position.x}px`, 
        top: `${position.y}px`,
      }}
    >
      {particles.map(p => (
        <div key={p.id} className="absolute rounded-full" style={p.style} />
      ))}
    </div>
  );
};
