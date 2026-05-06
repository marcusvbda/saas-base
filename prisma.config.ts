import path from 'node:path'
import { config } from 'dotenv'
import { defineConfig } from 'prisma/config'

// The Prisma CLI doesn't load .env.local automatically — Next.js does.
// Load it here so db:migrate / db:push / db:studio work in dev without
// needing to prefix every command with DIRECT_URL=...
config({ path: '.env.local', override: false })
config({ path: '.env', override: false })

export default defineConfig({
  schema: path.join('prisma', 'schema.prisma'),
  datasource: {
    url: process.env['DIRECT_URL']!,
  },
})
