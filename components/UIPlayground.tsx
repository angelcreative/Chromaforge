
import React, { useMemo } from 'react';
import { ColorData, PlaygroundConfig, GlobalCurveConfig } from '../types';
import { generateShades, getContrastRatio, getLuminance, hexToRgb } from '../utils/colorUtils';

interface UIPlaygroundProps {
  brandPalette: ColorData[];
  neutralPalette: ColorData[]; // Expects [Tinted, Base]
  semanticPalette: ColorData[];
  config: PlaygroundConfig;
  onConfigChange: (newConfig: PlaygroundConfig) => void;
  globalConfig?: GlobalCurveConfig;
}

const UIPlayground: React.FC<UIPlaygroundProps> = ({ 
    brandPalette, 
    neutralPalette, 
    semanticPalette, 
    config, 
    onConfigChange,
    globalConfig
}) => {

  // --- 1. THEME ENGINE LOGIC ---
  const theme = useMemo(() => {
      // 1. Resolve Palettes
      // Primary Source: Defaults to first brand color if index invalid
      const primarySource = brandPalette[config.primaryIndex] || brandPalette[0];
      
      // Neutrals Source: 0 = Tinted, 1 = Base (Gray). 
      const textNeutralSource = config.textMode === 'tinted' ? neutralPalette[0] : (neutralPalette[1] || neutralPalette[0]);
      
      // Surface Source: 
      const surfaceSource = config.surfaceMode === 'brand' ? primarySource : (neutralPalette[0] || primarySource);

      if (!primarySource || !textNeutralSource) return null;

      const pShades = generateShades(primarySource, globalConfig);
      const tShades = generateShades(textNeutralSource, globalConfig);
      const sShades = generateShades(surfaceSource, globalConfig);
      const semanticShades = semanticPalette.map(c => ({ name: c.name, shades: generateShades(c, globalConfig) }));

      // Helper to get hex by level (safe access)
      const get = (shadesArr: any[], level: number) => shadesArr.find(s => s.level === level)?.hex || '#000000';

      const isDark = config.isDarkMode;

      // --- ACCESSIBILITY CHECKER (UPDATED) ---
      // Primary Button Logic: We WANT white text (or 50).
      // If 500 bg fails with white text, we darken the BG to 600, then 700.
      const getAccessiblePrimary = () => {
          const whiteHex = get(pShades, 50); // Using 50 as "White" equivalent for brand harmony
          const whiteLum = getLuminance(hexToRgb(whiteHex).r, hexToRgb(whiteHex).g, hexToRgb(whiteHex).b);
          
          const candidates = [500, 600, 700, 800];
          
          for (const level of candidates) {
              const bgHex = get(pShades, level);
              const bgLum = getLuminance(hexToRgb(bgHex).r, hexToRgb(bgHex).g, hexToRgb(bgHex).b);
              const ratio = getContrastRatio(bgLum, whiteLum);
              
              if (ratio >= 4.5) {
                  return { bg: bgHex, text: whiteHex, hover: get(pShades, level === 800 ? 900 : level + 100) };
              }
          }
          
          // Fallback (should rarely happen unless brand color is extremely light yellow)
          // Return to 500 but force dark text (ugly but accessible)
          return { bg: get(pShades, 500), text: get(pShades, 900), hover: get(pShades, 600) };
      };

      const primaryBtn = getAccessiblePrimary();

      // Secondary Button (Outline/Ghost) logic
      // Background is usually light/transparent, Text must be dark (or light in dark mode)
      const secondaryBg = isDark ? get(pShades, 900) : get(pShades, 100);
      const secondaryTextRaw = isDark ? get(pShades, 100) : get(pShades, 900);
      
      return {
          // Foundations
          bg: {
              page: isDark ? get(tShades, 950) : get(sShades, 50),
              card: isDark ? get(tShades, 900) : '#FFFFFF', 
              sidebar: isDark ? get(tShades, 950) : get(sShades, 50), 
              input: isDark ? get(tShades, 800) : get(tShades, 50),
          },
          text: {
              main: isDark ? get(tShades, 50) : get(tShades, 900),
              secondary: isDark ? get(tShades, 300) : get(tShades, 500),
              tertiary: isDark ? get(tShades, 500) : get(tShades, 400),
              onPrimary: primaryBtn.text,
          },
          border: {
              subtle: isDark ? get(tShades, 800) : get(tShades, 100),
              default: isDark ? get(tShades, 700) : get(tShades, 200),
              focus: get(pShades, 500),
          },
          action: {
              primary: primaryBtn.bg,
              primaryHover: primaryBtn.hover,
              secondaryBg: secondaryBg,
              secondaryText: secondaryTextRaw, 
          },
          semantic: {
              success: { bg: isDark ? '#052e16' : '#dcfce7', text: isDark ? '#4ade80' : '#166534', main: '#22c55e' },
              warning: { bg: isDark ? '#451a03' : '#ffedd5', text: isDark ? '#fb923c' : '#9a3412', main: '#f97316' },
              error: { bg: isDark ? '#450a0a' : '#fee2e2', text: isDark ? '#f87171' : '#991b1b', main: '#ef4444' },
              info: { bg: isDark ? '#082f49' : '#e0f2fe', text: isDark ? '#38bdf8' : '#075985', main: '#3b82f6' },
          },
          getSemantic: (type: string) => {
              const family = semanticShades.find(s => s.name.toLowerCase().includes(type));
              if (!family) return { bg: '#333', text: '#fff' };
              
              const bg = isDark ? get(family.shades, 900) : get(family.shades, 100);
              // For badges, we generally trust 800 on 100.
              const txt = isDark ? get(family.shades, 200) : get(family.shades, 800);
              
              return {
                  bg: bg,
                  text: txt, 
                  border: isDark ? get(family.shades, 700) : get(family.shades, 200)
              };
          }
      };
  }, [brandPalette, neutralPalette, semanticPalette, config, globalConfig]);

  if (!theme) return <div className="p-10 text-center text-slate-500">Generate a palette first to activate the playground.</div>;

  // --- 2. SUB-COMPONENTS (MOCKUP PARTS) ---
  
  const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = "" }) => (
      <div 
        className={`rounded-xl border shadow-sm transition-colors duration-500 ${className}`}
        style={{ 
            backgroundColor: theme.bg.card, 
            borderColor: theme.border.subtle 
        }}
      >
          {children}
      </div>
  );

  const ButtonPrimary = ({ label }: { label: string }) => (
      <button 
        className="px-4 py-2 rounded-lg text-sm font-bold shadow-md transition-all active:scale-95"
        style={{ backgroundColor: theme.action.primary, color: theme.text.onPrimary }}
      >
          {label}
      </button>
  );

  const ButtonSecondary = ({ label }: { label: string }) => (
      <button 
        className="px-4 py-2 rounded-lg text-sm font-bold transition-all hover:opacity-80 active:scale-95"
        style={{ backgroundColor: theme.action.secondaryBg, color: theme.action.secondaryText }}
      >
          {label}
      </button>
  );

  const Badge = ({ type, label }: { type: 'success'|'warning'|'error'|'info', label: string }) => {
      const s = theme.getSemantic(type);
      return (
          <span 
            className="px-2.5 py-0.5 rounded-full text-[10px] font-bold border"
            style={{ backgroundColor: s.bg, color: s.text, borderColor: s.border }}
          >
              {label}
          </span>
      );
  };

  return (
    <div className="flex flex-col md:flex-row h-full max-h-screen overflow-hidden">
        
        {/* --- CONTROLS SIDEBAR --- */}
        <div className="w-full md:w-[320px] bg-slate-900 border-r border-white/5 flex flex-col shrink-0 overflow-y-auto custom-scrollbar z-10 shadow-2xl">
            <div className="p-6 border-b border-white/5">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <svg className="w-4 h-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
                    Interface Mapping
                </h3>
                <p className="text-xs text-slate-500 mt-2">
                    Define how your tokens map to UI elements. This simulates `semantic.tokens` logic.
                </p>
            </div>

            <div className="p-6 space-y-8">
                
                {/* 1. Dark Mode Toggle */}
                <div className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-white/5">
                    <span className="text-xs font-bold text-slate-300 uppercase">Appearance</span>
                    <button 
                        onClick={() => onConfigChange({ ...config, isDarkMode: !config.isDarkMode })}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${config.isDarkMode ? 'bg-indigo-600' : 'bg-slate-700'}`}
                    >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ease-in-out ${config.isDarkMode ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                </div>

                {/* 2. Primary Color Selection */}
                <div>
                    <label className="text-xs font-bold text-slate-500 uppercase block mb-3">Primary Action Color</label>
                    <div className="flex gap-2 flex-wrap">
                        {brandPalette.map((color, idx) => (
                            <button
                                key={idx}
                                onClick={() => onConfigChange({ ...config, primaryIndex: idx })}
                                className={`w-8 h-8 rounded-full border-2 transition-all relative flex items-center justify-center ${config.primaryIndex === idx ? 'border-white scale-110 shadow-lg' : 'border-transparent hover:scale-105'}`}
                                style={{ backgroundColor: color.hex }}
                                title={color.name}
                            >
                                {config.primaryIndex === idx && <div className="w-2 h-2 bg-white rounded-full"></div>}
                            </button>
                        ))}
                    </div>
                </div>

                {/* 3. Surface Mapping */}
                <div>
                    <label className="text-xs font-bold text-slate-500 uppercase block mb-3">Background Tint</label>
                    <div className="flex bg-slate-950 p-1 rounded-lg border border-white/5">
                        <button 
                            onClick={() => onConfigChange({ ...config, surfaceMode: 'neutral' })}
                            className={`flex-1 py-2 text-[10px] font-bold uppercase rounded transition-all ${config.surfaceMode === 'neutral' ? 'bg-slate-800 text-white shadow' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                            Neutral
                        </button>
                        <button 
                            onClick={() => onConfigChange({ ...config, surfaceMode: 'brand' })}
                            className={`flex-1 py-2 text-[10px] font-bold uppercase rounded transition-all ${config.surfaceMode === 'brand' ? 'bg-slate-800 text-white shadow' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                            Brand
                        </button>
                    </div>
                </div>

                {/* 4. Text Mapping */}
                <div>
                    <label className="text-xs font-bold text-slate-500 uppercase block mb-3">Typography Tone</label>
                    <div className="flex bg-slate-950 p-1 rounded-lg border border-white/5">
                        <button 
                            onClick={() => onConfigChange({ ...config, textMode: 'base' })}
                            className={`flex-1 py-2 text-[10px] font-bold uppercase rounded transition-all ${config.textMode === 'base' ? 'bg-slate-800 text-white shadow' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                            Pure Gray
                        </button>
                        <button 
                            onClick={() => onConfigChange({ ...config, textMode: 'tinted' })}
                            className={`flex-1 py-2 text-[10px] font-bold uppercase rounded transition-all ${config.textMode === 'tinted' ? 'bg-slate-800 text-white shadow' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                            Tinted
                        </button>
                    </div>
                </div>

                <div className="p-4 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-300 leading-relaxed">
                    💡 <b>Tip:</b> Check contrasting text colors in Dark Mode. The engine automatically inverts scales (900 becomes 50) while maintaining saturation.
                </div>

            </div>
        </div>

        {/* --- DASHBOARD PREVIEW --- */}
        <div 
            className="flex-1 overflow-hidden relative transition-colors duration-500"
            style={{ backgroundColor: theme.bg.page }}
        >
            <div className="h-full w-full overflow-y-auto p-4 md:p-8">
                <div className="max-w-6xl mx-auto flex flex-col gap-6">
                    
                    {/* Header */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
                        <div>
                            <h2 className="text-2xl font-bold tracking-tight transition-colors" style={{ color: theme.text.main }}>Overview</h2>
                            <p className="text-sm transition-colors" style={{ color: theme.text.secondary }}>Welcome back, Designer.</p>
                        </div>
                        <div className="flex gap-3">
                            <ButtonSecondary label="Export Report" />
                            <ButtonPrimary label="+ New Project" />
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {[
                            { label: "Total Revenue", val: "$45,231.89", delta: "+20.1%", trend: "success" },
                            { label: "Subscriptions", val: "+2350", delta: "+180.1%", trend: "success" },
                            { label: "Active Now", val: "+573", delta: "+201", trend: "info" },
                            { label: "Churn Rate", val: "2.4%", delta: "-1.2%", trend: "success" },
                        ].map((stat, i) => (
                            <Card key={i} className="p-5">
                                <div className="flex justify-between items-start mb-4">
                                    <p className="text-xs font-bold uppercase tracking-wider" style={{ color: theme.text.tertiary }}>{stat.label}</p>
                                    <Badge type={stat.trend as any} label={stat.delta} />
                                </div>
                                <h4 className="text-2xl font-bold" style={{ color: theme.text.main }}>{stat.val}</h4>
                                <p className="text-xs mt-1" style={{ color: theme.text.secondary }}>from last month</p>
                            </Card>
                        ))}
                    </div>

                    {/* Charts & Tables */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        
                        {/* Main Chart Area */}
                        <Card className="lg:col-span-2 p-6 min-h-[300px] flex flex-col">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="font-bold text-lg" style={{ color: theme.text.main }}>Analytics</h3>
                                <div className="flex gap-2">
                                    {['12M', '30D', '7D'].map((t, i) => (
                                        <button 
                                            key={t} 
                                            className={`text-xs font-bold px-2 py-1 rounded transition-colors ${i === 1 ? 'shadow-sm' : ''}`}
                                            style={{ 
                                                backgroundColor: i === 1 ? theme.bg.input : 'transparent',
                                                color: i === 1 ? theme.text.main : theme.text.tertiary 
                                            }}
                                        >
                                            {t}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            
                            {/* CSS-only Chart Simulation */}
                            <div className="flex-1 flex items-end gap-2 md:gap-4 h-full pt-4 border-b" style={{ borderColor: theme.border.subtle }}>
                                {[35, 55, 45, 70, 60, 85, 95, 75, 60, 50, 65, 80].map((h, i) => (
                                    <div key={i} className="flex-1 group relative flex flex-col justify-end h-full">
                                        <div 
                                            className="w-full rounded-t-sm transition-all duration-500 opacity-80 group-hover:opacity-100" 
                                            style={{ 
                                                height: `${h}%`, 
                                                backgroundColor: theme.action.primary 
                                            }} 
                                        />
                                    </div>
                                ))}
                            </div>
                            <div className="flex justify-between mt-2 text-[10px] font-mono uppercase" style={{ color: theme.text.tertiary }}>
                                <span>Jan</span><span>Dec</span>
                            </div>
                        </Card>

                        {/* Side List */}
                        <Card className="p-0 flex flex-col">
                            <div className="p-5 border-b" style={{ borderColor: theme.border.subtle }}>
                                <h3 className="font-bold text-lg" style={{ color: theme.text.main }}>Recent Activity</h3>
                            </div>
                            <div className="flex-1 overflow-y-auto">
                                {[1, 2, 3, 4, 5].map((item) => (
                                    <div key={item} className="flex items-center gap-3 p-4 border-b last:border-0 transition-colors hover:bg-black/5 dark:hover:bg-white/5" style={{ borderColor: theme.border.subtle }}>
                                        <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: theme.bg.input }}>
                                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: theme.action.primary }}></div>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate" style={{ color: theme.text.main }}>Project Update #{item}</p>
                                            <p className="text-xs truncate" style={{ color: theme.text.tertiary }}>Modified 2 hours ago</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="p-4 border-t" style={{ borderColor: theme.border.subtle }}>
                                <button className="w-full py-2 text-xs font-bold uppercase tracking-wider rounded" style={{ color: theme.action.primary, backgroundColor: theme.action.secondaryBg }}>View All</button>
                            </div>
                        </Card>
                    </div>

                    {/* Data Table */}
                    <Card className="overflow-hidden">
                        <div className="p-6 border-b" style={{ borderColor: theme.border.subtle }}>
                            <h3 className="font-bold text-lg" style={{ color: theme.text.main }}>Users</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm" style={{ color: theme.text.secondary }}>
                                <thead className="text-xs uppercase font-bold" style={{ backgroundColor: theme.bg.input, color: theme.text.tertiary }}>
                                    <tr>
                                        <th className="px-6 py-3">Name</th>
                                        <th className="px-6 py-3">Role</th>
                                        <th className="px-6 py-3">Status</th>
                                        <th className="px-6 py-3 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {[
                                        { name: "Alice Freeman", role: "Admin", status: "success", label: "Active" },
                                        { name: "Bob Smith", role: "Editor", status: "warning", label: "Pending" },
                                        { name: "Charlie K.", role: "Viewer", status: "info", label: "Trial" },
                                        { name: "David M.", role: "Viewer", status: "error", label: "Expired" },
                                    ].map((row, i) => (
                                        <tr key={i} className="group transition-colors hover:bg-black/5 dark:hover:bg-white/5 border-b last:border-0" style={{ borderColor: theme.border.subtle }}>
                                            <td className="px-6 py-4 font-medium" style={{ color: theme.text.main }}>{row.name}</td>
                                            <td className="px-6 py-4">{row.role}</td>
                                            <td className="px-6 py-4">
                                                <Badge type={row.status as any} label={row.label} />
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button className="text-xs font-bold hover:underline" style={{ color: theme.action.primary }}>Edit</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>

                </div>
            </div>
        </div>
    </div>
  );
};

export default UIPlayground;
