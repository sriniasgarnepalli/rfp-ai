import { http } from "./http";

export type Rfp = {
  id: number;
  title: string;
  description: string;
  budget: number | null;
  deliveryTimelineDays: number | null;
  paymentTerms: string | null;
  warrantyMonths: number | null;
  status: string;
  createdAt: string;
};

export async function processGmailReplies(): Promise<any[]> {
  const res = await http.post<any[]>("/api/rfps/process-gmail-replies");
  return res.data;
}

export async function createRfpFromText(description: string): Promise<Rfp> {
  const res = await http.post<Rfp>("/api/rfps/from-text", { description });
  return res.data;
}

export async function getAllRfps(): Promise<Rfp[]> {
  const res = await http.get<Rfp[]>("/api/rfps");
  return res.data;
}

export async function getRfpById(id: number): Promise<Rfp> {
  const res = await http.get<Rfp>(`/api/rfps/${id}`);
  return res.data;
}

export type SendRfpResult = {
  rfp: Rfp;
  results: {
    vendorId: number;
    email: string;
    success: boolean;
    error?: string;
  }[];
};

export async function sendRfpToVendors(
  rfpId: number,
  vendorIds: number[]
): Promise<SendRfpResult> {
  const res = await http.post<SendRfpResult>(`/api/rfps/${rfpId}/send`, {
    vendorIds
  });
  return res.data;
}

export type ComparisonResult = {
  rfpId: number;
  rfpTitle: string;
  rfpSummary: string;
  proposals: {
    proposalId: number;
    vendorId: number;
    vendorName: string;
    score: number;
    strengths: string;
    weaknesses: string;
  }[];
  recommendedProposalId: number | null;
  recommendedVendorId: number | null;
  reasoning: string;
};

export async function getRfpComparison(
  rfpId: number
): Promise<ComparisonResult> {
  const res = await http.get<ComparisonResult>(`/api/rfps/${rfpId}/comparison`);
  return res.data;
}
