import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

async function runChecks() {
  const checks = {
    database: false,
  };

  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = true;
  } catch {
    checks.database = false;
  }

  const allHealthy = Object.values(checks).every(Boolean);
  return { checks, allHealthy };
}

export async function GET() {
  const { checks, allHealthy } = await runChecks();

  return NextResponse.json(
    {
      status: allHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      checks,
    },
    { status: allHealthy ? 200 : 503 }
  );
}

export async function HEAD() {
  const { allHealthy } = await runChecks();
  return new NextResponse(null, { status: allHealthy ? 200 : 503 });
}
