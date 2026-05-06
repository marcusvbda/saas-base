import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL })
  const adapter = new PrismaPg(pool)
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })
}

// Cache on globalThis so warm serverless invocations reuse the same client
// and connection pool instead of opening fresh connections on every request.
// On Supabase: DATABASE_URL = pooler (port 6543), DIRECT_URL = direct (port 5432).
export const db = globalForPrisma.prisma ?? createPrismaClient()
globalForPrisma.prisma = db
