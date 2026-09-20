import { useRef, useState } from 'react';
import { ArrowUpRight, MagnifyingGlass, Plus, X } from '@phosphor-icons/react';
import { faqGroups, filterFaqGroups } from './faq-data.js';

const topicLabels = { 'files-printing': 'Printing', 'orders-delivery': 'Orders', 'photos-rights': 'Usage Rights' };

export default function Faq() {
  const [query, setQuery] = useState('');
  const [topic, setTopic] = useState('all');
  const searchRef = useRef(null);
  const search = query.trim();
  const groups = filterFaqGroups(query, topic);
  const count = groups.reduce((total, group) => total + group.items.length, 0);

  function clearSearch() {
    setQuery('');
    searchRef.current?.focus();
  }

  return <section className="lab-faq" id="faqs" aria-labelledby="questions-title">
    <header className="faq-header">
      <h2 className="lab-section-title" id="questions-title">Frequently Asked Questions<i className="seed-rest" data-seed-anchor="faq" aria-hidden="true"/></h2>
    </header>
    <div className="faq-content">
      <div className="faq-toolbar">
        <div className="faq-topics" role="group" aria-label="FAQ topics">
          {[{id:'all', title:'All'}, ...faqGroups].map(group =>
            <button type="button" key={group.id} aria-pressed={topic === group.id} aria-controls="faq-results" onClick={() => setTopic(group.id)}>{topicLabels[group.id] || group.title}</button>
          )}
        </div>
        <form className="faq-search" role="search" aria-label="Search FAQs" onSubmit={event => event.preventDefault()}>
          <MagnifyingGlass size={22} weight="light" aria-hidden="true"/>
          <input ref={searchRef} type="search" aria-label="Search questions and answers" placeholder="Search keywords" value={query} onChange={event => setQuery(event.target.value)} onKeyDown={event => { if (event.key === 'Escape') clearSearch(); }} aria-controls="faq-results"/>
          {query && <button type="button" onClick={clearSearch} aria-label="Clear search"><X size={18}/></button>}
        </form>
      </div>

      <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">{count} {count === 1 ? 'question' : 'questions'} found</p>
      <div className="faq-results faq-list" id="faq-results">
        {groups.flatMap(group => group.items.map(([question, answer, href, label]) => {
          const [before, after] = href ? answer.split(label) : [answer];
          return <details key={`${question}:${search}`} open={Boolean(search) || undefined}>
            <summary>{question}<Plus size={20} weight="light" aria-hidden="true"/></summary>
            <div className="faq-answer">
              <p>{before}{href && <><a href={href} target="_blank" rel="noreferrer">{label}</a>{after}</>}</p>
            </div>
          </details>;
        }))}
        {count === 0 && <div className="faq-empty">
          <h3>No Questions Found</h3>
          <p>Try another keyword or choose a different topic.</p>
        </div>}
      </div>
      <footer className="faq-help"><span>Still have questions?</span><a className="support-text-link" href="https://help.meshy.ai/en/" target="_blank" rel="noreferrer">Visit help center <ArrowUpRight size={16} aria-hidden="true"/></a></footer>
    </div>
  </section>;
}
