
import { ArrowLeft, Check, ChevronDown, ChevronUp, Clipboard, Search, Sparkles, X } from 'lucide-react';
import React, { useMemo, useState, useRef, useEffect } from 'react';
import { ColorData, PlaygroundConfig, GlobalCurveConfig } from '../types';
import { generateShades, getContrastRatio, getLuminance, hexToRgb } from '../utils/colorUtils';
import { generateUIFromPrompt } from '../services/uiDesignerService';
import * as Accordion from '@radix-ui/react-accordion';
import * as AlertDialog from '@radix-ui/react-alert-dialog';
import * as AspectRatio from '@radix-ui/react-aspect-ratio';
import * as Avatar from '@radix-ui/react-avatar';
import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
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
import * as RadioGroupPrimitive from '@radix-ui/react-radio-group';
import * as ScrollArea from '@radix-ui/react-scroll-area';
import * as SelectPrimitive from '@radix-ui/react-select';
import * as Separator from '@radix-ui/react-separator';
import * as SliderPrimitive from '@radix-ui/react-slider';
import * as SwitchPrimitive from '@radix-ui/react-switch';
import * as Tabs from '@radix-ui/react-tabs';
import * as Toast from '@radix-ui/react-toast';
import * as Toggle from '@radix-ui/react-toggle';
import * as ToggleGroup from '@radix-ui/react-toggle-group';
import * as Toolbar from '@radix-ui/react-toolbar';
import * as Tooltip from '@radix-ui/react-tooltip';
import { CardsSidebar } from './cards/CardsSidebar';
import { CardsViewer } from './cards/CardsViewer';
import { Button, IconButton, Switch, Checkbox, Radio, RadioGroup, Select, Slider } from './cards/Molecules';
import { ThemeColors } from './cards/BaseComponents';

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
  const [componentSearchQuery, setComponentSearchQuery] = useState('');
  const [toastOpen, setToastOpen] = useState(false);
  const [checkboxStates, setCheckboxStates] = useState<{ [key: number]: boolean }>({});
  const [radioState, setRadioState] = useState<string>('option1');
  const [switchStates, setSwitchStates] = useState<{ [key: number]: boolean }>({});
  const [activeTabValue, setActiveTabValue] = useState<string>('tab1');
  // Cards Library states
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  
  // AI Assistant states
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiMessages, setAiMessages] = useState<Array<{ role: 'user' | 'assistant', text: string, code?: string }>>([]);
  const [isAIGenerating, setIsAIGenerating] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string>('');
  const [codeError, setCodeError] = useState<string>('');
  const [toastMessage, setToastMessage] = useState('');
  const [aiGeneratedComponent, setAiGeneratedComponent] = useState<{ code: string; componentName: string; bundleId?: string | null } | null>(null);
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

  // Función helper para generar el HTML del iframe
  const getIframeSrcDoc = (): string => {
    if (!aiGeneratedComponent) return '';
    
    // SOLO usar bundle compilado - NO fallback con Babel
    if (!aiGeneratedComponent.bundleId || aiGeneratedComponent.bundleId === 'null' || aiGeneratedComponent.bundleId === 'undefined') {
      return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { 
            font-family: system-ui, sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100vh;
            margin: 0;
            background: #f5f5f5;
        }
        .error-box {
            text-align: center;
            padding: 40px;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            max-width: 500px;
        }
        h2 { color: #d32f2f; margin: 0 0 16px; }
        p { color: #666; margin: 0; }
    </style>
</head>
<body>
    <div class="error-box">
        <h2>⚠️ Bundle no disponible</h2>
        <p>El componente no pudo ser compilado. Por favor, intenta generar el componente nuevamente.</p>
    </div>
</body>
</html>`;
    }
    
    // Bundle compilado disponible - cargar normalmente
    const primaryColor = theme.action.primary;
    const primaryHover = theme.action.primaryHover;
    const secondaryColor = theme.action.secondary || theme.action.primary;
    const bgDefault = theme.bg.page;
    const bgPaper = theme.bg.card;
    const textPrimary = theme.text.main;
    const textSecondary = theme.text.secondary;
    const disabledBg = theme.disabled.bg;
    const disabledText = theme.disabled.text;
    const disabledBorder = theme.disabled.border;
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
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            background-color: ${bgDefault};
        }
    </style>
    <script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"></script>
    <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
    <script src="https://unpkg.com/@emotion/react@11/dist/emotion-react.umd.min.js"></script>
    <script src="https://unpkg.com/@emotion/styled@11/dist/emotion-styled.umd.min.js"></script>
    <script src="https://unpkg.com/@mui/material@5/dist/material-ui.development.js"></script>
    <script>
        // Wait for Material-UI to be available
        const waitForMaterialUI = (callback, maxWait = 5000) => {
            const startTime = Date.now();
            const check = () => {
                if (typeof MaterialUI !== 'undefined' && MaterialUI.createTheme && Date.now() - startTime < maxWait) {
                    callback();
                } else if (Date.now() - startTime >= maxWait) {
                    console.error('Material-UI failed to load');
                    callback();
                } else {
                    setTimeout(check, 50);
                }
            };
            check();
        };
        
        waitForMaterialUI(() => {
            const { ThemeProvider, createTheme } = MaterialUI;
            
            // Make Material-UI available globally
            window.MaterialUI = MaterialUI;
            window.React = React;
            window.ReactDOM = ReactDOM;
            window.createTheme = createTheme;
            
            // Create theme from ChromaForge palette
            const chromaForgePaletteTheme = createTheme({
                palette: {
                    primary: { main: '${primaryColor}', dark: '${primaryHover}' },
                    secondary: { main: '${secondaryColor}' },
                    background: { default: '${bgDefault}', paper: '${bgPaper}' },
                    text: { primary: '${textPrimary}', secondary: '${textSecondary}', disabled: '${disabledText}' },
                    error: { main: '${errorColor}' },
                    warning: { main: '${warningColor}' },
                    info: { main: '${infoColor}' },
                    success: { main: '${successColor}' },
                    action: { disabled: '${disabledText}', disabledBackground: '${disabledBg}' },
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
                },
            });
            
            window.chromaForgePaletteTheme = chromaForgePaletteTheme;
            
            // Load and execute compiled bundle
            const script = document.createElement('script');
            script.src = '/api/bundles/${aiGeneratedComponent.bundleId}.js';
            script.onload = () => {
                try {
                    const ComponentToRender = window['${aiGeneratedComponent.componentName}'];
                    if (typeof ComponentToRender === 'function') {
                        const root = ReactDOM.createRoot(document.getElementById('root'));
                        root.render(
                            React.createElement(ThemeProvider, { theme: chromaForgePaletteTheme },
                                React.createElement(ComponentToRender)
                            )
                        );
                    } else {
                        throw new Error('Component not found: ${aiGeneratedComponent.componentName}');
                    }
                } catch (e) {
                    console.error('Error rendering component:', e);
                    document.getElementById('root').innerHTML = '<div style="padding: 20px; color: red;">Error: ' + String(e) + '</div>';
                }
            };
            script.onerror = () => {
                document.getElementById('root').innerHTML = '<div style="padding: 20px; color: red;">Failed to load bundle</div>';
            };
            document.head.appendChild(script);
        });
    </script>
</head>
<body>
    <div id="root"></div>
</body>
</html>`;
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
      // Secondary text: máximo shade 700-800 (no más oscuro que 800)
      const secondaryTextRaw = isDark ? get(pShades, 100) : (get(pShades, 800) || get(pShades, 700) || get(pShades, 600));
      
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
          switch: {
              off: isDark ? get(tShades, 700) : get(tShades, 400),
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
          },
          shades: {
              primary: pShades
          }
      };
  }, [brandPalette, neutralPalette, semanticPalette, config, globalConfig]);

  if (!theme) return <div className="p-10 text-center text-muted-foreground">Generate a palette first to activate the playground.</div>;

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
                  <Button theme={theme as ThemeColors}>Primary Button</Button>
                  <Button theme={theme as ThemeColors} disabled>Disabled</Button>
                  <Button theme={theme as ThemeColors}>Active</Button>
                </div>
              </div>

              {/* Secondary Buttons */}
              <div className="mb-8">
                <h4 className="text-sm font-semibold mb-4 uppercase tracking-wider" style={{ color: theme.text.secondary }}>Secondary</h4>
                <div className="flex flex-wrap gap-4">
                  <Button theme={theme as ThemeColors} variant="secondary">Secondary Button</Button>
                  <Button theme={theme as ThemeColors} variant="secondary" disabled>Disabled</Button>
                </div>
              </div>

              {/* Tertiary Buttons */}
              <div className="mb-8">
                <h4 className="text-sm font-semibold mb-4 uppercase tracking-wider" style={{ color: theme.text.secondary }}>Tertiary</h4>
                <div className="flex flex-wrap gap-4">
                  <Button theme={theme as ThemeColors} variant="tertiary">Tertiary Button</Button>
                  <Button theme={theme as ThemeColors} variant="tertiary" disabled>Disabled</Button>
                </div>
              </div>

              {/* Link Buttons */}
              <div className="mb-8">
                <h4 className="text-sm font-semibold mb-4 uppercase tracking-wider" style={{ color: theme.text.secondary }}>Link</h4>
                <div className="flex flex-wrap gap-4">
                  <Button theme={theme as ThemeColors} variant="link">Link Button</Button>
                  <Button theme={theme as ThemeColors} variant="link" disabled>Disabled</Button>
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
                    <Search className="w-5 h-5" strokeWidth={1.5}/>
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
                    <Search className="w-5 h-5" strokeWidth={1.5}/>
                  </button>
                  <button 
                    className="w-10 h-10 rounded-lg flex items-center justify-center transition-all cursor-not-allowed"
                    style={{ backgroundColor: theme.disabled.bg, color: theme.disabled.text }}
                  >
                    <Search className="w-5 h-5" strokeWidth={1.5}/>
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
                    <Search className="w-4 h-4" strokeWidth={1.5}/>
                    <span>Label + Icon Left</span>
                  </button>
                  <button 
                    className="px-6 py-3 rounded-lg text-sm font-semibold transition-all flex items-center gap-2"
                    style={{ backgroundColor: theme.action.primary, color: theme.text.onPrimary }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = theme.action.primaryHover; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = theme.action.primary; }}
                  >
                    <span>Label + Icon Right</span>
                    <Search className="w-4 h-4" strokeWidth={1.5}/>
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
                    <Search className="w-4 h-4" strokeWidth={1.5}/>
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
                    <Search className="w-4 h-4" strokeWidth={1.5}/>
                  </button>
                </div>
              </div>

              {/* Semantic Buttons */}
              <div className="mb-8">
                <h4 className="text-sm font-semibold mb-4 uppercase tracking-wider" style={{ color: theme.text.secondary }}>Semantic</h4>
                <div className="flex flex-wrap gap-4">
                  <Button theme={theme as ThemeColors} variant="success">Success</Button>
                  <Button theme={theme as ThemeColors} variant="error">Error</Button>
                  <Button theme={theme as ThemeColors} variant="warning">Warning</Button>
                  <Button theme={theme as ThemeColors} variant="info">Info</Button>
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
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: theme.text.secondary }} strokeWidth={1.5}/>
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
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: theme.text.secondary }} strokeWidth={1.5}/>
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
                      <ChevronDown className="w-4 h-4 transition-transform duration-200" strokeWidth={1.5}/>
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
                      <ChevronDown className="w-4 h-4 transition-transform duration-200" strokeWidth={1.5}/>
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
                        <Button theme={theme as ThemeColors} variant="secondary">Cancel</Button>
                      </AlertDialog.Cancel>
                      <AlertDialog.Action asChild>
                        <Button theme={theme as ThemeColors} variant="error">Yes, delete account</Button>
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
                    <CheckboxPrimitive.Root
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
                      <CheckboxPrimitive.Indicator>
                        <Check className="w-4 h-4" style={{ color: item.disabled ? theme.disabled.text : theme.text.onPrimary }} strokeWidth={1.5}/>
                      </CheckboxPrimitive.Indicator>
                    </CheckboxPrimitive.Root>
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
                    <ChevronDown className="w-4 h-4" strokeWidth={1.5}/>
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
                  <Button theme={theme as ThemeColors}>Open Dialog</Button>
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
                        <Button theme={theme as ThemeColors} variant="secondary">Cancel</Button>
                      </Dialog.Close>
                      <Dialog.Close asChild>
                        <Button theme={theme as ThemeColors}>Save changes</Button>
                      </Dialog.Close>
                    </div>
                    <Dialog.Close asChild>
                      <IconButton theme={theme as ThemeColors} className="absolute top-4 right-4">
                        <X className="w-5 h-5" strokeWidth={1.5}/>
                      </IconButton>
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
                  <Button theme={theme as ThemeColors} icon={<ChevronDown className="w-4 h-4" strokeWidth={1.5}/>}>Options</Button>
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
                          <X className="w-4 h-4" strokeWidth={1.5}/>
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
              <RadioGroupPrimitive.Root defaultValue="option1" className="space-y-3">
                {['Option 1', 'Option 2', 'Option 3'].map((option, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <RadioGroupPrimitive.Item
                      value={`option${i + 1}`}
                      className="w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all"
                      style={{
                        borderColor: theme.border.default,
                      }}
                    >
                      <RadioGroupPrimitive.Indicator
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: theme.action.primary }}
                      />
                    </RadioGroupPrimitive.Item>
                    <Label.Root className="text-sm" style={{ color: theme.text.main }}>
                      {option}
                    </Label.Root>
                  </div>
                ))}
              </RadioGroupPrimitive.Root>
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
                  <SelectPrimitive.Root>
                    <SelectPrimitive.Trigger
                      className="w-full px-3 py-2 rounded-lg text-sm flex items-center justify-between transition-all focus:outline-none focus:ring-2"
                      style={{
                        backgroundColor: theme.bg.input,
                        color: theme.text.main,
                        border: `1px solid ${theme.border.default}`,
                      }}
                    >
                      <SelectPrimitive.Value placeholder="Choose an option..." />
                      <SelectPrimitive.Icon>
                        <ChevronDown className="w-4 h-4" strokeWidth={1.5}/>
                      </SelectPrimitive.Icon>
                    </SelectPrimitive.Trigger>
                    <SelectPrimitive.Portal>
                      <SelectPrimitive.Content
                        className="rounded-lg shadow-lg border min-w-[200px] p-1"
        style={{ 
            backgroundColor: theme.bg.card, 
                          borderColor: theme.border.subtle,
                        }}
                      >
                        <SelectPrimitive.ScrollUpButton className="flex items-center justify-center h-6">
                          <ChevronUp className="w-4 h-4" style={{ color: theme.text.secondary }} strokeWidth={1.5}/>
                        </SelectPrimitive.ScrollUpButton>
                        <SelectPrimitive.Viewport>
                          {['Option 1', 'Option 2', 'Option 3', 'Option 4'].map((option, i) => (
                            <SelectPrimitive.Item
                              key={i}
                              value={option.toLowerCase().replace(' ', '-')}
                              className="px-3 py-2 rounded text-sm cursor-pointer focus:outline-none"
                              style={{
                                color: theme.text.main,
                              }}
                            >
                              <SelectPrimitive.ItemText>{option}</SelectPrimitive.ItemText>
                            </SelectPrimitive.Item>
                          ))}
                        </SelectPrimitive.Viewport>
                        <SelectPrimitive.ScrollDownButton className="flex items-center justify-center h-6">
                          <ChevronDown className="w-4 h-4" style={{ color: theme.text.secondary }} strokeWidth={1.5}/>
                        </SelectPrimitive.ScrollDownButton>
                      </SelectPrimitive.Content>
                    </SelectPrimitive.Portal>
                  </SelectPrimitive.Root>
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
                    <ChevronDown className="w-4 h-4" strokeWidth={1.5}/>
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
                  <SliderPrimitive.Root 
                    className="relative flex items-center select-none touch-none w-full h-5"
                    defaultValue={[50]}
                    max={100}
                    step={1}
                  >
                    <SliderPrimitive.Track 
                      className="bg-black/10 relative grow rounded-full h-2"
                      style={{ backgroundColor: theme.bg.input }}
                    >
                      <SliderPrimitive.Range 
                        className="absolute bg-white rounded-full h-full"
                        style={{ backgroundColor: theme.action.primary }}
                      />
                    </SliderPrimitive.Track>
                    <SliderPrimitive.Thumb 
                      className="block w-5 h-5 bg-white shadow-lg rounded-full focus:outline-none focus:ring-2"
                      style={{ 
                        backgroundColor: theme.action.primary,
                        border: `2px solid ${theme.action.primary}`
                      }}
                    />
                  </SliderPrimitive.Root>
                </div>
                <div>
                  <Label.Root className="block text-sm font-medium mb-2" style={{ color: theme.text.main }}>
                    Range: 25 - 75
                  </Label.Root>
                  <SliderPrimitive.Root 
                    className="relative flex items-center select-none touch-none w-full h-5"
                    defaultValue={[25, 75]}
                    max={100}
                    step={1}
                  >
                    <SliderPrimitive.Track 
                      className="bg-black/10 relative grow rounded-full h-2"
                      style={{ backgroundColor: theme.bg.input }}
                    >
                      <SliderPrimitive.Range 
                        className="absolute bg-white rounded-full h-full"
                        style={{ backgroundColor: theme.action.primary }}
                      />
                    </SliderPrimitive.Track>
                    <SliderPrimitive.Thumb 
                      className="block w-5 h-5 bg-white shadow-lg rounded-full focus:outline-none focus:ring-2"
                      style={{ 
                        backgroundColor: theme.action.primary,
                        border: `2px solid ${theme.action.primary}`
                      }}
                    />
                    <SliderPrimitive.Thumb 
                      className="block w-5 h-5 bg-white shadow-lg rounded-full focus:outline-none focus:ring-2"
                      style={{ 
                        backgroundColor: theme.action.primary,
                        border: `2px solid ${theme.action.primary}`
                      }}
                    />
                  </SliderPrimitive.Root>
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
                    <SwitchPrimitive.Root
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${item.disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                      checked={switchStates[item.id] || false}
                      disabled={item.disabled}
                      onCheckedChange={(checked) => !item.disabled && setSwitchStates({ ...switchStates, [item.id]: checked as boolean })}
                      style={{
                        backgroundColor: item.disabled 
                          ? theme.disabled.bg 
                          : (switchStates[item.id] ? theme.action.primary : (theme.switch?.off || theme.border.default || '#9CA3AF')),
                      }}
                    >
                      <SwitchPrimitive.Thumb
                        className="inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ease-in-out shadow-sm"
                        style={{
                          transform: switchStates[item.id] ? 'translateX(24px)' : 'translateX(4px)',
                          backgroundColor: item.disabled ? theme.disabled.text : 'white',
                        }}
                      />
                    </SwitchPrimitive.Root>
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
                      <X className="w-4 h-4" strokeWidth={1.5}/>
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
        <div className="w-full bg-card border-b border-border flex items-center justify-between px-6 py-4 shrink-0 z-20 shadow-lg">
            <div className="flex items-center gap-6">
            </div>

            <div className="flex items-center gap-6 flex-wrap">
                {/* 1. Dark Mode Toggle */}
                <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-muted-foreground uppercase whitespace-nowrap">Appearance</span>
                    <button 
                        onClick={() => onConfigChange({ ...config, isDarkMode: !config.isDarkMode })}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${config.isDarkMode ? 'bg-primary' : 'bg-accent'}`}
                    >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-primary-foreground transition duration-200 ease-in-out ${config.isDarkMode ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                </div>

                {/* 2. Primary Color Selection */}
                <div className="flex items-center gap-3">
                    <label className="text-xs font-bold text-muted-foreground uppercase whitespace-nowrap">Primary Color</label>
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
                    <label className="text-xs font-bold text-muted-foreground uppercase whitespace-nowrap">Background</label>
                    <div className="flex bg-background p-1 rounded-lg border border-border">
                        <button 
                            onClick={() => onConfigChange({ ...config, surfaceMode: 'neutral' })}
                            className={`px-3 py-1.5 text-[10px] font-bold uppercase rounded transition-all ${config.surfaceMode === 'neutral' ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                            Neutral
                        </button>
                        <button 
                            onClick={() => onConfigChange({ ...config, surfaceMode: 'brand' })}
                            className={`px-3 py-1.5 text-[10px] font-bold uppercase rounded transition-all ${config.surfaceMode === 'brand' ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                            Brand
                        </button>
                    </div>
                </div>

                {/* 4. Text Mapping */}
                <div className="flex items-center gap-3">
                    <label className="text-xs font-bold text-muted-foreground uppercase whitespace-nowrap">Typography</label>
                    <div className="flex bg-background p-1 rounded-lg border border-border">
                        <button 
                            onClick={() => onConfigChange({ ...config, textMode: 'base' })}
                            className={`px-3 py-1.5 text-[10px] font-bold uppercase rounded transition-all ${config.textMode === 'base' ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                            Gray
                        </button>
                        <button 
                            onClick={() => onConfigChange({ ...config, textMode: 'tinted' })}
                            className={`px-3 py-1.5 text-[10px] font-bold uppercase rounded transition-all ${config.textMode === 'tinted' ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                            Tinted
                        </button>
                    </div>
                </div>

                {/* 5. Disabled Mode */}
                <div className="flex items-center gap-3">
                    <label className="text-xs font-bold text-muted-foreground uppercase whitespace-nowrap">Disabled</label>
                    <div className="flex bg-background p-1 rounded-lg border border-border">
                        <button 
                            onClick={() => onConfigChange({ ...config, disabledMode: 'base' })}
                            className={`px-3 py-1.5 text-[10px] font-bold uppercase rounded transition-all ${config.disabledMode === 'base' ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                            Base
                        </button>
                        <button 
                            onClick={() => onConfigChange({ ...config, disabledMode: 'tinted' })}
                            className={`px-3 py-1.5 text-[10px] font-bold uppercase rounded transition-all ${config.disabledMode === 'tinted' ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:text-foreground'}`}
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
            <div className="relative bg-card border-r border-border flex flex-col shrink-0 z-10 shadow-2xl w-full md:w-[280px] overflow-hidden">
                { (
                <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col">
                <div className="p-6 border-b border-border">
                    <p className="text-xs text-muted-foreground">
                        Browse components with your color tokens.
                    </p>
                        </div>

                {/* TABS */}
                <div className="px-4 pt-4 border-b border-border">
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setActiveTab('molecules');
                        setSelectedComponent('button');
                      }}
                      className={`flex-1 px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                        activeTab === 'molecules'
                          ? 'palette-ink text-white'
                          : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                      }`}
                      style={{
                        backgroundColor: activeTab === 'molecules' ? theme.action.primary : 'transparent',
                      }}
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
                          ? 'palette-ink text-white'
                          : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                      }`}
                      style={{
                        backgroundColor: activeTab === 'organisms' ? theme.action.primary : 'transparent',
                      }}
                    >
                      Organisms
                    </button>
                        </div>
                    </div>

                {/* Search */}
                <div className="px-4 pt-4 pb-4 border-b border-border">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" strokeWidth={1.5}/>
                    <input
                      type="text"
                      placeholder={`Search ${activeTab}...`}
                      value={componentSearchQuery}
                      onChange={(e) => setComponentSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 rounded-lg text-sm bg-secondary border border-border text-muted-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                    />
                  </div>
                </div>

                {/* COMPONENT LIST */}
                <div className="p-4 space-y-1">
                    {(activeTab === 'molecules' ? molecules : organisms)
                      .filter((comp) => 
                        comp.label.toLowerCase().includes(componentSearchQuery.toLowerCase())
                      )
                      .map((comp) => (
                        <button
                            key={comp.id}
                            onClick={() => {
                                setSelectedComponent(comp.id);
                                setSelectedCardId(null);
                            }}
                            className={`w-full px-4 py-3 rounded-lg text-sm font-medium transition-all text-left ${
                                selectedComponent === comp.id
                                    ? 'palette-ink text-white shadow-md'
                                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                            }`}
                            style={{
                                backgroundColor: selectedComponent === comp.id ? theme.action.primary : 'transparent',
                            }}
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
                {/* Show Cards Viewer when a card is selected and no component is active */}
                {selectedCardId && !selectedComponent && !aiGeneratedComponent ? (
                    <CardsViewer 
                        selectedCardId={selectedCardId} 
                        theme={theme as any}
                    />
                ) : (
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
                                    <ArrowLeft className="w-4 h-4" strokeWidth={1.5}/>
                                    Back to Components
                                        </button>
                            </div>
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {/* Preview - 2/3 width */}
                                <div className="lg:col-span-2">
                                    <div className="bg-white rounded-lg p-6 min-h-[600px] overflow-auto border" style={{ borderColor: theme.border.subtle }}>
                                        <iframe
                                            key={`preview-${aiGeneratedComponent.componentName}-${aiGeneratedComponent.bundleId || 'no-bundle'}-${config.primaryIndex}-${config.isDarkMode}-${theme.action.primary}-${theme.bg.page}`}
                                            srcDoc={getIframeSrcDoc()}
                                        className="w-full h-[600px] border-0 rounded"
                                        sandbox="allow-scripts allow-same-origin allow-popups"
                                        title="Component Preview"
                                        />
                                </div>
                            </div>
                            
                                {/* Code - 1/3 width */}
                                <div className="lg:col-span-1">
                                    <div className="bg-background border border-border rounded-lg p-4 h-[600px] flex flex-col">
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="text-xs font-semibold text-muted-foreground">Generated Code</span>
                                            <button
                                                onClick={async () => {
                                                    try {
                                                        await navigator.clipboard.writeText(removeAllImports(replaceUnsplashUrls(replaceThemeReferences(aiGeneratedComponent.code, theme))));
                                                        showToast('Code copied to clipboard!');
                                                    } catch (err) {
                                                        showToast('Failed to copy code');
                                                    }
                                                }}
                                                className="text-xs text-foreground hover:text-foreground flex items-center gap-1"
                                            >
                                                <Clipboard className="w-4 h-4" strokeWidth={1.5}/>
                                                Copy
                                            </button>
                                        </div>
                                        <pre className="flex-1 text-xs text-muted-foreground overflow-auto">
                                            <code>{removeAllImports(replaceUnsplashUrls(replaceThemeReferences(aiGeneratedComponent.code, theme)))}</code>
                                        </pre>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : aiGeneratedComponent && !isPremium ? (
                        // Non-premium: Show banner
                        <div className="max-w-4xl mx-auto">
                            <div className="bg-gradient-to-r from-primary/20 to-purple-600/20 border border-primary rounded-lg p-8 text-center">
                                <Sparkles className="w-12 h-12 text-foreground mx-auto mb-4" strokeWidth={1.5}/>
                                <h3 className="text-xl font-bold text-foreground mb-2">Assistant is a paid feature</h3>
                                <p className="text-sm text-muted-foreground mb-6">Generated components use the same paid assistant. The rest of the studio stays free.</p>
                                <button
                                    onClick={() => onOpenPricing?.()}
                                    className="px-6 py-3 bg-primary hover:opacity-90 text-primary-foreground text-sm font-semibold rounded-lg transition-colors"
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
                                        <Sparkles className="w-4 h-4" strokeWidth={1.5}/>
                                        View Generated Component
                                    </button>
                                )}
                                    </div>
                            {renderComponentView()}
                            </div>
                    )}
                            </div>
                )}
            </div>

            {/* --- CARDS SIDEBAR (RIGHT) --- */}
            <CardsSidebar
                theme={theme as any}
                selectedCardId={selectedCardId}
                onSelectCard={(cardId) => {
                    setSelectedCardId(cardId);
                    setSelectedComponent(null as any);
                    setAiGeneratedComponent(null);
                }}
                isExpanded={true}
                onToggle={() => {}}
            />
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
                        <X className="w-4 h-4" strokeWidth={1.5}/>
                    </button>
                </Toast.Close>
            </Toast.Root>
            <Toast.Viewport />
        </Toast.Provider>
    </div>
  );
};

export default UIPlayground;
