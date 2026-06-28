import { prisma } from "@/lib/db";
import type { AccountType } from "@prisma/client";

const DEFAULT_ACCOUNTS: { code: string; name: string; type: AccountType }[] = [
  { code: "1000", name: "Cash", type: "ASSET" },
  { code: "1010", name: "Bank", type: "ASSET" },
  { code: "1100", name: "Accounts Receivable", type: "ASSET" },
  { code: "1200", name: "Inventory", type: "ASSET" },
  { code: "1500", name: "Equipment", type: "ASSET" },
  { code: "2000", name: "Accounts Payable", type: "LIABILITY" },
  { code: "2100", name: "Taxes Payable", type: "LIABILITY" },
  { code: "2200", name: "Loans Payable", type: "LIABILITY" },
  { code: "3000", name: "Owner's Equity", type: "EQUITY" },
  { code: "3100", name: "Retained Earnings", type: "EQUITY" },
  { code: "4000", name: "Sales Revenue", type: "REVENUE" },
  { code: "4100", name: "Service Revenue", type: "REVENUE" },
  { code: "5000", name: "Cost of Goods Sold", type: "EXPENSE" },
  { code: "6000", name: "Salaries & Wages", type: "EXPENSE" },
  { code: "6100", name: "Rent", type: "EXPENSE" },
  { code: "6200", name: "Utilities", type: "EXPENSE" },
  { code: "6300", name: "Office Supplies", type: "EXPENSE" },
  { code: "6400", name: "Marketing", type: "EXPENSE" },
];

/** Creates a standard chart of accounts for a new organization. */
export async function seedChartOfAccounts(organizationId: string): Promise<void> {
  await prisma.account.createMany({
    data: DEFAULT_ACCOUNTS.map((a) => ({ ...a, organizationId })),
    skipDuplicates: true,
  });
}
