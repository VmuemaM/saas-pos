import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const DEFAULT_ACCOUNTS = [
  { code: "1000", name: "Cash", type: "ASSET" as const },
  { code: "1010", name: "Bank", type: "ASSET" as const },
  { code: "1100", name: "Accounts Receivable", type: "ASSET" as const },
  { code: "1200", name: "Inventory", type: "ASSET" as const },
  { code: "1500", name: "Equipment", type: "ASSET" as const },
  { code: "2000", name: "Accounts Payable", type: "LIABILITY" as const },
  { code: "2100", name: "Taxes Payable", type: "LIABILITY" as const },
  { code: "2200", name: "Loans Payable", type: "LIABILITY" as const },
  { code: "3000", name: "Owner's Equity", type: "EQUITY" as const },
  { code: "3100", name: "Retained Earnings", type: "EQUITY" as const },
  { code: "4000", name: "Sales Revenue", type: "REVENUE" as const },
  { code: "4100", name: "Service Revenue", type: "REVENUE" as const },
  { code: "5000", name: "Cost of Goods Sold", type: "EXPENSE" as const },
  { code: "6000", name: "Salaries & Wages", type: "EXPENSE" as const },
  { code: "6100", name: "Rent", type: "EXPENSE" as const },
  { code: "6200", name: "Utilities", type: "EXPENSE" as const },
  { code: "6300", name: "Office Supplies", type: "EXPENSE" as const },
  { code: "6400", name: "Marketing", type: "EXPENSE" as const },
];

async function main() {
  const email = "owner@demo.com";
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log("Demo data already seeded (owner@demo.com exists). Skipping.");
    return;
  }

  const org = await prisma.organization.create({
    data: { name: "Acme Manufacturing Co.", slug: "acme" },
  });

  await prisma.user.create({
    data: {
      name: "Demo Owner",
      email,
      passwordHash: await bcrypt.hash("password123", 10),
      role: "OWNER",
      organizationId: org.id,
    },
  });

  await prisma.account.createMany({
    data: DEFAULT_ACCOUNTS.map((a) => ({ ...a, organizationId: org.id })),
  });

  const beverages = await prisma.category.create({ data: { name: "Beverages", organizationId: org.id } });
  const snacks = await prisma.category.create({ data: { name: "Snacks", organizationId: org.id } });

  const [coffee, , sugar, beans] = await Promise.all([
    prisma.product.create({ data: { name: "Bottled Coffee", sku: "BEV-001", price: 3.5, cost: 1.2, stockQty: 120, reorderLevel: 30, categoryId: beverages.id, organizationId: org.id } }),
    prisma.product.create({ data: { name: "Mineral Water 500ml", sku: "BEV-002", price: 1.0, cost: 0.3, stockQty: 18, reorderLevel: 40, categoryId: beverages.id, organizationId: org.id } }),
    prisma.product.create({ data: { name: "Sugar (kg)", sku: "RAW-001", price: 0, cost: 0.8, stockQty: 200, reorderLevel: 50, isRawMaterial: true, unit: "kg", organizationId: org.id } }),
    prisma.product.create({ data: { name: "Coffee Beans (kg)", sku: "RAW-002", price: 0, cost: 6.0, stockQty: 80, reorderLevel: 20, isRawMaterial: true, unit: "kg", organizationId: org.id } }),
    prisma.product.create({ data: { name: "Chips Pack", sku: "SNK-001", price: 2.0, cost: 0.7, stockQty: 90, reorderLevel: 25, categoryId: snacks.id, organizationId: org.id } }),
  ]);

  const cust = await prisma.customer.create({ data: { name: "Jane Doe", email: "jane@example.com", phone: "+1 555 0100", organizationId: org.id } });
  await prisma.customer.create({ data: { name: "Corner Cafe Ltd", email: "orders@cornercafe.com", organizationId: org.id } });

  const eng = await prisma.department.create({ data: { name: "Production", organizationId: org.id } });
  const sales = await prisma.department.create({ data: { name: "Sales", organizationId: org.id } });

  await prisma.employee.createMany({
    data: [
      { firstName: "Alice", lastName: "Smith", email: "alice@acme.com", position: "Line Supervisor", salary: 3200, departmentId: eng.id, organizationId: org.id },
      { firstName: "Bob", lastName: "Jones", email: "bob@acme.com", position: "Sales Rep", salary: 2800, departmentId: sales.id, organizationId: org.id },
      { firstName: "Carol", lastName: "White", email: "carol@acme.com", position: "Accountant", salary: 3500, organizationId: org.id },
    ],
  });

  // A sample BOM: 1 Bottled Coffee = 0.02kg beans + 0.01kg sugar
  await prisma.bom.create({
    data: {
      name: "Bottled Coffee Recipe",
      productId: coffee.id,
      outputQty: 1,
      organizationId: org.id,
      items: { create: [{ productId: beans.id, quantity: 0.02 }, { productId: sugar.id, quantity: 0.01 }] },
    },
  });

  // A sample POS sale + journal entry
  const cashAcc = await prisma.account.findFirst({ where: { organizationId: org.id, code: "1000" } });
  const revAcc = await prisma.account.findFirst({ where: { organizationId: org.id, code: "4000" } });
  const sale = await prisma.sale.create({
    data: {
      number: "POS-SAMPLE-0001",
      customerId: cust.id,
      subtotal: 7.0,
      taxRate: 0,
      tax: 0,
      discount: 0,
      total: 7.0,
      organizationId: org.id,
      items: { create: [{ productId: coffee.id, quantity: 2, unitPrice: 3.5, total: 7.0 }] },
    },
  });
  if (cashAcc && revAcc) {
    await prisma.journalEntry.create({
      data: {
        organizationId: org.id,
        reference: sale.number,
        description: `POS sale ${sale.number}`,
        lines: { create: [{ accountId: cashAcc.id, debit: 7, credit: 0 }, { accountId: revAcc.id, debit: 0, credit: 7 }] },
      },
    });
  }

  console.log("Seeded demo workspace. Login: owner@demo.com / password123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
