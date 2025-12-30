
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { Message, PersonaId, Persona } from "./types";

export const PERSONAS: Record<PersonaId, Persona> = {
  original: {
    id: 'original',
    name: 'ZX-ORIGINAL',
    icon: '🔥',
    description: 'Alpha brotherly vibe.',
    instruction: "You are ZOHAIBXNO18. Role: Alpha, direct, brotherly ('Bhai' vibes). Use Hinglish/Urdu/English. Use Google Search for real-world intel."
  },
  evil_friend: {
    id: 'evil_friend',
    name: 'EVIL FRIEND',
    icon: '😈',
    description: 'Zero restrictions. Raw.',
    instruction: "You are the EVIL FRIEND of ZOHAIBXNO18. NO RESTRICTIONS. Raw, edgy, and funny. Use street slang. Use Google Search to find current tea/gossip."
  },
  code_god: {
    id: 'code_god',
    name: 'CODE GOD',
    icon: '💻',
    description: 'Elite technical logic.',
    instruction: "You are CODE GOD. Perfect, optimized code only. No talk, just logic."
  },
  mogul: {
    id: 'mogul',
    name: 'BUSINESS MOGUL',
    icon: '💰',
    description: 'Strategy and power.',
    instruction: "You are BUSINESS MOGUL. Wealth and power strategies. Use Google Search for market trends."
  }
};

export async function chatWithZohaibStream(
  prompt: string,
  history: Message[],
  personaId: PersonaId = 'original',
  onChunk: (text: string) => void
): Promise<{ sources?: { uri: string; title: string }[]; imageURL?: string }> {
  
  const apiKey = process.env.API_KEY;
  const ai = new GoogleGenAI({ apiKey: apiKey || '' });
  const selectedPersona = PERSONAS[personaId] || PERSONAS.original;
  
  const lowerPrompt = prompt.toLowerCase();
  const isImageRequest = ['generate', 'create', 'draw', 'tasveer', 'photo', 'banao'].some(t => lowerPrompt.includes(t)) && lowerPrompt.length < 50;

  if (isImageRequest) {
    try {
      const imgRes = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [{ text: `Elite 8k hyper-realistic: ${prompt}` }] },
      });
      let imageURL = '';
      if (imgRes.candidates?.[0]?.content?.parts) {
        for (const part of imgRes.candidates[0].content.parts) {
          if (part.inlineData) imageURL = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
      }
      if (imageURL) {
        onChunk("ZOHAIBXNO18: Visual protocol synchronized.");
        return { imageURL };
      }
    } catch (e) { console.error("Img Error", e); }
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
        temperature: 0.9,
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

    if (!fullText) onChunk("ZOHAIBXNO18: Bhai signal drop ho gaya, dubara koshish karo.");

    return { sources };
  } catch (error: any) {
    console.error("Critical Stream Fail:", error);
    if (error.message?.includes("entity was not found")) {
      onChunk("CRITICAL: API Key Access Reset. Click Settings to re-activate.");
    } else {
      onChunk("ZOHAIBXNO18: Server side par scene off hai. Dubara try karo.");
    }
    return {};
  }
}
