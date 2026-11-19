import type { CaseStudy, Entry } from './content.js'

type NarrativeSection = CaseStudy['sections'][number]
type Focus = {
  id: string
  title: string
  capabilities: NonNullable<Entry['capabilities']>
  paragraphs: readonly [string, ...string[]]
}
type Flagship = {
  id: string
  title: string
  summary: string
  categories: Entry['categories']
  technologies?: Entry['technologies']
  capabilities: NonNullable<Entry['capabilities']>
  context: NonNullable<Entry['context']>
  experience: string
  experienceId?: string
  caseStudy: CaseStudy
  focuses?: readonly Focus[]
}

function flagship(project: Flagship): Entry[] {
  const { experience, experienceId = project.id + '-engineering', focuses = [], ...details } = project
  const evidence = { status: 'approved', reference: 'Public portfolio case study' } as const
  const tags = {
    categories: project.categories,
    technologies: project.technologies,
    capabilities: project.capabilities,
    context: project.context,
    evidence,
  }
  return [
    { ...details, kind: 'project', evidence, related: [experienceId, ...focuses.map(focus => focus.id)] },
    { ...tags, id: experienceId, kind: 'experience', title: project.title + ' engineering',
      summary: experience, related: [project.id] },
    ...focuses.map(({ id, title, capabilities, paragraphs }): Entry => ({
      ...tags, id, title, capabilities, kind: 'decision', summary: paragraphs[0], decisionParagraphs: paragraphs,
      related: [project.id],
    })),
  ]
}

function decisionSection({ title, paragraphs }: Focus): NarrativeSection {
  return { heading: title, paragraphs }
}

const ariadneFocus: readonly Focus[] = [
  {
    id: 'ariadne-execution-boundary', title: 'Model output stops at structured intent',
    capabilities: ['AI engineering', 'AI output validation', 'validation', 'API integration'],
    paragraphs: [
      'Ariadne lets the model interpret an investigation and propose a structured request. The runtime determines what’s in scope and builds the executable graph query deterministically. Requests outside scope stop before any query is sent.',
    ],
  },
  {
    id: 'ariadne-ambiguity', title: 'Unresolved is a valid result',
    capabilities: ['experimental design', 'evaluation-driven decisions', 'validation'],
    paragraphs: [
      'Early exploration could pick the wrong relationship when several candidates looked plausible. Ariadne can now leave the relationship unresolved when the evidence can’t distinguish them.',
      'In synthetic tests with independently established answers, the revised system left cases unresolved where it had previously picked the wrong relationship.',
    ],
  },
  {
    id: 'ariadne-evidence-reuse', title: 'Stored findings are not permanently valid',
    capabilities: ['data modeling', 'persistence', 'knowledge graphs'],
    paragraphs: [
      'Ariadne records where each finding came from and what it applies to. Before reuse, it checks that the finding still fits the request, is recent enough, and hasn’t been revoked.',
      'In a controlled synthetic comparison, this approach took fewer steps to discover relationships than starting without stored findings, with the same accuracy.',
    ],
  },
]

const synkritaBaseline: Focus = {
  id: 'synkrita-connector-baseline', title: 'The connector baseline narrowed Synkrita’s role',
  capabilities: ['API integration', 'experimental design', 'evaluation-driven decisions'],
  paragraphs: [
    'Synkrita started by testing whether an adaptive layer could coordinate scientific connectors better than a conventional workflow. In a local replay, both workflows reached the same evidence and citations. Synkrita made more requests to get there.',
    'Caching and reusing previously reviewed rules also matched the prototype in controlled comparisons. That narrowed Synkrita’s role to checking evidence, recording where it came from, and reusing reviewed integration decisions. Clearer tool guidance took priority over a more elaborate scheduler.',
  ],
}

const geasAuthority: Focus = {
  id: 'geas-story-authority', title: 'Narration starts from committed state',
  capabilities: ['AI engineering', 'data modeling', 'persistence'],
  paragraphs: [
    'In GEAS, the simulation determines what happened and records it before the model writes the narration. In the separate authoring experiment, the model receives selected details for the current scene. World rules, character state, and unresolved threads stay in records outside the model.',
    'Continuity, rule consistency, and prose quality are reviewed separately. A person decides which changes become part of the story state.',
  ],
}

const geasStability: Focus = {
  id: 'geas-narrative-stability', title: 'Narrative stability comes before player adaptation',
  capabilities: ['experimental design', 'validation'],
  paragraphs: [
    'The long-term idea is to adapt situations to how someone plays. GEAS is tackling a prerequisite first: changing a scene while carrying forward the rules and consequences the story has already established.',
    'Small trials with a local model tested how it interpreted actions. A separate writing trial passed structural checks on the prepared scene context and stopped before generating prose. Whether the story stays coherent over time and whether player adaptation works remain open questions.',
  ],
}

const collaborativeProjectNote = 'Implementation details are intentionally limited for this collaborative project.'
const analysisSummary = 'Maintained and improved established mass spectrometry analysis software used in glycoscience research, with work spanning performance, validation, and researcher-facing improvements.'
const tohsaSummary = 'Contributed to a development-stage glycoscience data platform, working across data integration, backend and portal functionality, validation, and controlled access to research data.'

