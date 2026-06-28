import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card, Table, Th, Td, EmptyRow, PageHeader, Input, Select } from "@/components/ui";
import { ModalForm } from "@/components/modal-form";
import { createExpense } from "@/app/actions/accounting";
import { formatMoney, formatDate } from "@/lib/utils";

export default async function ExpensesPage() {
  const { organizationId } = await requireSession();
  const [expenses, accounts] = await Promise.all([
    prisma.expense.findMany({ where: { organizationId }, include: { account: true }, orderBy: { date: "desc" } }),
    prisma.account.findMany({ where: { organizationId, type: "EXPENSE" }, orderBy: { code: "asc" } }),
  ]);

  const total = expenses.reduce((s, e) => s + e.amount, 0);

  return (
    <div>
      <PageHeader
        title="Expenses"
        subtitle={`Total: ${formatMoney(total)}`}
        action={
          <ModalForm triggerLabel="Expense" title="Record Expense" action={createExpense}>
            <div className="grid grid-cols-2 gap-3">
              <Input name="date" label="Date" type="date" />
              <Input name="amount" label="Amount" type="number" step="0.01" required />
            </div>
            <Input name="vendor" label="Vendor" />
            <Input name="category" label="Category" placeholder="e.g. Travel" />
            <Select name="accountId" label="Expense account">
              <option value="">— None —</option>
              {accounts.map((a) => <option key={a.id} value={a.id}>{a.code} · {a.name}</option>)}
            </Select>
            <Input name="description" label="Description" />
          </ModalForm>
        }
      />
      <Card>
        <Table head={<tr><Th>Date</Th><Th>Vendor</Th><Th>Category</Th><Th>Account</Th><Th className="text-right">Amount</Th></tr>}>
          {expenses.length === 0 && <EmptyRow colSpan={5} message="No expenses recorded yet." />}
          {expenses.map((e) => (
            <tr key={e.id}>
              <Td className="text-slate-500">{formatDate(e.date)}</Td>
              <Td className="font-medium text-slate-900">{e.vendor ?? "—"}</Td>
              <Td>{e.category ?? "—"}</Td>
              <Td className="text-slate-500">{e.account?.name ?? "—"}</Td>
              <Td className="text-right font-medium">{formatMoney(e.amount)}</Td>
            </tr>
          ))}
        </Table>
      </Card>
    </div>
  );
}
