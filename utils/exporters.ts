import { ColorData, Shade, ColorGroup } from '../types';
import { generateShades, hexToRgbNormalized, hexToHsl } from './colorUtils';

const sanitizeName = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

// --- Helper for Mapping Tuner Indices to Scale Levels ---
const getLevelForIndex = (index: number, total: number): number => {
    if (total === 11) {
        // Perfect 50-950 mapping
        return [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950][index];
    }
    if (total === 10) {
        // Standard 50-900 mapping
        return [50, 100, 200, 300, 400, 500, 600, 700, 800, 900][index];
    }
    // Fallback: 100, 200, 300...
    return (index + 1) * 100;
};

// --- Standard Exporters (Single Palette -> Generated Shades) ---

export const exportToCSS = (palette: ColorData[]): string => {
  let output = ':root {\n';
  palette.forEach(color => {
    const name = sanitizeName(color.name);
    output += `  /* ${color.name} */\n`;
    output += `  --color-${name}: ${color.hex};\n`;
    const shades = generateShades(color);
    shades.forEach(shade => {
      output += `  --color-${name}-${shade.level}: ${shade.hex};\n`;
    });
    output += '\n';
  });
  output += '}';
  return output;
};

export const exportToSCSS = (palette: ColorData[]): string => {
  let output = '';
  palette.forEach(color => {
    const name = sanitizeName(color.name);
    output += `// ${color.name}\n`;
    output += `$color-${name}: ${color.hex};\n`;
    const shades = generateShades(color);
    shades.forEach(shade => {
      output += `$color-${name}-${shade.level}: ${shade.hex};\n`;
    });
    output += '\n';
  });
  return output;
};

export const exportToTailwind = (palette: ColorData[]): string => {
  const colorsObj: Record<string, any> = {};
  
  palette.forEach(color => {
    const name = sanitizeName(color.name);
    const shades = generateShades(color);
    const shadeObj: Record<number, string> = {};
    shades.forEach(s => {
      shadeObj[s.level] = s.hex;
    });
    
    let key = name;
    let i = 1;
    while (colorsObj[key]) {
      key = `${name}-${i}`;
      i++;
    }
    
    colorsObj[key] = shadeObj;
  });

  return `// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: ${JSON.stringify(colorsObj, null, 2).replace(/"([^"]+)":/g, '$1:')}
    }
  }
}`;
};

export const exportToJSON = (palette: ColorData[]): string => {
  const data = palette.map(color => ({
    name: color.name,
    hex: color.hex,
    hsl: color.hsl,
    rgb: color.rgb,
    shades: generateShades(color)
  }));
  return JSON.stringify(data, null, 2);
};

// --- Figma Variables Export (Design System Structured JSON) ---
export const exportToFigma = (
  paletteName: string,
  brand: ColorData[],
  neutrals: ColorData[],
  semantic: ColorData[]
): string => {
  const mapColor = (c: ColorData) => ({
    hex: c.hex,
    rgb: c.rgb,
    hsl: c.hsl,
    name: c.name,
    scaleConfig: c.scaleConfig || {
      hueShift: 0,
      saturationBoost: 0,
      lightnessEase: 'linear',
      useOkLCH: false,
    },
  });

  const output = {
    paletteName,
    brand: brand.map(mapColor),
    neutrals: neutrals.map(mapColor),
    semantic: semantic.map(mapColor),
  };
  return JSON.stringify(output, null, 2);
};


// --- Procreate .swatches Export (JSON Format) ---
export const exportToProcreate = (palette: ColorData[], paletteName: string): string => {
    // Procreate uses a JSON structure for .swatches
    const swatches = [];

    // Flatten all shades into a single list
    for (const color of palette) {
        const shades = generateShades(color);
        for (const shade of shades) {
             const hsl = hexToHsl(shade.hex);
             swatches.push({
                 hue: hsl.h / 360,
                 saturation: hsl.s / 100,
                 brightness: hsl.l / 100,
                 alpha: 1,
                 colorSpace: 0 // HSB
             });
        }
    }

    const file = {
        name: paletteName,
        swatches: swatches
    };

    return JSON.stringify(file, null, 2);
};


