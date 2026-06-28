import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card, CardHeader, Table, Th, Td, StatCard, PageHeader } from "@/components/ui";
import { formatMoney } from "@/lib/utils";
import type { AccountType } from "@prisma/client";

export default async function ReportsPage() {
  const { organizationId } = await requireSession();
  const accounts = await prisma.account.findMany({
    where: { organizationId },
    include: { journalLines: { select: { debit: true, credit: true } } },
    orderBy: { code: "asc" },
  });

  const rows = accounts.map((a) => {
    const debit = a.journalLines.reduce((s, l) => s + l.debit, 0);
    const credit = a.journalLines.reduce((s, l) => s + l.credit, 0);
    const normalDebit = a.type === "ASSET" || a.type === "EXPENSE";
    const balance = normalDebit ? debit - credit : credit - debit;
    return { code: a.code, name: a.name, type: a.type, debit, credit, balance };
  });

  const sumByType = (t: AccountType) => rows.filter((r) => r.type === t).reduce((s, r) => s + r.balance, 0);
  const revenue = sumByType("REVENUE");
  const expenses = sumByType("EXPENSE");
  const netProfit = revenue - expenses;
  const assets = sumByType("ASSET");
  const liabilities = sumByType("LIABILITY");
  const equity = sumByType("EQUITY");

  const totalDebit = rows.reduce((s, r) => s + r.debit, 0);
  const totalCredit = rows.reduce((s, r) => s + r.credit, 0);

  const section = (type: AccountType) => rows.filter((r) => r.type === type && r.balance !== 0);

  return (
    <div>
      <PageHeader title="Financial Reports" subtitle="Live from your general ledger." />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Revenue" value={formatMoney(revenue)} tone="green" />
        <StatCard label="Expenses" value={formatMoney(expenses)} tone="red" />
        <StatCard label="Net Profit" value={formatMoney(netProfit)} tone={netProfit >= 0 ? "green" : "red"} />
        <StatCard label="Total Assets" value={formatMoney(assets)} tone="blue" />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Profit & Loss" />
          <div className="px-5 py-4 text-sm">
            <p className="mb-2 font-semibold text-slate-700">Revenue</p>
            {section("REVENUE").map((r) => (
              <div key={r.code} className="flex justify-between py-1 text-slate-600"><span>{r.name}</span><span>{formatMoney(r.balance)}</span></div>
            ))}
            <div className="flex justify-between border-t border-slate-100 py-1 font-medium"><span>Total Revenue</span><span>{formatMoney(revenue)}</span></div>
            <p className="mb-2 mt-4 font-semibold text-slate-700">Expenses</p>
            {section("EXPENSE").map((r) => (
              <div key={r.code} className="flex justify-between py-1 text-slate-600"><span>{r.name}</span><span>{formatMoney(r.balance)}</span></div>
            ))}
            <div className="flex justify-between border-t border-slate-100 py-1 font-medium"><span>Total Expenses</span><span>{formatMoney(expenses)}</span></div>
            <div className="mt-3 flex justify-between rounded-lg bg-slate-50 px-3 py-2 text-base font-bold text-slate-900">
              <span>Net Profit</span><span>{formatMoney(netProfit)}</span>
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader title="Balance Sheet" />
          <div className="px-5 py-4 text-sm">
            <p className="mb-2 font-semibold text-slate-700">Assets</p>
            {section("ASSET").map((r) => (
              <div key={r.code} className="flex justify-between py-1 text-slate-600"><span>{r.name}</span><span>{formatMoney(r.balance)}</span></div>
            ))}
            <div className="flex justify-between border-t border-slate-100 py-1 font-medium"><span>Total Assets</span><span>{formatMoney(assets)}</span></div>
            <p className="mb-2 mt-4 font-semibold text-slate-700">Liabilities</p>
            {section("LIABILITY").map((r) => (
              <div key={r.code} className="flex justify-between py-1 text-slate-600"><span>{r.name}</span><span>{formatMoney(r.balance)}</span></div>
            ))}
            <div className="flex justify-between border-t border-slate-100 py-1 font-medium"><span>Total Liabilities</span><span>{formatMoney(liabilities)}</span></div>
            <p className="mb-2 mt-4 font-semibold text-slate-700">Equity</p>
            {section("EQUITY").map((r) => (
              <div key={r.code} className="flex justify-between py-1 text-slate-600"><span>{r.name}</span><span>{formatMoney(r.balance)}</span></div>
            ))}
            <div className="mt-3 flex justify-between rounded-lg bg-slate-50 px-3 py-2 text-base font-bold text-slate-900">
              <span>Liabilities + Equity + Profit</span><span>{formatMoney(liabilities + equity + netProfit)}</span>
            </div>
          </div>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader title="Trial Balance" />
        <Table head={<tr><Th>Code</Th><Th>Account</Th><Th className="text-right">Debit</Th><Th className="text-right">Credit</Th></tr>}>
          {rows.map((r) => (
            <tr key={r.code}>
              <Td className="font-mono text-slate-500">{r.code}</Td>
              <Td className="font-medium text-slate-900">{r.name}</Td>
              <Td className="text-right">{formatMoney(r.debit)}</Td>
              <Td className="text-right">{formatMoney(r.credit)}</Td>
            </tr>
          ))}
          <tr className="bg-slate-50 font-bold">
            <Td></Td><Td>Total</Td>
            <Td className="text-right">{formatMoney(totalDebit)}</Td>
            <Td className="text-right">{formatMoney(totalCredit)}</Td>
          </tr>
        </Table>
      </Card>
    </div>
  );
}
