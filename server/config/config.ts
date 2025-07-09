import { config as dotenvConfig } from "dotenv";
import path from "path";

// Load environment variables
const nodeEnv = process.env.NODE_ENV || "development";
const envFile = nodeEnv === "production" ? ".env.prod" : ".env";
const envPath = path.join(process.cwd(), envFile);

dotenvConfig({ path: envPath });

export interface AppConfig {
  // Server Configuration
  port: number;
  nodeEnv: string;
  backendPort: number;

  // Database Configuration
  mongoUri: string;
  mongoDbName: string;
  mongoRootUsername: string;
  mongoRootPassword: string;
  mongoPort: number;
  dbPoolSize: number;
  dbTimeout: number;
  dbRetryAttempts: number;

  // Redis Configuration
  redisUrl: string;
  redisPort: number;

  // JWT Configuration
  jwtSecret: string;
  jwtExpiresIn: string;

  // Client Configuration
  clientUrl: string;
  frontendPort: number;
  corsOrigin: string;

  // API Configuration
  apiBaseUrl: string;
  reactAppApiUrl: string;

  // File Upload Configuration
  cloudinary: {
    cloudName: string;
    apiKey: string;
    apiSecret: string;
  };
  maxFileSize: number;

  // Email Configuration
  smtp: {
    host: string;
    port: number;
    user: string;
    pass: string;
  };
  emailFrom: string;

  // WebRTC Configuration
  webrtc: {
    turnServerUrl: string;
    turnUsername: string;
    turnCredential: string;
  };

  // Logging Configuration
  logLevel: string;
  logFile: string;

  // Security Configuration
  rateLimit: {
    windowMs: number;
    maxRequests: number;
  };
  bcryptSaltRounds: number;

  // Session Configuration
  sessionSecret: string;
  sessionTimeout: number;

  // Development/Production Tools
  debug: boolean;
  enableSwagger: boolean;

  // SSL/TLS Configuration
  ssl: {
    keyPath: string;
    certPath: string;
    caPath: string;
  };

  // Performance Configuration
  clusterMode: boolean;
  maxWorkers: number;
  memoryLimit: string;

  // Monitoring Configuration
  healthCheckInterval: number;
  metricsEnabled: boolean;
  metricsPort: number;
}

// Helper function to parse boolean values
const parseBoolean = (
  value: string | undefined,
  defaultValue: boolean = false,
): boolean => {
  if (value === undefined) return defaultValue;
  return value.toLowerCase() === "true";
};

// Helper function to parse number values
const parseNumber = (
  value: string | undefined,
  defaultValue: number,
): number => {
  if (value === undefined) return defaultValue;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
};

