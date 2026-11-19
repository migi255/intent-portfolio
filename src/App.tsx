import { useEffect, useMemo, useRef, useState, type FormEvent, type MouseEvent } from 'react'

import { Inspector } from './components/Inspector'
import { ThemeControl } from './components/ThemeControl'
import { entries } from './data/content'
import { evaluate } from './evaluation/evaluate'
import { goals, goalLabels, type Goal } from './intent/model'
import { maxQueryLength } from './intent/vocabulary'
import { planInterface } from './planning/plan'
import { Renderer } from './renderer/Renderer'
import { caseStudyView, queryView, viewSearch, type createNavigation, type ViewState } from './state/navigation'

const examples = ['Backend projects', 'Projects using Python', 'APIs but not coursework', 'System architecture']
const navLabels: Record<Goal, string> = { projects: 'Projects', experience: 'Experience', decisions: 'Engineering decisions' }
const descriptions: Record<Goal, string> = {
  projects: 'Explore work by technology, engineering problem, or technical discipline.',
  experience: 'Compare technologies and capabilities, then see how the work fits together over time.',
  decisions: 'Read the constraints, rationale, and tradeoffs behind the work.',
}

export function App({ navigation, initialView }: {
  navigation: ReturnType<typeof createNavigation>
  initialView: ViewState
}) {
  const [view, setView] = useState(initialView)
  const [draft, setDraft] = useState(view.query)
  const [inspect, setInspect] = useState(false)
  const [transition, setTransition] = useState(0)
  const resultsHeading = useRef<HTMLHeadingElement>(null)
  const search = useRef<HTMLInputElement>(null)
  const inspectorToggle = useRef<HTMLButtonElement>(null)
  const inspectorHeading = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    function restore() {
      const next = navigation.restore()
      setView(next)
      setDraft(next.query)
      if (window.location.hash === '#results') setTransition(previous => previous + 1)
    }
    window.addEventListener('popstate', restore)
    return () => window.removeEventListener('popstate', restore)
  }, [navigation])

  useEffect(() => {
    if (transition > 0) {
      resultsHeading.current?.focus({ preventScroll: true })
      resultsHeading.current?.scrollIntoView({ block: 'start' })
    }
  }, [transition])

  useEffect(() => {
    if (window.location.hash === '#results') resultsHeading.current?.scrollIntoView({ block: 'start' })
  }, [])

  useEffect(() => {
    if (inspect) inspectorHeading.current?.focus()
  }, [inspect])

  function closeInspector() {
    setInspect(false)
    inspectorToggle.current?.focus()
  }

  function navigate(next: ViewState) {
    navigation.navigate(next)
    setView(next)
    setDraft(next.query)
    setTransition(previous => previous + 1)
  }

  function followView(event: MouseEvent<HTMLAnchorElement>, next: ViewState) {
    if (event.button !== 0 || event.metaKey || event.altKey || event.ctrlKey || event.shiftKey) return
    event.preventDefault()
    navigate(next)
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    navigate(queryView(activeGoal, draft.trim() ? draft : ''))
  }

  const { intent, result, plan } = useMemo(() => {
    const { intent } = view
    if (intent.status !== 'resolved') return { intent }
    const result = evaluate(intent.expression, entries)
    return { intent, result, plan: planInterface(intent, result) }
  }, [view])
  const activeGoal = intent.status === 'resolved' ? intent.goal : view.goal
  const hasSharedFilters = !view.query && viewSearch(view) !== viewSearch(queryView(activeGoal))

  return (
    <>
      <a className="skip-link" href="#main">Skip to content</a>
      <header className="site-header">
        <div className="page-width header-inner">
          <a className="wordmark" href="./"><span className="brand-mark" aria-hidden="true" />Intent Portfolio</a>
          <nav aria-label="Portfolio">
            {goals.map(goal => (
              <a key={goal} href={navigation.href(queryView(goal))} onClick={event => followView(event, queryView(goal))}
                data-goal={goal} aria-current={activeGoal === goal ? 'page' : undefined}>{navLabels[goal]}</a>
            ))}
          </nav>
          <div className="header-actions">
            <ThemeControl />
            <button className="inspect-toggle" ref={inspectorToggle} type="button" aria-pressed={inspect}
              aria-controls={inspect ? 'inspector' : undefined} onClick={() => setInspect(enabled => !enabled)}>
              Inspector
            </button>
          </div>
        </div>
      </header>

      <main id="main" tabIndex={-1} className="page-width">
        <section className="hero" aria-labelledby="intro-heading">
          <div className="intro">
            <p className="eyebrow">Software engineering portfolio</p>
            <h1 id="intro-heading">Explore the work.<br /><em>Follow your intent.</em></h1>
            <p className="intro-copy">A portfolio about building software for complex systems. Browse projects, compare experience, or look inside the decisions that shaped the work.</p>
          </div>
          <div className="search-panel">
            <form onSubmit={submit}>
              <label htmlFor="query">What would you like to find?</label>
              <div className="search-row">
                <input id="query" ref={search} type="search" autoComplete="off" value={draft} maxLength={maxQueryLength}
                  onChange={event => setDraft(event.target.value)} placeholder="Show me your backend projects"
                  aria-describedby="query-help" />
                <button type="submit">Search</button>
              </div>
              <p id="query-help">Search by skill, technology, or topic. Use AND, OR, and NOT to refine results.</p>
            </form>
            <ul className="examples" aria-label="Example searches">
              {examples.map(query => (
                <li key={query}><button type="button" onClick={() => navigate(queryView('projects', query))}>{query}</button></li>
              ))}
            </ul>
          </div>
        </section>

        <section className="explorer" data-goal={activeGoal} aria-labelledby="results">
          <nav className="goal-links" aria-label="Choose a visitor goal">
            {goals.map(goal => (
              <a key={goal} href={navigation.href(queryView(goal))} onClick={event => followView(event, queryView(goal))}
                data-goal={goal} aria-current={activeGoal === goal ? 'page' : undefined}>{goalLabels[goal]}</a>
            ))}
          </nav>
          <div className="result-heading">
            <div>
              <h2 id="results" tabIndex={-1}>{goalLabels[activeGoal]}</h2>
              <p>{descriptions[activeGoal]}</p>
            </div>
            <p className="demo-label">{result?.matches.some(entry => entry.evidence.status === 'draft') ? 'Includes draft content for review' : 'Demonstration content'}</p>
          </div>
          {(view.query || hasSharedFilters) && <p className="committed-query">
            {view.query ? <>Search <strong>{view.query}</strong></> : 'Shared filters'}
            {result && <span> · {result.matches.length} {result.matches.length === 1 ? 'match' : 'matches'}</span>}
          </p>}

          {intent.status === 'unsupported' && (
            <div className="notice" role="status">
              <h3>Try a different query</h3>
              <p>{intent.message} {intent.terms.length > 0 && <>Unrecognized terms: {intent.terms.join(', ')}.</>}</p>
              <button type="button" onClick={() => search.current?.focus()}>Edit query</button>
            </div>
          )}
          {intent.status === 'ambiguous' && (
            <div className="notice" role="status">
              <h3>Choose a layout</h3>
              <p>{intent.message}</p>
              <div className="choice-buttons">
                {intent.goals.map(goal => <button key={goal} type="button"
                  onClick={() => navigate(queryView(view.goal, view.query, goal))}>{goalLabels[goal]}</button>)}
              </div>
            </div>
          )}
          {result?.matches.length === 0 && (
            <div className="notice" role="status">
              <h3>No matching entries</h3>
              <p>Try fewer criteria, a broader category, or a different technology.</p>
              <button type="button" onClick={() => navigate(queryView(activeGoal))}>Clear search</button>
            </div>
          )}
          {plan && result?.matches.length ? <Renderer plan={plan} entries={entries} caseStudyLink={entry => {
            const next = caseStudyView(entry.id)
            return <a className="case-study-link" href={navigation.href(next)} aria-label={`Read case study for ${entry.title}`}
              onClick={event => followView(event, next)}>
              Read case study
            </a>
          }} /> : null}
        </section>

        {inspect && <Inspector view={view} intent={intent} result={result} plan={plan} heading={inspectorHeading} onClose={closeInspector} />}
      </main>

      <footer className="site-footer">
        <div className="page-width footer-inner">
          <div><strong>Intent Portfolio</strong><p>A browser-based experiment in intent-driven interfaces.</p></div>
          <div><strong>Resume and contact</strong><p>Public details are pending approval.</p></div>
        </div>
      </footer>
    </>
  )
}
