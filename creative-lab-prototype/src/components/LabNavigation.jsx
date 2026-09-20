import { useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  ArrowUpRight,
  Bell,
  CaretDown,
  ChatCircleDots,
  Coins,
  Crown,
  Gift,
  Images,
  List,
  MagnifyingGlass,
  Moon,
  Package,
  Question,
  Sun,
  UploadSimple,
  X,
} from '@phosphor-icons/react';
import { products } from '../data/products.js';
import { matchingCreations } from '../data/discovery-data.js';
import SpecularButton from './SpecularButton.jsx';

const suggestions = ['keychain', 'chibi', 'lamp', 'keycap', 'plantpot', 'terrain'];

export function LabCreationTools({
  query,
  onQuery,
  onBrowse,
  onBrowseAll,
  onCreate,
  onUpload,
  busy,
  error,
}) {
  const [open, setOpen] = useState(false);
  const search = useRef(null),
    results = useRef(null);
  const ids = query.trim() ? matchingCreations(query) : suggestions;
  function choose(id) {
    setOpen(false);
    onCreate(id);
  }
  function keys(event) {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      search.current?.focus({ preventScroll: true });
      setOpen(false);
    }
    if (event.key === 'ArrowDown' && event.target === search.current) {
      event.preventDefault();
      setOpen(true);
      requestAnimationFrame(() => results.current?.querySelector('button')?.focus());
    }
  }
  return (
    <div className="lab-creation-tools">
      <div
        className="nav-search"
        onKeyDown={keys}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
        }}
      >
        <form
          role="search"
          onSubmit={(event) => {
            event.preventDefault();
            setOpen(false);
            onBrowse();
          }}
        >
          <MagnifyingGlass size={18} />
          <input
            ref={search}
            type="search"
            aria-label="Search creations"
            aria-controls={open ? 'creation-suggestions' : undefined}
            placeholder="Search creations"
            value={query}
            onFocus={() => setOpen(true)}
            onClick={() => setOpen(true)}
            onChange={(event) => {
              setOpen(true);
              onQuery(event.target.value);
            }}
          />
          {query && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => {
                onQuery('');
                search.current?.focus({ preventScroll: true });
              }}
            >
              <X size={16} />
            </button>
          )}
        </form>
        {open && (
          <div className="nav-search-panel" id="creation-suggestions" ref={results}>
            <div className="nav-search-heading">
              {query.trim() ? 'Matching Creations' : 'Suggested Creations'}
            </div>
            <div className="nav-search-results">
              {ids.map((id) => {
                const product = products.find((p) => p.id === id);
                return (
                  <button key={id} onClick={() => choose(id)}>
                    <img src={`/assets/${product.image}.webp`} alt="" />
                    <span>{product.title}</span>
                    <ArrowUpRight size={16} />
                  </button>
                );
              })}
              {!ids.length && <p role="status">No matches. Try lamp, pet or desk.</p>}
            </div>
            <button
              className="nav-browse-all"
              onClick={() => {
                setOpen(false);
                onQuery('');
                onBrowseAll();
              }}
            >
              Browse all {products.length} creations <ArrowRight size={16} />
            </button>
          </div>
        )}
      </div>
      <SpecularButton
        size={null}
        className="nav-upload"
        disabled={busy}
        onClick={() => {
          setOpen(false);
          onUpload();
        }}
      >
        <UploadSimple size={17} />
        <span>{busy ? 'Reading photo…' : 'Upload photo'}</span>
      </SpecularButton>
      {error && (
        <p className="nav-upload-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

const external = { target: '_blank', rel: 'noreferrer' };

export default function LabNavigation({ onBrowse, theme, onTheme, onSaved, savedCount, onOrders }) {
  const header = useRef(null);
  useEffect(() => {
    const nav = header.current,
      workflow = document.getElementById('how-it-works');
    if (!workflow) return;
    let observer;
    // Sample a one-pixel band at the workflow's dock, including its 12px inset.
    const observe = () => {
      observer?.disconnect();
      const edge = nav.getBoundingClientRect().bottom + 12;
      observer = new IntersectionObserver(
        ([entry]) => {
          nav.style.setProperty(
            '--nav-background',
            entry.isIntersecting
              ? getComputedStyle(workflow).getPropertyValue('--workflow-bg')
              : 'var(--bg)',
          );
        },
        { rootMargin: `-${edge}px 0px -${Math.max(0, innerHeight - edge - 1)}px 0px` },
      );
      observer.observe(workflow);
    };
    observe();
    window.addEventListener('resize', observe);
    return () => {
      observer?.disconnect();
      window.removeEventListener('resize', observe);
      nav.style.removeProperty('--nav-background');
    };
  }, [theme]);
  useEffect(() => {
    const dismiss = (event) => {
      if (!header.current?.contains(event.target))
        header.current?.querySelectorAll('details[open]').forEach((menu) => (menu.open = false));
    };
    document.addEventListener('pointerdown', dismiss);
    return () => document.removeEventListener('pointerdown', dismiss);
  }, []);
  function closeMenus() {
    header.current?.querySelectorAll('details[open]').forEach((menu) => (menu.open = false));
  }
  function escape(event) {
    if (event.key !== 'Escape') return;
    const menu = event.target.closest('details[open]');
    if (menu) {
      event.preventDefault();
      menu.open = false;
      menu.querySelector('summary')?.focus();
    }
  }
  return (
    <header
      ref={header}
      className="site-header meshy-header"
      onKeyDown={escape}
      onBlur={(event) => {
        if (event.relatedTarget && !event.currentTarget.contains(event.relatedTarget)) closeMenus();
      }}
      onClick={(event) => {
        if (event.target.closest('a,button')) closeMenus();
      }}
    >
      <a className="brand" href="https://www.meshy.ai/discover" aria-label="Meshy" {...external}>
        <img
          src={theme === 'light' ? '/assets/meshy-logo-light.svg' : '/assets/meshy-logo.svg'}
          alt="Meshy"
          width="104"
          height="40"
        />
      </a>
      <nav className="meshy-primary-nav" aria-label="Main navigation">
        <a href="https://www.meshy.ai/discover" {...external}>
          Community
        </a>
        <details className="meshy-menu" name="meshy-navigation">
          <summary>
            API <CaretDown size={10} weight="fill" />
          </summary>
          <div className="meshy-menu-panel">
            <a href="https://www.meshy.ai/api" {...external}>
              API overview <ArrowUpRight size={14} />
            </a>
            <a href="https://docs.meshy.ai/" {...external}>
              Documentation <ArrowUpRight size={14} />
            </a>
          </div>
        </details>
        <details className="meshy-menu" name="meshy-navigation">
          <summary>
            Resources <CaretDown size={10} weight="fill" />
          </summary>
          <div className="meshy-menu-panel">
            <a href="https://www.meshy.ai/tutorials" {...external}>
              Tutorials <ArrowUpRight size={14} />
            </a>
            <a href="https://www.meshy.ai/blog" {...external}>
              Blog <ArrowUpRight size={14} />
            </a>
            <a href="https://help.meshy.ai/en/" {...external}>
              Help center <ArrowUpRight size={14} />
            </a>
          </div>
        </details>
        <details className="meshy-menu meshy-current" name="meshy-navigation">
          <summary aria-current="page">
            Creative Lab <CaretDown size={10} weight="fill" />
          </summary>
          <div className="meshy-menu-panel">
            <button onClick={onBrowse}>
              Browse Creations <ArrowRight size={14} />
            </button>
            <button onClick={onSaved}>
              My Creations{' '}
              {savedCount > 0 && <span className="meshy-menu-count">{savedCount}</span>}
            </button>
          </div>
        </details>
        <a href="https://www.meshy.ai/shop" {...external}>
          Shop <span className="meshy-new">NEW</span>
        </a>
      </nav>
      <details className="meshy-menu meshy-mobile-nav" name="meshy-navigation">
        <summary aria-label="Main menu">
          <List size={22} />
        </summary>
        <div className="meshy-menu-panel">
          <a href="https://www.meshy.ai/discover" {...external}>
            Community
          </a>
          <a href="https://www.meshy.ai/api" {...external}>
            API
          </a>
          <a href="https://www.meshy.ai/tutorials" {...external}>
            Resources
          </a>
          <button onClick={onBrowse}>Creative Lab</button>
          <a href="https://www.meshy.ai/shop" {...external}>
            Shop <span className="meshy-new">NEW</span>
          </a>
        </div>
      </details>
      <div className="header-actions meshy-account-actions">
        <a className="meshy-agent" href="https://www.meshy.ai/features/3d-agent" {...external}>
          <ChatCircleDots size={25} weight="fill" />
          <span>Agent</span>
        </a>
        <div className="meshy-workspace">
          <a href="https://www.meshy.ai/workspace" {...external}>
            Workspace
          </a>
          <details className="meshy-menu" name="meshy-navigation">
            <summary aria-label="Workspace options">
              <CaretDown size={13} weight="fill" />
            </summary>
            <div className="meshy-menu-panel meshy-menu-right">
              <a href="https://www.meshy.ai/workspace" {...external}>
                Meshy workspace <ArrowUpRight size={14} />
              </a>
              <button onClick={onBrowse}>Creative Lab</button>
              <button onClick={onSaved}>My Creations</button>
            </div>
          </details>
        </div>
        {/* Account figures mirror the supplied reference for this visual prototype. */}
        <div className="meshy-billing">
          <span className="meshy-credits" title="Reference balance: 294 credits">
            <Coins size={16} weight="fill" />
            294
          </span>
          <a className="meshy-upgrade" href="https://www.meshy.ai/pricing" {...external}>
            <Crown size={14} weight="fill" />
            Upgrade
          </a>
        </div>
        <a
          className="meshy-icon meshy-rewards"
          href="https://www.meshy.ai/earn"
          aria-label="Rewards"
          {...external}
        >
          <Gift size={20} />
          <i aria-hidden="true" />
        </a>
        <a
          className="meshy-icon meshy-help"
          href="https://help.meshy.ai/en/"
          aria-label="Help center"
          {...external}
        >
          <Question size={20} />
        </a>
        <details className="meshy-menu meshy-notifications" name="meshy-navigation">
          <summary className="meshy-icon" aria-label="Notifications">
            <Bell size={20} />
            <span className="meshy-notification-count" title="Reference notification count">
              215
            </span>
          </summary>
          <div className="meshy-menu-panel meshy-menu-right">
            <strong>Notifications</strong>
            <a href="https://www.meshy.ai/workspace" {...external}>
              View in Meshy <ArrowUpRight size={14} />
            </a>
          </div>
        </details>
        <button
          type="button"
          className="meshy-icon meshy-theme"
          onClick={onTheme}
          aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
          title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
        >
          {theme === 'light' ? (
            <Moon size={20} aria-hidden="true" />
          ) : (
            <Sun size={20} aria-hidden="true" />
          )}
        </button>
        <details className="meshy-menu meshy-profile" name="meshy-navigation">
          <summary aria-label="Account menu">
            <img src="/assets/chibi-hover.webp" alt="" width="32" height="32" />
          </summary>
          <div className="meshy-menu-panel meshy-menu-right">
            <button onClick={onOrders} aria-haspopup="dialog" aria-controls="orders-panel">
              <Package size={17} />
              Orders
            </button>
            <button id="saved-toggle" aria-controls="my-creations-panel" onClick={onSaved}>
              <Images size={17} />
              My Creations{' '}
              {savedCount > 0 && <span className="meshy-menu-count">{savedCount}</span>}
            </button>
            <a href="https://www.meshy.ai/workspace" {...external}>
              Meshy workspace <ArrowUpRight size={14} />
            </a>
            <a href="https://www.meshy.ai/pricing" {...external}>
              Plans & credits <ArrowUpRight size={14} />
            </a>
          </div>
        </details>
      </div>
    </header>
  );
}