export const publicProjects: readonly Entry[] = [
  ...flagship({
    id: 'mass-spectrometry-analysis', title: 'Mass spectrometry analysis software', context: 'professional',
    summary: analysisSummary,
    categories: ['data'],
    technologies: ['Scala', 'HTML', 'JavaScript', 'CSS', 'HOCON'],
    capabilities: ['scientific software', 'mass spectrometry', 'software maintenance', 'performance optimization', 'validation', 'scientific correctness', 'requirements interpretation'],
    experience: analysisSummary,
    caseStudy: {
      subtitle: 'Performance and researcher requirements',
      status: collaborativeProjectNote,
      sections: [
        { heading: 'Performance', paragraphs: [
          'Improved computational performance while preserving expected scientific behavior.',
        ] },
        { heading: 'Researcher requirements', paragraphs: [
          'Translated researcher requirements into application improvements and validated the changes.',
        ] },
      ],
    },
  }),
  ...flagship({
    id: 'tohsa', title: 'TOHSA', context: 'professional',
    summary: tohsaSummary,
    categories: ['backend', 'data', 'frontend'],
    technologies: ['JavaScript', 'TypeScript', 'Java', 'Spring Boot', 'Apache Jena', 'Python', 'Shell'],
    capabilities: ['backend development', 'portal integration', 'data integration', 'validation', 'controlled access', 'semantic data'],
    experience: tohsaSummary,
    caseStudy: {
      subtitle: 'Glycoscience data platform',
      status: collaborativeProjectNote,
      sections: [
        { heading: 'Project context', paragraphs: [
          'The Human Glycome Atlas Project is developing TOHSA as a knowledge base for glycoscience data.',
        ] },
        { heading: 'Engineering contribution', paragraphs: [tohsaSummary] },
      ],
    },
  }),
  ...flagship({
    id: 'ariadne', experienceId: 'ariadne-experience', title: 'Ariadne', context: 'independent',
    summary: 'A Python research prototype for discovering and reusing evidence about the structure of unfamiliar data sources, starting with RDF knowledge graphs.',
    categories: ['backend', 'data', 'architecture'],
    technologies: ['Python', 'Pydantic', 'SQLite', 'RDF', 'SPARQL'],
    capabilities: ['AI engineering', 'language model integration', 'AI output validation', 'validation', 'experimental design', 'evaluation-driven decisions', 'data modeling', 'persistence', 'API integration', 'AI-assisted development', 'knowledge graphs'],
    experience: 'Defined the boundary between model interpretation and execution, directed AI-assisted implementation, and used synthetic evaluations to revise exploration rules and scope. Inconclusive results were retained.',
    caseStudy: {
      subtitle: 'Model interpretation, runtime authority, and reusable evidence',
      status: 'Experimental research prototype · Controlled synthetic evaluation',
      sections: ariadneFocus.map(decisionSection),
    },
    focuses: ariadneFocus,
  }),
  ...flagship({
    id: 'synkrita', title: 'Synkrita', context: 'independent',
    summary: 'A research prototype exploring when an extra integration layer helps scientific workflows that already have capable connectors.',
    categories: ['architecture', 'data', 'backend'],
    technologies: ['Python', 'SQLite'],
    capabilities: ['API integration', 'experimental design', 'evaluation-driven decisions', 'validation', 'persistence', 'scientific data'],
    experience: 'Compared the adaptive layer with conventional connector workflows and narrowed the design toward evidence qualification, provenance, and reviewed reuse.',
    caseStudy: {
      subtitle: 'When does another integration layer earn its place?',
      status: 'Research prototype · Operator staging package prepared',
      sections: [
        decisionSection(synkritaBaseline),
        { heading: 'Large responses stay off the live path', paragraphs: [
          'A publication response exceeded the live admission limit. Synkrita kept that limit and used a bounded offline importer that retained the source artifact and record positions. The imported observations preserve what the catalogue returned. A scientific claim still needs support in the cited material.',
        ] },
        { heading: 'What would justify the next layer?', paragraphs: [
          'The staging design separates shared evidence from private investigations. Real client integration, deployment validation, and independent scientific review remain open.',
          'A useful next comparison would measure verification and correction effort on unfamiliar investigations at the same standard of evidence.',
        ], flowCaption: 'Intended staging request flow', flow: ['Research client', 'Read service', 'Scoped retained records'] },
      ],
    },
    focuses: [synkritaBaseline],
  }),
  ...flagship({
    id: 'geas', title: 'GEAS', context: 'independent',
    summary: 'An experimental side project about adaptive games. The current question is how to preserve a coherent world and lasting consequences as a story changes.',
    categories: ['architecture'],
    technologies: ['Python', 'SQLite'],
    capabilities: ['AI engineering', 'validation', 'experimental design', 'data modeling', 'persistence'],
    experience: 'Explored how a simulation can commit actions before narration and how an author can review scene drafts before updating story state.',
    caseStudy: {
      subtitle: 'Can a game respond to how someone approaches a problem?',
      status: 'Experimental side project · Adaptive gameplay remains untested',
      sections: [
        { heading: 'What the game could notice about play', paragraphs: [
          'GEAS began with a playful question about games that respond to how someone solves problems. The long-term idea separates what a player did from the system’s tentative interpretation. A later observation could change that interpretation.',
        ], flowCaption: 'Concept for future gameplay', flow: ['Player action', 'Observation', 'Revisable hypothesis', 'Possible future situation'] },
        {
          ...decisionSection(geasAuthority),
          flowCaption: 'Documented authoring workflow',
          flow: ['External story state', 'Bounded scene context', 'Draft and review', 'Human approval', 'State reconciliation'],
        },
        { heading: 'What makes a situation worth adapting?', paragraphs: [
          'The narrative research compares causal pressures across stories and separately asks how a character’s skills or constraints shape a situation. This research helps frame authoring decisions. Its usefulness in runtime gameplay remains untested.',
        ] },
        decisionSection(geasStability),
      ],
    },
    focuses: [geasAuthority, geasStability],
  }),
]
