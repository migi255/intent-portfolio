import { useEffect, useRef, useState, type MouseEvent, type ReactNode } from 'react'
import { AgentGuide, MechanismGuide, agentGuidePath, mechanismPath } from './components/AgentGuide.js'
import type { PublicationInfo } from './evidence/handoff.js'
import { ThemeControl } from './components/ThemeControl.js'
import { catalog, evidencePath, identity, normalizePath, resolveBriefing } from './evidence/catalog.js'

type PublicClaim = typeof catalog.claims[number]
type Project = typeof catalog.projects[number]
type Briefing = typeof catalog.briefings[number]

const comparison = '/briefings/correctness/correctness-reference/reference/'
const systems = '/briefings/systems/systems-boundaries/boundaries/'

function Evidence({ claim, anchored = false, expanded = anchored }: { claim: PublicClaim; anchored?: boolean; expanded?: boolean }) {
  return <details className="evidence-note" id={anchored ? 'claim-' + claim.id : undefined} open={expanded || undefined}>
    <summary>{anchored ? claim.title : 'Inspect contribution and evidence'}</summary>
    <dl>
      <dt>Contribution</dt><dd>{claim.contribution}</dd>
      <dt>Role</dt><dd>{claim.role}</dd>
      <dt>Implementation</dt><dd>{claim.implementation}</dd>
      <dt>Validation</dt><dd>{claim.validation}</dd>
      <dt>Outcome</dt><dd>{claim.outcome}</dd>
      <dt>Limit</dt><dd>{claim.limit}</dd>
    </dl>
    <p className="evidence-meta">{claim.classification} · Candidate-published case study</p>
    <p className="evidence-links"><a href={claim.source.url}>Read source account</a>{!anchored && <a href={claim.url}>Link to claim</a>}</p>
  </details>
}

function Intro({ label, title, children }: { label: string; title: ReactNode; children?: ReactNode }) {
  return <div className="editorial-intro">
    <p className="eyebrow">{label}</p>
    <h1>{title}</h1>
    {children && <div className="intro-copy">{children}</div>}
  </div>
}

function Home() {
  const selected = ['analysis-performance', 'tohsa-integration', 'ariadne-ambiguity']
  return <>
    <div className="editorial-opening">
      <Intro label="Software engineer" title={<>Scientific software<br />&amp; research systems</>}>
        <p>{identity.summary}</p>
        <p className="home-evidence-line">Review my experience, compare decisions, or give the same public evidence to your assistant.</p>
      </Intro>
      <aside className="editorial-aside" aria-labelledby="judgment">
        <p className="eyebrow">Engineering judgment</p>
        <h2 id="judgment">What makes a test result trustworthy?</h2>
        <p>Established scientific results can be a reference for an optimization. An ambiguity test may require changing the old answer.</p>
        <a href={comparison}>Compare the validation decisions</a>
      </aside>
    </div>
    <nav className="onboarding-links" aria-label="Ways to explore">
      <a href="/experience/"><strong>Evaluate my experience</strong><span>Roles, technologies and project maturity</span></a>
      <a href="#questions"><strong>Explore engineering decisions</strong><span>Compare work and inspect how it was tested</span></a>
      <a href={agentGuidePath}><strong>Bring your AI agent</strong><span>Share the homepage and ask your own question</span></a>
    </nav>
    <p className="home-data-link"><a href={evidencePath} type="application/json">Public engineering evidence (JSON)</a></p>
    <section className="editorial-section" aria-labelledby="selected">
      <h2 id="selected">Selected contributions</h2>
      <div className="contribution-ledger">{selected.map(id => {
        const claim = catalog.claims.find(item => item.id === id)
        if (!claim) return null
        const project = catalog.projects.find(item => item.id === claim.projectId)!
        return <article key={id}>
          <a className="record-name" href={project.url}>{project.title}</a>
          <div><h3>{claim.title}</h3><p>{claim.contribution}</p>
            <p className="evidence-meta">{claim.classification} · {project.maturity}</p><p className="claim-limit">{claim.limit}</p>
            <Evidence claim={claim} />
          </div>
          <p className="technology-line">{project.technologies?.join(' · ')}</p>
        </article>
      })}</div>
    </section>
    <section className="editorial-section" aria-labelledby="questions">
      <h2 id="questions">Explore engineering decisions</h2>
      <p className="onboarding-intro">Change the question to see what the same evidence says about implementation, validation and uncertainty.</p>
      <div className="question-links">
        <a href={comparison}><strong>Compare validation approaches</strong><span>Compare requirements, validation references and what the results establish.</span></a>
        <a href={systems}><strong>Assess backend experience</strong><span>Explore trust boundaries, data integration, testing and delivery.</span></a>
      </div>
      <p className="evidence-links"><a href={mechanismPath}>How this portfolio works</a><a href="/?view=projects#results">Find work by technology or topic</a></p>
    </section>
  </>
}

