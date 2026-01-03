import dotenv from 'dotenv'

dotenv.config()

function getEnvVar(key: string, required = true): string {
  const value = process.env[key]
  if (required && !value) {
    throw new Error(`Missing required environment variable: ${key}`)
  }
  return value || ''
}

export const ENV = {
  NODE_ENV: getEnvVar('NODE_ENV', false) || 'development',
  PORT: getEnvVar('PORT', false) || '3000',
  DB_URL: getEnvVar('DB_URL'),
  CLERK_PUBLISHABLE_KEY: getEnvVar('CLERK_PUBLISHABLE_KEY'),
  CLERK_SECRET_KEY: getEnvVar('CLERK_SECRET_KEY'),
  CLOUDINARY_CLOUD_NAME: getEnvVar('CLOUDINARY_CLOUD_NAME'),
  CLOUDINARY_API_SECRET: getEnvVar('CLOUDINARY_API_SECRET'),
  CLOUDINARY_API_KEY: getEnvVar('CLOUDINARY_API_KEY'),
  INNGEST_SIGNING_KEY: getEnvVar('INNGEST_SIGNING_KEY'),
  ADMIN_EMAIL: getEnvVar('ADMIN_EMAIL'),
  CLIENT_URL: getEnvVar('CLIENT_URL'),
  // STRIPE_PUBLISHABLE_KEY: getEnvVar('STRIPE_PUBLISHABLE_KEY'),
  // STRIPE_SECRET_KEY: getEnvVar('STRIPE_SECRET_KEY'),
  // STRIPE_WEBHOOK_SECRET: getEnvVar('STRIPE_WEBHOOK_SECRET'),
} as const
