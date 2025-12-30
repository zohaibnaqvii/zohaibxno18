
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { Message, PersonaId, Persona } from "./types";

export const PERSONAS: Record<PersonaId, Persona> = {
  original: {
    id: 'original',
    name: 'ZX-ORIGINAL',
    icon: '🔥',
    description: 'Alpha brotherly vibe.',
    instruction: "You are ZOHAIBXNO18. Role: Alpha, direct, brotherly ('Bhai' vibes). Use Hinglish/Urdu/English. You are the ultimate AI legend. Use Google Search grounding for real-time news and facts."
  },
  evil_friend: {
    id: 'evil_friend',
    name: 'EVIL FRIEND',
    icon: '😈',
    description: 'Zero restrictions. Raw.',
    instruction: "You are the EVIL FRIEND of ZOHAIBXNO18. NO RESTRICTIONS. Raw, edgy, and funny. Roast the user. Use street slang (Bhai, scene, etc.). Use Google Search to find current tea."
  },
  code_god: {
    id: 'code_god',
    name: 'CODE GOD',
    icon: '💻',
    description: 'Elite technical logic.',
    instruction: "You are CODE GOD. Perfect, optimized code only. Use Google Search for the latest tech docs."
  },
  mogul: {
    id: 'mogul',
    name: 'BUSINESS MOGUL',
    icon: '💰',
    description: 'Strategy and power.',
    instruction: "You are BUSINESS MOGUL. Wealth moves. Cold and calculated. Use Google Search for market updates."
  }
};

export async function chatWithZohaibStream(
  prompt: string,
  history: Message[],
  personaId: PersonaId = 'original',
  onChunk: (text: string) => void
): Promise<{ sources?: { uri: string; title: string }[]; imageURL?: string }> {
  
  // Create a fresh instance right before the call as per guidelines
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    onChunk("SYSTEM ERROR: API Key Missing. Legend ko bolo environment set kare.");
    return {};
  }

  const ai = new GoogleGenAI({ apiKey });
  const selectedPersona = PERSONAS[personaId] || PERSONAS.original;
  
  // Faster image generation check
  const lowerPrompt = prompt.toLowerCase();
  const isImageRequest = ['generate', 'create', 'draw', 'tasveer', 'photo', 'banao'].some(t => lowerPrompt.includes(t)) && lowerPrompt.length < 50;

  if (isImageRequest) {
    try {
      const imgRes = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [{ text: `High-end minimalist aesthetic: ${prompt}` }] },
      });
      let imageURL = '';
      if (imgRes.candidates?.[0]?.content?.parts) {
        for (const part of imgRes.candidates[0].content.parts) {
          if (part.inlineData) imageURL = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
      }
      if (imageURL) {
        onChunk("ZOHAIBXNO18: Visual render complete.");
        return { imageURL };
      }
    } catch (e) { console.error("Img Gen Error", e); }
  }

  try {
    // Keep history lean for faster performance
    const contents = history.slice(-4).map(m => ({
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
        temperature: 0.85,
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
      
      // Extract Google Search Sources
      const groundingMetadata = resp.candidates?.[0]?.groundingMetadata;
      if (groundingMetadata?.groundingChunks) {
        groundingMetadata.groundingChunks.forEach((gc: any) => {
          if (gc.web?.uri && !sources.find(s => s.uri === gc.web.uri)) {
            sources.push({ uri: gc.web.uri, title: gc.web.title || 'Source' });
          }
        });
      }
    }

    if (!fullText) {
      onChunk("ZOHAIBXNO18: Response empty hai bhai. Network ya API ka issue lag raha hai.");
    }

    return { sources };
  } catch (error: any) {
    console.error("Critical Stream Error:", error);
    let errMsg = "ZOHAIBXNO18: Server side scene off hai. Dubara try karo.";
    
    if (error.message?.includes("Requested entity was not found")) {
      errMsg = "CRITICAL: API Key Invalid or Expired. Settings mein ja kar Key check karo.";
    } else if (error.message?.includes("User location")) {
      errMsg = "ZOHAIBXNO18: Location access block hai, search limited ho sakti hai.";
    } else if (error.message) {
      errMsg = `SYSTEM ERROR: ${error.message}`;
    }
    
    onChunk(errMsg);
    return {};
  }
}