function Brief({ brief, choose }: { brief: Briefing; choose: (event: MouseEvent<HTMLAnchorElement>, url: string) => void }) {
  const { plan } = brief
  const compare = plan.operation === 'comparison'
  const siblingBriefings = catalog.briefings.filter(item => item.plan.operation === plan.operation &&
    (!compare || item.plan.components[0].relationshipId === plan.components[0].relationshipId))
  const byClaim = new Map(catalog.claims.map(claim => [claim.id, claim]))
  return <>
    <Intro label={compare ? 'Correctness and testing' : 'Backend and systems engineering'}
      title={compare ? 'How do I establish correctness?' : 'Where did I contribute to backend systems?'}>
      {compare ? 'Follow the same two projects from the correctness requirement to the result and its limits.' :
        'Follow engineering responsibilities across ongoing maintenance, experimental architecture and collaborative platform development.'}
    </Intro>
    <nav className="brief-choices" aria-label={compare ? 'Comparison questions' : 'Engineering responsibilities'}>
      {siblingBriefings.map(item => <a key={item.url} href={item.url} aria-current={item.url === brief.url ? 'page' : undefined}
        onClick={event => choose(event, item.url)}>{item.label}</a>)}
    </nav>
    <div className="brief-content">
      {plan.components.map(block => {
        const relationship = catalog.relationships.find(item => item.id === block.relationshipId)!
        const reading = relationship.readings[plan.focus]
        return <section key={relationship.id} className={'brief-reading ' + (compare ? 'comparison-reading' : 'responsibility-reading')}>
          <div className="reading-thesis">
            <h2 id="brief-focus" tabIndex={-1}>{brief.label}</h2>
            <p className="reading-interpretation">{relationship.interpretation}</p>
            <p>{reading.contrast}</p>
          </div>
          <div className="evidence-strands">
            {block.claimIds.map((id, index) => {
              const claim = byClaim.get(id)!
              const project = catalog.projects.find(item => item.id === claim.projectId)!
              const related = !compare && siblingBriefings.find(item => item.url !== brief.url &&
                item.plan.components.some(component => component.claimIds.includes(id)))
              return <article key={id}>
                <a className="record-name" href={project.url}>{project.title}</a>
                <p className="evidence-meta">{project.maturity}</p>
                <h3>{reading.observations[index]}</h3>
                <p>{compare ? claim.outcome : claim.role}</p>
                {!compare && <p className="technology-line">{project.technologies?.join(' · ')}</p>}
                <p className="evidence-meta">{claim.classification}</p>
                <p className="claim-limit">{claim.limit}</p>
                <Evidence claim={claim} />
                {related && <p className="related-reading"><a href={related.url} onClick={event => choose(event, related.url)}>{related.label}</a></p>}
              </article>
            })}
          </div>
          <p className="relationship-limit">{relationship.limit}</p>
        </section>
      })}
      <details className="evidence-note interface-detail">
        <summary>Interface Inspector</summary>
        <p>{brief.label} selects an authored reading. The relationship supplies the comparison and fixes the evidence needed to support it. Each claim carries its attribution and limits.</p>
        <pre>{JSON.stringify(plan, null, 2)}</pre>
      </details>
      <p className="next-brief"><a href={compare ? systems : comparison}>{compare ? 'Explore backend and systems work' : 'Compare correctness and validation'}</a></p>
    </div>
  </>
}

function Projects() {
  return <><Intro label="Case studies" title="Projects" />
    <div className="project-index">{catalog.projects.map(project => <article key={project.id}>
      <h2><a href={project.url}>{project.title}</a></h2><div><p>{project.summary}</p>
        <p className="evidence-meta">Candidate-authored account · {project.maturity}</p>
        <p className="technology-line">{project.technologies?.join(' · ')}</p></div>
    </article>)}</div></>
}

