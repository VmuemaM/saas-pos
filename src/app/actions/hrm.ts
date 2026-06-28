"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireOrg } from "@/lib/auth";
import { parseNumber, parseString } from "@/lib/utils";
import type { AttendanceStatus, EmployeeStatus, LeaveStatus, LeaveType, PayrollStatus } from "@prisma/client";

export async function createDepartment(formData: FormData) {
  const { organizationId } = await requireOrg();
  const name = parseString(formData.get("name"));
  if (!name) return;
  await prisma.department.create({ data: { name, organizationId } });
  revalidatePath("/hrm/departments");
}

export async function createEmployee(formData: FormData) {
  const { organizationId } = await requireOrg();
  const firstName = parseString(formData.get("firstName"));
  const lastName = parseString(formData.get("lastName"));
  const email = parseString(formData.get("email"));
  if (!firstName || !lastName) return;
  const departmentId = parseString(formData.get("departmentId")) || null;
  const hireDate = parseString(formData.get("hireDate"));
  await prisma.employee.create({
    data: {
      firstName,
      lastName,
      email,
      phone: parseString(formData.get("phone")) || null,
      position: parseString(formData.get("position")) || null,
      salary: parseNumber(formData.get("salary")),
      hireDate: hireDate ? new Date(hireDate) : new Date(),
      status: (parseString(formData.get("status")) || "ACTIVE") as EmployeeStatus,
      departmentId,
      organizationId,
    },
  });
  revalidatePath("/hrm/employees");
}

export async function recordAttendance(formData: FormData) {
  const { organizationId } = await requireOrg();
  const employeeId = parseString(formData.get("employeeId"));
  if (!employeeId) return;
  const dateStr = parseString(formData.get("date"));
  await prisma.attendance.create({
    data: {
      employeeId,
      date: dateStr ? new Date(dateStr) : new Date(),
      status: (parseString(formData.get("status")) || "PRESENT") as AttendanceStatus,
      organizationId,
    },
  });
  revalidatePath("/hrm/attendance");
}

export async function createLeave(formData: FormData) {
  const { organizationId } = await requireOrg();
  const employeeId = parseString(formData.get("employeeId"));
  const startDate = parseString(formData.get("startDate"));
  const endDate = parseString(formData.get("endDate"));
  if (!employeeId || !startDate || !endDate) return;
  await prisma.leaveRequest.create({
    data: {
      employeeId,
      type: (parseString(formData.get("type")) || "ANNUAL") as LeaveType,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      reason: parseString(formData.get("reason")) || null,
      organizationId,
    },
  });
  revalidatePath("/hrm/leave");
}

export async function setLeaveStatus(formData: FormData) {
  const { organizationId } = await requireOrg();
  const id = parseString(formData.get("id"));
  const status = parseString(formData.get("status")) as LeaveStatus;
  const leave = await prisma.leaveRequest.findFirst({ where: { id, organizationId } });
  if (!leave) return;
  await prisma.leaveRequest.update({ where: { id }, data: { status } });
  if (status === "APPROVED") {
    await prisma.employee.update({ where: { id: leave.employeeId }, data: { status: "ON_LEAVE" } });
  }
  revalidatePath("/hrm/leave");
}

export async function generatePayroll(formData: FormData) {
  const { organizationId } = await requireOrg();
  const employeeId = parseString(formData.get("employeeId"));
  const periodStart = parseString(formData.get("periodStart"));
  const periodEnd = parseString(formData.get("periodEnd"));
  if (!employeeId || !periodStart || !periodEnd) return;
  const employee = await prisma.employee.findFirst({ where: { id: employeeId, organizationId } });
  if (!employee) return;
  const basicSalary = employee.salary;
  const allowances = parseNumber(formData.get("allowances"));
  const deductions = parseNumber(formData.get("deductions"));
  const gross = basicSalary + allowances;
  const tax = gross * 0.1; // simple 10% PAYE estimate
  const netPay = gross - deductions - tax;
  await prisma.payroll.create({
    data: {
      employeeId,
      periodStart: new Date(periodStart),
      periodEnd: new Date(periodEnd),
      basicSalary,
      allowances,
      deductions,
      tax,
      netPay,
      organizationId,
    },
  });
  revalidatePath("/hrm/payroll");
}

export async function setPayrollStatus(formData: FormData) {
  const { organizationId } = await requireOrg();
  const id = parseString(formData.get("id"));
  const status = parseString(formData.get("status")) as PayrollStatus;
  const payroll = await prisma.payroll.findFirst({ where: { id, organizationId }, include: { employee: true } });
  if (!payroll) return;
  await prisma.payroll.update({ where: { id }, data: { status } });

  // Post to accounting when paid: debit Salaries expense, credit Cash
  if (status === "PAID") {
    const [salaryAcc, cashAcc] = await Promise.all([
      prisma.account.findFirst({ where: { organizationId, code: "6000" } }),
      prisma.account.findFirst({ where: { organizationId, code: "1000" } }),
    ]);
    if (salaryAcc && cashAcc) {
      await prisma.journalEntry.create({
        data: {
          organizationId,
          reference: `PAY-${id.slice(-6)}`,
          description: `Payroll ${payroll.employee.firstName} ${payroll.employee.lastName}`,
          lines: {
            create: [
              { accountId: salaryAcc.id, debit: payroll.netPay, credit: 0 },
              { accountId: cashAcc.id, debit: 0, credit: payroll.netPay },
            ],
          },
        },
      });
    }
  }
  revalidatePath("/hrm/payroll");
}
