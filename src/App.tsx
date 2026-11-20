import { useEffect, useMemo, useRef, useState, type FormEvent, type MouseEvent } from 'react'

import { Inspector } from './components/Inspector'
import { ThemeControl } from './components/ThemeControl'
import { entries } from './data/content'
import { evaluate } from './evaluation/evaluate'
import { describeCriteria, suggestBroaderIntents, suggestedIntents } from './intent/interpretation'
import { goals, goalLabels, type Goal } from './intent/model'
import { maxQueryLength } from './intent/vocabulary'
import { planInterface } from './planning/plan'
import { Renderer } from './renderer/Renderer'
import { caseStudyView, evidenceView, queryView, viewSearch, type createNavigation, type ViewState } from './state/navigation'

const navLabels: Record<Goal, string> = { projects: 'Projects', experience: 'Experience', decisions: 'Selected engineering decisions' }
const descriptions: Record<Goal, string> = {
  projects: 'Explore work by technology, engineering problem, or technical discipline.',
  experience: 'Compare the technologies used and the work they supported.',
  decisions: 'Choices that shaped what these systems do and where they stop.',
}

export function App({ navigation, initialView }: {
  navigation: ReturnType<typeof createNavigation>
  initialView: ViewState
}) {
  const [view, setView] = useState(initialView)
  const [draft, setDraft] = useState(view.query)
  const [transition, setTransition] = useState(0)
  const resultsRegion = useRef<HTMLElement>(null)
  const resultsHeading = useRef<HTMLHeadingElement>(null)
  const search = useRef<HTMLInputElement>(null)

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
      resultsRegion.current?.scrollIntoView({ block: 'start' })
    }
  }, [transition])

  useEffect(() => {
    if (window.location.hash === '#results') resultsRegion.current?.scrollIntoView({ block: 'start' })
  }, [])

  function navigate(next: ViewState, focusResults = true) {
    navigation.navigate(next)
    setView(next)
    setDraft(next.query)
    if (focusResults) setTransition(previous => previous + 1)
  }

  function followView(event: MouseEvent<HTMLAnchorElement>, next: ViewState) {
    if (event.button !== 0 || event.metaKey || event.altKey || event.ctrlKey || event.shiftKey) return
    event.preventDefault()
    navigate(next)
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    navigate(draft.trim() ? evidenceView(draft) : queryView('projects'))
  }

  const { intent, matched, plan } = useMemo(() => {
    const { intent } = view
    if (intent.status !== 'resolved') return { intent, matched: [] }
    const result = evaluate(intent.expression, entries)
    const plan = planInterface(intent, result)
    const visibleIds = new Set(plan.blocks.flatMap(block => block.entryIds))
    return { intent, matched: result.matches.filter(entry => visibleIds.has(entry.id)), plan }
  }, [view])
  const activeGoal = intent.status === 'resolved' ? intent.goal : view.goal
  const isCaseStudy = intent.status === 'resolved' && intent.presentation === 'case-study'
  const grouped = intent.status === 'resolved' && intent.presentation === 'grouped'
  const hasIntent = Boolean(view.query) || grouped ||
    (!isCaseStudy && viewSearch(view) !== viewSearch(queryView(activeGoal)))
  const interpretation = intent.status === 'resolved' && hasIntent ? describeCriteria(intent.expression, entries) : undefined
  const broader = intent.status === 'resolved' && hasIntent && !matched.length
    ? suggestBroaderIntents(intent, entries) : []

  return (
    <>
      <a className="skip-link" href="#main">Skip to content</a>
      <header className="site-header">
        <div className="page-width header-inner">
          <a className="wordmark" href="/"><span className="brand-mark" aria-hidden="true" />Miguel Mazumder</a>
          <ThemeControl />
        </div>
      </header>

      <main id="main" tabIndex={-1} className="page-width">
        <section className="hero" aria-labelledby="intro-heading">
          <div className="intro">
            <p className="eyebrow">Software Engineer</p>
            <h1 id="intro-heading">Software for research, data, and simulation</h1>
            <p className="intro-copy">I build scientific software and research data infrastructure, alongside experiments in AI and adaptive games.</p>
          </div>
          <div className="intent-panel">
            <form onSubmit={submit} role="search" aria-labelledby="intent-label">
              <label htmlFor="query" id="intent-label">What are you looking for?</label>
              <div className="search-row">
                <input id="query" ref={search} type="search" autoComplete="off" value={draft} maxLength={maxQueryLength}
                  onChange={event => {
                    const value = event.target.value
                    if (value === '' && hasIntent) navigate(queryView('projects'), false)
                    else setDraft(value)
                  }} placeholder="e.g. backend systems involving access control"
                  aria-describedby="query-help" />
                <button type="submit">Find work</button>
              </div>
              <p id="query-help">{hasIntent && draft !== view.query
                ? 'The results below are for your last request. Select Find work to apply your edits.'
                : 'Describe the work you want to see. Search uses the portfolio’s topics, technologies, and capabilities.'}</p>
            </form>
            <ul className="examples" aria-label="Suggested intents">
              {suggestedIntents.map(({ label, query }) => (
                <li key={query}>
                  <button type="button" onClick={() => navigate(evidenceView(query))}>
                    <span>{label}</span> {query}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <nav className="browse-nav" aria-label="Browse directly">
          <span>Or browse directly</span>
          {goals.map(goal => (
            <a key={goal} href={navigation.href(queryView(goal))} onClick={event => followView(event, queryView(goal))}
              data-goal={goal} aria-current={!hasIntent && activeGoal === goal ? 'page' : undefined}>{navLabels[goal]}</a>
          ))}
        </nav>

        <section className="explorer" data-goal={grouped ? undefined : activeGoal} aria-labelledby="results" ref={resultsRegion}>
          {interpretation && intent.status === 'resolved' && (
            <div className="interpretation">
              <p className="interpretation-label">Interpreted as</p>
              <p className="interpretation-criteria">{interpretation}</p>
              <Inspector key={viewSearch(view)} expression={intent.expression} entries={entries} matches={matched} />
            </div>
          )}

          <div className="result-heading">
            <div>
              <h2 id="results" tabIndex={-1}>{isCaseStudy ? 'Case studies' : hasIntent ? 'Relevant work' : goalLabels[activeGoal]}</h2>
              {!isCaseStudy && !hasIntent && <p>{descriptions[activeGoal]}</p>}
            </div>
            {matched.some(entry => entry.evidence.status === 'draft') && (
              <p className="demo-label">Includes draft content for review</p>
            )}
          </div>

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
                  onClick={() => navigate(evidenceView(view.query, goal))}>{goalLabels[goal]}</button>)}
              </div>
            </div>
          )}
          {intent.status === 'resolved' && hasIntent && !matched.length && (
            <div className="empty-results" role="status">
              <h3>No work matched all the criteria</h3>
              <p>{view.query && draft === view.query ? 'Your request is still in the search field.' : 'Use the search field to revise the request.'}
                {broader.length > 0 && ' You can remove a criterion below.'}</p>
              <div className="choice-buttons">
                {broader.map(({ removed, intent: next, count }) => <button key={removed} type="button"
                  onClick={() => navigate({ goal: next.goal, intent: next, query: '' })}>
                  Remove {removed} ({count} {count === 1 ? 'match' : 'matches'})
                </button>)}
                <button type="button" onClick={() => search.current?.focus()}>Edit request</button>
                <button type="button" onClick={() => navigate(queryView('projects'))}>Clear request</button>
              </div>
            </div>
          )}
          {plan && (matched.length > 0 || !hasIntent) && <Renderer plan={plan} entries={entries}
            criteria={grouped && intent.status === 'resolved' ? intent.expression : undefined}
            caseStudyLink={entry => {
              const next = caseStudyView(entry.id)
              return <a className="case-study-link" href={navigation.href(next)} aria-label={`Read case study for ${entry.title}`}
                onClick={event => followView(event, next)}>
                Read case study
              </a>
            }} />}
        </section>
      </main>

      <footer className="site-footer">
        <div className="page-width footer-inner">
          <div><strong>Miguel Mazumder</strong><p>Software Engineer</p></div>
        </div>
      </footer>
    </>
  )
}
