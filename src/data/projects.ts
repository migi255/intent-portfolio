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
      'Ariadne lets the model interpret an investigation and propose a structured request. The software checks its scope and builds the graph query. Letting the model write queries directly would support more operations. Ariadne limits execution to operations its compiler can express.',
    ],
  },
  {
    id: 'ariadne-ambiguity', title: 'Unresolved is a valid result',
    capabilities: ['experimental design', 'evaluation-driven decisions', 'validation'],
    paragraphs: [
      'Early synthetic tests exposed a problem: Ariadne could select the wrong relationship when several looked plausible. The revised system leaves those cases unresolved. In the ambiguity control, the first version returned incomplete answers. The revised version withheld those answers, with a larger search budget.',
    ],
  },
]

const synkritaBaseline: Focus = {
  id: 'synkrita-connector-baseline', title: 'The connector baseline narrowed Synkrita’s role',
  capabilities: ['API integration', 'experimental design', 'evaluation-driven decisions'],
  paragraphs: [
    'Synkrita started by testing whether an adaptive layer could coordinate scientific connectors better than a conventional workflow. In a local replay, both workflows reached the same evidence and citations. Synkrita made more requests to get there.',
    'I required a conventional comparison that could retain and update the same reviewed rules. When both approaches performed equally in that comparison, I redirected the work toward diagnosing failures and proposing interventions.',
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
    'The aim is to adapt situations to how someone plays. GEAS first tests whether a scene can change while preserving the rules and consequences already established. Small trials tested how a local model interpreted actions. A separate trial checked the structure of the scene context and stopped before generating prose. Long-term coherence and player adaptation remain untested.',
  ],
}

const collaborativeProjectNote = 'Implementation details are intentionally limited for this collaborative project.'
const analysisSummary = 'Maintained and improved established mass spectrometry analysis software used in glycoscience research. My work covered performance, validation, and researcher-facing changes.'
const tohsaSummary = 'Contributed to a development-stage glycoscience data platform. My work covered data integration, backend and portal development, validation, and controlled access to research data.'

const analysisPerformance: Focus = {
  id: 'mass-spectrometry-analysis-performance', title: 'Speed changes had to leave results unchanged',
  capabilities: ['performance optimization', 'validation', 'scientific correctness'],
  paragraphs: [
    'I strengthened validation before making performance changes. I kept changes intended to alter scientific results separate from the performance work. I compared performance and checked that the faster software still produced the established results.',
  ],
}

