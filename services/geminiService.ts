import { ProductDetails, GeneratedContent } from "../types";

/**
 * Refactored to call the local backend generation endpoint.
 * This keeps the API key secure on the server.
 */
export const generateContent = async (details: ProductDetails): Promise<GeneratedContent> => {
  console.log("[Client] Requesting content generation from backend...");

  try {
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(details),
    });

    if (!response.ok) {
      let errorMessage = `Server Error: ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.detail || errorMessage;
      } catch (e) {
        // Not a JSON error
      }
      throw new Error(errorMessage);
    }

    const data: GeneratedContent = await response.json();
    console.log("[Client] Content received from backend");
    return data;

  } catch (error: any) {
    console.error("[Client] Generation request failed:", error);
    throw error;
  }
};