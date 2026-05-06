// Run 'npm run db:generate' before this file will compile — Plan comes from Prisma
import type { Plan } from '@prisma/client'

export type GateAction =
  | 'projects'
  | 'members'
  | 'canExport'
  | 'canUseApi'

export type Gates = {
  projects:  number
  members:   number
  canExport: boolean
  canUseApi: boolean
}

export const GATES: Record<Plan, Gates> = {
  FREE: {
    projects:  1,
    members:   3,
    canExport: false,
    canUseApi: false,
  },
  PRO: {
    projects:  10,
    members:   15,
    canExport: true,
    canUseApi: false,
  },
  BUSINESS: {
    projects:  999,
    members:   999,
    canExport: true,
    canUseApi: true,
  },
}

export type CanResult =
  | { allowed: true }
  | { allowed: false; reason: 'upgrade_required' | 'limit_reached'; limit?: number }
