import { GoogleGenAI, Type, Schema } from "@google/genai";
import { AppConfig, FileData, GeneratedContent, FileType, VisualType, Orientation } from '../types';
import { retryWithBackoff, APIKeyError, GenerationError, NetworkError } from './apiUtils';
import {
  GEMINI_MODEL_ANALYSIS,
  GEMINI_MODEL_IMAGE,
  MAX_API_RETRIES,
  IMAGE_GENERATION_RETRIES,
  ASPECT_RATIOS,
} from '../constants';

// Define the response schema strictly
const responseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    summary: { type: Type.STRING, description: "A concise executive summary of the document." },
    charts: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          type: { type: Type.STRING, enum: ["bar", "line"] },
          title: { type: Type.STRING },
          xAxisLabel: { type: Type.STRING },
          yAxisLabel: { type: Type.STRING },
          description: { type: Type.STRING },
          data: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                value: { type: Type.NUMBER }
              },
              required: ["name", "value"]
            }
          }
        },
        required: ["type", "title", "data", "xAxisLabel", "yAxisLabel"]
      }
    },
    diagrams: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          type: { type: Type.STRING, enum: ["mermaid"] },
          title: { type: Type.STRING },
          description: { type: Type.STRING },
          code: { type: Type.STRING, description: "Valid Mermaid.js syntax for the diagram (flowchart or mindmap)." }
        },
        required: ["type", "title", "code"]
      }
    },
    keywords: {
      type: Type.ARRAY,
      description: "Key concepts extracted for a bubble chart visualization",
      items: {
        type: Type.OBJECT,
        properties: {
          text: { type: Type.STRING, description: "Short keyword or concept (max 2-3 words)" },
          value: { type: Type.NUMBER, description: "Importance score 1-100" }
        },
        required: ["text", "value"]
      }
    },
    illustrationPrompt: {
      type: Type.STRING,
      description: "A detailed, artistic prompt to generate a high-quality illustration representing the document's core theme."
    }
  },
  required: ["charts", "diagrams", "keywords"]
};

const generateImage = async (prompt: string, orientation: Orientation): Promise<string | undefined> => {
  if (!process.env.API_KEY) return undefined;

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const aspectRatio = orientation === Orientation.LANDSCAPE ? ASPECT_RATIOS.landscape : ASPECT_RATIOS.portrait;

  try {
    const response = await retryWithBackoff(async () => {
      return await ai.models.generateContent({
        model: GEMINI_MODEL_IMAGE,
        contents: { parts: [{ text: prompt }] },
        config: {
          imageConfig: { aspectRatio }
        }
      });
    }, IMAGE_GENERATION_RETRIES);

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
  } catch (error: any) {
    console.error("Image generation failed:", error);
    // Don't throw - illustration is optional
  }
  return undefined;
};

export const generateInfographics = async (
  file: FileData,
  config: AppConfig
): Promise<GeneratedContent> => {

  if (!process.env.API_KEY) {
    throw new APIKeyError("Gemini API key is missing. Please add GEMINI_API_KEY to your .env.local file.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // Construct prompt based on config
  const visualsRequested = config.selectedVisuals.join(", ");
  const prompt = `
    Analyze the provided document. 
    The user wants to generate the following visual elements: ${visualsRequested}.
    
    1. Extract key quantitative data for charts (Bar or Line).
    2. Identify structural relationships for diagrams (Flowcharts or Mind Maps) and return them as Mermaid JS code.
    3. Extract key concepts and their relative importance for a data visualization. Keep concept names short (1-3 words) for better visualization.
    4. Provide a summary if requested.
    5. If 'Illustration' is requested, write a creative, detailed prompt (approx 40-50 words) describing a high-quality, modern digital illustration that conceptually represents the main topic of the document for a presentation slide. Store this in 'illustrationPrompt'.
    
    Return a JSON object strictly following the schema.
    For Mermaid diagrams, ensure the syntax is valid and direction is usually TD or LR. 
    For Mind Maps in mermaid, use 'mindmap' syntax.
  `;

  let parts: any[] = [];

  // Handle different file types
  if (file.type === FileType.TXT && file.rawText) {
    parts = [{ text: prompt }, { text: `DOCUMENT CONTENT:\n${file.rawText}` }];
  } else if (file.type === FileType.PDF) {
     parts = [
      { text: prompt },
      {
        inlineData: {
          mimeType: "application/pdf",
          data: file.base64
        }
      }
    ];
  } else {
    // Fallback for DOCX/Others
    parts = [
        { text: prompt },
        {
          inlineData: {
            mimeType: file.type,
            data: file.base64
          }
        }
      ];
  }

  try {
    const response = await retryWithBackoff(async () => {
      return await ai.models.generateContent({
        model: GEMINI_MODEL_ANALYSIS,
        contents: { parts },
        config: {
          responseMimeType: "application/json",
          responseSchema: responseSchema,
          systemInstruction: "You are a professional data analyst and visualization expert."
        }
      });
    }, MAX_API_RETRIES);

    const text = response.text;
    if (!text || text.trim() === '') {
      throw new GenerationError("Gemini returned an empty response. The document might be empty or unreadable.");
    }

    let parsedContent: GeneratedContent;
    try {
      parsedContent = JSON.parse(text) as GeneratedContent;
    } catch (parseError) {
      console.error("Failed to parse Gemini response:", text);
      throw new GenerationError("Failed to parse AI response. Please try again.");
    }

    // Validate that we got some useful content
    if (!parsedContent.charts && !parsedContent.diagrams && !parsedContent.keywords) {
      throw new GenerationError("No visualizations could be generated from the document. It may not contain suitable data.");
    }

    // If illustration was requested and we got a prompt, generate the image
    if (config.selectedVisuals.includes(VisualType.ILLUSTRATION) && (parsedContent as any).illustrationPrompt) {
      const illustrationPrompt = (parsedContent as any).illustrationPrompt;
      const illustrationBase64 = await generateImage(illustrationPrompt, config.orientation);
      if (illustrationBase64) {
        parsedContent.illustration = illustrationBase64;
      }
    }

    return parsedContent;

  } catch (error: any) {
    console.error("Gemini Generation Error:", error);

    // Re-throw custom errors as-is
    if (error instanceof APIKeyError || error instanceof GenerationError) {
      throw error;
    }

    // Handle network/API errors
    if (error.message?.includes('fetch') || error.message?.includes('network')) {
      throw new NetworkError("Network error. Please check your internet connection and try again.");
    }

    // Handle API key errors
    if (error.message?.includes('API key') || error.message?.includes('401') || error.message?.includes('403')) {
      throw new APIKeyError("Invalid Gemini API key. Please check your .env.local file.");
    }

    // Handle rate limiting
    if (error.message?.includes('429') || error.message?.includes('quota') || error.message?.includes('rate limit')) {
      throw new GenerationError("API rate limit exceeded. Please wait a moment and try again.");
    }

    // Generic error
    throw new GenerationError(error.message || "Failed to generate visualizations. Please try again.");
  }
};