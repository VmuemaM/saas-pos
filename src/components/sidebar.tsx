"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

type NavItem = { href: string; label: string; icon: string };
type NavGroup = { title: string; items: NavItem[] };

const groups: NavGroup[] = [
  {
    title: "Overview",
    items: [{ href: "/dashboard", label: "Dashboard", icon: "▦" }],
  },
  {
    title: "Point of Sale",
    items: [
      { href: "/pos", label: "Terminal", icon: "▣" },
      { href: "/pos/products", label: "Products", icon: "◰" },
      { href: "/pos/inventory", label: "Inventory", icon: "▤" },
      { href: "/pos/sales", label: "Sales", icon: "▥" },
      { href: "/pos/customers", label: "Customers", icon: "◉" },
    ],
  },
  {
    title: "Human Resources",
    items: [
      { href: "/hrm/employees", label: "Employees", icon: "☷" },
      { href: "/hrm/departments", label: "Departments", icon: "▦" },
      { href: "/hrm/attendance", label: "Attendance", icon: "◴" },
      { href: "/hrm/leave", label: "Leave", icon: "◔" },
      { href: "/hrm/payroll", label: "Payroll", icon: "▧" },
    ],
  },
  {
    title: "Accounting",
    items: [
      { href: "/accounting/accounts", label: "Chart of Accounts", icon: "▤" },
      { href: "/accounting/journal", label: "Journal", icon: "▥" },
      { href: "/accounting/invoices", label: "Invoices", icon: "▦" },
      { href: "/accounting/expenses", label: "Expenses", icon: "◧" },
      { href: "/accounting/reports", label: "Reports", icon: "◫" },
    ],
  },
  {
    title: "Manufacturing",
    items: [
      { href: "/manufacturing/bom", label: "Bills of Materials", icon: "▣" },
      { href: "/manufacturing/work-orders", label: "Work Orders", icon: "⚙" },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-slate-200 bg-white">
      <div className="flex h-16 items-center gap-2 border-b border-slate-100 px-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-sm font-bold text-white">N</div>
        <span className="text-lg font-bold text-slate-900">NexusERP</span>
      </div>
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {groups.map((group) => (
          <div key={group.title} className="mb-5">
            <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
              {group.title}
            </p>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const active =
                  item.href === "/dashboard" || item.href === "/pos"
                    ? pathname === item.href
                    : pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition",
                        active
                          ? "bg-blue-50 text-blue-700"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
                      )}
                    >
                      <span className="text-base">{item.icon}</span>
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}
