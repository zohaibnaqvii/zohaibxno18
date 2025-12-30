
import { GoogleGenAI } from "@google/genai";
import { Message } from "./types";

const getAPIKey = () => {
  // Try multiple ways to find the API key
  const key = process.env.API_KEY;
  if (!key || key === "") {
    console.warn("ZOHAIBXNO18: API_KEY is missing in environment variables!");
  }
  return key || "";
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
    return { text: "ZOHAIBXNO18: Bhai, API Key missing hai. Vercel dashboard mein environment variable 'API_KEY' set kar." };
  }

  const ai = new GoogleGenAI({ apiKey });
  const lowerPrompt = prompt.toLowerCase();
  
  // Detection for image requests
  const imageTriggers = ['generate', 'create', 'draw', 'show me', 'picture', 'photo', 'banao', 'dikhao', 'tasveer', 'pic'];
  const isImageRequest = imageTriggers.some(t => lowerPrompt.includes(t)) && lowerPrompt.length < 150;

  if (isImageRequest) {
    try {
      const imgResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [{ text: `High quality image of: ${prompt}. Cinematic, professional, elite style.` }],
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
    } catch (error) {
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

    const text = response.text || "ZOHAIBXNO18: Bhai, model ne response nahi diya. Dobara try kar.";
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    const sources = chunks?.map((c: any) => ({
      uri: c.web?.uri || '',
      title: c.web?.title || 'Reference'
    })).filter((s: any) => s.uri !== '') || [];

    return { text, sources };
  } catch (error: any) {
    console.error("Zohaib AI Error:", error);
    let errorMessage = "ZOHAIBXNO18: Server down lag raha hai ya API key ka masla hai.";
    if (error.message?.includes("403")) errorMessage = "ZOHAIBXNO18: API Key invalid hai ya permissions ka masla hai bhai.";
    if (error.message?.includes("429")) errorMessage = "ZOHAIBXNO18: Bohot zyada messages bhej diye, thora ruk ja bhai.";
    
    return { text: errorMessage };
  }
}
