import { Experience } from '@/experience';
import { Mark } from '@/components/mark';
const docs = 'https://github.com/pmndrs/react-three-fiber/blob/v10/docs';
export default function Home() {
  return <>
    <a className="skip-link" href="#introduction">Skip to content</a>
    <Experience />
    <header className="site-header">
      <a className="wordmark" href="#top" aria-label="Poimandres home"><Mark /><span>Poimandres</span></a>
      <nav aria-label="Main navigation"><a href="#introduction">Discover v10</a><a href={`${docs}/migration/v10.mdx`} target="_blank" rel="noreferrer">Documentation <span aria-hidden="true">↗</span></a></nav>
      <span className="preview-tag"><i /> ALPHA PREVIEW</span>
    </header>
    <main>
      <section className="hero sculpture" id="top" data-pose="0" aria-labelledby="hero-title">
        <div className="hero-eyebrow">REACT THREE FIBER</div>
        <h1 id="hero-title"><span>Fiber</span><span>10<span className="title-dot">.</span></span></h1>
        <div className="hero-bottom"><p>A new shape<br />for React on the GPU.</p><a className="scroll-cue" href="#introduction">SCROLL TO EXPLORE <span>↓</span></a></div>
        <div className="hero-hint">Move your pointer. Leave a little disturbance.</div>
      </section>
      <section id="introduction" className="intro reading" data-pose="1">
        <div className="section-number">01 / A NEW CHAPTER</div>
        <h2>Same React.<br /><span>New possibilities.</span></h2>
        <div className="intro-columns"><p>Your components. Your imagination. Now with a closer connection to the GPU.</p><p>React Three Fiber v10 brings WebGPU, shader nodes, and a new frame scheduler into one familiar way of building. This page is a small experiment in what that makes possible.</p></div>
        <div className="feature-strip"><span>REACT 19</span><span>WEBGPU</span><span>THREE.JS SHADING LANGUAGE</span></div>
      </section>
      <section id="nodes" className="reading nodes-section">
        <div className="section-number">02 / COMPOSE THE LIGHT</div>
        <h2>A material is<br /><span>a conversation.</span></h2>
        <p className="measure">Color, light, motion. Small expressions connected into something larger. Three.js Shading Language lets you compose GPU programs in TypeScript; Fiber gives those nodes a home in React.</p>
        <div className="code-panel"><div className="code-title"><span><i /> appearance.tsx</span><span>TSL · MATERIAL</span></div><pre><code><span className="syntax-muted">{'// Small expressions. One living material.\n'}</span><span className="syntax-purple">const</span>{' { colorNode } = '}<span className="syntax-blue">useLocalNodes</span>{'(() => ({\n  colorNode: '}<span className="syntax-blue">mix</span>{'(silver, peach, '}<span className="syntax-blue">hash</span>{'(instanceIndex)),\n}));\n\n'}<span className="syntax-muted">{'// The same GPU buffer compute just updated.\n'}</span>{'<pointsNodeMaterial\n  positionNode={positions.toAttribute()}\n  colorNode={colorNode}\n/>'}</code></pre><div className="code-caption">Nodes compose the appearance. Storage buffers carry the motion.</div></div>
        <a className="text-link" href={`${docs}/webgpu/tsl-hooks.mdx`} target="_blank" rel="noreferrer">Explore the node hooks <span>↗</span></a>
      </section>
      <section id="compute" className="sculpture knot-section" data-pose="2" aria-labelledby="compute-title">
        <div className="sculpture-caption"><div className="section-number">03 / MORE THAN A FRAME</div><h2 id="compute-title">The GPU<br /><span>remembers.</span></h2></div>
        <div className="sculpture-foot"><span>FIG. 02 — CONTINUITY</span><p>Every particle has somewhere to be.<br />Every interaction leaves a memory.</p></div>
      </section>
      <section id="scheduler" className="reading scheduler-section" data-pose="3">
        <div className="section-number">04 / FIND YOUR RHYTHM</div>
        <h2>Everything,<br /><span>in its own time.</span></h2>
        <p className="measure">The pointer changes a few numbers. A compute pass moves thousands of particles. The material draws the result. Fiber’s scheduler keeps those steps in order, without asking React to render every frame.</p>
        <div className="pipeline"><div><span>01</span><h3>Input</h3><p>Scroll & pointer</p><code>{"phase: 'input'"}</code></div><b>→</b><div><span>02</span><h3>Compute</h3><p>Displace & recover</p><code>{"phase: 'update'"}</code></div><b>→</b><div><span>03</span><h3>Render</h3><p>Read & illuminate</p><code>GPU → canvas</code></div></div>
        <details><summary>Inside the motion <span>+</span></summary><p>Each particle follows an ideal position defined by scroll and time. Compute stores a separate displacement and velocity. Move the pointer away and that disturbance settles to zero, returning each particle to where it belongs—even as the shape keeps moving.</p><pre><code>{'visible = ideal + displacement\n\nvelocity += (pointerForce\n  - stiffness * displacement\n  - damping * velocity) * dt\n\ndisplacement += velocity * dt'}</code></pre></details>
      </section>
      <section className="sculpture finale" id="next" data-pose="4" aria-labelledby="finale-title">
        <div className="finale-heading"><div className="section-number">05 / YOUR NEXT EXPERIMENT</div><h2 id="finale-title">What shape<br />comes next?</h2></div>
        <div className="finale-links"><a href={`${docs}/migration/v10.mdx`} target="_blank" rel="noreferrer">Meet Fiber v10 <span>↗</span></a><a href="https://github.com/pmndrs/react-three-fiber" target="_blank" rel="noreferrer">Explore the source <span>↗</span></a></div>
      </section>
    </main>
    <footer><a className="wordmark" href="#top"><Mark /><span>Made of possibilities.</span></a><span>A particle study in Fiber v10 · WebGPU · TSL</span><a href="#top">BACK TO TOP ↑</a></footer>
  </>;
}
