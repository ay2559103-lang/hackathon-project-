import { GoogleGenerativeAI } from "@google/generative-ai";

// Configure Gemini Client
// Key provided by user: AIzaSyC3LuiLhy2I9NuFjnTEBu_IgfkRMcE_0SQ
const genAI = new GoogleGenerativeAI("AIzaSyC3LuiLhy2I9NuFjnTEBu_IgfkRMcE_0SQ");

/**
 * AI Service for generating product content using Google Gemini
 */
export const generateProductContent = async (input) => {
  const { title, brand, category, shortNotes } = input;

  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = `
    Generate professional product details for a local ecommerce platform.
    Product Name: ${title}
    Brand: ${brand || 'Unknown'}
    Category: ${category || 'General'}
    Admin Notes: ${shortNotes || 'None'}

    Please provide:
    1. A premium, high-converting description (3-4 sentences)
    2. A short description (1 sentence)
    3. 5-7 relevant tags (comma separated)
    4. An SEO title (max 70 chars)
    5. An SEO meta description (max 160 chars)
    6. 5 key technical specifications.

    Format the response strictly as a JSON object with keys: 
    description, short_description, tags, seo_title, seo_description, specifications.
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Clean JSON if needed (sometimes Gemini adds ```json ... ```)
    const jsonStr = text.replace(/```json|```/g, "").trim();
    const data = JSON.parse(jsonStr);

    return {
      title: title,
      description: data.description,
      short_description: data.short_description,
      tags: data.tags,
      category_suggestion: category,
      specifications: data.specifications,
      seo_title: data.seo_title,
      seo_description: data.seo_description,
    };
  } catch (error) {
    console.error("Gemini Generation Error:", error);
    throw error;
  }
};

export const improveContent = async (content) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `Improve the following product content for clarity, SEO, and sales conversion. Keep it concise: ${content}`;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Gemini Improvement Error:", error);
    return content;
  }
};

/**
 * Custom AskBot function for the Chatbot
 */
export async function askBot(message) {
  try {
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      systemInstruction: "You are a helpful shopping assistant for LocalMarket, a local ecommerce platform. You help customers find products, explain platform features, and provide friendly support. Keep responses concise and professional."
    });

    const result = await model.generateContent(message);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Gemini AskBot Error:", error);
    return "I'm having trouble connecting to my brain right now. Please try again later.";
  }
}
