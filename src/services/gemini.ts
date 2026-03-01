import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function generateTattooIdea(imageBuffer: string, mimeType: string, description: string) {
  const model = "gemini-2.5-flash-image";
  
  const prompt = `
    I am providing a photo of a body part. Please add a tattoo to this body part based on the following description: "${description}".
    
    CRITICAL INSTRUCTIONS:
    1. The tattoo must be placed realistically on the skin shown in the photo.
    2. It must follow the natural contours, curves, and perspective of the body part.
    3. Include a subtle, realistic redness around the tattooed area to simulate a "freshly done" look.
    4. The tattoo should look like high-quality professional ink.
    5. Maintain the original lighting and skin texture of the photo.
    6. Return ONLY the edited image.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: {
        parts: [
          {
            inlineData: {
              data: imageBuffer,
              mimeType: mimeType,
            },
          },
          {
            text: prompt,
          },
        ],
      },
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    throw new Error("No image data returned from Gemini");
  } catch (error) {
    console.error("Error generating tattoo:", error);
    throw error;
  }
}
