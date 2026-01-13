
import React, { useMemo, useState, useRef, useEffect } from 'react';
import { ColorData, PlaygroundConfig, GlobalCurveConfig } from '../types';
import { generateShades, getContrastRatio, getLuminance, hexToRgb } from '../utils/colorUtils';
import { generateUIFromPrompt } from '../services/uiDesignerService';
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
  HiCheck, HiChevronDown, HiChevronUp, HiChevronLeft, HiChevronRight, HiMenu, HiX, HiDotsVertical,
  HiFolder, HiFolderOpen, HiUser, HiUserCircle, HiCog, HiBell,
  HiSearch, HiFilter, HiViewGrid, HiCollection, HiCursorClick,
  HiLockClosed, HiEye, HiEyeOff, HiChartBar, HiAdjustments,
  HiVolumeUp, HiVolumeOff, HiSwitchHorizontal, HiTag, HiInformationCircle,
  HiExclamationCircle, HiQuestionMarkCircle, HiClipboard, HiDocument,
  HiPuzzle, HiCube, HiViewList, HiTemplate, HiCursorClick as HiCursorArrow, HiPhotograph as HiImage,
  HiSparkles, HiArrowLeft
} from 'react-icons/hi';
import { FaPaperPlane } from 'react-icons/fa';

interface UIPlaygroundProps {
  brandPalette: ColorData[];
  neutralPalette: ColorData[];
  semanticPalette: ColorData[];
  config: PlaygroundConfig;
  onConfigChange: (newConfig: PlaygroundConfig) => void;
  globalConfig?: GlobalCurveConfig;
  isPremium?: boolean;
  onOpenPricing?: () => void;
}

type MoleculeType = 
  | 'badge' | 'button' | 'checkbox' | 'input' | 'label' | 'pill' | 'progress'
  | 'radio' | 'select' | 'slider' | 'switch' | 'tag' | 'textarea';

type OrganismType = 
  | 'accordion' | 'alert-dialog' | 'aspect-ratio' | 'avatar' | 'collapsible'
  | 'context-menu' | 'dialog' | 'dropdown-menu' | 'form' | 'hover-card'
  | 'menubar' | 'navigation-menu' | 'popover' | 'radio-group' | 'scroll-area'
  | 'tabs' | 'toast' | 'toolbar' | 'tooltip';

type ComponentType = MoleculeType | OrganismType;

