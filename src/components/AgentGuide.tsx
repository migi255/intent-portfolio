import { useEffect, useRef, useState } from 'react'
import { catalog, evidencePath } from '../evidence/catalog.js'
import { agentPrompt, agentTasks, copyAgentPrompt, evidenceUrl, isAgentTask, publicOrigin,
  type AgentTask, type PublicationInfo } from '../evidence/handoff.js'

export const agentGuidePath = '/bring-your-agent/'
export const mechanismPath = '/how-it-works/'

export function AgentGuide({ publication }: { publication: PublicationInfo }) {
  const [origin, setOrigin] = useState<string>()
  const [task, setTask] = useState<AgentTask>()
  const [message, setMessage] = useState('')
  const [addressMessage, setAddressMessage] = useState('')
  const input = useRef<HTMLTextAreaElement>(null)
  const copyAttempt = useRef(0)
  useEffect(() => setOrigin(window.location.origin), [])

  const homeUrl = evidenceUrl('/', publication.origin, origin)
  const url = evidenceUrl(evidencePath, publication.origin, origin)
  const schemaPath = catalog.presentation.documentation
  const schemaUrl = evidenceUrl(schemaPath, publication.origin, origin)
  const prompt = agentPrompt(task, url)
  const ready = Boolean(origin && publicOrigin(publication.origin ?? origin))
  const generatedDate = publication.generatedAt?.slice(0, 10)

  async function copyAddress(event: React.MouseEvent<HTMLButtonElement>, address: string) {
    const link = event.currentTarget.parentElement?.querySelector('a')
    const clipboard = navigator.clipboard
    const copied = await copyAgentPrompt(address, clipboard?.writeText.bind(clipboard))
    if (!copied) link?.focus()
    setAddressMessage(copied ? 'URL copied: ' + address : 'Use your browser’s copy link command.')
  }

  async function copy() {
    const attempt = ++copyAttempt.current
    const clipboard = navigator.clipboard
    const copied = await copyAgentPrompt(prompt, clipboard?.writeText.bind(clipboard))
    if (attempt !== copyAttempt.current) return
    if (!copied) {
      input.current?.focus()
      input.current?.select()
    }
    setMessage(copied ? 'Prompt copied.' : 'Prompt selected. Use your device’s copy command.')
  }

  return <div className="guide-content">
    <section aria-labelledby="package-heading">
      <h2 id="package-heading">Share a URL and ask your own question</h2>
      <p>Give your assistant the portfolio URL or the direct evidence URL. Ask about a team, a role, or a technical challenge. For example, how might this experience apply to a small team building reliable scientific software?</p>
      <p className="evidence-meta">{'Schema version ' + catalog.version}{generatedDate &&
        <> · Export generated <time dateTime={publication.generatedAt}>{generatedDate}</time> (UTC)</>}</p>
      <dl className="package-links">
        <dt>Portfolio URL</dt><dd><a href={homeUrl}>{homeUrl}</a>
          {ready && <button type="button" onClick={event => void copyAddress(event, homeUrl)}>Copy portfolio URL</button>}</dd>
        <dt>Public evidence URL</dt><dd><a href={url}>{url}</a>
          {ready && <button type="button" onClick={event => void copyAddress(event, url)}>Copy evidence URL</button>}</dd>
        <dt>Schema URL</dt><dd><a href={schemaUrl}>{schemaUrl}</a></dd>
      </dl>
      <p className="copy-status" role="status">{addressMessage}</p>
      <p>If your assistant misses the evidence link on the homepage, share the direct URL. If it accepts uploads, <a href={evidencePath} download>download the JSON</a> and attach it with the portfolio URL so its citations resolve.</p>
    </section>
    <details className="evidence-note agent-prompt-details">
      <summary>Optional instructions and example questions</summary>
      <p>Paste the instructions into your assistant and add any question. For a role assessment, paste the job description there.</p>
      <div className="prompt-panel">
        <label htmlFor="agent-task">Task</label>
        <select id="agent-task" value={task ?? ''} disabled={!ready} onChange={event => {
          const value = event.target.value
          if (value && !isAgentTask(value)) return
          copyAttempt.current++
          setTask(isAgentTask(value) ? value : undefined)
          setMessage('')
        }}>
          <option value="">Bring your own question</option>
          {Object.entries(agentTasks).map(([id, item]) => <option key={id} value={id}>{item.label}</option>)}
        </select>
        <label htmlFor="agent-prompt">Prompt to paste</label>
        <textarea id="agent-prompt" readOnly rows={10} value={prompt} ref={input} />
        <button type="button" disabled={!ready} onClick={() => void copy()}>Copy prompt</button>
        <span className="copy-status" role="status">{message}</span>
      </div>
      <noscript><p>Copy the text manually. If the evidence URL is relative, copy the full address from the evidence link or attach the downloaded file.</p></noscript>
    </details>
    <DemoBriefing />
    <section aria-labelledby="access-heading">
      <h2 id="access-heading">What your assistant can do</h2>
      <p>An assistant with URL retrieval may be able to read the static JSON directly. One with document or interface generation can use the same claims in a presentation of its own. Check its citations and qualifications against the sources.</p>
      <p>Future MCP-aware clients could read the package through a compatible adapter. This export is a static file. Hosted MCP and universal assistant access are outside the current integration.</p>
      <p><a href={mechanismPath}>See how the site and assistant routes differ</a></p>
    </section>
  </div>
}

