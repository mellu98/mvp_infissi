import bcrypt from 'bcryptjs';
import { PrismaClient, type Prisma } from '@prisma/client';
import {
  calculateQuoteLine,
  calculateQuoteTotals,
  type LineCalculation,
  type OptionSnapshot,
  type ProductSnapshot,
} from '../src/lib/pricing';

const prisma = new PrismaClient();

const DEMO_COMPANY_ID = 'demo-link-infissi';
const ADMIN_EMAIL = 'admin@linkinfissi.demo';
const ADMIN_PASSWORD = 'password-demo-123';

type SeedProduct = Prisma.ProductCreateManyInput & {
  options?: Array<{
    id: string;
    name: string;
    description?: string;
    price: number;
    priceType: 'FIXED' | 'PER_SQUARE_METER' | 'PER_LINEAR_METER' | 'PERCENTAGE';
  }>;
};

type CreatedProduct = SeedProduct & { id: string };

async function main() {
  guardProductionSeed();

  console.log('🌱 Reset demo tenant…');
  await prisma.company.delete({ where: { id: DEMO_COMPANY_ID } }).catch(() => undefined);

  const currentYear = new Date().getFullYear();
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);

  console.log('🏢 Create company, settings and users…');
  await prisma.company.create({
    data: {
      id: DEMO_COMPANY_ID,
      name: 'LINK INFISSI SRL Unipersonale',
      vatNumber: '02916820182',
      taxCode: '02916820182',
      settings: {
        create: {
          // Dati reali da impostazioni — modificabili da /settings.
          legalName: 'LINK INFISSI SRL Unipersonale',
          vatNumber: '02916820182',
          taxCode: '02916820182',
          address: 'Via Paolo Borsellino 73',
          city: 'Zinasco',
          province: 'PV',
          postalCode: '27030',
          country: 'Italia',
          email: 'linkinfissi@gmail.com',
          phone: '+39 392 4114301',
          website: 'https://www.linkinfissi.it',
          defaultVatRate: 22,
          currency: 'EUR',
          quoteValidityDays: 30,
          quoteNumberPrefix: '',
          quoteTerms: [
            'LINK INFISSI — oltre 10 anni di esperienza nel settore serramenti e infissi.',
            'Prodotti Made in Italy certificati. Professionalità, precisione e cura dei dettagli.',
            '',
            'CONDIZIONI:',
            '• Validità offerta 30 giorni dalla data di emissione, salvo diverso accordo.',
            "• Misure indicative: confermate in fase di sopralluogo tecnico prima della produzione.",
            "• Posa e installazione a regola d'arte incluse quando previste come voce dedicata.",
            '• Garanzia produttore + servizio manutenzione post-vendita.',
            '• Supporto pratiche per detrazioni fiscali disponibile su richiesta.',
            '• Prezzi DEMO indicati nel seed: non vincolanti, da sostituire con listini reali prima della firma.',
          ].join('\n'),
          contractTerms: [
            'CONDIZIONI CONTRATTUALI:',
            '',
            '• Modalità di pagamento: acconto 30% alla firma, saldo prima della consegna o secondo accordo scritto.',
            '• Tempi di consegna: indicativi e confermati in fase di accettazione, soggetti a disponibilità materiali e tempistica di posa.',
            '• Misure definitive: verificate dal tecnico LINK INFISSI in sopralluogo prima della messa in produzione.',
            '• Esclusioni: opere murarie straordinarie, smaltimenti speciali, traslochi mobilio salvo diverso accordo scritto.',
            '• Garanzia legale ai sensi degli artt. 128-135 del Codice del Consumo + garanzia produttore.',
            '• Privacy: trattamento dati personali ai sensi del Reg. UE 2016/679 (GDPR). Informativa completa disponibile su richiesta.',
            '• Foro competente: PAVIA.',
          ].join('\n'),
          quoteCounterYear: currentYear,
          quoteCounterValue: 3,
        },
      },
      users: {
        create: [
          {
            email: ADMIN_EMAIL,
            passwordHash,
            name: 'Admin Link Infissi',
            role: 'ADMIN',
          },
          {
            email: 'vendite@linkinfissi.demo',
            passwordHash,
            name: 'Ufficio Vendite',
            role: 'SALES',
          },
        ],
      },
    },
  });

  const admin = await prisma.user.findFirstOrThrow({
    where: { companyId: DEMO_COMPANY_ID, email: ADMIN_EMAIL },
  });

  console.log('👥 Create demo customers…');
  const customers = await createCustomers();

  console.log('📦 Create product catalog…');
  const products = await createProducts();

  console.log('📄 Create pricelists and candidates…');
  await createPricelists();

  console.log('🧾 Create demo quotes…');
  await createQuotes({
    customers,
    products,
    actor: { id: admin.id, email: admin.email },
    year: currentYear,
  });

  await prisma.auditLog.create({
    data: {
      companyId: DEMO_COMPANY_ID,
      userId: admin.id,
      userEmail: admin.email,
      action: 'seed.demo',
      entityType: 'Company',
      entityId: DEMO_COMPANY_ID,
      metadata: {
        customers: customers.length,
        products: products.length,
        login: ADMIN_EMAIL,
      },
    },
  });

  console.log('✅ Seed completato.');
  console.log(`Login demo: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
}

function guardProductionSeed() {
  const isProduction = process.env.NODE_ENV === 'production';
  const allowProdSeed = process.env.ALLOW_PROD_SEED === 'true';
  if (isProduction && !allowProdSeed) {
    throw new Error(
      'Seed bloccato in produzione. Imposta ALLOW_PROD_SEED=true solo se sai cosa stai facendo.'
    );
  }
}

async function createCustomers() {
  await prisma.customer.createMany({
    data: [
      {
        id: 'cust-mario-rossi',
        companyId: DEMO_COMPANY_ID,
        type: 'PRIVATE',
        firstName: 'Mario',
        lastName: 'Rossi',
        taxCode: 'RSSMRA80A01F205X',
        email: 'mario.rossi@example.com',
        phone: '+39 333 111 2222',
        address: 'Via Garibaldi 12',
        city: 'Zinasco',
        province: 'PV',
        postalCode: '27030',
        notes: 'Cliente demo interessato a zanzariere e serramenti.',
        leadStatus: 'QUOTE_SENT',
      },
      {
        id: 'cust-bianchi',
        companyId: DEMO_COMPANY_ID,
        type: 'PRIVATE',
        firstName: 'Lucia',
        lastName: 'Bianchi',
        taxCode: 'BNCLCU78C41G388K',
        email: 'lucia.bianchi@example.com',
        phone: '+39 339 444 5555',
        address: 'Corso Cavour 8',
        city: 'Pavia',
        province: 'PV',
        postalCode: '27100',
        leadStatus: 'SURVEY',
      },
      {
        id: 'cust-verdi-studio',
        companyId: DEMO_COMPANY_ID,
        type: 'BUSINESS',
        companyName: 'Studio Verdi Associati',
        vatNumber: '01999990182',
        email: 'studio.verdi@example.com',
        phone: '+39 0382 123456',
        address: 'Piazza Vittoria 4',
        city: 'Pavia',
        province: 'PV',
        postalCode: '27100',
        leadStatus: 'CONTACTED',
      },
      {
        id: 'cust-farmacia-duomo',
        companyId: DEMO_COMPANY_ID,
        type: 'BUSINESS',
        companyName: 'Farmacia Duomo SRL',
        vatNumber: '02555550189',
        email: 'amministrazione@farmaciaduomo.example',
        phone: '+39 0382 654321',
        address: 'Via XX Settembre 22',
        city: 'Garlasco',
        province: 'PV',
        postalCode: '27026',
        leadStatus: 'NEW',
      },
      {
        id: 'cust-neri',
        companyId: DEMO_COMPANY_ID,
        type: 'PRIVATE',
        firstName: 'Giovanni',
        lastName: 'Neri',
        email: 'giovanni.neri@example.com',
        phone: '+39 347 777 8888',
        address: 'Via Po 3',
        city: 'Cava Manara',
        province: 'PV',
        postalCode: '27051',
        leadStatus: 'ACCEPTED',
      },
    ],
  });

  await prisma.customerNote.createMany({
    data: [
      {
        companyId: DEMO_COMPANY_ID,
        customerId: 'cust-mario-rossi',
        userId: undefined,
        content:
          'Sopralluogo richiesto per camera e soggiorno. Appunti: zanzariera laterale bianca 120x240.',
      },
      {
        companyId: DEMO_COMPANY_ID,
        customerId: 'cust-bianchi',
        content: 'Preferisce finiture PVC bianco, budget medio.',
      },
    ],
  });

  return prisma.customer.findMany({ where: { companyId: DEMO_COMPANY_ID } });
}

async function createProducts(): Promise<CreatedProduct[]> {
  const products: SeedProduct[] = [
    product('prod-zan-avv-lat-bia', 'ZAN-AVV-LAT-BIA', 'Zanzariera avvolgibile laterale bianca', 'MOSQUITO_SCREEN', {
      pricingFormula: 'PER_SQUARE_METER',
      pricePerSquareMeter: 45,
      minBillableQuantity: 1.5,
      material: 'Alluminio',
      color: 'Bianco',
      options: [
        option('opt-zan-guida-bassa', 'Guida bassa', 18, 'FIXED'),
        option('opt-zan-rete-pet', 'Rete pet screen', 7, 'PER_SQUARE_METER'),
      ],
    }),
    product('prod-zan-plisse', 'ZAN-PLISSE-ANTR', 'Zanzariera plissé antracite', 'MOSQUITO_SCREEN', {
      pricingFormula: 'PER_SQUARE_METER',
      pricePerSquareMeter: 62,
      minBillableQuantity: 1.8,
      material: 'Alluminio',
      color: 'Antracite',
    }),
    product('prod-ser-k5000', 'SER-K5000', 'Serramento K5000 PVC tripla guarnizione', 'WINDOW', {
      pricingFormula: 'BASE_PLUS_AREA',
      basePrice: 180,
      pricePerSquareMeter: 210,
      material: 'PVC',
      color: 'Bianco',
      options: [
        option('opt-ser-anta-ribalta', 'Anta ribalta', 45, 'FIXED'),
        option('opt-ser-vetro-sicurezza', 'Vetro sicurezza', 28, 'PER_SQUARE_METER'),
      ],
    }),
    product('prod-ser-coveral', 'SER-COVERAL', 'Serramento Coveral PVC-Alluminio', 'WINDOW', {
      pricingFormula: 'BASE_PLUS_AREA',
      basePrice: 260,
      pricePerSquareMeter: 320,
      material: 'PVC-Alluminio',
      color: 'Bianco',
    }),
    product('prod-ser-termalmix', 'SER-TERMALMIX', 'Serramento Termalmix taglio termico', 'WINDOW', {
      pricingFormula: 'BASE_PLUS_AREA',
      basePrice: 300,
      pricePerSquareMeter: 380,
      material: 'Alluminio',
      color: 'Antracite',
    }),
    product('prod-porta-zeus', 'PB-ZEUS', 'Porta blindata 1 anta classe 3 modello Zeus', 'ARMORED_DOOR', {
      pricingFormula: 'FIXED_PRICE',
      basePrice: 1280,
      material: 'Acciaio',
      options: [option('opt-porta-pannello-premium', 'Pannello premium', 180, 'FIXED')],
    }),
    product('prod-porta-poseidon', 'PB-POSEIDON', 'Porta blindata Poseidon classe 4', 'ARMORED_DOOR', {
      pricingFormula: 'FIXED_PRICE',
      basePrice: 1780,
      material: 'Acciaio',
    }),
    product('prod-porta-metropolitan', 'PI-METROPOLITAN', 'Porta interna linea Metropolitan', 'INTERIOR_DOOR', {
      pricingFormula: 'FIXED_PRICE',
      basePrice: 430,
      material: 'Laminato',
      options: [option('opt-porta-scorrevole', 'Kit scorrevole interno muro', 260, 'FIXED')],
    }),
    product('prod-porta-luxury', 'PI-LUXURY', 'Porta interna Luxury laccata', 'INTERIOR_DOOR', {
      pricingFormula: 'FIXED_PRICE',
      basePrice: 620,
      material: 'Laccato',
    }),
    product('prod-tap-alu-1455', 'TAP-ALU-1455', 'Tapparella alluminio 14x55', 'SHUTTER', {
      pricingFormula: 'PER_SQUARE_METER',
      pricePerSquareMeter: 72,
      minBillableQuantity: 1.2,
      material: 'Alluminio',
    }),
    product('prod-tap-pvc', 'TAP-PVC', 'Tapparella PVC standard', 'SHUTTER', {
      pricingFormula: 'PER_SQUARE_METER',
      pricePerSquareMeter: 38,
      minBillableQuantity: 1.2,
      material: 'PVC',
    }),
    product('prod-pers-vogue', 'PER-VOGUE-ALU', 'Persiana Vogue alluminio', 'PERSIANA', {
      pricingFormula: 'PER_SQUARE_METER',
      pricePerSquareMeter: 240,
      minBillableQuantity: 1,
      material: 'Alluminio',
    }),
    product('prod-motore-tapparella', 'ACC-MOT-TAP', 'Motore tapparella radio', 'ACCESSORY', {
      pricingFormula: 'FIXED_PRICE',
      basePrice: 145,
      unit: 'pz',
    }),
    product('prod-maniglia-hoppe', 'ACC-MAN-HOPPE', 'Maniglia Hoppe cromo satinato', 'ACCESSORY', {
      pricingFormula: 'FIXED_PRICE',
      basePrice: 32,
      unit: 'pz',
    }),
    product('prod-posa-serramento', 'POSA-SERR', 'Posa serramento', 'INSTALLATION', {
      pricingFormula: 'FIXED_PRICE',
      basePrice: 120,
      unit: 'pz',
      demoPrice: false,
    }),
    product('prod-posa-porta', 'POSA-PORTA', 'Posa porta interna o blindata', 'INSTALLATION', {
      pricingFormula: 'FIXED_PRICE',
      basePrice: 180,
      unit: 'pz',
      demoPrice: false,
    }),
    product('prod-trasporto', 'TRASP-STD', 'Trasporto in provincia di Pavia', 'TRANSPORT', {
      pricingFormula: 'FIXED_PRICE',
      basePrice: 75,
      unit: 'servizio',
      demoPrice: false,
    }),
    product('prod-detrazioni', 'SERV-DETR', 'Supporto pratiche detrazioni', 'TAX_SUPPORT', {
      pricingFormula: 'FIXED_PRICE',
      basePrice: 95,
      unit: 'servizio',
      demoPrice: false,
    }),
  ];

  for (const p of products) {
    const { options, ...data } = p;
    await prisma.product.create({ data });
    if (options?.length) {
      await prisma.productOption.createMany({
        data: options.map((opt) => ({
          ...opt,
          companyId: DEMO_COMPANY_ID,
          productId: p.id!,
          active: true,
        })),
      });
    }
  }

  return products.map((p) => ({ ...p, id: p.id! }));
}

function product(
  id: string,
  sku: string,
  name: string,
  category: SeedProduct['category'],
  overrides: Partial<SeedProduct> = {}
): SeedProduct {
  return {
    id,
    companyId: DEMO_COMPANY_ID,
    sku,
    name,
    category,
    unit: 'pz',
    basePrice: 0,
    pricePerSquareMeter: null,
    pricePerLinearMeter: null,
    minBillableQuantity: null,
    pricingFormula: 'FIXED_PRICE',
    active: true,
    demoPrice: true,
    ...overrides,
  };
}

function option(
  id: string,
  name: string,
  price: number,
  priceType: 'FIXED' | 'PER_SQUARE_METER' | 'PER_LINEAR_METER' | 'PERCENTAGE'
) {
  return { id, name, price, priceType };
}

async function createPricelists() {
  await prisma.pricelist.create({
    data: {
      id: 'price-zanzariere-demo',
      companyId: DEMO_COMPANY_ID,
      name: 'Listino demo zanzariere 2026',
      supplier: 'Demo Supplier',
      category: 'MOSQUITO_SCREEN',
      fileName: 'listino-zanzariere-demo.csv',
      storageKey: 'seed/pricelists/listino-zanzariere-demo.csv',
      mimeType: 'text/csv',
      fileSize: 1024,
      status: 'APPROVED',
      approvedAt: new Date(),
      notes: 'Listino demo creato dal seed.',
      candidates: {
        create: [
          candidate('Zanzariera avvolgibile laterale bianca', 'ZAN-AVV-LAT-BIA', 'MOSQUITO_SCREEN', {
            pricePerSquareMeter: 45,
            minBillableQuantity: 1.5,
            pricingFormula: 'PER_SQUARE_METER',
          }),
          candidate('Zanzariera plissé antracite', 'ZAN-PLISSE-ANTR', 'MOSQUITO_SCREEN', {
            pricePerSquareMeter: 62,
            minBillableQuantity: 1.8,
            pricingFormula: 'PER_SQUARE_METER',
          }),
        ],
      },
    },
  });

  await prisma.pricelist.create({
    data: {
      id: 'price-serramenti-demo',
      companyId: DEMO_COMPANY_ID,
      name: 'Listino demo serramenti 2026',
      supplier: 'Demo Supplier',
      category: 'WINDOW',
      fileName: 'listino-serramenti-demo.xlsx',
      storageKey: 'seed/pricelists/listino-serramenti-demo.xlsx',
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      fileSize: 2048,
      status: 'NEEDS_REVIEW',
      notes: 'Listino demo con righe da rivedere.',
      candidates: {
        create: [
          candidate('Serramento K5000 PVC tripla guarnizione', 'SER-K5000', 'WINDOW', {
            basePrice: 180,
            pricePerSquareMeter: 210,
            pricingFormula: 'BASE_PLUS_AREA',
            approved: true,
          }),
          candidate('Serramento ignoto da validare', 'TMP-001', 'WINDOW', {
            basePrice: 0,
            confidence: 0.42,
            validationErrors: ['Prezzo mancante', 'Formula da verificare'],
            approved: false,
          }),
        ],
      },
    },
  });
}

function candidate(
  productName: string,
  sku: string,
  category: SeedProduct['category'],
  overrides: Partial<Prisma.PricelistItemCandidateCreateWithoutPricelistInput> = {}
): Prisma.PricelistItemCandidateCreateWithoutPricelistInput {
  return {
    company: { connect: { id: DEMO_COMPANY_ID } },
    productName,
    sku,
    category,
    unit: 'pz',
    basePrice: null,
    pricePerSquareMeter: null,
    pricePerLinearMeter: null,
    minBillableQuantity: null,
    pricingFormula: 'FIXED_PRICE',
    confidence: 0.72,
    rawText: `${sku}; ${productName}`,
    validationErrors: [],
    approved: true,
    ...overrides,
  };
}

async function createQuotes({
  customers,
  products,
  actor,
  year,
}: {
  customers: Awaited<ReturnType<typeof createCustomers>>;
  products: CreatedProduct[];
  actor: { id: string; email: string };
  year: number;
}) {
  const bySku = new Map(products.map((product) => [product.sku, product]));

  await createQuoteWithLines({
    id: 'quote-mario-001',
    quoteNumber: `${year}-0001`,
    customerId: customers.find((c) => c.id === 'cust-mario-rossi')!.id,
    status: 'SENT',
    notes: 'Preventivo demo zanzariere soggiorno e camera.',
    actor,
    lines: [
      line(bySku.get('ZAN-AVV-LAT-BIA')!, { quantity: 3, widthCm: 120, heightCm: 240 }),
      line(bySku.get('POSA-SERR')!, { quantity: 3 }),
    ],
  });

  await createQuoteWithLines({
    id: 'quote-neri-002',
    quoteNumber: `${year}-0002`,
    customerId: customers.find((c) => c.id === 'cust-neri')!.id,
    status: 'ACCEPTED',
    notes: 'Preventivo demo serramenti con supporto detrazioni.',
    globalDiscountPercentage: 3,
    actor,
    lines: [
      line(bySku.get('SER-K5000')!, {
        quantity: 2,
        widthCm: 80,
        heightCm: 120,
        selectedOptions: [{ id: 'opt-ser-anta-ribalta', name: 'Anta ribalta', price: 45, priceType: 'FIXED' }],
      }),
      line(bySku.get('SERV-DETR')!, { quantity: 1 }),
      line(bySku.get('TRASP-STD')!, { quantity: 1 }),
    ],
  });

  await createQuoteWithLines({
    id: 'quote-verdi-003',
    quoteNumber: `${year}-0003`,
    customerId: customers.find((c) => c.id === 'cust-verdi-studio')!.id,
    status: 'DRAFT',
    notes: 'Bozza porte ufficio.',
    actor,
    lines: [
      line(bySku.get('PI-METROPOLITAN')!, {
        quantity: 4,
        selectedOptions: [
          { id: 'opt-porta-scorrevole', name: 'Kit scorrevole interno muro', price: 260, priceType: 'FIXED' },
        ],
      }),
      line(bySku.get('POSA-PORTA')!, { quantity: 4 }),
    ],
  });
}

function line(
  product: CreatedProduct,
  input: {
    quantity?: number;
    widthCm?: number;
    heightCm?: number;
    lengthCm?: number;
    selectedOptions?: OptionSnapshot[];
    discountPercentage?: number;
    manualPriceOverride?: number;
  } = {}
) {
  const productSnapshot: ProductSnapshot = {
    id: product.id,
    sku: product.sku!,
    name: product.name!,
    category: product.category,
    unit: product.unit ?? 'pz',
    basePrice: product.basePrice ?? 0,
    pricePerSquareMeter: product.pricePerSquareMeter ?? null,
    pricePerLinearMeter: product.pricePerLinearMeter ?? null,
    minBillableQuantity: product.minBillableQuantity ?? null,
    pricingFormula: product.pricingFormula!,
    demoPrice: product.demoPrice ?? true,
  };

  const calculation = calculateQuoteLine(
    {
      product: productSnapshot,
      quantity: input.quantity ?? 1,
      widthCm: input.widthCm,
      heightCm: input.heightCm,
      lengthCm: input.lengthCm,
      selectedOptions: input.selectedOptions ?? [],
      discountPercentage: input.discountPercentage ?? 0,
      manualPriceOverride: input.manualPriceOverride ?? null,
    },
    { vatRate: 22, currency: 'EUR' }
  );

  return {
    product,
    input,
    productSnapshot,
    selectedOptions: input.selectedOptions ?? [],
    calculation,
  };
}

async function createQuoteWithLines({
  id,
  quoteNumber,
  customerId,
  status,
  notes,
  globalDiscountPercentage = 0,
  actor,
  lines,
}: {
  id: string;
  quoteNumber: string;
  customerId: string;
  status: 'DRAFT' | 'CALCULATED' | 'SENT' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';
  notes: string;
  globalDiscountPercentage?: number;
  actor: { id: string; email: string };
  lines: Array<{
    product: CreatedProduct;
    input: { quantity?: number; widthCm?: number; heightCm?: number; lengthCm?: number; discountPercentage?: number; manualPriceOverride?: number };
    productSnapshot: ProductSnapshot;
    selectedOptions: OptionSnapshot[];
    calculation: LineCalculation;
  }>;
}) {
  const totals = calculateQuoteTotals(
    lines.map((l) => l.calculation),
    globalDiscountPercentage,
    22
  );
  const validUntil = new Date();
  validUntil.setDate(validUntil.getDate() + 30);

  await prisma.quote.create({
    data: {
      id,
      companyId: DEMO_COMPANY_ID,
      customerId,
      quoteNumber,
      status,
      validUntil,
      notes,
      subtotal: totals.subtotal,
      discountTotal: totals.discountTotal,
      vatTotal: totals.vatTotal,
      grandTotal: totals.grandTotal,
      globalDiscountPercentage,
      vatRate: 22,
      items: {
        create: lines.map((l, index) => ({
          companyId: DEMO_COMPANY_ID,
          productId: l.product.id,
          description: l.product.name!,
          productSnapshot: toJsonObject(l.productSnapshot),
          quantity: l.input.quantity ?? 1,
          widthCm: l.input.widthCm ?? null,
          heightCm: l.input.heightCm ?? null,
          lengthCm: l.input.lengthCm ?? null,
          areaMq: l.calculation.areaMq,
          billableAreaMq: l.calculation.billableAreaMq,
          linearMeters: l.calculation.linearMeters,
          unitPrice: l.calculation.unitPrice,
          optionsTotal: l.calculation.optionsTotal,
          selectedOptions: l.selectedOptions.map((opt) => toJsonObject(opt)),
          discountPercentage: l.input.discountPercentage ?? 0,
          subtotal: l.calculation.subtotal,
          vatRate: l.calculation.vatRate,
          vatAmount: l.calculation.vatAmount,
          total: l.calculation.total,
          manualPriceOverride: l.input.manualPriceOverride ?? null,
          calculationExplanation: l.calculation.explanation,
          position: index + 1,
        })),
      },
    },
  });

  await prisma.auditLog.create({
    data: {
      companyId: DEMO_COMPANY_ID,
      userId: actor.id,
      userEmail: actor.email,
      action: 'quote.seed',
      entityType: 'Quote',
      entityId: id,
      metadata: { quoteNumber, lines: lines.length },
    },
  });
}

function toJsonObject(value: object): Prisma.InputJsonObject {
  return Object.fromEntries(
    Object.entries(value).filter(([, v]) => v !== undefined)
  ) as Prisma.InputJsonObject;
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
