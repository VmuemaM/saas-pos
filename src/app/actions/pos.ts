"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireOrg } from "@/lib/auth";
import { docNumber, parseNumber, parseString } from "@/lib/utils";
import type { PaymentMethod } from "@prisma/client";

export async function createCategory(formData: FormData) {
  const { organizationId } = await requireOrg();
  const name = parseString(formData.get("name"));
  if (!name) return;
  await prisma.category.create({ data: { name, organizationId } });
  revalidatePath("/pos/products");
}

export async function createProduct(formData: FormData) {
  const { organizationId } = await requireOrg();
  const name = parseString(formData.get("name"));
  const sku = parseString(formData.get("sku")) || `SKU-${Date.now()}`;
  if (!name) return;
  const categoryId = parseString(formData.get("categoryId")) || null;
  await prisma.product.create({
    data: {
      name,
      sku,
      description: parseString(formData.get("description")) || null,
      price: parseNumber(formData.get("price")),
      cost: parseNumber(formData.get("cost")),
      stockQty: parseNumber(formData.get("stockQty")),
      reorderLevel: parseNumber(formData.get("reorderLevel")),
      unit: parseString(formData.get("unit")) || "unit",
      isRawMaterial: parseString(formData.get("isRawMaterial")) === "on",
      categoryId,
      organizationId,
    },
  });
  revalidatePath("/pos/products");
  revalidatePath("/pos");
}

export async function adjustInventory(formData: FormData) {
  const { organizationId } = await requireOrg();
  const productId = parseString(formData.get("productId"));
  const quantity = parseNumber(formData.get("quantity"));
  const note = parseString(formData.get("note")) || null;
  if (!productId || quantity === 0) return;
  const product = await prisma.product.findFirst({ where: { id: productId, organizationId } });
  if (!product) return;
  await prisma.$transaction([
    prisma.product.update({ where: { id: productId }, data: { stockQty: { increment: quantity } } }),
    prisma.inventoryMovement.create({
      data: { productId, type: "ADJUSTMENT", quantity, note, organizationId },
    }),
  ]);
  revalidatePath("/pos/inventory");
  revalidatePath("/pos/products");
}

export async function createCustomer(formData: FormData) {
  const { organizationId } = await requireOrg();
  const name = parseString(formData.get("name"));
  if (!name) return;
  await prisma.customer.create({
    data: {
      name,
      email: parseString(formData.get("email")) || null,
      phone: parseString(formData.get("phone")) || null,
      address: parseString(formData.get("address")) || null,
      organizationId,
    },
  });
  revalidatePath("/pos/customers");
}

type CartLine = { productId: string; quantity: number; unitPrice: number };

export async function createSale(formData: FormData): Promise<void> {
  const { organizationId, userId } = await requireOrg();
  const itemsRaw = parseString(formData.get("items"));
  let lines: CartLine[] = [];
  try {
    lines = JSON.parse(itemsRaw) as CartLine[];
  } catch {
    return;
  }
  lines = lines.filter((l) => l.productId && l.quantity > 0);
  if (lines.length === 0) return;

  const customerId = parseString(formData.get("customerId")) || null;
  const paymentMethod = (parseString(formData.get("paymentMethod")) || "CASH") as PaymentMethod;
  const taxRate = parseNumber(formData.get("taxRate"));
  const discount = parseNumber(formData.get("discount"));

  const subtotal = lines.reduce((s, l) => s + l.quantity * l.unitPrice, 0);
  const taxedBase = Math.max(subtotal - discount, 0);
  const tax = (taxedBase * taxRate) / 100;
  const total = taxedBase + tax;

  const count = await prisma.sale.count({ where: { organizationId } });

  await prisma.$transaction(async (tx) => {
    const sale = await tx.sale.create({
      data: {
        number: docNumber("POS", count + 1),
        customerId,
        subtotal,
        taxRate,
        tax,
        discount,
        total,
        paymentMethod,
        cashierId: userId,
        organizationId,
        items: {
          create: lines.map((l) => ({
            productId: l.productId,
            quantity: l.quantity,
            unitPrice: l.unitPrice,
            total: l.quantity * l.unitPrice,
          })),
        },
      },
    });

    for (const l of lines) {
      await tx.product.update({ where: { id: l.productId }, data: { stockQty: { decrement: l.quantity } } });
      await tx.inventoryMovement.create({
        data: { productId: l.productId, type: "SALE", quantity: -l.quantity, note: sale.number, organizationId },
      });
    }

    // Accounting: debit Cash, credit Sales Revenue (and Tax Payable)
    const [cashAcc, revenueAcc, taxAcc] = await Promise.all([
      tx.account.findFirst({ where: { organizationId, code: "1000" } }),
      tx.account.findFirst({ where: { organizationId, code: "4000" } }),
      tx.account.findFirst({ where: { organizationId, code: "2100" } }),
    ]);
    if (cashAcc && revenueAcc) {
      await tx.journalEntry.create({
        data: {
          organizationId,
          reference: sale.number,
          description: `POS sale ${sale.number}`,
          lines: {
            create: [
              { accountId: cashAcc.id, debit: total, credit: 0 },
              { accountId: revenueAcc.id, debit: 0, credit: taxedBase },
              ...(tax > 0 && taxAcc ? [{ accountId: taxAcc.id, debit: 0, credit: tax }] : []),
            ],
          },
        },
      });
    }
  });

  revalidatePath("/pos");
  revalidatePath("/pos/sales");
  revalidatePath("/pos/inventory");
  revalidatePath("/dashboard");
}

export async function deleteProduct(formData: FormData) {
  const { organizationId } = await requireOrg();
  const id = parseString(formData.get("id"));
  const product = await prisma.product.findFirst({ where: { id, organizationId } });
  if (!product) return;
  await prisma.product.delete({ where: { id } });
  revalidatePath("/pos/products");
}
