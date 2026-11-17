import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

if (typeof window !== 'undefined') {
  document.addEventListener('focusin', (e) => {
    const target = e.target as HTMLElement | null;
    if (!target) return;
    const tag = target.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') {
      const inputType = (target as HTMLInputElement).type;
      if (inputType === 'checkbox' || inputType === 'radio' || inputType === 'file') return;
      target.style.fontSize = '16px';
      setTimeout(() => {
        try {
          target.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
        } catch {
          // ignore
        }
      }, 260);
    }
  });
}

createRoot(document.getElementById('root')!).render(<App />);
