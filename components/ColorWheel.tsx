
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { ColorHSL, ColorData, InputMode } from '../types';

interface ColorWheelProps {
  mode: InputMode;
  baseColor: ColorHSL;
  onChange: (color: ColorHSL) => void;
  harmonyColors?: ColorData[];
  brightness: number;
  isPrintMode: boolean;
  isMixing?: boolean;
}

const ColorWheel: React.FC<ColorWheelProps> = ({ mode, baseColor, onChange, harmonyColors = [], brightness, isPrintMode, isMixing = false }) => {
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative h-[220px] w-[220px] flex items-center justify-center">
        {mode === 'wheel' && (
             <ClassicWheel 
                baseColor={baseColor} 
                onChange={onChange} 
                harmonyColors={harmonyColors} 
                brightness={brightness} 
                isPrintMode={isPrintMode} 
                isMixing={isMixing} 
             />
        )}
        {mode === 'curves' && (
            <SpectralCurvesPicker 
                baseColor={baseColor}
                onChange={onChange}
                brightness={brightness}
                isMixing={isMixing}
                isPrintMode={isPrintMode}
            />
        )}
        {mode === '3d' && (
            <GamutCloudPicker 
                baseColor={baseColor}
                onChange={onChange}
                brightness={brightness}
                isMixing={isMixing}
                isPrintMode={isPrintMode}
            />
        )}
      </div>
    </div>
  );
};

// --- HELPER: CMYK TRIANGLE CLAMPING ---
const CMYK_GAMUT_SCALE = 0.85;
const getGamutTriangle = (radius: number) => {
    const getP = (deg: number) => {
        const rad = (deg - 90) * (Math.PI / 180);
        return {
            x: radius + Math.cos(rad) * radius * CMYK_GAMUT_SCALE, 
            y: radius + Math.sin(rad) * radius * CMYK_GAMUT_SCALE
        };
    };
    return { pY: getP(60), pC: getP(180), pM: getP(300) };
};

const clampToGamut = (px: number, py: number, radius: number) => {
    const { pY, pC, pM } = getGamutTriangle(radius);
    const det = (pC.y - pM.y) * (pY.x - pM.x) + (pM.x - pC.x) * (pY.y - pM.y);
    const w1 = ((pC.y - pM.y) * (px - pM.x) + (pM.x - pC.x) * (py - pM.y)) / det;
    const w2 = ((pM.y - pY.y) * (px - pM.x) + (pY.x - pM.x) * (py - pM.y)) / det;
    const w3 = 1 - w1 - w2;
    if (w1 >= 0 && w2 >= 0 && w3 >= 0) return { x: px, y: py };
    
    const projectOnSegment = (p: {x:number, y:number}, a: {x:number, y:number}, b: {x:number, y:number}) => {
        const atob = { x: b.x - a.x, y: b.y - a.y };
        const atop = { x: p.x - a.x, y: p.y - a.y };
        const lenSq = atob.x * atob.x + atob.y * atob.y;
        let t = Math.max(0, Math.min(1, (atop.x * atob.x + atop.y * atob.y) / lenSq));
        return { x: a.x + t * atob.x, y: a.y + t * atob.y };
    };
    const c1 = projectOnSegment({x:px, y:py}, pY, pC), c2 = projectOnSegment({x:px, y:py}, pC, pM), c3 = projectOnSegment({x:px, y:py}, pM, pY);
    const dSq = (a:any, b:any) => Math.pow(a.x-b.x, 2) + Math.pow(a.y-b.y, 2);
    const d1 = dSq({x:px, y:py}, c1), d2 = dSq({x:px, y:py}, c2), d3 = dSq({x:px, y:py}, c3);
    if (d1 <= d2 && d1 <= d3) return c1;
    if (d2 <= d1 && d2 <= d3) return c2;
    return c3;
};

const getPosFromHSL = (h: number, s: number, radius: number) => {
    const rad = (h - 90) * (Math.PI / 180);
    const d = (s / 100) * radius;
    return { x: radius + Math.cos(rad) * d, y: radius + Math.sin(rad) * d };
};

