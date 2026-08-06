import type { Invoice } from "../types";

export const initialInvoices: Invoice[] = [
  {
    id: "INV-1024",
    clientName: "Harrow International School",
    lineItems: [
      { label: "Annual PE curriculum membership", qty: 1, rate: 8400 },
    ],
    amount: 8400,
    issuedAt: "2026-06-12T00:00:00.000Z",
    dueAt: "2026-07-12T00:00:00.000Z",
    status: "Paid",
  },
  {
    id: "INV-1025",
    clientName: "Dulwich College Shanghai",
    lineItems: [
      { label: "Annual PE curriculum membership", qty: 1, rate: 12600 },
    ],
    amount: 12600,
    issuedAt: "2026-07-02T00:00:00.000Z",
    dueAt: "2026-08-02T00:00:00.000Z",
    status: "Paid",
  },
  {
    id: "INV-1026",
    clientName: "Wellington College Bangkok",
    lineItems: [
      { label: "Annual school-sport curriculum membership", qty: 1, rate: 5200 },
    ],
    amount: 5200,
    issuedAt: "2026-07-18T00:00:00.000Z",
    dueAt: "2026-08-18T00:00:00.000Z",
    status: "Pending",
  },
  {
    id: "INV-1027",
    clientName: "British School of Tokyo",
    lineItems: [
      { label: "Annual PE curriculum membership", qty: 1, rate: 9800 },
    ],
    amount: 9800,
    issuedAt: "2026-08-01T00:00:00.000Z",
    dueAt: "2026-09-01T00:00:00.000Z",
    status: "Pending",
  },
  {
    id: "INV-1028",
    clientName: "St. Andrews International School Bangkok",
    lineItems: [
      { label: "Term 2 curriculum add-on pack", qty: 1, rate: 4300 },
    ],
    amount: 4300,
    issuedAt: "2026-05-20T00:00:00.000Z",
    dueAt: "2026-06-20T00:00:00.000Z",
    status: "Overdue",
  },
  {
    id: "INV-1029",
    clientName: "Nord Anglia International School Beijing",
    lineItems: [
      { label: "Annual PE curriculum membership", qty: 1, rate: 15000 },
    ],
    amount: 15000,
    issuedAt: "2026-08-05T00:00:00.000Z",
    dueAt: "2026-09-05T00:00:00.000Z",
    status: "Pending",
  },
];
