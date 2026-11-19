import { categories, contexts, entries, kinds, searchableCapabilities, technologies } from '../data/content.js'
import type { Expression, Predicate } from '../intent/model.js'

const predicates: Predicate[] = [
  ...kinds.map(value => ({ field: 'kind' as const, value })),
  ...categories.map(value => ({ field: 'category' as const, value })),
  ...technologies.map(value => ({ field: 'technology' as const, value })),
  ...searchableCapabilities.map(value => ({ field: 'capability' as const, value })),
  ...contexts.map(value => ({ field: 'context' as const, value })),
  ...entries.map(entry => ({ field: 'id' as const, value: entry.id })),
]

const predicateKey = ({ field, value }: Predicate) => field + ':' + value
const knownPredicates = new Map(predicates.map(predicate => [predicateKey(predicate), predicate]))
const maxFilterLength = 4096

// Postfix tokens preserve the tree's grouping without retaining query phrasing.
export function encodeFilter(expression: Expression): string | undefined {
  switch (expression.type) {
    case 'all': return 'all'
    case 'predicate': {
      const key = predicateKey(expression.predicate)
      return knownPredicates.has(key) ? key : undefined
    }
    case 'not': {
      const child = encodeFilter(expression.expression)
      return child && child + ',not'
    }
    case 'and':
    case 'or': {
      const left = encodeFilter(expression.left)
      const right = encodeFilter(expression.right)
      return left && right && [left, right, expression.type].join(',')
    }
  }
}

export function decodeFilter(filter: string): Expression | undefined {
  if (filter.length > maxFilterLength) return undefined
  const stack: Expression[] = []
  for (const token of filter.split(',')) {
    switch (token) {
      case 'all':
        stack.push({ type: 'all' })
        break
      case 'not': {
        const expression = stack.pop()
        if (!expression) return undefined
        stack.push({ type: 'not', expression })
        break
      }
      case 'and':
      case 'or': {
        const right = stack.pop()
        const left = stack.pop()
        if (!left || !right) return undefined
        stack.push({ type: token, left, right })
        break
      }
      default: {
        const predicate = knownPredicates.get(token)
        if (!predicate) return undefined
        stack.push({ type: 'predicate', predicate })
      }
    }
  }
  return stack.length === 1 ? stack[0] : undefined
}
