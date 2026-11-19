import type { Kind } from '../data/content.js'
import type { Expression, Goal, Intent, Presentation } from './model.js'
import { maxQueryLength, tokenize, type Word } from './vocabulary.js'

const kind = (value: Kind): Expression => ({ type: 'predicate', predicate: { field: 'kind', value } })
const scopes: Record<Goal, Expression> = {
  projects: kind('project'),
  experience: kind('experience'),
  decisions: { type: 'or', left: kind('project'), right: kind('decision') },
}
const goalForKind: Record<Kind, Goal> = { project: 'projects', experience: 'experience', decision: 'decisions' }
const goalForPresentation: Record<Exclude<Presentation, 'default'>, Goal> = {
  comparison: 'experience',
  timeline: 'experience',
  skills: 'experience',
  'case-study': 'decisions',
}

export function resolveGoal(goal: Goal): Intent {
  return { status: 'resolved', goal, expression: scopes[goal], presentation: 'default' }
}

export function parseIntent(query: string, fallback: Goal = 'projects', chosenGoal?: Goal): Intent {
  if (query.length > maxQueryLength) return unsupported('Enter a shorter query.')
  if (!query.trim()) return resolveGoal(chosenGoal ?? fallback)

  const { tokens, unknown } = tokenize(query.trim())
  if (unknown.length) return unsupported('Some terms are outside the supported vocabulary.', unknown)
  const requested = new Set<Goal>()
  const presentations = new Set<Presentation>()
  const terms: Word[] = []
  for (const token of tokens) {
    if (token.type === 'goal') requested.add(token.goal)
    else if (token.type === 'presentation') {
      presentations.add(token.presentation)
      if (token.presentation !== 'default') requested.add(goalForPresentation[token.presentation])
    } else terms.push(token)
  }

  try {
    const expression = terms.length ? parseExpression(terms) : undefined
    if (!expression && requested.size === 0) return unsupported('Add a project, skill, technology, or category.')
    const inferred = expression ? positiveGoals(expression) : []
    const candidates = requested.size ? [...requested] : inferred
    if (!chosenGoal && candidates.length > 1) {
      return { status: 'ambiguous', message: 'This query points to more than one layout. Choose how to view the matches.', goals: candidates }
    }
    if (presentations.size > 1) return unsupported('Request one layout at a time, such as comparison or timeline.')
    const goal = chosenGoal ?? candidates[0] ?? fallback
    const requestedPresentation = [...presentations][0] ?? 'default'
    const presentation = requestedPresentation !== 'default' && goalForPresentation[requestedPresentation] === goal
      ? requestedPresentation : 'default'
    const scope = expression && inferred.length === 0
      ? { type: 'and' as const, left: scopes[goal], right: expression }
      : expression ?? scopes[goal]
    return { status: 'resolved', goal, expression: scope, presentation }
  } catch (error) {
    if (error instanceof SyntaxError) return unsupported(error.message)
    throw error
  }
}

function unsupported(message: string, terms: string[] = []): Intent {
  return { status: 'unsupported', message, terms }
}

function positiveGoals(expression: Expression, negated = false): Goal[] {
  switch (expression.type) {
    case 'predicate':
      return !negated && expression.predicate.field === 'kind' ? [goalForKind[expression.predicate.value]] : []
    case 'not': return positiveGoals(expression.expression, !negated)
    case 'and':
    case 'or': return [...new Set([...positiveGoals(expression.left, negated), ...positiveGoals(expression.right, negated)])]
    case 'all': return []
  }
}

function parseExpression(tokens: readonly Word[]): Expression {
  let cursor = 0
  const peek = () => tokens[cursor]?.type

  function primary(): Expression {
    const token = tokens[cursor++]
    if (token?.type === 'not') return { type: 'not', expression: primary() }
    if (token?.type === 'predicate') return { type: 'predicate', predicate: token.predicate }
    if (token?.type === '(') {
      const expression = disjunction()
      if (peek() !== ')') throw new SyntaxError('Close the parenthesized group with a right parenthesis.')
      cursor += 1
      return expression
    }
    throw new SyntaxError('Expected a criterion after the operator or opening parenthesis.')
  }

  function conjunction(): Expression {
    let left = primary()
    while (peek() === 'and' || peek() === 'predicate' || peek() === '(' || peek() === 'not') {
      if (peek() === 'and') cursor += 1
      left = { type: 'and', left, right: primary() }
    }
    return left
  }

  function disjunction(): Expression {
    let left = conjunction()
    while (peek() === 'or') {
      cursor += 1
      left = { type: 'or', left, right: conjunction() }
    }
    return left
  }

  const expression = disjunction()
  if (cursor !== tokens.length) throw new SyntaxError('Check the placement of operators and parentheses.')
  return expression
}
