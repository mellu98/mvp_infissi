'use client';

import '../../sentry.client.config';
import { useReportWebVitals } from 'next/web-vitals';
import * as Sentry from '@sentry/nextjs';

export function WebVitals() {
  useReportWebVitals((metric) => {
    const webVitalName = metric.name;
    const webVitalValue = metric.value;

    Sentry.addBreadcrumb({
      category: 'web-vitals',
      message: `${webVitalName}: ${Math.round(webVitalValue * 1000) / 1000}`,
      level: metric.rating === 'poor' ? 'warning' : 'info',
      data: {
        name: webVitalName,
        value: webVitalValue,
        rating: metric.rating,
        navigationType: metric.navigationType,
        id: metric.id,
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
