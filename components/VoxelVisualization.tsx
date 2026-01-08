
import React, { useRef, useState, useEffect } from 'react';
import { ColorData } from '../types';
import { generateShades } from '../utils/colorUtils';

interface VoxelVisualizationProps {
  palette: ColorData[];
}

const VoxelVisualization: React.FC<VoxelVisualizationProps> = ({ palette }) => {
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
      x: Math.max(-90, Math.min(90, prev.x - deltaY * 0.5)),
      y: prev.y + deltaX * 0.5
    }));
    lastMousePos.current = { x: e.clientX, y: e.clientY };
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    lastMousePos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    if (e.cancelable) e.preventDefault();
    const touch = e.touches[0];
    const deltaX = touch.clientX - lastMousePos.current.x;
    const deltaY = touch.clientY - lastMousePos.current.y;
    setRotation(prev => ({
      x: Math.max(-90, Math.min(90, prev.x - deltaY * 0.5)),
      y: prev.y + deltaX * 0.5
    }));
    lastMousePos.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleEnd = () => setIsDragging(false);

  useEffect(() => {
    window.addEventListener('mouseup', handleEnd);
    window.addEventListener('touchend', handleEnd);
    return () => {
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchend', handleEnd);
    };
  }, []);

  // Calculate vectors for each color
  const count = palette.length;
  const vectors = palette.map((color, i) => {
    const angle = (i / count) * Math.PI * 2;
    return {
      x: Math.cos(angle),
      y: 0,
      z: Math.sin(angle),
      color
    };
  });

  return (
    <div className="w-full h-full flex flex-col relative bg-slate-950/50 rounded-3xl border border-slate-800 overflow-hidden shadow-inner">
        
        {/* Header Overlay */}
        <div className="absolute top-6 left-6 z-10 pointer-events-none">
            <h2 className="text-2xl font-bold text-white tracking-tight drop-shadow-md">Voxel Map</h2>
            <p className="text-slate-400 font-mono text-xs mt-1">{count} Vectors • Polar Distribution</p>
        </div>

        {/* 3D Scene Container */}
        <div 
          ref={containerRef}
          className={`flex-1 w-full flex items-center justify-center perspective touch-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
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
            <Cube x={0} y={0} z={0} color="#FFFFFF" size={30} opacity={0.2} />

            {/* Render Arms */}
            {vectors.map((vec, idx) => {
              const shades = generateShades(vec.color);
              const dist = 45; // Spacing between cubes
              
              return (
                <React.Fragment key={idx}>
                  {shades.map((shade, sIdx) => {
                    // level 50 -> close, level 950 -> far
                    const offset = (sIdx + 1); 
                    
                    // Sine wave vertical offset for visual separation of arms
                    const verticalOffset = count > 1 ? Math.sin(offset * 0.4 + idx * (Math.PI / (count/2))) * 0.5 : 0;

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
                        size={30}
                        label={shade.level.toString()}
                      />
                    );
                  })}
                </React.Fragment>
              );
            })}
          </div>
        </div>
        
        <div className="absolute bottom-6 left-0 right-0 text-center text-slate-600 text-[10px] font-mono pointer-events-none uppercase tracking-widest">
            Drag to rotate
        </div>
    </div>
  );
};

const Cube: React.FC<{x: number, y: number, z: number, color: string, size: number, label?: string, opacity?: number}> = ({ x, y, z, color, size, label, opacity = 1 }) => {
  const style = {
    '--x': `${x}px`,
    '--y': `${y}px`,
    '--z': `${z}px`,
    '--s': `${size}px`,
    '--c': color,
    '--o': opacity
  } as React.CSSProperties;

  return (
    <div className="cube-wrapper absolute top-0 left-0 transform-style-3d" style={{
      transform: `translate3d(${x}px, ${y}px, ${z}px)`
    }}>
      <div className="cube relative w-[var(--s)] h-[var(--s)] transform-style-3d" style={style}>
        {/* Faces */}
        {['front', 'back', 'right', 'left', 'top', 'bottom'].map(face => {
            let transform = '';
            switch(face) {
                case 'front': transform = `translateZ(calc(var(--s) / 2))`; break;
                case 'back': transform = `rotateY(180deg) translateZ(calc(var(--s) / 2))`; break;
                case 'right': transform = `rotateY(90deg) translateZ(calc(var(--s) / 2))`; break;
                case 'left': transform = `rotateY(-90deg) translateZ(calc(var(--s) / 2))`; break;
                case 'top': transform = `rotateX(90deg) translateZ(calc(var(--s) / 2))`; break;
                case 'bottom': transform = `rotateX(-90deg) translateZ(calc(var(--s) / 2))`; break;
            }
            
            return (
                <div 
                    key={face} 
                    className={`absolute w-full h-full border border-black/20 ${face === 'front' ? 'flex items-center justify-center text-[7px] font-mono text-white/70 select-none' : ''}`}
                    style={{ 
                        backgroundColor: color, 
                        transform,
                        opacity: opacity 
                    }}
                >
                    {face === 'front' && label}
                </div>
            )
        })}
      </div>
    </div>
  );
};

export default VoxelVisualization;
