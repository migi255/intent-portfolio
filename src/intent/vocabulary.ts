import { categories, contexts, entries, kinds, searchableCapabilities, technologies, type Entry } from '../data/content.js'
import type { Goal, Predicate, Presentation } from './model.js'

export type Word =
  | { type: 'predicate'; predicate: Predicate }
  | { type: 'goal'; goal: Goal }
  | { type: 'presentation'; presentation: Presentation }
  | { type: 'and' | 'or' | 'not' | '(' | ')' | 'skip' }

const vocabulary = new Map<string, Word>()
const define = (word: Word, ...phrases: string[]) => {
  for (const phrase of phrases) vocabulary.set(splitPhrase(phrase).join(' '), word)
}

for (const value of kinds) define({ type: 'predicate', predicate: { field: 'kind', value } }, value)
for (const value of categories) define({ type: 'predicate', predicate: { field: 'category', value } }, value)
for (const value of technologies) define({ type: 'predicate', predicate: { field: 'technology', value } }, value.toLowerCase())
for (const value of searchableCapabilities) define({ type: 'predicate', predicate: { field: 'capability', value } }, value.toLowerCase().replace(/-/g, ' '))
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

define({ type: 'predicate', predicate: { field: 'capability', value: 'CI/CD' } }, 'ci / cd')
define({ type: 'predicate', predicate: { field: 'capability', value: 'system maintenance' } }, 'improved or extended')
define({ type: 'predicate', predicate: { field: 'capability', value: 'performance optimization' } }, 'performance', 'performance optimization', 'performance engineering')
define({ type: 'predicate', predicate: { field: 'capability', value: 'differential testing' } }, 'validate algorithm changes', 'algorithm validation', 'compare optimized algorithms')
define({ type: 'predicate', predicate: { field: 'capability', value: 'regression testing' } }, 'testing practices', 'regression tests', 'test reliability')
define({ type: 'predicate', predicate: { field: 'capability', value: 'debugging' } }, 'debug', 'troubleshooting', 'diagnose defects')
define({ type: 'predicate', predicate: { field: 'capability', value: 'requirements interpretation' } }, 'responding to user feedback', 'researcher feedback', 'researcher requirements', 'user requirements')
define({ type: 'predicate', predicate: { field: 'capability', value: 'scientific correctness' } }, 'preserve correctness when optimizing software', 'preserve correctness', 'correctness')
define({ type: 'predicate', predicate: { field: 'capability', value: 'reliability engineering' } }, 'application reliability', 'reliability')
define({ type: 'predicate', predicate: { field: 'capability', value: 'bounded concurrency' } }, 'concurrency')
define({ type: 'predicate', predicate: { field: 'capability', value: 'system maintenance' } }, 'maintaining existing software', 'existing codebase maintenance', 'maintenance')
define({ type: 'predicate', predicate: { field: 'category', value: 'architecture' } }, 'with system architecture')
define({ type: 'predicate', predicate: { field: 'capability', value: 'language model integration' } }, 'integrated language models', 'llm integration', 'language models')
define({ type: 'predicate', predicate: { field: 'capability', value: 'AI output validation' } }, 'validate ai generated output', 'typed contracts')
define({ type: 'predicate', predicate: { field: 'capability', value: 'validation' } }, 'testing')
define({ type: 'predicate', predicate: { field: 'capability', value: 'evaluation-driven decisions' } }, 'driven by failed tests', 'negative controls')
define({ type: 'predicate', predicate: { field: 'capability', value: 'API integration' } }, 'external integrations', 'apis and external integrations')
define({ type: 'predicate', predicate: { field: 'capability', value: 'AI-assisted development' } }, 'ai assisted development workflows')
define({ type: 'goal', goal: 'projects' }, 'explore projects', 'what have you built')
define({ type: 'goal', goal: 'experience' }, 'evaluate experience', 'what experience do you have')
define({ type: 'goal', goal: 'decisions' }, 'system architecture', 'engineering approach', 'engineering decisions', 'architecture decisions', 'engineering decisions and tradeoffs')
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
  'how do you approach', 'how do you', 'how have you', 'were', 'into', 'involve', 'involving', 'involved', 'demonstrate', 'using', 'with', 'your', 'me', 'for', 'about', 'in', 'when',
  'the', 'a', 'an', 'most relevant', 'examples of', 'show examples of', 'what', 'which', 'do you have', 'have you used', 'work', 'software', 'changes', 'what systems have you')

export const maxQueryLength = 240

function splitPhrase(input: string) {
  return input.normalize('NFKC').toLowerCase()
    .replace(/[-‐‑]/gu, ' ')
    .replace(/[.?!]+$/u, '')
    .match(/[\p{L}\p{N}]+|[^\s]/gu) ?? []
}

export function createTokenizer(content: readonly Pick<Entry, 'id' | 'title'>[]) {
  const phrases = new Map(vocabulary)
  for (const { id, title } of content) {
    const phrase = splitPhrase(title).join(' ')
    if (phrase && !phrases.has(phrase)) {
      phrases.set(phrase, { type: 'predicate', predicate: { field: 'id', value: id } })
    }
  }
  const longest = Math.max(...Array.from(phrases.keys(), phrase => phrase.split(' ').length))

  return function tokenize(input: string) {
    const parts = splitPhrase(input)
    const tokens: Word[] = []
    const unknown: string[] = []
    for (let index = 0; index < parts.length;) {
      let match: Word | undefined
      let count = Math.min(longest, parts.length - index)
      for (; count > 0; count -= 1) {
        match = phrases.get(parts.slice(index, index + count).join(' '))
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
}

export const tokenize = createTokenizer(entries)
