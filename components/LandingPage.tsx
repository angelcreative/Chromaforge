
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { LegalPageType } from './LegalModal';
import { FaStar } from 'react-icons/fa';
import { HiCheck } from 'react-icons/hi';

interface LandingPageProps {
  onGetStarted: () => void;
  onLogin: () => void;
  onOpenLegal: (type: LegalPageType) => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted, onLogin, onOpenLegal }) => {
  
  // Logic to show Product Hunt badge only after Jan 5th, 2026 12:01 AM PST
  const showProductHunt = new Date() >= new Date('2026-01-05T00:01:00-08:00');

  // Hover state for squircles
  const [hoveredSquircle, setHoveredSquircle] = useState<number | null>(null);

  // Color animation for "Color" word
  const colorPalette = [
    '#8B5CF6', // purple
    '#3B82F6', // blue
    '#06B6D4', // cyan
    '#EC4899', // pink
    '#F59E0B', // amber
    '#10B981', // emerald
    '#6366F1', // indigo
    '#EF4444', // red
    '#A855F7', // violet
    '#14B8A6', // teal
    '#F97316', // orange
    '#84CC16', // lime
  ];
  const [currentColorIndex, setCurrentColorIndex] = useState(0);

  // Cambiar color de "Color" cada 2 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentColorIndex((prev) => (prev + 1) % colorPalette.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [colorPalette.length]);

  // Animated Color Squircles Background
  const [squircles, setSquircles] = useState(() => {
    // Generar squircles con posiciones y animaciones aleatorias
    const colorPalettes = [
      { color: '#8B5CF6', name: 'purple' },    // purple-500
      { color: '#3B82F6', name: 'blue' },      // blue-500
      { color: '#06B6D4', name: 'cyan' },     // cyan-500
      { color: '#EC4899', name: 'pink' },     // pink-500
      { color: '#F59E0B', name: 'amber' },    // amber-500
      { color: '#10B981', name: 'emerald' },   // emerald-500
      { color: '#6366F1', name: 'indigo' },   // indigo-500
      { color: '#EF4444', name: 'red' },       // red-500
      { color: '#A855F7', name: 'violet' },   // violet-500
      { color: '#14B8A6', name: 'teal' },     // teal-500
      { color: '#F97316', name: 'orange' },   // orange-500
      { color: '#84CC16', name: 'lime' },     // lime-500
    ];
    
    return colorPalettes.map((palette, i) => ({
      id: i,
      color: palette.color,
      name: palette.name,
      // Posición inicial aleatoria
      x: Math.random() * 100,
      y: Math.random() * 100,
      // Velocidad y dirección - AUMENTADA para más movimiento
      vx: (Math.random() - 0.5) * 0.05,
      vy: (Math.random() - 0.5) * 0.05,
      // Tamaño base y variación - AUMENTADA
      baseSize: 300 + Math.random() * 400,
      sizeVariation: 100 + Math.random() * 200,
      // Rotación - MÁS RÁPIDA
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 1.5,
      // Timing para animación de crecimiento - MÁS RÁPIDA
      growthSpeed: 0.6 + Math.random() * 0.8,
      growthOffset: Math.random() * Math.PI * 2,
    }));
  });

  // Animación loop para squircles (infinito)
  useEffect(() => {
    const animate = () => {
      setSquircles(prev => prev.map(squircle => {
        // Mover squircle
        let newX = squircle.x + squircle.vx;
        let newY = squircle.y + squircle.vy;
        
        // Rebote en bordes
        if (newX < 0 || newX > 100) squircle.vx *= -1;
        if (newY < 0 || newY > 100) squircle.vy *= -1;
        
        // Mantener dentro de límites
        newX = Math.max(0, Math.min(100, newX));
        newY = Math.max(0, Math.min(100, newY));
        
        // Rotar
        const newRotation = squircle.rotation + squircle.rotationSpeed;
        
        return {
          ...squircle,
          x: newX,
          y: newY,
          rotation: newRotation,
        };
      }));
    };
    
    const interval = setInterval(animate, 30); // 33fps para animación más fluida
    return () => clearInterval(interval);
  }, []);

  // Scroll Animation Hook - Optimized with useRef
  const [visibleElements, setVisibleElements] = useState<Set<string>>(new Set());
  const observerRef = useRef<IntersectionObserver | null>(null);
  
  useEffect(() => {
    if (observerRef.current) return; // Evitar crear múltiples observers
    
    const observerOptions = {
      root: null,
      rootMargin: '50px',
      threshold: 0.1
    };

    observerRef.current = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const elementId = entry.target.getAttribute('data-scroll-id');
          if (elementId) {
            setVisibleElements(prev => {
              if (prev.has(elementId)) return prev; // Evitar re-renders innecesarios
              return new Set(prev).add(elementId);
            });
          }
        }
      });
    }, observerOptions);

    const elements = document.querySelectorAll('[data-scroll-id]');
    elements.forEach(el => observerRef.current?.observe(el));

    return () => {
      elements.forEach(el => observerRef.current?.unobserve(el));
      observerRef.current?.disconnect();
      observerRef.current = null;
    };
  }, []);

  const features = [
      {
          title: "AI Palette Generator",
          desc: "Describe a mood, brand, or constraint. ChromaForge builds perceptually balanced, semantically structured scales instantly.",
          img: "/ai-palette-generation.png"
      },
      {
          title: "Contrast & Accessibility",
          desc: "Instant WCAG / APCA contrast grids across your entire scale, including dark mode combinations.",
          img: "/contrast-and-accessibility.png"
      },
      {
          title: "Fine Tuning",
          desc: "Adjust saturation curves and hue shifting with precision to perfect your color ramp.",
          img: "/fine-tuning.png"
      },
      {
          title: "Production Ready",
          desc: "Export to Tailwind, CSS Vars, SCSS, JSON, and more. No manual cleanup required.",
          img: "/production-ready.png"
      },
      {
          title: "Semantic Token Engine",
          desc: "Not just colors — meaningful tokens. Brand, neutrals, and system colors generated with consistent intent.",
          img: "/semantic-token-engine.png"
      },
      {
          title: "3D Color Analysis",
          desc: "Visualize hue rotation, saturation curves, and lightness distribution to detect gaps and collisions.",
          img: "/3d-color-analysis.png"
      }
  ];

  const testimonials = [
      {
          name: "Alex Rivera",
          role: "Frontend Lead",
          text: "ChromaForge is just fantastic! I used to spend hours tweaking HSL values manually. Now I generate accessible, production-ready scales in minutes. The Tailwind export is literally copy-paste perfection.",
          stars: 5
      },
      {
          name: "Sarah Jenkins",
          role: "Product Designer",
          text: "Finally, a tool that understands 'Design Systems' and not just 'Color Palettes'. The semantic token engine saved our team a week of debate on naming conventions.",
          stars: 5
      },
      {
          name: "Davide M.",
          role: "Indie Hacker",
          text: "I'm not a designer, but ChromaForge makes my apps look like they were built by a pro agency. The contrast checker built right into the flow is a lifesaver.",
          stars: 5
      },
      {
          name: "Elena K.",
          role: "UI Engineer",
          text: "The 3D visualization blew my mind. I immediately saw where our old brand colors were clashing. It's the only tool I use to sanity-check my color math now.",
          stars: 4
      },
      {
          name: "Marcus Chen",
          role: "Design Systems Lead",
          text: "Verified Purchase? More like Verified Life-Saver. The Figma plugin sync keeps our design and dev teams perfectly aligned without the usual handoff friction. Strongly recommend!",
          stars: 5
      }
  ];

  const StarIcon = () => (
      <FaStar className="w-4 h-4 text-yellow-400 fill-current drop-shadow-[0_0_8px_rgba(250,204,21,0.4)]" />
  );

  return (
    <div className="min-h-screen bg-[#020617] text-white overflow-x-hidden relative selection:bg-indigo-500/30 font-sans">
      
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex justify-between items-center px-6 md:px-12 py-5 bg-[#020617]/90 backdrop-blur-md border-b border-white/5">
        <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded bg-indigo-600 shadow-[0_0_15px_rgba(79,70,229,0.5)]"></div>
            <span className="text-lg font-bold tracking-tight text-white">ChromaForge</span>
        </div>
        <div className="flex gap-4 items-center">
            {showProductHunt && (
                <a 
                    href="https://www.producthunt.com/products/chromaforge?embed=true&utm_source=badge-featured&utm_medium=badge&utm_campaign=badge-chromaforge" 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:opacity-90 transition-opacity"
                >
                    <img 
                        src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=1056702&theme=dark&t=1767209901531" 
                        alt="ChromaForge - Build semantic color tokens in seconds | Product Hunt" 
                        loading="lazy"
                        style={{ width: '130px', height: '28px' }} 
                        width="130" 
                        height="28" 
                    />
                </a>
            )}
            <button onClick={onLogin} className="text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-white transition-colors">Log In</button>
            <button onClick={onGetStarted} className="bg-white text-slate-950 px-5 py-2 rounded-lg text-sm font-bold hover:bg-indigo-50 transition-colors shadow-lg shadow-white/5">Sign Up</button>
        </div>
      </nav>

      {/* 1. HERO SECTION */}
      <div className="relative w-full pt-48 pb-24 flex flex-col items-center bg-[#020617] overflow-hidden">
        
        {/* Animated Color Squircles Background */}
        <div className="absolute inset-0 w-full h-full z-[2] overflow-hidden">
          {squircles.map((squircle) => {
            const currentTime = Date.now() / 1000;
            const baseSize = squircle.baseSize + Math.sin(currentTime * squircle.growthSpeed + squircle.growthOffset) * squircle.sizeVariation;
            const isHovered = hoveredSquircle === squircle.id;
            
            // Efectos de hover
            const hoverScale = isHovered ? 1.3 : 1;
            const hoverBlur = isHovered ? 30 : 60; // Reducir blur al hover
            const hoverOpacity = isHovered ? 0.9 : 0.6; // Más opaco al hover
            const hoverRotation = isHovered ? squircle.rotation * 1.5 : squircle.rotation; // Rotar más rápido al hover
            
            return (
              <div
                key={squircle.id}
                className="absolute cursor-pointer"
                onMouseEnter={() => setHoveredSquircle(squircle.id)}
                onMouseLeave={() => setHoveredSquircle(null)}
                style={{
                  left: `${squircle.x}%`,
                  top: `${squircle.y}%`,
                  width: `${baseSize * hoverScale}px`,
                  height: `${baseSize * hoverScale}px`,
                  background: `radial-gradient(ellipse at center, ${squircle.color} 0%, ${squircle.color}00 70%)`,
                  borderRadius: '30%', // Squircle effect
                  filter: `blur(${hoverBlur}px)`,
                  transform: `translate(-50%, -50%) rotate(${hoverRotation}deg) scale(${hoverScale})`,
                  mixBlendMode: 'screen',
                  opacity: hoverOpacity,
                  willChange: 'transform, width, height, filter, opacity',
                  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                  zIndex: isHovered ? 10 : 1,
                  pointerEvents: 'auto', // Asegurar que el hover funcione
                }}
              />
            );
          })}
          
          {/* Capa adicional para suavizar combinaciones */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#020617]/30 via-[#020617]/10 to-[#020617]/30 pointer-events-none" />
        </div>
        
        {/* Subtle overlay for text readability */}
        <div className="absolute inset-0 bg-[#020617]/30 z-[1] pointer-events-none"></div>
        
        {/* Background Atmosphere */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-[1]">
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 mix-blend-overlay"></div>
        </div>

        {/* TEXT CONTENT - Delante de los squircles */}
        <div className="relative z-[3] px-6 md:px-12 w-full flex flex-col items-center text-center pt-20">
            
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-extrabold tracking-tight mb-8 leading-[1.05] animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100 text-white">
                Master <span 
                    className="transition-colors duration-1000 ease-in-out"
                    style={{ 
                        color: colorPalette[currentColorIndex]
                    }}
                >Color</span> <br/>
                <span className="text-white">Architecture.</span>
            </h1>
            
            <h2 className="text-xl md:text-2xl text-white max-w-2xl mx-auto mb-12 leading-relaxed font-semibold animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
                The definitive token engine for modern design systems. Generate semantically correct color scales, analyze them in 3D space, and export production-ready tokens.
            </h2>
        </div>

        {/* Botón - Encima de todo y clicable */}
        <div className="relative z-[10] px-6 md:px-12 w-full flex flex-col items-center">
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300 mb-20">
                <button 
                    onClick={onGetStarted}
                    className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-base shadow-[0_0_30px_rgba(79,70,229,0.3)] transition-all hover:scale-105 active:scale-95 border border-indigo-400/20 backdrop-blur-sm pointer-events-auto"
                    style={{ zIndex: 11 }}
                >
                    Start Building Free
                </button>
            </div>
        </div>
      </div>

      {/* 2. PROOF OF VALUE (Problem Statement) */}
      <div className="py-32 border-y border-white/5 bg-slate-950/50">
          <div className="max-w-4xl mx-auto px-6 text-center">
              <h3 
                data-scroll-id="proof-title"
                className={`text-3xl md:text-5xl font-bold text-white mb-8 tracking-tight transition-all duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                  visibleElements.has('proof-title') 
                    ? 'opacity-100 translate-y-0' 
                    : 'opacity-0 translate-y-6'
                }`}
              >
                  Color systems break silently.<br/>
                  <span className="text-slate-600">Until production.</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left mt-16">
                  {[
                    { title: 'Broken in Code', desc: 'Most palettes look fine in Figma but fail when implemented in CSS/Tailwind due to naming inconsistencies.' },
                    { title: 'Zero Semantics', desc: 'Raw hex codes provide no context. Is this blue for primary actions or information alerts?' },
                    { title: 'Accessibility Last', desc: 'Contrast issues are usually ignored until the final audit. We validate them instantly.' }
                  ].map((item, idx) => (
                    <div 
                      key={idx}
                      data-scroll-id={`proof-card-${idx}`}
                      className={`p-6 border-l border-indigo-500/50 transition-all duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                        visibleElements.has(`proof-card-${idx}`)
                          ? 'opacity-100 translate-y-0'
                          : 'opacity-0 translate-y-6'
                      }`}
                      style={{ transitionDelay: `${100 * (idx + 1)}ms` }}
                    >
                        <h4 className="font-bold text-white mb-2">{item.title}</h4>
                        <p className="text-sm text-slate-400">{item.desc}</p>
                    </div>
                  ))}
              </div>
              <p 
                data-scroll-id="proof-footer"
                className={`mt-16 text-slate-500 font-mono text-sm transition-all duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                  visibleElements.has('proof-footer')
                    ? 'opacity-100 translate-y-0'
                    : 'opacity-0 translate-y-4'
                }`}
                style={{ transitionDelay: '400ms' }}
              >
                ChromaForge exists to turn color into infrastructure, not decoration.
              </p>
          </div>
      </div>

      {/* 3. CORE FEATURES */}
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-32">
        <div className="mb-16">
             <div 
               data-scroll-id="features-badge"
               className={`inline-block px-3 py-1 mb-4 border border-indigo-500/30 rounded-full bg-indigo-500/10 text-indigo-400 text-[10px] font-bold uppercase tracking-widest transition-all duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                 visibleElements.has('features-badge')
                   ? 'opacity-100 translate-y-0'
                   : 'opacity-0 translate-y-4'
               }`}
             >
               Core Infrastructure
             </div>
             <h2 
               data-scroll-id="features-title"
               className={`text-3xl md:text-4xl font-bold text-white max-w-2xl transition-all duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                 visibleElements.has('features-title')
                   ? 'opacity-100 translate-y-0'
                   : 'opacity-0 translate-y-6'
               }`}
               style={{ transitionDelay: '100ms' }}
             >
               Not just a generator.<br/>A complete engineering tool.
             </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 glow-cards-container">
            {features.map((feature, idx) => (
                <div 
                  key={idx} 
                  data-scroll-id={`feature-card-${idx}`}
                  className={`aspect-[4/3] glow-card rounded-3xl group overflow-hidden transition-all duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                    visibleElements.has(`feature-card-${idx}`)
                      ? 'opacity-100 translate-y-0'
                      : 'opacity-0 translate-y-8'
                  }`}
                  style={{ transitionDelay: `${120 * (idx + 1)}ms` }}
                >
                    <div className="glow-content bg-slate-950 rounded-[calc(1.5rem-1px)] flex flex-col relative border border-white/5">
                        {/* Image Area */}
                        <div className="flex-1 relative bg-slate-900/50 overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent z-10"></div>
                            <img 
                                src={feature.img} 
                                alt={feature.title}
                                loading="lazy"
                                className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700 ease-out"
                            />
                        </div>
                        {/* Text Area */}
                        <div className="p-8 shrink-0 bg-slate-950 z-20 border-t border-white/5 relative">
                            <h3 className="text-lg font-bold text-white mb-2">{feature.title}</h3>
                            <p className="text-sm text-slate-400 leading-relaxed">{feature.desc}</p>
                        </div>
                    </div>
                </div>
            ))}
        </div>
      </div>

      {/* 4. FIGMA PLUGIN */}
      <div className="py-32 border-y border-white/5 bg-slate-900/20 overflow-hidden">
          <div className="max-w-7xl mx-auto px-6 md:px-12 flex flex-col md:flex-row items-center gap-16">
              <div 
                data-scroll-id="figma-content"
                className={`flex-1 space-y-8 transition-all duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                  visibleElements.has('figma-content')
                    ? 'opacity-100 translate-x-0'
                    : 'opacity-0 -translate-x-8'
                }`}
              >
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-[10px] font-bold uppercase tracking-widest">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </span>
                        Now Available
                  </div>
                  <h2 className="text-4xl md:text-5xl font-bold text-white leading-tight">
                      Bring the engine <br/>
                      <span className="text-slate-500">directly into Figma.</span>
                  </h2>
                  <p className="text-lg text-slate-400 max-w-lg">
                      Sync your tokens instantly. Edit curves, check contrast, and update your local variables without leaving your design canvas.
                  </p>
                  <a 
                    href="https://www.figma.com/community/plugin/1587587067704412099/chroma-forge"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-8 py-4 bg-white text-black hover:bg-slate-200 rounded-xl font-bold flex items-center gap-2 transition-colors w-fit"
                  >
                      <svg className="w-5 h-5" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path fillRule="evenodd" clipRule="evenodd" d="M16 16C16 13.5147 18.0147 11.5 20.5 11.5C22.9853 11.5 25 13.5147 25 16C25 18.4853 22.9853 20.5 20.5 20.5C18.0147 20.5 16 18.4853 16 16Z" fill="#1ABCFE"/>
                        <path fillRule="evenodd" clipRule="evenodd" d="M7 25C7 22.5147 9.01472 20.5 11.5 20.5H16V25C16 27.4853 13.9853 29.5 11.5 29.5C9.01472 29.5 7 27.4853 7 25Z" fill="#0ACF83"/>
                        <path fillRule="evenodd" clipRule="evenodd" d="M16 2.5V11.5H20.5C22.9853 11.5 25 9.48528 25 7C25 4.51472 22.9853 2.5 20.5 2.5H16Z" fill="#FF7262"/>
                        <path fillRule="evenodd" clipRule="evenodd" d="M7 7C7 9.48528 9.01472 11.5 11.5 11.5H16V2.5H11.5C9.01472 2.5 7 4.51472 7 7Z" fill="#F24E1E"/>
                        <path fillRule="evenodd" clipRule="evenodd" d="M7 16C7 18.4853 9.01472 20.5 11.5 20.5H16V11.5H11.5C9.01472 11.5 7 13.5147 7 16Z" fill="#A259FF"/>
                      </svg>
                      Start using plugin
                  </a>
              </div>
              <div 
                data-scroll-id="figma-image"
                className={`flex-1 relative w-full max-w-xl group perspective-1000 transition-all duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                  visibleElements.has('figma-image')
                    ? 'opacity-100 translate-x-0'
                    : 'opacity-0 translate-x-8'
                }`}
                style={{ transitionDelay: '200ms' }}
              >
                  <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-2xl blur-xl opacity-30 group-hover:opacity-50 transition duration-1000"></div>
                  <div className="relative rounded-2xl border border-white/10 bg-slate-950 shadow-2xl overflow-hidden aspect-[4/3] transform group-hover:rotate-y-2 transition-transform duration-700 ease-out">
                      <img 
                        src="/figma-plugin.png" 
                        alt="Figma Plugin Interface"
                        loading="lazy"
                        className="w-full h-full object-cover"
                      />
                  </div>
              </div>
          </div>
      </div>

      {/* 5. PRODUCTION READY (Code Snippet) */}
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-32 flex flex-col lg:flex-row items-center gap-16">
          <div 
            data-scroll-id="production-content"
            className={`flex-1 transition-all duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)] ${
              visibleElements.has('production-content')
                ? 'opacity-100 translate-x-0'
                : 'opacity-0 -translate-x-8'
            }`}
          >
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Built to plug straight into real production environments.</h2>
              <p className="text-slate-400 text-lg mb-8">No lock-in. Your tokens, your stack. We generate standard formats that work with your existing tools.</p>
              
              <div className="grid grid-cols-2 gap-4">
                  {['Tailwind CSS', 'CSS Variables', 'SCSS / SASS', 'JSON Design Tokens', 'Figma Variables', 'Adobe ASE'].map((item, idx) => (
                      <div 
                        key={item} 
                        className={`flex items-center gap-2 text-sm text-slate-300 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                          visibleElements.has('production-content')
                            ? 'opacity-100 translate-x-0'
                            : 'opacity-0 translate-x-4'
                        }`}
                        style={{ transitionDelay: `${50 * idx}ms` }}
                      >
                          <HiCheck className="w-4 h-4 text-green-400" />
                          {item}
                      </div>
                  ))}
              </div>
          </div>
          
          <div 
            data-scroll-id="production-code"
            className={`flex-1 w-full max-w-lg transition-all duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)] ${
              visibleElements.has('production-code')
                ? 'opacity-100 translate-x-0'
                : 'opacity-0 translate-x-8'
            }`}
            style={{ transitionDelay: '200ms' }}
          >
              <div className="bg-slate-950 rounded-xl border border-white/10 p-6 font-mono text-xs md:text-sm text-slate-300 shadow-2xl overflow-x-auto">
<pre>{`export const theme = {
  colors: {
    primary: {
      50: '#eff6ff',
      100: '#dbeafe',
      500: '#3b82f6',
      900: '#1e3a8a'
    },
    neutral: {
      50: '#f8fafc',
      900: '#0f172a'
    },
    semantic: {
      success: '#22c55e',
      error: '#ef4444'
    }
  }
};`}</pre>
              </div>
          </div>
      </div>

      {/* 5.5 SOCIAL PROOF / TESTIMONIALS */}
      <div className="py-24 bg-gradient-to-b from-[#020617] to-slate-950 border-t border-white/5 relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent"></div>
          
          <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
              <div className="text-center mb-16">
                  <h2 
                    data-scroll-id="testimonials-title"
                    className={`text-3xl md:text-5xl font-bold text-white mb-6 transition-all duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                      visibleElements.has('testimonials-title')
                        ? 'opacity-100 translate-y-0'
                        : 'opacity-0 translate-y-6'
                    }`}
                  >
                      Customers can't stop raving about<br/>
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">the time they save.</span>
                  </h2>
                  <p 
                    data-scroll-id="testimonials-subtitle"
                    className={`text-slate-400 max-w-2xl mx-auto transition-all duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                      visibleElements.has('testimonials-subtitle')
                        ? 'opacity-100 translate-y-0'
                        : 'opacity-0 translate-y-4'
                    }`}
                    style={{ transitionDelay: '150ms' }}
                  >
                    Join fellow designers and engineers who have switched from manual color picking to automated architecture.
                  </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {testimonials.map((t, i) => (
                      <div 
                        key={i} 
                        data-scroll-id={`testimonial-${i}`}
                        className={`bg-slate-900/50 border border-slate-800 p-6 rounded-2xl flex flex-col justify-between hover:border-slate-700 transition-all duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                          i >= 3 ? 'lg:col-span-1 lg:translate-x-1/2' : ''
                        } ${
                          visibleElements.has(`testimonial-${i}`)
                            ? 'opacity-100 translate-y-0'
                            : 'opacity-0 translate-y-8'
                        }`}
                        style={{ transitionDelay: `${100 * (i + 1)}ms` }}
                      >
                          <div>
                              <div className="flex gap-1 mb-4">
                                  {[...Array(5)].map((_, si) => (
                                      si < t.stars ? <StarIcon key={si} /> : <div key={si} className="w-4 h-4" />
                                  ))}
                              </div>
                              <p className="text-slate-300 text-sm leading-relaxed mb-6">"{t.text}"</p>
                          </div>
                          
                          <div className="flex items-center gap-3 pt-6 border-t border-white/5">
                              <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-slate-300">
                                  {t.name.split(' ').map(n => n[0]).join('')}
                              </div>
                              <div className="flex-1 min-w-0">
                                  <h4 className="text-white font-bold text-sm truncate">{t.name}</h4>
                                  <p className="text-slate-500 text-xs truncate">{t.role}</p>
                              </div>
                              <div className="flex items-center gap-1 text-[10px] font-bold text-green-400 bg-green-500/10 px-2 py-1 rounded-full border border-green-500/20 shrink-0">
                                  <HiCheck className="w-3 h-3" />
                                  Verified
                              </div>
                          </div>
                      </div>
                  ))}
              </div>
          </div>
      </div>

      {/* 6. WHO IT'S FOR */}
      <div className="py-24 bg-slate-900/30 border-y border-white/5">
          <div className="max-w-4xl mx-auto px-6 text-center">
              <h2 
                data-scroll-id="who-title"
                className={`text-2xl font-bold text-white mb-12 transition-all duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                  visibleElements.has('who-title')
                    ? 'opacity-100 translate-y-0'
                    : 'opacity-0 translate-y-6'
                }`}
              >
                Built for teams who care about systems
              </h2>
              <div className="flex flex-wrap justify-center gap-4">
                  {['Design System Teams', 'Product Designers', 'Frontend Engineers', 'Design Engineers'].map((badge, idx) => (
                    <span 
                      key={idx}
                      data-scroll-id={`who-badge-${idx}`}
                      className={`px-6 py-3 rounded-full border border-slate-700 bg-slate-950 text-slate-300 font-medium transition-all duration-800 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                        visibleElements.has(`who-badge-${idx}`)
                          ? 'opacity-100 translate-y-0 scale-100'
                          : 'opacity-0 translate-y-4 scale-95'
                      }`}
                      style={{ transitionDelay: `${80 * (idx + 1)}ms` }}
                    >
                      {badge}
                    </span>
                  ))}
              </div>
          </div>
      </div>

      {/* 7. FINAL CTA */}
      <div className="py-32 px-6 text-center">
          <h2 
            data-scroll-id="cta-title"
            className={`text-4xl md:text-5xl font-bold text-white mb-6 transition-all duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)] ${
              visibleElements.has('cta-title')
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 translate-y-6'
            }`}
          >
              Design color like infrastructure.<br/>
              <span className="text-slate-600">Not like decoration.</span>
          </h2>
          <div className="flex flex-col items-center gap-4 mt-10">
              <button 
                data-scroll-id="cta-button"
                onClick={onGetStarted}
                className={`px-10 py-5 bg-white text-slate-950 rounded-xl font-bold text-lg shadow-[0_0_40px_rgba(255,255,255,0.1)] hover:scale-105 transition-all duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                  visibleElements.has('cta-button')
                    ? 'opacity-100 translate-y-0 scale-100'
                    : 'opacity-0 translate-y-4 scale-95'
                }`}
                style={{ transitionDelay: '200ms' }}
              >
                  Start Building for Free
              </button>
              <span 
                data-scroll-id="cta-subtitle"
                className={`text-xs text-slate-500 uppercase tracking-widest font-bold transition-all duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                  visibleElements.has('cta-subtitle')
                    ? 'opacity-100 translate-y-0'
                    : 'opacity-0 translate-y-4'
                }`}
                style={{ transitionDelay: '300ms' }}
              >
                No credit card required
              </span>
          </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12 text-center text-slate-600 text-sm">
          <div className="flex flex-wrap justify-center gap-6 mb-6">
              <button onClick={() => onOpenLegal('terms')} className="hover:text-white transition-colors">Terms of Service</button>
              <button onClick={() => onOpenLegal('privacy')} className="hover:text-white transition-colors">Privacy Policy</button>
              <button onClick={() => onOpenLegal('cookies')} className="hover:text-white transition-colors">Cookie Policy</button>
              <button onClick={() => onOpenLegal('refunds')} className="hover:text-white transition-colors">Refund Policy</button>
          </div>
          <p>© 2024 ChromaForge. Built for Designers & Developers.</p>
      </footer>

    </div>
  );
};

export default LandingPage;
