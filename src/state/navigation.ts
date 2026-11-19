import { isGoal, type Goal, type Intent } from '../intent/model.js'
import { isPresentationForGoal, parseIntent, resolveGoal } from '../intent/parser.js'
import { maxQueryLength } from '../intent/vocabulary.js'
import { decodeFilter, encodeFilter } from './filters.js'

export interface ViewState {
  goal: Goal
  query: string
  intent: Intent
}

export function queryView(goal: Goal, query = '', chosenGoal?: Goal): ViewState {
  return { goal, query, intent: parseIntent(query, goal, chosenGoal) }
}

export function caseStudyView(entryId: string): ViewState {
  return {
    goal: 'decisions',
    query: '',
    intent: {
      status: 'resolved',
      goal: 'decisions',
      presentation: 'case-study',
      expression: {
        type: 'and',
        left: resolveGoal('decisions').expression,
        right: { type: 'predicate', predicate: { field: 'id', value: entryId } },
      },
    },
  }
}

export function readView(search: string): ViewState {
  const params = new URLSearchParams(search)
  const requestedGoal = params.get('view')
  const goal = isGoal(requestedGoal) ? requestedGoal : 'projects'
  const filter = params.get('filter')
  const presentation = params.get('presentation')

  if (filter === null && presentation === null && params.has('q')) {
    const layout = params.get('layout')
    const query = params.get('q')?.slice(0, maxQueryLength + 1) ?? ''
    return queryView(goal, query, isGoal(layout) ? layout : undefined)
  }

  const expression = filter === null ? undefined : decodeFilter(filter)
  if (!expression) return queryView(goal)

  return {
    goal,
    query: '',
    intent: {
      status: 'resolved',
      goal,
      expression,
      presentation: isPresentationForGoal(presentation, goal) ? presentation : 'default',
    },
  }
}

export function viewSearch({ goal, intent }: Pick<ViewState, 'goal' | 'intent'>): string {
  const params = new URLSearchParams()
  const activeGoal = intent.status === 'resolved' ? intent.goal : goal
  if (isGoal(activeGoal) && activeGoal !== 'projects') params.set('view', activeGoal)
  if (intent.status === 'resolved') {
    const filter = encodeFilter(intent.expression)
    const defaultFilter = encodeFilter(resolveGoal(activeGoal).expression)
    if (filter && (filter !== defaultFilter || intent.presentation !== 'default')) {
      params.set('filter', filter)
      if (isPresentationForGoal(intent.presentation, activeGoal)) params.set('presentation', intent.presentation)
    }
  }
  return params.size ? '?' + params.toString() : ''
}

export function createNavigation({ history, location }: Pick<Window, 'history' | 'location'>) {
  // History state contains an opaque key. Raw input stays in this document's memory.
  const localViews = new Map<string, ViewState>()

  function remember(view: ViewState) {
    if (!view.query) return null
    const key = globalThis.crypto.getRandomValues(new Uint32Array(4)).join('-')
    localViews.set(key, view)
    return { intentPortfolioKey: key }
  }

  function read(): ViewState {
    const key = history.state?.intentPortfolioKey
    const local = typeof key === 'string' ? localViews.get(key) : undefined
    return local ?? readView(location.search)
  }

  function href(view: ViewState, anchor = '#results') {
    const url = new URL(location.href)
    url.search = viewSearch(view)
    url.hash = anchor
    return url.href
  }

  function restore(): ViewState {
    const view = read()
    const anchor = location.hash === '#results' || location.hash === '#main' ? location.hash : ''
    const canonical = href(view, anchor)
    if (canonical !== location.href) history.replaceState(remember(view), '', canonical)
    return view
  }

  function navigate(view: ViewState) {
    const canonical = href(view)
    const current = read()
    if (canonical !== location.href || view.query !== current.query || view.intent.status !== current.intent.status) {
      history.pushState(remember(view), '', canonical)
    }
  }

  return { href, restore, navigate }
}
