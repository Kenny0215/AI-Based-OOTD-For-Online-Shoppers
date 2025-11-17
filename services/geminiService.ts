import { GoogleGenAI, Type, Modality, Chat } from "@google/genai";
// FIX: Import RecommendationItem and ChatMessage types.
import type { RecommendationItem, ChatMessage, VirtualTryOnParams } from '../types';

if (!process.env.API_KEY) {
    // This check is important for development environments.
    // In the target environment, API_KEY is assumed to be set.
    console.warn("API_KEY environment variable is not set. Using a placeholder.");
}

// FIX: Initialize GoogleGenAI with a named apiKey object.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });

export const getGarmentDetails = async (preferences: { style: string; colors: string; occasion: string; }): Promise<RecommendationItem[]> => {
    const { style, colors, occasion } = preferences;
    const prompt = `
        **Primary Directive:** Generate a structured JSON for the **top 3** shirt recommendations based on user preferences. Diversity is the absolute priority.
        - Style: ${style}
        - Color Palette: ${colors}
        - Occasion: ${occasion}

        **Non-Negotiable Diversity Requirements:**
        Each of the three shirts returned MUST be significantly different from the others across every one of these five dimensions:
        1.  **Color:** (e.g., solid dark blue vs. vibrant orange vs. muted olive green).
        2.  **Style:** (e.g., classic polo vs. rugged flannel vs. modern short-sleeve button-up).
        3.  **Pattern:** (e.g., solid vs. plaid vs. floral).
        4.  **Collar Type:** (e.g., spread collar vs. button-down vs. band collar).
        5.  **Materials:** (e.g., cotton pique vs. brushed wool flannel vs. lightweight linen).
        There must be zero overlap in these core attributes.

        **Strict Prohibitions:**
        - **NO SIMILARITY:** Absolutely no shirts that look alike, are close in color shades, or are nearly identical. For example, a "light blue polo" and a "royal blue polo" are considered too similar and are forbidden.
        - **NO DUPLICATES:** Never output duplicate shirt styles or descriptions. Each of the three must be unique.

        For each of the three diverse shirts, provide:
        - itemName: A specific and appealing name.
        - styleCategory: The overall style category.
        - description: A concise, one-sentence description.

        The final output must be a valid JSON array of three objects.
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            itemName: {
                                type: Type.STRING,
                                description: 'The specific name of the fashion item.',
                            },
                            styleCategory: {
                                type: Type.STRING,
                                description: 'The category of style this item belongs to.',
                            },
                            description: {
                                type: Type.STRING,
                                description: 'A brief description of the item and styling tips.',
                            },
                        },
                        required: ["itemName", "styleCategory", "description"],
                    },
                },
            },
        });

        const jsonStr = response.text.trim();
        const result = JSON.parse(jsonStr);
        if (Array.isArray(result) && result.length > 0) {
            return result as RecommendationItem[];
        }
        throw new Error("The model did not return valid recommendations.");
    } catch (error) {
        console.error("Error getting garment details:", error);
        throw new Error("Could not get garment details. Please try again.");
    }
};

export const generateGarmentRecommendations = async (
    preferences: { style: string; colors: string; occasion: string; },
    aspectRatio: string = '1:1'
): Promise<string[]> => {
    const { style, colors, occasion } = preferences;
    const prompt = `
      **Core Task:** Generate 3 product-style images for a fashion app based on these preferences:
      - Style: ${style}
      - Colors: ${colors}
      - Occasion: ${occasion}

      **Strict Image Generation Rules:**
      1.  **One Shirt Per Image:** Each of the 3 images must feature **only one shirt**. NO multiple shirts in a single image.
      2.  **Maximum Diversity:** The three shirts depicted must be noticeably different in color, style, pattern, collar type, and materials. Do not generate similar-looking shirts.
      3.  **Centered & Clear:** The single shirt must be the clear focal point, perfectly centered in the frame.
      4.  **White Background:** The background MUST be a clean, professional, solid white.
      5.  **Flat Lay Style:** Present the shirt as a 'flat lay' photograph. No people, mannequins, hangers, or any other props are allowed.
      
      You must generate exactly three images that follow all of these rules without exception.
    `;
    
    try {
        const response = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: prompt,
            config: {
              numberOfImages: 3,
              outputMimeType: 'image/png',
              aspectRatio: aspectRatio,
            },
        });

        if (!response.generatedImages || response.generatedImages.length < 3) {
            throw new Error("The model did not return enough images.");
        }

        return response.generatedImages.map(img => img.image.imageBytes);

    } catch (error) {
        console.error("Error generating garment recommendations:", error);
        throw new Error("Could not generate garment recommendations. Please try again.");
    }
}

export const createFashionChat = (history: ChatMessage[] = []): Chat => {
    // FIX: Use ai.chats.create to start a new chat session, now with history.
    return ai.chats.create({
        model: 'gemini-2.5-flash',
        history,
        config: {
            systemInstruction: "You are a friendly and knowledgeable AI Fashion Stylist. Your goal is to help users with their fashion questions, provide styling tips, and help them discover new looks. Be encouraging, concise, and helpful. Your responses should be plain text. Do not use any markdown formatting, such as asterisks for bolding or lists.",
        },
    });
};

export const performVirtualTryOn = async ({ personImage, garmentImage, width, height }: VirtualTryOnParams): Promise<string> => {
    const personImagePart = {
        inlineData: {
            mimeType: 'image/jpeg', // Assuming jpeg, could be dynamic
            data: personImage,
        },
    };

    const garmentImagePart = {
        inlineData: {
            mimeType: 'image/png', // Assuming png for potential transparency, could be dynamic
            data: garmentImage,
        },
    };

    const textPart = {
        text: `**TOP PRIORITY & NON-NEGOTIABLE RULE: IMAGE DIMENSION INTEGRITY**
The final output image's dimensions MUST be EXACTLY ${width} pixels wide by ${height} pixels high. This matches the original input person photo (Image 1). The aspect ratio MUST be IDENTICAL. There can be no stretching, cropping, or resizing of the original scene. This is the most critical instruction.

**CORE MISSION: Physics-Based 3D Virtual Try-On Simulation**

You are an expert digital tailor operating an advanced physics-based rendering (PBR) engine. Your task is to simulate draping a garment onto a person in a 2D photograph as if it were a high-fidelity 3D model. The final output must be indistinguishable from a real photograph where the person is physically wearing the garment.

**INPUTS:**
-   **[Image 1]:** A photo of a person.
-   **[Image 2]:** A photo of an isolated garment.

**KEY DIRECTIVES FOR UNMATCHED REALISM (Simulating 3D):**

1.  **Advanced Fabric & Material Simulation:**
    *   **Physics-Based Properties:** Analyze the garment in Image 2 to infer its physical properties. Simulate its **weight** (e.g., heavy denim vs. light silk), **stiffness**, and **texture**.
    *   **PBR Lighting Interaction:** The garment's material must interact with the scene's lighting realistically. Simulate **specular highlights** for shiny materials (like satin or leather) and **diffuse reflection** for matte materials (like cotton).
    *   **Micro-Wrinkles & Stretching:** Create a high-fidelity displacement map based on the person's underlying body form. Generate realistic micro-wrinkles, fabric stretching, and compression that accurately reflect the material's properties and the pose.

2.  **Body Shape & Draping Mastery:**
    *   **Conform to Body & Pose:** The garment must perfectly conform to the person's unique body shape and pose. The simulation must calculate how the fabric would naturally hang, drape, and fold.
    *   **Ambient Occlusion & Shadowing:** This is critical for 3D illusion. Calculate and render soft, realistic **ambient occlusion** in the creases and folds of the fabric. Cast subtle shadows where the garment interacts with the body (e.g., under the collar, at the waist) to create a sense of depth and separation.

3.  **Seamless Integration & Flawless Coverage:**
    *   **TOTAL Clothing Replacement:** Your second highest priority is to *completely and totally replace* the original clothing. There should be ZERO traces of the original shirt, especially at the collar, cuffs, and hem. The new garment must be fully opaque.
    *   **Preserve Identity & Scene:** The person's face, hair, skin tone, body, limbs, and the entire original background must remain absolutely unchanged.
    *   **Consistent Lighting:** The lighting on the new garment must perfectly match the lighting of the original scene in Image 1.

**CRITICAL RULES TO FOLLOW (REITERATED):**
-   **ABSOLUTE DIMENSION MATCH:** The output must have the exact same dimensions as the input person photo: ${width}x${height} pixels. NO EXCEPTIONS.
-   **THINK LIKE A 3D RENDERER:** The final output must look like it was rendered from a professional cloth simulation, not edited in 2D.
-   **ABSOLUTELY NO TRACE of the original garment.** This is the second most important rule.
-   **DO NOT** alter the person or the background.
-   **DO NOT** create a flat, "pasted-on" look. The garment must have volume, depth, and realistic lighting.
-   **AVOID** any signs of digital editing. The final output must be a single, cohesive, photorealistic image.`
    };

    try {
        // FIX: Use ai.models.generateContent for image editing.
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: [personImagePart, garmentImagePart, textPart] },
            config: {
                responseModalities: [Modality.IMAGE],
            },
        });

        if (response.candidates && response.candidates[0]?.content?.parts[0]?.inlineData?.data) {
            return response.candidates[0].content.parts[0].inlineData.data;
        } else {
            throw new Error("The model did not return a valid image.");
        }
    } catch (error) {
        console.error("Error performing virtual try-on:", error);
        throw new Error("Could not perform the virtual try-on. Please check your images and try again.");
    }
};

export const getStyleComparison = async (originalImage: string, newImage: string): Promise<string> => {
    const originalImagePart = {
        inlineData: {
            mimeType: 'image/jpeg',
            data: originalImage,
        },
    };

    const newImagePart = {
        inlineData: {
            mimeType: 'image/png',
            data: newImage,
        },
    };

    const textPart = {
        text: `As an AI Fashion Stylist, look at these two images. The first is the "Before" photo, and the second is the "After" photo where the user has virtually tried on a new shirt. 
        
        Your task is to provide a single, concise, encouraging, and positive sentence comparing the two looks. Focus on how the new shirt enhances their style. For example: "The new shirt adds a vibrant pop of color and gives your outfit a fresh, modern look!"
        
        Keep the response to one sentence only. Do not use markdown.
        `
    };

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [textPart, originalImagePart, newImagePart] },
        });

        return response.text.trim();

    } catch (error) {
        console.error("Error getting style comparison:", error);
        // Return a generic positive message on error
        return "The new look really suits you! It's a great choice.";
    }
};