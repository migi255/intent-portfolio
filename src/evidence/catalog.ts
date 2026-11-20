import { career } from '../data/career.js'
import { publicEntries } from '../data/public.js'
import type { Entry } from '../data/content.js'
import { claims, relationships } from './approved.js'
import { classifications, dimensions, sourceTypes, validClaimDetails, validatePlan, type Claim, type Relationship, type PresentationPlan } from './model.js'

export const identity = {
  name: 'Miguel Mazumder',
  role: 'Software engineer',
  summary: 'I maintain scientific applications, build research data infrastructure with collaborators, and direct experiments in AI-assisted software.',
}

export const evidencePath = '/evidence.v1.json'
export const projectUrl = (id: string) => '/projects/' + id + '/'
export const claimUrl = (claim: Pick<Claim, 'projectId' | 'id'>) => projectUrl(claim.projectId) + '#claim-' + claim.id
export const caseUrl = (claim: Pick<Claim, 'projectId' | 'source'>) => projectUrl(claim.projectId) + '#source-' + claim.source.entryId

export const focusLabels = {
  requirement: 'What had to hold?',
  change: 'What changed?',
  reference: 'What was the reference?',
  validation: 'How was it validated?',
  established: 'What did it establish?',
  limits: 'What remains uncertain?',
} satisfies Record<typeof dimensions[number], string>

export function briefingUrl(relation: Pick<Relationship, 'operation' | 'id'>, focus: string) {
  const family = relation.operation === 'comparison' ? 'correctness' : 'systems'
  return '/briefings/' + family + '/' + relation.id + '/' + focus + '/'
}

const stableId = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const claimFields = new Set(['id', 'projectId', 'title', 'contribution', 'role', 'implementation', 'validation',
  'outcome', 'limit', 'classification', 'status', 'capabilities', 'source', 'details'])
const text = (value: unknown) => typeof value === 'string' && value.trim().length > 0

