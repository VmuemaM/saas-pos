import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PosTerminal } from "@/components/pos-terminal";

export default async function PosPage() {
  const { organizationId } = await requireSession();
  const [products, customers] = await Promise.all([
    prisma.product.findMany({
      where: { organizationId, isRawMaterial: false },
      orderBy: { name: "asc" },
      select: { id: true, name: true, sku: true, price: true, stockQty: true, unit: true },
    }),
    prisma.customer.findMany({ where: { organizationId }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold text-slate-900">POS Terminal</h1>
      <PosTerminal products={products} customers={customers} />
    </div>
  );
}
