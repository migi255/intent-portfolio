import { publicProjects } from './projects.js'
import type { Entry } from './content.js'

export const publicEntries: readonly Entry[] = [
  ...publicProjects,
  {
    id: 'intent-pipeline', kind: 'decision', title: 'Claims carry their qualifications across views',
    caseStudyOnly: true,
    summary: 'The portfolio uses shared claim records in briefings and in its public evidence export.',
    categories: ['architecture', 'frontend'], technologies: ['TypeScript', 'React'],
    capabilities: ['validation', 'accessibility'], context: 'independent',
    evidence: { status: 'approved', reference: 'Portfolio implementation' },
    decisionParagraphs: [
      'A comparison needs an approved explanation supported by approved claims. The plan selects a question and the renderer keeps the qualifications with those claims.',
      'The public export carries the same relationships so a client can reconstruct a briefing using the evidence and limitations.',
    ],
    stages: ['Select question', 'Resolve evidence', 'Validate plan', 'Render briefing'],
  },
]

