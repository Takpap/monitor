import { z } from 'zod'

const keywordSchema = z
  .array(z.string().trim().min(1).max(64))
  .min(1)
  .max(64)

const excludeSchema = z
  .array(z.string().trim().min(1).max(64))
  .max(64)
  .default([])

const ownerIdSchema = z
  .string()
  .trim()
  .min(1)
  .max(64)
  .regex(/^[a-zA-Z0-9._:-]+$/, 'ownerId 仅允许字母、数字、._:-')

const notifierSchema = z.object({
  channels: z.array(z.enum(['console', 'webhook'])).min(1).max(8).optional(),
  webhook: z
    .object({
      enabled: z.coerce.boolean().optional(),
      url: z.string().trim().max(600).optional(),
      headers: z.record(z.string().trim().max(300)).optional(),
      timeoutMs: z.coerce.number().int().min(1000).max(60000).optional()
    })
    .optional()
})

export const subscriptionCreateSchema = z.object({
  ownerId: ownerIdSchema.default('default'),
  name: z.string().trim().min(1).max(80),
  keywords: keywordSchema,
  excludeKeywords: excludeSchema,
  matchMode: z.enum(['any', 'all']).default('any'),
  minComments: z.coerce.number().int().min(0).max(100000).default(0),
  enabled: z.coerce.boolean().default(true)
})

export const subscriptionUpdateSchema = z.object({
  ownerId: ownerIdSchema.optional(),
  name: z.string().trim().min(1).max(80).optional(),
  keywords: keywordSchema.optional(),
  excludeKeywords: excludeSchema.optional(),
  matchMode: z.enum(['any', 'all']).optional(),
  minComments: z.coerce.number().int().min(0).max(100000).optional(),
  enabled: z.coerce.boolean().optional()
})

export const subscriptionPreviewSchema = z.object({
  title: z.string().trim().min(1).max(300),
  description: z.string().trim().max(4000).optional().default(''),
  keywords: keywordSchema,
  excludeKeywords: excludeSchema,
  matchMode: z.enum(['any', 'all']).default('any')
})

export const subscriptionVersionsQuerySchema = z.object({
  subscriptionId: z.coerce.number().int().min(1),
  ownerId: ownerIdSchema.optional(),
  limit: z.coerce.number().int().min(1).max(200).optional()
})

export const subscriptionRollbackSchema = z.object({
  subscriptionId: z.coerce.number().int().min(1),
  versionId: z.coerce.number().int().min(1)
})

const feedUrlSchema = z
  .string()
  .trim()
  .min(8)
  .refine((v) => /^https?:\/\//.test(v), 'feedUrls 必须是 http/https URL')

export const monitorSettingsUpdateSchema = z.object({
  pollIntervalSeconds: z.coerce.number().int().min(10).max(3600).optional(),
  bootstrapSkipExisting: z.coerce.boolean().optional(),
  strictCommentFilter: z.coerce.boolean().optional(),
  maxSeenDays: z.coerce.number().int().min(1).max(180).optional(),
  feedUrls: z.array(feedUrlSchema).min(1).max(20).optional(),
  httpTimeoutMs: z.coerce.number().int().min(3000).max(120000).optional(),
  httpUserAgent: z.string().trim().min(8).max(400).optional(),
  notifier: notifierSchema.optional()
})

export const notifierTestSchema = z.object({
  ownerId: ownerIdSchema.optional(),
  title: z.string().trim().min(1).max(300).optional(),
  link: z
    .string()
    .trim()
    .max(800)
    .refine((v) => !v || /^https?:\/\//.test(v), 'link 必须是 http/https URL')
    .optional(),
  matchedKeywords: z.array(z.string().trim().min(1).max(64)).max(32).optional(),
  channels: z.array(z.enum(['console', 'webhook'])).min(1).max(8).optional()
})

const optionalInt = (min: number, max?: number) =>
  z.preprocess((value) => {
    if (value === undefined || value === null) return undefined
    const text = String(value).trim()
    return text === '' ? undefined : text
  }, max === undefined
    ? z.coerce.number().int().min(min).optional()
    : z.coerce.number().int().min(min).max(max).optional())

const optionalTrimmedString = (max = 300) =>
  z.preprocess((value) => {
    if (value === undefined || value === null) return undefined
    const text = String(value).trim()
    return text === '' ? undefined : text
  }, z.string().trim().max(max).optional())

const optionalOwnerIdSchema = z.preprocess((value) => {
  if (value === undefined || value === null) return undefined
  const text = String(value).trim()
  return text === '' ? undefined : text
}, ownerIdSchema.optional())

export const hitsQuerySchema = z
  .object({
    limit: optionalInt(1, 200).default(50),
    ownerId: optionalOwnerIdSchema,
    cursorId: optionalInt(1),
    subscriptionId: optionalInt(1),
    keyword: optionalTrimmedString(300),
    commentMin: optionalInt(0),
    commentMax: optionalInt(0)
  })
  .superRefine((data, ctx) => {
    if (
      data.commentMin !== undefined &&
      data.commentMax !== undefined &&
      data.commentMin > data.commentMax
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'commentMin 不能大于 commentMax',
        path: ['commentMin']
      })
    }
  })
