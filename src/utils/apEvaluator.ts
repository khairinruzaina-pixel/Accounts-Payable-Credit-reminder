import {
  Invoice,
  InvoiceEvaluation,
  PriorityLevel,
  StatusCategory,
  SummaryStats
} from '../types';

/**
 * Parses date strings in DD/MM/YYYY, YYYY-MM-DD or standard formats
 * without confusing DD/MM/YYYY with MM/DD/YYYY.
 */
export function parseDateStringToDate(dateStr: string): Date | null {
  if (!dateStr || typeof dateStr !== 'string') return null;
  const cleanStr = dateStr.trim().split('T')[0].split(' ')[0];

  // Pattern 1: YYYY-MM-DD or YYYY/MM/DD
  const isoMatch = cleanStr.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
  if (isoMatch) {
    const year = parseInt(isoMatch[1], 10);
    const month = parseInt(isoMatch[2], 10) - 1;
    const day = parseInt(isoMatch[3], 10);
    const d = new Date(year, month, day, 0, 0, 0, 0);
    if (!isNaN(d.getTime())) return d;
  }

  // Pattern 2: DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY (Singapore / UK format)
  const dmyMatch = cleanStr.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
  if (dmyMatch) {
    const day = parseInt(dmyMatch[1], 10);
    const month = parseInt(dmyMatch[2], 10) - 1;
    const year = parseInt(dmyMatch[3], 10);
    const d = new Date(year, month, day, 0, 0, 0, 0);
    if (!isNaN(d.getTime())) return d;
  }

  // Fallback parsing
  const fallback = new Date(cleanStr);
  if (!isNaN(fallback.getTime())) {
    return new Date(fallback.getFullYear(), fallback.getMonth(), fallback.getDate(), 0, 0, 0, 0);
  }

  return null;
}

/**
 * Calculates calendar day difference (dueDate - asOfDate)
 */
export function getDaysRemaining(dueDateStr: string, asOfDateStr: string): number | null {
  if (!dueDateStr || !asOfDateStr) return null;

  const due = parseDateStringToDate(dueDateStr);
  const asOf = parseDateStringToDate(asOfDateStr);

  if (!due || !asOf) return null;

  // Use UTC timestamps at midnight to prevent timezone offset shifts
  const utcDue = Date.UTC(due.getFullYear(), due.getMonth(), due.getDate());
  const utcAsOf = Date.UTC(asOf.getFullYear(), asOf.getMonth(), asOf.getDate());

  const diffMs = utcDue - utcAsOf;
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Formats currency in SGD format
 */
export function formatCurrency(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return 'SGD - (Missing)';
  }
  return new Intl.NumberFormat('en-SG', {
    style: 'currency',
    currency: 'SGD',
    minimumFractionDigits: 2
  }).format(amount);
}

/**
 * Validates invoice record fields to detect missing required details
 */
export function checkMissingFields(invoice: Invoice): string[] {
  const missing: string[] = [];
  if (!invoice.supplierName || !invoice.supplierName.trim()) {
    missing.push('Supplier Name');
  }
  if (!invoice.invoiceNumber || !invoice.invoiceNumber.trim()) {
    missing.push('Invoice Number');
  }
  if (!invoice.invoiceDate || !invoice.invoiceDate.trim()) {
    missing.push('Invoice Date');
  }
  if (!invoice.dueDate || !invoice.dueDate.trim()) {
    missing.push('Due Date');
  }
  if (
    invoice.amountPayable === null ||
    invoice.amountPayable === undefined ||
    isNaN(invoice.amountPayable) ||
    invoice.amountPayable <= 0
  ) {
    missing.push('Amount Payable');
  }
  return missing;
}

/**
 * Evaluates a single invoice record based on Boon Huat Hardware AP Rules
 */
