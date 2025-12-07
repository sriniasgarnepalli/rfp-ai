// client/src/api/proposalApi.ts
import { http } from "./http";

export type Proposal = {
  id: number;
  rfpId: number;
  vendorId: number;
  rawEmailContent: string;
  totalPrice: number | null;
  deliveryDays: number | null;
  paymentTerms: string | null;
  warrantyMonths: number | null;
  notes: string | null;
  aiScore: number | null;
  aiJustification: string | null;
  createdAt: string;
  vendor: {
    id: number;
    name: string;
    email: string;
    category: string | null;
  };
};

export async function getProposalsForRfp(rfpId: number): Promise<Proposal[]> {
  const res = await http.get<Proposal[]>(`/api/proposals/by-rfp/${rfpId}`);
  return res.data;
}
