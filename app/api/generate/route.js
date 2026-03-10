import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { system, userMessage } = await request.json();

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      systemInstruction: system,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 4000,
        responseMimeType: "application/json",
      },
    });

    const result = await model.generateContent(userMessage);
    const text = result.response.text();

    return NextResponse.json({ text });
  } catch (error) {
    console.error("Gemini API error:", error);
    return NextResponse.json(
      { error: "Failed to generate explanation. " + error.message },
      { status: 500 }
    );
  }
}