export function evaluateInvoice(
  invoice: Invoice,
  asOfDate: string = '2026-08-01'
): InvoiceEvaluation {
  const missing = checkMissingFields(invoice);
  const hasMissingInfo = missing.length > 0;
  const daysRemaining = getDaysRemaining(invoice.dueDate, asOfDate);

  // Rule 4: If invoice is already marked "Paid", do NOT classify as overdue even if due date passed
  if (invoice.paymentStatus === 'Paid') {
    return {
      invoice,
      daysRemaining,
      statusCategory: 'Not Yet Due',
      priority: 'No Action',
      reason: `Invoice ${invoice.invoiceNumber || 'record'} has been settled and paid in full. Record retained for accounting audit.`,
      recommendation: 'No action required (Payment completed).',
      hasMissingInfo: false
    };
  }

  // Handle Missing Information explicitly
  if (hasMissingInfo) {
    const missingDetails = `Missing information: ${missing.join(', ')}.`;
    return {
      invoice,
      daysRemaining: null,
      statusCategory: 'Not Yet Due',
      priority: 'High',
      reason: `${missingDetails} Exact payment due date or amount cannot be calculated without guessing.`,
      recommendation: 'Review invoice before payment — Contact supplier to obtain missing details.',
      hasMissingInfo: true,
      missingInfoDetails: missingDetails
    };
  }

  // Days remaining guarantee non-null here
  const days = daysRemaining as number;

  let statusCategory: StatusCategory;
  let priority: PriorityLevel;
  let reason: string;
  let recommendation: string;
  let businessImpact: string | undefined = undefined;

  // OVERDUE LOGIC:
  // If Due Date < As Of Date (days < 0) AND Payment Status is NOT "Paid":
  // Status = "Overdue", Priority = "High"
  if (days < 0) {
    statusCategory = 'Overdue';
    priority = 'High';
    const absDays = Math.abs(days);
    businessImpact = `Invoice is overdue by ${absDays} day${absDays > 1 ? 's' : ''}. Immediate payment is recommended to avoid late penalties, damaged supplier trust, or credit hold.`;
    reason = `Overdue by ${absDays} day${absDays > 1 ? 's' : ''} (Due Date: ${invoice.dueDate}). Payment deadline has passed.`;
    recommendation = 'Prepare immediate payment voucher for Madam Lim approval.';
  } else if (days === 0) {
    // If Due Date === As Of Date: Status = "Due Today", Priority = "High"
    statusCategory = 'Due Today';
    priority = 'High';
    businessImpact = `Invoice is due today. Immediate processing prevents payment delay and maintains credit standing.`;
    reason = `Due Date is today (${invoice.dueDate}). Outstanding balance requires same-day authorization.`;
    recommendation = 'Process same-day authorization and GIRO/FAST payment.';
  } else if (days <= 3) {
    statusCategory = 'Due within 3 Days';
    priority = 'Medium';
    businessImpact = `Invoice due in ${days} day${days > 1 ? 's' : ''}. Early arrangement ensures timely clearance before bank cutoff.`;
    reason = `Due Date is within 3 days (${invoice.dueDate}). Days remaining: ${days}.`;
    recommendation = 'Review payment voucher and schedule disbursement.';
  } else if (days <= 7) {
    statusCategory = 'Due within 7 Days';
    priority = 'Low';
    businessImpact = `Invoice due in ${days} days. Standard payment run window.`;
    reason = `Due Date is within 7 days (${invoice.dueDate}). Days remaining: ${days}.`;
    recommendation = 'Queue for upcoming weekly payment batch.';
  } else {
    statusCategory = 'Not Yet Due';
    priority = 'No Action';
    businessImpact = `Payment scheduled beyond 7 days. No immediate cash outflow needed.`;
    reason = `Due Date is more than 7 days away (${invoice.dueDate}). Days remaining: ${days}.`;
    recommendation = 'No action required at this time.';
  }

  return {
    invoice,
    daysRemaining: days,
    statusCategory,
    priority,
    reason,
    recommendation,
    businessImpact,
    hasMissingInfo: false
  };
}

/**
 * Calculates aggregate summary stats for Madam Lim
 */
export function calculateSummaryStats(
  evaluations: InvoiceEvaluation[]
): SummaryStats {
  let totalInvoices = evaluations.length;
  let numberOverdue = 0;
  let numberDueToday = 0;
  let numberDue3Days = 0;
  let numberDue7Days = 0;
  let totalAmountAttention = 0;
  let totalAmountPayableAll = 0;
  let totalOverdueAmount = 0;
  let totalUpcomingAmount = 0;
  let invoicesActionToday = 0;

  const supplierAmounts: Record<string, number> = {};

  evaluations.forEach((evalItem) => {
    const inv = evalItem.invoice;
    if (inv.paymentStatus === 'Paid') return;

    const amount = inv.amountPayable || 0;
    totalAmountPayableAll += amount;

    const supplier = inv.supplierName || 'Unknown';

    if (evalItem.statusCategory === 'Overdue') {
      numberOverdue++;
      totalOverdueAmount += amount;
      totalAmountAttention += amount;
      invoicesActionToday++;
      supplierAmounts[supplier] = (supplierAmounts[supplier] || 0) + amount * 1.5; // weight overdue
    } else if (evalItem.statusCategory === 'Due Today') {
      numberDueToday++;
      totalUpcomingAmount += amount;
      totalAmountAttention += amount;
      invoicesActionToday++;
      supplierAmounts[supplier] = (supplierAmounts[supplier] || 0) + amount * 1.2;
    } else if (evalItem.statusCategory === 'Due within 3 Days') {
      numberDue3Days++;
      totalUpcomingAmount += amount;
      totalAmountAttention += amount;
      supplierAmounts[supplier] = (supplierAmounts[supplier] || 0) + amount;
    } else if (evalItem.statusCategory === 'Due within 7 Days') {
      numberDue7Days++;
      totalUpcomingAmount += amount;
      totalAmountAttention += amount;
      supplierAmounts[supplier] = (supplierAmounts[supplier] || 0) + amount * 0.8;
    } else if (evalItem.hasMissingInfo) {
      invoicesActionToday++;
      totalAmountAttention += amount;
      supplierAmounts[supplier] = (supplierAmounts[supplier] || 0) + amount;
    }
  });

  // Find supplier with highest priority attention amount
  let highestPrioritySupplier = 'None';
  let maxWeight = 0;
  Object.entries(supplierAmounts).forEach(([supp, weight]) => {
    if (weight > maxWeight) {
      maxWeight = weight;
      highestPrioritySupplier = supp;
    }
  });

  return {
    totalInvoices,
    numberOverdue,
    numberDueToday,
    numberDue3Days,
    numberDue7Days,
    totalAmountAttention,
    totalAmountPayableAll,
    totalOverdueAmount,
    totalUpcomingAmount,
    highestPrioritySupplier,
    invoicesActionToday
  };
}
