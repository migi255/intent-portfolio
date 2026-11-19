import type { ReactNode } from 'react'

import type { CaseStudy, Entry } from '../data/content'
import { validatePlan, type BlockKind } from '../planning/plan'

type CaseStudyLink = (entry: Entry) => ReactNode
type Registry = Record<BlockKind, (items: readonly Entry[], caseStudyLink: CaseStudyLink) => ReactNode>

const registry: Registry = {
  cards: (items, caseStudyLink) => (
    <div className="card-grid">
      {items.map(entry => (
        <article className="card" data-category={entry.categories[0]} key={entry.id}>
          <CategoryList entry={entry} />
          <h3>{entry.title}</h3>
          <p>{entry.summary}</p>
          <TagList values={entry.technologies} />
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
  decisions: (items, caseStudyLink) => (
    <div className="decision-list">
      {items.map(entry => (
        <details key={entry.id} className="decision">
          <summary><span>{entry.title}</span></summary>
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
  return (
    <div className="decision-detail">
      <p>{entry.summary}</p>
      <CategoryList entry={entry} />
      <dl>
        {entry.problem && <div><dt>Problem</dt><dd>{entry.problem}</dd></div>}
        {entry.decision && <div><dt>Decision</dt><dd>{entry.decision}</dd></div>}
        {entry.tradeoff && <div><dt>Tradeoff</dt><dd>{entry.tradeoff}</dd></div>}
        {entry.outcome && <div><dt>Outcome</dt><dd>{entry.outcome}</dd></div>}
      </dl>
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

export function Renderer({ plan, entries, caseStudyLink }: { plan: unknown; entries: readonly Entry[]; caseStudyLink: CaseStudyLink }) {
  if (!validatePlan(plan, entries)) return <p role="alert">This layout could not be loaded. Choose another view.</p>
  if (!plan.blocks.length) return <p className="notice">There are no details for this layout. Try another view.</p>

  const byId = new Map(entries.map(entry => [entry.id, entry]))
  return plan.blocks.map(block => (
    <div className="render-block" key={block.kind}>
      {registry[block.kind](block.entryIds.flatMap(id => {
        const entry = byId.get(id)
        return entry ? [entry] : []
      }), caseStudyLink)}
    </div>
  ))
}
