
import React, { useState, useEffect } from 'react';
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

  // Carousel State
  const [currentSlide, setCurrentSlide] = useState(0);
  const totalSlides = 8;
  const slideDuration = 5000; // 5 seconds per slide

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % totalSlides);
    }, slideDuration);
    return () => clearInterval(timer);
  }, []);

  const features = [
      {
          title: "AI Palette Generator",
          desc: "Describe a mood, brand, or constraint. ChromaForge builds perceptually balanced, semantically structured scales instantly.",
          img: "/public/ai-palette-generation.png"
      },
      {
          title: "Contrast & Accessibility",
          desc: "Instant WCAG / APCA contrast grids across your entire scale, including dark mode combinations.",
          img: "/public/contrast-and-accessibility.png"
      },
      {
          title: "Fine Tuning",
          desc: "Adjust saturation curves and hue shifting with precision to perfect your color ramp.",
          img: "/public/fine-tuning.png"
      },
      {
          title: "Production Ready",
          desc: "Export to Tailwind, CSS Vars, SCSS, JSON, and more. No manual cleanup required.",
          img: "/public/production-ready.png"
      },
      {
          title: "Semantic Token Engine",
          desc: "Not just colors — meaningful tokens. Brand, neutrals, and system colors generated with consistent intent.",
          img: "/public/semantic-token-engine.png"
      },
      {
          title: "3D Color Analysis",
          desc: "Visualize hue rotation, saturation curves, and lightness distribution to detect gaps and collisions.",
          img: "/public/3d-color-analysis.png"
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
        <div className="flex gap-6 items-center">
            <button onClick={onLogin} className="text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-white transition-colors">Log In</button>
            <button onClick={onGetStarted} className="bg-white text-slate-950 px-5 py-2 rounded-lg text-sm font-bold hover:bg-indigo-50 transition-colors shadow-lg shadow-white/5">Sign Up</button>
        </div>
      </nav>

      {/* 1. HERO SECTION */}
      <div className="relative w-full pt-32 pb-24 flex flex-col items-center bg-[#020617] overflow-hidden">
        
        {/* Background Atmosphere */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[80vw] h-[600px] bg-indigo-600/10 rounded-full blur-[120px]"></div>
            <div className="absolute bottom-0 right-0 w-[40vw] h-[500px] bg-purple-600/5 rounded-full blur-[100px]"></div>
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay"></div>
        </div>

        {/* TEXT CONTENT */}
        <div className="relative z-10 px-6 md:px-12 w-full flex flex-col items-center text-center">
            
            {showProductHunt && (
                <a 
                    href="https://www.producthunt.com/products/chromaforge?embed=true&utm_source=badge-featured&utm_medium=badge&utm_campaign=badge-chromaforge" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="mb-8 animate-in fade-in zoom-in duration-700 hover:opacity-90 transition-opacity"
                >
                    <img 
                        src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=1056702&theme=dark&t=1767209901531" 
                        alt="ChromaForge - Build semantic color tokens in seconds | Product Hunt" 
                        style={{ width: '250px', height: '54px' }} 
                        width="250" 
                        height="54" 
                    />
                </a>
            )}
            
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-8 leading-[1.05] animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100 drop-shadow-2xl">
                Master Color <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-slate-100 via-white to-slate-300">Architecture.</span>
            </h1>
            
            <h2 className="text-xl md:text-2xl text-slate-200 max-w-2xl mx-auto mb-12 leading-relaxed font-light animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200 drop-shadow-lg text-shadow">
                The definitive token engine for modern design systems. Generate semantically correct color scales, analyze them in 3D space, and export production-ready tokens.
            </h2>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300 mb-20">
                <button 
                    onClick={onGetStarted}
                    className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-base shadow-[0_0_30px_rgba(79,70,229,0.3)] transition-all hover:scale-105 active:scale-95 border border-indigo-400/20 backdrop-blur-sm"
                >
                    Start Building Free
                </button>
            </div>

            {/* CAROUSEL DISPLAY - Clean, Large View */}
            {/* Reduced max-width to 70vw as requested */}
            <div className="w-full max-w-[70vw] mx-auto animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-500 mt-8">
                <div className="relative rounded-3xl border border-white/10 shadow-2xl bg-slate-950 overflow-hidden aspect-video group">
                    
                    {/* Slides */}
                    <div className="absolute inset-0 bg-slate-950">
                        {[...Array(totalSlides)].map((_, index) => (
                            <div 
                                key={index}
                                className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
                            >
                                <img
                                    src={`/public/carousel/${index + 1}.jpg`}
                                    alt={`Feature Preview ${index + 1}`}
                                    className="w-full h-full object-contain"
                                />
                                {/* Subtle gradient overlay for better integration */}
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/20 to-transparent pointer-events-none"></div>
                            </div>
                        ))}
                    </div>

                    {/* Timeline Progress Bar */}
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-800/50 z-30">
                        <div 
                            key={currentSlide}
                            className="h-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.8)] animate-progress origin-left"
                            style={{ animationDuration: `${slideDuration}ms` }}
                        ></div>
                    </div>
                </div>
                
                {/* Reflection/Glow below carousel */}
                <div className="absolute -bottom-10 left-10 right-10 h-32 bg-indigo-500/10 blur-[80px] -z-10 rounded-full"></div>
            </div>

        </div>
      </div>

      {/* 2. PROOF OF VALUE (Problem Statement) */}
      <div className="py-32 border-y border-white/5 bg-slate-950/50">
          <div className="max-w-4xl mx-auto px-6 text-center">
              <h3 className="text-3xl md:text-5xl font-bold text-white mb-8 tracking-tight">
                  Color systems break silently.<br/>
                  <span className="text-slate-600">Until production.</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left mt-16">
                  <div className="p-6 border-l border-indigo-500/50">
                      <h4 className="font-bold text-white mb-2">Broken in Code</h4>
                      <p className="text-sm text-slate-400">Most palettes look fine in Figma but fail when implemented in CSS/Tailwind due to naming inconsistencies.</p>
                  </div>
                  <div className="p-6 border-l border-indigo-500/50">
                      <h4 className="font-bold text-white mb-2">Zero Semantics</h4>
                      <p className="text-sm text-slate-400">Raw hex codes provide no context. Is this blue for primary actions or information alerts?</p>
                  </div>
                  <div className="p-6 border-l border-indigo-500/50">
                      <h4 className="font-bold text-white mb-2">Accessibility Last</h4>
                      <p className="text-sm text-slate-400">Contrast issues are usually ignored until the final audit. We validate them instantly.</p>
                  </div>
              </div>
              <p className="mt-16 text-slate-500 font-mono text-sm">ChromaForge exists to turn color into infrastructure, not decoration.</p>
          </div>
      </div>

      {/* 3. CORE FEATURES */}
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-32">
        <div className="mb-16">
             <div className="inline-block px-3 py-1 mb-4 border border-indigo-500/30 rounded-full bg-indigo-500/10 text-indigo-400 text-[10px] font-bold uppercase tracking-widest">Core Infrastructure</div>
             <h2 className="text-3xl md:text-4xl font-bold text-white max-w-2xl">Not just a generator.<br/>A complete engineering tool.</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 glow-cards-container">
            {features.map((feature, idx) => (
                <div key={idx} className="aspect-[4/3] glow-card rounded-3xl group overflow-hidden">
                    <div className="glow-content bg-slate-950 rounded-[calc(1.5rem-1px)] flex flex-col relative border border-white/5">
                        {/* Image Area */}
                        <div className="flex-1 relative bg-slate-900/50 overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent z-10"></div>
                            <img 
                                src={feature.img} 
                                alt={feature.title} 
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
              <div className="flex-1 space-y-8">
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
              <div className="flex-1 relative w-full max-w-xl group perspective-1000">
                  <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-2xl blur-xl opacity-30 group-hover:opacity-50 transition duration-1000"></div>
                  <div className="relative rounded-2xl border border-white/10 bg-slate-950 shadow-2xl overflow-hidden aspect-[4/3] transform group-hover:rotate-y-2 transition-transform duration-700 ease-out">
                      <img 
                        src="/public/figma-plugin.png" 
                        alt="Figma Plugin Interface" 
                        className="w-full h-full object-cover"
                      />
                  </div>
              </div>
          </div>
      </div>

      {/* 5. PRODUCTION READY (Code Snippet) */}
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-32 flex flex-col lg:flex-row items-center gap-16">
          <div className="flex-1">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Built to plug straight into real production environments.</h2>
              <p className="text-slate-400 text-lg mb-8">No lock-in. Your tokens, your stack. We generate standard formats that work with your existing tools.</p>
              
              <div className="grid grid-cols-2 gap-4">
                  {['Tailwind CSS', 'CSS Variables', 'SCSS / SASS', 'JSON Design Tokens', 'Figma Variables', 'Adobe ASE'].map(item => (
                      <div key={item} className="flex items-center gap-2 text-sm text-slate-300">
                          <HiCheck className="w-4 h-4 text-green-400" />
                          {item}
                      </div>
                  ))}
              </div>
          </div>
          
          <div className="flex-1 w-full max-w-lg">
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
                  <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
                      Customers can't stop raving about<br/>
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">the time they save.</span>
                  </h2>
                  <p className="text-slate-400 max-w-2xl mx-auto">Join fellow designers and engineers who have switched from manual color picking to automated architecture.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {testimonials.map((t, i) => (
                      <div 
                        key={i} 
                        className={`bg-slate-900/50 border border-slate-800 p-6 rounded-2xl flex flex-col justify-between hover:border-slate-700 transition-colors ${i >= 3 ? 'lg:col-span-1 lg:translate-x-1/2' : ''}`}
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
              <h2 className="text-2xl font-bold text-white mb-12">Built for teams who care about systems</h2>
              <div className="flex flex-wrap justify-center gap-4">
                  <span className="px-6 py-3 rounded-full border border-slate-700 bg-slate-950 text-slate-300 font-medium">Design System Teams</span>
                  <span className="px-6 py-3 rounded-full border border-slate-700 bg-slate-950 text-slate-300 font-medium">Product Designers</span>
                  <span className="px-6 py-3 rounded-full border border-slate-700 bg-slate-950 text-slate-300 font-medium">Frontend Engineers</span>
                  <span className="px-6 py-3 rounded-full border border-slate-700 bg-slate-950 text-slate-300 font-medium">Design Engineers</span>
              </div>
          </div>
      </div>

      {/* 7. FINAL CTA */}
      <div className="py-32 px-6 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Design color like infrastructure.<br/>
              <span className="text-slate-600">Not like decoration.</span>
          </h2>
          <div className="flex flex-col items-center gap-4 mt-10">
              <button 
                onClick={onGetStarted}
                className="px-10 py-5 bg-white text-slate-950 rounded-xl font-bold text-lg shadow-[0_0_40px_rgba(255,255,255,0.1)] hover:scale-105 transition-transform"
              >
                  Start Building for Free
              </button>
              <span className="text-xs text-slate-500 uppercase tracking-widest font-bold">No credit card required</span>
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
