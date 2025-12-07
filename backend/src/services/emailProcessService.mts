// src/services/emailProcessService.ts
import { fetchUnseenEmails } from "./emailReceiveService.mts";
import { saveProposalFromEmail } from "./proposalService.mts";
import prisma from "../config/prisma.mts";

export async function processGmailVendorReplies() {
  const emails = await fetchUnseenEmails();

  const results: any[] = [];

  for (const email of emails) {
    const subject = email.subject || "";

    // Expect subject like: RFP: Title [RFP-ID:1] [VENDOR-ID:2]
    const rfpMatch = subject.match(/RFP-ID:(\d+)/);
    const vendorMatch = subject.match(/VENDOR-ID:(\d+)/);

    if (!rfpMatch || !vendorMatch) {
      results.push({
        uid: email.uid,
        skipped: true,
        reason: "No RFP-ID/VENDOR-ID in subject",
        subject
      });
      continue;
    }

    const rfpId = Number(rfpMatch[1]);
    const vendorId = Number(vendorMatch[1]);

    // Optional: validate they exist
    const [rfp, vendor] = await Promise.all([
      prisma.rfp.findUnique({ where: { id: rfpId } }),
      prisma.vendor.findUnique({ where: { id: vendorId } })
    ]);

    if (!rfp || !vendor) {
      results.push({
        uid: email.uid,
        skipped: true,
        reason: `RFP or Vendor not found (rfpId=${rfpId}, vendorId=${vendorId})`,
        subject
      });
      continue;
    }

    const emailContent = email.text || email.html || "(empty email)";
    const proposal = await saveProposalFromEmail(rfpId, vendorId, emailContent);

    results.push({
      uid: email.uid,
      rfpId,
      vendorId,
      proposalId: proposal.id,
      status: "ingested"
    });
  }

  return results;
}
