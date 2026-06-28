import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card, Table, Th, Td, EmptyRow, PageHeader } from "@/components/ui";
import { BomForm } from "@/components/bom-form";

export default async function BomPage() {
  const { organizationId } = await requireSession();
  const [boms, products, rawMaterials] = await Promise.all([
    prisma.bom.findMany({
      where: { organizationId },
      include: { product: true, items: { include: { product: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.product.findMany({ where: { organizationId }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.product.findMany({ where: { organizationId }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  return (
    <div>
      <PageHeader title="Bills of Materials" subtitle="Recipes for your manufactured products." action={<BomForm products={products} rawMaterials={rawMaterials} />} />
      <Card>
        <Table head={<tr><Th>BOM</Th><Th>Produces</Th><Th className="text-right">Output</Th><Th>Components</Th></tr>}>
          {boms.length === 0 && <EmptyRow colSpan={4} message="No bills of materials yet." />}
          {boms.map((b) => (
            <tr key={b.id}>
              <Td className="font-medium text-slate-900">{b.name}</Td>
              <Td>{b.product.name}</Td>
              <Td className="text-right">{b.outputQty}</Td>
              <Td className="text-sm text-slate-500">
                {b.items.map((it) => (
                  <div key={it.id}>{it.quantity} × {it.product.name}</div>
                ))}
              </Td>
            </tr>
          ))}
        </Table>
      </Card>
    </div>
  );
}
