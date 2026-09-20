import { useRef, useState } from 'react';
import {
  ArrowRight,
  ArrowUpRight,
  Images,
  Check,
  CheckCircle,
  CaretUpDown,
} from '@phosphor-icons/react';
import { products } from '../data/products.js';
import Workflow from './Workflow.jsx';
import Faq from './Faq.jsx';
import TiltedCard from './TiltedCard.jsx';
import SpecularButton from './SpecularButton.jsx';
import CreationFinale from './CreationFinale.jsx';

const official = (path) => `https://www.meshy.ai${path}`;
const toolkit = [
  [
    'Image To 3D',
    'Build a model from a photo or concept image.',
    'tool-image',
    '/features/image-to-3d',
  ],
  [
    'Text To 3D',
    'Describe a new object and generate its shape.',
    'tool-text',
    '/features/text-to-3d',
  ],
  [
    'AI Texturing',
    'Give existing geometry new materials and surface detail.',
    'tool-texture',
    '/features/ai-texture-generator',
  ],
  [
    'AI Image Generator',
    'Create reference images for your next 3D idea.',
    'tool-imagegen',
    '/features/ai-image-generator',
  ],
  [
    'AI Animation',
    'Rig a character and explore ready-to-use motions.',
    'tool-animation',
    '/features/ai-animation-generator',
  ],
  [
    '3D Printing',
    'Prepare, export and slice models for your printer.',
    'tool-print',
    '/3d-printing',
  ],
];

