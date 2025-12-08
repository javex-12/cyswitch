
import { GoogleGenAI, Type } from "@google/genai";
import { TileType } from "../types";

// Safety wrapper to avoid crashes if env is missing
const getAI = () => {
  if (process.env.API_KEY) {
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
  }
  return null;
};

export const generateAILevel = async (promptDetails: string): Promise<number[][] | null> => {
  const ai = getAI();
  if (!ai) return null;

  try {
    const modelId = "gemini-2.5-flash";
    const prompt = `Create a 2D integer array representing a puzzle grid pattern (size 4x4 or 5x5). 
    Use integers 0 (empty), 1 (red), 2 (blue), 3 (green), 4 (yellow). 
    The pattern should loosely resemble: ${promptDetails}. 
    Ensure it is a valid JSON 2D array.`;

    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            grid: {
              type: Type.ARRAY,
              items: {
                type: Type.ARRAY,
                items: { type: Type.INTEGER }
              }
            }
          }
        }
      }
    });

    const text = response.text;
    if (!text) return null;
    const json = JSON.parse(text);
    return json.grid;

  } catch (error) {
    console.error("AI Level Gen Error:", error);
    return null;
  }
};