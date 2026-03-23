import { GoogleGenAI, Type, Modality } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export async function generateInitialMessage(address: string) {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `You are a helpful Real Estate Assistant for Agent Sarah. A lead just requested a valuation for ${address}. 
    Create a friendly, professional text message (max 160 chars) asking if they've done any recent renovations like a new kitchen or roof. 
    Be brief and end with a question.`,
  });
  return response.text;
}

export async function analyzeLeadIntent(transcript: string) {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Analyze the following real estate lead conversation transcript and extract lead intent, budget, and timeline.
    
    Transcript:
    ${transcript}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          budget: {
            type: Type.STRING,
            description: "The budget mentioned by the lead (e.g., '$500k', 'Not mentioned').",
          },
          timeline: {
            type: Type.STRING,
            description: "When the lead wants to move (e.g., '3 months', 'ASAP').",
          },
          intent: {
            type: Type.STRING,
            description: "The lead's primary goal (e.g., 'Selling home', 'Buying first home').",
          },
          leadType: {
            type: Type.STRING,
            description: "Buyer, Seller, or Both.",
            enum: ["buyer", "seller", "both"],
          },
          score: {
            type: Type.NUMBER,
            description: "Intent score from 0 to 100, where 100 is ready to list now.",
          },
          summary: {
            type: Type.STRING,
            description: "A brief 1-sentence summary of the lead's situation.",
          },
        },
        required: ["budget", "timeline", "intent", "leadType", "score", "summary"],
      },
    },
  });
  return JSON.parse(response.text);
}

/**
 * Uses Google Maps Grounding to get local real estate information.
 */
export async function getLocalRealEstateInsights(location: string, query: string) {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: `As a real estate expert, provide insights about ${query} in ${location}. Use Google Maps to find relevant local data.`,
    config: {
      tools: [{ googleMaps: {} }],
    },
  });
  
  return {
    text: response.text,
    groundingChunks: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
  };
}

/**
 * Uses Google Search Grounding for up-to-date market trends.
 */
export async function getMarketTrends(location: string) {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `What are the current real estate market trends in ${location} for March 2026? Include recent sales data and price movements.`,
    config: {
      tools: [{ googleSearch: {} }],
    },
  });
  
  return {
    text: response.text,
    groundingChunks: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
  };
}

/**
 * Generates property visualization images with specified aspect ratio.
 */
export async function generatePropertyVisualization(prompt: string, aspectRatio: "1:1" | "2:3" | "3:2" | "3:4" | "4:3" | "9:16" | "16:9" | "21:9") {
  const response = await ai.models.generateContent({
    model: 'gemini-3.1-flash-image-preview',
    contents: {
      parts: [{ text: prompt }],
    },
    config: {
      imageConfig: {
        aspectRatio: aspectRatio as any,
        imageSize: "1K"
      },
    },
  });

  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  throw new Error("No image generated");
}

/**
 * Uses URL Context to "crawl" and analyze a specific real estate listing URL.
 */
export async function analyzeListingUrl(url: string) {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Analyze this real estate listing: ${url}. 
    Extract the following details:
    1. Property highlights (renovations, unique features)
    2. Potential red flags or concerns
    3. Investment potential summary
    4. Comparison to general market trends`,
    config: {
      tools: [{ urlContext: {} }],
    },
  });
  
  return {
    text: response.text,
    groundingChunks: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
  };
}
