import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card, Table, Th, Td, EmptyRow, Badge, PageHeader, Input, Select } from "@/components/ui";
import { ModalForm } from "@/components/modal-form";
import { generatePayroll, setPayrollStatus } from "@/app/actions/hrm";
import { formatMoney, formatDate } from "@/lib/utils";

const tone: Record<string, "slate" | "blue" | "green"> = {
  DRAFT: "slate",
  APPROVED: "blue",
  PAID: "green",
};

export default async function PayrollPage() {
  const { organizationId } = await requireSession();
  const [payrolls, employees] = await Promise.all([
    prisma.payroll.findMany({ where: { organizationId }, include: { employee: true }, orderBy: { createdAt: "desc" } }),
    prisma.employee.findMany({ where: { organizationId, status: "ACTIVE" }, orderBy: { firstName: "asc" } }),
  ]);

  const totalNet = payrolls.reduce((s, p) => s + p.netPay, 0);

  return (
    <div>
      <PageHeader
        title="Payroll"
        subtitle={`Total net processed: ${formatMoney(totalNet)}`}
        action={
          <ModalForm triggerLabel="Run Payroll" title="Generate Payslip" action={generatePayroll}>
            <Select name="employeeId" label="Employee" required>
              <option value="">Select employee…</option>
              {employees.map((e) => <option key={e.id} value={e.id}>{e.firstName} {e.lastName} ({formatMoney(e.salary)})</option>)}
            </Select>
            <div className="grid grid-cols-2 gap-3">
              <Input name="periodStart" label="Period start" type="date" required />
              <Input name="periodEnd" label="Period end" type="date" required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input name="allowances" label="Allowances" type="number" step="0.01" defaultValue="0" />
              <Input name="deductions" label="Deductions" type="number" step="0.01" defaultValue="0" />
            </div>
            <p className="text-xs text-slate-400">Basic salary is taken from the employee record. Tax is estimated at 10% of gross.</p>
          </ModalForm>
        }
      />
      <Card>
        <Table head={<tr><Th>Employee</Th><Th>Period</Th><Th className="text-right">Basic</Th><Th className="text-right">Allow.</Th><Th className="text-right">Deduct.</Th><Th className="text-right">Tax</Th><Th className="text-right">Net Pay</Th><Th>Status</Th><Th className="text-right">Action</Th></tr>}>
          {payrolls.length === 0 && <EmptyRow colSpan={9} message="No payroll runs yet." />}
          {payrolls.map((p) => (
            <tr key={p.id}>
              <Td className="font-medium text-slate-900">{p.employee.firstName} {p.employee.lastName}</Td>
              <Td className="text-slate-500">{formatDate(p.periodStart)} → {formatDate(p.periodEnd)}</Td>
              <Td className="text-right">{formatMoney(p.basicSalary)}</Td>
              <Td className="text-right">{formatMoney(p.allowances)}</Td>
              <Td className="text-right">{formatMoney(p.deductions)}</Td>
              <Td className="text-right">{formatMoney(p.tax)}</Td>
              <Td className="text-right font-medium">{formatMoney(p.netPay)}</Td>
              <Td><Badge tone={tone[p.status]}>{p.status.toLowerCase()}</Badge></Td>
              <Td className="text-right">
                {p.status === "DRAFT" && (
                  <form action={setPayrollStatus}>
                    <input type="hidden" name="id" value={p.id} />
                    <input type="hidden" name="status" value="APPROVED" />
                    <button className="text-sm font-medium text-blue-600 hover:underline">Approve</button>
                  </form>
                )}
                {p.status === "APPROVED" && (
                  <form action={setPayrollStatus}>
                    <input type="hidden" name="id" value={p.id} />
                    <input type="hidden" name="status" value="PAID" />
                    <button className="text-sm font-medium text-emerald-600 hover:underline">Mark paid</button>
                  </form>
                )}
              </Td>
            </tr>
          ))}
        </Table>
      </Card>
    </div>
  );
}
