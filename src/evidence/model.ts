export const dimensions = ['requirement', 'change', 'reference', 'validation', 'established', 'limits'] as const
export type Dimension = typeof dimensions[number]

export const classifications = [
  'candidate-authored account', 'recorded evaluation result', 'publicly verifiable',
  'independently reproduced', 'attribution uncertain', 'needs confirmation', 'planned',
] as const

export const claimKinds = ['contribution', 'decision', 'evaluation', 'coordination'] as const
export const responsibilityRoles = ['implementation', 'design', 'direction', 'maintenance', 'review', 'validation', 'coordination'] as const
export const attributionScopes = ['individual', 'collaborative', 'system-only', 'uncertain'] as const
export const sourceTypes = ['candidate-published account', 'public artifact', 'independent report'] as const

export interface ClaimDetails {
  kind?: typeof claimKinds[number]
  attribution?: {
    roles?: readonly typeof responsibilityRoles[number][]
    scope?: typeof attributionScopes[number]
    aiAssisted?: boolean
  }
  problem?: string
  constraints?: readonly string[]
  alternatives?: readonly string[]
  validationContext?: { reference?: string; environment?: string }
  coordination?: readonly string[]
  revision?: number
}

// Only these optional fields may cross the approved claim boundary.
export function validClaimDetails(details: ClaimDetails): boolean {
  const known = (value: object, fields: readonly string[]) => Object.keys(value).every(key => fields.includes(key))
  const text = (value: unknown) => typeof value === 'string' && value.trim().length > 0
  const texts = (items: unknown) => Array.isArray(items) && items.length > 0 && Array.from(items).every(text)
  const { kind, attribution, problem, constraints, alternatives, validationContext, coordination, revision } = details
  return known(details, ['kind', 'attribution', 'problem', 'constraints', 'alternatives', 'validationContext', 'coordination', 'revision']) &&
    (kind === undefined || claimKinds.includes(kind)) &&
    (attribution === undefined || (known(attribution, ['roles', 'scope', 'aiAssisted']) &&
      (attribution.roles === undefined || (texts(attribution.roles) && Array.from(attribution.roles).every(role => responsibilityRoles.includes(role)))) &&
      (attribution.scope === undefined || attributionScopes.includes(attribution.scope)) &&
      (attribution.aiAssisted === undefined || typeof attribution.aiAssisted === 'boolean'))) &&
    (problem === undefined || text(problem)) &&
    [constraints, alternatives, coordination].every(items => items === undefined || texts(items)) &&
    (validationContext === undefined || (known(validationContext, ['reference', 'environment']) &&
      Object.values(validationContext).every(text))) &&
    (revision === undefined || (Number.isSafeInteger(revision) && revision >= 1))
}

export interface Claim {
  id: string
  projectId: string
  title: string
  contribution: string
  role: string
  implementation: string
  validation: string
  outcome: string
  limit: string
  classification: typeof classifications[number]
  status: 'approved' | 'review' | 'superseded' | 'withdrawn'
  capabilities: readonly string[]
  source: { entryId: string; type?: typeof sourceTypes[number] }
  details?: ClaimDetails
}

export interface Relationship {
  id: string
  status: Claim['status']
  operation: 'comparison' | 'responsibility'
  label: string
  claimIds: readonly string[]
  interpretation: string
  limit: string
  readings: Readonly<Record<string, { contrast: string; observations: readonly string[] }>>
}

export interface PresentationPlan {
  version: 1
  operation: Relationship['operation']
  focus: string
  components: readonly { type: 'evidence-comparison' | 'responsibility-brief'; relationshipId: string; claimIds: readonly string[] }[]
}

export function validatePlan(value: unknown, claims: readonly Claim[], relationships: readonly Relationship[]): value is PresentationPlan {
  if (!hasKeys(value, ['version','operation','focus','components']) || value.version !== 1 ||
      !Array.isArray(value.components) || !value.components.length || value.components.length > 4 ||
      typeof value.focus !== 'string' || value.focus.length > 60) return false
  const type = value.operation === 'comparison' ? 'evidence-comparison' :
    value.operation === 'responsibility' ? 'responsibility-brief' : undefined
  if (!type) return false
  const seen = new Set<string>()
  return Array.from(value.components).every((block: unknown) => {
    if (!hasKeys(block, ['type','relationshipId','claimIds']) || block.type !== type ||
        typeof block.relationshipId !== 'string' || block.relationshipId.length > 80 ||
        seen.has(block.relationshipId) || !Array.isArray(block.claimIds) || block.claimIds.length > 6) return false
    seen.add(block.relationshipId)
    const relation = relationships.find(item => item.id === block.relationshipId && item.status === 'approved')
    if (!relation || relation.operation !== value.operation || !Object.hasOwn(relation.readings, value.focus as string)) return false
    return relation.claimIds.length === block.claimIds.length &&
      relation.claimIds.every((id, i) => id === (block.claimIds as unknown[])[i] && claims.some(claim => claim.id === id && claim.status === 'approved'))
  })
}

function hasKeys(value: unknown, keys: readonly string[]): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' &&
    Object.keys(value).length === keys.length && keys.every(key => Object.hasOwn(value, key))
}

export function parsePlan(text: string, claims: readonly Claim[], relationships: readonly Relationship[]): PresentationPlan | undefined {
  if (text.length > 8192 || new TextEncoder().encode(text).length > 8192) return
  try {
    const value: unknown = JSON.parse(text)
    if (validatePlan(value, claims, relationships)) return value
  } catch {
    // Invalid JSON has no presentation.
  }
}
