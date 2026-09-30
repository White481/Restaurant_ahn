import "dotenv/config";

function requiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function integerEnv(name: string, fallback: number, min: number, max: number): number {
  const rawValue = process.env[name];
  if (rawValue === undefined || rawValue.trim() === "") {
    return fallback;
  }

  const value = Number(rawValue);
  if (!Number.isInteger(value) || value < min || value > max) {
    throw new Error(`${name} must be an integer between ${min} and ${max}`);
  }
  return value;
}

export const config = {
  port: integerEnv("PORT", 3000, 1, 65535),
  database: {
    host: process.env.DB_HOST?.trim() || "localhost",
    port: integerEnv("DB_PORT", 3306, 1, 65535),
    user: requiredEnv("DB_USER"),
    password: requiredEnv("DB_PASSWORD"),
    database: process.env.DB_NAME?.trim() || "restaurant_oms",
  },
};
