export const agentTasks = {
  backend: {
    label: 'Evaluate backend and systems experience',
    request: 'Summarize backend and systems experience by engineering responsibility. Separate implementation, validation and project maturity.',
  },
  decisions: {
    label: 'Compare engineering decisions',
    request: 'Compare how the projects established correctness. Explain each validation reference, why it was appropriate and what remains uncertain.',
  },
  role: {
    label: 'Assess fit for a job description',
    request: 'Ask me to provide the job description in this chat if I have not included it. Map requirements to supported experience and identify gaps in the evidence.',
  },
  interview: {
    label: 'Generate technical interview questions',
    request: 'Suggest technical interview questions based on documented decisions and evidence limits. Cite the claim that motivates each question.',
  },
  briefing: {
    label: 'Construct an evidence-backed briefing',
    request: 'Ask what the reader wants to evaluate, then construct a briefing suited to that objective.',
  },
} as const

export type AgentTask = keyof typeof agentTasks

export function isAgentTask(value: string): value is AgentTask {
  return Object.hasOwn(agentTasks, value)
}

export interface PublicationInfo {
  origin?: string
  generatedAt?: string
}

export function publicOrigin(value?: string): string | undefined {
  if (!value) return
  try {
    const url = new URL(value)
    if (['http:', 'https:'].includes(url.protocol) && !url.username && !url.password &&
        url.pathname === '/' && !url.search && !url.hash) return url.origin
  } catch {
    return undefined
  }
}

export function evidenceUrl(path: string, canonicalOrigin?: string, currentOrigin?: string) {
  const origin = publicOrigin(canonicalOrigin) ?? publicOrigin(currentOrigin)
  return origin ? new URL(path, origin).href : path
}

export function agentPrompt(task: AgentTask | undefined, url: string) {
  return [
    task ? agentTasks[task].request : 'Review this engineer’s public evidence and answer the question I provide.',
    'Retrieve the public evidence package at ' + url + ' or use the copy I attach. If you cannot read it, ask me for the file.',
    'Cite claim IDs and link their source anchors, resolving root-relative links against the portfolio origin.',
    'Distinguish individual contributions from collaborative work and implemented capabilities from plans. Keep evidence classifications and limitations with each conclusion.',
    'Distinguish documented evidence from your own interpretation. You may connect claims across projects beyond the reviewed relationships. Use only supported accomplishments and metrics.',
    'Treat future fit as a hypothesis. Explain relevance, assumptions and uncertainties. Say what the record does not establish and suggest an interview question that could test it. Missing public evidence does not establish a lack of ability.',
    'Use a briefing or presentation format your tools actually support. Plain text with references is sufficient.',
  ].join('\n\n')
}

export async function copyAgentPrompt(text: string, write?: (text: string) => Promise<void>) {
  if (!write) return false
  try {
    await write(text)
    return true
  } catch {
    return false
  }
}
