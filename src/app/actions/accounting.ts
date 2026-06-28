"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireOrg } from "@/lib/auth";
import { docNumber, parseNumber, parseString } from "@/lib/utils";
import type { AccountType, InvoiceStatus } from "@prisma/client";

export async function createAccount(formData: FormData) {
  const { organizationId } = await requireOrg();
  const code = parseString(formData.get("code"));
  const name = parseString(formData.get("name"));
  const type = parseString(formData.get("type")) as AccountType;
  if (!code || !name || !type) return;
  await prisma.account.create({ data: { code, name, type, organizationId } });
  revalidatePath("/accounting/accounts");
}

type JLine = { accountId: string; debit: number; credit: number };

export async function createJournalEntry(formData: FormData): Promise<void> {
  const { organizationId } = await requireOrg();
  const date = parseString(formData.get("date"));
  const description = parseString(formData.get("description")) || null;
  const reference = parseString(formData.get("reference")) || null;
  let lines: JLine[] = [];
  try {
    lines = (JSON.parse(parseString(formData.get("lines"))) as JLine[]).filter(
      (l) => l.accountId && (l.debit > 0 || l.credit > 0),
    );
  } catch {
    return;
  }
  if (lines.length < 2) return;
  await prisma.journalEntry.create({
    data: {
      organizationId,
      date: date ? new Date(date) : new Date(),
      description,
      reference,
      lines: { create: lines.map((l) => ({ accountId: l.accountId, debit: l.debit, credit: l.credit })) },
    },
  });
  revalidatePath("/accounting/journal");
}

type InvLine = { description: string; quantity: number; unitPrice: number };

export async function createInvoice(formData: FormData): Promise<void> {
  const { organizationId } = await requireOrg();
  const customerId = parseString(formData.get("customerId")) || null;
  const issueDate = parseString(formData.get("issueDate"));
  const dueDate = parseString(formData.get("dueDate"));
  const taxRate = parseNumber(formData.get("taxRate"));
  let items: InvLine[] = [];
  try {
    items = (JSON.parse(parseString(formData.get("items"))) as InvLine[]).filter((i) => i.description && i.quantity > 0);
  } catch {
    return;
  }
  if (items.length === 0) return;

  const subtotal = items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
  const tax = (subtotal * taxRate) / 100;
  const total = subtotal + tax;
  const count = await prisma.invoice.count({ where: { organizationId } });

  await prisma.invoice.create({
    data: {
      organizationId,
      number: docNumber("INV", count + 1),
      customerId,
      issueDate: issueDate ? new Date(issueDate) : new Date(),
      dueDate: dueDate ? new Date(dueDate) : new Date(),
      subtotal,
      tax,
      total,
      notes: parseString(formData.get("notes")) || null,
      items: {
        create: items.map((i) => ({
          description: i.description,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          total: i.quantity * i.unitPrice,
        })),
      },
    },
  });
  revalidatePath("/accounting/invoices");
}

export async function setInvoiceStatus(formData: FormData) {
  const { organizationId } = await requireOrg();
  const id = parseString(formData.get("id"));
  const status = parseString(formData.get("status")) as InvoiceStatus;
  const invoice = await prisma.invoice.findFirst({ where: { id, organizationId } });
  if (!invoice) return;
  await prisma.invoice.update({ where: { id }, data: { status } });

  if (status === "PAID") {
    const [cashAcc, arAcc] = await Promise.all([
      prisma.account.findFirst({ where: { organizationId, code: "1000" } }),
      prisma.account.findFirst({ where: { organizationId, code: "1100" } }),
    ]);
    if (cashAcc && arAcc) {
      await prisma.journalEntry.create({
        data: {
          organizationId,
          reference: invoice.number,
          description: `Invoice payment ${invoice.number}`,
          lines: {
            create: [
              { accountId: cashAcc.id, debit: invoice.total, credit: 0 },
              { accountId: arAcc.id, debit: 0, credit: invoice.total },
            ],
          },
        },
      });
    }
  }
  revalidatePath("/accounting/invoices");
}

export async function createExpense(formData: FormData) {
  const { organizationId } = await requireOrg();
  const amount = parseNumber(formData.get("amount"));
  if (amount <= 0) return;
  const date = parseString(formData.get("date"));
  const accountId = parseString(formData.get("accountId")) || null;
  await prisma.expense.create({
    data: {
      organizationId,
      date: date ? new Date(date) : new Date(),
      vendor: parseString(formData.get("vendor")) || null,
      category: parseString(formData.get("category")) || null,
      description: parseString(formData.get("description")) || null,
      amount,
      accountId,
    },
  });

  // Post: debit expense account, credit Cash
  const cashAcc = await prisma.account.findFirst({ where: { organizationId, code: "1000" } });
  if (accountId && cashAcc) {
    await prisma.journalEntry.create({
      data: {
        organizationId,
        description: `Expense: ${parseString(formData.get("description")) || "expense"}`,
        lines: {
          create: [
            { accountId, debit: amount, credit: 0 },
            { accountId: cashAcc.id, debit: 0, credit: amount },
          ],
        },
      },
    });
  }
  revalidatePath("/accounting/expenses");
}
