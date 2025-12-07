// src/services/vendorService.ts
import prisma from "../config/prisma.mts";

export async function getAllVendors() {
  return prisma.vendor.findMany({
    orderBy: { createdAt: "desc" }
  });
}

export async function getVendorById(id: number) {
  return prisma.vendor.findUnique({
    where: { id }
  });
}

type CreateVendorInput = {
  name: string;
  email: string;
  category?: string | null;
};

export async function createVendor(data: CreateVendorInput) {
  return prisma.vendor.create({
    data: {
      name: data.name,
      email: data.email,
      category: data.category ?? null
    }
  });
}

type UpdateVendorInput = {
  name?: string;
  email?: string;
  category?: string | null;
};

export async function updateVendor(id: number, data: UpdateVendorInput) {
  return prisma.vendor.update({
    where: { id },
    data: {
      ...data
    }
  });
}

export async function deleteVendor(id: number) {
  return prisma.vendor.delete({
    where: { id }
  });
}