// --- Adobe .ASE Export (Binary) ---
// Returns a DataView/Uint8Array containing the ASE file data
export const createASE = (palette: ColorData[], paletteName: string): Uint8Array => {
    // Helper to write data
    const parts: Uint8Array[] = [];
    
    // 1. Signature "ASEF"
    parts.push(new Uint8Array([0x41, 0x53, 0x45, 0x46]));
    
    // 2. Version 1.0 (Major 1, Minor 0)
    parts.push(new Uint8Array([0x00, 0x01, 0x00, 0x00]));
    
    // 3. Block Count.
    // We will create 1 Group (Start), then Colors, then Group End.
    // So total blocks = 1 (Group Start) + (Colors * Shades) + 1 (Group End)
    // Wait, simpler to just list all colors as Global or Put in one Group.
    // Let's create one Group named after the palette.
    
    // Flatten palette into list of { name, hex }
    const flatColors: {name: string, hex: string}[] = [];
    palette.forEach(c => {
        const shades = generateShades(c);
        shades.forEach(s => {
            flatColors.push({ name: `${c.name} ${s.level}`, hex: s.hex });
        });
    });

    const blockCount = flatColors.length + 2; // +2 for Group Start and Group End
    const countBuffer = new Uint8Array(4);
    new DataView(countBuffer.buffer).setUint32(0, blockCount, false); // Big Endian
    parts.push(countBuffer);

    // --- Helper functions for blocks ---
    
    const stringToBytes = (str: string) => {
        // ASE strings are null-terminated, big-endian UTF-16BE
        const len = str.length + 1; // +1 for null terminator
        const buf = new Uint8Array(len * 2);
        const view = new DataView(buf.buffer);
        for (let i = 0; i < str.length; i++) {
            view.setUint16(i * 2, str.charCodeAt(i), false);
        }
        view.setUint16(str.length * 2, 0, false); // Null terminator
        return buf;
    };

    const createBlock = (type: number, data: Uint8Array) => {
        // Block: Type (2 bytes), Length (4 bytes), Data (Var)
        const header = new Uint8Array(6);
        const view = new DataView(header.buffer);
        view.setUint16(0, type, false);
        view.setUint32(2, data.length, false);
        return [header, data];
    };

    // --- 4. Group Start Block ---
    // Type 0xC001
    // Data: Len (2 bytes), String (Var)
    const groupNameBytes = stringToBytes(paletteName);
    const groupDataLen = new Uint8Array(2);
    new DataView(groupDataLen.buffer).setUint16(0, groupNameBytes.length / 2, false); // Length in 16-bit units? No, spec says len in characters? Spec says "Length of the name string ... NOT bytes"
    // Wait, standard says "The length of the string... is the number of characters... includes null".
    
    // Let's rebuild Group Data payload properly
    const groupPayload = new Uint8Array(2 + groupNameBytes.length);
    new DataView(groupPayload.buffer).setUint16(0, groupNameBytes.length / 2, false); // Length in characters
    groupPayload.set(groupNameBytes, 2);
    
    const groupBlock = createBlock(0xC001, groupPayload);
    parts.push(groupBlock[0], groupBlock[1]);

    // --- 5. Color Blocks ---
    // Type 0x0001
    flatColors.forEach(c => {
        const nameBytes = stringToBytes(c.name);
        const rgb = hexToRgbNormalized(c.hex);
        
        // Payload: Name Len (2), Name (Var), Color Model (4 chars), Values (3 * 4 bytes float), Type (2 bytes)
        // Color Model: 'RGB '
        // Type: 0 = Global, 1 = Spot, 2 = Normal. Let's use 2 (Normal) or 0 (Global). 0 is safer.
        
        const payloadLen = 2 + nameBytes.length + 4 + 12 + 2;
        const payload = new Uint8Array(payloadLen);
        const view = new DataView(payload.buffer);
        
        let offset = 0;
        
        // Name Len
        view.setUint16(offset, nameBytes.length / 2, false);
        offset += 2;
        
        // Name
        payload.set(nameBytes, offset);
        offset += nameBytes.length;
        
        // Model 'RGB '
        payload.set(new Uint8Array([0x52, 0x47, 0x42, 0x20]), offset);
        offset += 4;
        
        // Values (R, G, B floats)
        view.setFloat32(offset, rgb.r, false);
        offset += 4;
        view.setFloat32(offset, rgb.g, false);
        offset += 4;
        view.setFloat32(offset, rgb.b, false);
        offset += 4;
        
        // Type (0 = Global)
        view.setUint16(offset, 0, false);
        
        const colorBlock = createBlock(0x0001, payload);
        parts.push(colorBlock[0], colorBlock[1]);
    });

    // --- 6. Group End Block ---
    // Type 0xC002, Length 0
    const endBlock = createBlock(0xC002, new Uint8Array(0));
    parts.push(endBlock[0], endBlock[1]);

    // Concat all
    const totalLength = parts.reduce((acc, curr) => acc + curr.length, 0);
    const result = new Uint8Array(totalLength);
    let pos = 0;
    for (const part of parts) {
        result.set(part, pos);
        pos += part.length;
    }
    
    return result;
};


