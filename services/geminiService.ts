import { ColorData, ChatMessage } from "../types";
import { createColorData } from "../utils/colorUtils";
import { getOwnerAccessCode } from "./ownerAccess";

export interface PalettePromptResult {
  name: string;
  colors: ColorData[];
  description: string;
  paymentRequired?: boolean;
}

const isHex = (value: unknown) =>
  typeof value === 'string' && /^#?[0-9a-fA-F]{6}$/.test(value.trim());

/**
 * Frontend service that calls the backend API endpoint.
 * All Gemini API calls are handled server-side to keep API keys secure.
 */
export const generatePaletteFromPrompt = async (
  history: ChatMessage[], 
  currentPalette: { name: string, hex: string }[],
  idToken?: string | null
): Promise<PalettePromptResult> => {
  try {
    const apiUrl = '/api/palette';
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (idToken) headers.Authorization = `Bearer ${idToken}`;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        history,
        currentPalette,
        ownerAccess: getOwnerAccessCode() || undefined,
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ 
        name: "Error", 
        colors: [], 
        description: `HTTP ${response.status}: ${response.statusText}` 
      }));
      return {
        name: errorData.name || "Error",
        colors: [],
        description: errorData.description || `HTTP ${response.status}`,
        paymentRequired: response.status === 402 || errorData.paymentRequired === true,
      };
    }

    const data = await response.json();
    
    if (data.colors && Array.isArray(data.colors)) {
      const usable = data.colors.filter((c: { hex: string }) => isHex(c.hex));
      if (usable.length === 0) {
        return {
          name: data.name || "Error",
          colors: [],
          description: data.description || "No colors came back.",
        };
      }
      return {
        name: data.name || "AI Generated Palette",
        description: data.description || `I've updated the palette with ${usable.length} colors.`,
        colors: usable.map((c: { hex: string, name: string }) => createColorData(c.hex, undefined, c.name))
      };
    }
    
    return { 
      name: "Error", 
      colors: [], 
      description: "Invalid response structure: missing colors array" 
    };
  } catch (error: any) {
    console.error("Backend API Error:", error);
    
    let userMessage = "I encountered an error generating the palette.";
    
    if (error.message) {
      if (error.message.includes('fetch') || error.message.includes('network')) {
        userMessage = "Network Error. Please check your connection.";
      } else {
        userMessage = `System Error: ${error.message.slice(0, 100)}`;
      }
    }
    
    return { name: "Error", colors: [], description: userMessage };
  }
};
