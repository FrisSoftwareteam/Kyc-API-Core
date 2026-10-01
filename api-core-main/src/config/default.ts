import { ConfigInterface } from './type';
import { APP_NAME, QUEUES } from '../constants';

export const configData: ConfigInterface = {
  appName: APP_NAME,
  appEnv: <string>process.env.APP_ENV,
  port: Number(process.env.APP_PORT) || 5510,
  isDev: process.env.APP_ENV !== 'production' ? true : false,
  db: {
    url: <string>process.env.DATABASE_URI || '',
    connectTimeout: Number(process.env.DATABASE_CONNECT_TIMEOUT) || 30000,
    maxConnections: Number(process.env.DATABASE_MAXIMUM_CONNECTIONS) || 1,
    minPoolSize: Number(process.env.DATABASE_MIN_POOL_SIZE) || 1,
    maxPoolSize: Number(process.env.DATABASE_MAX_POOL_SIZE) || 1,
  },
  sentry: {
    dsn: <string>process.env.SENTRY_DSN || '',
    release: <string>process.env.SENTRY_RELEASE || '',
    environment: <string>process.env.SENTRY_ENVIRONMENT || 'local',
  },
  redisCache: {
    url: <string>process.env.REDIS_CACHE_URL || '',
  },
  redis: {
    url: <string>process.env.REDIS_URL || '',
  },
  mailgun: {
    apiKey: <string>process.env.MAILGUN_API_KEY,
    domain: <string>process.env.MAILGUN_DOMAIN,
    from: <string>process.env.MAILGUN_FROM,
  },
  rabbitmq: {
    firstcheck: {
      url: <string>process.env.RABBITMQ_URI || '',
      name: 'firstcheck',
      maxRetries: 3,
      exchanges: {
        firstcheck: {
          name: 'firstcheck',
          type: 'topic',
          queues: {
            BULK_IDENTITY_UPLOAD: {
              name: QUEUES.BULK_IDENTITY_UPLOAD,
              pattern: 'bulk.identity.upload',
            },
            BULK_ADDRESS_UPLOAD: {
              name: QUEUES.BULK_ADDRESS_UPLOAD,
              pattern: 'bulk.address.upload',
            },
            BROADCAST_ADDRESS: {
              name: QUEUES.BROADCAST_ADDRESS,
              pattern: 'broadcast.address',
            },
            EXPORT_ADDRESS: {
              name: QUEUES.EXPORT_ADDRESS,
              pattern: 'export.address',
            },
            ADMIN_VERIFICATION: {
              name: QUEUES.ADMIN_VERIFICATION,
              pattern: 'export.admin.verification',
            },
          },
        },
      },
    },
  },
  jwt: {
    accessTokenExpiryMins: Number(process.env.JWT_ACCESS_TOKEN_EXPIRY_MINS) || 15,
    accessTokenPrivateKey: <string>process.env.JWT_ACCESS_TOKEN_PRIVATE_KEY,
    refreshTokenExpiryMins: Number(process.env.JWT_REFRESH_TOKEN_EXPIRY_MINS) || 30,
    refreshTokenPrivateKey: <string>process.env.JWT_REFRESH_TOKEN_PRIVATE_KEY,
  },
  google: {
    url: <string>process.env.GOOGLE_MAP_BASE_URL,
    apiKey: <string>process.env.GOOGLE_MAP_API_KEY,
  },
  agentResponseTime: process.env.APP_ENV !== 'production' ? 30000 : 120000,
  youverify: {
    baseUrl: <string>process.env.YOUVERIFY_BASE_URL,
    apiKey: <string>process.env.YOUVERIFY_API_KEY,
  },
  cloudinary: {
    apiKey: <string>process.env.CLOUDINARY_API_KEY,
    apiSecret: <string>process.env.CLOUDINARY_API_SECRET,
    name: <string>process.env.CLOUDINARY_NAME,
  },
  ably: {
    apiKey: <string>process.env.ABLY_API_KEY,
    channelName: 'firstRegistrarsVerifications',
  },
  paystack: {
    url: <string>process.env.PAYSTACK_BASE_URL,
    secretKey: <string>process.env.PAYSTACK_SECRET_KEY,
    publicKey: <string>process.env.PAYSTACK_PUBLIC_KEY,
  },
  frontend: {
    businessUrl: <string>process.env.BUSINESS_FRONTEND_URL,
    partnerUrl: <string>process.env.PARTNER_FRONTEND_URL,
    adminUrl: <string>process.env.ADMIN_FRONTEND_URL,
  },
  sendgrid: {
    apiKey: <string>process.env.SENDGRID_API_KEY,
    from: <string>process.env.SENDGRID_FROM,
  },
  office360: {
    username: <string>process.env.OFFICE360_USERNAME,
    password: <string>process.env.OFFICE360_PASSWORD,
  },
  azureStorage: {
    accountName: <string>process.env.AZURE_STORAGE_ACCOUNT_NAME,
    accountKey: <string>process.env.AZURE_STORAGE_ACCOUNT_KEY,
  },
  payarena: {
    url: <string>process.env.PAYARENA_BASE_URL,
    secretKey: <string>process.env.PAYARENA_SECRET_KEY,
    merchantId: <string>process.env.PAYARENA_MERCHANT_ID,
  },
};
