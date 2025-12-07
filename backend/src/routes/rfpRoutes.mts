// src/routes/rfpRoutes.ts
import { Router } from "express";
import * as rfpService from "../services/rfpService.mts";
import { processGmailVendorReplies } from "../services/emailProcessService.mts";
import { compareProposalsForRfp } from "../services/comparisonService.mts";
import { z } from "zod";

const router = Router();

const sendRfpSchema = z.object({
  vendorIds: z
    .array(z.number().int().positive())
    .min(1, "At least one vendorId is required")
});

/**
 * POST /api/rfps/from-text
 * Body: { "description": string }
 * Response: created RFP row
 */
router.post("/from-text", async (req, res) => {
  const { description } = req.body;

  if (!description || typeof description !== "string") {
    return res
      .status(400)
      .json({ error: "description is required and must be a string" });
  }

  try {
    const rfp = await rfpService.createRfpFromDescription(description);
    res.status(201).json(rfp);
  } catch (err: any) {
    console.error("Error creating RFP from description:", err);
    res.status(500).json({ error: err.message || "Failed to create RFP" });
  }
});

// Optional: GET /api/rfps - list all RFPs
router.get("/", async (_req, res) => {
  try {
    const rfps = await rfpService.getAllRfps();
    res.json(rfps);
  } catch (err) {
    console.error("Error fetching RFPs:", err);
    res.status(500).json({ error: "Failed to fetch RFPs" });
  }
});

// GET /api/rfps/:id - get single RFP
router.get("/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    return res.status(400).json({ error: "Invalid RFP id" });
  }

  try {
    const rfp = await rfpService.getRfpById(id);
    if (!rfp) {
      return res.status(404).json({ error: "RFP not found" });
    }
    res.json(rfp);
  } catch (err) {
    console.error("Error fetching RFP", err);
    res.status(500).json({ error: "Failed to fetch RFP" });
  }
});

// POST /api/rfps/:id/send
router.post("/:id/send", async (req, res) => {
  const rfpId = Number(req.params.id);
  if (Number.isNaN(rfpId)) {
    return res.status(400).json({ error: "Invalid RFP id" });
  }

  const parseResult = sendRfpSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({
      error: "Invalid request body",
      details: parseResult.error.format()
    });
  }

  const { vendorIds } = parseResult.data;

  try {
    const result = await rfpService.sendRfpToVendors(rfpId, vendorIds);
    res.json(result);
  } catch (err: any) {
    console.error("Error sending RFP to vendors:", err);
    if (err.message === "RFP not found") {
      return res.status(404).json({ error: "RFP not found" });
    }
    if (err.message.startsWith("Some vendor IDs were not found")) {
      return res.status(400).json({ error: err.message });
    }
    if (err.message === "No vendors found for the given IDs") {
      return res.status(400).json({ error: err.message });
    }
    res.status(500).json({ error: "Failed to send RFP emails" });
  }
});

router.post("/process-replies", async (_req, res) => {
  try {
    const result = await processGmailVendorReplies();
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to process replies" });
  }
});

// POST /api/rfps/process-gmail-replies
router.post("/process-gmail-replies", async (_req, res) => {
  try {
    const result = await processGmailVendorReplies();
    res.json(result);
  } catch (err) {
    console.error("Error processing Gmail replies:", err);
    res.status(500).json({ error: "Failed to process Gmail replies" });
  }
});

// GET /api/rfps/:id/comparison
router.get("/:id/comparison", async (req, res) => {
  const rfpId = Number(req.params.id);
  if (Number.isNaN(rfpId)) {
    return res.status(400).json({ error: "Invalid RFP id" });
  }

  try {
    const result = await compareProposalsForRfp(rfpId);
    res.json(result);
  } catch (err: any) {
    console.error("Error comparing proposals for RFP:", err);
    if (err.message === "RFP not found") {
      return res.status(404).json({ error: "RFP not found" });
    }
    if (err.message === "No proposals found for this RFP") {
      return res.status(400).json({ error: "No proposals found for this RFP" });
    }
    res.status(500).json({ error: "Failed to compare proposals" });
  }
});

export default router;
