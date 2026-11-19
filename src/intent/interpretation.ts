import type { Entry, Kind } from '../data/content.js'
import { evaluate, testExpression } from '../evaluation/evaluate.js'
import { planInterface } from '../planning/plan.js'
import type { Expression, Intent, Predicate } from './model.js'

export const suggestedIntents = [
  { label: 'Technology', query: 'Java and backend work' },
  { label: 'Engineering problem', query: 'Performance optimization' },
  { label: 'Constraint', query: 'Professional work' },
  { label: 'Engineering judgment', query: 'Where testing changed the design' },
] as const

const kindLabels: Record<Kind, string> = {
  project: 'Projects',
  experience: 'Experience',
  decision: 'Engineering decisions',
}

function predicateLabel(predicate: Predicate, entries: readonly Entry[]): string {
  switch (predicate.field) {
    case 'id': return entries.find(entry => entry.id === predicate.value)?.title ?? 'Named work'
    case 'context': return predicate.value === 'coursework' ? 'Coursework' :
      predicate.value === 'professional' ? 'Professional work' : 'Independent work'
    case 'kind': return kindLabels[predicate.value]
    case 'category': return predicate.value.charAt(0).toUpperCase() + predicate.value.slice(1)
    default: return predicate.value
  }
}

export function describeCriteria(expression: Expression, entries: readonly Entry[], parent = 0): string {
  switch (expression.type) {
    case 'all': return 'Any catalog record'
    case 'predicate': return predicateLabel(expression.predicate, entries)
    case 'not': return 'not ' + describeCriteria(expression.expression, entries, 3)
    case 'and':
    case 'or': {
      const precedence = expression.type === 'and' ? 2 : 1
      const left = describeCriteria(expression.left, entries, precedence)
      const right = describeCriteria(expression.right, entries, precedence)
      const description = left + ' ' + expression.type + ' ' + right
      return precedence < parent ? '(' + description + ')' : description
    }
  }
}

export function explainMatch(entry: Entry, expression: Expression): string[] {
  // Walk only the branches that actually prove the result, including known exclusions.
  function reasons(node: Expression, expected: boolean): string[] {
    if (testExpression(entry, node) !== expected) return []
    switch (node.type) {
      case 'all': return []
      case 'predicate':
        if (node.predicate.field === 'kind' || node.predicate.field === 'id') return []
        return [(expected ? '' : 'not ') + predicateLabel(node.predicate, [])]
      case 'not': return reasons(node.expression, !expected)
      case 'and':
      case 'or': return [...reasons(node.left, expected), ...reasons(node.right, expected)]
    }
  }
  return [...new Set(reasons(expression, true))].slice(0, 3)
}

function conjunctions(expression: Expression): Expression[] {
  return expression.type === 'and'
    ? [...conjunctions(expression.left), ...conjunctions(expression.right)]
    : [expression]
}

export function suggestBroaderIntents(intent: Extract<Intent, { status: 'resolved' }>, entries: readonly Entry[]) {
  const parts = conjunctions(intent.expression)
  if (parts.length < 2) return []
  return parts.flatMap((removed, index) => {
    // A requested record kind and a named record remain part of the visitor's scope.
    if (removed.type === 'predicate' && (removed.predicate.field === 'kind' || removed.predicate.field === 'id')) return []
    const expression = parts.filter((_, position) => position !== index)
      .reduce<Expression>((left, right) => left.type === 'all' ? right : { type: 'and', left, right }, { type: 'all' })
    const next = { ...intent, expression }
    const plan = planInterface(next, evaluate(expression, entries))
    const count = new Set(plan.blocks.flatMap(block => block.entryIds)).size
    return count ? [{ removed: describeCriteria(removed, entries), intent: next, count }] : []
  }).slice(0, 3)
}
