import { z } from 'zod'

const schema = z.object({
  NODE_ENV:                            z.enum(['development', 'test', 'production']),
  DATABASE_URL:                        z.url(),
  DIRECT_URL:                          z.url(),

  NEXT_PUBLIC_APP_URL:                 z.url(),

  NEXT_PUBLIC_SUPABASE_URL:            z.url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY:       z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY:           z.string().min(1),

  STRIPE_SECRET_KEY:                   z.string().startsWith('sk_'),
  STRIPE_WEBHOOK_SECRET:               z.string().startsWith('whsec_'),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY:  z.string().startsWith('pk_'),
  STRIPE_PRICE_PRO_USD:                z.string().min(1),
  STRIPE_PRICE_BUSINESS_USD:           z.string().min(1),
})

export const env = schema.parse(process.env)
export type Env = z.infer<typeof schema>
