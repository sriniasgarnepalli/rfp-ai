// // src/services/proposalService.ts
// import prisma from "../config/prisma.mts";
// import { parseProposalEmail } from "./proposalParserService.mts";

// export async function saveProposalFromEmail(
//   rfpId: number,
//   vendorId: number,
//   emailBody: string
// ) {
//   const parsed = await parseProposalEmail(emailBody);

//   return prisma.proposal.create({
//     data: {
//       rfpId,
//       vendorId,
//       rawEmailContent: emailBody,
//       totalPrice: parsed.totalPrice,
//       deliveryDays: parsed.deliveryDays,
//       paymentTerms: parsed.paymentTerms,
//       warrantyMonths: parsed.warrantyMonths,
//       notes: parsed.notes
//     }
//   });
// }

// export async function getProposalsForRfp(rfpId: number) {
//   return prisma.proposal.findMany({
//     where: { rfpId },
//     include: { vendor: true },
//     orderBy: { createdAt: "desc" }
//   });
// }

// src/services/proposalService.ts
import prisma from "../config/prisma.mts";
import { parseProposalEmail } from "./proposalParserService.mts";

export async function saveProposalFromEmail(
  rfpId: number,
  vendorId: number,
  emailBody: string
) {
  const parsed = await parseProposalEmail(emailBody);

  const proposal = await prisma.proposal.create({
    data: {
      rfpId,
      vendorId,
      rawEmailContent: emailBody,
      totalPrice: parsed.totalPrice,
      deliveryDays: parsed.deliveryDays,
      paymentTerms: parsed.paymentTerms,
      warrantyMonths: parsed.warrantyMonths,
      notes: parsed.notes
    }
  });

  return proposal;
}

/**
 * High-level function for "ingest this email-like payload".
 */
export async function ingestProposalFromEmailInput(input: {
  subject: string;
  from?: string;
  body: string;
}) {
  const { subject, body } = input;

  // Extract IDs from subject: [RFP-ID:1] [VENDOR-ID:2]
  const rfpMatch = subject.match(/RFP-ID:(\d+)/);
  const vendorMatch = subject.match(/VENDOR-ID:(\d+)/);

  if (!rfpMatch || !vendorMatch) {
    throw new Error("Could not find RFP-ID or VENDOR-ID in subject");
  }

  const rfpId = Number(rfpMatch[1]);
  const vendorId = Number(vendorMatch[1]);

  if (Number.isNaN(rfpId) || Number.isNaN(vendorId)) {
    throw new Error("Invalid RFP-ID or VENDOR-ID in subject");
  }

  // Optional: ensure the RFP and Vendor exist
  const [rfp, vendor] = await Promise.all([
    prisma.rfp.findUnique({ where: { id: rfpId } }),
    prisma.vendor.findUnique({ where: { id: vendorId } })
  ]);

  if (!rfp) throw new Error(`RFP ${rfpId} not found`);
  if (!vendor) throw new Error(`Vendor ${vendorId} not found`);

  // Save parsed proposal
  const proposal = await saveProposalFromEmail(rfpId, vendorId, body);

  return { rfp, vendor, proposal };
}

export async function getProposalsForRfp(rfpId: number) {
  return prisma.proposal.findMany({
    where: { rfpId },
    include: {
      vendor: true
    },
    orderBy: { createdAt: "desc" }
  });
}
