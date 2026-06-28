import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card, Table, Th, Td, EmptyRow, Badge, PageHeader, Input, Select } from "@/components/ui";
import { ModalForm } from "@/components/modal-form";
import { recordAttendance } from "@/app/actions/hrm";
import { formatDate } from "@/lib/utils";

const tone: Record<string, "green" | "red" | "amber" | "blue"> = {
  PRESENT: "green",
  ABSENT: "red",
  LATE: "amber",
  HALF_DAY: "blue",
};

export default async function AttendancePage() {
  const { organizationId } = await requireSession();
  const [records, employees] = await Promise.all([
    prisma.attendance.findMany({ where: { organizationId }, include: { employee: true }, orderBy: { date: "desc" }, take: 100 }),
    prisma.employee.findMany({ where: { organizationId, status: { not: "TERMINATED" } }, orderBy: { firstName: "asc" } }),
  ]);

  return (
    <div>
      <PageHeader
        title="Attendance"
        action={
          <ModalForm triggerLabel="Record" title="Record Attendance" action={recordAttendance}>
            <Select name="employeeId" label="Employee" required>
              <option value="">Select employee…</option>
              {employees.map((e) => <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>)}
            </Select>
            <Input name="date" label="Date" type="date" />
            <Select name="status" label="Status" defaultValue="PRESENT">
              <option value="PRESENT">Present</option>
              <option value="ABSENT">Absent</option>
              <option value="LATE">Late</option>
              <option value="HALF_DAY">Half day</option>
            </Select>
          </ModalForm>
        }
      />
      <Card>
        <Table head={<tr><Th>Employee</Th><Th>Date</Th><Th>Status</Th></tr>}>
          {records.length === 0 && <EmptyRow colSpan={3} message="No attendance records yet." />}
          {records.map((r) => (
            <tr key={r.id}>
              <Td className="font-medium text-slate-900">{r.employee.firstName} {r.employee.lastName}</Td>
              <Td className="text-slate-500">{formatDate(r.date)}</Td>
              <Td><Badge tone={tone[r.status]}>{r.status.replace("_", " ").toLowerCase()}</Badge></Td>
            </tr>
          ))}
        </Table>
      </Card>
    </div>
  );
}
