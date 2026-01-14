
import { GoogleGenAI, Type, Chat } from "@google/genai";
import { AnalysisResult } from "../types";

export class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  }

  async analyzeSkin(imageBase64: string, concerns: string[]): Promise<AnalysisResult> {
    const prompt = `
      Act as a professional dermatological AI assistant. Analyze the provided image of a person's face.
      User's reported concerns: ${concerns.join(', ')}.
      
      1. Identify the primary skin condition, assess its severity, and provide professional recommendations.
      2. DETECT specific locations of skin issues (acne, dark circles, redness, spots) on the face. Return them as bounding boxes.
      
      Be objective and clinical but supportive. 
      ALWAYS include a clear medical disclaimer that this is not a substitute for professional medical advice.
    `;

    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [
          {
            parts: [
              { text: prompt },
              {
                inlineData: {
                  mimeType: 'image/jpeg',
                  data: imageBase64.split(',')[1] || imageBase64,
                },
              },
            ],
          },
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              condition: { type: Type.STRING },
              confidence: { type: Type.NUMBER },
              description: { type: Type.STRING },
              severity: { type: Type.STRING, enum: ['Mild', 'Moderate', 'Severe'] },
              recommendations: { type: Type.ARRAY, items: { type: Type.STRING } },
              suggestedIngredients: { type: Type.ARRAY, items: { type: Type.STRING } },
              disclaimer: { type: Type.STRING },
              detections: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    label: { type: Type.STRING, description: "Label of the detected issue (e.g. 'Acne', 'Dark Circle')"},
                    box_2d: {
                      type: Type.ARRAY,
                      items: { type: Type.NUMBER },
                      description: "Bounding box [ymin, xmin, ymax, xmax] on a 1000x1000 scale."
                    }
                  }
                }
              }
            },
            required: ['condition', 'confidence', 'description', 'severity', 'recommendations', 'suggestedIngredients', 'disclaimer', 'detections'],
          },
        },
      });

      return JSON.parse(response.text || '{}') as AnalysisResult;
    } catch (error) {
      console.error("Analysis Error:", error);
      throw error;
    }
  }

  createChatSession(context: AnalysisResult): Chat {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
    return ai.chats.create({
      model: 'gemini-3-flash-preview',
      config: {
        systemInstruction: `You are a dermatology assistant. The user just received an analysis for ${context.condition} (Severity: ${context.severity}). 
        Description: ${context.description}.
        Your goal is to answer their follow-up questions about this specific condition, skincare ingredients, and routines. 
        Keep answers helpful, evidence-based, and always maintain a professional tone. 
        Reiterate the disclaimer if they ask for definitive medical diagnoses.`
      }
    });
  }
}

export const geminiService = new GeminiService();
