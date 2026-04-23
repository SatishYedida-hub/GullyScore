// Tiny theme toggle. Drives a body class (`meme-mode`) so the whole app can
// be restyled in CSS without prop drilling, and persists the choice in
// localStorage so the theme survives reloads.
//
// Usage:
//   const [meme, setMeme] = useMemeMode();
//   <button onClick={() => setMeme(!meme)}>Meme mode</button>
//
// Consumers that need the state can import `useMemeMode`; static helpers
// (reading the current flag outside React) can use `isMemeModeOn()`.

import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'gullyscore.memeMode';
const BODY_CLASS = 'meme-mode';

const readStored = () => {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === '1';
  } catch (_) {
    return false;
  }
};

const writeStored = (on) => {
  try {
    window.localStorage.setItem(STORAGE_KEY, on ? '1' : '0');
  } catch (_) {
    /* ignore */
  }
};

const applyBodyClass = (on) => {
  if (typeof document === 'undefined') return;
  document.body.classList.toggle(BODY_CLASS, on);
};

export const isMemeModeOn = () => readStored();

export const useMemeMode = () => {
  const [on, setOn] = useState(readStored);

  useEffect(() => {
    applyBodyClass(on);
    writeStored(on);
  }, [on]);

  // Keep tabs in sync if the user toggles in another window.
  useEffect(() => {
    const handler = (e) => {
      if (e.key === STORAGE_KEY) setOn(e.newValue === '1');
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  const toggle = useCallback(() => setOn((v) => !v), []);

  return [on, setOn, toggle];
};