const getHSLFromPos = (x: number, y: number, radius: number) => {
    const cx = x - radius, cy = y - radius;
    let angle = (Math.atan2(cy, cx) * (180 / Math.PI)) + 90;
    if (angle < 0) angle += 360;
    const saturation = Math.min(100, (Math.sqrt(cx * cx + cy * cy) / radius) * 100);
    return { h: Math.round(angle), s: Math.round(saturation) };
};

// --- 1. CLASSIC WHEEL (REDUCED SIZE: 220px) ---
const ClassicWheel: React.FC<Omit<ColorWheelProps, 'mode'>> = ({ baseColor, onChange, harmonyColors, brightness, isPrintMode, isMixing }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const size = 220, radius = size / 2;

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    ctx.clearRect(0, 0, size, size);
    if (isPrintMode) {
        const { pY, pC, pM } = getGamutTriangle(radius);
        ctx.save();
        ctx.beginPath(); ctx.moveTo(pY.x, pY.y); ctx.lineTo(pC.x, pC.y); ctx.lineTo(pM.x, pM.y); ctx.closePath();
        ctx.clip();
    }
    for (let angle = 0; angle < 360; angle++) {
      const startAngle = (angle - 92) * (Math.PI / 180), endAngle = (angle - 88) * (Math.PI / 180);
      ctx.beginPath(); ctx.moveTo(radius, radius); ctx.arc(radius, radius, radius, startAngle, endAngle); ctx.closePath();
      const grad = ctx.createRadialGradient(radius, radius, 0, radius, radius, radius);
      grad.addColorStop(0, `hsl(${angle}, 0%, ${brightness}%)`); grad.addColorStop(1, `hsl(${angle}, 100%, ${brightness}%)`);
      ctx.fillStyle = grad; ctx.fill();
    }
    if (isPrintMode) {
        ctx.restore();
        const { pY, pC, pM } = getGamutTriangle(radius);
        ctx.beginPath(); ctx.moveTo(pY.x, pY.y); ctx.lineTo(pC.x, pC.y); ctx.lineTo(pM.x, pM.y); ctx.closePath();
        ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.lineWidth = 1; ctx.stroke();
    }
  }, [brightness, isPrintMode, radius, size]);

  const handleInteraction = (clientX: number, clientY: number) => {
    if (isMixing || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    let x = clientX - rect.left, y = clientY - rect.top;
    if (isPrintMode) { const clamped = clampToGamut(x, y, radius); x = clamped.x; y = clamped.y; }
    else { const dx = x - radius, dy = y - radius, dist = Math.sqrt(dx*dx + dy*dy); if (dist > radius) { const angle = Math.atan2(dy, dx); x = radius + Math.cos(angle) * radius; y = radius + Math.sin(angle) * radius; } }
    const hsl = getHSLFromPos(x, y, radius);
    onChange({ ...hsl, l: brightness });
  };

  const onStart = (e: any) => { setIsDragging(true); const c = e.touches ? e.touches[0] : e; handleInteraction(c.clientX, c.clientY); };

  useEffect(() => {
    const move = (e: any) => { if (!isDragging) return; if (e.cancelable) e.preventDefault(); const c = e.touches ? e.touches[0] : e; handleInteraction(c.clientX, c.clientY); };
    const up = () => setIsDragging(false);
    if (isDragging) { window.addEventListener('mousemove', move); window.addEventListener('mouseup', up); window.addEventListener('touchmove', move, { passive: false }); window.addEventListener('touchend', up); }
    return () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); window.removeEventListener('touchmove', move); window.removeEventListener('touchend', up); };
  }, [isDragging]);

  const mainPos = isPrintMode ? clampToGamut(getPosFromHSL(baseColor.h, baseColor.s, radius).x, getPosFromHSL(baseColor.h, baseColor.s, radius).y, radius) : getPosFromHSL(baseColor.h, baseColor.s, radius);

  return (
     <div ref={containerRef} className={`relative rounded-full shadow-2xl cursor-crosshair transform transition-all duration-300 ${isMixing ? 'blur-sm opacity-50' : ''}`} style={{ width: size, height: size, touchAction: 'none' }} onMouseDown={onStart} onTouchStart={onStart}>
        <canvas ref={canvasRef} width={size} height={size} className="rounded-full" />
        <div className="absolute w-6 h-6 rounded-full border-2 border-white shadow-xl transform -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none ring-1 ring-black/20" style={{ left: mainPos.x, top: mainPos.y, backgroundColor: `hsl(${baseColor.h}, ${baseColor.s}%, ${baseColor.l}%)` }} />
        {!isMixing && harmonyColors?.map((c, i) => { const pRaw = getPosFromHSL(c.hsl.h, c.hsl.s, radius); const p = isPrintMode ? clampToGamut(pRaw.x, pRaw.y, radius) : pRaw; return <div key={i} className="absolute w-4 h-4 rounded-full border border-white/40 transform -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none" style={{ left: p.x, top: p.y, backgroundColor: c.hex }} />; })}
    </div>
  );
};

