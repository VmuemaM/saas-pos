import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card, Table, Th, Td, EmptyRow, PageHeader, Input } from "@/components/ui";
import { ModalForm } from "@/components/modal-form";
import { createDepartment } from "@/app/actions/hrm";

export default async function DepartmentsPage() {
  const { organizationId } = await requireSession();
  const departments = await prisma.department.findMany({
    where: { organizationId },
    include: { _count: { select: { employees: true } } },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <PageHeader
        title="Departments"
        action={
          <ModalForm triggerLabel="Department" title="New Department" action={createDepartment}>
            <Input name="name" label="Department name" required />
          </ModalForm>
        }
      />
      <Card>
        <Table head={<tr><Th>Department</Th><Th className="text-right">Employees</Th></tr>}>
          {departments.length === 0 && <EmptyRow colSpan={2} message="No departments yet." />}
          {departments.map((d) => (
            <tr key={d.id}>
              <Td className="font-medium text-slate-900">{d.name}</Td>
              <Td className="text-right">{d._count.employees}</Td>
            </tr>
          ))}
        </Table>
      </Card>
    </div>
  );
}