export const publicProjects: readonly Entry[] = [
  ...flagship({
    id: 'mass-spectrometry-analysis', title: 'Mass spectrometry analysis software', context: 'professional',
    summary: analysisSummary,
    categories: ['data'],
    technologies: ['Scala', 'HTML', 'JavaScript', 'CSS', 'HOCON'],
    capabilities: ['scientific software', 'mass spectrometry', 'software maintenance', 'performance optimization', 'validation', 'scientific correctness', 'requirements interpretation', 'scientific collaboration', 'scientific software validation', 'scientific benchmarking', 'iterative software delivery'],
    experience: 'I work directly with researchers to define requirements, implement and validate changes, and deploy updates. Researcher feedback guides the next release.',
    focuses: [analysisPerformance],
    caseStudy: {
      subtitle: 'Performance and researcher requirements',
      status: collaborativeProjectNote,
      sections: [
        decisionSection(analysisPerformance),
        { heading: 'Researcher requirements and delivery', paragraphs: [
          'I maintain the application as an ongoing research tool. I weigh researcher requests against performance and scientific correctness. After deploying validated updates, I gather feedback for the next set of changes.',
        ] },
      ],
    },
  }),
  ...flagship({
    id: 'tohsa', title: 'TOHSA', context: 'professional',
    summary: tohsaSummary,
    categories: ['backend', 'data', 'frontend'],
    technologies: ['JavaScript', 'TypeScript', 'Java', 'Spring Boot', 'Apache Jena', 'Python', 'Shell'],
    capabilities: ['backend development', 'portal integration', 'data integration', 'validation', 'controlled access', 'semantic data', 'scientific collaboration', 'scientific software validation', 'scientific benchmarking', 'engineering coordination', 'technical dependencies', 'student mentoring', 'research infrastructure design'],
    experience: 'I coordinate work across technical and scientific contributors. I help resolve dependencies and guide undergraduate and graduate students on technical and scientific work.',
    caseStudy: {
      subtitle: 'Glycoscience data platform',
      status: collaborativeProjectNote,
      sections: [
        { heading: 'Project context', paragraphs: [
          'The Human Glycome Atlas Project is developing TOHSA as a knowledge base for glycoscience data.',
        ] },
        { heading: 'Engineering contribution', paragraphs: [
          'I contribute backend and portal changes for data integration and controlled access. I work with researchers and collaborators to define scientific requirements and coordinate testing, benchmarking, and validation.',
        ] },
      ],
    },
  }),
  ...flagship({
    id: 'ariadne', experienceId: 'ariadne-experience', title: 'Ariadne', context: 'independent',
    summary: 'A Python research prototype that discovers and reuses evidence about how unfamiliar data sources are structured. It starts with RDF knowledge graphs.',
    categories: ['backend', 'data', 'architecture'],
    technologies: ['Python', 'Pydantic', 'SQLite', 'RDF', 'SPARQL'],
    capabilities: ['AI engineering', 'language model integration', 'AI output validation', 'validation', 'experimental design', 'evaluation-driven decisions', 'data modeling', 'persistence', 'API integration', 'AI-assisted development', 'knowledge graphs'],
    experience: 'Reported live query failures and set regression criteria for the agent-assisted fixes. Defined when retained structural evidence could be reused and when a scientific interpretation needed operator approval.',
    caseStudy: {
      subtitle: 'Model interpretation, runtime authority, and reusable evidence',
      status: 'Research prototype. Evaluated in controlled synthetic tests.',
      delivery: {
        id: 'ariadne-engineering-delivery',
        heading: 'Bounded execution and reusable evidence',
        paragraphs: [
          'When live Ask requests failed, I commissioned a diagnosis and set regression criteria that preserved runtime control. The agent corrected the request contract and added a bounded existence check after a follow-up exposed a gap in the supported operations.',
          'In the evidence-reuse work, I specified a bounded local investigation and set the conditions for structural observations to inform a later investigation. Scientific interpretations still require operator approval. Separate experiments tested when the prototype should withhold an answer and how much discovery work reuse could save.',
        ],
      },
      sections: [
        ...ariadneFocus.map(decisionSection),
        { heading: 'An incomplete answer that looks complete', paragraphs: [
          'An upstream source can report success while returning only part of the result. If Ariadne stores that response as complete, a later investigation can inherit the error. Ariadne distinguishes incomplete responses from complete ones. Before reusing a stored finding, it checks whether the finding applies, is recent enough, and is still valid for reuse.',
        ] },
      ],
    },
    focuses: ariadneFocus,
  }),
  ...flagship({
    id: 'synkrita', title: 'Synkrita', context: 'independent',
    summary: 'A research prototype exploring when an extra integration layer helps scientific workflows that already have capable connectors.',
    categories: ['architecture', 'data', 'backend'],
    technologies: ['Python', 'SQLite'],
    capabilities: ['API integration', 'experimental design', 'evaluation-driven decisions', 'validation', 'persistence', 'scientific data', 'scientific collaboration', 'data integration', 'research infrastructure design', 'workflow reproducibility', 'AI-supported research infrastructure'],
    experience: 'I work with researchers to define what they need from a shared interface to scientific datasets and tools. Those requirements guide the architecture and implementation. Connector comparisons narrowed the prototype’s role to checking evidence and reusing reviewed integration decisions.',
    caseStudy: {
      subtitle: 'When does another integration layer earn its place?',
      status: 'Research prototype. Verified local release candidate.',
      delivery: {
        id: 'synkrita-engineering-delivery',
        heading: 'From transport qualification to a verified local candidate',
        paragraphs: [
          'I reproduced transport failures in a terminal, verified the qualification checks after an agent patch, and authorized the local commit. The prototype then traced a bounded request through to a persistent citation and added an offline intake path while keeping the live limit.',
          'I required a conventional workflow that could reuse the same reviewed information. After that comparison reached parity, I redirected the work toward useful intervention proposals and specified a harder follow-up study. The paired study remains unrun.',
          'For the pilot, I specified a shared catalogue, private investigations, and a reproducible operator handoff. The agent prepared the package. A separate investigator rebuilt and tested the local candidate. Historical records describe a local synthetic operator rehearsal. Target-host staging remains unverified.',
        ],
      },
      sections: [
        decisionSection(synkritaBaseline),
        { heading: 'Large responses stay off the live path', paragraphs: [
          'One publication response was too large for the live request limit. Synkrita kept the limit and imported the response offline. The importer preserved the original response and each record’s position within it. Each record shows what the catalogue returned. The cited material still has to support the scientific claim.',
        ] },
        { heading: 'What would justify the next layer?', paragraphs: [
          'The prototype tests evidence handling for AI clients and has a verified local release candidate. The pilot design separates shared evidence from private investigations. Real client integration, deployment validation, and independent scientific review remain open.',
          'The longer-term goal is to give researchers one interface for datasets and tools across the NIH Common Fund ecosystem. The plan is to connect multiple tool servers through the Model Context Protocol (MCP). Those integrations remain planned.',
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
          'The research compares what makes different choices costly across stories. A separate line of work asks how a character’s skills or constraints shape those choices. Both inform the writing process. Their usefulness in gameplay remains untested.',
        ] },
        decisionSection(geasStability),
      ],
    },
    focuses: [geasAuthority, geasStability],
  }),
]
