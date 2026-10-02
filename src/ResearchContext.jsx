import { useId, useState } from 'react';
import { ChevronDown } from 'lucide-react';

function ResearchContext({ title, label, children }) {
  const [expanded, setExpanded] = useState(false);
  const contentId = useId();
  return <aside className="similarity-context" aria-label={label}>
    <h3>{title}</h3>
    <button className="context-toggle" aria-expanded={expanded} aria-controls={contentId}
      onClick={() => setExpanded(value => !value)}>
      <span>{title}</span><ChevronDown size={16} aria-hidden="true" />
    </button>
    <div id={contentId} className={`context-content${expanded ? ' is-open' : ''}`}>{children}</div>
  </aside>;
}

const relations = [
  { id: 'identical', title: 'Identical', short: 'Carry over reality',
    definition: 'A real-world element maps directly to its fictional counterpart.',
    example: 'The same car park and white wall become the setting of the story.' },
  { id: 'iconic', title: 'Iconic', short: 'Reimagine a feature',
    definition: 'A shape, texture or function suggests something fictional.',
    example: 'The shadow’s outline suggests the protagonist’s changing body.' },
  { id: 'symbolic', title: 'Symbolic', short: 'Connect through meaning',
    definition: 'A symbolic or cultural meaning connects an observation to a story theme.',
    example: 'The shadow could stand for a hidden identity or an undisclosed change.' },
];

// Explanatory readings of the prepared example, not live model classifications.
export function SimilarityContext() {
  return <ResearchContext title="How surroundings spark an idea" label="Similarity relations explained">
    <dl className="similarity-relations">
      {relations.map(item => <div key={item.id}>
        <dt>{item.title}</dt>
        <dd><p>{item.definition}</p><p className="similarity-example">{item.example}</p></dd>
      </div>)}
    </dl>
  </ResearchContext>;
}

export function AuthenticityContext() {
  return <ResearchContext title="Keep fiction believable · The authenticity triad" label="Authenticity in transformation">
    <dl className="similarity-relations">
      <div><dt>Factual Accuracy</dt><dd>Anchor real-world details in observation and accurate references, while leaving room for imagined events.</dd></div>
      <div><dt>Logical &amp; Behavioral Consistency</dt><dd>Keep events, actions and character motivations coherent as the shadow becomes a clue to change.</dd></div>
      <div><dt>Emotional &amp; Psychological Authenticity</dt><dd>Make the protagonist’s fear, curiosity and hesitation feel believable within the situation.</dd></div>
    </dl>
  </ResearchContext>;
}

export function DesignGoals() {
  return <section className="research-goals wrap" aria-labelledby="design-goals-title">
    <header className="design-goals-heading">
      <h2 className="section-heading" id="design-goals-title">Design goals</h2>
      <p className="research-goals-intro">Three priorities drawn from interviews with fiction writers.</p>
    </header>
    <div className="design-goals-content">
    <div className="design-goals-grid">
      <article><span>DG1</span><h3>Augment in-situ perception</h3><p>Bridge reality and fiction by connecting the writer’s surroundings, intentions and evolving story—while inspiration is still present.</p>
    <details className="perception-details">
      <summary>Perception: breadth, depth and translation</summary>
      <dl>
        <div><dt>Breadth</dt><dd>Notice overlooked details and broaden what the writer attends to.</dd></div>
        <div><dt>Depth</dt><dd>Use factual grounding to deepen understanding of an observed moment.</dd></div>
        <div><dt>Translation</dt><dd>Turn sensory impressions into metaphor and literary expression.</dd></div>
      </dl>
    </details>
      </article>
      <article><span>DG2</span><h3>Ground fiction in authenticity</h3><p>Support factual, logical &amp; behavioral, and emotional &amp; psychological authenticity, while leaving room for fictionalization for aesthetics and privacy.</p></article>
      <article><span>DG3</span><h3>Preserve agency, enjoyment &amp; boundaries</h3><p>Keep writers in control of expression and AI involvement. Make creation enjoyable while limiting distraction and protecting the boundary between everyday life and writing.</p></article>
    </div>
    </div>
  </section>;
}
