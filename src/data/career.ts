type Month = `${number}-${number}`

interface EvidenceLink {
  label: string
  url: string
}

interface Appointment {
  id: string
  title: string
  institution: string
  affiliation: string
  context: 'professional-engineering' | 'professional-research' | 'undergraduate-research'
  start: Month
  end: Month | 'present'
  summary: string
  evidence?: readonly EvidenceLink[]
}

interface Education {
  id: string
  institution: string
  degree: string
  academicEmphasis: string
}

interface SkillGroup {
  id: string
  context: Appointment['context'] | 'independent-project' | 'academic'
  label: string
  summary: string
  evidence: readonly EvidenceLink[]
}

// Only these reviewed career facts enter the public bundle.
const appointments: readonly Appointment[] = [
  {
    id: 'soka-full-stack-engineer',
    title: 'Full-Stack Engineer',
    institution: 'Soka University',
    affiliation: 'GaLSIC Lab',
    context: 'professional-engineering',
    start: '2025-06',
    end: 'present',
    summary: 'Maintain and improve scientific analysis software, translate researcher requirements into validated updates, and contribute backend and portal work to collaborative glycoscience research infrastructure.',
    evidence: [
      { label: 'Scientific software delivery', url: '/projects/mass-spectrometry-analysis/#claim-analysis-delivery' },
      { label: 'Collaborative backend and portal work', url: '/projects/tohsa/#claim-tohsa-integration' },
    ],
  },
  {
    id: 'gwu-research-specialist',
    title: 'Research Specialist',
    institution: 'George Washington University',
    affiliation: 'Shook Lab and HIVE Lab',
    context: 'professional-research',
    start: '2023-10',
    end: '2025-05',
    summary: 'Developed Python and Neo4j workflows for biomedical data discovery, including RDF/XML normalization and knowledge-graph-backed retrieval. Built a configurable microscopy image-analysis and cell-detection pipeline.',
  },
  {
    id: 'bu-wong-research-assistant',
    title: 'Undergraduate Research Assistant',
    institution: 'Boston University',
    affiliation: 'Wong Lab, College of Engineering',
    context: 'undergraduate-research',
    start: '2023-04',
    end: '2023-07',
    summary: 'Developed an optical illumination system and a MATLAB interface and analysis pipeline for evaluating experimental results. Used microscopy and quantitative image analysis in the research workflow.',
  },
  {
    id: 'bu-johnson-research-assistant',
    title: 'Undergraduate Research Assistant',
    institution: 'Boston University',
    affiliation: 'Johnson Lab, Department of Medicine',
    context: 'undergraduate-research',
    start: '2021-01',
    end: '2022-08',
    summary: 'Applied sequencing-data analysis workflows under faculty supervision, performed statistical analysis of RNA-seq data and metadata, and used R in sequencing research and submitted shell scripts on shared computing infrastructure.',
  },
]

const education: readonly Education[] = [
  {
    id: 'gwu-computer-science-ms',
    institution: 'George Washington University',
    degree: 'M.S. in Computer Science',
    academicEmphasis: 'Machine-learning focus',
  },
  {
    id: 'bu-biomedical-engineering-bs',
    institution: 'Boston University',
    degree: 'B.S. in Biomedical Engineering',
    academicEmphasis: 'Machine-learning concentration',
  },
]

export const careerUrl = (id: string) => '/experience/#career-' + id

const skills: readonly SkillGroup[] = [
  {
    id: 'professional-application-development',
    context: 'professional-engineering',
    label: 'Professional application development',
    summary: 'Scala and scientific application maintenance. Java, Spring Boot, TypeScript, and Python in collaborative research infrastructure. Researcher requirements, validation, backend integration, and controlled access.',
    evidence: [
      { label: 'Soka appointment', url: careerUrl('soka-full-stack-engineer') },
      { label: 'Scientific validation', url: '/projects/mass-spectrometry-analysis/#claim-analysis-performance' },
      { label: 'Backend integration', url: '/projects/tohsa/#claim-tohsa-integration' },
    ],
  },
  {
    id: 'professional-research-software',
    context: 'professional-research',
    label: 'Professional research software',
    summary: 'Python, Neo4j, RDF/XML, and knowledge-graph-backed retrieval. Microscopy image analysis and configurable cell-detection workflows.',
    evidence: [{ label: 'GW research software role', url: careerUrl('gwu-research-specialist') }],
  },
  {
    id: 'independent-engineering',
    context: 'independent-project',
    label: 'Independent engineering',
    summary: 'Python, Pydantic, SQLite, RDF, and SPARQL in Ariadne. Connector qualification, evidence persistence, and local release reproducibility in Synkrita. Simulation state and controlled model integration in GEAS.',
    evidence: [
      { label: 'Ariadne execution boundary', url: '/projects/ariadne/#claim-ariadne-execution' },
      { label: 'Synkrita transport qualification', url: '/projects/synkrita/#claim-synkrita-transport-qualification' },
      { label: 'Synkrita release verification', url: '/projects/synkrita/#claim-synkrita-release-reproducibility' },
      { label: 'GEAS state and narration', url: '/projects/geas/#source-geas-story-authority' },
    ],
  },
  {
    id: 'undergraduate-research-methods',
    context: 'undergraduate-research',
    label: 'Undergraduate research methods',
    summary: 'MATLAB and quantitative experiment analysis in the Wong Lab. RNA-seq analysis, shared computing, shell scripting, and historical research use of R in the Johnson Lab.',
    evidence: [
      { label: 'Wong Lab appointment', url: careerUrl('bu-wong-research-assistant') },
      { label: 'Johnson Lab appointment', url: careerUrl('bu-johnson-research-assistant') },
    ],
  },
  {
    id: 'academic-machine-learning',
    context: 'academic',
    label: 'Academic focus',
    summary: 'Machine learning in computer science and biomedical engineering.',
    evidence: [
      { label: 'Computer Science M.S.', url: careerUrl('gwu-computer-science-ms') },
      { label: 'Biomedical Engineering B.S.', url: careerUrl('bu-biomedical-engineering-bs') },
    ],
  },
]

export const career = {
  provenance: 'candidate-attested' as const,
  progression: 'My work progressed from experimental and computational research to research software for biomedical discovery, then to maintaining scientific applications and contributing to collaborative full-stack research infrastructure.',
  appointments: appointments.map(record => ({ ...record, url: careerUrl(record.id) })),
  education: education.map(record => ({ ...record, url: careerUrl(record.id) })),
  skills: skills.map(record => ({ ...record, url: careerUrl(record.id) })),
}
