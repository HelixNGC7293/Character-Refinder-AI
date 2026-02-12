import { GoogleGenAI } from "@google/genai";

const API_KEY = process.env.API_KEY || '';

// Convert File to Base64 string
const fileToGenerativePart = async (file: File): Promise<{ inlineData: { data: string; mimeType: string } }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
      const base64Data = base64String.split(',')[1];
      resolve({
        inlineData: {
          data: base64Data,
          mimeType: file.type,
        },
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const generateRefinedCharacter = async (
  imageFile: File,
  prompt: string
): Promise<{ url: string; mimeType: string }> => {
  if (!API_KEY) {
    throw new Error("API Key not found in environment variables.");
  }

  const ai = new GoogleGenAI({ apiKey: API_KEY });

  try {
    const imagePart = await fileToGenerativePart(imageFile);
    
    // We combine the user's specific editing instructions with the image
    const contents = {
      parts: [
        imagePart,
        { text: prompt }
      ]
    };

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image', // Using the recommended default image model
      contents: contents,
    });

    // Check for inline data (image) response
    const candidates = response.candidates;
    if (candidates && candidates.length > 0) {
      const parts = candidates[0].content.parts;
      
      // Iterate to find the image part
      for (const part of parts) {
        if (part.inlineData && part.inlineData.data) {
           const mimeType = part.inlineData.mimeType || 'image/png';
           const url = `data:${mimeType};base64,${part.inlineData.data}`;
           return { url, mimeType };
        }
      }
    }

    throw new Error("No image generated. The model might have returned text instead.");

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};
