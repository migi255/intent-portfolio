import type { CaseStudy, Entry } from './content.js'

type NarrativeSection = CaseStudy['sections'][number]
type Focus = {
  id: string
  title: string
  capabilities: NonNullable<Entry['capabilities']>
  problem: string
  decision: string
  outcome: string
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
    ...focuses.map(({ id, title, capabilities, problem, decision, outcome }): Entry => ({
      ...tags, id, title, capabilities, kind: 'decision', summary: problem, decision, outcome, related: [project.id],
    })),
  ]
}

function focusSections(focuses: readonly Focus[]): NarrativeSection[] {
  return focuses.map(({ title, problem, decision, outcome }) => ({
    heading: title, paragraphs: [problem, decision, outcome],
  }))
}

const ariadneFocus: readonly Focus[] = [
  {
    id: 'ariadne-execution-boundary', title: 'Separating proposals from execution',
    capabilities: ['AI engineering', 'AI output validation', 'validation', 'API integration'],
    problem: 'A plausible model proposal can still request an unsupported operation.',
    decision: 'Check typed proposals and scope in the runtime, then compile accepted queries deterministically.',
    outcome: 'Rejection can be tested before any query is sent.',
  },
  {
    id: 'ariadne-ambiguity', title: 'Learning from ambiguous results',
    capabilities: ['experimental design', 'evaluation-driven decisions', 'validation'],
    problem: 'Early exploration rules could select an incorrect relationship when several looked plausible.',
    decision: 'Test against independent synthetic ground truth and abstain where evidence cannot distinguish the candidates.',
    outcome: 'The revised synthetic ambiguity controls abstained where earlier runs answered incorrectly.',
  },
  {
    id: 'ariadne-evidence-reuse', title: 'Checking evidence before reuse',
    capabilities: ['data modeling', 'persistence', 'knowledge graphs'],
    problem: 'A structural finding can become stale or fall outside the current scope.',
    decision: 'Keep provenance, scope, freshness, and revocation with retained findings and recheck eligibility before reuse.',
    outcome: 'In a controlled synthetic comparison, persistent evidence used fewer discovery probes than the no-memory condition at equal accuracy.',
  },
  {
    id: 'ariadne-experimental-decisions', title: 'Using experiments to guide scope',
    capabilities: ['experimental design', 'evaluation-driven decisions', 'AI-assisted development'],
    problem: 'A new feature can add complexity before its benefit is established.',
    decision: 'Set acceptance criteria and compare against baselines, held-out scenarios, and negative controls.',
    outcome: 'Inconclusive results remained part of the record and informed scope decisions.',
  },
]

const collaborativeProjectNote = 'Implementation details are intentionally limited for this collaborative project.'
const analysisSummary = 'Maintained and improved established mass spectrometry analysis software used in glycoscience research, with work spanning performance, validation, and researcher-facing improvements.'
const tohsaSummary = 'Contributed to a development-stage glycoscience data platform, working across data integration, backend and portal functionality, validation, and controlled access to research data.'

