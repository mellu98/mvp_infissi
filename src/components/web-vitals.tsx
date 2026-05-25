'use client';

import { useReportWebVitals } from 'next/web-vitals';
import * as Sentry from '@sentry/nextjs';

export function WebVitals() {
  useReportWebVitals((metric) => {
    const webVitalName = metric.name;
    const webVitalValue = metric.value;

    Sentry.metrics.distribution(`web_vital.${webVitalName}`, webVitalValue, {
      unit: webVitalName === 'CLS' ? 'none' : 'millisecond',
      tags: {
        rating: metric.rating,
        navigationType: metric.navigationType,
      },
    });

    if (metric.rating === 'poor') {
      Sentry.captureMessage(`Poor Web Vital: ${webVitalName}`, {
        level: 'warning',
        tags: {
          name: webVitalName,
          rating: metric.rating,
          navigationType: metric.navigationType,
        },
        extra: {
          value: webVitalValue,
          id: metric.id,
        },
      });
    }
  });

  return null;
}
