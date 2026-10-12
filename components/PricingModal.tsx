
import { ArrowRight, Check, X, Zap } from 'lucide-react';
import React from 'react';

export type LimitType = 'save' | 'ai' | 'export' | 'tuner' | 'edit' | 'general';

interface PricingModalProps {
  onClose: () => void;
  onCheckout: () => void;
  isLoading: boolean;
  limitType?: LimitType; // Optional, defaults to 'general' (voluntary upgrade)
  currentUsage?: number; // Pass the usage that triggered it
}

const PricingModal: React.FC<PricingModalProps> = ({ onClose, onCheckout, isLoading }) => {
  const content = {
      title: "Assistant is a paid feature",
      icon: (
        <Zap className="w-8 h-8 text-foreground" strokeWidth={1.5}/>
      ),
      intro: "The studio is free.",
      desc: "The wheel, ramps, manual edits, and export stay unlimited. The paid part is the assistant that generates palettes from a prompt."
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="relative flex max-h-[90vh] min-h-0 w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-2xl">
        
        {/* Close Button */}
        <button 
            onClick={onClose}
            aria-label="Close"
            className="absolute top-4 right-4 z-20 p-2 bg-black/20 hover:bg-black/40 text-muted-foreground hover:text-foreground rounded-full transition-colors"
        >
            <X className="w-6 h-6" strokeWidth={1.5}/>
        </button>
        <div className="flex min-h-0 flex-auto flex-col overflow-y-auto md:flex-row">

        {/* Left Side: The "Limit Reached" Message */}
        <div className="w-full md:w-2/5 bg-gradient-to-br from-background to-card p-8 md:p-10 flex flex-col justify-center border-b md:border-b-0 md:border-r border-border relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5"></div>
            <div className="absolute -top-24 -left-24 w-48 h-48 bg-accent blur-[100px] rounded-full"></div>
            
            <div className="relative z-10">
                <div className="w-16 h-16 bg-secondary rounded-2xl flex items-center justify-center mb-6 shadow-xl border border-border">
                    {content.icon}
                </div>
                
                <h2 className="text-3xl font-bold text-foreground mb-4 leading-tight">{content.title}</h2>
                <p className="text-foreground font-bold text-sm leading-relaxed mb-4">
                    {content.intro}
                </p>
                <p className="text-muted-foreground text-sm leading-relaxed mb-6">
                    {content.desc}
                </p>
                
                <div className="text-xs font-bold text-muted-foreground tracking-widest mb-3">Free studio</div>
                <ul className="space-y-2 mb-8">
                    <li className="flex items-center gap-3 text-muted-foreground text-sm">
                        <Check className="w-4 h-4 text-foreground" strokeWidth={1.5}/>
                        Wheel, ramps, and manual edits
                    </li>
                    <li className="flex items-center gap-3 text-muted-foreground text-sm">
                        <Check className="w-4 h-4 text-foreground" strokeWidth={1.5}/>
                        Export, including color.md
                    </li>
                    <li className="flex items-center gap-3 text-muted-foreground text-sm">
                        <Check className="w-4 h-4 text-foreground" strokeWidth={1.5}/>
                        Local palette library
                    </li>
                </ul>
            </div>
        </div>

        {/* Right Side: The Offer */}
        <div className="w-full md:w-3/5 p-8 md:p-10 bg-card relative flex flex-col justify-center">
             <div className="flex items-center gap-2 mb-6">
                 <span className="px-3 py-1 rounded-full bg-primary text-primary-foreground text-[13px]">Recommended</span>
                 <span className="text-muted-foreground text-xs font-bold tracking-widest">Yearly plan</span>
             </div>

             <h3 className="text-4xl font-bold text-foreground mb-2">AI assistant</h3>
             <div className="flex items-end gap-2 mb-8">
                 <span className="text-5xl font-medium text-foreground">€39</span>
                 <span className="text-muted-foreground font-medium mb-2">/ year</span>
             </div>

             <div className="grid grid-cols-1 gap-4 mb-8">
                {[
                    "Generate palettes from a prompt",
                    "Same Stripe subscription already installed",
                    "A failed reply does not count as a use",
                    "The rest of the studio stays free"
                ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3">
                         <div className="w-5 h-5 rounded-full bg-accent flex items-center justify-center shrink-0">
                            <Check className="w-3 h-3 text-foreground" strokeWidth={1.5}/>
                         </div>
                         <span className="text-sm text-muted-foreground font-medium">{item}</span>
                    </div>
                ))}
             </div>

             <button 
                onClick={onCheckout}
                disabled={isLoading}
                className="w-full py-4 bg-primary text-primary-foreground rounded-xl font-bold text-lg shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:shadow-[0_0_30px_rgba(255,255,255,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 relative overflow-hidden group"
             >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-indigo-100 to-transparent opacity-0 group-hover:opacity-30 transform -translate-x-full group-hover:translate-x-full transition-all duration-1000"></div>
                {isLoading ? (
                    <div className="w-6 h-6 border-3 border-slate-300 border-t-slate-900 rounded-full animate-spin"></div>
                ) : (
                    <>
                        <span>Subscribe</span>
                        <ArrowRight className="w-5 h-5" strokeWidth={1.5}/>
                    </>
                )}
             </button>
             
             <p className="text-center text-xs text-muted-foreground mt-4">
                 Secure payment via Stripe. Cancel anytime.
             </p>
        </div>
        </div>

      </div>
    </div>
  );
};

export default PricingModal;
