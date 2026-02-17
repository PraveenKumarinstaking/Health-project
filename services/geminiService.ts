
import { GoogleGenAI, Type, GenerateContentResponse, Modality } from "@google/genai";

// Initialize AI client using the API key directly from environment variables
const getAIClient = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const analyzeHealthQuery = async (
  query: string, 
  history: {role: 'user' | 'model', parts: {text: string}[]}[],
  base64Image?: string
) => {
  const ai = getAIClient();
  
  const parts: any[] = [{ text: query }];
  if (base64Image) {
    parts.push({
      inlineData: {
        mimeType: 'image/jpeg',
        data: base64Image
      }
    });
  }

  const response: GenerateContentResponse = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: [
      ...history,
      { role: 'user', parts: parts }
    ],
    config: {
      systemInstruction: `You are Healthcare AI, a professional medical health assistant. 
      Your goals are:
      1. Provide accurate information about medications, dosages, and interactions.
      2. Help users track their symptoms and health metrics.
      3. Encourage adherence to prescribed treatments.
      4. If an image is provided (e.g., a skin rash, a pill, or a symptom), analyze it professionally but cautiously.
      5. ALWAYS include a disclaimer that you are an AI and not a doctor.
      6. Recommend professional medical help for emergencies.
      Keep responses concise, empathetic, and formatted in Markdown.`
    }
  });
  
  return response.text;
};

export const analyzeHealthImage = async (base64Image: string, mode: 'medication' | 'symptom') => {
  const ai = getAIClient();
  
  const prompt = mode === 'medication' 
    ? "Identify this medication. Provide the name, standard dosage, and common uses in JSON format."
    : "Analyze this health issue or skin problem. Identify potential concerns, provide a professional summary, and suggest non-emergency next steps in JSON format.";

  const schema = mode === 'medication' 
    ? {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          dosage: { type: Type.STRING },
          usage: { type: Type.STRING },
          instructions: { type: Type.STRING }
        },
        required: ["name", "dosage", "usage"]
      }
    : {
        type: Type.OBJECT,
        properties: {
          condition: { type: Type.STRING, description: "Potential condition or symptom identified" },
          severity: { type: Type.STRING, description: "Estimated severity (Low/Medium/High)" },
          description: { type: Type.STRING, description: "Clinical-style description of what is seen" },
          nextSteps: { type: Type.STRING, description: "Suggested non-emergency next steps" }
        },
        required: ["condition", "severity", "description", "nextSteps"]
      };

  const response: GenerateContentResponse = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: {
      parts: [
        { inlineData: { mimeType: 'image/jpeg', data: base64Image } },
        { text: prompt }
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: schema as any
    }
  });
  
  return JSON.parse(response.text || '{}');
};

export const scanMedicationImage = async (base64Image: string) => {
  return analyzeHealthImage(base64Image, 'medication');
};

export const analyzePrescriptionImage = async (base64Image: string) => {
  const ai = getAIClient();
  const response: GenerateContentResponse = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: {
      parts: [
        { inlineData: { mimeType: 'image/jpeg', data: base64Image } },
        { text: "Extract all medications from this prescription. For each, find the name, dosage, frequency, and instructions. Return as a JSON array." }
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            dosage: { type: Type.STRING },
            frequency: { type: Type.STRING },
            instructions: { type: Type.STRING },
            suggestedTimes: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: "Suggested HH:mm times based on frequency" 
            }
          },
          required: ["name", "dosage", "frequency"]
        }
      }
    }
  });
  
  return JSON.parse(response.text || '[]');
};
