import { ColorData, ChatMessage } from "../types";
import { createColorData } from "../utils/colorUtils";

/**
 * Frontend service that calls the backend API endpoint.
 * All Gemini API calls are handled server-side to keep API keys secure.
 */
export const generatePaletteFromPrompt = async (
  history: ChatMessage[], 
  currentPalette: { name: string, hex: string }[]
): Promise<{ name: string, colors: ColorData[], description: string }> => {
  try {
    // Determine the API base URL
    // In production, use the same origin (relative URL)
    // In development, Vite proxy or direct localhost
    const apiUrl = '/api/palette';

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        history,
        currentPalette
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ 
        name: "Error", 
        colors: [], 
        description: `HTTP ${response.status}: ${response.statusText}` 
      }));
      return errorData;
    }

    const data = await response.json();
    
    if (data.colors && Array.isArray(data.colors)) {
      return {
        name: data.name || "AI Generated Palette",
        description: data.description || `I've updated the palette with ${data.colors.length} colors.`,
        colors: data.colors.map((c: { hex: string, name: string }) => createColorData(c.hex, undefined, c.name))
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
