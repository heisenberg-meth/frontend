import assert from "node:assert";
import { test } from "node:test";
import {
  normalizePOStatus,
  isPendingPOStatus,
  getPendingPOCount,
} from "./purchaseOrderStatus.js";

test("normalizePOStatus normalizes case, whitespace, and hyphens", () => {
  assert.strictEqual(normalizePOStatus("PENDING"), "PENDING");
  assert.strictEqual(normalizePOStatus("pending"), "PENDING");
  assert.strictEqual(normalizePOStatus("Pending"), "PENDING");
  assert.strictEqual(normalizePOStatus(" pending "), "PENDING");
  assert.strictEqual(normalizePOStatus("pending-approval"), "PENDING_APPROVAL");
  assert.strictEqual(normalizePOStatus("pending approval"), "PENDING_APPROVAL");
  assert.strictEqual(normalizePOStatus("SENT"), "SENT");
  assert.strictEqual(normalizePOStatus("sent"), "SENT");
  assert.strictEqual(normalizePOStatus(""), "");
  assert.strictEqual(normalizePOStatus(null), "");
  assert.strictEqual(normalizePOStatus(undefined), "");
});

test("isPendingPOStatus matches Section 23 testing matrix", () => {
  // PENDING / SENT variants should return true
  assert.strictEqual(isPendingPOStatus("PENDING"), true);
  assert.strictEqual(isPendingPOStatus("pending"), true);
  assert.strictEqual(isPendingPOStatus("Pending"), true);
  assert.strictEqual(isPendingPOStatus("SENT"), true);
  assert.strictEqual(isPendingPOStatus("sent"), true);
  assert.strictEqual(isPendingPOStatus("Sent"), true);

  // Non-pending lifecycle statuses should return false
  assert.strictEqual(isPendingPOStatus("DRAFT"), false);
  assert.strictEqual(isPendingPOStatus("PENDING_APPROVAL"), false);
  assert.strictEqual(isPendingPOStatus("APPROVED"), false);
  assert.strictEqual(isPendingPOStatus("ORDERED"), false);
  assert.strictEqual(isPendingPOStatus("PARTIALLY_RECEIVED"), false);
  assert.strictEqual(isPendingPOStatus("RECEIVED"), false);
  assert.strictEqual(isPendingPOStatus("COMPLETED"), false);
  assert.strictEqual(isPendingPOStatus("CANCELLED"), false);
  assert.strictEqual(isPendingPOStatus("REJECTED"), false);
});

test("getPendingPOCount correctly calculates counts across lifecycle transitions (Section 24)", () => {
  const sampleOrders = [
    { id: "PO-001", status: "PENDING" },
    { id: "PO-002", status: "SENT" },
    { id: "PO-003", status: "APPROVED" },
    { id: "PO-004", status: "RECEIVED" },
    { id: "PO-005", status: "COMPLETED" },
  ];

  // Initial: PO-001 (PENDING) and PO-002 (SENT) -> count = 2
  assert.strictEqual(getPendingPOCount(sampleOrders), 2);

  // After approving PO-001 -> count = 1
  sampleOrders[0].status = "APPROVED";
  assert.strictEqual(getPendingPOCount(sampleOrders), 1);

  // After approving PO-002 -> count = 0
  sampleOrders[1].status = "APPROVED";
  assert.strictEqual(getPendingPOCount(sampleOrders), 0);
});

test("getPendingPOCount handles empty or null orders gracefully", () => {
  assert.strictEqual(getPendingPOCount([]), 0);
  assert.strictEqual(getPendingPOCount(null), 0);
  assert.strictEqual(getPendingPOCount(undefined), 0);
});
