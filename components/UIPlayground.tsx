
import React, { useMemo, useState } from 'react';
import { ColorData, PlaygroundConfig, GlobalCurveConfig } from '../types';
import { generateShades, getContrastRatio, getLuminance, hexToRgb } from '../utils/colorUtils';
import * as Accordion from '@radix-ui/react-accordion';
import * as AlertDialog from '@radix-ui/react-alert-dialog';
import * as AspectRatio from '@radix-ui/react-aspect-ratio';
import * as Avatar from '@radix-ui/react-avatar';
import * as Checkbox from '@radix-ui/react-checkbox';
import * as Collapsible from '@radix-ui/react-collapsible';
import * as ContextMenu from '@radix-ui/react-context-menu';
import * as Dialog from '@radix-ui/react-dialog';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import * as HoverCard from '@radix-ui/react-hover-card';
import * as Label from '@radix-ui/react-label';
import * as Menubar from '@radix-ui/react-menubar';
import * as NavigationMenu from '@radix-ui/react-navigation-menu';
import * as Popover from '@radix-ui/react-popover';
import * as Progress from '@radix-ui/react-progress';
import * as RadioGroup from '@radix-ui/react-radio-group';
import * as ScrollArea from '@radix-ui/react-scroll-area';
import * as Select from '@radix-ui/react-select';
import * as Separator from '@radix-ui/react-separator';
import * as Slider from '@radix-ui/react-slider';
import * as Switch from '@radix-ui/react-switch';
import * as Tabs from '@radix-ui/react-tabs';
import * as Toast from '@radix-ui/react-toast';
import * as Toggle from '@radix-ui/react-toggle';
import * as ToggleGroup from '@radix-ui/react-toggle-group';
import * as Toolbar from '@radix-ui/react-toolbar';
import * as Tooltip from '@radix-ui/react-tooltip';
import { 
  HiCheck, HiChevronDown, HiChevronUp, HiMenu, HiX, HiDotsVertical,
  HiFolder, HiFolderOpen, HiUser, HiUserCircle, HiCog, HiBell,
  HiSearch, HiFilter, HiViewGrid, HiCollection, HiCursorClick,
  HiLockClosed, HiEye, HiEyeOff, HiChartBar, HiAdjustments,
  HiVolumeUp, HiVolumeOff, HiSwitchHorizontal, HiTag, HiInformationCircle,
  HiExclamationCircle, HiQuestionMarkCircle, HiClipboard, HiDocument,
  HiPuzzle, HiCube, HiViewList, HiTemplate, HiCursorClick as HiCursorArrow, HiPhotograph as HiImage
} from 'react-icons/hi';

interface UIPlaygroundProps {
  brandPalette: ColorData[];
  neutralPalette: ColorData[];
  semanticPalette: ColorData[];
  config: PlaygroundConfig;
  onConfigChange: (newConfig: PlaygroundConfig) => void;
  globalConfig?: GlobalCurveConfig;
}

type MoleculeType = 
  | 'button' | 'input' | 'textarea' | 'select' | 'label' | 'badge' | 'tag' | 'pill'
  | 'checkbox' | 'radio' | 'switch' | 'slider' | 'progress' | 'toggle' | 'separator';

type OrganismType = 
  | 'accordion' | 'alert-dialog' | 'aspect-ratio' | 'avatar' | 'collapsible'
  | 'context-menu' | 'dialog' | 'dropdown-menu' | 'form' | 'hover-card'
  | 'menubar' | 'navigation-menu' | 'popover' | 'radio-group' | 'scroll-area'
  | 'tabs' | 'toast' | 'toggle-group' | 'toolbar' | 'tooltip';

type ComponentType = MoleculeType | OrganismType;

