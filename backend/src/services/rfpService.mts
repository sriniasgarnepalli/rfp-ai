// src/services/rfpService.ts
import prisma from "../config/prisma.mts";
import { parseRfpFromText } from "./aiService.mts";
import { sendRfpEmailToVendor } from "./emailService.mts";

export async function createRfpFromDescription(description: string) {
  // 1. Ask AI to structure the description
  const parsed = await parseRfpFromText(description);

  // 2. Persist to DB as an Rfp record
  const rfp = await prisma.rfp.create({
    data: {
      title: parsed.title || "Untitled RFP",
      description, // store the raw text
      budget: parsed.budget ?? null,
      deliveryTimelineDays: parsed.deliveryTimelineDays ?? null,
      paymentTerms: parsed.paymentTerms ?? null,
      warrantyMonths: parsed.warrantyMonths ?? null
      // status defaults to DRAFT per prisma schema
    }
  });

  return rfp;
}

// Optional: list all RFPs for debugging / UI
export async function getAllRfps() {
  return prisma.rfp.findMany({
    orderBy: { createdAt: "desc" }
  });
}

export async function getRfpById(id: number) {
  return prisma.rfp.findUnique({
    where: { id }
  });
}

/**
 * Send an RFP to selected vendors via email and update status to SENT.
 */
export async function sendRfpToVendors(rfpId: number, vendorIds: number[]) {
  // 1. Load RFP
  const rfp = await prisma.rfp.findUnique({
    where: { id: rfpId }
  });

  if (!rfp) {
    throw new Error("RFP not found");
  }

  // 2. Load vendors
  const vendors = await prisma.vendor.findMany({
    where: {
      id: { in: vendorIds }
    }
  });

  if (vendors.length === 0) {
    throw new Error("No vendors found for the given IDs");
  }

  // Optional: ensure all IDs exist
  const foundIds = new Set(vendors.map((v) => v.id));
  const missing = vendorIds.filter((id) => !foundIds.has(id));
  if (missing.length > 0) {
    throw new Error(`Some vendor IDs were not found: ${missing.join(", ")}`);
  }

  // 3. Send emails
  const results: {
    vendorId: number;
    email: string;
    success: boolean;
    error?: string;
  }[] = [];

  for (const vendor of vendors) {
    try {
      await sendRfpEmailToVendor(rfp, vendor);
      results.push({ vendorId: vendor.id, email: vendor.email, success: true });
    } catch (err: any) {
      console.error(`Failed to send email to vendor ${vendor.id}`, err);
      results.push({
        vendorId: vendor.id,
        email: vendor.email,
        success: false,
        error: err.message || "Unknown error"
      });
    }
  }

  // 4. Update RFP status to SENT (only if at least one email was sent)
  const anySuccess = results.some((r) => r.success);
  let updatedRfp = rfp;
  if (anySuccess && rfp.status !== "SENT") {
    updatedRfp = await prisma.rfp.update({
      where: { id: rfpId },
      data: { status: "SENT" }
    });
  }

  return {
    rfp: updatedRfp,
    results
  };
}
