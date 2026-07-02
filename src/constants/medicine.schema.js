import { z } from "zod";

export const MedicineStatus = z.enum([
  "ACTIVE",
  "INACTIVE",
  "DISCONTINUED",
  "BLOCKED",
  "RESTRICTED",
  "RECALLED",
]);

export const StorageCondition = z.enum([
  "ROOM_TEMPERATURE",
  "COLD_STORAGE",
  "PROTECT_FROM_LIGHT",
]);

export const InitialBatchSchema = z.object({
  batchNumber: z.string().min(1, "Batch number is required"),
  quantity: z.number().int().min(0),
  expiryDate: z.string().refine((val) => new Date(val) > new Date(), {
    message: "Expiry date must be in the future",
  }),
  manufacturingDate: z.string().optional(),
  purchasePrice: z.number().min(0).optional(),
  sellingPrice: z.number().min(0).optional(),
  mrp: z.number().min(0).optional(),
});

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

export const AddBatchSchema = z.object({
  branchId: z.string().uuid().optional(),
  batchNumber: z.string().min(1, "Batch number is required"),
  quantity: z.number().int().min(0),
  expiryDate: z.string().refine((val) => new Date(val) > new Date(), {
    message: "Expiry date must be in the future",
  }),
  manufacturingDate: z.string().optional(),
  purchasePrice: z.number().min(0).optional(),
  sellingPrice: z.number().min(0).optional(),
  mrp: z.number().min(0).optional(),
  supplierId: z.string().uuid().optional(),
});

export const CategorySchema = z.object({
  name: z.string().min(1, "Category name is required"),
  description: z.string().optional(),
});

export const ManufacturerSchema = z.object({
  name: z.string().min(1, "Manufacturer name is required"),
  contactEmail: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  licenseNumber: z.string().optional(),
  gstNumber: z.string().optional(),
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

export const MedicineResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  genericName: z.string().nullable(),
  categoryId: z.string().nullable(),
  manufacturerId: z.string().nullable(),
  barcode: z.string().nullable(),
  sku: z.string().nullable(),
  dosageForm: z.string().nullable(),
  strength: z.string().nullable(),
  gstPercentage: z.number(),
  description: z.string().nullable(),
  storageCondition: StorageCondition.nullable(),
  prescriptionRequired: z.boolean(),
  status: MedicineStatus,
  isActive: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),

  category: z
    .object({ id: z.string(), name: z.string() })
    .nullable()
    .optional(),
  manufacturer: z
    .object({ id: z.string(), name: z.string() })
    .nullable()
    .optional(),
});
