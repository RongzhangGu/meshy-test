import { useEffect, useRef, useState } from 'react';
import { MagnifyingGlass, X } from '@phosphor-icons/react';
import { products } from '../data/products.js';
import { matchingCreations } from '../data/discovery-data.js';
import ProductCutout from './ProductCutout.jsx';

export default function PhotoChoice({ photo, onChoose, onClose }) {
  const dialog = useRef(null),
    heading = useRef(null),
    search = useRef(null),
    options = useRef(null);
  const [query, setQuery] = useState('');
  const matches = matchingCreations(query);
  const visibleProducts = products.filter((product) => matches.includes(product.id));
  function updateQuery(value) {
    setQuery(value);
    if (options.current) options.current.scrollTop = 0;
  }
  function clearSearch() {
    updateQuery('');
    search.current?.focus();
  }
  useEffect(() => {
    setQuery('');
    if (photo) {
      dialog.current.showModal();
      heading.current?.focus();
    } else dialog.current.close();
  }, [photo]);
  return (
    <dialog
      ref={dialog}
      className="photo-choice-dialog"
      aria-labelledby="photo-choice-title"
      onCancel={onClose}
      onClick={(event) => {
        if (event.target === dialog.current) onClose();
      }}
    >
      {photo && (
        <>
          <header>
            <div>
              <h2 id="photo-choice-title" tabIndex={-1} ref={heading}>
                What Will You Make?
              </h2>
              <p role="status">
                {query.trim()
                  ? `${visibleProducts.length} matching creation${visibleProducts.length === 1 ? '' : 's'}.`
                  : `Explore all ${products.length} creations.`}
              </p>
            </div>
            <form
              className="photo-choice-search"
              role="search"
              aria-label="Search creation types"
              onSubmit={(event) => event.preventDefault()}
            >
              <MagnifyingGlass size={20} aria-hidden="true" />
              <input
                ref={search}
                type="search"
                aria-label="Search creations"
                aria-controls="photo-choice-options"
                placeholder="Search creations"
                value={query}
                onChange={(event) => updateQuery(event.target.value)}
              />
              {query && (
                <button type="button" aria-label="Clear creation search" onClick={clearSearch}>
                  <X size={17} />
                </button>
              )}
            </form>
            <button
              className="photo-choice-close"
              aria-label="Cancel photo selection"
              onClick={onClose}
            >
              <X size={20} />
            </button>
          </header>
          <div className="photo-choice-body">
            <figure>
              <img src={photo.url} alt="Your uploaded photo" />
              <figcaption title={photo.filename}>{photo.filename}</figcaption>
            </figure>
            <div
              ref={options}
              id="photo-choice-options"
              className="photo-choice-options"
              role="group"
              aria-label="Creation types"
            >
              {visibleProducts.map((product) => (
                <button key={product.id} onClick={() => onChoose(product.id)}>
                  <span className="photo-choice-art">
                    <ProductCutout product={product} />
                  </span>
                  <span className="photo-choice-name">{product.title}</span>
                  {product.inputKind && (
                    <small>
                      {product.inputKind === 'map' ? 'Start with a map' : 'Display your 3D models'}
                    </small>
                  )}
                </button>
              ))}
              {!visibleProducts.length && (
                <div className="photo-choice-empty">
                  <p>No matching creations</p>
                  <button type="button" onClick={clearSearch}>
                    Clear search
                  </button>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </dialog>
  );
}
