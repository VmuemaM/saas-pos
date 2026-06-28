import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card, Table, Th, Td, EmptyRow, Badge, PageHeader, Input, Select } from "@/components/ui";
import { ModalForm } from "@/components/modal-form";
import { createEmployee } from "@/app/actions/hrm";
import { formatMoney, formatDate } from "@/lib/utils";

const statusTone: Record<string, "green" | "amber" | "red"> = {
  ACTIVE: "green",
  ON_LEAVE: "amber",
  TERMINATED: "red",
};

export default async function EmployeesPage() {
  const { organizationId } = await requireSession();
  const [employees, departments] = await Promise.all([
    prisma.employee.findMany({ where: { organizationId }, include: { department: true }, orderBy: { createdAt: "desc" } }),
    prisma.department.findMany({ where: { organizationId }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div>
      <PageHeader
        title="Employees"
        subtitle={`${employees.length} people`}
        action={
          <ModalForm triggerLabel="Employee" title="New Employee" action={createEmployee}>
            <div className="grid grid-cols-2 gap-3">
              <Input name="firstName" label="First name" required />
              <Input name="lastName" label="Last name" required />
            </div>
            <Input name="email" label="Email" type="email" />
            <div className="grid grid-cols-2 gap-3">
              <Input name="phone" label="Phone" />
              <Input name="position" label="Position" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input name="salary" label="Monthly salary" type="number" step="0.01" defaultValue="0" />
              <Input name="hireDate" label="Hire date" type="date" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Select name="departmentId" label="Department">
                <option value="">— None —</option>
                {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </Select>
              <Select name="status" label="Status" defaultValue="ACTIVE">
                <option value="ACTIVE">Active</option>
                <option value="ON_LEAVE">On leave</option>
                <option value="TERMINATED">Terminated</option>
              </Select>
            </div>
          </ModalForm>
        }
      />
      <Card>
        <Table head={<tr><Th>Name</Th><Th>Position</Th><Th>Department</Th><Th>Hired</Th><Th className="text-right">Salary</Th><Th>Status</Th></tr>}>
          {employees.length === 0 && <EmptyRow colSpan={6} message="No employees yet." />}
          {employees.map((e) => (
            <tr key={e.id}>
              <Td className="font-medium text-slate-900">{e.firstName} {e.lastName}<div className="text-xs text-slate-400">{e.email}</div></Td>
              <Td>{e.position ?? "—"}</Td>
              <Td>{e.department?.name ?? "—"}</Td>
              <Td className="text-slate-500">{formatDate(e.hireDate)}</Td>
              <Td className="text-right">{formatMoney(e.salary)}</Td>
              <Td><Badge tone={statusTone[e.status]}>{e.status.replace("_", " ").toLowerCase()}</Badge></Td>
            </tr>
          ))}
        </Table>
      </Card>
    </div>
  );
}
