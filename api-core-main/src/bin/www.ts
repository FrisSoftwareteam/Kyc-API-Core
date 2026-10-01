import 'newrelic';
import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';

import { config } from '../config';

Sentry.init({
  dsn: config.get('sentry.dsn') as string,
  release: config.get('sentry.release') as string,
  environment: config.get('sentry.environment') as string,
  integrations: [nodeProfilingIntegration()],
  tracesSampleRate: 1, //  Capture 100% of the transactions
  // Set sampling rate for profiling - this is relative to tracesSampleRate
  profilesSampleRate: 1,
  debug: false,
  // debug: config.get('isDev') ? true: false,
});

import './app';
