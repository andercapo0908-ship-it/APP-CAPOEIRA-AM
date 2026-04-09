import { GoogleGenAI, ThinkingLevel, Modality } from "@google/genai";
import { AIChatMessage } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export const generateAppAdvice = async (prompt: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: prompt,
      config: {
        systemInstruction: "Você é um assistente especializado em gestão de grupos de Capoeira e design de aplicativos. Ajude o administrador a configurar o app Incendeia Capoeira. Responda de forma curta e motivadora.",
        thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH }
      },
    });
    return response.text || "Desculpe, não consegui processar sua solicitação agora.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Desculpe, não consegui processar sua solicitação agora.";
  }
};

export const aiChat = async (messages: AIChatMessage[], systemInstruction: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: messages.map(m => ({
        role: m.role,
        parts: [{ text: m.content }]
      })),
      config: {
        systemInstruction,
        tools: [{ googleMaps: {} }]
      }
    });

    return response.text || "Desculpe, tive um problema ao processar sua mensagem.";
  } catch (error) {
    console.error("AI Chat Error:", error);
    return "Desculpe, tive um problema ao processar sua mensagem.";
  }
};

export const textToSpeech = async (text: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `Diga com voz de mestre de capoeira: ${text}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Charon' }
          }
        }
      }
    });
    
    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) return null;
    
    const binary = atob(base64Audio);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const blob = new Blob([bytes], { type: 'audio/mpeg' });
    return URL.createObjectURL(blob);
  } catch (error) {
    console.error("TTS Error:", error);
    return null;
  }
};

export const analyzeGalleryContent = async (imageUrl: string) => {
  try {
    // Convert URL to base64 for Gemini
    const response = await fetch(imageUrl);
    const blob = await response.blob();
    const base64Data = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
      reader.readAsDataURL(blob);
    });

    const result = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite-preview",
      contents: {
        parts: [
          { text: "Descreva esta imagem de capoeira em uma frase curta e impactante para uma galeria." },
          { inlineData: { data: base64Data, mimeType: blob.type } }
        ]
      }
    });
    return result.text || "";
  } catch (error) {
    console.error("Analyze Error:", error);
    return "";
  }
};
