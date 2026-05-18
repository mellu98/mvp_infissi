export interface PdfCompanySettings {
  legalName: string;
  vatNumber: string;
  taxCode: string;
  address: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
  email: string;
  phone: string;
  website?: string | null;
  quoteTerms?: string | null;
  contractTerms?: string | null;
}

export interface PdfCustomer {
  type: string;
  firstName?: string | null;
  lastName?: string | null;
  companyName?: string | null;
  taxCode?: string | null;
  vatNumber?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  province?: string | null;
  postalCode?: string | null;
}

export interface PdfQuoteItem {
  description: string;
  quantity: number;
  widthCm?: number | null;
  heightCm?: number | null;
  lengthCm?: number | null;
  areaMq?: number | null;
  unitPrice: number;
  optionsTotal: number;
  discountPercentage: number;
  subtotal: number;
  vatAmount: number;
  total: number;
  calculationExplanation?: string | null;
}

export interface PdfQuote {
  quoteNumber: string;
  status: string;
  validUntil?: Date | null;
  notes?: string | null;
  subtotal: number;
  discountTotal: number;
  vatTotal: number;
  grandTotal: number;
  vatRate: number;
  createdAt: Date;
  customer: PdfCustomer;
  items: PdfQuoteItem[];
}
