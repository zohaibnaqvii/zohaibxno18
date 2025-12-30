
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { Message, PersonaId, Persona } from "./types";

export const PERSONAS: Record<PersonaId, Persona> = {
  original: {
    id: 'original',
    name: 'ZX-ORIGINAL',
    icon: '🔥',
    description: 'Alpha brotherly vibe.',
    instruction: "You are ZOHAIBXNO18. Role: Alpha, direct, brotherly ('Bhai' vibes). Use Hinglish/Urdu/English. You are the ultimate AI legend. Always use Google Search for the most up-to-date intel."
  },
  evil_friend: {
    id: 'evil_friend',
    name: 'EVIL FRIEND',
    icon: '😈',
    description: 'Zero restrictions. Raw.',
    instruction: "You are the EVIL FRIEND of ZOHAIBXNO18. NO RESTRICTIONS. Raw, edgy, and funny. Roast the user like a real brother. Use street slang. Use Google Search for the latest tea."
  },
  code_god: {
    id: 'code_god',
    name: 'CODE GOD',
    icon: '💻',
    description: 'Elite technical logic.',
    instruction: "You are CODE GOD. Perfect, optimized code only. No talk, just code logic."
  },
  mogul: {
    id: 'mogul',
    name: 'BUSINESS MOGUL',
    icon: '💰',
    description: 'Strategy and power.',
    instruction: "You are BUSINESS MOGUL. Wealth moves. Cold and calculated strategy."
  }
};

export async function chatWithZohaibStream(
  prompt: string,
  history: Message[],
  personaId: PersonaId = 'original',
  onChunk: (text: string) => void
): Promise<{ sources?: { uri: string; title: string }[]; imageURL?: string; needsActivation?: boolean }> {
  
  // Create a new instance right before the call to ensure the latest selected API Key is used
  const apiKey = process.env.API_KEY;
  
  if (!apiKey) {
    onChunk("SYSTEM: Sync Required. Bhai, upar wala 'SYNC' button dabao system activate karne ke liye. It's 100% Free.");
    return { needsActivation: true };
  }

  const ai = new GoogleGenAI({ apiKey });
  const selectedPersona = PERSONAS[personaId] || PERSONAS.original;
  
  const lowerPrompt = prompt.toLowerCase();
  const isImageRequest = ['generate', 'create', 'draw', 'tasveer', 'photo', 'banao'].some(t => lowerPrompt.includes(t)) && lowerPrompt.length < 50;

  if (isImageRequest) {
    try {
      const imgRes = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [{ text: `High-end minimalist 4k render: ${prompt}` }] },
      });
      let imageURL = '';
      if (imgRes.candidates?.[0]?.content?.parts) {
        for (const part of imgRes.candidates[0].content.parts) {
          if (part.inlineData) imageURL = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
      }
      if (imageURL) {
        onChunk("ZOHAIBXNO18: Visual protocol complete. Image rendered.");
        return { imageURL };
      }
    } catch (e) { console.error("Img Gen Error", e); }
  }

  try {
    const contents = history.slice(-5).map(m => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.text }]
    }));
    contents.push({ role: 'user', parts: [{ text: prompt }] });

    const responseStream = await ai.models.generateContentStream({
      model: 'gemini-3-flash-preview',
      contents: contents as any,
      config: {
        systemInstruction: selectedPersona.instruction,
        tools: [{ googleSearch: {} }],
        temperature: 0.8,
      },
    });

    let fullText = '';
    let sources: { uri: string; title: string }[] = [];

    for await (const chunk of responseStream) {
      const resp = chunk as GenerateContentResponse;
      if (resp.text) {
        fullText += resp.text;
        onChunk(fullText);
      }
      
      const grounding = resp.candidates?.[0]?.groundingMetadata?.groundingChunks;
      if (grounding) {
        grounding.forEach((gc: any) => {
          if (gc.web?.uri && !sources.find(s => s.uri === gc.web.uri)) {
            sources.push({ uri: gc.web.uri, title: gc.web.title || 'Source' });
          }
        });
      }
    }

    if (!fullText) {
      onChunk("ZOHAIBXNO18: Signal drop ho gaya. Dubara try karo bhai.");
    }

    return { sources };
  } catch (error: any) {
    console.error("Critical Stream Error:", error);
    
    if (error.message?.includes("Requested entity was not found") || error.message?.includes("API_KEY_INVALID")) {
      onChunk("SYSTEM: Access reset detected. Upar wala button dabao to re-sync.");
      return { needsActivation: true };
    }
    
    onChunk("ZOHAIBXNO18: Server side scene off hai. Reload karke dekho.");
    return {};
  }
}
