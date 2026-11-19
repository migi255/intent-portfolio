import { reviewEntries } from './review.js'

export const categories = ['backend', 'frontend', 'infrastructure', 'data', 'architecture'] as const
export const technologies = ['Python', 'TypeScript', 'React', 'PostgreSQL', 'Docker', 'Java', 'Spring Boot', 'Scala', 'Play Framework', 'ScalaTest', 'Apache POI', 'GitLab CI/CD', 'Pydantic', 'SQLite', 'RDF', 'SPARQL'] as const
export const capabilities = ['API design', 'validation', 'data pipelines', 'observability', 'accessibility', 'authentication', 'authorization', 'database engineering', 'CI/CD', 'scientific data', 'knowledge graphs', 'system maintenance', 'performance optimization', 'algorithm optimization', 'differential testing', 'regression testing', 'debugging', 'requirements interpretation', 'reliability engineering', 'bounded concurrency', 'scientific correctness', 'user feedback', 'AI engineering', 'language model integration', 'AI output validation', 'experimental design', 'evaluation-driven decisions', 'data modeling', 'persistence', 'API integration', 'AI-assisted development'] as const
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
  tradeoff?: string
  stages?: readonly string[]
  outcome?: string
  caseStudy?: CaseStudy
}

const demonstration = { status: 'demonstration' } as const

export const entries: readonly Entry[] = [
  {
    id: 'dataset-catalog', kind: 'project', title: 'Dataset Catalog',
    summary: 'A searchable registry for research datasets, with validation at ingestion and a browser interface for discovery.',
    categories: ['backend', 'data'], technologies: ['Python', 'PostgreSQL'],
    capabilities: ['API design', 'data pipelines', 'validation'], context: 'independent',
    related: ['catalog-api'], evidence: demonstration,
    problem: 'Make heterogeneous datasets discoverable without requiring every source to use the same input format.',
    decision: 'Normalize metadata into a stable catalog model at the ingestion boundary.',
    tradeoff: 'Normalization simplifies downstream queries and introduces an explicit mapping layer for each input format.',
    stages: ['Source records', 'Validation and mapping', 'Catalog API'],
  },
  {
    id: 'release-dashboard', kind: 'project', title: 'Release Dashboard',
    summary: 'A release review interface that brings checks, deployment status, and operational signals into one view.',
    categories: ['frontend', 'infrastructure'], technologies: ['TypeScript', 'React', 'Docker'],
    capabilities: ['accessibility', 'observability'], context: 'independent',
    related: ['release-tooling'], evidence: demonstration,
    problem: 'Give reviewers enough context to make a release decision from one screen.',
    decision: 'Represent readiness as independent check results with a shared status model.',
    tradeoff: 'A common model keeps the overview readable and requires links or details for provider-specific diagnostics.',
    stages: ['Check results', 'Readiness model', 'Review interface'],
  },
  {
    id: 'event-replay', kind: 'project', title: 'Event Replay Lab',
    summary: 'A coursework example that replays API events to compare alternative projections of the same history.',
    categories: ['backend', 'architecture'], technologies: ['Python'],
    capabilities: ['API design', 'validation'], context: 'coursework', evidence: demonstration,
    problem: 'Reproduce changes to derived state from a fixed set of inputs.',
    decision: 'Store the event sequence separately from its projections.',
    tradeoff: 'Replay makes changes easier to inspect and adds the cost of rebuilding large projections.',
    stages: ['Event history', 'Replay', 'Projection'],
  },
  {
    id: 'catalog-api', kind: 'experience', title: 'API and database engineering',
    summary: 'Example scope covering request validation, database modeling, and integration testing.',
    categories: ['backend', 'data'], technologies: ['Java', 'PostgreSQL'],
    capabilities: ['API design', 'validation'], context: 'professional', date: '2025',
    related: ['dataset-catalog'], evidence: demonstration,
  },
  {
    id: 'release-tooling', kind: 'experience', title: 'Release and interface tooling',
    summary: 'Example scope covering accessible developer interfaces and observable deployment workflows.',
    categories: ['infrastructure', 'frontend'], technologies: ['TypeScript', 'React', 'Docker'],
    capabilities: ['observability', 'accessibility'], context: 'professional', date: '2026',
    related: ['release-dashboard'], evidence: demonstration,
  },
  {
    id: 'intent-pipeline', kind: 'decision', title: 'Separate matching from presentation',
    summary: 'The portfolio evaluates symbolic criteria before selecting a layout.',
    categories: ['architecture', 'frontend'], technologies: ['TypeScript', 'React'],
    capabilities: ['validation', 'accessibility'], context: 'independent',
    evidence: { status: 'approved', reference: 'Portfolio implementation' },
    problem: 'The same set of records should support browsing, comparison, and technical review.',
    decision: 'Evaluate an expression against structured content, then hand matched records to a planner that emits registered block IDs.',
    tradeoff: 'A closed vocabulary and registry make the system inspectable. New terms and layouts require deliberate additions.',
    stages: ['Parse intent', 'Evaluate criteria', 'Plan layout', 'Render components'],
  },
  ...reviewEntries,
]