export default function LabSections({
  saved,
  onOpenSaved,
  onStartCreation,
  onBrowseCreations,
  onUpload,
}) {
  const [inquiry, setInquiry] = useState(null);
  const businessStage = useRef(null);
  function reviewInquiry(event) {
    event.preventDefault();
    setInquiry(Object.fromEntries(new FormData(event.currentTarget)));
  }
  return (
    <div className="lab-secondary">
      <section
        id="my-creations-panel"
        className="creation-shelf"
        aria-labelledby="my-creations-title"
      >
        <div className="shelf-title">
          <h2 className="lab-section-title" id="my-creations-title" tabIndex={-1}>
            My Creations <span>{Object.keys(saved).length}</span>
            <i className="seed-rest seed-shelf" data-seed-anchor="shelf" aria-hidden="true" />
          </h2>
        </div>
        {Object.keys(saved).length ? (
          <div className="saved-creations">
            {Object.entries(saved).map(([id, draft]) => (
              <button key={id} className="saved-creation" onClick={() => onOpenSaved(id)}>
                <img src={draft.url} alt="Saved source photo" />
                <span>
                  <strong>{draft.name || products.find((p) => p.id === id).title}</strong>
                  <small>{products.find((p) => p.id === id).title} · Continue editing</small>
                </span>
                <ArrowUpRight size={19} />
              </button>
            ))}
          </div>
        ) : (
          <div className="shelf-empty">
            <div className="shelf-symbol" aria-hidden="true">
              <Images size={34} weight="light" />
            </div>
            <div>
              <h3>No Creations Yet</h3>
              <p>Save your first design and it will appear here.</p>
            </div>
            <button className="quiet-button" onClick={onStartCreation}>
              Start Creating <ArrowRight size={17} />
            </button>
          </div>
        )}
      </section>

      <div className="business-workflow">
        <section
          className="business-stage"
          id="business"
          aria-labelledby="business-title"
          ref={businessStage}
        >
          <div className="business-section">
            <div className="business-story">
              <span className="seed-beacon" data-seed-anchor="business" aria-hidden="true" />
              <span className="section-eyebrow">FOR BUSINESS</span>
              <h2 id="business-title">
                Sell Custom 3D Products
                <br />
                <span className="business-promise">
                  Under Your Own Brand.
                  <svg
                    className="business-mark"
                    viewBox="0 0 300 16"
                    preserveAspectRatio="none"
                    aria-hidden="true"
                  >
                    <path d="M0 10 Q150 -2 300 10" pathLength="1" />
                  </svg>
                  <i className="business-mark-rest" aria-hidden="true" />
                </span>
              </h2>
              <p>
                Turn a photo or a prompt into a shipped, custom product, right inside the store or
                brand you already run. Drop in our widget and API, or build something custom with
                our team.
              </p>
              <ul className="business-benefits">
                <li>
                  <CheckCircle size={24} weight="fill" aria-hidden="true" />
                  <span>Drop-in widget &amp; API — live in days, no printer needed</span>
                </li>
                <li>
                  <CheckCircle size={24} weight="fill" aria-hidden="true" />
                  <span>Your brand, your store, your customers</span>
                </li>
                <li>
                  <CheckCircle size={24} weight="fill" aria-hidden="true" />
                  <span>Bring your own manufacturing, or use our network</span>
                </li>
              </ul>
            </div>
            <div className="contact-panel">
              <header className="contact-heading">
                <h3>Talk To Our Team</h3>
                <p>Tell us what you’re building and we’ll reach out.</p>
              </header>
              <form onSubmit={reviewInquiry} onChange={() => setInquiry(null)}>
                <div className="contact-fields">
                  <label htmlFor="business-email">
                    Work email
                    <input
                      id="business-email"
                      type="email"
                      name="email"
                      required
                      autoComplete="email"
                      placeholder="you@company.com"
                    />
                  </label>
                  <label htmlFor="business-company">
                    Company <span className="field-optional">Optional</span>
                    <input
                      id="business-company"
                      name="company"
                      autoComplete="organization"
                      placeholder="Company name"
                    />
                  </label>
                </div>
                <label htmlFor="business-goal">
                  What do you want to do?
                  <span className="contact-select">
                    <select id="business-goal" name="goal" required defaultValue="">
                      <option value="" disabled>
                        Choose one...
                      </option>
                      <option>Sell custom products in my store</option>
                      <option>Integrate Creative Lab into my platform</option>
                      <option>Explore a manufacturing partnership</option>
                    </select>
                    <CaretUpDown size={18} aria-hidden="true" />
                  </span>
                </label>
                <label htmlFor="business-size">
                  Company size
                  <span className="contact-select">
                    <select id="business-size" name="size" required defaultValue="">
                      <option value="" disabled>
                        Choose one...
                      </option>
                      <option>Just me</option>
                      <option>2–10 people</option>
                      <option>11–50 people</option>
                      <option>51–200 people</option>
                      <option>201+ people</option>
                    </select>
                    <CaretUpDown size={18} aria-hidden="true" />
                  </span>
                </label>
                <label htmlFor="business-message">
                  Anything else? <span className="field-optional">Optional</span>
                  <textarea
                    id="business-message"
                    name="message"
                    rows="3"
                    placeholder="What are you hoping to build?"
                  />
                </label>
                <div className="contact-submit">
                  <SpecularButton type="submit">
                    Talk to our team <ArrowRight size={18} />
                  </SpecularButton>
                </div>
              </form>
              <p className="contact-reassurance">
                No spam — we’ll only reach out about integrating Creative Lab.
              </p>
              {inquiry && (
                <div className="contact-review" role="status">
                  <Check size={20} />
                  <div>
                    <strong>Your inquiry is ready to review</strong>
                    <p>Nothing has been sent. Continue on Meshy to contact the team.</p>
                    <p>
                      {inquiry.goal}
                      <br />
                      {inquiry.size}
                      <br />
                      {inquiry.email}
                      {inquiry.company && ` · ${inquiry.company}`}
                      {inquiry.message && (
                        <>
                          <br />
                          {inquiry.message}
                        </>
                      )}
                    </p>
                    <a href={official('/about#contact')} target="_blank" rel="noreferrer">
                      Contact Meshy <ArrowUpRight size={14} />
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        <Workflow onStartCreation={onStartCreation} precedingRef={businessStage} />
      </div>

      <Faq />

      <section className="lab-toolkit" id="toolkit" aria-labelledby="toolkit-title">
        <header className="support-heading">
          <h2 className="lab-section-title" id="toolkit-title">
            Explore Meshy's AI 3D Toolkit
            <i className="seed-rest" data-seed-anchor="toolkit" aria-hidden="true" />
          </h2>
        </header>
        <div className="toolkit-grid">
          {toolkit.map(([title, description, asset, path]) => (
            <a
              className="toolkit-link"
              key={path}
              href={official(path)}
              target="_blank"
              rel="noreferrer"
              aria-label={title}
              aria-describedby={`${asset}-description`}
            >
              <TiltedCard
                imageSrc={`/assets/${asset}.webp`}
                captionText={description}
                rotateAmplitude={10}
                scaleOnHover={1.05}
                overlayContent={
                  <div className="toolkit-card-title">
                    <h3>{title}</h3>
                    <ArrowUpRight size={23} aria-hidden="true" />
                  </div>
                }
              />
              <span className="sr-only" id={`${asset}-description`}>
                {description}
              </span>
            </a>
          ))}
        </div>
      </section>

      <CreationFinale onUpload={onUpload} onBrowseCreations={onBrowseCreations} />
      <footer className="lab-footer">
        <span>
          © 2026 Meshy <small>UI/UX concept</small>
        </span>
        <nav aria-label="Footer">
          <a href={official('/creative-lab')} target="_blank" rel="noreferrer">
            Original Creative Lab <ArrowUpRight size={12} />
          </a>
          <a href={official('/privacy-policy')} target="_blank" rel="noreferrer">
            Privacy
          </a>
          <a href={official('/terms-of-use')} target="_blank" rel="noreferrer">
            Terms
          </a>
        </nav>
      </footer>
    </div>
  );
}
