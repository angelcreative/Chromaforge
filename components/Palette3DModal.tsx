import React, { useRef, useState, useEffect } from 'react';
import { ColorData } from '../types';
import { generateShades } from '../utils/colorUtils';

interface Palette3DModalProps {
  palette: ColorData[];
  paletteName: string;
  onClose: () => void;
}

const Palette3DModal: React.FC<Palette3DModalProps> = ({ palette, paletteName, onClose }) => {
  const [rotation, setRotation] = useState({ x: -25, y: 45 });
  const [isDragging, setIsDragging] = useState(false);
  const lastMousePos = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    lastMousePos.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const deltaX = e.clientX - lastMousePos.current.x;
    const deltaY = e.clientY - lastMousePos.current.y;
    setRotation(prev => ({
      x: prev.x - deltaY * 0.5,
      y: prev.y + deltaX * 0.5
    }));
    lastMousePos.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = () => setIsDragging(false);

  useEffect(() => {
    const handleUp = () => setIsDragging(false);
    window.addEventListener('mouseup', handleUp);
    return () => window.removeEventListener('mouseup', handleUp);
  }, []);

  // Calculate vectors for each color
  const count = palette.length;
  // Distribute vectors evenly around the Y axis for now (Planar starburst)
  // If count > 4, we might want to tilt them to form a 3D shape, but starburst is clearest for palette
  const vectors = palette.map((color, i) => {
    const angle = (i / count) * Math.PI * 2;
    // Basic XZ plane distribution
    return {
      x: Math.cos(angle),
      y: 0, // Keep flat or vary? Let's vary slightly for visual interest if count > 2
      z: Math.sin(angle),
      color
    };
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="flex flex-col w-full h-full relative">
        
        {/* Header Overlay */}
        <div className="absolute top-4 left-4 right-4 z-10 flex justify-between items-start pointer-events-none">
          <div>
            <h2 className="text-3xl font-bold text-white tracking-tight drop-shadow-md">{paletteName}</h2>
            <p className="text-slate-400 font-mono text-sm">3D Voxel Visualization • {count} Vectors</p>
          </div>
          <button onClick={onClose} className="pointer-events-auto p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors backdrop-blur-md">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* 3D Scene Container */}
        <div 
          ref={containerRef}
          className="flex-1 w-full flex items-center justify-center perspective cursor-move"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          style={{ perspective: '1200px' }}
        >
          <div 
            className="relative transform-style-3d transition-transform duration-75 ease-linear"
            style={{ 
              transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
              width: '0px',
              height: '0px'
            }}
          >
            {/* Center Core (White) */}
            <Cube x={0} y={0} z={0} color="#FFFFFF" size={40} />

            {/* Render Arms */}
            {vectors.map((vec, idx) => {
              const shades = generateShades(vec.color);
              // Filter or use specific shades? Let's use all 11 shades
              // Distance multiplier
              const dist = 50; 
              
              return (
                <React.Fragment key={idx}>
                  {shades.map((shade, sIdx) => {
                    // Start from center (lightest) to out (darkest)
                    // level 50 -> close, level 950 -> far
                    const offset = (sIdx + 1); // 1 to 11
                    
                    // Add some verticality based on index to separate arms if they are close?
                    // Or keep planar. Let's add a sine wave vertical offset for style if > 2 colors
                    const verticalOffset = count > 2 ? Math.sin(offset * 0.5 + idx) * 0.3 : 0;

                    const x = vec.x * offset * dist;
                    const y = (vec.y + verticalOffset) * offset * dist; 
                    const z = vec.z * offset * dist;

                    return (
                      <Cube 
                        key={`${idx}-${shade.level}`}
                        x={x} 
                        y={y} 
                        z={z} 
                        color={shade.hex}
                        size={35}
                        label={shade.level.toString()}
                      />
                    );
                  })}
                </React.Fragment>
              );
            })}
          </div>
        </div>
        
        <div className="absolute bottom-8 left-0 right-0 text-center text-slate-500 text-xs pointer-events-none">
            Drag to rotate • Scroll to zoom (coming soon)
        </div>
      </div>
    </div>
  );
};

const Cube: React.FC<{x: number, y: number, z: number, color: string, size: number, label?: string}> = ({ x, y, z, color, size, label }) => {
  const style = {
    '--x': `${x}px`,
    '--y': `${y}px`,
    '--z': `${z}px`,
    '--s': `${size}px`,
    '--c': color,
  } as React.CSSProperties;

  return (
    <div className="cube-wrapper absolute top-0 left-0 transform-style-3d" style={{
      transform: `translate3d(${x}px, ${y}px, ${z}px)`
    }}>
      <div className="cube relative w-[var(--s)] h-[var(--s)] transform-style-3d" style={style}>
        {/* Faces */}
        <div className="face front absolute w-full h-full border border-black/10 flex items-center justify-center text-[8px] font-mono text-white/50 select-none" style={{ backgroundColor: color, transform: `translateZ(calc(var(--s) / 2))` }}>{label}</div>
        <div className="face back absolute w-full h-full border border-black/10" style={{ backgroundColor: color, transform: `rotateY(180deg) translateZ(calc(var(--s) / 2))` }}></div>
        <div className="face right absolute w-full h-full border border-black/10" style={{ backgroundColor: color, transform: `rotateY(90deg) translateZ(calc(var(--s) / 2))` }}></div>
        <div className="face left absolute w-full h-full border border-black/10" style={{ backgroundColor: color, transform: `rotateY(-90deg) translateZ(calc(var(--s) / 2))` }}></div>
        <div className="face top absolute w-full h-full border border-black/10" style={{ backgroundColor: color, transform: `rotateX(90deg) translateZ(calc(var(--s) / 2))` }}></div>
        <div className="face bottom absolute w-full h-full border border-black/10" style={{ backgroundColor: color, transform: `rotateX(-90deg) translateZ(calc(var(--s) / 2))` }}></div>
      </div>
    </div>
  );
};

export default Palette3DModal;