// --- Tuned Exporters (Pre-defined Scales -> Mapped Levels) ---
// Updated to support Figma/Adobe for Tuned groups too

export const exportGroupsToCSS = (groups: ColorGroup[]): string => {
    let output = ':root {\n';
    groups.forEach(group => {
        const name = sanitizeName(group.name);
        output += `  /* ${group.name} Scale */\n`;
        const total = group.colors.length;
        group.colors.forEach((color, idx) => {
            const level = getLevelForIndex(idx, total);
            output += `  --color-${name}-${level}: ${color.hex};\n`;
        });
        output += '\n';
    });
    output += '}';
    return output;
};

export const exportGroupsToSCSS = (groups: ColorGroup[]): string => {
    let output = '';
    groups.forEach(group => {
        const name = sanitizeName(group.name);
        output += `// ${group.name} Scale\n`;
        const total = group.colors.length;
        group.colors.forEach((color, idx) => {
            const level = getLevelForIndex(idx, total);
            output += `$color-${name}-${level}: ${color.hex};\n`;
        });
        output += '\n';
    });
    return output;
};

export const exportGroupsToTailwind = (groups: ColorGroup[]): string => {
    const colorsObj: Record<string, any> = {};

    groups.forEach(group => {
        const name = sanitizeName(group.name);
        const total = group.colors.length;
        const shadeObj: Record<number, string> = {};
        
        group.colors.forEach((color, idx) => {
             const level = getLevelForIndex(idx, total);
             shadeObj[level] = color.hex;
        });

        // Handle collision
        let key = name;
        let i = 1;
        while (colorsObj[key]) {
            key = `${name}-${i}`;
            i++;
        }
        colorsObj[key] = shadeObj;
    });

    return `// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: ${JSON.stringify(colorsObj, null, 2).replace(/"([^"]+)":/g, '$1:')}
    }
  }
}`;
};

export const exportGroupsToJSON = (groups: ColorGroup[]): string => {
    const data = groups.map(group => {
        const total = group.colors.length;
        return {
            name: group.name,
            colors: group.colors.map((c, idx) => ({
                level: getLevelForIndex(idx, total),
                hex: c.hex,
                hsl: c.hsl
            }))
        };
    });
    return JSON.stringify(data, null, 2);
};

export const exportGroupsToFigma = (groups: ColorGroup[]): string => {
    const collections: any = {
        name: "ChromaForge Collection",
        modes: [{ name: "Light" }, { name: "Dark" }],
        variables: []
    };

    groups.forEach(group => {
        const name = group.name;
        const total = group.colors.length;
        
        group.colors.forEach((color, idx) => {
            const level = getLevelForIndex(idx, total);
            collections.variables.push({
                name: `${name}/${level}`,
                type: "COLOR",
                value: color.hex,
                scopes: ["ALL_SCOPES"]
            });
        });
    });

    return JSON.stringify(collections, null, 2);
};

