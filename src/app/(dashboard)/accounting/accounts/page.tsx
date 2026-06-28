import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card, Table, Th, Td, EmptyRow, Badge, PageHeader, Input, Select } from "@/components/ui";
import { ModalForm } from "@/components/modal-form";
import { createAccount } from "@/app/actions/accounting";
import { formatMoney } from "@/lib/utils";

const typeTone: Record<string, "blue" | "red" | "purple" | "green" | "amber"> = {
  ASSET: "blue",
  LIABILITY: "red",
  EQUITY: "purple",
  REVENUE: "green",
  EXPENSE: "amber",
};

export default async function AccountsPage() {
  const { organizationId } = await requireSession();
  const accounts = await prisma.account.findMany({
    where: { organizationId },
    include: { journalLines: { select: { debit: true, credit: true } } },
    orderBy: { code: "asc" },
  });

  const withBalance = accounts.map((a) => {
    const debit = a.journalLines.reduce((s, l) => s + l.debit, 0);
    const credit = a.journalLines.reduce((s, l) => s + l.credit, 0);
    const normalDebit = a.type === "ASSET" || a.type === "EXPENSE";
    const balance = normalDebit ? debit - credit : credit - debit;
    return { ...a, balance };
  });

  return (
    <div>
      <PageHeader
        title="Chart of Accounts"
        subtitle="Your general ledger accounts."
        action={
          <ModalForm triggerLabel="Account" title="New Account" action={createAccount}>
            <div className="grid grid-cols-2 gap-3">
              <Input name="code" label="Code" placeholder="e.g. 6500" required />
              <Select name="type" label="Type" required>
                <option value="ASSET">Asset</option>
                <option value="LIABILITY">Liability</option>
                <option value="EQUITY">Equity</option>
                <option value="REVENUE">Revenue</option>
                <option value="EXPENSE">Expense</option>
              </Select>
            </div>
            <Input name="name" label="Account name" required />
          </ModalForm>
        }
      />
      <Card>
        <Table head={<tr><Th>Code</Th><Th>Name</Th><Th>Type</Th><Th className="text-right">Balance</Th></tr>}>
          {withBalance.length === 0 && <EmptyRow colSpan={4} />}
          {withBalance.map((a) => (
            <tr key={a.id}>
              <Td className="font-mono text-slate-500">{a.code}</Td>
              <Td className="font-medium text-slate-900">{a.name}</Td>
              <Td><Badge tone={typeTone[a.type]}>{a.type.toLowerCase()}</Badge></Td>
              <Td className="text-right font-medium">{formatMoney(a.balance)}</Td>
            </tr>
          ))}
        </Table>
      </Card>
    </div>
  );
}
