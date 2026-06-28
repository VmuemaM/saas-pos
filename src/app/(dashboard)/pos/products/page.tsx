import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card, Table, Th, Td, EmptyRow, Badge, PageHeader, Input, Select, Textarea } from "@/components/ui";
import { ModalForm } from "@/components/modal-form";
import { createProduct, createCategory, deleteProduct } from "@/app/actions/pos";
import { formatMoney } from "@/lib/utils";

export default async function ProductsPage() {
  const { organizationId } = await requireSession();
  const [products, categories] = await Promise.all([
    prisma.product.findMany({ where: { organizationId }, include: { category: true }, orderBy: { createdAt: "desc" } }),
    prisma.category.findMany({ where: { organizationId }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div>
      <PageHeader
        title="Products"
        subtitle="Manage your catalog, pricing and stock."
        action={
          <div className="flex gap-2">
            <ModalForm triggerLabel="Category" title="New Category" action={createCategory}>
              <Input name="name" label="Category name" required />
            </ModalForm>
            <ModalForm triggerLabel="Product" title="New Product" action={createProduct}>
              <Input name="name" label="Product name" required />
              <div className="grid grid-cols-2 gap-3">
                <Input name="sku" label="SKU" placeholder="auto if blank" />
                <Input name="unit" label="Unit" defaultValue="unit" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input name="price" label="Sell price" type="number" step="0.01" defaultValue="0" />
                <Input name="cost" label="Cost" type="number" step="0.01" defaultValue="0" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input name="stockQty" label="Opening stock" type="number" step="0.01" defaultValue="0" />
                <Input name="reorderLevel" label="Reorder level" type="number" step="0.01" defaultValue="0" />
              </div>
              <Select name="categoryId" label="Category">
                <option value="">— None —</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </Select>
              <Textarea name="description" label="Description" rows={2} />
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input type="checkbox" name="isRawMaterial" className="rounded border-slate-300" />
                Raw material (used in manufacturing)
              </label>
            </ModalForm>
          </div>
        }
      />

      <Card>
        <Table head={<tr><Th>Product</Th><Th>SKU</Th><Th>Category</Th><Th className="text-right">Price</Th><Th className="text-right">Stock</Th><Th></Th></tr>}>
          {products.length === 0 && <EmptyRow colSpan={6} message="No products yet. Add your first product." />}
          {products.map((p) => (
            <tr key={p.id}>
              <Td className="font-medium text-slate-900">
                {p.name}
                {p.isRawMaterial && <Badge tone="purple">raw</Badge>}
              </Td>
              <Td className="text-slate-500">{p.sku}</Td>
              <Td>{p.category?.name ?? "—"}</Td>
              <Td className="text-right">{formatMoney(p.price)}</Td>
              <Td className="text-right">
                {p.stockQty <= p.reorderLevel && p.reorderLevel > 0 ? (
                  <Badge tone="red">{p.stockQty} {p.unit}</Badge>
                ) : (
                  <span>{p.stockQty} {p.unit}</span>
                )}
              </Td>
              <Td className="text-right">
                <form action={deleteProduct}>
                  <input type="hidden" name="id" value={p.id} />
                  <button className="text-sm text-rose-600 hover:underline">Delete</button>
                </form>
              </Td>
            </tr>
          ))}
        </Table>
      </Card>
    </div>
  );
}
