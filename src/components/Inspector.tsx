import type { Ref } from 'react'

import type { Evaluation } from '../evaluation/evaluate'
import { goalLabels, type Intent } from '../intent/model'
import type { Plan } from '../planning/plan'
import type { ViewState } from '../state/navigation'

export function Inspector({ view, intent, result, plan, heading, onClose }: {
  view: ViewState
  intent: Intent
  result?: Evaluation
  plan?: Plan
  heading: Ref<HTMLHeadingElement>
  onClose: () => void
}) {
  return (
    <aside className="inspector" id="inspector" aria-labelledby="inspector-title">
      <div className="inspector-header">
        <div className="inspector-title-row">
          <h2 id="inspector-title" tabIndex={-1} ref={heading}>Interface Inspector</h2>
          <button type="button" onClick={onClose}>Close inspector</button>
        </div>
        <p>Data from the current interaction, in processing order.</p>
      </div>
      <dl>
        <div><dt>Original input</dt><dd>{view.query || goalLabels[view.goal]}</dd></div>
        <div><dt>Resolved intent</dt><dd>
          {intent.status === 'resolved' ? goalLabels[intent.goal] + ' / ' + intent.presentation : intent.status}
        </dd></div>
        <div><dt>Symbolic expression</dt><dd>
          {intent.status === 'resolved' ? <pre>{JSON.stringify(intent.expression, null, 2)}</pre> : intent.message}
        </dd></div>
        <div><dt>Evaluation</dt><dd>
          {result ? <pre>{JSON.stringify({
            evaluatedCount: result.evaluatedCount,
            indeterminateCount: result.indeterminateCount,
            matches: result.matches.map(({ id, title }) => ({ id, title })),
          }, null, 2)}</pre> : 'Evaluation did not run.'}
        </dd></div>
        <div><dt>UI plan</dt><dd>{plan ? <pre>{JSON.stringify(plan, null, 2)}</pre> : 'No plan was generated.'}</dd></div>
        <div><dt>Registered components</dt><dd>{plan?.blocks.map(block => block.kind).join(', ') || 'None'}</dd></div>
      </dl>
    </aside>
  )
}
