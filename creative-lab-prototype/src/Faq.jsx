import { useRef, useState } from 'react';
import { ArrowUpRight, MagnifyingGlass, Plus, X } from '@phosphor-icons/react';
import { faqGroups, filterFaqGroups } from './faq-data.js';

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
      <h2 id="questions-title">Frequently asked questions</h2>
      <form className="faq-search" role="search" aria-label="Search FAQs" onSubmit={event => event.preventDefault()}>
        <MagnifyingGlass size={21} aria-hidden="true"/>
        <input ref={searchRef} type="search" aria-label="Search questions and answers" placeholder="Search questions or keywords" value={query} onChange={event => setQuery(event.target.value)} onKeyDown={event => { if (event.key === 'Escape') clearSearch(); }} aria-controls="faq-results"/>
        {query && <button type="button" onClick={clearSearch} aria-label="Clear search"><X size={18}/></button>}
      </form>
      <div className="faq-topics" role="group" aria-label="FAQ topics">
        {[{id:'all', title:'All topics'}, ...faqGroups].map(group =>
          <button type="button" key={group.id} aria-pressed={topic === group.id} aria-controls="faq-results" onClick={() => setTopic(group.id)}>{group.title}</button>
        )}
      </div>
    </header>

    <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">{count} {count === 1 ? 'question' : 'questions'} found</p>
    <div className="faq-groups" id="faq-results">
      {groups.map(group => <section className="faq-group" key={group.id} id={`faq-${group.id}`} aria-labelledby={`faq-heading-${group.id}`}>
        <h3 id={`faq-heading-${group.id}`}>{group.title}</h3>
        <div className="faq-list">
          {group.items.map(([question, answer, href, label]) =>
            <details key={`${question}:${search}`} open={Boolean(search) || undefined}>
              <summary>{question}<Plus size={19} aria-hidden="true"/></summary>
              <div className="faq-answer">
                <p>{answer}</p>
                {href && <a href={href} target="_blank" rel="noreferrer">{label}<ArrowUpRight size={14} aria-hidden="true"/></a>}
              </div>
            </details>
          )}
        </div>
      </section>)}
      {count === 0 && <div className="faq-empty">
        <h3>No questions found</h3>
        <p>Try another keyword or choose a different topic.</p>
      </div>}
    </div>
    <footer className="faq-help"><span>Still have a question?</span><a className="support-text-link" href="https://help.meshy.ai/en/" target="_blank" rel="noreferrer">Visit help center <ArrowUpRight size={16} aria-hidden="true"/></a></footer>
  </section>;
}
