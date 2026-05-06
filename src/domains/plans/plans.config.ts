export const PLAN_CONFIG = {
  FREE: {
    nameKey:        'plans.free.name',
    descriptionKey: 'plans.free.description',
    price:          { usd: 0 },
    priceIdEnvKey:  null,
    featureKeys: [
      'plans.free.feature1',
      'plans.free.feature2',
      'plans.free.feature3',
    ],
  },
  PRO: {
    nameKey:        'plans.pro.name',
    descriptionKey: 'plans.pro.description',
    price:          { usd: 29 },
    priceIdEnvKey:  'STRIPE_PRICE_PRO_USD' as const,
    featureKeys: [
      'plans.pro.feature1',
      'plans.pro.feature2',
      'plans.pro.feature3',
      'plans.pro.feature4',
    ],
  },
  BUSINESS: {
    nameKey:        'plans.business.name',
    descriptionKey: 'plans.business.description',
    price:          { usd: 79 },
    priceIdEnvKey:  'STRIPE_PRICE_BUSINESS_USD' as const,
    featureKeys: [
      'plans.business.feature1',
      'plans.business.feature2',
      'plans.business.feature3',
      'plans.business.feature4',
      'plans.business.feature5',
    ],
  },
} as const
