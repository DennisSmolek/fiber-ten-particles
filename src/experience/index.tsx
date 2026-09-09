'use client';
import dynamic from 'next/dynamic';
import { useCallback, useEffect, useState, Component, type ReactNode } from 'react';
import { Mark } from '@/components/mark';
const Field = dynamic(() => import('./particle-field').then(m => m.ParticleField), { ssr: false });
class SceneBoundary extends Component<{ children: ReactNode; onError: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onError(); }
  render() { return this.state.failed ? null : this.props.children; }
}
export function Experience() {
  const [support, setSupport] = useState<'checking' | 'yes' | 'no'>('checking');
  const [ready, setReady] = useState(false);
  const [paused, setPaused] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [count, setCount] = useState(24576);
  const onReady = useCallback(() => setReady(true), []);
  const onError = useCallback(() => { setSupport('no'); setReady(false); }, []);
  useEffect(() => {
    let active = true;
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    const detect = async () => {
      if (motion.matches || new URLSearchParams(location.search).has('no3d')) { setSupport('no'); return; }
      try {
        const gpu = (navigator as Navigator & { gpu?: { requestAdapter: () => Promise<unknown> } }).gpu;
        const adapter = await gpu?.requestAdapter();
        if (active) { setCount(innerWidth < 600 ? 6144 : innerWidth < 1100 ? 12288 : 24576); setSupport(adapter ? 'yes' : 'no'); }
      } catch { if (active) setSupport('no'); }
    };
    const visibility = () => setHidden(document.hidden);
    void detect();
    motion.addEventListener('change', detect);
    document.addEventListener('visibilitychange', visibility);
    return () => { active = false; motion.removeEventListener('change', detect); document.removeEventListener('visibilitychange', visibility); };
  }, []);
  return <>
    <div className={`experience ${ready && support === 'yes' ? 'live' : ''} ${support === 'no' ? 'fallback' : ''}`} aria-hidden="true">
      <Mark className="static-mark" />
      {support === 'yes' && <SceneBoundary onError={onError}><div className={`canvas-wrap ${ready ? 'ready' : ''}`}><Field count={count} paused={paused || hidden} onReady={onReady} onError={onError} /></div></SceneBoundary>}
    </div>
    <div className="controls"><span className="engine-status" role="status">{support === 'no' ? 'STILL EDITION' : ready ? `${(count / 1024).toFixed(0)}K PARTICLES · WEBGPU` : 'PREPARING THE FIELD'}</span>{support === 'yes' && <button className="motion-toggle" onClick={() => setPaused(p => !p)} aria-label={paused ? 'Resume animation' : 'Pause animation'} title={paused ? 'Resume animation' : 'Pause animation'}>{paused ? '▷' : 'Ⅱ'}</button>}</div>
  </>;
}
