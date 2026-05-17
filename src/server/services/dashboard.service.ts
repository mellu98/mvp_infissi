import { prisma } from '@/lib/db';

export async function getDashboardStats(companyId: string) {
  const [
    customerCount,
    quoteCount,
    quoteDraftCount,
    quoteSentCount,
    quoteAcceptedCount,
    quoteValueAgg,
    pricelistReviewCount,
    productActiveCount,
    recentCustomers,
    recentQuotes,
  ] = await Promise.all([
    prisma.customer.count({ where: { companyId } }),
    prisma.quote.count({ where: { companyId } }),
    prisma.quote.count({ where: { companyId, status: 'DRAFT' } }),
    prisma.quote.count({ where: { companyId, status: 'SENT' } }),
    prisma.quote.count({ where: { companyId, status: 'ACCEPTED' } }),
    prisma.quote.aggregate({
      where: { companyId },
      _sum: { grandTotal: true },
    }),
    prisma.pricelist.count({
      where: { companyId, status: { in: ['UPLOADED', 'EXTRACTED', 'NEEDS_REVIEW'] } },
    }),
    prisma.product.count({ where: { companyId, active: true } }),
    prisma.customer.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
    prisma.quote.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: { customer: true },
    }),
  ]);

  return {
    customerCount,
    quoteCount,
    quoteDraftCount,
    quoteSentCount,
    quoteAcceptedCount,
    quoteValueTotal: quoteValueAgg._sum.grandTotal ?? 0,
    pricelistReviewCount,
    productActiveCount,
    recentCustomers,
    recentQuotes,
  };
}