const teamFit = [
  {
    title: 'Shape validation for AI-assisted discovery',
    claimIds: ['ariadne-execution', 'ariadne-ambiguity'],
    inference: 'A reasonable responsibility to discuss is defining which proposals can reach execution and how ambiguous discovery results should be handled. The design boundary and the control cases provide evidence for those two parts of the problem.',
    uncertainty: 'This assumes the team can specify expected behavior for ambiguous queries. The public account does not establish production reliability or individual code authorship for every component.',
    question: 'How would you build an evaluation set that separates a justified abstention from an overly cautious refusal on new data?',
  },
  {
    title: 'Maintain existing scientific behavior while changing the platform',
    claimIds: ['analysis-performance', 'analysis-delivery'],
    inference: 'The candidate could help define compatibility checks for changes and work with researchers to determine which behaviors should be preserved. Compatibility checks and researcher feedback address different parts of that responsibility.',
    uncertainty: 'This assumes the team can obtain useful reference outputs and access to domain specialists. The public account does not specify benchmark figures or test coverage.',
    question: 'When would you preserve an existing result, and when would you ask a researcher to revisit the expected behavior?',
  },
  {
    title: 'Contribute to integrations with explicit access boundaries',
    claimIds: ['tohsa-integration', 'ariadne-execution'],
    inference: 'The team could explore a role implementing integrations with collaborators while defining what automated proposals may request. TOHSA supports the integration contribution. Ariadne provides a separate example of defining execution scope.',
    uncertainty: 'This assumes the team has people who can define its access policy and review changes. The public accounts do not establish sole ownership of an authorization system or an observed authorization test result.',
    question: 'How would you establish which access rules you own and demonstrate that a request outside those rules is denied?',
  },
]

function DemoBriefing() {
  return <section aria-labelledby="demo-heading">
    <p className="eyebrow">Authored demonstration</p>
    <h2 id="demo-heading">How might Miguel contribute to a small scientific platform team?</h2>
    <p>Suppose the team needs AI-assisted discovery, backend integrations, and strict correctness. Each proposed responsibility below is a hypothesis to test in an interview.</p>
    {teamFit.map(item => <article className="fit-example" key={item.title}>
      <h3>{item.title}</h3>
      <h4>Documented work</h4>
      <ul>{item.claimIds.map(id => {
        const claim = catalog.claims.find(item => item.id === id)!
        return <li key={id}>
          <p>{claim.contribution} {claim.role}</p>
          <p className="claim-limit">{claim.limit}</p>
          <p className="evidence-meta">{claim.classification} · <a href={claim.url}><code>{id}</code></a> · <a href={claim.source.url}>Source account</a></p>
        </li>
      })}</ul>
      <h4>Why it might apply</h4><p>{item.inference}</p>
      <h4>Assumptions and uncertainty</h4><p>{item.uncertainty}</p>
      <h4>Ask in an interview</h4><p>{item.question}</p>
    </article>)}
  </section>
}

