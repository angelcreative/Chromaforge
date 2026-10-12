
import React, { useRef, useState, useEffect } from 'react';
import { ColorData } from '../types';
import { generateShades } from '../utils/colorUtils';

interface PaletteCard3DProps {
  color: ColorData;
}

type LightingMode = 'neutral' | 'cool' | 'warm' | 'neon';

const PaletteCard3D: React.FC<PaletteCard3DProps> = ({ color }) => {
  const shades = generateShades(color);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastMousePos = useRef({ x: 0, y: 0 });
  
  // State
  const [rotation, setRotation] = useState({ x: -25, y: 45 });
  const [isHovered, setIsHovered] = useState(false);
  const [isAutoRotate, setIsAutoRotate] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [lightingMode, setLightingMode] = useState<LightingMode>('neutral');
  const [isDragging, setIsDragging] = useState(false);
  
  // Auto-rotate effect
  useEffect(() => {
    let animationFrame: number;
    const animate = () => {
      if (isAutoRotate && !isHovered && !isDragging) {
        setRotation(prev => ({ ...prev, y: (prev.y + 0.2) % 360 }));
      }
      animationFrame = requestAnimationFrame(animate);
    };
    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [isAutoRotate, isHovered, isDragging]);

  // Handle Drag Rotation (Mouse)
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent text selection
    setIsDragging(true);
    setIsAutoRotate(false); // Stop auto-rotate on manual interaction
    lastMousePos.current = { x: e.clientX, y: e.clientY };
  };

  // Handle Drag Rotation (Touch)
  const handleTouchStart = (e: React.TouchEvent) => {
      setIsDragging(true);
      setIsAutoRotate(false);
      lastMousePos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };

  useEffect(() => {
    const handleWindowMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      
      const deltaX = e.clientX - lastMousePos.current.x;
      const deltaY = e.clientY - lastMousePos.current.y;
      
      setRotation(prev => ({
        x: Math.max(-90, Math.min(90, prev.x - deltaY * 0.5)), // Clamp X rotation slightly
        y: prev.y + deltaX * 0.5
      }));
      
      lastMousePos.current = { x: e.clientX, y: e.clientY };
    };

    const handleWindowTouchMove = (e: TouchEvent) => {
        if (!isDragging) return;
        if (e.cancelable) e.preventDefault(); // Stop scrolling while rotating 3D object

        const touch = e.touches[0];
        const deltaX = touch.clientX - lastMousePos.current.x;
        const deltaY = touch.clientY - lastMousePos.current.y;

        setRotation(prev => ({
            x: Math.max(-90, Math.min(90, prev.x - deltaY * 0.5)),
            y: prev.y + deltaX * 0.5
        }));
        
        lastMousePos.current = { x: touch.clientX, y: touch.clientY };
    }

    const handleWindowMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleWindowMouseMove);
      window.addEventListener('mouseup', handleWindowMouseUp);
      window.addEventListener('touchmove', handleWindowTouchMove, { passive: false });
      window.addEventListener('touchend', handleWindowMouseUp);
    }
    
    return () => {
      window.removeEventListener('mousemove', handleWindowMouseMove);
      window.removeEventListener('mouseup', handleWindowMouseUp);
      window.removeEventListener('touchmove', handleWindowTouchMove);
      window.removeEventListener('touchend', handleWindowMouseUp);
    };
  }, [isDragging]);

  const handleReset = (e: React.MouseEvent | React.TouchEvent) => {
      e.stopPropagation();
      setRotation({ x: -25, y: 45 });
      setIsAutoRotate(true);
      setIsExpanded(false);
      setLightingMode('neutral');
  };

  const positions = [
    { x: 0, y: 0, z: 0 }, { x: 1, y: 0, z: 0 },
    { x: 0, y: 1, z: 0 }, { x: 1, y: 1, z: 0 },
    { x: 0, y: 0, z: 1 }, { x: 1, y: 0, z: 1 },
    { x: 0, y: 1, z: 1 }, { x: 1, y: 1, z: 1 },
  ];

  const getFaceColor = (pos: {x: number, y: number, z: number}, face: string) => {
    if (face === 'front') {
       if (pos.z !== 1) return null;
       return (pos.x + pos.y) % 2 === 0 ? shades[0].hex : shades[1].hex;
    }
    if (face === 'right') {
        if (pos.x !== 1) return null;
        return (pos.y + pos.z) % 2 === 0 ? shades[2].hex : shades[3].hex;
    }
    if (face === 'back') {
        if (pos.z !== 0) return null;
        return (pos.x + pos.y) % 2 === 0 ? shades[4].hex : shades[5].hex;
    }
    if (face === 'left') {
        if (pos.x !== 0) return null;
        return (pos.y + pos.z) % 2 === 0 ? shades[6].hex : shades[7].hex;
    }
    if (face === 'top') {
        if (pos.y !== 1) return null;
        return (pos.x + pos.z) % 2 === 0 ? shades[8].hex : shades[9].hex;
    }
    if (face === 'bottom') {
        if (pos.y !== 0) return null;
        return shades[10].hex;
    }
    return null;
  };

  const voxelSize = 60; 
  const gap = isExpanded ? 40 : 4; 
  const offset = (voxelSize + gap) / 2;

  const lightingConfigs = {
      neutral: {
          containerBg: 'bg-slate-900/50',
          shadowColor: 'rgba(99, 102, 241, 0.2)',
          overlayColor: 'transparent',
          faceFilter: '',
          shadowClass: 'bg-indigo-500/20'
      },
      cool: {
          containerBg: 'bg-slate-800/80',
          shadowColor: 'rgba(6, 182, 212, 0.4)',
          overlayColor: 'rgba(6, 182, 212, 0.15)',
          faceFilter: 'contrast(1.1) brightness(1.1) hue-rotate(15deg)',
          shadowClass: 'bg-cyan-500/30'
      },
      warm: {
          containerBg: 'bg-orange-950/30',
          shadowColor: 'rgba(249, 115, 22, 0.4)',
          overlayColor: 'rgba(249, 115, 22, 0.15)',
          faceFilter: 'contrast(1.1) sepia(0.2)',
          shadowClass: 'bg-orange-500/30'
      },
      neon: {
          containerBg: 'bg-purple-950/40',
          shadowColor: 'rgba(217, 70, 239, 0.6)',
          overlayColor: 'rgba(168, 85, 247, 0.1)', 
          faceFilter: 'contrast(1.3) saturate(1.2)',
          shadowClass: 'bg-fuchsia-500/50'
      }
  };

  const currentLighting = lightingConfigs[lightingMode];

  return (
    <div 
      className={`h-[480px] rounded-3xl border border-slate-800 flex flex-col items-center justify-center relative group overflow-hidden transition-colors duration-700 ${currentLighting.containerBg} ${isDragging ? 'cursor-grabbing' : 'cursor-grab'} touch-none`}
      style={{ perspective: '1200px' }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      ref={containerRef}
    >
      <div className="absolute top-6 text-center pointer-events-none z-20 transition-transform duration-300 group-hover:-translate-y-2 select-none">
        <h3 className="palette-ink text-xl font-bold text-white drop-shadow-md tracking-tight">{color.name}</h3>
        <p className="text-xs text-slate-400 font-mono mt-1 opacity-60 group-hover:opacity-100 transition-opacity duration-300">{color.hex}</p>
        
        <div className={`mt-2 text-[10px] uppercase font-bold tracking-widest transition-opacity duration-500 ${lightingMode === 'neutral' ? 'opacity-0' : 'opacity-100'}`} style={{ color: lightingMode === 'neon' ? '#d946ef' : lightingMode === 'warm' ? '#f97316' : '#22d3ee' }}>
            {lightingMode} Light
        </div>
      </div>

      <div 
        className="relative will-change-transform transition-transform duration-75 cubic-bezier(0.2, 0.8, 0.2, 1) z-20"
        style={{ 
          transformStyle: 'preserve-3d',
          transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`
        }}
      >
        {positions.map((pos, idx) => {
            const x = pos.x === 0 ? -offset : offset;
            const y = pos.y === 0 ? offset : -offset; 
            const z = pos.z === 0 ? -offset : offset;

            const faces = ['front', 'back', 'left', 'right', 'top', 'bottom'];

            return (
                <div 
                    key={idx}
                    className="absolute transition-transform duration-500 cubic-bezier(0.34, 1.56, 0.64, 1)"
                    style={{
                        transformStyle: 'preserve-3d',
                        transform: `translate3d(${x}px, ${y}px, ${z}px)`
                    }}
                >
                    {faces.map(face => {
                        const hex = getFaceColor(pos, face);
                        if (!hex) return null; 

                        let t = '';
                        const d = voxelSize / 2;
                        switch(face) {
                            case 'front': t = `translateZ(${d}px)`; break;
                            case 'back': t = `rotateY(180deg) translateZ(${d}px)`; break;
                            case 'left': t = `rotateY(-90deg) translateZ(${d}px)`; break;
                            case 'right': t = `rotateY(90deg) translateZ(${d}px)`; break;
                            case 'top': t = `rotateX(90deg) translateZ(${d}px)`; break;
                            case 'bottom': t = `rotateX(-90deg) translateZ(${d}px)`; break;
                        }

                        let brightness = 1;
                        if (face === 'top') brightness = lightingMode === 'cool' ? 1.3 : 1.15;
                        if (face === 'bottom') brightness = 0.6;
                        if (face === 'back' || face === 'left') brightness = lightingMode === 'warm' ? 0.9 : 0.85;
                        if (face === 'right') brightness = lightingMode === 'warm' ? 1.1 : 0.95;

                        const boxShadow = lightingMode === 'neon' ? `0 0 15px ${hex}` : 'inset 0 0 15px rgba(0,0,0,0.1)';
                        const border = lightingMode === 'neon' ? '1px solid rgba(255,255,255,0.3)' : '1px solid rgba(0,0,0,0.1)';

                        return (
                            <div
                                key={face}
                                className="absolute -top-[30px] -left-[30px] w-[60px] h-[60px] box-border transition-all duration-500"
                                style={{
                                    transform: t,
                                    backgroundColor: hex,
                                    filter: `brightness(${brightness}) ${currentLighting.faceFilter}`,
                                    backfaceVisibility: 'hidden',
                                    boxShadow: boxShadow,
                                    border: border
                                }}
                            >
                                <div className="absolute inset-0 pointer-events-none mix-blend-overlay" style={{ backgroundColor: currentLighting.overlayColor }} />

                                <div className="w-full h-full flex items-center justify-center transition-opacity duration-300 pointer-events-none select-none opacity-100">
                                     <span className="palette-ink text-[9px] font-bold text-white/90 drop-shadow-md bg-black/30 px-1 py-0.5 rounded backdrop-blur-[2px]">
                                        {hex === shades[10].hex ? 950 : 
                                         hex === shades[0].hex ? 50 : 
                                         hex === shades[1].hex ? 100 :
                                         hex === shades[2].hex ? 200 :
                                         hex === shades[3].hex ? 300 :
                                         hex === shades[4].hex ? 400 :
                                         hex === shades[5].hex ? 500 :
                                         hex === shades[6].hex ? 600 :
                                         hex === shades[7].hex ? 700 :
                                         hex === shades[8].hex ? 800 : 900
                                        }
                                     </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            );
        })}
      </div>
      
      <div 
        className={`absolute bottom-12 w-32 h-32 blur-3xl rounded-full pointer-events-none transition-all duration-500 ${currentLighting.shadowClass}`}
        style={{ 
            transform: `translateY(120px) rotateX(90deg) scale(${isExpanded ? 1.5 : 1 + (rotation.x / 100)})`,
            opacity: 0.6 - (Math.abs(rotation.x) / 120)
        }}
      />

      <div className="absolute bottom-4 flex flex-col gap-2 items-center opacity-100 transition-all duration-300 z-30">
          <div className="flex gap-1 bg-slate-950/90 backdrop-blur-md p-1 rounded-full border border-white/10 shadow-lg scale-90">
             <button onTouchEnd={(e) => { e.stopPropagation(); setLightingMode('neutral') }} onClick={(e) => { e.stopPropagation(); setLightingMode('neutral') }} className={`p-1.5 rounded-full ${lightingMode === 'neutral' ? 'bg-white text-black' : 'text-slate-400 hover:text-white'}`} title="Neutral Light">
                <div className="w-3 h-3 rounded-full border-2 border-current"></div>
             </button>
             <button onTouchEnd={(e) => { e.stopPropagation(); setLightingMode('cool') }} onClick={(e) => { e.stopPropagation(); setLightingMode('cool') }} className={`p-1.5 rounded-full ${lightingMode === 'cool' ? 'bg-cyan-500 text-white' : 'text-slate-400 hover:text-cyan-400'}`} title="Cool Light">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707" /></svg>
             </button>
             <button onTouchEnd={(e) => { e.stopPropagation(); setLightingMode('warm') }} onClick={(e) => { e.stopPropagation(); setLightingMode('warm') }} className={`p-1.5 rounded-full ${lightingMode === 'warm' ? 'bg-orange-500 text-white' : 'text-slate-400 hover:text-orange-400'}`} title="Warm Light">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" /></svg>
             </button>
             <button onTouchEnd={(e) => { e.stopPropagation(); setLightingMode('neon') }} onClick={(e) => { e.stopPropagation(); setLightingMode('neon') }} className={`p-1.5 rounded-full ${lightingMode === 'neon' ? 'bg-fuchsia-600 text-white' : 'text-slate-400 hover:text-fuchsia-500'}`} title="Neon Light">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" /></svg>
             </button>
          </div>

          <div className="flex gap-2 bg-slate-950/80 backdrop-blur-md p-1.5 rounded-xl border border-white/10 shadow-xl">
              <button 
                onTouchEnd={(e) => { e.stopPropagation(); setIsAutoRotate(!isAutoRotate); }}
                onClick={(e) => { e.stopPropagation(); setIsAutoRotate(!isAutoRotate); }}
                className={`p-2 rounded-lg transition-colors ${isAutoRotate ? 'text-indigo-400 bg-indigo-500/10' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                title={isAutoRotate ? "Pause Rotation" : "Auto Rotate"}
              >
                 {isAutoRotate ? (
                     <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                 ) : (
                     <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                 )}
              </button>
              
              <button 
                onTouchEnd={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
                onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
                className={`p-2 rounded-lg transition-colors ${isExpanded ? 'text-pink-400 bg-pink-500/10' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                title={isExpanded ? "Collapse View" : "Explode View"}
              >
                 {isExpanded ? (
                     <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                 ) : (
                     <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
                 )}
              </button>
    
              <button 
                onTouchEnd={handleReset}
                onClick={handleReset}
                className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                title="Reset View"
              >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
              </button>
          </div>
      </div>
    </div>
  );
};

export default PaletteCard3D;