// Helper function to get required environment variable
const getRequiredEnv = (key: string): string => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Required environment variable ${key} is not set`);
  }
  return value;
};

// Helper function to get optional environment variable
const getOptionalEnv = (key: string, defaultValue: string = ""): string => {
  return process.env[key] || defaultValue;
};

// Create and export configuration object
export const config: AppConfig = {
  // Server Configuration
  port: parseNumber(process.env.PORT, 3000),
  nodeEnv: getOptionalEnv("NODE_ENV", "development"),
  backendPort: parseNumber(process.env.BACKEND_PORT, 3000),

  // Database Configuration
  mongoUri: getOptionalEnv(
    "MONGO_URI",
    getOptionalEnv("MONGODB_URI", "mongodb://localhost:27017/glow-chat"),
  ),
  mongoDbName: getOptionalEnv("MONGO_DB_NAME", "glow-chat"),
  mongoRootUsername: getOptionalEnv("MONGO_ROOT_USERNAME", "admin"),
  mongoRootPassword: getOptionalEnv("MONGO_ROOT_PASSWORD", "password123"),
  mongoPort: parseNumber(process.env.MONGO_PORT, 27017),
  dbPoolSize: parseNumber(process.env.DB_POOL_SIZE, 10),
  dbTimeout: parseNumber(process.env.DB_TIMEOUT, 30000),
  dbRetryAttempts: parseNumber(process.env.DB_RETRY_ATTEMPTS, 3),

  // Redis Configuration
  redisUrl: getOptionalEnv("REDIS_URL", "redis://localhost:6379"),
  redisPort: parseNumber(process.env.REDIS_PORT, 6379),

  // JWT Configuration
  jwtSecret: getRequiredEnv("JWT_SECRET"),
  jwtExpiresIn: getOptionalEnv("JWT_EXPIRES_IN", "7d"),

  // Client Configuration
  clientUrl: getOptionalEnv("CLIENT_URL", "http://localhost:8080"),
  frontendPort: parseNumber(process.env.FRONTEND_PORT, 8080),
  corsOrigin: getOptionalEnv(
    "CORS_ORIGIN",
    getOptionalEnv("CLIENT_URL", "http://localhost:8080"),
  ),

  // API Configuration
  apiBaseUrl: getOptionalEnv("API_BASE_URL", "http://localhost:3000"),
  reactAppApiUrl: getOptionalEnv("REACT_APP_API_URL", "http://localhost:3000"),

  // File Upload Configuration
  cloudinary: {
    cloudName: getOptionalEnv("CLOUDINARY_CLOUD_NAME"),
    apiKey: getOptionalEnv("CLOUDINARY_API_KEY"),
    apiSecret: getOptionalEnv("CLOUDINARY_API_SECRET"),
  },
  maxFileSize: parseNumber(process.env.MAX_FILE_SIZE, 5242880), // 5MB default

  // Email Configuration
  smtp: {
    host: getOptionalEnv("SMTP_HOST", "smtp.gmail.com"),
    port: parseNumber(process.env.SMTP_PORT, 587),
    user: getOptionalEnv("SMTP_USER"),
    pass: getOptionalEnv("SMTP_PASS"),
  },
  emailFrom: getOptionalEnv("EMAIL_FROM", "noreply@glow-chat.com"),

  // WebRTC Configuration
  webrtc: {
    turnServerUrl: getOptionalEnv("TURN_SERVER_URL"),
    turnUsername: getOptionalEnv("TURN_USERNAME"),
    turnCredential: getOptionalEnv("TURN_CREDENTIAL"),
  },

  // Logging Configuration
  logLevel: getOptionalEnv("LOG_LEVEL", "info"),
  logFile: getOptionalEnv("LOG_FILE", "logs/app.log"),

  // Security Configuration
  rateLimit: {
    windowMs: parseNumber(process.env.RATE_LIMIT_WINDOW_MS, 900000), // 15 minutes
    maxRequests: parseNumber(process.env.RATE_LIMIT_MAX_REQUESTS, 100),
  },
  bcryptSaltRounds: parseNumber(process.env.BCRYPT_SALT_ROUNDS, 12),

  // Session Configuration
  sessionSecret: getRequiredEnv("SESSION_SECRET"),
  sessionTimeout: parseNumber(process.env.SESSION_TIMEOUT, 3600000), // 1 hour

  // Development/Production Tools
  debug: parseBoolean(process.env.DEBUG, nodeEnv === "development"),
  enableSwagger: parseBoolean(
    process.env.ENABLE_SWAGGER,
    nodeEnv === "development",
  ),

  // SSL/TLS Configuration
  ssl: {
    keyPath: getOptionalEnv("SSL_KEY_PATH"),
    certPath: getOptionalEnv("SSL_CERT_PATH"),
    caPath: getOptionalEnv("SSL_CA_PATH"),
  },

  // Performance Configuration
  clusterMode: parseBoolean(process.env.CLUSTER_MODE, nodeEnv === "production"),
  maxWorkers: parseNumber(process.env.MAX_WORKERS, 4),
  memoryLimit: getOptionalEnv("MEMORY_LIMIT", "512m"),

  // Monitoring Configuration
  healthCheckInterval: parseNumber(process.env.HEALTH_CHECK_INTERVAL, 30000),
  metricsEnabled: parseBoolean(
    process.env.METRICS_ENABLED,
    nodeEnv === "production",
  ),
  metricsPort: parseNumber(process.env.METRICS_PORT, 9090),
};

// Validate required configuration
export const validateConfig = (): void => {
  const errors: string[] = [];

  if (!config.jwtSecret) {
    errors.push("JWT_SECRET is required");
  }

  if (!config.sessionSecret) {
    errors.push("SESSION_SECRET is required");
  }

  if (config.jwtSecret && config.jwtSecret.length < 32) {
    errors.push("JWT_SECRET should be at least 32 characters long");
  }

  if (config.sessionSecret && config.sessionSecret.length < 32) {
    errors.push("SESSION_SECRET should be at least 32 characters long");
  }

  if (config.nodeEnv === "production") {
    if (
      config.jwtSecret.includes("dev-secret") ||
      config.jwtSecret.includes("change-in-production")
    ) {
      errors.push("JWT_SECRET must be changed for production");
    }

    if (
      config.sessionSecret.includes("dev-session") ||
      config.sessionSecret.includes("change-in-production")
    ) {
      errors.push("SESSION_SECRET must be changed for production");
    }
  }

  if (errors.length > 0) {
    throw new Error(`Configuration validation failed:\n${errors.join("\n")}`);
  }
};

// Export individual configuration sections for easier imports
export const dbConfig = {
  mongoUri: config.mongoUri,
  mongoDbName: config.mongoDbName,
  mongoRootUsername: config.mongoRootUsername,
  mongoRootPassword: config.mongoRootPassword,
  mongoPort: config.mongoPort,
  dbPoolSize: config.dbPoolSize,
  dbTimeout: config.dbTimeout,
  dbRetryAttempts: config.dbRetryAttempts,
};

export const redisConfig = {
  redisUrl: config.redisUrl,
  redisPort: config.redisPort,
};

export const jwtConfig = {
  jwtSecret: config.jwtSecret,
  jwtExpiresIn: config.jwtExpiresIn,
};

export const corsConfig = {
  origin: (
    origin: string | undefined,
    callback: (error: Error | null, allow?: boolean) => void,
  ) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);

    const allowedOrigins = [
      config.corsOrigin,
      "http://localhost:8080",
      "http://localhost:8081",
      "http://localhost:3001",
      "http://localhost:5173",
      "http://127.0.0.1:8080",
      "http://127.0.0.1:8081",
      "http://127.0.0.1:3001",
      "http://127.0.0.1:5173",
    ];

    if (config.nodeEnv === "development") {
      // In development, be more permissive
      const isLocalhost =
        origin.includes("localhost") || origin.includes("127.0.0.1");
      if (isLocalhost || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"), false);
      }
    } else {
      // In production, be strict
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"), false);
      }
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
};

export default config;
