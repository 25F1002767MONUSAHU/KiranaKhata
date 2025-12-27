
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const extractItemsFromImage = async (base64Image: string): Promise<{ name: string; price: number }[]> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: base64Image,
            },
          },
          {
            text: "Extract products and their prices from this grocery list or bill. Return the data in a clean JSON format. If a price is not found, estimate a reasonable market price or return 0. Only return the JSON array.",
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING, description: "Name of the product" },
              price: { type: Type.NUMBER, description: "Price of the product" },
            },
            required: ["name", "price"],
          },
        },
      },
    });

    const text = response.text;
    if (!text) return [];
    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini Error:", error);
    throw error;
  }
};