export const publicProjects: readonly Entry[] = [
  ...flagship({
    id: 'mass-spectrometry-analysis', title: 'Mass spectrometry analysis software', context: 'professional',
    summary: analysisSummary,
    categories: ['data'],
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
    experience: 'Defined trust boundaries and acceptance criteria, directed AI-assisted implementation, and used synthetic evaluations to revise scope and exploration rules.',
    caseStudy: {
      subtitle: 'Keep proposals, execution, and evidence separate',
      status: 'Experimental research prototype · Controlled synthetic evaluation',
      sections: focusSections(ariadneFocus),
    },
    focuses: ariadneFocus,
  }),
  ...flagship({
    id: 'synkrita', title: 'Synkrita', context: 'independent',
    summary: 'A research prototype exploring when an extra integration layer helps scientific workflows that already have capable connectors.',
    categories: ['architecture', 'data', 'backend'],
    technologies: ['Python', 'SQLite'],
    capabilities: ['API integration', 'experimental design', 'evaluation-driven decisions', 'validation', 'persistence', 'scientific data'],
    experience: 'Compared integration workflows against conventional baselines and used the results to narrow the design toward provenance, reviewed reuse, and bounded staging.',
    caseStudy: {
      subtitle: 'When does another integration layer earn its place?',
      status: 'Research prototype · Operator staging package prepared',
      sections: [
        { heading: 'The comparison changed the design', paragraphs: [
          'Model Context Protocol gives assistants a common way to call tools. The experiment asked whether an adaptive layer could coordinate scientific tools better than a capable conventional workflow.',
          'In a local replay the prototype made more requests while both workflows reached the same evidence and citations. The design shifted toward keeping mature connectors and qualifying additions against a demonstrated need.',
        ] },
        { heading: 'Keep the source and the claim inspectable', paragraphs: [
          'A publication response exceeded the live admission limit. A bounded offline importer kept the limit in place and retained the original artifact and record positions.',
          'A catalogue observation records what a source returned. Supporting a scientific claim requires checking what the cited material actually establishes.',
        ] },
        { heading: 'Use strong baselines', paragraphs: [
          'Conventional caching and reviewed-rule reuse matched the prototype on controlled comparisons. These results informed the decision to prioritize evidence quality and clear tool guidance over a more elaborate scheduler.',
        ] },
        { heading: 'What would justify the next layer?', paragraphs: [
          'The staging design separates shared evidence from private investigations. Real client integration, deployment validation, and independent scientific review remain open.',
          'A useful next comparison would measure verification and correction effort on unfamiliar investigations at the same standard of evidence.',
        ], flowCaption: 'Intended staging request flow', flow: ['Research client', 'Read service', 'Scoped retained records'] },
      ],
    },
  }),
  ...flagship({
    id: 'geas', title: 'GEAS', context: 'independent',
    summary: 'An experimental side project about adaptive games. The current question is how to preserve a coherent world and lasting consequences as a story changes.',
    categories: ['architecture'],
    technologies: ['Python', 'SQLite'],
    capabilities: ['AI engineering', 'validation', 'experimental design', 'data modeling', 'persistence'],
    experience: 'Explored bounded action resolution, persistent simulation state, and a separate authoring workflow with review before durable story updates.',
    caseStudy: {
      subtitle: 'Can a game respond to how someone approaches a problem?',
      status: 'Experimental side project · Adaptive gameplay remains untested',
      sections: [
        { heading: 'Start with a revisable hypothesis', paragraphs: [
          'GEAS began with a playful question about games that respond to how someone solves problems. The long-term idea separates what a player did from the system’s tentative interpretation. A later observation could change that interpretation.',
        ], flowCaption: 'Concept for future gameplay', flow: ['Player action', 'Observation', 'Revisable hypothesis', 'Possible future situation'] },
        { heading: 'First, make a story that can survive change', paragraphs: [
          'The authoring experiment keeps world rules, character state, and unresolved threads outside the prose model. A scene draft can then be checked for continuity, rule consistency, and prose quality before a person decides what becomes durable.',
        ], flowCaption: 'Documented authoring workflow', flow: ['External story state', 'Bounded scene context', 'Draft and review', 'Human approval', 'State reconciliation'] },
        { heading: 'Study situations and writing separately', paragraphs: [
          'The narrative research compares causal pressures across stories and separately asks how a character’s skills or constraints shape a situation. This research helps frame authoring decisions. Its usefulness in runtime gameplay remains untested.',
        ] },
        { heading: 'What has been exercised', paragraphs: [
          'The bounded simulation foundation persists campaign state and commits resolved actions before narration. Local-model trials exercised action interpretation on a small scenario set.',
          'The separate writing trial prepared context packets and passed structural checks. The recorded run stopped before prose generation. Long-form coherence and the full adaptive loop remain questions for future experiments.',
        ] },
      ],
    },
  }),
]
