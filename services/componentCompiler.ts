import * as esbuild from 'esbuild';
import { randomBytes } from 'crypto';
import { writeFileSync, readFileSync, unlinkSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

interface CompileOptions {
  code: string;
  componentName: string;
  theme: any; // ChromaForge theme object
}

interface CompileResult {
  bundleId: string;
  bundlePath: string;
  error?: string;
}

// Directorio para bundles temporales
// Usar /tmp en producción (Cloud Run) o dist-server/bundles en desarrollo
// /tmp es escribible en Cloud Run y otros entornos serverless
const BUNDLES_DIR = process.env.NODE_ENV === 'production' 
  ? '/tmp/chromaforge-bundles'
  : join(process.cwd(), 'dist-server', 'bundles');

// Función para asegurar que el directorio existe (llamar en runtime, no en module load)
function ensureBundlesDir() {
  if (!existsSync(BUNDLES_DIR)) {
    mkdirSync(BUNDLES_DIR, { recursive: true });
  }
}

/**
 * Compila un componente React generado por IA usando esbuild
 * El código compilado será servido como bundle estático
 */
export async function compileComponent({ code, componentName, theme }: CompileOptions): Promise<CompileResult> {
  // Asegurar que el directorio existe en runtime
  ensureBundlesDir();
  
  const bundleId = randomBytes(16).toString('hex');
  const bundlePath = join(BUNDLES_DIR, `${bundleId}.js`);

  try {
    // Limpiar código: remover export default y imports problemáticos
    let cleanCode = code
      .replace(/export\s+default\s+\w+;?/g, '')
      .replace(/import\s+.*from\s+['"]@mui\/icons-material['"];?/g, '// Icons available globally')
      .replace(/import\s+\{\s*createTheme\s*\}\s+from\s+['"]@mui\/material\/styles['"];?/g, '// createTheme available globally')
      .replace(/import\s+\{\s*ThemeProvider\s*,\s*createTheme\s*\}\s+from\s+['"]@mui\/material\/styles['"];?/g, "import { ThemeProvider } from '@mui/material/styles'; // createTheme available globally");

    // Construir el código wrapper usando concatenación para evitar problemas con template literals anidados
    const headerCode = `// Material-UI y React están disponibles globalmente
const { ThemeProvider, createTheme } = window.MaterialUI || {};
const React = window.React;
const ReactDOM = window.ReactDOM;

// Helper para iconos Material
const createMaterialIcon = (name, props = {}) => {
  const { sx, color, fontSize, ...rest } = props || {};
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

// Iconos comunes disponibles globalmente
const Favorite = (props) => createMaterialIcon('favorite', props);
const Star = (props) => createMaterialIcon('star', props);
const Share = (props) => createMaterialIcon('share', props);
const AccessTime = (props) => createMaterialIcon('access_time', props);
const Restaurant = (props) => createMaterialIcon('restaurant', props);
const LocalFireDepartment = (props) => createMaterialIcon('local_fire_department', props);
const MenuBook = (props) => createMaterialIcon('menu_book', props);
const ShoppingCart = (props) => createMaterialIcon('shopping_cart', props);
const Home = (props) => createMaterialIcon('home', props);
const Search = (props) => createMaterialIcon('search', props);
const Menu = (props) => createMaterialIcon('menu', props);
const Add = (props) => createMaterialIcon('add', props);
const Delete = (props) => createMaterialIcon('delete', props);
const Edit = (props) => createMaterialIcon('edit', props);
const Close = (props) => createMaterialIcon('close', props);
const Check = (props) => createMaterialIcon('check', props);
const ArrowBack = (props) => createMaterialIcon('arrow_back', props);
const ArrowForward = (props) => createMaterialIcon('arrow_forward', props);
const SignalCellularAlt = (props) => createMaterialIcon('signal_cellular_alt', props);
const MapPin = (props) => createMaterialIcon('place', props);
const Clock = (props) => createMaterialIcon('access_time', props);
const User = (props) => createMaterialIcon('person', props);
const Plus = (props) => createMaterialIcon('add', props);
const Heart = (props) => createMaterialIcon('favorite', props);

// Rating component helper
const Rating = (props) => {
  const { value = 0, max = 5, size = 'medium', sx, readOnly } = props || {};
  const stars = [];
  const starSize = size === 'small' ? 16 : size === 'large' ? 24 : 20;
  const fullStars = Math.floor(value);
  const hasHalfStar = value % 1 >= 0.5;
  
  for (let i = 0; i < fullStars; i++) {
    stars.push(React.createElement(Star, { 
      key: 'full-' + i, 
      sx: { ...sx, fontSize: starSize, color: sx?.color || 'inherit' } 
    }));
  }
  
  if (hasHalfStar) {
    stars.push(React.createElement(Star, { 
      key: 'half', 
      sx: { ...sx, fontSize: starSize, opacity: 0.5, color: sx?.color || 'inherit' } 
    }));
  }
  
  for (let i = Math.ceil(value); i < max; i++) {
    stars.push(React.createElement(Star, { 
      key: 'empty-' + i, 
      sx: { ...sx, fontSize: starSize, opacity: 0.3, color: sx?.color || 'inherit' } 
    }));
  }
  
  return React.createElement('div', { 
    style: { display: 'flex', gap: '2px', alignItems: 'center' } 
  }, stars);
};

// Exponer iconos globalmente
window.Favorite = Favorite;
window.Star = Star;
window.Share = Share;
window.AccessTime = AccessTime;
window.Restaurant = Restaurant;
window.LocalFireDepartment = LocalFireDepartment;
window.MenuBook = MenuBook;
window.ShoppingCart = ShoppingCart;
window.Home = Home;
window.Search = Search;
window.Menu = Menu;
window.Add = Add;
window.Delete = Delete;
window.Edit = Edit;
window.Close = Close;
window.Check = Check;
window.ArrowBack = ArrowBack;
window.ArrowForward = ArrowForward;
window.SignalCellularAlt = SignalCellularAlt;
window.MapPin = MapPin;
window.Clock = Clock;
window.User = User;
window.Plus = Plus;
window.Heart = Heart;
window.Rating = Rating;

// Código generado por IA
`;

    const footerCode = `
// Exponer componente globalmente
if (typeof ` + componentName + ` !== 'undefined') {
  window['` + componentName + `'] = ` + componentName + `;
} else {
  // Si no se encontró el componente, buscar export default
  const exportMatch = ` + JSON.stringify(cleanCode) + `.match(/export\\\\s+default\\\\s+(\\\\w+)/);
  if (exportMatch) {
    try {
      window['` + componentName + `'] = eval(exportMatch[1]);
    } catch (e) {
      console.error('Could not find component:', e);
    }
  }
}
`;

    const wrappedCode = headerCode + cleanCode + footerCode;

    // Compilar con esbuild usando stdin
    const result = await esbuild.build({
      stdin: {
        contents: wrappedCode,
        loader: 'tsx',
        resolveDir: process.cwd(),
      },
      bundle: true,
      format: 'iife',
      globalName: 'ChromaForgeComponent',
      platform: 'browser',
      target: 'es2020',
      jsx: 'automatic',
      jsxFactory: 'React.createElement',
      jsxFragment: 'React.Fragment',
      external: ['react', 'react-dom', '@mui/material', '@mui/icons-material'],
      write: false,
      minify: false, // No minificar para debugging
      sourcemap: false,
    });

    // Guardar bundle
    const bundleContent = result.outputFiles[0].text;
    writeFileSync(bundlePath, bundleContent, 'utf-8');

    return {
      bundleId,
      bundlePath,
    };
  } catch (error: any) {
    console.error('[ComponentCompiler] Error compiling component:', error);
    return {
      bundleId,
      bundlePath,
      error: error.message || 'Compilation failed',
    };
  }
}

/**
 * Limpia bundles antiguos (más de 1 hora)
 */
export function cleanupOldBundles() {
  try {
    ensureBundlesDir();
    const files = require('fs').readdirSync(BUNDLES_DIR);
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;

    files.forEach((file: string) => {
      if (file.endsWith('.js')) {
        const filePath = join(BUNDLES_DIR, file);
        const stats = require('fs').statSync(filePath);
        if (now - stats.mtimeMs > oneHour) {
          unlinkSync(filePath);
        }
      }
    });
  } catch (error) {
    console.error('[ComponentCompiler] Error cleaning up bundles:', error);
  }
}
