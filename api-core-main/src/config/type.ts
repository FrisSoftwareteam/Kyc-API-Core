export interface ConfigInterface {
  appName: string;
  appEnv: string;
  port: number;
  db: DbConfig;
  isDev: boolean;
  sentry: SentyConfig;
  redisCache: {
    url: string;
  };
  redis: {
    url: string;
  };
  mailgun: {
    domain: string;
    apiKey: string;
    from: string;
  };
  rabbitmq: {
    firstcheck: {
      url: string;
      name: string;
      maxRetries: number;
      exchanges: {
        firstcheck?: {
          name: string;
          type: string;
          queues: {
            [key: string]: {
              [key: string]: string;
            };
          };
        };
      };

      // [key: string]: string | number,
    };
  };
  jwt: JWTConfig;
  google: {
    url: string;
    apiKey: string;
  };
  googleAuth: {
    clientId: string;
  };
  agentResponseTime: number;
  youverify: {
    baseUrl: string;
    apiKey: string;
  };
  cloudinary: {
    apiKey: string;
    apiSecret: string;
    name: string;
  };
  ably: {
    apiKey: string;
    channelName: string;
  };
  paystack: {
    url: string;
    secretKey: string;
    publicKey: string;
  };
  frontend: {
    businessUrl: string;
    partnerUrl: string;
    adminUrl: string;
  };
  sendgrid: {
    apiKey: string;
    from: string;
  };
  office360: {
    username: string;
    password: string;
  };
  azureStorage: {
    accountName: string;
    accountKey: string;
  };
  payarena: {
    url: string;
    secretKey: string;
    merchantId: string;
  };
}

interface JWTConfig {
  accessTokenPrivateKey: string;
  refreshTokenPrivateKey: string;
  accessTokenExpiryMins: number;
  refreshTokenExpiryMins: number;
}

interface DbConfig {
  url: string;
  connectTimeout: number;
  maxConnections: number;
  minPoolSize: number;
  maxPoolSize: number;
}

interface SentyConfig {
  dsn: string;
  release: string;
  environment: string;
}
