import { catalog, evidencePath } from '../evidence/catalog.js'
import { evidenceUrl, type PublicationInfo } from '../evidence/handoff.js'

export const agentGuidePath = '/bring-your-agent/'
export const mechanismPath = '/how-it-works/'

export function AgentGuide({ publication }: { publication: PublicationInfo }) {
  const homepage = evidenceUrl('/', publication.origin)
  const generatedDate = publication.generatedAt?.slice(0, 10)

  return <div className="guide-content">
    <section aria-labelledby="agent-examples">
      <p>Share the <a href={homepage}>portfolio homepage</a> with your preferred AI assistant and ask how my experience might apply to your team, project, or technical challenges.</p>
      <h2 id="agent-examples">Example questions</h2>
      <ul className="agent-questions">
        <li>How might Miguel contribute to a team building an AI-enabled research platform?</li>
        <li>What evidence supports his ability to work independently on backend systems?</li>
        <li>What did he personally validate, and what should we ask him about in an interview?</li>
      </ul>
      <p>An assistant can use the site’s structured evidence to make its own assessment. It should cite documented work, label what it infers, and flag where evidence is missing. Website access and automatic evidence discovery vary by assistant.</p>
    </section>
    <details className="evidence-note guide-assessment">
      <summary>See an example assessment</summary>
      <DemoBriefing />
    </details>
    <p className="evidence-links"><a href={mechanismPath}>How this portfolio works</a></p>
    <p className="evidence-meta">Technical references · <a href={evidencePath}>Evidence JSON</a> · <a href={catalog.presentation.documentation}>Schema</a>
      {generatedDate && <> · Export generated <time dateTime={publication.generatedAt}>{generatedDate}</time> (UTC)</>}
    </p>
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
  ['Share the homepage', 'Give your assistant the portfolio URL and ask your own question.'],
  ['Find the evidence', 'The homepage links to structured engineering and career evidence.'],
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
