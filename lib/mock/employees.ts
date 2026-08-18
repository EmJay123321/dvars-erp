import type { Employee } from "../types";

export const initialEmployees: Employee[] = [
  {
    id: "emp-sarah",
    name: "Sarah Chen",
    email: "admin@pathways.com",
    password: "demo1234",
    role: "Admin",
    status: "Active",
    department: "Operations",
    createdAt: "2023-01-15T09:00:00.000Z",
  },
  {
    id: "emp-maya",
    name: "Maya Patel",
    email: "maya@pathways.com",
    password: "demo1234",
    role: "Employee",
    status: "Active",
    department: "Curriculum",
    createdAt: "2023-03-02T09:00:00.000Z",
    pinnedInTeamPermissions: true,
  },
];

export const salaryByEmployeeId: Record<string, number> = {
  "emp-sarah": 5200,
  "emp-maya": 3800,
};
