// src/services/aiService.ts
import openai from "../config/openaiClient.mts";

export type ParsedRfp = {
  title: string;
  budget?: number | null;
  deliveryTimelineDays?: number | null;
  paymentTerms?: string | null;
  warrantyMonths?: number | null;
};

export async function parseRfpFromText(
  description: string
): Promise<ParsedRfp> {
  const systemPrompt = `
You are an assistant helping a procurement manager turn free-form RFP descriptions into structured data.
Extract the key details and return ONLY a JSON object with this exact shape:

{
  "title": string,               // short human-readable title for the RFP
  "budget": number | null,       // total budget in the user's currency, or null if not specified
  "deliveryTimelineDays": number | null, // delivery timeline in days, or null
  "paymentTerms": string | null, // e.g. "net 30"
  "warrantyMonths": number | null // warranty period in months, or null
}

- Infer reasonable numbers where clearly implied (e.g. "delivery within 30 days" -> 30).
- If something is not mentioned, use null for that field.
- DO NOT wrap the JSON in backticks.
- DO NOT include any explanation, only output the JSON object.
`.trim();

  const userPrompt = `
RFP description:
${description}
`.trim();

  const completion = await openai.chat.completions.create({
    model: "gpt-4.1-mini", // or "gpt-4o-mini" etc., depending on what you have
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ],
    temperature: 0.1
  });

  const content = completion.choices[0]?.message?.content;

  if (!content) {
    throw new Error("No content returned from OpenAI when parsing RFP.");
  }

  let parsed: ParsedRfp;
  try {
    parsed = JSON.parse(content) as ParsedRfp;
  } catch (err) {
    console.error("Failed to parse JSON from OpenAI:", content);
    throw new Error("Failed to parse RFP JSON from AI response.");
  }

  return parsed;
}
