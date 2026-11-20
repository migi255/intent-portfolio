import { publicEntries } from './public.js'
import { reviewEntries } from './review.js'

export const categories = ['backend', 'frontend', 'infrastructure', 'data', 'architecture'] as const
export const technologies = ['Python', 'TypeScript', 'React', 'PostgreSQL', 'Docker', 'Java', 'Spring Boot', 'Scala', 'Play Framework', 'ScalaTest', 'Apache POI', 'GitLab CI/CD', 'Pydantic', 'SQLite', 'RDF', 'SPARQL', 'HTML', 'JavaScript', 'CSS', 'HOCON', 'Apache Jena', 'Shell'] as const
export const capabilities = ['API design', 'validation', 'data pipelines', 'observability', 'accessibility', 'authentication', 'authorization', 'database engineering', 'CI/CD', 'scientific data', 'knowledge graphs', 'system maintenance', 'performance optimization', 'algorithm optimization', 'differential testing', 'regression testing', 'debugging', 'requirements interpretation', 'reliability engineering', 'bounded concurrency', 'scientific correctness', 'user feedback', 'AI engineering', 'language model integration', 'AI output validation', 'experimental design', 'evaluation-driven decisions', 'data modeling', 'persistence', 'API integration', 'AI-assisted development', 'scientific software', 'mass spectrometry', 'software maintenance', 'backend development', 'portal integration', 'data integration', 'controlled access', 'semantic data', 'scientific collaboration', 'scientific software validation', 'scientific benchmarking', 'iterative software delivery', 'engineering coordination', 'technical dependencies', 'student mentoring', 'research infrastructure design', 'workflow reproducibility', 'AI-supported research infrastructure'] as const
export const contexts = ['independent', 'professional', 'coursework'] as const
export const kinds = ['project', 'experience', 'decision'] as const

export type Category = typeof categories[number]
export type Technology = typeof technologies[number]
export type Capability = typeof capabilities[number]
export type Context = typeof contexts[number]
export type Kind = typeof kinds[number]

export interface CaseStudy {
  subtitle: string
  status: string
  delivery?: { id: string; heading: string; paragraphs: readonly string[] }
  sections: readonly {
    heading: string
    paragraphs: readonly string[]
    comparisons?: readonly { label: string; conventional: string; prototype: string }[]
    flow?: readonly string[]
    flowCaption?: string
  }[]
}

export interface Entry {
  id: string
  kind: Kind
  title: string
  summary: string
  categories: readonly Category[]
  technologies?: readonly Technology[]
  capabilities?: readonly Capability[]
  context?: Context
  date?: string
  related?: readonly string[]
  evidence: { status: 'demonstration' } | { status: 'approved' | 'draft'; reference: string }
  problem?: string
  decision?: string
  decisionParagraphs?: readonly string[]
  tradeoff?: string
  stages?: readonly string[]
  outcome?: string
  caseStudy?: CaseStudy
  caseStudyOnly?: true
}

// Local review records can override the public entry with the same ID.
export const entries: readonly Entry[] = [
  ...new Map([...publicEntries, ...reviewEntries].map(entry => [entry.id, entry])).values(),
]

// The local review catalog may use a narrower optimization capability.
export const searchableCapabilities = capabilities.filter(value =>
  value !== 'algorithm optimization' || entries.some(entry => entry.capabilities?.includes(value)),
)
