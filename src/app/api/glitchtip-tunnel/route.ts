import { NextRequest, NextResponse } from 'next/server';

const GLITCHTIP_INSTANCE = 'https://glitchtip.app.easlydev.online';
const PROJECT_ID = '1';
const SECRET_KEY = '53e76bd846604f22bc954578f3407ea6';

export async function POST(req: NextRequest) {
  const url = `${GLITCHTIP_INSTANCE}/api/${PROJECT_ID}/envelope/?sentry_version=7&sentry_key=${SECRET_KEY}&sentry_client=sentry.javascript.nextjs%2F9.2.0`;

  try {
    const body = await req.text();

    await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=UTF-8',
        Accept: '*/*',
      },
      body,
    });

    return NextResponse.json({ status: 'ok' });
  } catch (error) {
    console.error('GlitchTip tunnel error:', error);
    return NextResponse.json(
      { status: 'error', message: (error as Error).message },
      { status: 500 }
    );
  }
}
