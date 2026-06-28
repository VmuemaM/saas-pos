import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card, Table, Th, Td, EmptyRow, PageHeader } from "@/components/ui";
import { JournalForm } from "@/components/journal-form";
import { formatMoney, formatDate } from "@/lib/utils";

export default async function JournalPage() {
  const { organizationId } = await requireSession();
  const [entries, accounts] = await Promise.all([
    prisma.journalEntry.findMany({
      where: { organizationId },
      include: { lines: { include: { account: true } } },
      orderBy: { date: "desc" },
      take: 100,
    }),
    prisma.account.findMany({ where: { organizationId }, orderBy: { code: "asc" }, select: { id: true, code: true, name: true } }),
  ]);

  return (
    <div>
      <PageHeader title="General Journal" subtitle="Double-entry journal entries." action={<JournalForm accounts={accounts} />} />
      <Card>
        <Table head={<tr><Th>Date</Th><Th>Reference</Th><Th>Description</Th><Th>Accounts</Th><Th className="text-right">Debit</Th><Th className="text-right">Credit</Th></tr>}>
          {entries.length === 0 && <EmptyRow colSpan={6} message="No journal entries yet." />}
          {entries.map((e) => {
            const debit = e.lines.reduce((s, l) => s + l.debit, 0);
            const credit = e.lines.reduce((s, l) => s + l.credit, 0);
            return (
              <tr key={e.id}>
                <Td className="text-slate-500">{formatDate(e.date)}</Td>
                <Td className="font-mono text-slate-500">{e.reference ?? "—"}</Td>
                <Td className="font-medium text-slate-900">{e.description ?? "—"}</Td>
                <Td className="text-xs text-slate-500">
                  {e.lines.map((l) => (
                    <div key={l.id}>{l.account.code} {l.debit > 0 ? `Dr ${formatMoney(l.debit)}` : `Cr ${formatMoney(l.credit)}`}</div>
                  ))}
                </Td>
                <Td className="text-right">{formatMoney(debit)}</Td>
                <Td className="text-right">{formatMoney(credit)}</Td>
              </tr>
            );
          })}
        </Table>
      </Card>
    </div>
  );
}
