import { getOwnerAccessCode } from "./ownerAccess";
import { getCreditWalletId } from "./creditWallet";

interface UIGenerationRequest {
  prompt: string;
  palette: {
    brand: { name: string, hex: string, shades: { level: number, hex: string }[] }[];
    neutral: { name: string, hex: string, shades: { level: number, hex: string }[] }[];
    semantic: { name: string, hex: string, shades: { level: number, hex: string }[] }[];
  };
  availableComponents: {
    molecules: string[];
    organisms: string[];
  };
  config: {
    isDarkMode: boolean;
    primaryIndex: number;
    surfaceMode: 'neutral' | 'brand';
    textMode: 'base' | 'tinted';
    disabledMode: 'base' | 'tinted';
  };
}

interface UIGenerationResponse {
  code: string; // JSX code
  description: string;
  componentName?: string;
}

/**
 * Frontend service that calls the backend API endpoint to generate UI components.
 * All Gemini API calls are handled server-side to keep API keys secure.
 */
export const generateUIFromPrompt = async (
  request: UIGenerationRequest
): Promise<UIGenerationResponse> => {
  try {
    const apiUrl = '/api/ui-design';

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...request,
        ownerAccess: getOwnerAccessCode() || undefined,
        walletId: getCreditWalletId(),
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ 
        code: '',
        description: `HTTP ${response.status}: ${response.statusText}` 
      }));
      return errorData;
    }

    const data = await response.json();
    
    if (data.code && typeof data.code === 'string') {
      return {
        code: data.code,
        description: data.description || 'UI component generated successfully.',
        componentName: data.componentName
      };
    }
    
    return { 
      code: '',
      description: "Invalid response structure: missing code" 
    };
  } catch (error: any) {
    console.error("Backend API Error:", error);
    
    let userMessage = "I encountered an error generating the UI component.";
    
    if (error.message) {
      if (error.message.includes('fetch') || error.message.includes('network')) {
        userMessage = "Network Error. Please check your connection.";
      } else {
        userMessage = `System Error: ${error.message.slice(0, 100)}`;
      }
    }
    
    return { code: '', description: userMessage };
  }
};