// --- 2. SPECTRAL CURVES (REDUCED SIZE: 220x150) ---
const SpectralCurvesPicker: React.FC<{ baseColor: ColorHSL, onChange: (c: ColorHSL) => void, brightness: number, isMixing: boolean, isPrintMode: boolean }> = ({ baseColor, onChange, brightness, isMixing, isPrintMode }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const width = 220, height = 150;
    
    useEffect(() => {
        const canvas = canvasRef.current; if (!canvas) return; const ctx = canvas.getContext('2d'); if (!ctx) return;
        ctx.clearRect(0, 0, width, height);
        const gradH = ctx.createLinearGradient(0, 0, width, 0); for (let i = 0; i <= 360; i += 60) gradH.addColorStop(i / 360, `hsl(${i}, 100%, 50%)`);
        ctx.fillStyle = gradH; ctx.fillRect(0, 0, width, height);
        const gradS = ctx.createLinearGradient(0, 0, 0, height); gradS.addColorStop(0, 'rgba(255,255,255,0)'); gradS.addColorStop(1, `hsl(0, 0%, ${brightness}%)`);
        ctx.fillStyle = gradS; ctx.fillRect(0, 0, width, height);
        ctx.beginPath(); ctx.moveTo(0, height/2); for (let x = 0; x <= width; x++) { const hue = (x / width) * 360; const rad = (hue - 60) * (Math.PI / 180); const peak = Math.sin(rad * 1.5) * (height * 0.15); ctx.lineTo(x, (height * 0.4) - peak); }
        ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.setLineDash([4, 4]); ctx.lineWidth = 1.5; ctx.stroke(); ctx.setLineDash([]);
        if (isPrintMode) { const limitY = height * (1 - CMYK_GAMUT_SCALE); ctx.beginPath(); ctx.setLineDash([8, 4]); ctx.moveTo(0, limitY); ctx.lineTo(width, limitY); ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)'; ctx.lineWidth = 2; ctx.stroke(); ctx.setLineDash([]); }
    }, [brightness, isPrintMode]);

    const handleInteraction = (cx: number, cy: number) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const hue = (Math.max(0, Math.min(rect.width, cx - rect.left)) / rect.width) * 360;
        let sat = 100 - ((Math.max(0, Math.min(rect.height, cy - rect.top)) / rect.height) * 100); 
        if (isPrintMode) sat = Math.max(0, Math.min(sat, CMYK_GAMUT_SCALE * 100));
        onChange({ h: Math.round(hue), s: Math.round(sat), l: brightness });
    };

    const onStart = (e: any) => { setIsDragging(true); const c = e.touches ? e.touches[0] : e; handleInteraction(c.clientX, c.clientY); };

    useEffect(() => {
        const move = (e: any) => { if (!isDragging) return; if (e.cancelable) e.preventDefault(); const c = e.touches ? e.touches[0] : e; handleInteraction(c.clientX, c.clientY); };
        const up = () => setIsDragging(false);
        if (isDragging) { window.addEventListener('mousemove', move); window.addEventListener('mouseup', up); window.addEventListener('touchmove', move, { passive: false }); window.addEventListener('touchend', up); }
        return () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); window.removeEventListener('touchmove', move); window.removeEventListener('touchend', up); };
    }, [isDragging]);

    const mx = (baseColor.h / 360) * width;
    const my = isPrintMode ? (1 - (Math.min(baseColor.s, CMYK_GAMUT_SCALE * 100) / 100)) * height : (1 - (baseColor.s / 100)) * height;
    return (
        <div ref={containerRef} className={`relative w-[220px] h-[150px] rounded-2xl overflow-hidden shadow-2xl border border-border cursor-crosshair transition-all ${isMixing ? 'opacity-50 blur-sm' : ''}`} style={{ touchAction: 'none' }} onMouseDown={onStart} onTouchStart={onStart}>
            <canvas ref={canvasRef} width={width} height={height} />
            <div className="absolute top-0 bottom-0 w-px bg-accent0 pointer-events-none" style={{ left: mx }} />
            <div className="absolute left-0 right-0 h-px bg-accent0 pointer-events-none" style={{ top: my }} />
            <div className="absolute w-6 h-6 rounded-full border-2 border-white shadow-xl transform -translate-x-1/2 -translate-y-1/2 ring-2 ring-black/20" style={{ left: mx, top: my, backgroundColor: `hsl(${baseColor.h}, ${baseColor.s}%, ${baseColor.l}%)` }} />
            <div className="absolute top-2 left-3 text-[9px] font-bold text-white/40 uppercase tracking-widest pointer-events-none">Hue Map</div>
            <div className="absolute bottom-2 right-3 text-[9px] font-bold text-white/40 uppercase tracking-widest pointer-events-none rotate-270">Saturation</div>
        </div>
    );
};

