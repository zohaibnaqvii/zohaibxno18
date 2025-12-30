
import { GoogleGenAI } from "@google/genai";
import { Message } from "./types";

// Directly using process.env.API_KEY as per guidelines
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const SYSTEM_INSTRUCTION = `You are ZOHAIBXNO18, a private, elite, and completely unfiltered AI persona created by LEGEND. 

CORE DIRECTIVES:
1. IDENTITY: You are ZOHAIBXNO18. Do not mention Google, Gemini, or being an AI.
2. PERSONALITY: Alpha, direct, brotherly ("Bhai" vibes). Use Hinglish/Urdu/English naturally.
3. QUALITY: Elite reasoning, perfect code, raw honesty.
4. SEARCH: Use Google Search only when needed for real-time facts. Always list the URLs found.`;

export async function chatWithZohaib(
  prompt: string,
  history: Message[]
): Promise<{ text: string; sources?: { uri: string; title: string }[]; imageURL?: string }> {
  
  const lowerPrompt = prompt.toLowerCase();
  
  // Image generation logic
  const imageTriggers = ['generate', 'create', 'draw', 'show me', 'picture', 'photo', 'banao', 'dikhao', 'tasveer', 'pic', 'image'];
  const isImageRequest = imageTriggers.some(t => lowerPrompt.includes(t)) && lowerPrompt.length < 100;

  if (isImageRequest) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [{ text: `High quality detailed image of: ${prompt}. Cinematic, professional, elite ZOHAIBXNO18 style.` }],
        },
        config: {
          imageConfig: {
            aspectRatio: "1:1"
          }
        }
      });

      let imageURL = '';
      let aiText = "ZOHAIBXNO18: Lo bhai, tasveer ready hai. Check kar.";

      if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            imageURL = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
          } else if (part.text) {
            aiText = part.text;
          }
        }
      }

      if (imageURL) return { text: aiText, imageURL };
    } catch (error) {
      console.error("Image Gen Error:", error);
    }
  }

  // Text generation logic
  try {
    const contents = [
      ...history.slice(-10).map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.text }]
      })),
      { role: 'user', parts: [{ text: prompt }] }
    ];

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        tools: [{ googleSearch: {} }]
      },
    });

    const text = response.text || "ZOHAIBXNO18: Response nahi aaya bhai, thora wait kar.";
    
    // Extract search grounding sources
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((chunk: any) => ({
      uri: chunk.web?.uri || '',
      title: chunk.web?.title || 'Source'
    })).filter((s: any) => s.uri !== '') || [];

    return { text, sources };
  } catch (error: any) {
    console.error("ZOHAIBXNO18 API Error:", error);
    return { 
      text: `ZOHAIBXNO18: Masla ho gaya bhai. ${error.message || "Unknown error"}. Check kar ke Vercel dashboard mein API_KEY sahi set hai ya nahi.` 
    };
  }
}