const UIPlayground: React.FC<UIPlaygroundProps> = ({ 
    brandPalette, 
    neutralPalette, 
    semanticPalette, 
    config, 
    onConfigChange,
    globalConfig,
    isPremium = false,
    onOpenPricing
}) => {
  const [activeTab, setActiveTab] = useState<'molecules' | 'organisms'>('molecules');
  const [selectedComponent, setSelectedComponent] = useState<ComponentType>('button');
  const [toastOpen, setToastOpen] = useState(false);
  const [checkboxStates, setCheckboxStates] = useState<{ [key: number]: boolean }>({});
  const [radioState, setRadioState] = useState<string>('option1');
  const [switchStates, setSwitchStates] = useState<{ [key: number]: boolean }>({});
  const [activeTabValue, setActiveTabValue] = useState<string>('tab1');
  const [isLeftSidebarExpanded, setIsLeftSidebarExpanded] = useState(true);
  const [isRightSidebarExpanded, setIsRightSidebarExpanded] = useState(true);
  
  // AI Assistant states
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiMessages, setAiMessages] = useState<Array<{ role: 'user' | 'assistant', text: string, code?: string }>>([]);
  const [isAIGenerating, setIsAIGenerating] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string>('');
  const [codeError, setCodeError] = useState<string>('');
  const [toastMessage, setToastMessage] = useState('');
  const [aiGeneratedComponent, setAiGeneratedComponent] = useState<{ code: string; componentName: string } | null>(null);
  const [originalTheme, setOriginalTheme] = useState<any>(null);
  const [savedGeneratedComponent, setSavedGeneratedComponent] = useState<{ code: string; componentName: string } | null>(null);
  const aiMessagesEndRef = useRef<HTMLDivElement>(null);
  const aiPromptRef = useRef<HTMLTextAreaElement>(null);
  
  const scrollToBottom = () => {
    aiMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  useEffect(() => {
    scrollToBottom();
  }, [aiMessages]);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = aiPromptRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`; // Max height 200px
    }
  }, [aiPrompt]);
  
  const showToast = (message: string) => {
    setToastMessage(message);
    setToastOpen(true);
    setTimeout(() => setToastOpen(false), 3000);
  };

  // Función para reemplazar URLs de Unsplash Source por Picsum Photos
  const replaceUnsplashUrls = (code: string): string => {
    if (!code) return code;
    
    let cleaned = code;
    
    // Reemplazar source.unsplash.com por picsum.photos
    // Patrón: https://source.unsplash.com/random/400x300/?keyword
    // O: https://source.unsplash.com/400x300/?keyword
    cleaned = cleaned.replace(
      /https?:\/\/source\.unsplash\.com\/(?:random\/)?(\d+)x(\d+)\/?(?:\?[^"'\s]*)?/g,
      (match, width, height) => {
        // Extraer keyword si existe
        const keywordMatch = match.match(/[?&]([^"'\s]+)$/);
        const keyword = keywordMatch ? keywordMatch[1].replace(/[?&=]/g, '') : 'random';
        // Usar el keyword como seed, o un número aleatorio si no hay keyword
        const seed = keyword && keyword !== 'random' ? keyword : Math.floor(Math.random() * 1000);
        return `https://picsum.photos/${width}/${height}?random=${seed}`;
      }
    );
    
    // También reemplazar imágenes.unsplash.com que puedan estar en el código
    // (aunque no deberían estar, pero por si acaso)
    cleaned = cleaned.replace(
      /https?:\/\/images\.unsplash\.com\/photo-[^"'\s]+/g,
      (match) => {
        // Extraer dimensiones si están en el código
        const sizeMatch = match.match(/(\d+)x(\d+)/);
        if (sizeMatch) {
          const [, width, height] = sizeMatch;
          return `https://picsum.photos/${width}/${height}?random=${Math.floor(Math.random() * 1000)}`;
        }
        return 'https://picsum.photos/400/300?random=' + Math.floor(Math.random() * 1000);
      }
    );
    
    return cleaned;
  };

  // Función para eliminar TODOS los imports
  const removeAllImports = (code: string): string => {
    if (!code) return code;
    
    let cleaned = code;
    
    // Eliminar imports multilínea y single line
    cleaned = cleaned.replace(/import\s+(?:(?:\{[^}]*\}|\*\s+as\s+\w+|\w+)(?:\s*,\s*(?:\{[^}]*\}|\*\s+as\s+\w+|\w+))*\s+from\s+['"][^'"]+['"];?|type\s+.*?\s+from\s+['"][^'"]+['"];?)/gs, '');
    
    // Eliminar cualquier línea que empiece con "import"
    cleaned = cleaned.split('\n').filter(line => {
      const trimmed = line.trim();
      return !trimmed.startsWith('import ') && !trimmed.startsWith('import\t');
    }).join('\n');
    
    // Limpiar líneas vacías múltiples
    cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
    
    return cleaned.trim();
  };

  // Función universal para escapar código antes de insertarlo en template literal
  // Usa JSON.stringify para escapar correctamente sin romper regex literales u otros patrones
  // Esto previene errores de sintaxis cuando el código generado contiene template literals o regex
  const escapeCodeForTemplate = (codeStr: string): string => {
    if (!codeStr) return codeStr;
    // JSON.stringify escapa correctamente todos los caracteres especiales sin romper regex literales
    // slice(1, -1) remueve las comillas externas que JSON.stringify agrega
    return JSON.stringify(codeStr).slice(1, -1);
  };

  // Función para detectar qué componentes de Radix UI se usan en el código
  const detectRadixComponents = (code: string): string[] => {
    const components: string[] = [];
    const allRadixComponents = [
      'AspectRatio', 'Avatar', 'ScrollArea', 'Toolbar', 'Tabs', 'Popover',
      'Card', 'Dialog', 'Select', 'Checkbox', 'RadioGroup', 'Switch',
      'Accordion', 'AlertDialog', 'DropdownMenu', 'HoverCard', 'Tooltip',
      'Progress', 'Slider', 'Separator', 'Label', 'Toast', 'Collapsible',
      'ContextMenu', 'NavigationMenu', 'Menubar'
    ];
    
    allRadixComponents.forEach(comp => {
      const patterns = [
        new RegExp(`${comp}\\.`, 'g'),
        new RegExp(`<${comp}\\.`, 'g'),
        new RegExp(`import.*${comp}`, 'gi'),
        new RegExp(`from.*react-${comp.toLowerCase().replace(/([A-Z])/g, '-$1')}`, 'gi')
      ];
      
      if (patterns.some(p => p.test(code))) {
        components.push(comp);
      }
    });
    
    return [...new Set(components)];
  };

  // Función para reemplazar referencias de theme con valores actuales
  const replaceThemeReferences = (code: string, currentTheme: any): string => {
    if (!code || !currentTheme) return code;
    
    let updatedCode = code;
    
    // Mapeo de referencias de theme a valores actuales
    const themeMap: { [key: string]: string } = {
      'theme.action.primary': currentTheme.action.primary,
      'theme.action.primaryHover': currentTheme.action.primaryHover,
      'theme.action.secondaryBg': currentTheme.action.secondaryBg,
      'theme.action.secondaryHover': currentTheme.action.secondaryHover,
      'theme.action.secondaryText': currentTheme.action.secondaryText,
      'theme.bg.page': currentTheme.bg.page,
      'theme.bg.card': currentTheme.bg.card,
      'theme.bg.sidebar': currentTheme.bg.sidebar,
      'theme.bg.input': currentTheme.bg.input,
      'theme.text.main': currentTheme.text.main,
      'theme.text.secondary': currentTheme.text.secondary,
      'theme.text.tertiary': currentTheme.text.tertiary,
      'theme.text.onPrimary': currentTheme.text.onPrimary,
      'theme.border.subtle': currentTheme.border.subtle,
      'theme.border.default': currentTheme.border.default,
      'theme.border.focus': currentTheme.border.focus,
      'theme.disabled.bg': currentTheme.disabled.bg,
      'theme.disabled.text': currentTheme.disabled.text,
      'theme.disabled.border': currentTheme.disabled.border,
      'theme.semantic.success.main': currentTheme.semantic.success.main,
      'theme.semantic.success.bg': currentTheme.semantic.success.bg,
      'theme.semantic.success.text': currentTheme.semantic.success.text,
      'theme.semantic.warning.main': currentTheme.semantic.warning.main,
      'theme.semantic.warning.bg': currentTheme.semantic.warning.bg,
      'theme.semantic.warning.text': currentTheme.semantic.warning.text,
      'theme.semantic.error.main': currentTheme.semantic.error.main,
      'theme.semantic.error.bg': currentTheme.semantic.error.bg,
      'theme.semantic.error.text': currentTheme.semantic.error.text,
      'theme.semantic.info.main': currentTheme.semantic.info.main,
      'theme.semantic.info.bg': currentTheme.semantic.info.bg,
      'theme.semantic.info.text': currentTheme.semantic.info.text,
    };
    
    // Reemplazar todas las referencias de theme con valores actuales
    // Buscar patrones como: theme.action.primary, 'theme.action.primary', "theme.action.primary"
    Object.keys(themeMap).forEach(key => {
      // Reemplazar en strings: 'theme.action.primary' o "theme.action.primary"
      const stringRegex = new RegExp(`(['"])${key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\1`, 'g');
      updatedCode = updatedCode.replace(stringRegex, `'${themeMap[key]}'`);
      
      // Reemplazar en objetos style: style={{ backgroundColor: theme.action.primary }}
      const styleRegex = new RegExp(`(\\w+):\\s*${key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'g');
      updatedCode = updatedCode.replace(styleRegex, `$1: '${themeMap[key]}'`);
      
      // Reemplazar referencias directas sin comillas (en JSX): backgroundColor: theme.action.primary
      const directRegex = new RegExp(`(\\w+):\\s*${key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?!['"])`, 'g');
      updatedCode = updatedCode.replace(directRegex, `$1: '${themeMap[key]}'`);
    });
    
    // NUEVO: Detectar y reemplazar objeto theme hardcodeado
    // Buscar patrones como: const theme = { primary: '#FF8C69', ... }
    const themeObjectRegex = /const\s+theme\s*=\s*\{([^}]+)\}/s;
    const themeMatch = updatedCode.match(themeObjectRegex);
    
    if (themeMatch) {
      // Mapear propiedades comunes del objeto theme a valores del tema actual
      const propertyMappings: { [key: string]: string } = {
        'primary': currentTheme.action.primary,
        'primaryLight': currentTheme.action.primaryHover || currentTheme.action.primary + '20',
        'primaryDark': currentTheme.action.primaryHover || currentTheme.action.primary,
        'bg': currentTheme.bg.page,
        'card': currentTheme.bg.card,
        'text': currentTheme.text.main,
        'textSecondary': currentTheme.text.secondary,
        'border': currentTheme.border.default,
        'success': currentTheme.semantic.success.main,
        'error': currentTheme.semantic.error.main,
        'warning': currentTheme.semantic.warning.main,
        'info': currentTheme.semantic.info.main,
      };
      
      // Reemplazar cada propiedad del objeto theme
      Object.keys(propertyMappings).forEach(prop => {
        // Buscar: primary: '#FF8C69' o primary: "#FF8C69" o 'primary': '#FF8C69'
        const propRegex = new RegExp(`(['"]?)${prop}\\1\\s*:\\s*['"](#?[0-9A-Fa-f]{6}|[^'"]+)['"]`, 'g');
        updatedCode = updatedCode.replace(propRegex, (match, quote, value) => {
          // Solo reemplazar si el valor es un color hex
          if (/^#?[0-9A-Fa-f]{6}$/i.test(value)) {
            return `${quote || ''}${prop}${quote || ''}: '${propertyMappings[prop]}'`;
          }
          return match;
        });
      });
    }
    
    // Si tenemos el tema original, detectar y reemplazar colores hardcodeados
    if (originalTheme) {
      const originalThemeMap: { [key: string]: string } = {
        'theme.action.primary': originalTheme.action.primary,
        'theme.action.primaryHover': originalTheme.action.primaryHover,
        'theme.action.secondaryBg': originalTheme.action.secondaryBg,
        'theme.action.secondaryHover': originalTheme.action.secondaryHover,
        'theme.action.secondaryText': originalTheme.action.secondaryText,
        'theme.bg.page': originalTheme.bg.page,
        'theme.bg.card': originalTheme.bg.card,
        'theme.bg.sidebar': originalTheme.bg.sidebar,
        'theme.bg.input': originalTheme.bg.input,
        'theme.text.main': originalTheme.text.main,
        'theme.text.secondary': originalTheme.text.secondary,
        'theme.text.tertiary': originalTheme.text.tertiary,
        'theme.text.onPrimary': originalTheme.text.onPrimary,
        'theme.border.subtle': originalTheme.border.subtle,
        'theme.border.default': originalTheme.border.default,
        'theme.border.focus': originalTheme.border.focus,
        'theme.disabled.bg': originalTheme.disabled.bg,
        'theme.disabled.text': originalTheme.disabled.text,
        'theme.disabled.border': originalTheme.disabled.border,
        'theme.semantic.success.main': originalTheme.semantic.success.main,
        'theme.semantic.success.bg': originalTheme.semantic.success.bg,
        'theme.semantic.success.text': originalTheme.semantic.success.text,
        'theme.semantic.warning.main': originalTheme.semantic.warning.main,
        'theme.semantic.warning.bg': originalTheme.semantic.warning.bg,
        'theme.semantic.warning.text': originalTheme.semantic.warning.text,
        'theme.semantic.error.main': originalTheme.semantic.error.main,
        'theme.semantic.error.bg': originalTheme.semantic.error.bg,
        'theme.semantic.error.text': originalTheme.semantic.error.text,
        'theme.semantic.info.main': originalTheme.semantic.info.main,
        'theme.semantic.info.bg': originalTheme.semantic.info.bg,
        'theme.semantic.info.text': originalTheme.semantic.info.text,
      };
      
      // Reemplazar valores hex hardcodeados que coincidan con el tema original
      Object.keys(originalThemeMap).forEach(key => {
        const originalHex = originalThemeMap[key].toUpperCase();
        const currentHex = themeMap[key].toUpperCase();
        
        // Buscar el hex original en el código (con o sin #, mayúsculas o minúsculas)
        const hexRegex = new RegExp(`(['"#]?)${originalHex.replace('#', '')}(['"]?)`, 'gi');
        updatedCode = updatedCode.replace(hexRegex, (match, prefix, suffix) => {
          // Solo reemplazar si el match completo es el hex (no parte de otro hex más largo)
          if (match.length === originalHex.length + (prefix ? 1 : 0) + (suffix ? 1 : 0)) {
            return (prefix || '#') + currentHex.replace('#', '') + (suffix || '');
          }
          return match;
        });
      });
    }
    
    return updatedCode;
  };

  // --- 1. THEME ENGINE LOGIC ---
  const theme = useMemo(() => {
      const primarySource = brandPalette[config.primaryIndex] || brandPalette[0];
      const textNeutralSource = config.textMode === 'tinted' ? neutralPalette[0] : (neutralPalette[1] || neutralPalette[0]);
      const surfaceSource = config.surfaceMode === 'brand' ? primarySource : (neutralPalette[0] || primarySource);
      const disabledNeutralSource = config.disabledMode === 'tinted' ? neutralPalette[0] : (neutralPalette[1] || neutralPalette[0]);

      if (!primarySource || !textNeutralSource) return null;

      const pShades = generateShades(primarySource, globalConfig);
      const tShades = generateShades(textNeutralSource, globalConfig);
      const sShades = generateShades(surfaceSource, globalConfig);
      const dShades = generateShades(disabledNeutralSource, globalConfig);
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
      const secondaryHover = isDark ? get(pShades, 700) : get(pShades, 300); // 2 shades más oscuro
      const secondaryTextRaw = isDark ? get(pShades, 100) : get(pShades, 900);
      
      // Disabled colors always use neutrals
      const disabledBg = isDark ? get(dShades, 800) : get(dShades, 100);
      const disabledText = isDark ? get(dShades, 500) : get(dShades, 400);
      const disabledBorder = isDark ? get(dShades, 700) : get(dShades, 200);
      
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
              secondaryHover: secondaryHover,
              secondaryText: secondaryTextRaw, 
          },
          disabled: {
              bg: disabledBg,
              text: disabledText,
              border: disabledBorder,
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
  const molecules: { id: MoleculeType; label: string }[] = [
    { id: 'badge', label: 'Badge' },
    { id: 'button', label: 'Button' },
    { id: 'checkbox', label: 'Checkbox' },
    { id: 'input', label: 'Input' },
    { id: 'label', label: 'Label' },
    { id: 'pill', label: 'Pill' },
    { id: 'progress', label: 'Progress' },
    { id: 'radio', label: 'Radio' },
    { id: 'select', label: 'Select' },
    { id: 'slider', label: 'Slider' },
    { id: 'switch', label: 'Switch' },
    { id: 'tag', label: 'Tag' },
    { id: 'textarea', label: 'Textarea' },
  ];

  const organisms: { id: OrganismType; label: string }[] = [
    { id: 'accordion', label: 'Accordion' },
    { id: 'alert-dialog', label: 'Alert Dialog' },
    { id: 'aspect-ratio', label: 'Aspect Ratio' },
    { id: 'avatar', label: 'Avatar' },
    { id: 'collapsible', label: 'Collapsible' },
    { id: 'context-menu', label: 'Context Menu' },
    { id: 'dialog', label: 'Dialog' },
    { id: 'dropdown-menu', label: 'Dropdown Menu' },
    { id: 'form', label: 'Form' },
    { id: 'hover-card', label: 'Hover Card' },
    { id: 'menubar', label: 'Menubar' },
    { id: 'navigation-menu', label: 'Navigation Menu' },
    { id: 'popover', label: 'Popover' },
    { id: 'radio-group', label: 'Radio Group' },
    { id: 'scroll-area', label: 'Scroll Area' },
    { id: 'tabs', label: 'Tabs' },
    { id: 'toast', label: 'Toast' },
    { id: 'toolbar', label: 'Toolbar' },
    { id: 'tooltip', label: 'Tooltip' },
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
                    className="px-6 py-3 rounded-lg text-sm font-semibold transition-all cursor-not-allowed"
                    style={{ backgroundColor: theme.disabled.bg, color: theme.disabled.text }}
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
                    className="px-6 py-3 rounded-lg text-sm font-semibold transition-all"
                    style={{ 
                      backgroundColor: theme.action.secondaryBg, 
                      color: theme.action.secondaryText
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = theme.action.secondaryHover;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = theme.action.secondaryBg;
                    }}
                  >
                    Secondary Button
                  </button>
                  <button 
                    className="px-6 py-3 rounded-lg text-sm font-semibold transition-all cursor-not-allowed"
                    style={{ 
                      backgroundColor: theme.disabled.bg, 
                      color: theme.disabled.text
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
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = theme.action.secondaryBg; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                    onMouseDown={(e) => { e.currentTarget.style.backgroundColor = theme.action.secondaryBg; }}
                    onMouseUp={(e) => { e.currentTarget.style.backgroundColor = theme.action.secondaryBg; }}
                  >
                    Tertiary Button
                  </button>
                  <button 
                    className="px-6 py-3 rounded-lg text-sm font-medium transition-all cursor-not-allowed"
                    style={{ color: theme.disabled.text }}
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
                    className="px-0 py-2 text-sm font-medium transition-all underline decoration-2 underline-offset-4 cursor-not-allowed"
                    style={{ color: theme.disabled.text }}
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
                    className="w-14 h-14 rounded-full text-lg font-bold shadow-lg transition-all cursor-not-allowed"
                    style={{ backgroundColor: theme.disabled.bg, color: theme.disabled.text }}
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
                    className="w-10 h-10 rounded-lg flex items-center justify-center transition-all"
                    style={{ 
                      backgroundColor: theme.action.secondaryBg, 
                      color: theme.action.secondaryText
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = theme.action.secondaryHover;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = theme.action.secondaryBg;
                    }}
                  >
                    <HiSearch className="w-5 h-5" />
                  </button>
                  <button 
                    className="w-10 h-10 rounded-lg flex items-center justify-center transition-all cursor-not-allowed"
                    style={{ backgroundColor: theme.disabled.bg, color: theme.disabled.text }}
                  >
                    <HiSearch className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Buttons with Icons */}
              <div className="mb-8">
                <h4 className="text-sm font-semibold mb-4 uppercase tracking-wider" style={{ color: theme.text.secondary }}>With Icons</h4>
                <div className="flex flex-wrap gap-4">
                  <button 
                    className="px-6 py-3 rounded-lg text-sm font-semibold transition-all flex items-center gap-2"
                    style={{ backgroundColor: theme.action.primary, color: theme.text.onPrimary }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = theme.action.primaryHover; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = theme.action.primary; }}
                  >
                    <HiSearch className="w-4 h-4" />
                    <span>Label + Icon Left</span>
                  </button>
                  <button 
                    className="px-6 py-3 rounded-lg text-sm font-semibold transition-all flex items-center gap-2"
                    style={{ backgroundColor: theme.action.primary, color: theme.text.onPrimary }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = theme.action.primaryHover; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = theme.action.primary; }}
                  >
                    <span>Label + Icon Right</span>
                    <HiSearch className="w-4 h-4" />
                  </button>
                  <button 
                    className="px-6 py-3 rounded-lg text-sm font-semibold transition-all flex items-center gap-2"
                    style={{ 
                      backgroundColor: theme.action.secondaryBg, 
                      color: theme.action.secondaryText
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = theme.action.secondaryHover;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = theme.action.secondaryBg;
                    }}
                  >
                    <HiSearch className="w-4 h-4" />
                    <span>Label + Icon Left</span>
                  </button>
                  <button 
                    className="px-6 py-3 rounded-lg text-sm font-semibold transition-all flex items-center gap-2"
                    style={{ 
                      backgroundColor: theme.action.secondaryBg, 
                      color: theme.action.secondaryText
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = theme.action.secondaryHover;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = theme.action.secondaryBg;
                    }}
                  >
                    <span>Label + Icon Right</span>
                    <HiSearch className="w-4 h-4" />
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
                  className="w-full px-4 py-2 rounded-lg text-sm border cursor-not-allowed"
                  style={{ 
                    backgroundColor: theme.disabled.bg, 
                    color: theme.disabled.text,
                    borderColor: theme.disabled.border
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

              {/* Input with Icon Left */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2" style={{ color: theme.text.main }}>Label + Icon Left</label>
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

              {/* Input with Icon Right */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2" style={{ color: theme.text.main }}>Label + Icon Right</label>
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder="Search..."
                    className="w-full pl-4 pr-10 py-2 rounded-lg text-sm border transition-all focus:outline-none focus:ring-2"
                    style={{ 
                      backgroundColor: theme.bg.input, 
                      color: theme.text.main,
                      borderColor: theme.border.default
                    }}
                    onFocus={(e) => e.currentTarget.style.borderColor = theme.border.focus}
                    onBlur={(e) => e.currentTarget.style.borderColor = theme.border.default}
                  />
                  <HiSearch className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: theme.text.secondary }} />
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
                    className="w-full px-4 py-2 rounded-lg text-sm border cursor-not-allowed resize-none"
                    style={{ 
                      backgroundColor: theme.disabled.bg, 
                      color: theme.disabled.text,
                      borderColor: theme.disabled.border
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
                  { label: 'Option 1', value: 'option1', disabled: false },
                  { label: 'Option 2', value: 'option2', disabled: false },
                  { label: 'Option 3', value: 'option3', disabled: false },
                  { label: 'Disabled Option', value: 'option4', disabled: true },
                ].map((item) => (
                  <div key={item.value} className="flex items-center gap-3">
                    <div
                      onClick={() => !item.disabled && setRadioState(item.value)}
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${item.disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                      style={{
                        borderColor: item.disabled 
                          ? theme.disabled.border 
                          : (radioState === item.value ? theme.action.primary : theme.border.default),
                      }}
                    >
                      {radioState === item.value && (
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: item.disabled ? theme.disabled.text : theme.action.primary }}
                        />
                      )}
                    </div>
                    <Label.Root className="text-sm" style={{ color: item.disabled ? theme.disabled.text : theme.text.main }}>
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
                  { label: 'Option 1', id: 0, disabled: false },
                  { label: 'Option 2', id: 1, disabled: false },
                  { label: 'Option 3', id: 2, disabled: false },
                  { label: 'Disabled Option', id: 3, disabled: true },
                ].map((item) => (
                  <div key={item.id} className="flex items-center gap-3">
                    <Checkbox.Root
                      className="w-5 h-5 rounded border-2 flex items-center justify-center transition-all disabled:cursor-not-allowed"
                      checked={checkboxStates[item.id] || false}
                      disabled={item.disabled}
                      onCheckedChange={(checked) => !item.disabled && setCheckboxStates({ ...checkboxStates, [item.id]: checked as boolean })}
                      style={{
                        backgroundColor: item.disabled 
                          ? theme.disabled.bg 
                          : (checkboxStates[item.id] ? theme.action.primary : theme.bg.input),
                        borderColor: item.disabled 
                          ? theme.disabled.border 
                          : (checkboxStates[item.id] ? theme.action.primary : theme.border.default),
                      }}
                    >
                      <Checkbox.Indicator>
                        <HiCheck className="w-4 h-4" style={{ color: item.disabled ? theme.disabled.text : theme.text.onPrimary }} />
                      </Checkbox.Indicator>
                    </Checkbox.Root>
                    <Label.Root className="text-sm" style={{ color: item.disabled ? theme.disabled.text : theme.text.main }}>
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
                  <Label.Root htmlFor="default-input" className="block text-sm font-medium mb-2" style={{ color: theme.text.main }}>
                    Default Label
                  </Label.Root>
                  <input 
                    id="default-input"
                    type="text"
                    className="w-full px-3 py-2 rounded-lg text-sm border transition-all focus:outline-none focus:ring-2"
                    placeholder="Input with label"
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
                  <Label.Root htmlFor="secondary-input" className="block text-sm font-bold mb-2" style={{ color: theme.text.secondary }}>
                    Secondary Label
                  </Label.Root>
                  <input 
                    id="secondary-input"
                    type="text"
                    className="w-full px-3 py-2 rounded-lg text-sm border transition-all focus:outline-none focus:ring-2"
                    placeholder="Input with secondary label"
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
                  <Label.Root htmlFor="small-input" className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: theme.text.tertiary }}>
                    Small Uppercase Label
                  </Label.Root>
                  <input 
                    id="small-input"
                    type="text"
                    className="w-full px-3 py-2 rounded-lg text-sm border transition-all focus:outline-none focus:ring-2"
                    placeholder="Input with small label"
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
              <div className="flex justify-center">
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
                      sideOffset={5}
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
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center" style={{ borderColor: theme.disabled.border }}>
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: theme.disabled.text }} />
                </div>
                <Label.Root className="text-sm" style={{ color: theme.disabled.text }}>
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
                    className="w-full px-3 py-2 rounded-lg text-sm flex items-center justify-between cursor-not-allowed"
                    style={{
                      backgroundColor: theme.disabled.bg,
                      color: theme.disabled.text,
                      border: `1px solid ${theme.disabled.border}`,
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
                  { label: 'Switch 1', id: 0, disabled: false },
                  { label: 'Switch 2', id: 1, disabled: false },
                  { label: 'Disabled (On)', id: 2, disabled: true },
                  { label: 'Disabled (Off)', id: 3, disabled: true },
                ].map((item) => (
                  <div key={item.id} className="flex items-center justify-between">
                    <Label.Root className="text-sm" style={{ color: item.disabled ? theme.disabled.text : theme.text.main }}>
                      {item.label}
                    </Label.Root>
                    <Switch.Root
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${item.disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                      checked={switchStates[item.id] || false}
                      disabled={item.disabled}
                      onCheckedChange={(checked) => !item.disabled && setSwitchStates({ ...switchStates, [item.id]: checked as boolean })}
                      style={{
                        backgroundColor: item.disabled 
                          ? theme.disabled.bg 
                          : (switchStates[item.id] ? theme.action.primary : theme.bg.input),
                      }}
                    >
                      <Switch.Thumb
                        className="inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ease-in-out"
                        style={{
                          transform: switchStates[item.id] ? 'translateX(24px)' : 'translateX(4px)',
                          backgroundColor: item.disabled ? theme.disabled.text : 'white',
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
              <Tabs.Root value={activeTabValue} onValueChange={setActiveTabValue} className="w-full max-w-md">
                <Tabs.List className="flex border-b" style={{ borderColor: theme.border.subtle }}>
                  <Tabs.Trigger 
                    value="tab1"
                    className="px-4 py-2 text-sm font-medium border-b-2 transition-all hover:bg-black/5"
                    style={{ 
                      color: activeTabValue === 'tab1' ? theme.action.primary : theme.text.main,
                      borderBottomColor: activeTabValue === 'tab1' ? theme.action.primary : 'transparent'
                    }}
                  >
                    Account
                  </Tabs.Trigger>
                  <Tabs.Trigger 
                    value="tab2"
                    className="px-4 py-2 text-sm font-medium border-b-2 transition-all hover:bg-black/5"
                    style={{ 
                      color: activeTabValue === 'tab2' ? theme.action.primary : theme.text.main,
                      borderBottomColor: activeTabValue === 'tab2' ? theme.action.primary : 'transparent'
                    }}
                  >
                    Password
                  </Tabs.Trigger>
                  <Tabs.Trigger 
                    value="tab3"
                    className="px-4 py-2 text-sm font-medium border-b-2 transition-all hover:bg-black/5"
                    style={{ 
                      color: activeTabValue === 'tab3' ? theme.action.primary : theme.text.main,
                      borderBottomColor: activeTabValue === 'tab3' ? theme.action.primary : 'transparent'
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
    <div className="flex flex-col h-full max-h-screen overflow-hidden">
        
        {/* --- TOP BAR: THEME CONTROLS --- */}
        <div className="w-full bg-slate-900 border-b border-white/5 flex items-center justify-between px-6 py-4 shrink-0 z-20 shadow-lg">
            <div className="flex items-center gap-6">
            </div>

            <div className="flex items-center gap-6 flex-wrap">
                {/* 1. Dark Mode Toggle */}
                <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-slate-300 uppercase whitespace-nowrap">Appearance</span>
                    <button 
                        onClick={() => onConfigChange({ ...config, isDarkMode: !config.isDarkMode })}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${config.isDarkMode ? 'bg-indigo-600' : 'bg-slate-700'}`}
                    >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ease-in-out ${config.isDarkMode ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                </div>

                {/* 2. Primary Color Selection */}
                <div className="flex items-center gap-3">
                    <label className="text-xs font-bold text-slate-500 uppercase whitespace-nowrap">Primary Color</label>
                    <div className="flex gap-2">
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
                <div className="flex items-center gap-3">
                    <label className="text-xs font-bold text-slate-500 uppercase whitespace-nowrap">Background</label>
                    <div className="flex bg-slate-950 p-1 rounded-lg border border-white/5">
                        <button 
                            onClick={() => onConfigChange({ ...config, surfaceMode: 'neutral' })}
                            className={`px-3 py-1.5 text-[10px] font-bold uppercase rounded transition-all ${config.surfaceMode === 'neutral' ? 'bg-slate-800 text-white shadow' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                            Neutral
                        </button>
                        <button 
                            onClick={() => onConfigChange({ ...config, surfaceMode: 'brand' })}
                            className={`px-3 py-1.5 text-[10px] font-bold uppercase rounded transition-all ${config.surfaceMode === 'brand' ? 'bg-slate-800 text-white shadow' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                            Brand
                        </button>
                    </div>
                </div>

                {/* 4. Text Mapping */}
                <div className="flex items-center gap-3">
                    <label className="text-xs font-bold text-slate-500 uppercase whitespace-nowrap">Typography</label>
                    <div className="flex bg-slate-950 p-1 rounded-lg border border-white/5">
                        <button 
                            onClick={() => onConfigChange({ ...config, textMode: 'base' })}
                            className={`px-3 py-1.5 text-[10px] font-bold uppercase rounded transition-all ${config.textMode === 'base' ? 'bg-slate-800 text-white shadow' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                            Gray
                        </button>
                        <button 
                            onClick={() => onConfigChange({ ...config, textMode: 'tinted' })}
                            className={`px-3 py-1.5 text-[10px] font-bold uppercase rounded transition-all ${config.textMode === 'tinted' ? 'bg-slate-800 text-white shadow' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                            Tinted
                        </button>
                    </div>
                </div>

                {/* 5. Disabled Mode */}
                <div className="flex items-center gap-3">
                    <label className="text-xs font-bold text-slate-500 uppercase whitespace-nowrap">Disabled</label>
                    <div className="flex bg-slate-950 p-1 rounded-lg border border-white/5">
                        <button 
                            onClick={() => onConfigChange({ ...config, disabledMode: 'base' })}
                            className={`px-3 py-1.5 text-[10px] font-bold uppercase rounded transition-all ${config.disabledMode === 'base' ? 'bg-slate-800 text-white shadow' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                            Base
                        </button>
                        <button 
                            onClick={() => onConfigChange({ ...config, disabledMode: 'tinted' })}
                            className={`px-3 py-1.5 text-[10px] font-bold uppercase rounded transition-all ${config.disabledMode === 'tinted' ? 'bg-slate-800 text-white shadow' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                            Tinted
                        </button>
                </div>
                </div>
            </div>
        </div>

        {/* --- MAIN CONTENT AREA --- */}
        <div className="flex flex-row flex-1 overflow-hidden">
            {/* --- COMPONENT MENU SIDEBAR (LEFT) --- */}
            <div className={`relative bg-slate-900 border-r border-white/5 flex flex-col shrink-0 z-10 shadow-2xl transition-all duration-300 ${isLeftSidebarExpanded ? 'w-full md:w-[280px]' : 'w-0 md:w-[24px]'} overflow-hidden`}>
                {/* Toggle Button */}
                <button
                    onClick={() => setIsLeftSidebarExpanded(!isLeftSidebarExpanded)}
                    className={`absolute z-50 w-6 h-6 bg-slate-800 border border-white/10 rounded-full flex items-center justify-center text-white hover:bg-slate-700 transition-all shadow-lg hover:scale-110 ${isLeftSidebarExpanded ? '-right-3 top-6' : 'right-1 top-6'}`}
                    title={isLeftSidebarExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
                    style={{ pointerEvents: 'auto' }}
                >
                    {isLeftSidebarExpanded ? (
                        <HiChevronLeft className="w-4 h-4" />
                    ) : (
                        <HiChevronRight className="w-4 h-4" />
                    )}
                </button>
                
                {isLeftSidebarExpanded && (
                <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col">
                <div className="p-6 border-b border-white/5">
                    <p className="text-xs text-slate-500">
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
                            className={`w-full px-4 py-3 rounded-lg text-sm font-medium transition-all text-left ${
                                selectedComponent === comp.id
                                    ? 'bg-indigo-600 text-white shadow-md'
                                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                            }`}
                        >
                            {comp.label}
                        </button>
                    ))}
                </div>
                </div>
                )}
                    </div>

            {/* --- COMPONENT PREVIEW AREA --- */}
            <div 
                className="flex-1 overflow-hidden relative transition-colors duration-500 z-0"
                style={{ backgroundColor: theme.bg.page }}
            >
                <div className="h-full w-full overflow-y-auto p-6 md:p-8">
                    {aiGeneratedComponent && isPremium ? (
                        // AI Generated Component View (2/3 preview + 1/3 code)
                        <div className="max-w-7xl mx-auto">
                            <div className="mb-6 flex items-center justify-between">
                                <div>
                                    <h2 className="text-2xl font-bold tracking-tight transition-colors mb-2" style={{ color: theme.text.main }}>
                                        {aiGeneratedComponent.componentName}
                                    </h2>
                                    <p className="text-sm transition-colors" style={{ color: theme.text.secondary }}>
                                        Component generated by AI - Preview updates automatically when theme changes
                                    </p>
                                </div>
                                        <button 
                                    onClick={() => {
                                        if (aiGeneratedComponent) {
                                            setSavedGeneratedComponent(aiGeneratedComponent);
                                        }
                                        setAiGeneratedComponent(null);
                                        setOriginalTheme(null);
                                    }}
                                    className="px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                                            style={{ 
                                        backgroundColor: theme.action.secondaryBg,
                                        color: theme.action.secondaryText
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.backgroundColor = theme.action.secondaryHover;
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.backgroundColor = theme.action.secondaryBg;
                                    }}
                                >
                                    <HiArrowLeft className="w-4 h-4" />
                                    Back to Components
                                        </button>
                            </div>
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {/* Preview - 2/3 width */}
                                <div className="lg:col-span-2">
                                    <div className="bg-white rounded-lg p-6 min-h-[600px] overflow-auto border" style={{ borderColor: theme.border.subtle }}>
                                        <iframe
                                            key={`preview-${aiGeneratedComponent.componentName}-${config.primaryIndex}-${config.isDarkMode}-${theme.action.primary}-${theme.bg.page}`}
                                            srcDoc={(() => {
                                                const processedCode = removeAllImports(replaceUnsplashUrls(replaceThemeReferences(aiGeneratedComponent.code, theme)));
                                                const code = escapeCodeForTemplate(processedCode);
                                                
                                                // Obtener TODOS los colores de la paleta actual para inyectarlos en el tema
                                                const primaryColor = theme.action.primary;
                                                const primaryHover = theme.action.primaryHover;
                                                const secondaryColor = theme.action.secondary || theme.action.primary;
                                                const secondaryBg = theme.action.secondaryBg;
                                                const bgDefault = theme.bg.page;
                                                const bgPaper = theme.bg.card;
                                                const textPrimary = theme.text.main;
                                                const textSecondary = theme.text.secondary;
                                                // Disabled siempre usa neutrales
                                                const disabledBg = theme.disabled.bg;
                                                const disabledText = theme.disabled.text;
                                                const disabledBorder = theme.disabled.border;
                                                // Semantic colors
                                                const errorColor = theme.semantic.error.main;
                                                const warningColor = theme.semantic.warning.main;
                                                const infoColor = theme.semantic.info.main;
                                                const successColor = theme.semantic.success.main;
                                                
                                                return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://fonts.googleapis.com/icon?family=Material+Icons">
    <style>
        .material-icons {
            font-family: 'Material Icons';
            font-weight: normal;
            font-style: normal;
            font-size: 24px;
            line-height: 1;
            letter-spacing: normal;
            text-transform: none;
            display: inline-block;
            white-space: nowrap;
            word-wrap: normal;
            direction: ltr;
            -webkit-font-feature-settings: 'liga';
            -webkit-font-smoothing: antialiased;
        }
    </style>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            background-color: ${bgDefault};
        }
    </style>
    <script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"></script>
    <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
    <script src="https://unpkg.com/@emotion/react@11/dist/emotion-react.umd.min.js"></script>
    <script src="https://unpkg.com/@emotion/styled@11/dist/emotion-styled.umd.min.js"></script>
    <script src="https://unpkg.com/@mui/material@5/dist/material-ui.development.js"></script>
    <script type="text/babel">
        // Wait for Material-UI to be available
        const waitForMaterialUI = (callback, maxWait = 5000) => {
            const startTime = Date.now();
            const check = () => {
                if (typeof MaterialUI !== 'undefined' && MaterialUI.createTheme && Date.now() - startTime < maxWait) {
                    callback();
                } else if (Date.now() - startTime >= maxWait) {
                    console.error('Material-UI failed to load');
                    callback(); // Execute anyway
                } else {
                    setTimeout(check, 50);
                }
            };
            check();
        };
        
        waitForMaterialUI(() => {
            const { useState, useEffect, useRef, useMemo, createElement } = React;
            const { ThemeProvider, createTheme } = MaterialUI;
            
            // Make Material-UI available globally
            window.MaterialUI = MaterialUI;
            window.React = React;
            window.ReactDOM = ReactDOM;
            window.useState = useState;
            window.useEffect = useEffect;
            window.useRef = useRef;
            window.useMemo = useMemo;
            
            // Create theme from ChromaForge palette colors - SIEMPRE usar colores de la paleta
            // Usar nombre único para evitar conflictos con código generado
            const chromaForgePaletteTheme = createTheme({
            palette: {
                primary: {
                    main: '${primaryColor}',
                    dark: '${primaryHover}',
                },
                secondary: {
                    main: '${secondaryColor}',
                },
                background: {
                    default: '${bgDefault}',
                    paper: '${bgPaper}',
                },
                text: {
                    primary: '${textPrimary}',
                    secondary: '${textSecondary}',
                    disabled: '${disabledText}',
                },
                error: {
                    main: '${errorColor}',
                },
                warning: {
                    main: '${warningColor}',
                },
                info: {
                    main: '${infoColor}',
                },
                success: {
                    main: '${successColor}',
                },
                action: {
                    disabled: '${disabledText}',
                    disabledBackground: '${disabledBg}',
                },
            },
            components: {
                MuiButton: {
                    styleOverrides: {
                        root: {
                            '&.Mui-disabled': {
                                backgroundColor: '${disabledBg}',
                                color: '${disabledText}',
                                borderColor: '${disabledBorder}',
                            },
                        },
                    },
                },
                MuiTextField: {
                    styleOverrides: {
                        root: {
                            '& .MuiInputBase-root.Mui-disabled': {
                                backgroundColor: '${disabledBg}',
                                color: '${disabledText}',
                            },
                        },
                    },
                },
            },
            });
            
            // Make theme and createTheme available globally BEFORE executing any code
            window.chromaForgePaletteTheme = chromaForgePaletteTheme;
            window.__cfTheme = chromaForgePaletteTheme; // Alias corto
            window.createTheme = createTheme; // Make createTheme available globally
            
            // ===== GENERATED CODE =====
            const executeCodeAndRender = () => {
                const componentName = '${aiGeneratedComponent.componentName}';
                let ComponentToRender = null;
                
                try {
                    // Limpiar export default del código
                    let codeStr = \`${code.replace(/export\s+default\s+\w+;?/g, '')}\`;
                    
                    // Crear funciones helper para TODOS los iconos Material comunes
                    const iconHelper = \`
                    // Helper para crear iconos Material simples
                    const createMaterialIcon = (name, props = {}) => {
                        const { sx, color, fontSize, ...rest } = props;
                        const style = {
                            fontSize: fontSize || 24,
                            color: color || 'currentColor',
                            ...(sx || {})
                        };
                        return React.createElement('span', { 
                            className: 'material-icons', 
                            style: style,
                            ...rest
                        }, name);
                    };
                    // Iconos comunes
                    const ShoppingCart = (props) => createMaterialIcon('shopping_cart', props);
                    const Home = (props) => createMaterialIcon('home', props);
                    const Search = (props) => createMaterialIcon('search', props);
                    const Menu = (props) => createMaterialIcon('menu', props);
                    const Favorite = (props) => createMaterialIcon('favorite', props);
                    const Add = (props) => createMaterialIcon('add', props);
                    const Delete = (props) => createMaterialIcon('delete', props);
                    const Edit = (props) => createMaterialIcon('edit', props);
                    const Close = (props) => createMaterialIcon('close', props);
                    const Check = (props) => createMaterialIcon('check', props);
                    const ArrowBack = (props) => createMaterialIcon('arrow_back', props);
                    const ArrowForward = (props) => createMaterialIcon('arrow_forward', props);
                    const Star = (props) => createMaterialIcon('star', props);
                    const Share = (props) => createMaterialIcon('share', props);
                    const AccessTime = (props) => createMaterialIcon('access_time', props);
                    const SignalCellularAlt = (props) => createMaterialIcon('signal_cellular_alt', props);
                    const Restaurant = (props) => createMaterialIcon('restaurant', props);
                    const MoreVert = (props) => createMaterialIcon('more_vert', props);
                    const MoreHoriz = (props) => createMaterialIcon('more_horiz', props);
                    const Settings = (props) => createMaterialIcon('settings', props);
                    const Notifications = (props) => createMaterialIcon('notifications', props);
                    const Person = (props) => createMaterialIcon('person', props);
                    const Email = (props) => createMaterialIcon('email', props);
                    const Phone = (props) => createMaterialIcon('phone', props);
                    const LocationOn = (props) => createMaterialIcon('location_on', props);
                    const CalendarToday = (props) => createMaterialIcon('calendar_today', props);
                    const Lock = (props) => createMaterialIcon('lock', props);
                    const LockOpen = (props) => createMaterialIcon('lock_open', props);
                    const Visibility = (props) => createMaterialIcon('visibility', props);
                    const VisibilityOff = (props) => createMaterialIcon('visibility_off', props);
                    const Download = (props) => createMaterialIcon('download', props);
                    const Upload = (props) => createMaterialIcon('upload', props);
                    const FilterList = (props) => createMaterialIcon('filter_list', props);
                    const Sort = (props) => createMaterialIcon('sort', props);
                    const Refresh = (props) => createMaterialIcon('refresh', props);
                    const PlayArrow = (props) => createMaterialIcon('play_arrow', props);
                    const Pause = (props) => createMaterialIcon('pause', props);
                    const Stop = (props) => createMaterialIcon('stop', props);
                    const SkipNext = (props) => createMaterialIcon('skip_next', props);
                    const SkipPrevious = (props) => createMaterialIcon('skip_previous', props);
                    const VolumeUp = (props) => createMaterialIcon('volume_up', props);
                    const VolumeDown = (props) => createMaterialIcon('volume_down', props);
                    const VolumeOff = (props) => createMaterialIcon('volume_off', props);
                    const Fullscreen = (props) => createMaterialIcon('fullscreen', props);
                    const FullscreenExit = (props) => createMaterialIcon('fullscreen_exit', props);
                    const ExpandMore = (props) => createMaterialIcon('expand_more', props);
                    const ExpandLess = (props) => createMaterialIcon('expand_less', props);
                    const ChevronLeft = (props) => createMaterialIcon('chevron_left', props);
                    const ChevronRight = (props) => createMaterialIcon('chevron_right', props);
                    const ChevronUp = (props) => createMaterialIcon('chevron_up', props);
                    const ChevronDown = (props) => createMaterialIcon('chevron_down', props);
                    const ArrowUpward = (props) => createMaterialIcon('arrow_upward', props);
                    const ArrowDownward = (props) => createMaterialIcon('arrow_downward', props);
                    const ArrowLeft = (props) => createMaterialIcon('arrow_back', props);
                    const ArrowRight = (props) => createMaterialIcon('arrow_forward', props);
                    const Info = (props) => createMaterialIcon('info', props);
                    const Warning = (props) => createMaterialIcon('warning', props);
                    const Error = (props) => createMaterialIcon('error', props);
                    const CheckCircle = (props) => createMaterialIcon('check_circle', props);
                    const Cancel = (props) => createMaterialIcon('cancel', props);
                    const Help = (props) => createMaterialIcon('help', props);
                    const HelpOutline = (props) => createMaterialIcon('help_outline', props);
                    const QuestionAnswer = (props) => createMaterialIcon('question_answer', props);
                    const Chat = (props) => createMaterialIcon('chat', props);
                    const Comment = (props) => createMaterialIcon('comment', props);
                    const ThumbUp = (props) => createMaterialIcon('thumb_up', props);
                    const ThumbDown = (props) => createMaterialIcon('thumb_down', props);
                    const Bookmark = (props) => createMaterialIcon('bookmark', props);
                    const BookmarkBorder = (props) => createMaterialIcon('bookmark_border', props);
                    const Flag = (props) => createMaterialIcon('flag', props);
                    const Report = (props) => createMaterialIcon('report', props);
                    const Block = (props) => createMaterialIcon('block', props);
                    const ReportProblem = (props) => createMaterialIcon('report_problem', props);
                    const NewReleases = (props) => createMaterialIcon('new_releases', props);
                    const Update = (props) => createMaterialIcon('update', props);
                    const Build = (props) => createMaterialIcon('build', props);
                    const Code = (props) => createMaterialIcon('code', props);
                    const BugReport = (props) => createMaterialIcon('bug_report', props);
                    const Extension = (props) => createMaterialIcon('extension', props);
                    const ExtensionOff = (props) => createMaterialIcon('extension_off', props);
                    const Dashboard = (props) => createMaterialIcon('dashboard', props);
                    const ViewModule = (props) => createMaterialIcon('view_module', props);
                    const ViewList = (props) => createMaterialIcon('view_list', props);
                    const ViewComfy = (props) => createMaterialIcon('view_comfy', props);
                    const ViewCompact = (props) => createMaterialIcon('view_compact', props);
                    const GridView = (props) => createMaterialIcon('grid_view', props);
                    const TableView = (props) => createMaterialIcon('table_view', props);
                    const ViewAgenda = (props) => createMaterialIcon('view_agenda', props);
                    const ViewWeek = (props) => createMaterialIcon('view_week', props);
                    const ViewDay = (props) => createMaterialIcon('view_day', props);
                    const ViewHeadline = (props) => createMaterialIcon('view_headline', props);
                    const ViewQuilt = (props) => createMaterialIcon('view_quilt', props);
                    const ViewStream = (props) => createMaterialIcon('view_stream', props);
                    const ViewColumn = (props) => createMaterialIcon('view_column', props);
                    const ViewCarousel = (props) => createMaterialIcon('view_carousel', props);
                    const ViewArray = (props) => createMaterialIcon('view_array', props);
                    const ViewSidebar = (props) => createMaterialIcon('view_sidebar', props);
                    // Rating component helper
                    const Rating = (props) => {
                        const { value = 0, max = 5, precision = 0.5, size = 'medium', sx, readOnly, ...rest } = props;
                        const stars = [];
                        const fullStars = Math.floor(value);
                        const hasHalfStar = value % 1 >= precision;
                        const starSize = size === 'small' ? 16 : size === 'large' ? 28 : 20;
                        for (let i = 0; i < fullStars; i++) {
                            stars.push(React.createElement(Star, { key: i, sx: { ...sx, fontSize: starSize } }));
                        }
                        if (hasHalfStar && fullStars < max) {
                            stars.push(React.createElement(Star, { key: 'half', sx: { ...sx, fontSize: starSize, opacity: 0.5 } }));
                        }
                        const emptyStars = max - Math.ceil(value);
                        for (let i = 0; i < emptyStars; i++) {
                            stars.push(React.createElement(Star, { key: 'empty-' + i, sx: { ...sx, fontSize: starSize, opacity: 0.3 } }));
                        }
                        return React.createElement('div', { style: { display: 'flex', gap: '2px', alignItems: 'center' }, ...rest }, stars);
                    };
                    \`;
                    
                    // Prepend icon helpers
                    codeStr = iconHelper + codeStr;
                    
                    // Eliminar imports problemáticos - construir regex de forma segura
                    // Usar función para construir el patrón sin problemas de escape
                    const buildRegex = (pattern) => {
                        const parts = pattern.split('\\s');
                        if (parts.length > 1) {
                            return new RegExp(parts.join('\\\\s'), 'g');
                        }
                        return new RegExp(pattern, 'g');
                    };
                    
                    // Patrones sin \\s - usar [ ] para espacios literales
                    const importIconsPattern = /import\s+.*from\s+['"]@mui\/icons-material['"];?/g;
                    codeStr = codeStr.replace(importIconsPattern, '// Icons available as components');
                    
                    // NO reemplazar creación de theme - dejar que el código use createTheme que ya está disponible globalmente
                    // Solo eliminar imports de createTheme si están solos
                    const importCreateThemePattern = /import\s+\{\s*createTheme\s*\}\s+from\s+['"]@mui\/material\/styles['"];?/g;
                    codeStr = codeStr.replace(importCreateThemePattern, '// createTheme available globally');
                    
                    const importThemeProviderCreateThemePattern = /import\s+\{\s*ThemeProvider\s*,\s*createTheme\s*\}\s+from\s+['"]@mui\/material\/styles['"];?/g;
                    codeStr = codeStr.replace(importThemeProviderCreateThemePattern, "import { ThemeProvider } from '@mui/material/styles'; // createTheme available globally");
                    
                    console.log('=== PREVIEW INIT ===');
                    console.log('Component name:', componentName);
                    console.log('Material-UI available:', typeof MaterialUI !== 'undefined');
                    console.log('createTheme available:', typeof window.createTheme !== 'undefined');
                    console.log('Theme created:', chromaForgePaletteTheme);
                    
                    // Ejecutar el código generado en un contexto con todas las dependencias
                    (function() {
                        // Proporcionar Material-UI y React en el scope
                        const MaterialUI = window.MaterialUI;
                        const React = window.React;
                        const ReactDOM = window.ReactDOM;
                        const { 
                            ThemeProvider, createTheme, Box, Card, CardContent, CardActions, CardMedia, 
                            Button, Typography, Chip, IconButton, Stack, Divider, Rating
                        } = MaterialUI;
                        const chromaForgePaletteTheme = window.chromaForgePaletteTheme;
                        
                        // Hacer createTheme y componentes disponibles globalmente ANTES de ejecutar código
                        window.createTheme = createTheme;
                        window.ThemeProvider = ThemeProvider;
                        window.Box = Box;
                        window.Card = Card;
                        window.CardContent = CardContent;
                        window.CardActions = CardActions;
                        window.CardMedia = CardMedia;
                        window.Button = Button;
                        window.Typography = Typography;
                        window.Chip = Chip;
                        window.IconButton = IconButton;
                        window.Stack = Stack;
                        window.Divider = Divider;
                        window.Rating = Rating || window.Rating; // Use helper if Material-UI Rating not available
                        
                        // Ejecutar código
                        eval(codeStr);
                    })();
                    
                    // Obtener el componente
                    ComponentToRender = eval(componentName);
                    
                    if (typeof ComponentToRender !== 'function') {
                        throw new Error('Component is not a function, got: ' + typeof ComponentToRender);
                    }
                    
                    // Exponer a window
                    window[componentName] = ComponentToRender;
                    window['__currentComponent'] = ComponentToRender;
                    console.log('✅ Component found and exposed:', componentName);
                    
                    // Renderizar
                    setTimeout(() => {
                        try {
                            const root = ReactDOM.createRoot(document.getElementById('root'));
                            root.render(createElement(ComponentToRender));
                            console.log('✅ Component rendered successfully');
                        } catch (e) {
                            console.error('Render error:', e);
                            const root = ReactDOM.createRoot(document.getElementById('root'));
                            root.render(createElement('div', { 
                                style: { padding: '20px', color: 'red', fontFamily: 'monospace', fontSize: '12px' } 
                            }, 'Render Error: ' + String(e)));
                        }
                    }, 100);
                    
                } catch (e) {
                    console.error('Error executing code:', e);
                    const root = ReactDOM.createRoot(document.getElementById('root'));
                    root.render(createElement('div', { 
                        style: { padding: '20px', color: 'red', fontFamily: 'monospace', fontSize: '12px' } 
                    }, [
                        createElement('div', { key: 'title', style: { fontWeight: 'bold', marginBottom: '10px' } }, 'Execution Error'),
                        createElement('div', { key: 'error', style: { fontSize: '10px', whiteSpace: 'pre-wrap' } }, String(e))
                    ]));
                }
            };
            
            // Ejecutar inmediatamente ya que Material-UI está cargado
            executeCodeAndRender();
        });
    </script>
</head>
<body>
    <div id="root"></div>
</body>
</html>`;
                                            })()}
                                            className="w-full h-[600px] border-0 rounded"
                                            sandbox="allow-scripts allow-same-origin"
                                            title="Component Preview"
                                        />
                                </div>
                            </div>
                            
                                {/* Code - 1/3 width */}
                                <div className="lg:col-span-1">
                                    <div className="bg-slate-950 border border-slate-700 rounded-lg p-4 h-[600px] flex flex-col">
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="text-xs font-semibold text-slate-300">Generated Code</span>
                                            <button
                                                onClick={async () => {
                                                    try {
                                                        await navigator.clipboard.writeText(removeAllImports(replaceUnsplashUrls(replaceThemeReferences(aiGeneratedComponent.code, theme))));
                                                        showToast('Code copied to clipboard!');
                                                    } catch (err) {
                                                        showToast('Failed to copy code');
                                                    }
                                                }}
                                                className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                                            >
                                                <HiClipboard className="w-4 h-4" />
                                                Copy
                                            </button>
                                        </div>
                                        <pre className="flex-1 text-xs text-slate-300 overflow-auto">
                                            <code>{removeAllImports(replaceUnsplashUrls(replaceThemeReferences(aiGeneratedComponent.code, theme)))}</code>
                                        </pre>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : aiGeneratedComponent && !isPremium ? (
                        // Non-premium: Show banner
                        <div className="max-w-4xl mx-auto">
                            <div className="bg-gradient-to-r from-indigo-600/20 to-purple-600/20 border border-indigo-500/30 rounded-lg p-8 text-center">
                                <HiSparkles className="w-12 h-12 text-indigo-400 mx-auto mb-4" />
                                <h3 className="text-xl font-bold text-white mb-2">Preview is a Pro Feature</h3>
                                <p className="text-sm text-slate-400 mb-6">Upgrade to Pro to see your components rendered in real-time in the canvas</p>
                                <button
                                    onClick={() => onOpenPricing?.()}
                                    className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-lg transition-colors"
                                >
                                    Upgrade to Pro
                                </button>
                            </div>
                        </div>
                    ) : (
                        // Default Component View
                        <div className="max-w-4xl mx-auto">
                            <div className="mb-6 flex items-center justify-between">
                                <div>
                                    <h2 className="text-2xl font-bold tracking-tight transition-colors mb-2" style={{ color: theme.text.main }}>
                                        {(activeTab === 'molecules' ? molecules : organisms).find(c => c.id === selectedComponent)?.label}
                                    </h2>
                                    <p className="text-sm transition-colors" style={{ color: theme.text.secondary }}>
                                        Explore all variants and states of {(activeTab === 'molecules' ? molecules : organisms).find(c => c.id === selectedComponent)?.label.toLowerCase()}
                                    </p>
                                </div>
                                {savedGeneratedComponent && isPremium && (
                                    <button
                                        onClick={() => {
                                            setAiGeneratedComponent(savedGeneratedComponent);
                                            setOriginalTheme(theme);
                                        }}
                                        className="px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                                            style={{ 
                                            backgroundColor: theme.action.primary,
                                            color: theme.text.onPrimary
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.backgroundColor = theme.action.primaryHover;
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.backgroundColor = theme.action.primary;
                                        }}
                                    >
                                        <HiSparkles className="w-4 h-4" />
                                        View Generated Component
                                    </button>
                                )}
                                    </div>
                            {renderComponentView()}
                            </div>
                    )}
                            </div>
            </div>

            {/* --- AI ASSISTANT SIDEBAR (RIGHT) - MATERIAL DESIGN --- */}
            <div className={`relative bg-slate-900 border-l border-white/5 flex flex-col shrink-0 z-10 shadow-2xl transition-all duration-300 ${isRightSidebarExpanded ? 'w-full md:w-[400px]' : 'w-0 md:w-[24px]'} overflow-hidden`}>
                {/* Toggle Button */}
                <button
                    onClick={() => setIsRightSidebarExpanded(!isRightSidebarExpanded)}
                    className={`absolute z-50 w-6 h-6 bg-slate-800 border border-white/10 rounded-full flex items-center justify-center text-white hover:bg-slate-700 transition-all shadow-lg hover:scale-110 ${isRightSidebarExpanded ? '-left-3 top-6' : 'left-1 top-6'}`}
                    title={isRightSidebarExpanded ? 'Collapse AI Designer' : 'Expand AI Designer'}
                    style={{ pointerEvents: 'auto' }}
                >
                    {isRightSidebarExpanded ? (
                        <HiChevronRight className="w-4 h-4" />
                    ) : (
                        <HiChevronLeft className="w-4 h-4" />
                    )}
                </button>
                
                {isRightSidebarExpanded && (
                <div className="flex-1 overflow-hidden flex flex-col">
                    {/* Header - Material Design style */}
                    <div className="p-6 border-b border-white/5 shrink-0">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                                    <HiSparkles className="w-4 h-4 text-indigo-500" />
                                    AI Designer
                                </h3>
                                <p className="text-xs text-slate-500 mt-2">
                                    Powered by Google Material Design
                                </p>
                            </div>
                            {!isPremium && (
                                <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-1 bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 rounded">
                                    PRO
                                </span>
                            )}
                        </div>
                    </div>
                    
                    {/* Messages History - Mantener funcionalidad */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
                        {aiMessages.length === 0 && (
                            <div className="text-sm text-slate-400 text-center py-8">
                                <HiSparkles className="w-8 h-8 mx-auto mb-3 text-indigo-500/50" />
                                <p>Ask me to create UI components!</p>
                                <p className="text-xs mt-2 text-slate-500">Example: "Create a card UI with primary-600"</p>
                            </div>
                        )}
                        
                        {aiMessages.map((msg, idx) => (
                            <div key={idx} className={`flex flex-col gap-2 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                                <div 
                                    className={`max-w-[85%] rounded-lg px-4 py-2 text-sm ${
                                        msg.role === 'user' 
                                            ? 'bg-indigo-600 text-white' 
                                            : 'bg-slate-800 text-slate-200'
                                    }`}
                                >
                                    {msg.text}
                                </div>
                                {msg.code && (
                                    <div className="w-full mt-2">
                                        <div className="bg-slate-950 border border-slate-700 rounded-lg p-3">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-xs text-slate-400">Generated Code</span>
                                                <button
                                                    onClick={async () => {
                                                        try {
                                                            const updatedCode = removeAllImports(replaceUnsplashUrls(replaceThemeReferences(msg.code || '', theme)));
                                                            await navigator.clipboard.writeText(updatedCode);
                                                            showToast('Code copied to clipboard!');
                                                        } catch (err) {
                                                            showToast('Failed to copy code');
                                                        }
                                                    }}
                                                    className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                                                >
                                                    <HiClipboard className="w-4 h-4" />
                                                    Copy
                                                </button>
                                            </div>
                                            <pre className="text-xs text-slate-300 overflow-x-auto max-h-[200px]">
                                                <code>{removeAllImports(replaceUnsplashUrls(replaceThemeReferences(msg.code || '', theme)))}</code>
                                            </pre>
                                        </div>
                                        {!isPremium && (
                                            <div className="mt-2 bg-gradient-to-r from-indigo-600/20 to-purple-600/20 border border-indigo-500/30 rounded-lg p-3">
                                                <p className="text-xs text-slate-400">
                                                    💡 Preview available in canvas for Pro users
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                        
                        {isAIGenerating && (
                            <div className="flex flex-col items-start">
                                <div className="px-3 py-2 rounded-lg text-xs bg-slate-800 text-slate-300 border border-slate-700">
                                    <div className="flex items-center gap-2">
                                        <div className="relative w-4 h-4">
                                            <svg className="w-4 h-4 animate-spin" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <defs>
                                                    <linearGradient id="mac-spinner-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                                        <stop offset="0%" stopColor="#ff6b6b" />
                                                        <stop offset="14.28%" stopColor="#ffa500" />
                                                        <stop offset="28.57%" stopColor="#ffd700" />
                                                        <stop offset="42.85%" stopColor="#90ee90" />
                                                        <stop offset="57.14%" stopColor="#4ecdc4" />
                                                        <stop offset="71.42%" stopColor="#45b7d1" />
                                                        <stop offset="85.71%" stopColor="#96ceb4" />
                                                        <stop offset="100%" stopColor="#ff6b6b" />
                                                    </linearGradient>
                                                </defs>
                                                <circle cx="8" cy="8" r="6" stroke="url(#mac-spinner-gradient)" strokeWidth="2" strokeLinecap="round" strokeDasharray="3 20" fill="none" opacity="0.8">
                                                    <animateTransform
                                                        attributeName="transform"
                                                        type="rotate"
                                                        from="0 8 8"
                                                        to="360 8 8"
                                                        dur="0.8s"
                                                        repeatCount="indefinite"
                                                    />
                                                </circle>
                                            </svg>
                                        </div>
                                        <span>Generating...</span>
                                    </div>
                                </div>
                            </div>
                        )}
                        
                        <div ref={aiMessagesEndRef} />
                    </div>
                    
                    {/* Input Area - Mantener funcionalidad */}
                    <div className="p-4 border-t border-white/5 shrink-0">
                        <div className="flex gap-2 items-end">
                            <textarea
                                ref={aiPromptRef}
                                value={aiPrompt}
                                onChange={(e) => setAiPrompt(e.target.value)}
                                onKeyDown={(e) => {
                                    // Enter alone does nothing (allows line break)
                                }}
                                placeholder="e.g. Create a card UI with primary-600..."
                                disabled={isAIGenerating}
                                rows={1}
                                className="flex-1 px-4 py-2 rounded-lg text-sm border transition-all focus:outline-none focus:ring-2 resize-none overflow-hidden bg-slate-800 text-white border-slate-700 placeholder-slate-500"
                                style={{ 
                                    minHeight: '40px',
                                    maxHeight: '200px'
                                }}
                            />
                            <button
                                type="button"
                                onClick={async () => {
                                    if (!aiPrompt.trim() || isAIGenerating) return;
                                    
                                    const userPrompt = aiPrompt.trim();
                                    setAiPrompt('');
                                    setAiMessages(prev => [...prev, { role: 'user', text: userPrompt }]);
                                    setIsAIGenerating(true);
                                    setCodeError('');
                                    
                                    try {
                                        // Prepare palette with shades
                                        const pShades = generateShades(brandPalette[config.primaryIndex] || brandPalette[0], globalConfig);
                                        const brandWithShades = brandPalette.map(c => ({
                                            name: c.name,
                                            hex: c.hex,
                                            shades: generateShades(c, globalConfig).map(s => ({ level: s.level, hex: s.hex }))
                                        }));
                                        const neutralWithShades = neutralPalette.map(c => ({
                                            name: c.name,
                                            hex: c.hex,
                                            shades: generateShades(c, globalConfig).map(s => ({ level: s.level, hex: s.hex }))
                                        }));
                                        const semanticWithShades = semanticPalette.map(c => ({
                                            name: c.name,
                                            hex: c.hex,
                                            shades: generateShades(c, globalConfig).map(s => ({ level: s.level, hex: s.hex }))
                                        }));
                                        
                                        const result = await generateUIFromPrompt({
                                            prompt: userPrompt,
                                            palette: {
                                                brand: brandWithShades,
                                                neutral: neutralWithShades,
                                                semantic: semanticWithShades
                                            },
                                            availableComponents: {
                                                molecules: molecules.map(m => m.id),
                                                organisms: organisms.map(o => o.id)
                                            },
                                            config
                                        });
                                        
                                        if (result.code) {
                                            setGeneratedCode(result.code);
                                            
                                            // Validar que el código no esté vacío o sea solo comentarios
                                            const codeWithoutComments = result.code.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*/g, '').trim();
                                            if (!codeWithoutComments || codeWithoutComments.length < 50) {
                                                setCodeError('Generated code is too short or empty. Please try rephrasing your request.');
                                                setAiMessages(prev => [...prev, { 
                                                    role: 'assistant', 
                                                    text: 'The generated code appears to be empty or invalid. Please try rephrasing your request with more specific details.'
                                                }]);
                                                return;
                                            }
                                            
                                            // Extracción inteligente del nombre del componente
                                            let componentName = 'Component';
                                            
                                            // 1. Prioridad: Buscar export default
                                            const exportDefaultMatch = result.code.match(/export\s+default\s+(\w+)/);
                                            if (exportDefaultMatch) {
                                                componentName = exportDefaultMatch[1];
                                            } else {
                                                // 2. Buscar componentes React (const ComponentName = () => {} o const ComponentName = function() {})
                                                // Ignorar variables simples como 'theme', 'cardStyle', etc. (nombres que empiezan con minúscula)
                                                const componentMatches = Array.from(result.code.matchAll(/(?:const|function)\s+([A-Z][a-zA-Z0-9]*)\s*=\s*(?:\([^)]*\)\s*)?(?:=>|function)/g));
                                                
                                                if (componentMatches.length > 0) {
                                                    // Tomar el último match (el componente principal, no sub-componentes)
                                                    componentName = componentMatches[componentMatches.length - 1][1];
                                                } else {
                                                    // 3. Fallback: buscar cualquier función con mayúscula inicial que no sea 'React', 'Component', etc.
                                                    const fallbackMatch = result.code.match(/(?:const|function)\s+([A-Z][a-zA-Z0-9]+)(?:\s*=\s*(?:\([^)]*\)\s*)?=>|(?:\s*\{|\s*\([^)]*\)\s*\{))/);
                                                    if (fallbackMatch && !['React', 'Component', 'Fragment'].includes(fallbackMatch[1])) {
                                                        componentName = fallbackMatch[1];
                                                    }
                                                }
                                            }
                                            
                                            setOriginalTheme(theme); // Guardar el tema original cuando se genera el componente
                                            setAiGeneratedComponent({ code: result.code, componentName });
                                            setAiMessages(prev => [...prev, { 
                                                role: 'assistant', 
                                                text: "I've generated what you requested and it's in the canvas",
                                                code: result.code
                                            }]);
                                        } else {
                                            setCodeError(result.description);
                                            setAiMessages(prev => [...prev, { 
                                                role: 'assistant', 
                                                text: result.description || 'Error generating component'
                                            }]);
                                        }
                                    } catch (error: any) {
                                        setCodeError(error.message || 'Unknown error');
                                        setAiMessages(prev => [...prev, { 
                                            role: 'assistant', 
                                            text: `Error: ${error.message || 'Unknown error'}`
                                        }]);
                                    } finally {
                                        setIsAIGenerating(false);
                                    }
                                }}
                                disabled={isAIGenerating || !aiPrompt.trim()}
                                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center ${
                                    isAIGenerating || !aiPrompt.trim() 
                                        ? 'bg-slate-700 text-slate-400' 
                                        : 'bg-indigo-600 text-white hover:bg-indigo-500'
                                }`}
                            >
                                <FaPaperPlane className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
                )}
            </div>
        </div>
        
        {/* Global Toast */}
        <Toast.Provider>
            <Toast.Root 
                open={toastOpen}
                onOpenChange={setToastOpen}
                className="fixed bottom-4 right-4 p-4 rounded-lg shadow-lg border max-w-md z-50"
                style={{ 
                    backgroundColor: theme.bg.card, 
                    borderColor: theme.border.subtle 
                }}
            >
                <Toast.Title className="font-bold mb-1" style={{ color: theme.text.main }}>
                    {toastMessage}
                </Toast.Title>
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
  );
};

export default UIPlayground;
