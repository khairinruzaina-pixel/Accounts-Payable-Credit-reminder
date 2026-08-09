export type PaymentStatus = 'Pending Review' | 'Approved' | 'Paid' | 'On Hold';

export type StatusCategory =
  | 'Overdue'
  | 'Due Today'
  | 'Due within 3 Days'
  | 'Due within 7 Days'
  | 'Not Yet Due';

export type PriorityLevel = 'High' | 'Medium' | 'Low' | 'No Action';

export interface PaymentReceipt {
  receiptNumber: string;
  paymentDate: string;
  amountPaid: number;
  bankRef?: string;
  fileName: string;
  fileDataUrl?: string;
  verified: boolean;
  verificationStatus: 'Verified' | 'Discrepancy' | 'Unverified';
  uploadedAt: string;
  uploadedBy: string;
}

export interface Invoice {
  id: string;
  supplierName: string;
  invoiceNumber: string;
  invoiceDate: string; // YYYY-MM-DD
  dueDate: string;     // YYYY-MM-DD
  amountPayable: number | null; // SGD
  paymentStatus: PaymentStatus;
  category?: string;
  notes?: string;
  missingFields?: string[];
  paymentReceipt?: PaymentReceipt;
}

export interface InvoiceEvaluation {
  invoice: Invoice;
  daysRemaining: number | null;
  statusCategory: StatusCategory;
  priority: PriorityLevel;
  reason: string;
  recommendation: string;
  businessImpact?: string;
  hasMissingInfo: boolean;
  missingInfoDetails?: string;
}

export interface SummaryStats {
  totalInvoices: number;
  numberOverdue: number;
  numberDueToday: number;
  numberDue3Days: number;
  numberDue7Days: number;
  totalAmountAttention: number; // Overdue + Due Today + Due within 3 Days + Due within 7 Days
  totalAmountPayableAll: number;
  totalOverdueAmount: number;
  totalUpcomingAmount: number; // 0-7 days
  highestPrioritySupplier: string;
  invoicesActionToday: number;
}

export type AuditActionType =
  | 'Created'
  | 'Approved'
  | 'Payment Approved'
  | 'Paid'
  | 'Marked as Paid'
  | 'Receipt Uploaded'
  | 'Payment Verified'
  | 'Edited'
  | 'Put On Hold'
  | 'Reminder Generated'
  | 'Reminder Viewed'
  | 'Payment Reviewed'
  | 'Excel Import'
  | 'Cleared All';

export interface AuditLog {
  id: string;
  timestamp: string;
  invoiceNumber: string;
  supplierName: string;
  action: AuditActionType;
  performedBy: string;
  notes?: string;
}

export interface User {
  username: string;
  name: string;
  role: string;
  avatarUrl?: string;
}

