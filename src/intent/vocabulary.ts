import { capabilities, categories, contexts, entries, kinds, technologies } from '../data/content.js'
import type { Goal, Predicate, Presentation } from './model.js'

export type Word =
  | { type: 'predicate'; predicate: Predicate }
  | { type: 'goal'; goal: Goal }
  | { type: 'presentation'; presentation: Presentation }
  | { type: 'and' | 'or' | 'not' | '(' | ')' | 'skip' }

const vocabulary = new Map<string, Word>()
const define = (word: Word, ...phrases: string[]) => {
  for (const phrase of phrases) vocabulary.set(phrase, word)
}

for (const value of kinds) define({ type: 'predicate', predicate: { field: 'kind', value } }, value)
for (const value of categories) define({ type: 'predicate', predicate: { field: 'category', value } }, value)
for (const value of technologies) define({ type: 'predicate', predicate: { field: 'technology', value } }, value.toLowerCase())
for (const value of capabilities) define({ type: 'predicate', predicate: { field: 'capability', value } }, value)
for (const value of contexts) define({ type: 'predicate', predicate: { field: 'context', value } }, value)

define({ type: 'predicate', predicate: { field: 'kind', value: 'project' } }, 'projects', 'work samples')
define({ type: 'predicate', predicate: { field: 'kind', value: 'experience' } }, 'experiences', 'work experience')
define({ type: 'predicate', predicate: { field: 'category', value: 'frontend' } }, 'front end', 'ui', 'frontend engineering', 'front end engineering')
define({ type: 'predicate', predicate: { field: 'category', value: 'backend' } }, 'back end', 'server side', 'backend engineering', 'back end engineering')
define({ type: 'predicate', predicate: { field: 'category', value: 'infrastructure' } }, 'infra', 'devops')
define({ type: 'predicate', predicate: { field: 'category', value: 'data' } }, 'data engineering')
define({ type: 'predicate', predicate: { field: 'category', value: 'architecture' } }, 'architecture')
define({ type: 'predicate', predicate: { field: 'capability', value: 'API design' } }, 'api', 'apis', 'api development')
define({ type: 'predicate', predicate: { field: 'capability', value: 'data pipelines' } }, 'etl', 'data pipeline')
define({ type: 'predicate', predicate: { field: 'technology', value: 'TypeScript' } }, 'ts')
define({ type: 'predicate', predicate: { field: 'technology', value: 'PostgreSQL' } }, 'postgres')
define({ type: 'predicate', predicate: { field: 'context', value: 'coursework' } }, 'academic', 'schoolwork')

for (const entry of entries) {
  define({ type: 'predicate', predicate: { field: 'id', value: entry.id } }, entry.title.toLowerCase())
}

define({ type: 'goal', goal: 'projects' }, 'explore projects', 'what have you built')
define({ type: 'goal', goal: 'experience' }, 'evaluate experience', 'what experience do you have')
define({ type: 'goal', goal: 'decisions' }, 'system architecture', 'engineering approach', 'engineering decisions', 'architecture decisions')
define({ type: 'presentation', presentation: 'comparison' }, 'compare', 'comparison')
define({ type: 'presentation', presentation: 'timeline' }, 'timeline', 'career timeline')
define({ type: 'presentation', presentation: 'skills' }, 'skills', 'technical skills', 'skill summary')
define({ type: 'presentation', presentation: 'case-study' }, 'case study', 'case studies')
define({ type: 'and' }, 'and', ',')
define({ type: 'or' }, 'or')
define({ type: 'not' }, 'not', 'without', 'except', 'excluding', 'exclude', 'but not')
define({ type: '(' }, '(')
define({ type: ')' }, ')')
define({ type: 'skip' },
  'show me', 'show', 'tell me about',
  'how do you approach', 'involving', 'using', 'with', 'your', 'me', 'for', 'about', 'in',
  'the', 'a', 'an', 'most relevant')

export const maxQueryLength = 240

export function tokenize(input: string) {
  const parts = input.normalize('NFKC').toLowerCase()
    .replace(/[-‐‑]/gu, ' ')
    .replace(/[.?!]+$/u, '')
    .match(/[\p{L}\p{N}]+|[^\s]/gu) ?? []
  const tokens: Word[] = []
  const unknown: string[] = []
  for (let index = 0; index < parts.length;) {
    let match: Word | undefined
    let count = Math.min(5, parts.length - index)
    for (; count > 0; count -= 1) {
      match = vocabulary.get(parts.slice(index, index + count).join(' '))
      if (match) break
    }
    if (match) {
      if (match.type !== 'skip') tokens.push(match)
      index += count
    } else {
      unknown.push(parts[index])
      index += 1
    }
  }
  return { tokens, unknown: [...new Set(unknown)] }
}
