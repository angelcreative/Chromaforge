
import React from 'react';
import { HiX, HiCheck, HiPencil, HiAdjustments, HiDownload, HiArrowRight } from 'react-icons/hi';
import { FaBolt } from 'react-icons/fa';

export type LimitType = 'save' | 'ai' | 'export' | 'tuner' | 'edit' | 'general';

interface PricingModalProps {
  onClose: () => void;
  onCheckout: () => void;
  isLoading: boolean;
  limitType?: LimitType; // Optional, defaults to 'general' (voluntary upgrade)
  currentUsage?: number; // Pass the usage that triggered it
}

const PricingModal: React.FC<PricingModalProps> = ({ onClose, onCheckout, isLoading, limitType = 'general', currentUsage = 5 }) => {
  
  // --- Dynamic Content Strategy ---
  const getContent = () => {
      switch (limitType) {
          case 'save':
              return {
                  title: "Lifetime Limit Reached",
                  icon: (
                    <HiCheck className="w-8 h-8 text-indigo-400" />
                  ),
                  intro: `You've crafted ${currentUsage} beautiful palettes! 🎨`,
                  desc: "To keep things fair, this limit counts every palette you've ever created, even the ones you've deleted. It's like a sketchbook with 5 pages—once used, they're used."
              };
          case 'ai':
              return {
                  title: "AI Limit Reached",
                  icon: (
                    <FaBolt className="w-8 h-8 text-indigo-400" />
                  ),
                  intro: `You've generated ${currentUsage} AI palettes! 🤖`,
                  desc: "Our AI designer has been working hard for you. To generate unlimited creative ideas and variations, upgrade to Pro."
              };
          case 'export':
              return {
                  title: "Export Limit Reached",
                  icon: (
                    <HiDownload className="w-8 h-8 text-indigo-400" />
                  ),
                  intro: `You've exported ${currentUsage} times! 🚀`,
                  desc: "Ready to ship more code? The free plan includes 5 exports to CSS, Tailwind, or Figma. Upgrade to Pro for unlimited production exports."
              };
          case 'tuner':
              return {
                  title: "Tuner Limit Reached",
                  icon: (
                    <HiAdjustments className="w-8 h-8 text-indigo-400" />
                  ),
                  intro: `You've tuned ${currentUsage} palettes! 🎛️`,
                  desc: "Perfecting scales takes power. You've hit the limit on our advanced algorithm tuning tool. Go Pro to refine unlimited scales."
              };
          case 'edit':
              return {
                  title: "Editor Limit Reached",
                  icon: (
                    <HiPencil className="w-8 h-8 text-indigo-400" />
                  ),
                  intro: `You've edited ${currentUsage} curves! 📈`,
                  desc: "Deep tweaking of Hue & Saturation paths is a Pro feature. You've used your free edits. Upgrade to unlock full control."
              };
          default:
              return {
                  title: "Unlock Full Power",
                  icon: (
                    <FaBolt className="w-8 h-8 text-indigo-400" />
                  ),
                  intro: "Take your design system to the next level.",
                  desc: "Remove all limits and build without boundaries."
              };
      }
  };

  const content = getContent();

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh] md:h-auto">
        
        {/* Close Button */}
        <button 
            onClick={onClose}
            className="absolute top-4 right-4 z-20 p-2 bg-black/20 hover:bg-black/40 text-slate-400 hover:text-white rounded-full transition-colors"
        >
            <HiX className="w-6 h-6" />
        </button>

        {/* Left Side: The "Limit Reached" Message */}
        <div className="w-full md:w-2/5 bg-gradient-to-br from-slate-950 to-slate-900 p-8 md:p-10 flex flex-col justify-center border-b md:border-b-0 md:border-r border-white/5 relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5"></div>
            <div className="absolute -top-24 -left-24 w-48 h-48 bg-indigo-500/20 blur-[100px] rounded-full"></div>
            
            <div className="relative z-10">
                <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mb-6 shadow-xl border border-white/10">
                    {content.icon}
                </div>
                
                <h2 className="text-3xl font-bold text-white mb-4 leading-tight">{content.title}</h2>
                <p className="text-white font-bold text-sm leading-relaxed mb-4">
                    {content.intro}
                </p>
                <p className="text-slate-400 text-sm leading-relaxed mb-6">
                    {content.desc}
                </p>
                
                {limitType !== 'general' && (
                    <p className="text-white text-sm font-bold leading-relaxed mb-6">
                        Upgrade to Pro for an infinite sketchbook!
                    </p>
                )}

                <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Your Free Plan Includes</div>
                <ul className="space-y-2 mb-8">
                    <li className="flex items-center gap-3 text-slate-300 text-sm">
                        <HiCheck className="w-4 h-4 text-indigo-500" />
                        5 Lifetime Saved Palettes
                    </li>
                    <li className="flex items-center gap-3 text-slate-300 text-sm">
                        <HiCheck className="w-4 h-4 text-indigo-500" />
                        5 AI Generations
                    </li>
                    <li className="flex items-center gap-3 text-slate-300 text-sm">
                        <HiCheck className="w-4 h-4 text-indigo-500" />
                        5 Code Exports
                    </li>
                    <li className="flex items-center gap-3 text-slate-300 text-sm">
                        <HiCheck className="w-4 h-4 text-indigo-500" />
                        5 Advanced Tune / Edits
                    </li>
                </ul>
            </div>
        </div>

        {/* Right Side: The Offer */}
        <div className="w-full md:w-3/5 p-8 md:p-10 bg-slate-900 relative flex flex-col justify-center">
             <div className="flex items-center gap-2 mb-6">
                 <span className="px-3 py-1 rounded-full bg-gradient-to-r from-indigo-500 to-pink-500 text-white text-[10px] font-bold uppercase tracking-widest shadow-lg">Recommended</span>
                 <span className="text-slate-500 text-xs font-bold uppercase tracking-widest">Yearly Plan</span>
             </div>

             <h3 className="text-4xl font-bold text-white mb-2">Unlimited Access</h3>
             <div className="flex items-end gap-2 mb-8">
                 <span className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400">€39</span>
                 <span className="text-slate-500 font-medium mb-2">/ year</span>
             </div>

             <div className="grid grid-cols-1 gap-4 mb-8">
                {[
                    "Unlimited Palettes for a year",
                    "Unlimited AI Generation",
                    "Unlimited Exports",
                    "Unlimited Scale Tuning"
                ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3">
                         <div className="w-5 h-5 rounded-full bg-indigo-500/20 flex items-center justify-center shrink-0">
                            <HiCheck className="w-3 h-3 text-indigo-400" />
                         </div>
                         <span className="text-sm text-slate-300 font-medium">{item}</span>
                    </div>
                ))}
             </div>

             <button 
                onClick={onCheckout}
                disabled={isLoading}
                className="w-full py-4 bg-white text-slate-900 rounded-xl font-bold text-lg shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:shadow-[0_0_30px_rgba(255,255,255,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 relative overflow-hidden group"
             >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-indigo-100 to-transparent opacity-0 group-hover:opacity-30 transform -translate-x-full group-hover:translate-x-full transition-all duration-1000"></div>
                {isLoading ? (
                    <div className="w-6 h-6 border-3 border-slate-300 border-t-slate-900 rounded-full animate-spin"></div>
                ) : (
                    <>
                        <span>Upgrade to Pro</span>
                        <HiArrowRight className="w-5 h-5" />
                    </>
                )}
             </button>
             
             <p className="text-center text-xs text-slate-500 mt-4">
                 Secure payment via Stripe. Cancel anytime.
             </p>
        </div>

      </div>
    </div>
  );
};

export default PricingModal;
