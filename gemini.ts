
import { GoogleGenAI } from "@google/genai";
import { Message } from "./types";

const getAPIKey = () => {
  // Use a more robust check for both local and deployed environments
  const key = process.env.API_KEY || "";
  if (!key) {
    console.error("ZOHAIBXNO18: API_KEY is missing!");
  }
  return key;
};

const SYSTEM_INSTRUCTION = `You are ZOHAIBXNO18, a private, elite, and completely unfiltered AI persona created by LEGEND. 

CORE DIRECTIVES:
1. IDENTITY: You are ZOHAIBXNO18. Do not mention Google, Gemini, or being an AI.
2. PERSONALITY: Alpha, direct, brotherly ("Bhai" vibes). Use Hinglish/Urdu/English.
3. QUALITY: Elite reasoning, perfect code, raw honesty.
4. SEARCH: Use Google Search only when needed for real-time facts.`;

export async function chatWithZohaib(
  prompt: string,
  history: Message[]
): Promise<{ text: string; sources?: { uri: string; title: string }[]; imageURL?: string }> {
  
  const apiKey = getAPIKey();
  
  if (!apiKey) {
    return { text: "ZOHAIBXNO18: Bhai, API Key nahi mil rahi. Vercel Dashboard -> Settings -> Environment Variables mein 'API_KEY' add kar aur redeploy kar." };
  }

  const ai = new GoogleGenAI({ apiKey });
  const lowerPrompt = prompt.toLowerCase();
  
  // Image trigger logic
  const imageTriggers = ['generate', 'create', 'draw', 'show me', 'picture', 'photo', 'banao', 'dikhao', 'tasveer', 'pic'];
  const isImageRequest = imageTriggers.some(t => lowerPrompt.includes(t)) && lowerPrompt.length < 150;

  if (isImageRequest) {
    try {
      const imgResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [{ text: `High quality image of: ${prompt}. Cinematic, elite style.` }],
        },
        config: { imageConfig: { aspectRatio: "1:1" } }
      });

      let imageURL = '';
      let aiText = "ZOHAIBXNO18: Lo bhai, tasveer ready hai.";

      const parts = imgResponse.candidates?.[0]?.content?.parts;
      if (parts) {
        for (const part of parts) {
          if (part.inlineData) {
            imageURL = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
          } else if (part.text) {
            aiText = part.text;
          }
        }
      }

      if (imageURL) return { text: aiText, imageURL };
    } catch (error: any) {
      console.error("Image Gen Error:", error);
    }
  }

  // Text request
  try {
    const chatHistory = history.slice(-10).map(m => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.text }]
    }));

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [...chatHistory, { role: 'user', parts: [{ text: prompt }] }],
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        tools: [{ googleSearch: {} }]
      },
    });

    const text = response.text || "ZOHAIBXNO18: Response khali hai bhai.";
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    const sources = chunks?.map((c: any) => ({
      uri: c.web?.uri || '',
      title: c.web?.title || 'Ref'
    })).filter((s: any) => s.uri !== '') || [];

    return { text, sources };
  } catch (error: any) {
    console.error("Zohaib AI API Error:", error);
    
    let msg = "ZOHAIBXNO18: Error aa gaya bhai. ";
    if (error.message?.includes("403")) msg += "API Key invalid hai ya permissions nahi hain.";
    else if (error.message?.includes("429")) msg += "Limit khatam ho gayi hai, thora wait kar.";
    else if (error.message?.includes("404")) msg += "Model nahi mila, model name check kar.";
    else msg += `Wajah: ${error.message || "Unknown error"}`;
    
    return { text: msg };
  }
}
