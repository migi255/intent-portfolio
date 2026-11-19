import { describeCriteria } from '../intent/interpretation'
import type { Entry, Kind } from '../data/content'
import type { Expression } from '../intent/model'

const labels: Record<Kind, readonly [string, string]> = {
  project: ['project', 'projects'],
  experience: ['experience record', 'experience records'],
  decision: ['engineering decision', 'engineering decisions'],
}

export function Inspector({ expression, entries, matches }: {
  expression: Expression
  entries: readonly Entry[]
  matches: readonly Entry[]
}) {
  const counts = (Object.keys(labels) as Kind[]).flatMap(kind => {
    const count = matches.filter(entry => entry.kind === kind).length
    return count ? [count + ' ' + labels[kind][count === 1 ? 0 : 1]] : []
  })

  return (
    <details className="inspector">
      <summary>Why these results?</summary>
      <div className="search-details">
        <p>Criteria: <strong>{describeCriteria(expression, entries)}</strong></p>
        <p>{counts.length ? 'Results: ' + counts.join(' · ') : 'No work in this view matches these criteria.'}</p>
        <details className="structured-criteria">
          <summary>Structured criteria</summary>
          <pre>{JSON.stringify(expression, null, 2)}</pre>
        </details>
      </div>
    </details>
  )
}
