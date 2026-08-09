import { Invoice } from '../types';

export const INITIAL_INVOICES: Invoice[] = [
  {
    id: 'inv-1',
    supplierName: 'Lian Seng Steel Pte Ltd',
    invoiceNumber: 'INV-2026-8801',
    invoiceDate: '2026-06-25',
    dueDate: '2026-07-25',
    amountPayable: 14500.00,
    paymentStatus: 'Pending Review',
    category: 'Structural Steel Rebars',
    notes: 'Credit terms Net 30. High volume steel shipment for Jurong site.'
  },
  {
    id: 'inv-2',
    supplierName: 'Apex Fasteners & Tools Pte Ltd',
    invoiceNumber: 'APX-9942',
    invoiceDate: '2026-07-02',
    dueDate: '2026-08-01',
    amountPayable: 3280.50,
    paymentStatus: 'Pending Review',
    category: 'Stainless Bolts & Masonry Anchors',
    notes: 'Regular hardware restock for Woodlands warehouse.'
  },
  {
    id: 'inv-3',
    supplierName: 'Golden Dragon Building Materials',
    invoiceNumber: 'GDBM-4012',
    invoiceDate: '2026-07-04',
    dueDate: '2026-08-03',
    amountPayable: 8900.00,
    paymentStatus: 'Pending Review',
    category: 'Portland Cement & Plaster Mixes',
    notes: 'Early payment discount eligible if settled before Aug 5.'
  },
  {
    id: 'inv-4',
    supplierName: 'Eastern Cement Supplies Ltd',
    invoiceNumber: 'ECS-8820',
    invoiceDate: '2026-06-28',
    dueDate: '2026-07-28',
    amountPayable: 12400.00,
    paymentStatus: 'Pending Review',
    category: 'Ready-Mix Concrete Additives',
    notes: 'Supplier called regarding pending payment.'
  },
  {
    id: 'inv-5',
    supplierName: 'Kian Heng Power Tools & Machinery',
    invoiceNumber: 'KH-7731',
    invoiceDate: '2026-07-07',
    dueDate: '2026-08-06',
    amountPayable: 5120.00,
    paymentStatus: 'Pending Review',
    category: 'Angle Grinders & Rotary Hammers',
    notes: 'Standard 30-day term.'
  },
  {
    id: 'inv-6',
    supplierName: 'Nippon Paint Singapore Co. Pte Ltd',
    invoiceNumber: 'NP-10492',
    invoiceDate: '2026-07-19',
    dueDate: '2026-08-18',
    amountPayable: 4650.00,
    paymentStatus: 'Pending Review',
    category: 'Anti-Rust Industrial Primer',
    notes: 'Batch order for hardware retail store.'
  },
  {
    id: 'inv-7',
    supplierName: 'Seng Choon Plumbing Supplies',
    invoiceNumber: 'SCP-5510',
    invoiceDate: '2026-07-25',
    dueDate: '2026-08-25',
    amountPayable: 6780.00,
    paymentStatus: 'Pending Review',
    category: 'Copper Tubes & Brass Gate Valves',
    notes: 'Delivery verified at main depot.'
  },
  {
    id: 'inv-8',
    supplierName: 'Pacific Hardware Distributors',
    invoiceNumber: 'PHD-3021',
    invoiceDate: '',
    dueDate: '',
    amountPayable: null,
    paymentStatus: 'Pending Review',
    category: 'Heavy Duty Door Hinges & Locks',
    notes: 'Delivery note received without formal invoice due date or total amount.'
  }
];
