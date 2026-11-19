import type { Entry } from '../data/content.js'
import type { Expression, Predicate } from '../intent/model.js'

type Truth = boolean | undefined

function matchesPredicate(entry: Entry, predicate: Predicate): Truth {
  switch (predicate.field) {
    case 'kind': return entry.kind === predicate.value
    case 'category': return entry.categories.includes(predicate.value)
    case 'technology': return entry.technologies?.includes(predicate.value)
    case 'capability': return entry.capabilities?.includes(predicate.value)
    case 'context': return entry.context === undefined ? undefined : entry.context === predicate.value
    case 'id': return entry.id === predicate.value
    default: return undefined
  }
}

function test(entry: Entry, expression: Expression): Truth {
  switch (expression.type) {
    case 'all': return true
    case 'predicate': return matchesPredicate(entry, expression.predicate)
    case 'not': {
      const result = test(entry, expression.expression)
      return result === undefined ? undefined : !result
    }
    case 'and': {
      const left = test(entry, expression.left)
      if (left === false) return false
      const right = test(entry, expression.right)
      return right === false ? false : left === true && right === true ? true : undefined
    }
    case 'or': {
      const left = test(entry, expression.left)
      if (left === true) return true
      const right = test(entry, expression.right)
      return right === true ? true : left === false && right === false ? false : undefined
    }
    default: return undefined
  }
}

export interface Evaluation {
  matches: Entry[]
  evaluatedCount: number
  indeterminateCount: number
}

export function evaluate(expression: Expression, entries: readonly Entry[]): Evaluation {
  const matches: Entry[] = []
  let indeterminateCount = 0
  for (const entry of entries) {
    const result = test(entry, expression)
    if (result === true) matches.push(entry)
    if (result === undefined) indeterminateCount += 1
  }
  return { matches, evaluatedCount: entries.length, indeterminateCount }
}
