// client/src/api/vendorApi.ts
import { http } from "./http";

export type Vendor = {
  id: number;
  name: string;
  email: string;
  category: string | null;
  createdAt: string;
};

export type CreateVendorInput = {
  name: string;
  email: string;
  category?: string;
};

export async function getVendors(): Promise<Vendor[]> {
  const res = await http.get<Vendor[]>("/api/vendors");
  return res.data;
}

export async function createVendor(
  payload: CreateVendorInput
): Promise<Vendor> {
  const res = await http.post<Vendor>("/api/vendors", payload);
  return res.data;
}

export async function deleteVendor(id: number): Promise<void> {
  await http.delete(`/api/vendors/${id}`);
}