const UIPlayground: React.FC<UIPlaygroundProps> = ({ 
    brandPalette, 
    neutralPalette, 
    semanticPalette, 
    config, 
    onConfigChange,
    globalConfig
}) => {
  const [activeTab, setActiveTab] = useState<'molecules' | 'organisms'>('molecules');
  const [selectedComponent, setSelectedComponent] = useState<ComponentType>('button');
  const [toastOpen, setToastOpen] = useState(false);

  // --- 1. THEME ENGINE LOGIC ---
  const theme = useMemo(() => {
      const primarySource = brandPalette[config.primaryIndex] || brandPalette[0];
      const textNeutralSource = config.textMode === 'tinted' ? neutralPalette[0] : (neutralPalette[1] || neutralPalette[0]);
      const surfaceSource = config.surfaceMode === 'brand' ? primarySource : (neutralPalette[0] || primarySource);

      if (!primarySource || !textNeutralSource) return null;

      const pShades = generateShades(primarySource, globalConfig);
      const tShades = generateShades(textNeutralSource, globalConfig);
      const sShades = generateShades(surfaceSource, globalConfig);
      const semanticShades = semanticPalette.map(c => ({ name: c.name, shades: generateShades(c, globalConfig) }));

      const get = (shadesArr: any[], level: number) => shadesArr.find(s => s.level === level)?.hex || '#000000';
      const isDark = config.isDarkMode;

      const getAccessiblePrimary = () => {
          const whiteHex = get(pShades, 50);
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
          return { bg: get(pShades, 500), text: get(pShades, 900), hover: get(pShades, 600) };
      };

      const primaryBtn = getAccessiblePrimary();
      const secondaryBg = isDark ? get(pShades, 900) : get(pShades, 100);
      const secondaryTextRaw = isDark ? get(pShades, 100) : get(pShades, 900);
      
      return {
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

  // --- 2. COMPONENT MENUS ---
  const molecules: { id: MoleculeType; label: string; icon: React.ReactNode }[] = [
    { id: 'button', label: 'Button', icon: <HiCursorClick className="w-5 h-5" /> },
    { id: 'input', label: 'Input', icon: <HiSearch className="w-5 h-5" /> },
    { id: 'textarea', label: 'Textarea', icon: <HiDocument className="w-5 h-5" /> },
    { id: 'select', label: 'Select', icon: <HiFilter className="w-5 h-5" /> },
    { id: 'label', label: 'Label', icon: <HiTag className="w-5 h-5" /> },
    { id: 'badge', label: 'Badge', icon: <HiTag className="w-5 h-5" /> },
    { id: 'tag', label: 'Tag', icon: <HiTag className="w-5 h-5" /> },
    { id: 'pill', label: 'Pill', icon: <HiTag className="w-5 h-5" /> },
    { id: 'checkbox', label: 'Checkbox', icon: <HiCheck className="w-5 h-5" /> },
    { id: 'radio', label: 'Radio', icon: <HiSwitchHorizontal className="w-5 h-5" /> },
    { id: 'switch', label: 'Switch', icon: <HiSwitchHorizontal className="w-5 h-5" /> },
    { id: 'slider', label: 'Slider', icon: <HiAdjustments className="w-5 h-5" /> },
    { id: 'progress', label: 'Progress', icon: <HiChartBar className="w-5 h-5" /> },
    { id: 'toggle', label: 'Toggle', icon: <HiSwitchHorizontal className="w-5 h-5" /> },
    { id: 'separator', label: 'Separator', icon: <HiAdjustments className="w-5 h-5" /> },
  ];

  const organisms: { id: OrganismType; label: string; icon: React.ReactNode }[] = [
    { id: 'accordion', label: 'Accordion', icon: <HiFolder className="w-5 h-5" /> },
    { id: 'alert-dialog', label: 'Alert Dialog', icon: <HiExclamationCircle className="w-5 h-5" /> },
    { id: 'aspect-ratio', label: 'Aspect Ratio', icon: <HiImage className="w-5 h-5" /> },
    { id: 'avatar', label: 'Avatar', icon: <HiUserCircle className="w-5 h-5" /> },
    { id: 'collapsible', label: 'Collapsible', icon: <HiFolderOpen className="w-5 h-5" /> },
    { id: 'context-menu', label: 'Context Menu', icon: <HiDotsVertical className="w-5 h-5" /> },
    { id: 'dialog', label: 'Dialog', icon: <HiTemplate className="w-5 h-5" /> },
    { id: 'dropdown-menu', label: 'Dropdown Menu', icon: <HiMenu className="w-5 h-5" /> },
    { id: 'form', label: 'Form', icon: <HiDocument className="w-5 h-5" /> },
    { id: 'hover-card', label: 'Hover Card', icon: <HiCursorArrow className="w-5 h-5" /> },
    { id: 'menubar', label: 'Menubar', icon: <HiViewList className="w-5 h-5" /> },
    { id: 'navigation-menu', label: 'Navigation Menu', icon: <HiCollection className="w-5 h-5" /> },
    { id: 'popover', label: 'Popover', icon: <HiCursorClick className="w-5 h-5" /> },
    { id: 'radio-group', label: 'Radio Group', icon: <HiSwitchHorizontal className="w-5 h-5" /> },
    { id: 'scroll-area', label: 'Scroll Area', icon: <HiViewGrid className="w-5 h-5" /> },
    { id: 'tabs', label: 'Tabs', icon: <HiViewList className="w-5 h-5" /> },
    { id: 'toast', label: 'Toast', icon: <HiBell className="w-5 h-5" /> },
    { id: 'toggle-group', label: 'Toggle Group', icon: <HiViewGrid className="w-5 h-5" /> },
    { id: 'toolbar', label: 'Toolbar', icon: <HiCog className="w-5 h-5" /> },
    { id: 'tooltip', label: 'Tooltip', icon: <HiInformationCircle className="w-5 h-5" /> },
  ];

  // --- 3. COMPONENT VIEWS ---
  const renderComponentView = () => {
    switch (selectedComponent) {
      // === MOLECULES ===
      case 'button':
        return (
          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-bold mb-6" style={{ color: theme.text.main }}>Buttons</h3>
              
              {/* Primary Buttons */}
              <div className="mb-8">
                <h4 className="text-sm font-semibold mb-4 uppercase tracking-wider" style={{ color: theme.text.secondary }}>Primary</h4>
                <div className="flex flex-wrap gap-4">
                  <button 
                    className="px-6 py-3 rounded-lg text-sm font-semibold transition-all"
                    style={{ backgroundColor: theme.action.primary, color: theme.text.onPrimary }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = theme.action.primaryHover; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = theme.action.primary; }}
                  >
                    Primary Button
                  </button>
                  <button 
                    className="px-6 py-3 rounded-lg text-sm font-semibold transition-all opacity-50 cursor-not-allowed"
                    style={{ backgroundColor: theme.action.primary, color: theme.text.onPrimary }}
                  >
                    Disabled
                  </button>
                  <button 
                    className="px-6 py-3 rounded-lg text-sm font-semibold transition-all"
                    style={{ backgroundColor: theme.action.primary, color: theme.text.onPrimary, transform: 'scale(0.95)' }}
                  >
                    Active
                  </button>
                </div>
              </div>

              {/* Secondary Buttons */}
              <div className="mb-8">
                <h4 className="text-sm font-semibold mb-4 uppercase tracking-wider" style={{ color: theme.text.secondary }}>Secondary</h4>
                <div className="flex flex-wrap gap-4">
                  <button 
                    className="px-6 py-3 rounded-lg text-sm font-semibold transition-all border"
                    style={{ 
                      backgroundColor: theme.action.secondaryBg, 
                      color: theme.action.secondaryText,
                      borderColor: theme.border.default
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = theme.bg.input;
                      e.currentTarget.style.borderColor = theme.border.focus;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = theme.action.secondaryBg;
                      e.currentTarget.style.borderColor = theme.border.default;
                    }}
                  >
                    Secondary Button
                  </button>
                  <button 
                    className="px-6 py-3 rounded-lg text-sm font-semibold transition-all border opacity-50 cursor-not-allowed"
                    style={{ 
                      backgroundColor: theme.action.secondaryBg, 
                      color: theme.action.secondaryText,
                      borderColor: theme.border.default
                    }}
                  >
                    Disabled
                  </button>
                </div>
              </div>

              {/* Tertiary Buttons */}
              <div className="mb-8">
                <h4 className="text-sm font-semibold mb-4 uppercase tracking-wider" style={{ color: theme.text.secondary }}>Tertiary</h4>
                <div className="flex flex-wrap gap-4">
                  <button 
                    className="px-6 py-3 rounded-lg text-sm font-medium transition-all"
                    style={{ color: theme.action.primary }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = theme.bg.input; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                  >
                    Tertiary Button
                  </button>
                  <button 
                    className="px-6 py-3 rounded-lg text-sm font-medium transition-all opacity-50 cursor-not-allowed"
                    style={{ color: theme.action.primary }}
                  >
                    Disabled
                  </button>
                </div>
              </div>

              {/* Link Buttons */}
              <div className="mb-8">
                <h4 className="text-sm font-semibold mb-4 uppercase tracking-wider" style={{ color: theme.text.secondary }}>Link</h4>
                <div className="flex flex-wrap gap-4">
                  <button 
                    className="px-0 py-2 text-sm font-medium transition-all underline decoration-2 underline-offset-4"
                    style={{ color: theme.action.primary }}
                    onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.8'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
                  >
                    Link Button
                  </button>
                  <button 
                    className="px-0 py-2 text-sm font-medium transition-all underline decoration-2 underline-offset-4 opacity-50 cursor-not-allowed"
                    style={{ color: theme.action.primary }}
                  >
                    Disabled
                  </button>
                </div>
              </div>

              {/* Floating Action Button */}
              <div className="mb-8">
                <h4 className="text-sm font-semibold mb-4 uppercase tracking-wider" style={{ color: theme.text.secondary }}>Floating Action Button</h4>
                <div className="flex flex-wrap gap-4">
                  <button 
                    className="w-14 h-14 rounded-full text-lg font-bold shadow-lg transition-all hover:shadow-xl"
                    style={{ backgroundColor: theme.action.primary, color: theme.text.onPrimary }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = theme.action.primaryHover; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = theme.action.primary; }}
                  >
                    +
                  </button>
                  <button 
                    className="w-14 h-14 rounded-full text-lg font-bold shadow-lg transition-all opacity-50 cursor-not-allowed"
                    style={{ backgroundColor: theme.action.primary, color: theme.text.onPrimary }}
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Icon Buttons */}
              <div className="mb-8">
                <h4 className="text-sm font-semibold mb-4 uppercase tracking-wider" style={{ color: theme.text.secondary }}>Icon Button</h4>
                <div className="flex flex-wrap gap-4">
                  <button 
                    className="w-10 h-10 rounded-lg flex items-center justify-center transition-all"
                    style={{ backgroundColor: theme.action.primary, color: theme.text.onPrimary }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = theme.action.primaryHover; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = theme.action.primary; }}
                  >
                    <HiSearch className="w-5 h-5" />
                  </button>
                  <button 
                    className="w-10 h-10 rounded-lg flex items-center justify-center transition-all border"
                    style={{ 
                      backgroundColor: theme.action.secondaryBg, 
                      color: theme.action.secondaryText,
                      borderColor: theme.border.default
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = theme.bg.input;
                      e.currentTarget.style.borderColor = theme.border.focus;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = theme.action.secondaryBg;
                      e.currentTarget.style.borderColor = theme.border.default;
                    }}
                  >
                    <HiSearch className="w-5 h-5" />
                  </button>
                  <button 
                    className="w-10 h-10 rounded-lg flex items-center justify-center transition-all opacity-50 cursor-not-allowed"
                    style={{ backgroundColor: theme.action.primary, color: theme.text.onPrimary }}
                  >
                    <HiSearch className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Semantic Buttons */}
              <div className="mb-8">
                <h4 className="text-sm font-semibold mb-4 uppercase tracking-wider" style={{ color: theme.text.secondary }}>Semantic</h4>
                <div className="flex flex-wrap gap-4">
                  <button 
                    className="px-6 py-3 rounded-lg text-sm font-semibold transition-all"
                    style={{ backgroundColor: theme.semantic.success.main, color: '#FFFFFF' }}
                  >
                    Success
                  </button>
                  <button 
                    className="px-6 py-3 rounded-lg text-sm font-semibold transition-all"
                    style={{ backgroundColor: theme.semantic.error.main, color: '#FFFFFF' }}
                  >
                    Error
                  </button>
                  <button 
                    className="px-6 py-3 rounded-lg text-sm font-semibold transition-all"
                    style={{ backgroundColor: theme.semantic.warning.main, color: '#FFFFFF' }}
                  >
                    Warning
                  </button>
                  <button 
                    className="px-6 py-3 rounded-lg text-sm font-semibold transition-all"
                    style={{ backgroundColor: theme.semantic.info.main, color: '#FFFFFF' }}
                  >
                    Info
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      case 'input':
        return (
          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-bold mb-6" style={{ color: theme.text.main }}>Inputs</h3>
              
              {/* Default Input */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2" style={{ color: theme.text.main }}>Default</label>
                <input 
                  type="text" 
                  placeholder="Enter text..."
                  className="w-full px-4 py-2 rounded-lg text-sm border transition-all focus:outline-none focus:ring-2"
                  style={{ 
                    backgroundColor: theme.bg.input, 
                    color: theme.text.main,
                    borderColor: theme.border.default
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = theme.border.focus}
                  onBlur={(e) => e.currentTarget.style.borderColor = theme.border.default}
                />
              </div>

              {/* Disabled Input */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2" style={{ color: theme.text.main }}>Disabled</label>
                <input 
                  type="text" 
                  placeholder="Disabled input"
                  disabled
                  className="w-full px-4 py-2 rounded-lg text-sm border opacity-50 cursor-not-allowed"
                  style={{ 
                    backgroundColor: theme.bg.input, 
                    color: theme.text.main,
                    borderColor: theme.border.default
                  }}
                />
              </div>

              {/* Error Input */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2" style={{ color: theme.semantic.error.text }}>Error</label>
                <input 
                  type="text" 
                  placeholder="Error state"
                  className="w-full px-4 py-2 rounded-lg text-sm border transition-all focus:outline-none focus:ring-2"
                  style={{ 
                    backgroundColor: theme.bg.input, 
                    color: theme.text.main,
                    borderColor: theme.semantic.error.main
                  }}
                />
                <p className="text-xs mt-1" style={{ color: theme.semantic.error.text }}>This field is required</p>
              </div>

              {/* Success Input */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2" style={{ color: theme.semantic.success.text }}>Success</label>
                <input 
                  type="text" 
                  placeholder="Success state"
                  className="w-full px-4 py-2 rounded-lg text-sm border transition-all"
                  style={{ 
                    backgroundColor: theme.bg.input, 
                    color: theme.text.main,
                    borderColor: theme.semantic.success.main
                  }}
                />
              </div>

              {/* Input with Icon */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2" style={{ color: theme.text.main }}>With Icon</label>
                <div className="relative">
                  <HiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: theme.text.secondary }} />
                  <input 
                    type="text" 
                    placeholder="Search..."
                    className="w-full pl-10 pr-4 py-2 rounded-lg text-sm border transition-all focus:outline-none focus:ring-2"
                    style={{ 
                      backgroundColor: theme.bg.input, 
                      color: theme.text.main,
                      borderColor: theme.border.default
                    }}
                    onFocus={(e) => e.currentTarget.style.borderColor = theme.border.focus}
                    onBlur={(e) => e.currentTarget.style.borderColor = theme.border.default}
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case 'textarea':
        return (
          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-bold mb-6" style={{ color: theme.text.main }}>Textarea</h3>
              <div className="space-y-4 max-w-md">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: theme.text.main }}>Default</label>
                  <textarea 
                    rows={4}
                    placeholder="Enter your message..."
                    className="w-full px-4 py-2 rounded-lg text-sm border transition-all focus:outline-none focus:ring-2 resize-none"
                    style={{ 
                      backgroundColor: theme.bg.input, 
                      color: theme.text.main,
                      borderColor: theme.border.default
                    }}
                    onFocus={(e) => e.currentTarget.style.borderColor = theme.border.focus}
                    onBlur={(e) => e.currentTarget.style.borderColor = theme.border.default}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: theme.text.main }}>Disabled</label>
                  <textarea 
                    rows={4}
                    placeholder="Disabled textarea"
                    disabled
                    className="w-full px-4 py-2 rounded-lg text-sm border opacity-50 cursor-not-allowed resize-none"
                    style={{ 
                      backgroundColor: theme.bg.input, 
                      color: theme.text.main,
                      borderColor: theme.border.default
                    }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: theme.semantic.error.text }}>Error</label>
                  <textarea 
                    rows={4}
                    placeholder="Error state"
                    className="w-full px-4 py-2 rounded-lg text-sm border transition-all focus:outline-none resize-none"
                    style={{ 
                      backgroundColor: theme.bg.input, 
                      color: theme.text.main,
                      borderColor: theme.semantic.error.main
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case 'badge':
        return (
          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-bold mb-6" style={{ color: theme.text.main }}>Badges</h3>
              <div className="flex flex-wrap gap-4 items-center">
                <span 
                  className="px-3 py-1 rounded-full text-xs font-semibold"
                  style={{ backgroundColor: theme.action.primary, color: theme.text.onPrimary }}
                >
                  Primary
                </span>
                <span 
                  className="px-3 py-1 rounded-full text-xs font-semibold border"
                  style={{ 
                    backgroundColor: theme.action.secondaryBg, 
                    color: theme.action.secondaryText,
                    borderColor: theme.border.default
                  }}
                >
                  Secondary
                </span>
                <span 
                  className="px-3 py-1 rounded-full text-xs font-semibold"
                  style={{ backgroundColor: theme.semantic.success.bg, color: theme.semantic.success.text }}
                >
                  Success
                </span>
                <span 
                  className="px-3 py-1 rounded-full text-xs font-semibold"
                  style={{ backgroundColor: theme.semantic.error.bg, color: theme.semantic.error.text }}
                >
                  Error
                </span>
                <span 
                  className="px-3 py-1 rounded-full text-xs font-semibold"
                  style={{ backgroundColor: theme.semantic.warning.bg, color: theme.semantic.warning.text }}
                >
                  Warning
                </span>
                <span 
                  className="px-3 py-1 rounded-full text-xs font-semibold"
                  style={{ backgroundColor: theme.semantic.info.bg, color: theme.semantic.info.text }}
                >
                  Info
                </span>
              </div>
            </div>
          </div>
        );

      case 'tag':
        return (
          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-bold mb-6" style={{ color: theme.text.main }}>Tags</h3>
              <div className="flex flex-wrap gap-2 items-center">
                <span 
                  className="px-2 py-1 rounded text-xs font-medium border"
                  style={{ 
                    backgroundColor: theme.bg.input, 
                    color: theme.text.main,
                    borderColor: theme.border.default
                  }}
                >
                  Tag
                </span>
                <span 
                  className="px-2 py-1 rounded text-xs font-medium"
                  style={{ backgroundColor: theme.action.primary, color: theme.text.onPrimary }}
                >
                  Primary Tag
                </span>
                <span 
                  className="px-2 py-1 rounded text-xs font-medium border"
                  style={{ 
                    backgroundColor: 'transparent', 
                    color: theme.text.secondary,
                    borderColor: theme.border.default
                  }}
                >
                  Outline
                </span>
              </div>
            </div>
          </div>
        );

      case 'pill':
        return (
          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-bold mb-6" style={{ color: theme.text.main }}>Pills</h3>
              <div className="flex flex-wrap gap-2 items-center">
                <span 
                  className="px-3 py-1 rounded-full text-xs font-medium"
                  style={{ backgroundColor: theme.bg.input, color: theme.text.main }}
                >
                  Pill
                </span>
                <span 
                  className="px-3 py-1 rounded-full text-xs font-medium"
                  style={{ backgroundColor: theme.action.primary, color: theme.text.onPrimary }}
                >
                  Primary Pill
                </span>
                <span 
                  className="px-3 py-1 rounded-full text-xs font-medium border"
                  style={{ 
                    backgroundColor: 'transparent', 
                    color: theme.text.secondary,
                    borderColor: theme.border.default
                  }}
                >
                  Outline Pill
                </span>
              </div>
            </div>
          </div>
        );

      case 'radio':
        return (
          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-bold mb-6" style={{ color: theme.text.main }}>Radio Buttons</h3>
              <div className="space-y-4">
                {[
                  { label: 'Selected', checked: true, disabled: false },
                  { label: 'Unselected', checked: false, disabled: false },
                  { label: 'Disabled Selected', checked: true, disabled: true },
                  { label: 'Disabled Unselected', checked: false, disabled: true },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${item.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                      style={{
                        borderColor: item.checked ? theme.action.primary : theme.border.default,
                      }}
                    >
                      {item.checked && (
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: theme.action.primary }}
                        />
                      )}
                    </div>
                    <Label.Root className="text-sm" style={{ color: item.disabled ? theme.text.tertiary : theme.text.main }}>
                      {item.label}
                    </Label.Root>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      // === ORGANISMS ===
      case 'accordion':
        return (
          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-bold mb-4" style={{ color: theme.text.main }}>Accordion</h3>
              <Accordion.Root type="single" collapsible className="w-full max-w-md">
                <Accordion.Item value="item-1" className="border rounded-lg mb-2" style={{ borderColor: theme.border.subtle }}>
                  <Accordion.Header>
                    <Accordion.Trigger 
                      className="w-full px-4 py-3 flex items-center justify-between text-left font-medium transition-all hover:bg-black/5"
                      style={{ color: theme.text.main }}
                    >
                      <span>Is it accessible?</span>
                      <HiChevronDown className="w-4 h-4 transition-transform duration-200" />
                    </Accordion.Trigger>
                  </Accordion.Header>
                  <Accordion.Content className="px-4 pb-3 text-sm" style={{ color: theme.text.secondary }}>
                    Yes. It adheres to the WAI-ARIA design pattern.
                  </Accordion.Content>
                </Accordion.Item>
                <Accordion.Item value="item-2" className="border rounded-lg mb-2" style={{ borderColor: theme.border.subtle }}>
                  <Accordion.Header>
                    <Accordion.Trigger 
                      className="w-full px-4 py-3 flex items-center justify-between text-left font-medium transition-all hover:bg-black/5"
                      style={{ color: theme.text.main }}
                    >
                      <span>Is it unstyled?</span>
                      <HiChevronDown className="w-4 h-4 transition-transform duration-200" />
                    </Accordion.Trigger>
                  </Accordion.Header>
                  <Accordion.Content className="px-4 pb-3 text-sm" style={{ color: theme.text.secondary }}>
                    Yes. It's unstyled by default, giving you freedom over the look and feel.
                  </Accordion.Content>
                </Accordion.Item>
              </Accordion.Root>
            </div>
          </div>
        );

      case 'alert-dialog':
        return (
          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-bold mb-4" style={{ color: theme.text.main }}>Alert Dialog</h3>
              <AlertDialog.Root>
                <AlertDialog.Trigger asChild>
                  <button 
                    className="px-4 py-2 rounded-lg text-sm font-bold transition-all"
                    style={{ backgroundColor: theme.semantic.error.main, color: '#FFFFFF' }}
                  >
                    Delete Account
                  </button>
                </AlertDialog.Trigger>
                <AlertDialog.Portal>
                  <AlertDialog.Overlay className="fixed inset-0 bg-black/50" />
                  <AlertDialog.Content 
                    className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-lg p-6 max-w-md w-full shadow-xl"
                    style={{ backgroundColor: theme.bg.card, border: `1px solid ${theme.border.subtle}` }}
                  >
                    <AlertDialog.Title className="text-lg font-bold mb-2" style={{ color: theme.text.main }}>
                      Are you absolutely sure?
                    </AlertDialog.Title>
                    <AlertDialog.Description className="text-sm mb-6" style={{ color: theme.text.secondary }}>
                      This action cannot be undone. This will permanently delete your account.
                    </AlertDialog.Description>
                    <div className="flex justify-end gap-3">
                      <AlertDialog.Cancel asChild>
                        <button 
                          className="px-4 py-2 rounded-lg text-sm font-medium"
                          style={{ backgroundColor: theme.bg.input, color: theme.text.main }}
                        >
                          Cancel
                        </button>
                      </AlertDialog.Cancel>
                      <AlertDialog.Action asChild>
                        <button 
                          className="px-4 py-2 rounded-lg text-sm font-bold"
                          style={{ backgroundColor: theme.semantic.error.main, color: '#FFFFFF' }}
                        >
                          Yes, delete account
                        </button>
                      </AlertDialog.Action>
                    </div>
                  </AlertDialog.Content>
                </AlertDialog.Portal>
              </AlertDialog.Root>
            </div>
          </div>
        );

      case 'aspect-ratio':
        return (
          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-bold mb-4" style={{ color: theme.text.main }}>Aspect Ratio</h3>
              <div className="space-y-4 max-w-md">
                <AspectRatio.Root ratio={16 / 9} className="overflow-hidden rounded-lg" style={{ backgroundColor: theme.bg.input }}>
                  <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: theme.action.primary }}>
                    <span style={{ color: theme.text.onPrimary }}>16:9</span>
                  </div>
                </AspectRatio.Root>
                <AspectRatio.Root ratio={4 / 3} className="overflow-hidden rounded-lg" style={{ backgroundColor: theme.bg.input }}>
                  <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: theme.action.primary }}>
                    <span style={{ color: theme.text.onPrimary }}>4:3</span>
                  </div>
                </AspectRatio.Root>
                <AspectRatio.Root ratio={1} className="overflow-hidden rounded-lg" style={{ backgroundColor: theme.bg.input }}>
                  <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: theme.action.primary }}>
                    <span style={{ color: theme.text.onPrimary }}>1:1</span>
                  </div>
                </AspectRatio.Root>
              </div>
            </div>
          </div>
        );

      case 'avatar':
        return (
          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-bold mb-4" style={{ color: theme.text.main }}>Avatar</h3>
              <div className="flex items-center gap-4">
                <Avatar.Root className="w-12 h-12 rounded-full flex items-center justify-center overflow-hidden" style={{ backgroundColor: theme.action.primary }}>
                  <Avatar.Image src="https://i.pravatar.cc/150?img=1" alt="Avatar" />
                  <Avatar.Fallback style={{ color: theme.text.onPrimary }}>JD</Avatar.Fallback>
                </Avatar.Root>
                <Avatar.Root className="w-16 h-16 rounded-full flex items-center justify-center overflow-hidden" style={{ backgroundColor: theme.action.primary }}>
                  <Avatar.Image src="https://i.pravatar.cc/150?img=2" alt="Avatar" />
                  <Avatar.Fallback style={{ color: theme.text.onPrimary }}>AB</Avatar.Fallback>
                </Avatar.Root>
                <Avatar.Root className="w-20 h-20 rounded-full flex items-center justify-center overflow-hidden" style={{ backgroundColor: theme.action.primary }}>
                  <Avatar.Fallback style={{ color: theme.text.onPrimary }}>CD</Avatar.Fallback>
                </Avatar.Root>
              </div>
            </div>
          </div>
        );

      case 'checkbox':
        return (
          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-bold mb-4" style={{ color: theme.text.main }}>Checkbox States</h3>
              <div className="space-y-4">
                {[
                  { label: 'Checked', checked: true, disabled: false },
                  { label: 'Unchecked', checked: false, disabled: false },
                  { label: 'Disabled Checked', checked: true, disabled: true },
                  { label: 'Disabled Unchecked', checked: false, disabled: true },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Checkbox.Root
                      className="w-5 h-5 rounded border-2 flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      checked={item.checked}
                      disabled={item.disabled}
                      style={{
                        backgroundColor: item.checked ? theme.action.primary : theme.bg.input,
                        borderColor: item.checked ? theme.action.primary : theme.border.default,
                      }}
                    >
                      <Checkbox.Indicator>
                        <HiCheck className="w-4 h-4" style={{ color: theme.text.onPrimary }} />
                      </Checkbox.Indicator>
                    </Checkbox.Root>
                    <Label.Root className="text-sm" style={{ color: item.disabled ? theme.text.tertiary : theme.text.main }}>
                      {item.label}
                    </Label.Root>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'collapsible':
        return (
          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-bold mb-4" style={{ color: theme.text.main }}>Collapsible</h3>
              <Collapsible.Root className="w-full max-w-md">
                <Collapsible.Trigger asChild>
                  <button 
                    className="w-full px-4 py-3 flex items-center justify-between rounded-lg border transition-all"
                    style={{ 
                      backgroundColor: theme.bg.input, 
                      borderColor: theme.border.default,
                      color: theme.text.main 
                    }}
                  >
                    <span>@peduarte starred 3 repositories</span>
                    <HiChevronDown className="w-4 h-4" />
                  </button>
                </Collapsible.Trigger>
                <Collapsible.Content className="mt-2 p-4 rounded-lg border" style={{ backgroundColor: theme.bg.card, borderColor: theme.border.subtle }}>
                  <div className="space-y-2">
                    <div className="text-sm" style={{ color: theme.text.secondary }}>@radix-ui/primitives</div>
                    <div className="text-sm" style={{ color: theme.text.secondary }}>@radix-ui/colors</div>
                    <div className="text-sm" style={{ color: theme.text.secondary }}>@stitches/react</div>
                  </div>
                </Collapsible.Content>
              </Collapsible.Root>
            </div>
          </div>
        );

      case 'context-menu':
        return (
          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-bold mb-4" style={{ color: theme.text.main }}>Context Menu</h3>
              <ContextMenu.Root>
                <ContextMenu.Trigger asChild>
                  <div 
                    className="w-64 h-32 rounded-lg border-2 border-dashed flex items-center justify-center cursor-pointer"
                    style={{ borderColor: theme.border.default, backgroundColor: theme.bg.input }}
                  >
                    <span style={{ color: theme.text.secondary }}>Right click here</span>
                  </div>
                </ContextMenu.Trigger>
                <ContextMenu.Portal>
                  <ContextMenu.Content 
                    className="min-w-[200px] rounded-lg p-1 shadow-lg border"
                    style={{ backgroundColor: theme.bg.card, borderColor: theme.border.subtle }}
                  >
                    <ContextMenu.Item 
                      className="px-3 py-2 rounded text-sm cursor-pointer focus:outline-none"
                      style={{ color: theme.text.main }}
                    >
                      Back
                    </ContextMenu.Item>
                    <ContextMenu.Item 
                      className="px-3 py-2 rounded text-sm cursor-pointer focus:outline-none"
                      style={{ color: theme.text.main }}
                    >
                      Forward
                    </ContextMenu.Item>
                    <ContextMenu.Separator className="h-px my-1" style={{ backgroundColor: theme.border.subtle }} />
                    <ContextMenu.Item 
                      className="px-3 py-2 rounded text-sm cursor-pointer focus:outline-none"
                      style={{ color: theme.text.main }}
                    >
                      Reload
                    </ContextMenu.Item>
                  </ContextMenu.Content>
                </ContextMenu.Portal>
              </ContextMenu.Root>
            </div>
          </div>
        );

      case 'dialog':
        return (
          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-bold mb-4" style={{ color: theme.text.main }}>Dialog</h3>
              <Dialog.Root>
                <Dialog.Trigger asChild>
                  <button 
                    className="px-4 py-2 rounded-lg text-sm font-bold transition-all"
                    style={{ backgroundColor: theme.action.primary, color: theme.text.onPrimary }}
                  >
                    Open Dialog
                  </button>
                </Dialog.Trigger>
                <Dialog.Portal>
                  <Dialog.Overlay className="fixed inset-0 bg-black/50" />
                  <Dialog.Content 
                    className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-lg p-6 max-w-md w-full shadow-xl"
                    style={{ backgroundColor: theme.bg.card, border: `1px solid ${theme.border.subtle}` }}
                  >
                    <Dialog.Title className="text-lg font-bold mb-2" style={{ color: theme.text.main }}>
                      Edit profile
                    </Dialog.Title>
                    <Dialog.Description className="text-sm mb-4" style={{ color: theme.text.secondary }}>
                      Make changes to your profile here. Click save when you're done.
                    </Dialog.Description>
                    <div className="space-y-4">
                      <input 
                        className="w-full px-3 py-2 rounded-lg text-sm"
                        placeholder="Name"
                        style={{ 
                          backgroundColor: theme.bg.input, 
                          color: theme.text.main,
                          border: `1px solid ${theme.border.default}`
                        }}
                      />
                    </div>
                    <div className="flex justify-end gap-3 mt-6">
                      <Dialog.Close asChild>
                        <button 
                          className="px-4 py-2 rounded-lg text-sm font-medium"
                          style={{ backgroundColor: theme.bg.input, color: theme.text.main }}
                        >
                          Cancel
                        </button>
                      </Dialog.Close>
                      <Dialog.Close asChild>
                        <button 
                          className="px-4 py-2 rounded-lg text-sm font-bold"
                          style={{ backgroundColor: theme.action.primary, color: theme.text.onPrimary }}
                        >
                          Save changes
                        </button>
                      </Dialog.Close>
                    </div>
                    <Dialog.Close asChild>
                      <button 
                        className="absolute top-4 right-4 p-1 rounded"
                        style={{ color: theme.text.secondary }}
                      >
                        <HiX className="w-5 h-5" />
                      </button>
                    </Dialog.Close>
                  </Dialog.Content>
                </Dialog.Portal>
              </Dialog.Root>
            </div>
          </div>
        );

      case 'dropdown-menu':
        return (
          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-bold mb-4" style={{ color: theme.text.main }}>Dropdown Menu</h3>
              <DropdownMenu.Root>
                <DropdownMenu.Trigger asChild>
                  <button 
                    className="px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2"
                    style={{ backgroundColor: theme.action.primary, color: theme.text.onPrimary }}
                  >
                    Options
                    <HiChevronDown className="w-4 h-4" />
                  </button>
                </DropdownMenu.Trigger>
                <DropdownMenu.Portal>
                  <DropdownMenu.Content 
                    className="min-w-[200px] rounded-lg p-1 shadow-lg border"
                    style={{ backgroundColor: theme.bg.card, borderColor: theme.border.subtle }}
                  >
                    <DropdownMenu.Item 
                      className="px-3 py-2 rounded text-sm cursor-pointer focus:outline-none"
                      style={{ color: theme.text.main }}
                    >
                      New Tab
                    </DropdownMenu.Item>
                    <DropdownMenu.Item 
                      className="px-3 py-2 rounded text-sm cursor-pointer focus:outline-none"
                      style={{ color: theme.text.main }}
                    >
                      New Window
                    </DropdownMenu.Item>
                    <DropdownMenu.Separator className="h-px my-1" style={{ backgroundColor: theme.border.subtle }} />
                    <DropdownMenu.Item 
                      className="px-3 py-2 rounded text-sm cursor-pointer focus:outline-none"
                      style={{ color: theme.text.main }}
                    >
                      Bookmarks
                    </DropdownMenu.Item>
                  </DropdownMenu.Content>
                </DropdownMenu.Portal>
              </DropdownMenu.Root>
            </div>
          </div>
        );

      case 'form':
        return (
          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-bold mb-4" style={{ color: theme.text.main }}>Form</h3>
              <form className="space-y-4 max-w-md">
                <div>
                  <Label.Root className="block text-sm font-medium mb-2" style={{ color: theme.text.main }}>
                    Email
                  </Label.Root>
                  <input 
                    type="email"
                    className="w-full px-3 py-2 rounded-lg text-sm transition-all focus:outline-none focus:ring-2"
                    placeholder="email@example.com"
                    style={{ 
                      backgroundColor: theme.bg.input, 
                      color: theme.text.main,
                      border: `1px solid ${theme.border.default}`
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = theme.border.focus;
                      e.target.style.boxShadow = `0 0 0 3px ${theme.border.focus}33`;
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = theme.border.default;
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                </div>
                <div>
                  <Label.Root className="block text-sm font-medium mb-2" style={{ color: theme.text.main }}>
                    Password
                  </Label.Root>
                  <input 
                    type="password"
                    className="w-full px-3 py-2 rounded-lg text-sm transition-all focus:outline-none focus:ring-2"
                    placeholder="••••••••"
                    style={{ 
                      backgroundColor: theme.bg.input, 
                      color: theme.text.main,
                      border: `1px solid ${theme.border.default}`
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = theme.border.focus;
                      e.target.style.boxShadow = `0 0 0 3px ${theme.border.focus}33`;
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = theme.border.default;
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                </div>
                <button 
                  type="submit"
                  className="w-full px-4 py-2 rounded-lg text-sm font-bold transition-all"
                  style={{ backgroundColor: theme.action.primary, color: theme.text.onPrimary }}
                >
                  Submit
                </button>
              </form>
            </div>
          </div>
        );

      case 'hover-card':
        return (
          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-bold mb-4" style={{ color: theme.text.main }}>Hover Card</h3>
              <HoverCard.Root>
                <HoverCard.Trigger asChild>
                  <button 
                    className="px-4 py-2 rounded-lg text-sm font-bold underline"
                    style={{ color: theme.action.primary }}
                  >
                    @radix-ui
                  </button>
                </HoverCard.Trigger>
                <HoverCard.Portal>
                  <HoverCard.Content 
                    className="w-64 rounded-lg p-4 shadow-lg border"
                    style={{ backgroundColor: theme.bg.card, borderColor: theme.border.subtle }}
                  >
                    <div className="flex gap-4">
                      <Avatar.Root className="w-12 h-12 rounded-full flex items-center justify-center overflow-hidden" style={{ backgroundColor: theme.action.primary }}>
                        <Avatar.Fallback style={{ color: theme.text.onPrimary }}>RU</Avatar.Fallback>
                      </Avatar.Root>
                      <div>
                        <div className="font-bold mb-1" style={{ color: theme.text.main }}>@radix-ui</div>
                        <div className="text-sm mb-2" style={{ color: theme.text.secondary }}>
                          Components, icons, colors, and templates for building high-quality design systems and web apps.
                        </div>
                      </div>
                    </div>
                    <HoverCard.Arrow style={{ fill: theme.bg.card }} />
                  </HoverCard.Content>
                </HoverCard.Portal>
              </HoverCard.Root>
            </div>
          </div>
        );

      case 'label':
        return (
          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-bold mb-4" style={{ color: theme.text.main }}>Label Variants</h3>
              <div className="space-y-4 max-w-md">
                <div>
                  <Label.Root className="block text-sm font-medium mb-2" style={{ color: theme.text.main }}>
                    Default Label
                  </Label.Root>
                  <input 
                    className="w-full px-3 py-2 rounded-lg text-sm"
                    placeholder="Input with label"
                    style={{ 
                      backgroundColor: theme.bg.input, 
                      color: theme.text.main,
                      border: `1px solid ${theme.border.default}`
                    }}
                  />
                </div>
                <div>
                  <Label.Root className="block text-sm font-bold mb-2" style={{ color: theme.text.secondary }}>
                    Secondary Label
                  </Label.Root>
                  <input 
                    className="w-full px-3 py-2 rounded-lg text-sm"
                    placeholder="Input with secondary label"
                    style={{ 
                      backgroundColor: theme.bg.input, 
                      color: theme.text.main,
                      border: `1px solid ${theme.border.default}`
                    }}
                  />
                </div>
                <div>
                  <Label.Root className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: theme.text.tertiary }}>
                    Small Uppercase Label
                  </Label.Root>
                  <input 
                    className="w-full px-3 py-2 rounded-lg text-sm"
                    placeholder="Input with small label"
                    style={{ 
                      backgroundColor: theme.bg.input, 
                      color: theme.text.main,
                      border: `1px solid ${theme.border.default}`
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case 'menubar':
        return (
          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-bold mb-4" style={{ color: theme.text.main }}>Menubar</h3>
              <Menubar.Root className="flex gap-1 p-1 rounded-lg border" style={{ backgroundColor: theme.bg.input, borderColor: theme.border.subtle }}>
                <Menubar.Menu>
                  <Menubar.Trigger className="px-3 py-1.5 rounded text-sm" style={{ color: theme.text.main }}>File</Menubar.Trigger>
                  <Menubar.Portal>
                    <Menubar.Content 
                      className="min-w-[200px] rounded-lg p-1 shadow-lg border"
                      style={{ backgroundColor: theme.bg.card, borderColor: theme.border.subtle }}
                    >
                      <Menubar.Item className="px-3 py-2 rounded text-sm" style={{ color: theme.text.main }}>New Tab</Menubar.Item>
                      <Menubar.Item className="px-3 py-2 rounded text-sm" style={{ color: theme.text.main }}>New Window</Menubar.Item>
                    </Menubar.Content>
                  </Menubar.Portal>
                </Menubar.Menu>
                <Menubar.Menu>
                  <Menubar.Trigger className="px-3 py-1.5 rounded text-sm" style={{ color: theme.text.main }}>Edit</Menubar.Trigger>
                  <Menubar.Portal>
                    <Menubar.Content 
                      className="min-w-[200px] rounded-lg p-1 shadow-lg border"
                      style={{ backgroundColor: theme.bg.card, borderColor: theme.border.subtle }}
                    >
                      <Menubar.Item className="px-3 py-2 rounded text-sm" style={{ color: theme.text.main }}>Cut</Menubar.Item>
                      <Menubar.Item className="px-3 py-2 rounded text-sm" style={{ color: theme.text.main }}>Copy</Menubar.Item>
                      <Menubar.Item className="px-3 py-2 rounded text-sm" style={{ color: theme.text.main }}>Paste</Menubar.Item>
                    </Menubar.Content>
                  </Menubar.Portal>
                </Menubar.Menu>
              </Menubar.Root>
            </div>
          </div>
        );

      case 'navigation-menu':
        return (
          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-bold mb-4" style={{ color: theme.text.main }}>Navigation Menu</h3>
              <NavigationMenu.Root>
                <NavigationMenu.List className="flex gap-2">
                  <NavigationMenu.Item>
                    <NavigationMenu.Trigger 
                      className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
                      style={{ 
                        color: theme.text.main,
                        backgroundColor: 'transparent'
                      }}
                    >
                      Products
                    </NavigationMenu.Trigger>
                    <NavigationMenu.Content className="absolute top-full left-0 w-full p-4 rounded-lg border shadow-lg mt-2" style={{ backgroundColor: theme.bg.card, borderColor: theme.border.subtle }}>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="font-bold mb-2" style={{ color: theme.text.main }}>Overview</div>
                          <div className="text-sm" style={{ color: theme.text.secondary }}>Get started with our product</div>
                        </div>
                        <div>
                          <div className="font-bold mb-2" style={{ color: theme.text.main }}>Features</div>
                          <div className="text-sm" style={{ color: theme.text.secondary }}>See what we offer</div>
                        </div>
                      </div>
                    </NavigationMenu.Content>
                  </NavigationMenu.Item>
                  <NavigationMenu.Item>
                    <NavigationMenu.Link 
                      className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
                      style={{ color: theme.text.main }}
                    >
                      Company
                    </NavigationMenu.Link>
                  </NavigationMenu.Item>
                </NavigationMenu.List>
                <NavigationMenu.Viewport />
              </NavigationMenu.Root>
            </div>
          </div>
        );

      case 'popover':
        return (
          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-bold mb-4" style={{ color: theme.text.main }}>Popover</h3>
              <Popover.Root>
                <Popover.Trigger asChild>
                  <button 
                    className="px-4 py-2 rounded-lg text-sm font-bold transition-all"
                    style={{ backgroundColor: theme.action.primary, color: theme.text.onPrimary }}
                  >
                    Open Popover
                  </button>
                </Popover.Trigger>
                <Popover.Portal>
                  <Popover.Content 
                    className="w-64 rounded-lg p-4 shadow-lg border"
                    style={{ backgroundColor: theme.bg.card, borderColor: theme.border.subtle }}
                  >
                    <Popover.Close asChild>
                      <button 
                        className="absolute top-2 right-2 p-1 rounded"
                        style={{ color: theme.text.secondary }}
                      >
                        <HiX className="w-4 h-4" />
                      </button>
                    </Popover.Close>
                    <div className="font-bold mb-2" style={{ color: theme.text.main }}>Dimensions</div>
                    <div className="text-sm mb-4" style={{ color: theme.text.secondary }}>
                      Width: 100px<br />
                      Height: 100px
                    </div>
                    <Popover.Arrow style={{ fill: theme.bg.card }} />
                  </Popover.Content>
                </Popover.Portal>
              </Popover.Root>
            </div>
          </div>
        );

      case 'progress':
        return (
          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-bold mb-4" style={{ color: theme.text.main }}>Progress</h3>
              <div className="space-y-4 max-w-md">
                <div>
                  <Label.Root className="block text-sm font-medium mb-2" style={{ color: theme.text.main }}>
                    Progress 25%
                  </Label.Root>
                  <Progress.Root 
                    className="relative h-2 w-full overflow-hidden rounded-full"
                    style={{ backgroundColor: theme.bg.input }}
                    value={25}
                  >
                    <Progress.Indicator 
                      className="h-full transition-all"
                      style={{ backgroundColor: theme.action.primary, width: '25%' }}
                    />
                  </Progress.Root>
                </div>
                <div>
                  <Label.Root className="block text-sm font-medium mb-2" style={{ color: theme.text.main }}>
                    Progress 50%
                  </Label.Root>
                  <Progress.Root 
                    className="relative h-2 w-full overflow-hidden rounded-full"
                    style={{ backgroundColor: theme.bg.input }}
                    value={50}
                  >
                    <Progress.Indicator 
                      className="h-full transition-all"
                      style={{ backgroundColor: theme.action.primary, width: '50%' }}
                    />
                  </Progress.Root>
                </div>
                <div>
                  <Label.Root className="block text-sm font-medium mb-2" style={{ color: theme.text.main }}>
                    Progress 75%
                  </Label.Root>
                  <Progress.Root 
                    className="relative h-2 w-full overflow-hidden rounded-full"
                    style={{ backgroundColor: theme.bg.input }}
                    value={75}
                  >
                    <Progress.Indicator 
                      className="h-full transition-all"
                      style={{ backgroundColor: theme.action.primary, width: '75%' }}
                    />
                  </Progress.Root>
                </div>
                <div>
                  <Label.Root className="block text-sm font-medium mb-2" style={{ color: theme.text.main }}>
                    Progress 100%
                  </Label.Root>
                  <Progress.Root 
                    className="relative h-2 w-full overflow-hidden rounded-full"
                    style={{ backgroundColor: theme.bg.input }}
                    value={100}
                  >
                    <Progress.Indicator 
                      className="h-full transition-all"
                      style={{ backgroundColor: theme.semantic.success.main, width: '100%' }}
                    />
                  </Progress.Root>
                </div>
              </div>
            </div>
          </div>
        );

      case 'radio-group':
        return (
          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-bold mb-4" style={{ color: theme.text.main }}>Radio Button Groups</h3>
              <RadioGroup.Root defaultValue="option1" className="space-y-3">
                {['Option 1', 'Option 2', 'Option 3'].map((option, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <RadioGroup.Item
                      value={`option${i + 1}`}
                      className="w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all"
                      style={{
                        borderColor: theme.border.default,
                      }}
                    >
                      <RadioGroup.Indicator
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: theme.action.primary }}
                      />
                    </RadioGroup.Item>
                    <Label.Root className="text-sm" style={{ color: theme.text.main }}>
                      {option}
                    </Label.Root>
                  </div>
                ))}
              </RadioGroup.Root>
            </div>
            <div>
              <h3 className="text-lg font-bold mb-4" style={{ color: theme.text.main }}>Disabled Radio</h3>
              <div className="flex items-center gap-3 opacity-50">
                <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center" style={{ borderColor: theme.border.default }}>
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: theme.action.primary }} />
                </div>
                <Label.Root className="text-sm" style={{ color: theme.text.tertiary }}>
                  Disabled Option
                </Label.Root>
              </div>
            </div>
          </div>
        );

      case 'scroll-area':
        return (
          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-bold mb-4" style={{ color: theme.text.main }}>Scroll Area</h3>
              <ScrollArea.Root className="w-full max-w-md h-64 rounded-lg border overflow-hidden" style={{ borderColor: theme.border.subtle }}>
                <ScrollArea.Viewport className="w-full h-full p-4" style={{ backgroundColor: theme.bg.card }}>
                  <div className="space-y-2">
                    {Array.from({ length: 20 }, (_, i) => (
                      <div key={i} className="p-3 rounded" style={{ backgroundColor: theme.bg.input }}>
                        <div className="font-medium" style={{ color: theme.text.main }}>Item {i + 1}</div>
                        <div className="text-sm" style={{ color: theme.text.secondary }}>Scrollable content</div>
                      </div>
                    ))}
                  </div>
                </ScrollArea.Viewport>
                <ScrollArea.Scrollbar 
                  className="flex touch-none select-none transition-colors"
                  orientation="vertical"
                >
                  <ScrollArea.Thumb 
                    className="flex-1 rounded-full relative"
                    style={{ backgroundColor: theme.border.default }}
                  />
                </ScrollArea.Scrollbar>
              </ScrollArea.Root>
            </div>
          </div>
        );

      case 'select':
        return (
          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-bold mb-4" style={{ color: theme.text.main }}>Select Dropdown</h3>
              <div className="space-y-4 max-w-md">
                <div>
                  <Label.Root className="block text-sm font-medium mb-2" style={{ color: theme.text.main }}>
                    Select Option
                  </Label.Root>
                  <Select.Root>
                    <Select.Trigger
                      className="w-full px-3 py-2 rounded-lg text-sm flex items-center justify-between transition-all focus:outline-none focus:ring-2"
                      style={{
                        backgroundColor: theme.bg.input,
                        color: theme.text.main,
                        border: `1px solid ${theme.border.default}`,
                      }}
                    >
                      <Select.Value placeholder="Choose an option..." />
                      <Select.Icon>
                        <HiChevronDown className="w-4 h-4" />
                      </Select.Icon>
                    </Select.Trigger>
                    <Select.Portal>
                      <Select.Content
                        className="rounded-lg shadow-lg border min-w-[200px] p-1"
        style={{ 
            backgroundColor: theme.bg.card, 
                          borderColor: theme.border.subtle,
                        }}
                      >
                        <Select.ScrollUpButton className="flex items-center justify-center h-6">
                          <HiChevronUp className="w-4 h-4" style={{ color: theme.text.secondary }} />
                        </Select.ScrollUpButton>
                        <Select.Viewport>
                          {['Option 1', 'Option 2', 'Option 3', 'Option 4'].map((option, i) => (
                            <Select.Item
                              key={i}
                              value={option.toLowerCase().replace(' ', '-')}
                              className="px-3 py-2 rounded text-sm cursor-pointer focus:outline-none"
                              style={{
                                color: theme.text.main,
                              }}
                            >
                              <Select.ItemText>{option}</Select.ItemText>
                            </Select.Item>
                          ))}
                        </Select.Viewport>
                        <Select.ScrollDownButton className="flex items-center justify-center h-6">
                          <HiChevronDown className="w-4 h-4" style={{ color: theme.text.secondary }} />
                        </Select.ScrollDownButton>
                      </Select.Content>
                    </Select.Portal>
                  </Select.Root>
                </div>
                <div>
                  <Label.Root className="block text-sm font-medium mb-2" style={{ color: theme.text.main }}>
                    Disabled Select
                  </Label.Root>
                  <div
                    className="w-full px-3 py-2 rounded-lg text-sm flex items-center justify-between opacity-50 cursor-not-allowed"
                    style={{
                      backgroundColor: theme.bg.input,
                      color: theme.text.tertiary,
                      border: `1px solid ${theme.border.subtle}`,
                    }}
                  >
                    <span>Disabled option</span>
                    <HiChevronDown className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </div>
      </div>
  );

      case 'separator':
        return (
          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-bold mb-4" style={{ color: theme.text.main }}>Separator</h3>
              <div className="space-y-4 max-w-md">
                <div>
                  <div className="text-sm mb-2" style={{ color: theme.text.main }}>Section 1</div>
                  <Separator.Root className="h-px my-4" style={{ backgroundColor: theme.border.subtle }} />
                  <div className="text-sm" style={{ color: theme.text.main }}>Section 2</div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-sm" style={{ color: theme.text.main }}>Left</div>
                  <Separator.Root className="h-4 w-px" style={{ backgroundColor: theme.border.subtle }} />
                  <div className="text-sm" style={{ color: theme.text.main }}>Right</div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'slider':
        return (
          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-bold mb-4" style={{ color: theme.text.main }}>Slider</h3>
              <div className="space-y-6 max-w-md">
                <div>
                  <Label.Root className="block text-sm font-medium mb-2" style={{ color: theme.text.main }}>
                    Volume: 50
                  </Label.Root>
                  <Slider.Root 
                    className="relative flex items-center select-none touch-none w-full h-5"
                    defaultValue={[50]}
                    max={100}
                    step={1}
                  >
                    <Slider.Track 
                      className="bg-black/10 relative grow rounded-full h-2"
                      style={{ backgroundColor: theme.bg.input }}
                    >
                      <Slider.Range 
                        className="absolute bg-white rounded-full h-full"
                        style={{ backgroundColor: theme.action.primary }}
                      />
                    </Slider.Track>
                    <Slider.Thumb 
                      className="block w-5 h-5 bg-white shadow-lg rounded-full focus:outline-none focus:ring-2"
                      style={{ 
                        backgroundColor: theme.action.primary,
                        border: `2px solid ${theme.action.primary}`
                      }}
                    />
                  </Slider.Root>
                </div>
                <div>
                  <Label.Root className="block text-sm font-medium mb-2" style={{ color: theme.text.main }}>
                    Range: 25 - 75
                  </Label.Root>
                  <Slider.Root 
                    className="relative flex items-center select-none touch-none w-full h-5"
                    defaultValue={[25, 75]}
                    max={100}
                    step={1}
                  >
                    <Slider.Track 
                      className="bg-black/10 relative grow rounded-full h-2"
                      style={{ backgroundColor: theme.bg.input }}
                    >
                      <Slider.Range 
                        className="absolute bg-white rounded-full h-full"
                        style={{ backgroundColor: theme.action.primary }}
                      />
                    </Slider.Track>
                    <Slider.Thumb 
                      className="block w-5 h-5 bg-white shadow-lg rounded-full focus:outline-none focus:ring-2"
                      style={{ 
                        backgroundColor: theme.action.primary,
                        border: `2px solid ${theme.action.primary}`
                      }}
                    />
                    <Slider.Thumb 
                      className="block w-5 h-5 bg-white shadow-lg rounded-full focus:outline-none focus:ring-2"
                      style={{ 
                        backgroundColor: theme.action.primary,
                        border: `2px solid ${theme.action.primary}`
                      }}
                    />
                  </Slider.Root>
                </div>
              </div>
            </div>
          </div>
        );

      case 'switch':
        return (
          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-bold mb-4" style={{ color: theme.text.main }}>Switch States</h3>
              <div className="space-y-4">
                {[
                  { label: 'Enabled Switch', checked: true, disabled: false },
                  { label: 'Disabled Switch', checked: false, disabled: false },
                  { label: 'Disabled (On)', checked: true, disabled: true },
                  { label: 'Disabled (Off)', checked: false, disabled: true },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <Label.Root className="text-sm" style={{ color: item.disabled ? theme.text.tertiary : theme.text.main }}>
                      {item.label}
                    </Label.Root>
                    <Switch.Root
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${item.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                      checked={item.checked}
                      disabled={item.disabled}
                      style={{
                        backgroundColor: item.checked ? theme.action.primary : theme.bg.input,
                      }}
                    >
                      <Switch.Thumb
                        className="inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ease-in-out"
                        style={{
                          transform: item.checked ? 'translateX(24px)' : 'translateX(4px)',
                        }}
                      />
                    </Switch.Root>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'tabs':
        return (
          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-bold mb-4" style={{ color: theme.text.main }}>Tabs</h3>
              <Tabs.Root defaultValue="tab1" className="w-full max-w-md">
                <Tabs.List className="flex border-b" style={{ borderColor: theme.border.subtle }}>
                  <Tabs.Trigger 
                    value="tab1"
                    className="px-4 py-2 text-sm font-medium border-b-2 transition-all"
                    style={{ 
                      color: theme.text.main,
                      borderBottomColor: 'transparent'
                    }}
                  >
                    Account
                  </Tabs.Trigger>
                  <Tabs.Trigger 
                    value="tab2"
                    className="px-4 py-2 text-sm font-medium border-b-2 transition-all"
                    style={{ 
                      color: theme.text.main,
                      borderBottomColor: 'transparent'
                    }}
                  >
                    Password
                  </Tabs.Trigger>
                  <Tabs.Trigger 
                    value="tab3"
                    className="px-4 py-2 text-sm font-medium border-b-2 transition-all"
                    style={{ 
                      color: theme.text.main,
                      borderBottomColor: 'transparent'
                    }}
                  >
                    Settings
                  </Tabs.Trigger>
                </Tabs.List>
                <Tabs.Content value="tab1" className="mt-4 p-4 rounded-lg" style={{ backgroundColor: theme.bg.input }}>
                  <div className="text-sm" style={{ color: theme.text.main }}>Make changes to your account here.</div>
                </Tabs.Content>
                <Tabs.Content value="tab2" className="mt-4 p-4 rounded-lg" style={{ backgroundColor: theme.bg.input }}>
                  <div className="text-sm" style={{ color: theme.text.main }}>Change your password here.</div>
                </Tabs.Content>
                <Tabs.Content value="tab3" className="mt-4 p-4 rounded-lg" style={{ backgroundColor: theme.bg.input }}>
                  <div className="text-sm" style={{ color: theme.text.main }}>Manage your settings here.</div>
                </Tabs.Content>
              </Tabs.Root>
            </div>
          </div>
        );

      case 'toast':
        return (
          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-bold mb-4" style={{ color: theme.text.main }}>Toast</h3>
              <Toast.Provider>
      <button 
                  onClick={() => setToastOpen(true)}
                  className="px-4 py-2 rounded-lg text-sm font-bold transition-all"
        style={{ backgroundColor: theme.action.primary, color: theme.text.onPrimary }}
      >
                  Show Toast
      </button>
                <Toast.Root 
                  open={toastOpen}
                  onOpenChange={setToastOpen}
                  className="fixed bottom-4 right-4 p-4 rounded-lg shadow-lg border max-w-md"
                  style={{ 
                    backgroundColor: theme.bg.card, 
                    borderColor: theme.border.subtle 
                  }}
                >
                  <Toast.Title className="font-bold mb-1" style={{ color: theme.text.main }}>
                    Scheduled: Catch up
                  </Toast.Title>
                  <Toast.Description className="text-sm" style={{ color: theme.text.secondary }}>
                    Wednesday, January 1st at 5:57 PM
                  </Toast.Description>
                  <Toast.Close asChild>
                    <button 
                      className="absolute top-2 right-2 p-1 rounded"
                      style={{ color: theme.text.secondary }}
                    >
                      <HiX className="w-4 h-4" />
                    </button>
                  </Toast.Close>
                </Toast.Root>
                <Toast.Viewport />
              </Toast.Provider>
            </div>
          </div>
        );

      case 'toggle':
        return (
          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-bold mb-4" style={{ color: theme.text.main }}>Toggle</h3>
              <div className="flex flex-wrap gap-4">
                <Toggle.Root
                  className="px-4 py-2 rounded-lg text-sm font-medium transition-all data-[state=on]:shadow-md"
                  style={{
                    backgroundColor: theme.bg.input,
                    color: theme.text.main,
                  }}
                >
                  Bold
                </Toggle.Root>
                <Toggle.Root
                  className="px-4 py-2 rounded-lg text-sm font-medium transition-all data-[state=on]:shadow-md"
                  style={{
                    backgroundColor: theme.bg.input,
                    color: theme.text.main,
                  }}
                >
                  Italic
                </Toggle.Root>
                <Toggle.Root
                  className="px-4 py-2 rounded-lg text-sm font-medium transition-all data-[state=on]:shadow-md"
                  aria-label="Toggle underline"
                  style={{
                    backgroundColor: theme.action.primary,
                    color: theme.text.onPrimary,
                  }}
                >
                  <span className="underline">U</span>
                </Toggle.Root>
              </div>
            </div>
          </div>
        );

      case 'toggle-group':
        return (
          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-bold mb-4" style={{ color: theme.text.main }}>Toggle Group</h3>
              <ToggleGroup.Root type="single" className="flex gap-2">
                <ToggleGroup.Item
                  value="left"
                  className="px-4 py-2 rounded-lg text-sm font-medium transition-all data-[state=on]:shadow-md"
                  style={{
                    backgroundColor: theme.bg.input,
                    color: theme.text.main,
                  }}
                >
                  Left
                </ToggleGroup.Item>
                <ToggleGroup.Item
                  value="center"
                  className="px-4 py-2 rounded-lg text-sm font-medium transition-all data-[state=on]:shadow-md"
                  style={{
                    backgroundColor: theme.bg.input,
                    color: theme.text.main,
                  }}
                >
                  Center
                </ToggleGroup.Item>
                <ToggleGroup.Item
                  value="right"
                  className="px-4 py-2 rounded-lg text-sm font-medium transition-all data-[state=on]:shadow-md"
                  style={{
                    backgroundColor: theme.bg.input,
                    color: theme.text.main,
                  }}
                >
                  Right
                </ToggleGroup.Item>
              </ToggleGroup.Root>
            </div>
          </div>
        );

      case 'toolbar':
        return (
          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-bold mb-4" style={{ color: theme.text.main }}>Toolbar</h3>
              <Toolbar.Root 
                className="flex gap-1 p-2 rounded-lg border"
                style={{ backgroundColor: theme.bg.input, borderColor: theme.border.subtle }}
              >
                <Toolbar.Button
                  className="px-3 py-2 rounded text-sm font-medium"
                  style={{ color: theme.text.main }}
                >
                  Bold
                </Toolbar.Button>
                <Toolbar.Button
                  className="px-3 py-2 rounded text-sm font-medium"
                  style={{ color: theme.text.main }}
                >
                  Italic
                </Toolbar.Button>
                <Toolbar.Separator className="w-px mx-1" style={{ backgroundColor: theme.border.subtle }} />
                <Toolbar.Button
                  className="px-3 py-2 rounded text-sm font-medium"
                  style={{ color: theme.text.main }}
                >
                  Link
                </Toolbar.Button>
              </Toolbar.Root>
            </div>
          </div>
        );

      case 'tooltip':
        return (
          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-bold mb-4" style={{ color: theme.text.main }}>Tooltip</h3>
              <div className="flex gap-4">
                <Tooltip.Provider>
                  <Tooltip.Root>
                    <Tooltip.Trigger asChild>
      <button 
                        className="px-4 py-2 rounded-lg text-sm font-bold transition-all"
                        style={{ backgroundColor: theme.action.primary, color: theme.text.onPrimary }}
                      >
                        Hover me
                      </button>
                    </Tooltip.Trigger>
                    <Tooltip.Portal>
                      <Tooltip.Content 
                        className="px-3 py-2 rounded-lg text-sm shadow-lg border"
                        style={{ 
                          backgroundColor: theme.bg.card, 
                          borderColor: theme.border.subtle,
                          color: theme.text.main
                        }}
                      >
                        Add to library
                        <Tooltip.Arrow style={{ fill: theme.bg.card }} />
                      </Tooltip.Content>
                    </Tooltip.Portal>
                  </Tooltip.Root>
                </Tooltip.Provider>
                <Tooltip.Provider>
                  <Tooltip.Root>
                    <Tooltip.Trigger asChild>
                      <button 
                        className="px-4 py-2 rounded-lg text-sm font-bold transition-all"
        style={{ backgroundColor: theme.action.secondaryBg, color: theme.action.secondaryText }}
      >
                        Or me
      </button>
                    </Tooltip.Trigger>
                    <Tooltip.Portal>
                      <Tooltip.Content 
                        className="px-3 py-2 rounded-lg text-sm shadow-lg border"
                        style={{ 
                          backgroundColor: theme.bg.card, 
                          borderColor: theme.border.subtle,
                          color: theme.text.main
                        }}
                      >
                        Click to open
                        <Tooltip.Arrow style={{ fill: theme.bg.card }} />
                      </Tooltip.Content>
                    </Tooltip.Portal>
                  </Tooltip.Root>
                </Tooltip.Provider>
              </div>
            </div>
          </div>
        );

      default:
      return (
          <div className="text-center py-10" style={{ color: theme.text.secondary }}>
            Component view not implemented yet
          </div>
        );
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-full max-h-screen overflow-hidden">
        
        {/* --- COMPONENT MENU SIDEBAR --- */}
        <div className="w-full md:w-[280px] bg-slate-900 border-r border-white/5 flex flex-col shrink-0 overflow-y-auto custom-scrollbar z-10 shadow-2xl">
            <div className="p-6 border-b border-white/5">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <HiPuzzle className="w-4 h-4 text-indigo-500" />
                    UI Components
                </h3>
                <p className="text-xs text-slate-500 mt-2">
                    Browse components with your color tokens.
                </p>
            </div>

            {/* TABS */}
            <div className="px-4 pt-4 border-b border-white/5">
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setActiveTab('molecules');
                    setSelectedComponent('button');
                  }}
                  className={`flex-1 px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                    activeTab === 'molecules'
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  Molecules
                </button>
                <button
                  onClick={() => {
                    setActiveTab('organisms');
                    setSelectedComponent('accordion');
                  }}
                  className={`flex-1 px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                    activeTab === 'organisms'
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  Organisms
                </button>
              </div>
            </div>

            {/* COMPONENT LIST */}
            <div className="p-4 space-y-1">
                {(activeTab === 'molecules' ? molecules : organisms).map((comp) => (
                    <button
                        key={comp.id}
                        onClick={() => setSelectedComponent(comp.id)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all text-left ${
                            selectedComponent === comp.id
                                ? 'bg-indigo-600 text-white shadow-md'
                                : 'text-slate-400 hover:text-white hover:bg-slate-800'
                        }`}
                    >
                        <span style={{ color: selectedComponent === comp.id ? 'white' : 'inherit' }}>
                            {comp.icon}
                        </span>
                        <span>{comp.label}</span>
                    </button>
                ))}
            </div>

            <div className="p-6 border-t border-white/5 space-y-6">
                
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
                    <label className="text-xs font-bold text-slate-500 uppercase block mb-3">Primary Color</label>
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
                    <label className="text-xs font-bold text-slate-500 uppercase block mb-3">Background</label>
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
                    <label className="text-xs font-bold text-slate-500 uppercase block mb-3">Typography</label>
                    <div className="flex bg-slate-950 p-1 rounded-lg border border-white/5">
                        <button 
                            onClick={() => onConfigChange({ ...config, textMode: 'base' })}
                            className={`flex-1 py-2 text-[10px] font-bold uppercase rounded transition-all ${config.textMode === 'base' ? 'bg-slate-800 text-white shadow' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                            Gray
                        </button>
                        <button 
                            onClick={() => onConfigChange({ ...config, textMode: 'tinted' })}
                            className={`flex-1 py-2 text-[10px] font-bold uppercase rounded transition-all ${config.textMode === 'tinted' ? 'bg-slate-800 text-white shadow' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                            Tinted
                        </button>
                    </div>
                </div>

            </div>
        </div>

        {/* --- COMPONENT PREVIEW AREA --- */}
        <div 
            className="flex-1 overflow-hidden relative transition-colors duration-500"
            style={{ backgroundColor: theme.bg.page }}
        >
            <div className="h-full w-full overflow-y-auto p-6 md:p-8">
                <div className="max-w-4xl mx-auto">
                    <div className="mb-6">
                        <h2 className="text-2xl font-bold tracking-tight transition-colors mb-2" style={{ color: theme.text.main }}>
                            {(activeTab === 'molecules' ? molecules : organisms).find(c => c.id === selectedComponent)?.label}
                        </h2>
                        <p className="text-sm transition-colors" style={{ color: theme.text.secondary }}>
                            Explore all variants and states of {(activeTab === 'molecules' ? molecules : organisms).find(c => c.id === selectedComponent)?.label.toLowerCase()}
                        </p>
                        </div>
                    {renderComponentView()}
                        </div>
                    </div>
        </div>
    </div>
  );
};

export default UIPlayground;
