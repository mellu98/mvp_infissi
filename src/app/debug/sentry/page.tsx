'use client';

import { useState } from 'react';
import { triggerServerError, triggerSlowTransaction } from './actions';

export default function DebugSentryPage() {
  const [serverResult, setServerResult] = useState<string | null>(null);
  const [slowResult, setSlowResult] = useState<string | null>(null);

  const handleClientError = () => {
    throw new Error('Test client error from debug page');
  };

  const handleServerError = async () => {
    try {
      await triggerServerError();
      setServerResult('Success (unexpected)');
    } catch {
      setServerResult('Error thrown and captured — check GlitchTip Issues');
    }
  };

  const handleSlowTransaction = async () => {
    setSlowResult('Running...');
    const result = await triggerSlowTransaction();
    setSlowResult(`Done: ${result.duration} — check GlitchTip Performance`);
  };

  return (
    <div className="container mx-auto max-w-2xl p-8">
      <h1 className="mb-6 text-3xl font-bold">Debug Sentry / GlitchTip</h1>

      <div className="mb-8 rounded-lg border p-4">
        <h2 className="mb-2 text-lg font-semibold">Configurazione</h2>
        <ul className="space-y-1 text-sm">
          <li><strong>DSN:</strong> {process.env.NEXT_PUBLIC_SENTRY_DSN || 'fallback'}</li>
          <li><strong>Release:</strong> {process.env.NEXT_PUBLIC_SENTRY_RELEASE || 'development'}</li>
          <li><strong>Environment:</strong> {process.env.NODE_ENV || 'unknown'}</li>
        </ul>
      </div>

      <div className="space-y-4">
        <div className="rounded-lg border p-4">
          <h2 className="mb-2 text-lg font-semibold">Test Errori</h2>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleClientError}
              className="rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700"
            >
              Genera errore CLIENT
            </button>

            <button
              onClick={handleServerError}
              className="rounded bg-orange-600 px-4 py-2 text-white hover:bg-orange-700"
            >
              Genera errore SERVER
            </button>
          </div>
          {serverResult && (
            <p className="mt-2 text-sm text-green-600">{serverResult}</p>
          )}
        </div>

        <div className="rounded-lg border p-4">
          <h2 className="mb-2 text-lg font-semibold">Test Performance</h2>
          <button
            onClick={handleSlowTransaction}
            className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            Avvia transaction lenta (2s)
          </button>
          {slowResult && (
            <p className="mt-2 text-sm text-green-600">{slowResult}</p>
          )}
        </div>
      </div>
    </div>
  );
}
