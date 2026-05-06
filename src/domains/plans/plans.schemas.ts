import { z } from 'zod'

export const planSchema = z.enum(['FREE', 'PRO', 'BUSINESS'])
export const gateActionSchema = z.enum(['projects', 'members', 'canExport', 'canUseApi'])

export type PlanKey = z.infer<typeof planSchema>
export type GateActionKey = z.infer<typeof gateActionSchema>
