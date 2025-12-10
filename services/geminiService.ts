
import { GoogleGenAI, Type } from "@google/genai";
import { ChatMessage, Sentiment } from "../types";

const getAIClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API Key not found");
  return new GoogleGenAI({ apiKey });
};

// 1. Chatbot Logic
export const getChatResponse = async (history: ChatMessage[], newMessage: string, audioBase64?: string): Promise<string> => {
  try {
    const ai = getAIClient();
    
    const systemInstruction = `
      You are the official AI Assistant for Areyeng, the Bus Rapid Transit (BRT) system in Tshwane.
      
      RULES:
      1. You may ONLY answer questions related to Areyeng buses, schedules, routes (T1, T2, T3), ticket prices, stations, and delays.
      2. If the user asks about ANYTHING else, politely decline.
      3. Be helpful, concise, and professional.
      4. If the user provides AUDIO input, your response MUST start with a transcription of what they said in brackets, like this: "[User asked: ...question...] Sure, here is the answer..."
      5. Current time: ${new Date().toLocaleTimeString()}.
    `;

    // If audio is present, we need to structure the contents differently
    let contents: any;

    if (audioBase64) {
      // Multimodal input: Text history + New Audio
      // We'll summarize history as text context, and append audio
      const chatHistoryText = history.map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.text}`).join('\n');
      
      contents = {
        role: 'user',
        parts: [
          { text: `Here is the previous conversation for context:\n${chatHistoryText}\n\nPlease listen to the following audio query from the User, transcribe it in brackets [User said: ...], and then answer it:` },
          {
            inlineData: {
              mimeType: "audio/wav",
              data: audioBase64
            }
          }
        ]
      };
    } else {
      // Text only input
      const chatHistoryText = history.map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.text}`).join('\n');
      contents = `${chatHistoryText}\nUser: ${newMessage}\nAssistant:`;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
      }
    });

    return response.text || "I am currently unable to process your request.";
  } catch (error) {
    console.error("Gemini Chat Error:", error);
    return "I'm having trouble connecting to the Areyeng network right now. Please try again.";
  }
};

// 2. Sentiment Analysis Logic
export const analyzeReviewSentiment = async (reviewText: string): Promise<{ sentiment: Sentiment; score: number }> => {
  try {
    const ai = getAIClient();
    
    // Explicitly listing values to match TS Enum: 'Positive', 'Negative', 'Neutral'
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Analyze the sentiment of this bus service review: "${reviewText}"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            sentiment: { type: Type.STRING, enum: ['Positive', 'Negative', 'Neutral'] },
            score: { type: Type.NUMBER, description: "A score between 0 and 1, where 1 is very positive." }
          },
          required: ["sentiment", "score"]
        }
      }
    });

    let text = response.text;
    if (text) {
        // Robust cleaning of markdown code blocks if the model includes them
        if (text.startsWith('```json')) {
            text = text.replace(/^```json\s*/, '').replace(/\s*```$/, '');
        } else if (text.startsWith('```')) {
            text = text.replace(/^```\s*/, '').replace(/\s*```$/, '');
        }
        
        try {
            return JSON.parse(text);
        } catch (e) {
            console.error("Failed to parse sentiment JSON:", text);
        }
    }
    throw new Error("No valid response text");
  } catch (error) {
    console.error("Sentiment Analysis Error:", error);
    return { sentiment: Sentiment.NEUTRAL, score: 0.5 }; // Fallback
  }
};

// 3. Delay Prediction Logic
export const predictDelay = async (routeName: string, currentStatus: string): Promise<string> => {
  try {
    const ai = getAIClient();
    const prompt = `
      The bus on route ${routeName} is currently marked as ${currentStatus}.
      Based on typical urban traffic patterns in a busy city, generate a realistic, short (1 sentence) prediction/reason for the status.
      Examples: "Heavy traffic on Nana Sita Street.", "Signal failure at Hatfield.", "Running smoothly on schedule."
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        maxOutputTokens: 50,
        temperature: 0.7
      }
    });

    return response.text || "Status updated.";
  } catch (error) {
    return "Traffic data unavailable.";
  }
};
