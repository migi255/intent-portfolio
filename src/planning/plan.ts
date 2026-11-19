import type { Entry } from '../data/content.js'
import type { Evaluation } from '../evaluation/evaluate.js'
import { isGoal, type Goal, type Intent } from '../intent/model.js'

export const blockKinds = ['cards', 'comparison', 'timeline', 'skills', 'decisions', 'case-study'] as const
export type BlockKind = typeof blockKinds[number]
export interface Block {
  kind: BlockKind
  entryIds: string[]
}
export interface Plan {
  goal: Goal
  blocks: Block[]
}

export function planInterface(intent: Extract<Intent, { status: 'resolved' }>, result: Evaluation): Plan {
  const { goal, presentation } = intent
  if (result.matches.length === 0) return { goal, blocks: [] }
  let kinds: readonly BlockKind[]
  if (presentation !== 'default') kinds = [presentation]
  else if (goal === 'experience') kinds = ['skills', 'comparison', 'timeline']
  else if (goal === 'decisions') kinds = ['decisions']
  else kinds = ['cards']
  return {
    goal,
    blocks: kinds.flatMap(kind => {
      const ids = result.matches.filter(entry => supportsBlock(kind, entry)).map(entry => entry.id)
      return ids.length ? [{ kind, entryIds: ids }] : []
    }),
  }
}

function supportsBlock(kind: BlockKind, entry: Entry): boolean {
  if (kind === 'timeline') return Boolean(entry.date)
  if (kind === 'case-study') return Boolean(entry.caseStudy || entry.decision)
  if (kind === 'decisions') return Boolean(entry.decision)
  return true
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

export function validatePlan(value: unknown, entries: readonly Entry[]): value is Plan {
  if (!isRecord(value) || !isGoal(value.goal) || !Array.isArray(value.blocks)) return false
  const byId = new Map(entries.map(entry => [entry.id, entry]))
  const seen = new Set<unknown>()
  for (const block of value.blocks) {
    if (!isRecord(block)) return false
    const kind = blockKinds.find(kind => block.kind === kind)
    if (!kind || seen.has(kind)) return false
    if (!Array.isArray(block.entryIds) || !block.entryIds.length || new Set(block.entryIds).size !== block.entryIds.length) return false
    for (const id of block.entryIds) {
      const entry = typeof id === 'string' ? byId.get(id) : undefined
      if (!entry || !supportsBlock(kind, entry)) return false
    }
    seen.add(kind)
  }
  return true
}
