import type { ReactNode } from 'react'

import type { CaseStudy, Entry } from '../data/content'
import { explainMatch } from '../intent/interpretation'
import type { Expression } from '../intent/model'
import { validatePlan, type BlockKind } from '../planning/plan'

type CaseStudyLink = (entry: Entry) => ReactNode
type Registry = Record<BlockKind, (items: readonly Entry[], options: {
  caseStudyLink: CaseStudyLink
  criteria?: Expression
}) => ReactNode>

const groupLabels: Partial<Record<BlockKind, string>> = {
  cards: 'Projects',
  decisions: 'Selected engineering decisions',
  'experience-records': 'Experience',
}

const registry: Registry = {
  cards: (items, { caseStudyLink, criteria }) => (
    <ProjectCards items={items} caseStudyLink={caseStudyLink} criteria={criteria} />
  ),
  'experience-records': (items, { criteria }) => (
    <div className="experience-records">
      {items.map(entry => (
        <article className="experience-record" key={entry.id}>
          <h4>{entry.title}</h4>
          <p>{entry.summary}</p>
          <MatchNote entry={entry} criteria={criteria} />
        </article>
      ))}
    </div>
  ),
  comparison: items => (
    <div className="result-block">
      <h3 id="comparison-heading">Technical capabilities</h3>
      <div className="table-scroll" role="region" aria-labelledby="comparison-heading" tabIndex={0}>
        <table aria-labelledby="comparison-heading">
          <thead><tr><th scope="col">Area of work</th><th scope="col">Capabilities</th><th scope="col">Technologies</th></tr></thead>
          <tbody>
            {items.map(entry => (
              <tr key={entry.id}>
                <th scope="row">{entry.title}<p>{entry.summary}</p><CategoryList entry={entry} /></th>
                <td>{entry.capabilities?.join(', ') || 'Unspecified'}</td>
                <td>{entry.technologies?.join(', ') || 'Unspecified'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  ),
  skills: items => (
    <div className="result-block">
      <h3>Technologies</h3>
      <TagList values={[...new Set(items.flatMap(entry => entry.technologies ?? []))].sort()} />
    </div>
  ),
  timeline: items => (
    <div className="result-block">
      <h3>Experience timeline</h3>
      <ol className="timeline">
        {[...items].sort((a, b) => (b.date ?? '').localeCompare(a.date ?? '')).map(entry => (
          <li key={entry.id} data-category={entry.categories[0]}><time dateTime={entry.date}>{entry.date}</time><div><h4>{entry.title}</h4><p>{entry.summary}</p></div></li>
        ))}
      </ol>
    </div>
  ),
  decisions: (items, { caseStudyLink, criteria }) => (
    <div className="decision-list">
      {items.map(entry => (
        <details key={entry.id} className="decision">
          <summary>
            <span>{entry.title}</span>
            <MatchNote entry={entry} criteria={criteria} />
          </summary>
          <DecisionDetail entry={entry} />
          {entry.caseStudy && caseStudyLink(entry)}
        </details>
      ))}
    </div>
  ),
  'case-study': items => (
    <div className="decision-list">
      {items.map(entry => (
        <article className="decision case-study" key={entry.id}>
          <h3>{entry.title}</h3>
          {entry.caseStudy ? <CaseStudyNarrative study={entry.caseStudy} /> : <DecisionDetail entry={entry} />}
        </article>
      ))}
    </div>
  ),
}

function ProjectCards({ items, caseStudyLink, criteria }: {
  items: readonly Entry[]
  caseStudyLink: CaseStudyLink
  criteria?: Expression
}) {
  const Heading = criteria ? 'h4' : 'h3'
  return (
    <div className="card-grid">
      {items.map(entry => (
        <article className="card" data-category={entry.categories[0]} key={entry.id}>
          {!criteria && <CategoryList entry={entry} />}
          <Heading>{entry.title}</Heading>
          <p>{entry.summary}</p>
          {criteria ? <MatchNote entry={entry} criteria={criteria} /> : <TagList values={entry.technologies} />}
          {entry.caseStudy && caseStudyLink(entry)}
          {entry.decision && !entry.caseStudy && (
            <details>
              <summary>Project details</summary>
              <p>{entry.problem}</p>
              <p>{entry.decision}</p>
            </details>
          )}
        </article>
      ))}
    </div>
  )
}

function MatchNote({ entry, criteria }: { entry: Entry; criteria?: Expression }) {
  if (!criteria) return null
  const reasons = explainMatch(entry, criteria)
  if (!reasons.length) return null
  return <small className="match-note"><strong>Matches</strong> {reasons.join(' · ')}</small>
}

function CategoryList({ entry }: { entry: Entry }) {
  if (!entry.categories.length) return null
  return (
    <ul className="categories" aria-label="Categories">
      {entry.categories.map(category => <li key={category} data-category={category}>{category}</li>)}
    </ul>
  )
}

function TagList({ values }: { values?: readonly string[] }) {
  if (!values?.length) return null
  return <ul className="tags">{values.map(value => <li key={value}>{value}</li>)}</ul>
}

function DecisionDetail({ entry }: { entry: Entry }) {
  // The local review overlay can still contain older structured decision records.
  const paragraphs = entry.decisionParagraphs ?? [entry.summary, entry.problem, entry.decision, entry.tradeoff, entry.outcome]
  return (
    <div className="decision-detail">
      {paragraphs.map((paragraph, index) => paragraph && <p key={index}>{paragraph}</p>)}
      {entry.stages?.length && (
        <ol className="stages" aria-label="Architecture sequence">
          {entry.stages.map(stage => <li key={stage}>{stage}</li>)}
        </ol>
      )}
    </div>
  )
}

function CaseStudyNarrative({ study }: { study: CaseStudy }) {
  return (
    <div className="case-study-narrative">
      <p className="case-study-subtitle">{study.subtitle}</p>
      <p className="case-study-status">{study.status}</p>
      {study.sections.map(section => (
        <section key={section.heading}>
          <h4>{section.heading}</h4>
          {section.paragraphs.map(paragraph => <p key={paragraph}>{paragraph}</p>)}
          {section.comparisons && (
            <div className="table-scroll" role="region" aria-label="Controlled comparisons" tabIndex={0}>
              <table className="case-study-comparisons">
                <caption>Results within each recorded comparison</caption>
                <thead><tr><th scope="col">Experiment</th><th scope="col">Conventional</th><th scope="col">Prototype</th></tr></thead>
                <tbody>{section.comparisons.map(row => (
                  <tr key={row.label}><th scope="row">{row.label}</th><td>{row.conventional}</td><td>{row.prototype}</td></tr>
                ))}</tbody>
              </table>
            </div>
          )}
          {section.flow && (
            <figure className="case-study-flow">
              <figcaption>{section.flowCaption ?? 'Intended request flow for the staging pilot'}</figcaption>
              <ol className="stages">{section.flow.map(step => <li key={step}>{step}</li>)}</ol>
            </figure>
          )}
        </section>
      ))}
    </div>
  )
}

export function Renderer({ plan, entries, caseStudyLink, criteria }: {
  plan: unknown
  entries: readonly Entry[]
  caseStudyLink: CaseStudyLink
  criteria?: Expression
}) {
  if (!validatePlan(plan, entries)) return <p role="alert">This layout could not be loaded. Choose another view.</p>
  if (!plan.blocks.length) return <p className="notice">No records fit this view.</p>

  const byId = new Map(entries.map(entry => [entry.id, entry]))
  return plan.blocks.map(block => {
    const items = block.entryIds.flatMap(id => {
      const entry = byId.get(id)
      return entry ? [entry] : []
    })
    const content = registry[block.kind](items, { caseStudyLink, criteria })
    const heading = criteria && groupLabels[block.kind]
    return heading
      ? <section className="evidence-group render-block" key={block.kind} aria-labelledby={'group-' + block.kind}>
        <h3 id={'group-' + block.kind}>{heading}</h3>
        {content}
      </section>
      : <div className="render-block" key={block.kind}>{content}</div>
  })
}
