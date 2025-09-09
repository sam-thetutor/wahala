'use client';

import React, { useState, useEffect } from 'react';

interface FireworksCelebrationProps {
  trigger: boolean;
  onComplete?: () => void;
}

export const FireworksCelebration: React.FC<FireworksCelebrationProps> = ({ 
  trigger, 
  onComplete 
}) => {
  const [isActive, setIsActive] = useState(false);
  const [particles, setParticles] = useState<Array<{
    id: number;
    x: number;
    y: number;
    vx: number;
    vy: number;
    color: string;
    life: number;
  }>>([]);

  useEffect(() => {
    if (trigger && !isActive) {
      startCelebration();
    }
  }, [trigger, isActive]);

  const startCelebration = () => {
    setIsActive(true);
    createFireworks();
    
    // Stop after 3 seconds
    setTimeout(() => {
      setIsActive(false);
      setParticles([]);
      onComplete?.();
    }, 3000);
  };

  const createFireworks = () => {
    const newParticles = [];
    const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3', '#54a0ff'];
    
    // Create multiple bursts
    for (let burst = 0; burst < 3; burst++) {
      const centerX = Math.random() * window.innerWidth;
      const centerY = Math.random() * window.innerHeight * 0.6; // Keep in upper 60% of screen
      
      for (let i = 0; i < 20; i++) {
        const angle = (Math.PI * 2 * i) / 20;
        const speed = 2 + Math.random() * 3;
        
        newParticles.push({
          id: Math.random(),
          x: centerX,
          y: centerY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 2, // Slight upward bias
          color: colors[Math.floor(Math.random() * colors.length)],
          life: 1.0
        });
      }
    }
    
    setParticles(newParticles);
  };

  useEffect(() => {
    if (!isActive || particles.length === 0) return;

    const animate = () => {
      setParticles(prev => 
        prev
          .map(particle => ({
            ...particle,
            x: particle.x + particle.vx,
            y: particle.y + particle.vy,
            vy: particle.vy + 0.1, // Gravity
            life: particle.life - 0.02
          }))
          .filter(particle => particle.life > 0)
      );
    };

    const interval = setInterval(animate, 16); // ~60fps
    return () => clearInterval(interval);
  }, [isActive, particles.length]);

  if (!isActive) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {particles.map(particle => (
        <div
          key={particle.id}
          className="absolute w-2 h-2 rounded-full animate-pulse"
          style={{
            left: particle.x,
            top: particle.y,
            backgroundColor: particle.color,
            opacity: particle.life,
            transform: `scale(${particle.life})`,
            boxShadow: `0 0 10px ${particle.color}`,
          }}
        />
      ))}
      
      {/* Confetti effect */}
      <div className="absolute inset-0">
        {Array.from({ length: 50 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-yellow-400 animate-bounce"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${1 + Math.random() * 2}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default FireworksCelebration;
