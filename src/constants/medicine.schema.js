import { z } from "zod";

export const CreateMedicineSchema = z.object({
  name: z.string().min(2),
  genericName: z.string().optional(),
  categoryId: z.string().uuid().optional(),
  category: z.string().optional(),
  branchId: z.string().uuid().optional(),
  manufacturer: z.string().optional(),
  manufacturerId: z.string().uuid().optional(),
  gstPercentage: z.number().optional(),
  reorderPoint: z.number().optional(),
  reorderLevel: z.number().optional(),
  scheduleType: z.string().optional(),
  dosageForm: z.string().optional(),
  strength: z.string().optional(),
  barcode: z.string().optional(),
  hsnCode: z.string().optional(),
  description: z.string().optional(),
  supplierId: z.string().uuid().nullable().optional(),
  initialBatch: z
    .object({
      batchNumber: z.string(),
      quantity: z.number(),
      expiryDate: z.string(),
      mrp: z.number(),
      purchasePrice: z.number(),
      sellingPrice: z.number(),
    })
    .optional(),
});

export const UpdateMedicineSchema = z.object({
  name: z.string().min(2).optional(),
  genericName: z.string().optional(),
  categoryId: z.string().uuid().optional(),
  category: z.string().optional(),
  manufacturerId: z.string().uuid().optional(),
  manufacturer: z.string().optional(),
  branchId: z.string().uuid().optional(),
  gstPercentage: z.number().optional(),
  reorderPoint: z.number().optional(),
  reorderLevel: z.number().optional(),
  scheduleType: z.string().optional(),
  dosageForm: z.string().optional(),
  strength: z.string().optional(),
  barcode: z.string().optional(),
  hsnCode: z.string().optional(),
  description: z.string().optional(),
  supplierId: z.string().uuid().nullable().optional(),
  isActive: z.boolean().optional(),
});
