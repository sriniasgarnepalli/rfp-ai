// src/routes/proposalRoutes.ts
import { Router } from "express";
import { z } from "zod";
import * as proposalService from "../services/proposalService.mts";

const router = Router();

const ingestSchema = z.object({
  subject: z.string().min(1, "subject is required"),
  from: z.string().optional(), // could be email, but not required for logic
  body: z.string().min(1, "body is required")
});

// POST /api/proposals/ingest-email
router.post("/ingest-email", async (req, res) => {
  const parseResult = ingestSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({
      error: "Invalid request body",
      details: parseResult.error.format()
    });
  }

  try {
    const result = await proposalService.ingestProposalFromEmailInput(
      parseResult.data
    );
    res.status(201).json(result);
  } catch (err: any) {
    console.error("Error ingesting proposal from email input:", err);
    if (err.message?.includes("RFP") || err.message?.includes("Vendor")) {
      return res.status(400).json({ error: err.message });
    }
    if (err.message?.includes("RFP-ID") || err.message?.includes("VENDOR-ID")) {
      return res.status(400).json({ error: err.message });
    }
    res.status(500).json({ error: "Failed to ingest proposal" });
  }
});

// Optional: GET /api/proposals/by-rfp/:rfpId
router.get("/by-rfp/:rfpId", async (req, res) => {
  const rfpId = Number(req.params.rfpId);
  if (Number.isNaN(rfpId)) {
    return res.status(400).json({ error: "Invalid RFP id" });
  }

  try {
    const proposals = await proposalService.getProposalsForRfp(rfpId);
    res.json(proposals);
  } catch (err) {
    console.error("Error fetching proposals for RFP", err);
    res.status(500).json({ error: "Failed to fetch proposals" });
  }
});

export default router;