export function buildCatalog(entries: readonly Entry[], inputs: readonly Claim[], links: readonly Relationship[]) {
  const records = entries.filter(entry => entry.evidence.status === 'approved')
  const projects = records.filter(record => record.kind === 'project')
  const approved = inputs.filter(claim => claim.status === 'approved')
  const relations = links.filter(link => link.status === 'approved')
  const unique = (rows: readonly { id: string }[]) =>
    rows.every(row => stableId.test(row.id)) && new Set(rows.map(row => row.id)).size === rows.length
  if (!unique(records) || !unique(approved) || !unique(relations)) throw new Error('Invalid or duplicate public ID')

  for (const claim of approved) {
    const project = projects.find(item => item.id === claim.projectId)
    const sourceId = claim.source.entryId
    const hasSource = project?.caseStudy?.delivery?.id === sourceId ||
      ((project?.id === sourceId || project?.related?.includes(sourceId)) && records.some(entry => entry.id === sourceId))
    if (Object.keys(claim).some(key => !claimFields.has(key)) ||
        !project || !stableId.test(sourceId) || !hasSource ||
        ![claim.title, claim.contribution, claim.role, claim.implementation, claim.validation, claim.outcome, claim.limit].every(text) ||
        !claim.capabilities.length || !claim.capabilities.every(text) ||
        (claim.details !== undefined && !validClaimDetails(claim.details)) ||
        (claim.source.type !== undefined && !sourceTypes.includes(claim.source.type)) ||
        Object.keys(claim.source).some(key => key !== 'entryId' && key !== 'type') ||
        !classifications.includes(claim.classification) || claim.classification === 'needs confirmation') {
      throw new Error('Invalid approved claim ' + claim.id)
    }
  }

  const briefings = relations.flatMap(relation => {
    if (!['comparison', 'responsibility'].includes(relation.operation) ||
        ![relation.label, relation.interpretation, relation.limit].every(text) ||
        relation.claimIds.length < 2 || new Set(relation.claimIds).size !== relation.claimIds.length ||
        new Set(relation.claimIds.map(id => approved.find(claim => claim.id === id)?.projectId)).size < 2 ||
        !Object.keys(relation.readings).length) throw new Error('Invalid relationship ' + relation.id)
    return Object.entries(relation.readings).map(([focus, reading]) => {
      const plan: PresentationPlan = {
        version: 1, operation: relation.operation, focus, components: [{
          type: relation.operation === 'comparison' ? 'evidence-comparison' : 'responsibility-brief',
          relationshipId: relation.id, claimIds: relation.claimIds,
        }],
      }
      if (!stableId.test(focus) || (relation.operation === 'comparison' && !Object.hasOwn(focusLabels, focus)) ||
          !text(reading.contrast) || reading.observations.length !== relation.claimIds.length ||
          !reading.observations.every(text) || !validatePlan(plan, approved, relations)) {
        throw new Error('Invalid briefing ' + relation.id)
      }
      return { url: briefingUrl(relation, focus), label: Object.hasOwn(focusLabels, focus) ?
        focusLabels[focus as keyof typeof focusLabels] : relation.label, plan }
    })
  })
  if (new Set(briefings.map(brief => brief.url)).size !== briefings.length) throw new Error('Duplicate briefing URL')

  return {
    version: 1, identity, career, evidenceUrl: evidencePath, experienceUrl: '/experience/', projectsUrl: '/projects/', resumeUrl: '/resume/', decisionsUrl: '/decisions/',
    projects: projects.map(project => ({ ...project, url: projectUrl(project.id),
      maturity: project.id === 'tohsa' ? 'Development-stage collaboration' :
        project.context === 'professional' ? 'Established research application' : project.caseStudy?.status })),
    experience: records.filter(record => record.kind === 'experience'),
    decisions: records.filter(record => record.kind === 'decision').map(record => {
      const project = projects.find(item => item.related?.includes(record.id))
      return { ...record, url: project ? projectUrl(project.id) + '#source-' + record.id : '/decisions/#decision-' + record.id }
    }),
    claims: approved.map(claim => ({ ...claim, url: claimUrl(claim), source: { entryId: claim.source.entryId, type: claim.source.type ?? sourceTypes[0], url: caseUrl(claim) } })),
    relationships: relations, briefings,
    interpretationGuide: {
      documented: 'Claims describe approved public accounts. Use projectId to read project context and maturity. Read role, classification, source and limit together. A recorded evaluation is reported in the public account and does not imply independent reproduction.',
      interpretation: 'Relationships are reviewed interpretations for this site. You may reason across any claims. Label new interpretations and cite the claims that support them.',
      extrapolation: 'Treat candidate fit and proposed responsibilities as hypotheses. Explain relevance, assumptions and uncertainties, and suggest how to test them. Missing public evidence does not establish a lack of ability.',
      attribution: 'Role describes personal responsibility. Optional attribution roles and scope are partial. AI-assisted work can involve design or direction without establishing code authorship. An omitted field means the package does not specify it.',
      references: 'Cite stable claim IDs and source anchors. Resolve root-relative URLs against the portfolio origin. Source anchors point to candidate-published accounts. Private inspection and reproduced checks are described in the records, and those anchors do not link to the underlying private artifacts. The package includes the claim text and qualifications in one request. Career appointments and degrees are candidate-attested. Contextual skills link to those records or to separately classified project evidence.',
      presentation: 'Use your own output format. The presentation plans describe this site’s briefings and do not constrain external analysis.',
    },
    presentation: {
      version: 1,
      operations: { comparison: 'evidence-comparison', responsibility: 'responsibility-brief' },
      comparisonDimensions: dimensions,
      requiredClaimFields: ['role', 'classification', 'validation', 'outcome', 'limit', 'source'],
      requiredRelationshipFields: ['interpretation', 'limit'],
      documentation: '/evidence-schema.v1.json',
    },
  }
}

// Fail closed before producing browser artifacts. Keep research inputs outside these modules.
export function assertPublicationInputs() {
  if ([...publicEntries].some(entry => entry.evidence.status !== 'approved') ||
      [...claims, ...relationships].some(item => item.status !== 'approved')) {
    throw new Error('Public source modules must contain only approved records')
  }
}

export const catalog = buildCatalog(publicEntries, claims, relationships)

export function normalizePath(pathname: string) {
  return pathname.replace(/(?:\/index\.html|\/)$/, '') + '/'
}

export function resolveBriefing(pathname: string) {
  return catalog.briefings.find(brief => brief.url === normalizePath(pathname))
}
