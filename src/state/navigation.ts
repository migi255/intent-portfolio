import { isGoal, type Goal } from '../intent/model.js'
import { maxQueryLength } from '../intent/vocabulary.js'

export interface ViewState {
  goal: Goal
  query: string
  chosenGoal?: Goal
}

export function readView(search: string): ViewState {
  const params = new URLSearchParams(search)
  const goal = params.get('view')
  const chosen = params.get('layout')
  return {
    goal: isGoal(goal) ? goal : 'projects',
    query: (params.get('q') ?? '').slice(0, maxQueryLength),
    ...(isGoal(chosen) && { chosenGoal: chosen }),
  }
}

export function viewSearch(view: ViewState): string {
  const params = new URLSearchParams()
  if (view.goal !== 'projects') params.set('view', view.goal)
  if (view.query) {
    params.set('q', view.query)
    if (view.chosenGoal) params.set('layout', view.chosenGoal)
  }
  return params.size ? '?' + params.toString() : ''
}
