// src/services/proposalParserService.ts
import openai from "../config/openaiClient.mts";

export type ParsedProposal = {
  totalPrice: number | null;
  deliveryDays: number | null;
  paymentTerms: string | null;
  warrantyMonths: number | null;
  notes: string | null;
};

export async function parseProposalEmail(
  emailBody: string
): Promise<ParsedProposal> {
  const systemPrompt = `
You are helping a procurement manager extract proposal details from a vendor email.

Return ONLY a JSON object with this exact shape:

{
  "totalPrice": number | null,
  "deliveryDays": number | null,
  "paymentTerms": string | null,
  "warrantyMonths": number | null,
  "notes": string | null
}

Rules:
- totalPrice: overall quoted price as a number (no currency symbol).
- deliveryDays: number of days for delivery, or null.
- paymentTerms: e.g. "net 30".
- warrantyMonths: warranty in months (convert years to months if needed), or null.
- notes: extra terms/conditions in 1–3 sentences.
- Use null if not specified.
- No backticks, no explanation, just JSON.
`.trim();

  const completion = await openai.chat.completions.create({
    model: "gpt-4.1-mini",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: emailBody }
    ],
    temperature: 0.1
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    throw new Error("No content from OpenAI when parsing proposal.");
  }

  try {
    return JSON.parse(content) as ParsedProposal;
  } catch (err) {
    console.error("Failed to parse proposal JSON:", content);
    throw new Error(
      `Failed to parse proposal JSON from AI response: ${
        (err as Error).message
      }`
    );
  }
}
