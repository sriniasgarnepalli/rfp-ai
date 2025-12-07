import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import vendorRoutes from "./routes/vendorRoutes.mts";
import proposalRoutes from "./routes/proposalRoutes.mts";
import rfpRoutes from "./routes/rfpRoutes.mts";

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Health check route
app.get("/health", (_req, res) => {
  res.json({ status: "ok", message: "RFP system backend is running" });
});

// Register routes
app.use("/api/vendors", vendorRoutes);
app.use("/api/rfps", rfpRoutes);
app.use("/api/proposals", proposalRoutes);

export default app;