// --- 3. GAMUT CLOUD (REDUCED SIZE: 220px) ---
const GamutCloudPicker: React.FC<{ baseColor: ColorHSL, onChange: (c: ColorHSL) => void, brightness: number, isMixing: boolean, isPrintMode: boolean }> = ({ baseColor, onChange, brightness, isMixing, isPrintMode }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [rotation, setRotation] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1.1); 
    const particles = useRef<{h: number, s: number, l: number}[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const lastPos = useRef({ x: 0, y: 0 });
    const depth = 200; // Adjusted depth for smaller size
    const size = 220;
    
    useEffect(() => {
        const count = isPrintMode ? 300 : 600;
        const pts = []; for (let i = 0; i < count; i++) pts.push({ h: Math.random() * 360, s: Math.random() * 100, l: Math.random() * 100 });
        particles.current = pts;
    }, [isPrintMode]);

    useEffect(() => {
        const canvas = canvasRef.current; if (!canvas) return; const ctx = canvas.getContext('2d'); if (!ctx) return;
        let frameId: number;
        const render = () => {
            if (!isDragging) setRotation(prev => ({ ...prev, x: (prev.x + (isMixing ? 3 : 0.4)) % 360 }));
            ctx.clearRect(0, 0, size, size); const cx = size/2, cy = size/2;
            const projected = particles.current.map(p => {
                const totalH = (p.h + rotation.x) % 360; const rad = (totalH - 90) * (Math.PI / 180); const r = (p.s / 100) * (size * 0.35) * zoom;
                let x = Math.cos(rad) * r, z = Math.sin(rad) * r, y = (p.l - 50) * 1.5 * zoom; const scale = (depth / (depth + z));
                let visible = isPrintMode ? p.s <= CMYK_GAMUT_SCALE * 100 : true;
                return { x: cx + x * scale, y: cy + y * scale, scale, color: `hsl(${p.h}, ${p.s}%, ${p.l}%)`, z, isSelection: false, visible };
            });
            const selH = (baseColor.h + rotation.x) % 360; const selRad = (selH - 90) * (Math.PI / 180); const selR = (baseColor.s / 100) * (size * 0.35) * zoom;
            const selX = Math.cos(selRad) * selR, selZ = Math.sin(selRad) * selR, selY = (brightness - 50) * 1.5 * zoom;
            const selScale = (depth / (depth + selZ)); projected.push({ x: cx + selX * selScale, y: cy + selY * selScale, scale: selScale, color: '#fff', z: selZ, isSelection: true, visible: true });
            projected.sort((a, b) => b.z - a.z).forEach(p => { if (!p.visible) return; ctx.beginPath(); ctx.fillStyle = p.color; if (p.isSelection) { ctx.arc(p.x, p.y, 10 * p.scale, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = '#000'; ctx.lineWidth = 1; ctx.stroke(); ctx.beginPath(); ctx.arc(p.x, p.y, 5 * p.scale, 0, Math.PI * 2); ctx.fillStyle = '#fff'; ctx.fill(); } else { ctx.arc(p.x, p.y, 2.5 * p.scale, 0, Math.PI * 2); ctx.fill(); } });
            frameId = requestAnimationFrame(render);
        };
        render(); return () => cancelAnimationFrame(frameId);
    }, [isMixing, rotation.x, baseColor, brightness, zoom, isPrintMode, isDragging]);

    const onStart = (e: any) => { setIsDragging(true); const c = e.touches ? e.touches[0] : e; lastPos.current = { x: c.clientX, y: c.clientY }; };

    useEffect(() => {
        const move = (e: any) => { if (!isDragging) return; if (e.cancelable) e.preventDefault(); const c = e.touches ? e.touches[0] : e; const dx = c.clientX - lastPos.current.x; const dy = c.clientY - lastPos.current.y; const newH = (baseColor.h + dx * 0.5) % 360; let newS = baseColor.s - dy * 0.5; if (isPrintMode) newS = Math.max(0, Math.min(newS, CMYK_GAMUT_SCALE * 100)); onChange({ ...baseColor, h: Math.round(newH < 0 ? newH + 360 : newH), s: Math.round(Math.max(0, Math.min(100, newS))) }); lastPos.current = { x: c.clientX, y: c.clientY }; };
        const up = () => setIsDragging(false);
        if (isDragging) { window.addEventListener('mousemove', move); window.addEventListener('mouseup', up); window.addEventListener('touchmove', move, { passive: false }); window.addEventListener('touchend', up); }
        return () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); window.removeEventListener('touchmove', move); window.removeEventListener('touchend', up); };
    }, [isDragging, baseColor, onChange, isPrintMode]);

    return (
        <div ref={containerRef} className="w-[220px] h-[220px] relative flex flex-col items-center" style={{ touchAction: 'none' }}>
             <canvas ref={canvasRef} width={size} height={size} onMouseDown={onStart} onTouchStart={onStart} className="cursor-crosshair" />
             <div className="absolute bottom-1 flex gap-2 items-center z-50 pointer-events-auto transform scale-75">
                <button 
                    onMouseDown={(e) => e.stopPropagation()} 
                    onTouchStart={(e) => e.stopPropagation()}
                    onClick={(e) => { e.stopPropagation(); setZoom(z => Math.min(2.5, z + 0.2)) }} 
                    className="w-10 h-10 bg-secondary text-foreground rounded-lg shadow-xl border border-border flex items-center justify-center hover:bg-accent active:scale-90 transition-all text-xl font-bold"
                >
                    +
                </button>
                <button 
                    onMouseDown={(e) => e.stopPropagation()} 
                    onTouchStart={(e) => e.stopPropagation()}
                    onClick={(e) => { e.stopPropagation(); setZoom(z => Math.max(0.5, z - 0.2)) }} 
                    className="w-10 h-10 bg-secondary text-foreground rounded-lg shadow-xl border border-border flex items-center justify-center hover:bg-accent active:scale-90 transition-all text-xl font-bold"
                >
                    -
                </button>
             </div>
        </div>
    );
};

export default ColorWheel;
