
import { GoogleGenAI, Type } from "@google/genai";
import { Feedback } from "../types";

// 단계별 주제 리스트
const TOPICS = [
  "Cute Cat", "Simple Flower", "Apple and Fruit", "Rocket Ship", 
  "Magical Turtle", "Ancient Tree", "Underwater Coral Reef", 
  "Majestic Dragon", "Cyberpunk Cityscape", "Intricate Mandala Forest"
];

export const generateChallengeImage = async (level: number): Promise<{ url: string, name: string }> => {
  // Always use { apiKey: process.env.API_KEY }
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const topic = TOPICS[level - 1] || "Mystery Character";
  // 단계가 높을수록 선이 얇아지고 구역이 많아짐
  const complexity = level <= 3 ? "very simple, large open areas, bold thick outlines" :
                     level <= 7 ? "detailed coloring book style, medium thickness lines" :
                     "extremely intricate, thin lines, many tiny sections, professional art";

  const prompt = `Black and white line art for coloring: A ${topic}. ${complexity}. Only pure black lines on pure white background, no grayscale, no shading, no background textures.`;

  try {
    // Updated to use correct model name and generateContent pattern
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: prompt }],
      },
      config: {
        imageConfig: {
          aspectRatio: "1:1"
        }
      }
    });

    // Correctly iterating through response parts as per guidelines
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return { 
          url: `data:image/png;base64,${part.inlineData.data}`,
          name: topic
        };
      }
    }
    throw new Error("No image data");
  } catch (error) {
    console.error("Image Generation Error:", error);
    return { 
      url: `https://placehold.co/600x600?text=Level+${level}+Image+Error`,
      name: topic
    };
  }
};

export const evaluateDrawing = async (
  base64Image: string,
  level: number,
  topic: string
): Promise<Feedback> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `
    I am playing an "AI Coloring Game". This is Level ${level} out of 10.
    The topic is "${topic}".
    
    Evaluation strictness should scale with level ${level}:
    - Levels 1-3: Be very generous. Just check if any color is applied.
    - Levels 4-7: Check if colors are appropriate for ${topic} and mostly inside the lines.
    - Levels 8-10: Be very strict. Evaluate artistic harmony, small detail coverage, and neatness.
    
    Return a score (0-100), a warm encouraging feedback message in Korean, and a boolean isCorrect.
  `;

  try {
    // Fixed model to gemini-3-flash-preview and ensured correct property access (.text)
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          { text: prompt },
          {
            inlineData: {
              mimeType: "image/png",
              data: base64Image.split(',')[1]
            }
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.NUMBER },
            message: { type: Type.STRING },
            isCorrect: { type: Type.BOOLEAN }
          },
          required: ["score", "message", "isCorrect"]
        }
      }
    });

    const result = JSON.parse(response.text || "{}");
    return {
      score: result.score || 0,
      message: result.message || "작품을 잘 확인했습니다!",
      isCorrect: result.isCorrect || false
    };
  } catch (error) {
    console.error("Gemini API Error:", error);
    return {
      score: 0,
      message: "AI 평가 중 오류가 발생했습니다.",
      isCorrect: false
    };
  }
};