const siteSteps = [
  ['Choose a question', 'Select a technical question or responsibility.'],
  ['Gather claims', 'Use the public claims required by that briefing.'],
  ['Apply a reviewed interpretation', 'Explain a comparison through a published relationship.'],
  ['Validate the plan', 'Check the operation, focus and evidence IDs.'],
  ['Render the briefing', 'Use the site’s fixed presentation components.'],
  ['Inspect the evidence', 'Follow each source and read its attribution and limits.'],
]

const agentSteps = [
  ['Get the package', 'Open the public JSON or download it.'],
  ['Give it to your assistant', 'Provide the URL or file with an objective.'],
  ['Let it choose evidence', 'The assistant can connect any public claims relevant to the question, including combinations outside the site’s briefings.'],
  ['Read its briefing', 'The assistant uses whichever output formats it supports.'],
  ['Check original references', 'Ask it to retain sources and label what it inferred, what it assumed, and what would need verification.'],
]

export function MechanismGuide() {
  return <div className="guide-content">
    <div className="mechanism-columns">
      <section aria-labelledby="site-route">
        <h2 id="site-route">On this site</h2>
        <p>The site controls the evidence, reviewed relationships, plans and rendering.</p>
        <Steps items={siteSteps} />
      </section>
      <section aria-labelledby="assistant-route">
        <h2 id="assistant-route">With your assistant</h2>
        <p>Your assistant controls its interpretation. A conclusion about past work needs citations. A proposal about future responsibilities also needs assumptions and a way to test it.</p>
        <Steps items={agentSteps} />
      </section>
    </div>
    <section aria-labelledby="in-practice">
      <h2 id="in-practice">The same questions in engineering work</h2>
      <dl className="mechanism-examples">
        <dt>What has authority to act?</dt>
        <dd>Ariadne checks the scope of structured model proposals before compiling a graph query. <a href={catalog.claims.find(item => item.id === 'ariadne-execution')!.url}>Inspect the execution boundary</a></dd>
        <dt>What counts as a trustworthy reference?</dt>
        <dd>Performance changes to the scientific analysis application were checked against established results. Ariadne’s ambiguity control expected a change in behavior. <a href="/briefings/correctness/correctness-reference/reference/">Compare the validation approaches</a></dd>
        <dt>What supports a claim about collaborative work?</dt>
        <dd>TOHSA’s public account identifies backend and portal contributions for data integration and controlled access within a development-stage collaboration. <a href={catalog.claims.find(item => item.id === 'tohsa-integration')!.url}>Inspect the role and evidence limits</a></dd>
        <dt>Where did a retained result come from?</dt>
        <dd>Synkrita’s public case explains how an offline import preserved the original catalogue response and each record’s position within it. <a href="/projects/synkrita/">Read the case study</a></dd>
      </dl>
    </section>
    <p>Open the <a href="/briefings/correctness/correctness-reference/reference/">correctness briefing</a> and expand <strong>Interface Inspector</strong> to see its selected question, claim IDs and relationship.</p>
    <p><a href={agentGuidePath}>Bring your AI agent</a></p>
  </div>
}

function Steps({ items }: { items: string[][] }) {
  return <ol className="mechanism-steps">{items.map(([label, description]) =>
    <li key={label}><strong>{label}</strong><p>{description}</p></li>)}</ol>
}
