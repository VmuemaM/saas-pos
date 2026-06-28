"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireOrg } from "@/lib/auth";
import { docNumber, parseNumber, parseString } from "@/lib/utils";
import type { WorkOrderStatus } from "@prisma/client";

type Component = { productId: string; quantity: number };

export async function createBom(formData: FormData): Promise<void> {
  const { organizationId } = await requireOrg();
  const name = parseString(formData.get("name"));
  const productId = parseString(formData.get("productId"));
  const outputQty = parseNumber(formData.get("outputQty")) || 1;
  if (!name || !productId) return;
  let components: Component[] = [];
  try {
    components = (JSON.parse(parseString(formData.get("components"))) as Component[]).filter((c) => c.productId && c.quantity > 0);
  } catch {
    return;
  }
  await prisma.bom.create({
    data: {
      name,
      productId,
      outputQty,
      organizationId,
      items: { create: components.map((c) => ({ productId: c.productId, quantity: c.quantity })) },
    },
  });
  revalidatePath("/manufacturing/bom");
}

export async function createWorkOrder(formData: FormData) {
  const { organizationId } = await requireOrg();
  const bomId = parseString(formData.get("bomId"));
  if (!bomId) return;
  const bom = await prisma.bom.findFirst({ where: { id: bomId, organizationId } });
  if (!bom) return;
  const quantity = parseNumber(formData.get("quantity")) || 1;
  const startDate = parseString(formData.get("startDate"));
  const dueDate = parseString(formData.get("dueDate"));
  const count = await prisma.workOrder.count({ where: { organizationId } });
  await prisma.workOrder.create({
    data: {
      organizationId,
      number: docNumber("WO", count + 1),
      bomId,
      productId: bom.productId,
      quantity,
      startDate: startDate ? new Date(startDate) : null,
      dueDate: dueDate ? new Date(dueDate) : null,
      notes: parseString(formData.get("notes")) || null,
    },
  });
  revalidatePath("/manufacturing/work-orders");
}

export async function setWorkOrderStatus(formData: FormData): Promise<void> {
  const { organizationId } = await requireOrg();
  const id = parseString(formData.get("id"));
  const status = parseString(formData.get("status")) as WorkOrderStatus;
  const wo = await prisma.workOrder.findFirst({
    where: { id, organizationId },
    include: { bom: { include: { items: true } } },
  });
  if (!wo) return;

  if (status === "COMPLETED" && wo.status !== "COMPLETED" && wo.bom) {
    const multiplier = wo.quantity / (wo.bom.outputQty || 1);
    await prisma.$transaction(async (tx) => {
      for (const item of wo.bom!.items) {
        const consume = item.quantity * multiplier;
        await tx.product.update({ where: { id: item.productId }, data: { stockQty: { decrement: consume } } });
        await tx.inventoryMovement.create({
          data: { productId: item.productId, type: "PRODUCTION_OUT", quantity: -consume, note: wo.number, organizationId },
        });
      }
      await tx.product.update({ where: { id: wo.productId }, data: { stockQty: { increment: wo.quantity } } });
      await tx.inventoryMovement.create({
        data: { productId: wo.productId, type: "PRODUCTION_IN", quantity: wo.quantity, note: wo.number, organizationId },
      });
      await tx.workOrder.update({ where: { id }, data: { status, completedAt: new Date() } });
    });
  } else {
    await prisma.workOrder.update({
      where: { id },
      data: { status, startDate: status === "IN_PROGRESS" && !wo.startDate ? new Date() : wo.startDate },
    });
  }

  revalidatePath("/manufacturing/work-orders");
  revalidatePath("/pos/inventory");
  revalidatePath("/dashboard");
}
