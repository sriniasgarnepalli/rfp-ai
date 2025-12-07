// src/routes/vendorRoutes.ts
import { Router } from "express";
import { z } from "zod";
import * as vendorService from "../services/vendorService.mts";

const router = Router();

// Zod schema for creating a vendor
const createVendorSchema = z.object({
  name: z.string().min(1, "name is required"),
  email: z.string().email("invalid email"),
  category: z.string().optional()
});

// Zod schema for updating a vendor (all fields optional)
const updateVendorSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  category: z.string().optional().nullable()
});

// GET /api/vendors - list all vendors
router.get("/", async (_req, res) => {
  try {
    const vendors = await vendorService.getAllVendors();
    res.json(vendors);
  } catch (err) {
    console.error("Error fetching vendors", err);
    res.status(500).json({ error: "Failed to fetch vendors" });
  }
});

// GET /api/vendors/:id - get single vendor
router.get("/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    return res.status(400).json({ error: "Invalid vendor id" });
  }

  try {
    const vendor = await vendorService.getVendorById(id);
    if (!vendor) {
      return res.status(404).json({ error: "Vendor not found" });
    }
    res.json(vendor);
  } catch (err) {
    console.error("Error fetching vendor", err);
    res.status(500).json({ error: "Failed to fetch vendor" });
  }
});

// POST /api/vendors - create vendor
router.post("/", async (req, res) => {
  const parseResult = createVendorSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({
      error: "Invalid request body",
      details: parseResult.error.format()
    });
  }

  try {
    const vendor = await vendorService.createVendor(parseResult.data);
    res.status(201).json(vendor);
  } catch (err) {
    console.error("Error creating vendor", err);
    res.status(500).json({ error: "Failed to create vendor" });
  }
});

// PUT /api/vendors/:id - update vendor
router.put("/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    return res.status(400).json({ error: "Invalid vendor id" });
  }

  const parseResult = updateVendorSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({
      error: "Invalid request body",
      details: parseResult.error.format()
    });
  }

  try {
    const vendor = await vendorService.updateVendor(id, parseResult.data);
    res.json(vendor);
  } catch (err: any) {
    console.error("Error updating vendor", err);

    // Handle "record not found"
    if (err.code === "P2025") {
      return res.status(404).json({ error: "Vendor not found" });
    }

    res.status(500).json({ error: "Failed to update vendor" });
  }
});

// DELETE /api/vendors/:id - delete vendor
router.delete("/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    return res.status(400).json({ error: "Invalid vendor id" });
  }

  try {
    await vendorService.deleteVendor(id);
    res.status(204).send();
  } catch (err: any) {
    console.error("Error deleting vendor", err);

    if (err.code === "P2025") {
      return res.status(404).json({ error: "Vendor not found" });
    }

    res.status(500).json({ error: "Failed to delete vendor" });
  }
});

export default router;
