// src/services/comparisonService.ts
import prisma from "../config/prisma.mts";
import openai from "../config/openaiClient.mts";

type ComparisonResult = {
  rfpId: number;
  rfpTitle: string;
  rfpSummary: string;
  proposals: Array<{
    proposalId: number;
    vendorId: number;
    vendorName: string;
    score: number;
    strengths: string;
    weaknesses: string;
  }>;
  recommendedProposalId: number | null;
  recommendedVendorId: number | null;
  reasoning: string;
};

export async function compareProposalsForRfp(
  rfpId: number
): Promise<ComparisonResult> {
  const rfp = await prisma.rfp.findUnique({
    where: { id: rfpId },
    include: {
      proposals: {
        include: {
          vendor: true
        }
      }
    }
  });

  if (!rfp) {
    throw new Error("RFP not found");
  }

  if (rfp.proposals.length === 0) {
    throw new Error("No proposals found for this RFP");
  }

  // Build a compact JSON structure for the AI
  const rfpContext = {
    id: rfp.id,
    title: rfp.title,
    budget: rfp.budget,
    deliveryTimelineDays: rfp.deliveryTimelineDays,
    paymentTerms: rfp.paymentTerms,
    warrantyMonths: rfp.warrantyMonths,
    description: rfp.description
  };

  const proposalsContext = rfp.proposals.map((p) => ({
    proposalId: p.id,
    vendorId: p.vendorId,
    vendorName: p.vendor.name,
    totalPrice: p.totalPrice,
    deliveryDays: p.deliveryDays,
    paymentTerms: p.paymentTerms,
    warrantyMonths: p.warrantyMonths,
    notes: p.notes
  }));

  const systemPrompt = `
You are helping a procurement manager compare vendor proposals for an RFP.

You will receive:
- The RFP details (requirements, budget, timeline, payment terms, warranty)
- A list of proposals from different vendors with price, delivery days, payment terms, warranty, and notes.

Your job:
1) Score each proposal from 0 to 100 (higher is better) based on:
   - Price (lower is better, but consider value vs budget)
   - Delivery timeline (closer to or better than requested)
   - Warranty (longer is better)
   - Payment terms (favourable terms for the buyer)
   - Any extra value/risks in notes

2) Choose ONE recommended proposal.

Return ONLY a JSON object with this exact shape:

{
  "rfpSummary": string,
  "proposals": [
    {
      "proposalId": number,
      "vendorId": number,
      "score": number,
      "strengths": string,
      "weaknesses": string
    }
  ],
  "recommendedProposalId": number | null,
  "reasoning": string
}

Notes:
- "rfpSummary": 2–4 sentence summary of what the RFP is asking for.
- "score": 0–100. Use the full range if useful.
- "strengths"/"weaknesses": short bullet-like sentences (in plain text).
- If proposals are essentially tied, you can pick one but mention that in "reasoning".
- Do NOT include any additional fields or explanations outside the JSON.
`.trim();

  const userPrompt = `
RFP:
${JSON.stringify(rfpContext, null, 2)}

Proposals:
${JSON.stringify(proposalsContext, null, 2)}
`.trim();

  const completion = await openai.chat.completions.create({
    model: "gpt-4.1-mini", // adjust if needed
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ],
    temperature: 0.2
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    throw new Error("No content returned from OpenAI for comparison.");
  }

  let aiResult: {
    rfpSummary: string;
    proposals: Array<{
      proposalId: number;
      vendorId: number;
      score: number;
      strengths: string;
      weaknesses: string;
    }>;
    recommendedProposalId: number | null;
    reasoning: string;
  };

  try {
    aiResult = JSON.parse(content);
  } catch (err) {
    console.error("Failed to parse comparison JSON:", content);
    throw new Error("Failed to parse comparison JSON from AI.");
  }

  // Update proposals in DB with aiScore and aiJustification
  for (const p of aiResult.proposals) {
    try {
      await prisma.proposal.update({
        where: { id: p.proposalId },
        data: {
          aiScore: p.score,
          aiJustification: `Strengths: ${p.strengths}\nWeaknesses: ${p.weaknesses}`
        }
      });
    } catch (err) {
      console.error(
        `Failed to update proposal ${p.proposalId} with AI score`,
        err
      );
      // Non-fatal: continue updating others
    }
  }

  // Map back to include vendor names (from the loaded RFP)
  const proposalsWithNames = aiResult.proposals.map((p) => {
    const match = rfp.proposals.find((pr) => pr.id === p.proposalId);
    return {
      proposalId: p.proposalId,
      vendorId: p.vendorId,
      vendorName: match?.vendor.name || "Unknown vendor",
      score: p.score,
      strengths: p.strengths,
      weaknesses: p.weaknesses
    };
  });

  const recommendedProposal = aiResult.recommendedProposalId
    ? rfp.proposals.find((pr) => pr.id === aiResult.recommendedProposalId)
    : null;

  return {
    rfpId: rfp.id,
    rfpTitle: rfp.title,
    rfpSummary: aiResult.rfpSummary,
    proposals: proposalsWithNames,
    recommendedProposalId: aiResult.recommendedProposalId,
    recommendedVendorId: recommendedProposal?.vendorId ?? null,
    reasoning: aiResult.reasoning
  };
}