function Case({ project }: { project: Project }) {
  const associated = catalog.decisions.filter(decision => project.related?.includes(decision.id))
  const experience = catalog.experience.filter(entry => project.related?.includes(entry.id))
  const projectClaims = catalog.claims.filter(claim => claim.projectId === project.id)
  const delivery = project.caseStudy?.delivery
  return <>
    <Intro label={project.maturity || 'Case study'} title={project.title}><p>{project.summary}</p>
      <p className="technology-line">{project.technologies?.join(' · ')}</p></Intro>
    <div className="case-content">
      {experience.map(entry => <section key={entry.id} id={'source-' + entry.id}><h2>Contribution and role</h2><p>{entry.summary}</p></section>)}
      {!delivery && projectClaims.map(claim => <Evidence key={claim.id} claim={claim} anchored />)}
      <section id={'source-' + project.id} aria-labelledby="technical-account">
        <h2 id="technical-account">{project.caseStudy?.subtitle || 'Technical account'}</h2>
        <p className="evidence-meta">Candidate-authored account · {project.caseStudy?.status}</p>
        {project.caseStudy?.sections.map(section => <section key={section.heading}
          id={associated.some(entry => entry.title === section.heading) ? 'source-' + associated.find(entry => entry.title === section.heading)!.id : undefined}>
          <h3>{section.heading}</h3>{section.paragraphs.map(paragraph => <p key={paragraph}>{paragraph}</p>)}
          {section.flow && <><p className="evidence-meta">{section.flowCaption}</p><ol>{section.flow.map(step => <li key={step}>{step}</li>)}</ol></>}
          {section.comparisons?.map(row => <dl key={row.label}><dt>{row.label}</dt><dd>{row.conventional}</dd><dd>{row.prototype}</dd></dl>)}
        </section>)}
      </section>
      {delivery && <section id={'source-' + delivery.id}>
        <h2>{delivery.heading}</h2>
        {delivery.paragraphs.map(paragraph => <p key={paragraph}>{paragraph}</p>)}
        {projectClaims.map(claim => <Evidence key={claim.id} claim={claim} anchored expanded={false} />)}
      </section>}
    </div>
    <p><a href="/projects/">All projects</a></p>
  </>
}

function Decisions() {
  return <><Intro label="Engineering decisions" title="Choices and tradeoffs">
    Open a decision to see the reasoning and the available evidence.
  </Intro><div className="case-content">{catalog.decisions.map(decision =>
    <section key={decision.id} id={'decision-' + decision.id}>
      <h2>{decision.title}</h2>
      <p className="evidence-meta">Candidate-authored account</p>
      {(decision.decisionParagraphs || [decision.summary]).map(paragraph => <p key={paragraph}>{paragraph}</p>)}
      {!decision.caseStudyOnly && <p><a href={decision.url}>Read the project case</a></p>}
    </section>)}</div></>
}

const careerMonth = new Intl.DateTimeFormat('en', { month: 'short', year: 'numeric', timeZone: 'UTC' })

function CareerMonth({ value }: { value: string }) {
  return <time dateTime={value}>{careerMonth.format(new Date(value + '-01T00:00:00Z'))}</time>
}

function CareerLinks({ links, resume }: { links: readonly { label: string; url: string }[]; resume: boolean }) {
  return <p className="evidence-links">{links.map(({ label, url }) =>
    <a key={url} href={resume && url.startsWith('/experience/#') ? url.slice('/experience/'.length) : url}>{label}</a>
  )}</p>
}

function Experience({ resume }: { resume: boolean }) {
  const { career } = catalog
  return <>
    <Intro label={resume ? identity.name : 'Engineering experience'} title={resume ? 'Résumé summary' : 'Experience'}>
      {resume ? <><p>{identity.summary}</p><p className="resume-scope">A printable summary of selected employment, research, education, and engineering projects.</p></> :
        career.progression}
    </Intro>
    <section className="editorial-section" aria-labelledby="career-appointments">
      <h2 id="career-appointments">Employment and research appointments</h2>
      <p className="evidence-meta">Candidate-attested career record</p>
      <div className="project-index career-list">{career.appointments.map(record => <article key={record.id} id={'career-' + record.id}>
        <div>
          <h3>{record.title}</h3>
          <p><CareerMonth value={record.start} /> – {record.end === 'present' ? 'Present' : <CareerMonth value={record.end} />}</p>
        </div>
        <div>
          <p><strong>{record.institution}</strong> · {record.affiliation}</p>
          <p>{record.summary}</p>
          {record.evidence && <CareerLinks links={record.evidence} resume={resume} />}
        </div>
      </article>)}</div>
    </section>
    <section className="editorial-section" aria-labelledby="career-education">
      <h2 id="career-education">Education</h2>
      <div className="project-index career-list">{career.education.map(record => <article key={record.id} id={'career-' + record.id}>
        <h3>{record.institution}</h3>
        <div><p>{record.degree}</p><p className="evidence-meta">{record.academicEmphasis}</p></div>
      </article>)}</div>
    </section>
    <section className="editorial-section" aria-labelledby="career-skills">
      <h2 id="career-skills">Skills in context</h2>
      <div className="project-index career-list">{career.skills.map(group => <article key={group.id} id={'career-' + group.id}>
        <h3>{group.label}</h3>
        <div><p>{group.summary}</p><CareerLinks links={group.evidence} resume={resume} /></div>
      </article>)}</div>
    </section>
    <section className="editorial-section" aria-labelledby="project-experience">
      <h2 id="project-experience">Project experience</h2>
      <div className="project-index career-list">{catalog.experience.map(entry => {
        const project = catalog.projects.find(item => entry.related?.includes(item.id))
        return <article key={entry.id} id={'experience-' + entry.id}>
          <h3><a href={project?.url || '/projects/'}>{project?.title || entry.title}</a></h3>
          <div><p>{entry.summary}</p><p className="evidence-meta">{project?.context === 'independent' ? 'Independent project' : 'Professional project'} · {project?.maturity}</p>
            <p className="technology-line">{entry.technologies?.join(' · ')}</p></div>
        </article>
      })}</div>
    </section>
  </>
}

