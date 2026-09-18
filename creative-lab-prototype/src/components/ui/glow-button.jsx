import React, {forwardRef, useEffect, useRef, useState} from 'react';
import {Sparkle} from '@phosphor-icons/react';
import './glow-button.css';

// Adapted from the supplied Glow Button for this project's React/CSS stack.
export const GlowButton = forwardRef(function GlowButton({
  label='Generate', children, onClick, className='', disabled=false,
  as:Element='button', type='button', ...props
}, ref) {
  const [isClicked,setIsClicked]=useState(false);
  const clickTimer=useRef(null);
  useEffect(()=>()=>clearTimeout(clickTimer.current),[]);

  function handleClick(event) {
    if(disabled)return;
    clearTimeout(clickTimer.current);
    setIsClicked(true);
    clickTimer.current=setTimeout(()=>setIsClicked(false),200);
    onClick?.(event);
  }

  return <Element {...props} ref={ref} type={Element==='button'?type:undefined}
    disabled={Element==='button'?disabled:undefined}
    className={`glow-btn ${className}`} onClick={handleClick}
    data-state={isClicked?'clicked':undefined}>
    <span className="glow-btn__label">{children??<>{label}<Sparkle size={16} aria-hidden="true"/></>}</span>
  </Element>;
});
