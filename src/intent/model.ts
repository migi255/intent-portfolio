import type { Capability, Category, Context, Kind, Technology } from '../data/content.js'

export const goals = ['projects', 'experience', 'decisions'] as const
export type Goal = typeof goals[number]
export type Presentation = 'default' | 'grouped' | 'comparison' | 'timeline' | 'skills' | 'case-study'

export type Predicate =
  | { field: 'kind'; value: Kind }
  | { field: 'category'; value: Category }
  | { field: 'technology'; value: Technology }
  | { field: 'capability'; value: Capability }
  | { field: 'context'; value: Context }
  | { field: 'id'; value: string }

export type Expression =
  | { type: 'all' }
  | { type: 'predicate'; predicate: Predicate }
  | { type: 'not'; expression: Expression }
  | { type: 'and' | 'or'; left: Expression; right: Expression }

export type Intent =
  | { status: 'resolved'; goal: Goal; expression: Expression; presentation: Presentation }
  | { status: 'unsupported'; message: string; terms: string[] }
  | { status: 'ambiguous'; message: string; goals: readonly Goal[] }

export const goalLabels: Record<Goal, string> = {
  projects: 'Explore Projects',
  experience: 'Evaluate Experience',
  decisions: 'Selected engineering decisions',
}

export const isGoal = (value: unknown): value is Goal => goals.some(goal => goal === value)
