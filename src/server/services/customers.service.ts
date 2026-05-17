import { prisma } from '@/lib/db';
import { logAuditEvent } from '@/lib/audit';
import type { CustomerInput, CustomerNoteInput } from '@/lib/validation/customer';

export async function listCustomers(companyId: string, search?: string) {
  return prisma.customer.findMany({
    where: {
      companyId,
      ...(search
        ? {
            OR: [
              { firstName: { contains: search, mode: 'insensitive' } },
              { lastName: { contains: search, mode: 'insensitive' } },
              { companyName: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
              { phone: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { quotes: true, customerNotes: true } } },
  });
}

export async function getCustomer(companyId: string, id: string) {
  return prisma.customer.findFirst({
    where: { id, companyId },
    include: {
      customerNotes: { orderBy: { createdAt: 'desc' }, include: { user: true } },
      quotes: { orderBy: { createdAt: 'desc' }, take: 20 },
      documents: { orderBy: { createdAt: 'desc' }, take: 20 },
    },
  });
}

export async function createCustomer(
  companyId: string,
  data: CustomerInput,
  actor: { id: string; email: string }
) {
  const customer = await prisma.customer.create({
    data: {
      companyId,
      type: data.type,
      firstName: data.firstName ?? null,
      lastName: data.lastName ?? null,
      companyName: data.companyName ?? null,
      taxCode: data.taxCode ?? null,
      vatNumber: data.vatNumber ?? null,
      email: data.email?.toLowerCase() ?? null,
      phone: data.phone ?? null,
      address: data.address ?? null,
      city: data.city ?? null,
      province: data.province ?? null,
      postalCode: data.postalCode ?? null,
      notes: data.notes ?? null,
      leadStatus: data.leadStatus,
    },
  });
  await logAuditEvent({
    companyId,
    userId: actor.id,
    userEmail: actor.email,
    action: 'customer.create',
    entityType: 'Customer',
    entityId: customer.id,
    metadata: { type: data.type },
  });
  return customer;
}

export async function updateCustomer(
  companyId: string,
  id: string,
  data: CustomerInput,
  actor: { id: string; email: string }
) {
  await ensureOwn(companyId, id);
  const customer = await prisma.customer.update({
    where: { id },
    data: {
      type: data.type,
      firstName: data.firstName ?? null,
      lastName: data.lastName ?? null,
      companyName: data.companyName ?? null,
      taxCode: data.taxCode ?? null,
      vatNumber: data.vatNumber ?? null,
      email: data.email?.toLowerCase() ?? null,
      phone: data.phone ?? null,
      address: data.address ?? null,
      city: data.city ?? null,
      province: data.province ?? null,
      postalCode: data.postalCode ?? null,
      notes: data.notes ?? null,
      leadStatus: data.leadStatus,
    },
  });
  await logAuditEvent({
    companyId,
    userId: actor.id,
    userEmail: actor.email,
    action: 'customer.update',
    entityType: 'Customer',
    entityId: customer.id,
  });
  return customer;
}

export async function addCustomerNote(
  companyId: string,
  customerId: string,
  data: CustomerNoteInput,
  actor: { id: string; email: string }
) {
  await ensureOwn(companyId, customerId);
  const note = await prisma.customerNote.create({
    data: {
      companyId,
      customerId,
      userId: actor.id,
      content: data.content,
    },
  });
  await logAuditEvent({
    companyId,
    userId: actor.id,
    userEmail: actor.email,
    action: 'customer.note.create',
    entityType: 'CustomerNote',
    entityId: note.id,
    metadata: { customerId },
  });
  return note;
}

export async function deleteCustomer(
  companyId: string,
  id: string,
  actor: { id: string; email: string }
) {
  await ensureOwn(companyId, id);
  await prisma.customer.delete({ where: { id } });
  await logAuditEvent({
    companyId,
    userId: actor.id,
    userEmail: actor.email,
    action: 'customer.delete',
    entityType: 'Customer',
    entityId: id,
  });
}

async function ensureOwn(companyId: string, customerId: string) {
  const c = await prisma.customer.findFirst({ where: { id: customerId, companyId } });
  if (!c) throw new Error('Cliente non trovato.');
  return c;
}