export const createGroupsASE = (groups: ColorGroup[]): Uint8Array => {
    // Re-use ASE logic but for tuned groups structure
    const flatColors: {name: string, hex: string}[] = [];
    groups.forEach(group => {
        const total = group.colors.length;
        group.colors.forEach((c, idx) => {
             const level = getLevelForIndex(idx, total);
             flatColors.push({ name: `${group.name} ${level}`, hex: c.hex });
        });
    });

    // We only need to copy the ASE generation logic from above, but to avoid duplication
    // and keep this file clean, I'll allow a slight DRY violation for clarity or refactor if needed.
    // For now, I will assume the `createASE` function above is sufficient if we map inputs to it.
    // But `createASE` takes `ColorData[]` and generates shades. Here we already HAVE shades.
    
    // Custom Implementation for Groups:
     const parts: Uint8Array[] = [];
    parts.push(new Uint8Array([0x41, 0x53, 0x45, 0x46]));
    parts.push(new Uint8Array([0x00, 0x01, 0x00, 0x00]));
    
    const blockCount = flatColors.length + 2; 
    const countBuffer = new Uint8Array(4);
    new DataView(countBuffer.buffer).setUint32(0, blockCount, false); 
    parts.push(countBuffer);

    const stringToBytes = (str: string) => {
        const len = str.length + 1;
        const buf = new Uint8Array(len * 2);
        const view = new DataView(buf.buffer);
        for (let i = 0; i < str.length; i++) {
            view.setUint16(i * 2, str.charCodeAt(i), false);
        }
        view.setUint16(str.length * 2, 0, false);
        return buf;
    };

    const createBlock = (type: number, data: Uint8Array) => {
        const header = new Uint8Array(6);
        const view = new DataView(header.buffer);
        view.setUint16(0, type, false);
        view.setUint32(2, data.length, false);
        return [header, data];
    };

    // Group Start
    const groupNameBytes = stringToBytes("Tuned Palette");
    const groupPayload = new Uint8Array(2 + groupNameBytes.length);
    new DataView(groupPayload.buffer).setUint16(0, groupNameBytes.length / 2, false);
    groupPayload.set(groupNameBytes, 2);
    const groupBlock = createBlock(0xC001, groupPayload);
    parts.push(groupBlock[0], groupBlock[1]);

    // Colors
    flatColors.forEach(c => {
        const nameBytes = stringToBytes(c.name);
        const rgb = hexToRgbNormalized(c.hex);
        const payloadLen = 2 + nameBytes.length + 4 + 12 + 2;
        const payload = new Uint8Array(payloadLen);
        const view = new DataView(payload.buffer);
        let offset = 0;
        view.setUint16(offset, nameBytes.length / 2, false);
        offset += 2;
        payload.set(nameBytes, offset);
        offset += nameBytes.length;
        payload.set(new Uint8Array([0x52, 0x47, 0x42, 0x20]), offset);
        offset += 4;
        view.setFloat32(offset, rgb.r, false);
        offset += 4;
        view.setFloat32(offset, rgb.g, false);
        offset += 4;
        view.setFloat32(offset, rgb.b, false);
        offset += 4;
        view.setUint16(offset, 0, false);
        const colorBlock = createBlock(0x0001, payload);
        parts.push(colorBlock[0], colorBlock[1]);
    });

    const endBlock = createBlock(0xC002, new Uint8Array(0));
    parts.push(endBlock[0], endBlock[1]);

    const totalLength = parts.reduce((acc, curr) => acc + curr.length, 0);
    const result = new Uint8Array(totalLength);
    let pos = 0;
    for (const part of parts) {
        result.set(part, pos);
        pos += part.length;
    }
    return result;
}