export function PublicPortfolio({ initialPath, publication = {} }: { initialPath: string; publication?: PublicationInfo }) {
  const [path, setPath] = useState(normalizePath(initialPath))
  const main = useRef<HTMLElement>(null)
  const transitioned = useRef(false)
  useEffect(() => {
    function restore() {
      transitioned.current = true
      setPath(normalizePath(window.location.pathname))
    }
    window.addEventListener('popstate', restore)
    return () => window.removeEventListener('popstate', restore)
  }, [])
  useEffect(() => {
    if (transitioned.current) {
      const brief = resolveBriefing(path)
      if (brief) document.title = brief.label + ' | ' + identity.name
      const heading = main.current?.querySelector<HTMLElement>('#brief-focus')
      heading?.focus({ preventScroll: true })
      if (heading && (heading.getBoundingClientRect().top < 0 || heading.getBoundingClientRect().bottom > innerHeight)) {
        heading.scrollIntoView({ block: 'start' })
      }
    }
  }, [path])
  function choose(event: MouseEvent<HTMLAnchorElement>, url: string) {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    event.preventDefault()
    if (path === url) return
    window.history.pushState(null, '', url)
    transitioned.current = true
    setPath(url)
  }

  const brief = resolveBriefing(path)
  const project = catalog.projects.find(item => item.url === path)
  const notFound = !brief && !project && !['/', '/projects/', '/experience/', '/resume/', '/decisions/', agentGuidePath, mechanismPath].includes(path)
  return <div className="evidence-portfolio">
    <a className="skip-link" href="#main">Skip to content</a>
    <header className="site-header"><div className="page-width evidence-header">
      <a className="wordmark" href="/"><span className="brand-mark" aria-hidden="true" />{identity.name}</a>
      <nav aria-label="Portfolio">
        <a href="/projects/" aria-current={path.startsWith('/projects/') ? 'page' : undefined}>Projects</a>
        <a href="/experience/" aria-current={path === '/experience/' ? 'page' : undefined}>Experience</a>
        <a href={comparison} aria-current={brief ? 'page' : undefined}>Briefings</a>
        <a href="/resume/" aria-current={path === '/resume/' ? 'page' : undefined}>Résumé summary</a>
      </nav>
      <ThemeControl />
    </div></header>
    <main className="page-width" id="main" tabIndex={-1} ref={main}>
      {brief ? <Brief key={path} brief={brief} choose={choose} /> : project ? <Case project={project} /> :
        path === agentGuidePath ? <>
          <Intro label="Public engineering evidence" title="Ask your AI about my engineering experience">
            This portfolio brings together documented contributions, technical decisions, validation, and career history so an assistant can form its own assessment.
          </Intro><AgentGuide publication={publication} />
        </> : path === mechanismPath ? <>
          <Intro label="Evidence, interpretation and presentation" title="How this portfolio works">
            The same public claims support quick review, technical comparisons and briefings made by your own assistant.
          </Intro><MechanismGuide />
        </> : path === '/projects/' ? <Projects /> : path === '/decisions/' ? <Decisions /> : path === '/experience/' || path === '/resume/' ? <Experience resume={path === '/resume/'} /> :
        notFound ? <Intro label="Portfolio" title="Explore an engineering question"><p>Choose a <a href={comparison}>correctness briefing</a>, a <a href={systems}>systems briefing</a>, or <a href="/projects/">browse project cases</a>.</p></Intro> : <Home />}
    </main>
    <footer className="page-width evidence-footer"><a href={evidencePath}>Public evidence JSON</a>
      <a href={agentGuidePath}>Bring your AI agent</a><a href={mechanismPath}>How this portfolio works</a>
      <a href="/decisions/">Engineering decision index</a></footer>
  </div>
}
