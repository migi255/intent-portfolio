import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import { gzipSync } from 'node:zlib'
import { createElement } from 'react'
import { renderToString } from 'react-dom/server'
import { agentGuidePath, mechanismPath } from '../.test-build/publish/components/AgentGuide.js'
import { publicOrigin } from '../.test-build/publish/evidence/handoff.js'
import { PublicPortfolio } from '../.test-build/publish/PublicPortfolio.js'
import { assertPublicationInputs, catalog } from '../.test-build/publish/evidence/catalog.js'
import { reviewEntries } from '../.test-build/publish/data/review.js'
import { classifications, dimensions, claimKinds, responsibilityRoles, attributionScopes, sourceTypes } from '../.test-build/publish/evidence/model.js'

assertPublicationInputs()
if (reviewEntries.length) throw new Error('The production review module must be empty')
const publicAssets = await readdir(new URL('../public/', import.meta.url))
if (publicAssets.some(file => file !== '_headers')) throw new Error('Review and explicitly allowlist new public assets')
const origin = publicOrigin(process.env.PORTFOLIO_ORIGIN)
if (process.env.PORTFOLIO_ORIGIN && !origin) throw new Error('PORTFOLIO_ORIGIN must be an HTTP(S) origin')
if (process.argv.includes('--check')) process.exit(0)
const publication = { origin, generatedAt: new Date().toISOString() }

const dist = new URL('../dist/', import.meta.url)
const shell = await readFile(new URL('index.html', dist), 'utf8')
const pages = [
  ['/', 'Miguel Mazumder | Software Engineer'],
  ['/projects/', 'Projects'], ['/experience/', 'Experience'], ['/resume/', 'Résumé summary'], ['/decisions/', 'Engineering decisions'],
  [agentGuidePath, 'Bring your AI agent'], [mechanismPath, 'How this portfolio works'],
  ...catalog.projects.map(project => [project.url, project.title]),
  ...catalog.briefings.map(brief => [brief.url, brief.label]),
]

const escapeText = text => text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
const publicationAttributes = ' data-evidence-generated="' + publication.generatedAt + '"' +
  (origin ? ' data-public-origin="' + origin + '"' : '')
const replaceRoot = (html, path, markup) =>
  html.replace('<div id="root"></div>', () =>
    '<div id="root" data-prerendered="' + path + '"' + publicationAttributes + '>' + markup + '</div>')
if (!shell.includes('<div id="root"></div>')) throw new Error('Missing prerender mount point')

const rendered = new Map()
for (const [path, title] of pages) {
  const markup = renderToString(createElement(PublicPortfolio, { initialPath: path, publication }))
  const html = replaceRoot(shell, path, markup)
    .replace(/<title>.*?<\/title>/, () => '<title>' + escapeText(path === '/' ? title : title + ' | Miguel Mazumder') + '</title>')
  rendered.set(path, html)
}

const publicReferences = [
  ...catalog.claims.flatMap(claim => [claim.url, claim.source.url]),
  ...catalog.decisions.map(decision => decision.url),
]
for (const url of publicReferences) {
  const [path, anchor] = url.split('#')
  if (!rendered.get(path)?.includes('id="' + anchor + '"')) throw new Error('Missing public anchor ' + url)
}

const string = { type: 'string', minLength: 1 }
const identifier = { ...string, maxLength: 80, pattern: '^[a-z0-9]+(?:-[a-z0-9]+)*$' }
const localUrl = { ...string, pattern: '^/(?!/)' }
const object = (properties, additionalProperties = false) => ({
  type: 'object', required: Object.keys(properties), properties, additionalProperties,
})
const list = items => ({ type: 'array', items })
const idList = { ...list(identifier), minItems: 2, maxItems: 6, uniqueItems: true }
const optionalObject = properties => ({ ...object(properties), required: [] })
const textList = { ...list(string), minItems: 1 }
const claimDetails = optionalObject({
  kind: { enum: claimKinds },
  attribution: optionalObject({
    roles: { ...list({ enum: responsibilityRoles }), minItems: 1 },
    scope: { enum: attributionScopes },
    aiAssisted: { type: 'boolean' },
  }),
  problem: string, constraints: textList, alternatives: textList, coordination: textList,
  validationContext: optionalObject({ reference: string, environment: string }),
  revision: { type: 'integer', minimum: 1 },
})
const claim = object({
  id: identifier, projectId: identifier, title: string, contribution: string, role: string,
  implementation: string, validation: string, outcome: string, limit: string,
  status: { const: 'approved' }, classification: { enum: classifications.filter(value => value !== 'needs confirmation') },
  capabilities: { ...list(string), minItems: 1 }, url: localUrl,
  source: object({ entryId: identifier, url: localUrl }),
})
claim.properties.details = claimDetails
claim.properties.source.properties.type = { enum: sourceTypes }
const relationship = object({
  id: identifier, status: { const: 'approved' }, operation: { enum: ['comparison', 'responsibility'] },
  label: string, claimIds: idList, interpretation: string, limit: string,
  readings: { type: 'object', minProperties: 1, additionalProperties: object({ contrast: string, observations: list(string) }) },
})
const plan = {
  oneOf: ['comparison', 'responsibility'].map(operation => object({
    version: { const: 1 }, operation: { const: operation },
    focus: operation === 'comparison' ? { enum: dimensions } : identifier,
    components: {
      minItems: 1, maxItems: 4, ...list(object({
        type: { const: operation === 'comparison' ? 'evidence-comparison' : 'responsibility-brief' },
        relationshipId: identifier, claimIds: idList,
      })),
    },
  })),
}
const entry = object({ id: identifier, title: string, summary: string, kind: { enum: ['project', 'experience', 'decision'] } }, true)
const schema = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  title: 'Portfolio public evidence v1',
  ...object({
    version: { const: 1 }, identity: object({ name: string, role: string, summary: string }),
    evidenceUrl: localUrl, projectsUrl: localUrl, experienceUrl: localUrl, resumeUrl: localUrl, decisionsUrl: localUrl,
    projects: list(object({ ...entry.properties, url: localUrl }, true)),
    experience: list(entry), decisions: list(entry), claims: list(claim), relationships: list(relationship),
    briefings: list(object({ url: localUrl, label: string, plan: { $ref: '#/$defs/plan' } })),
    presentation: { type: 'object' },
  }),
  $defs: { plan },
}
schema.properties.interpretationGuide = object({
  documented: string, interpretation: string, extrapolation: string,
  attribution: string, references: string, presentation: string,
})
const payload = JSON.stringify(catalog)
await writeFile(new URL('evidence.v1.json', dist), payload)
await writeFile(new URL('evidence-schema.v1.json', dist), JSON.stringify(schema, null, 2) + '\n')
for (const [path, html] of rendered) {
  const folder = new URL('.' + path, dist)
  await mkdir(folder, { recursive: true })
  await writeFile(new URL('index.html', folder), html)
}

console.log('Prerendered ' + rendered.size + ' pages. Evidence JSON: ' + Buffer.byteLength(payload) +
  ' bytes, ' + gzipSync(payload).length + ' bytes gzip.')
