'use client';
import { useCallback, useEffect, useLayoutEffect, useRef } from 'react';
import { AdditiveBlending, Color, OrthographicCamera, Sprite, Vector3, type Node, type WebGPURenderer } from 'three/webgpu';
import { abs, cos, exp, float, Fn, fwidth, hash, instancedArray, instanceIndex, length, Loop, max, mix, pow, sin, smoothstep, uniform, uv, vec2, vec3, vec4 } from 'three/tsl';
import { Canvas, useBuffers, useFrame, useLocalNodes, useNodes, useThree, useUniforms } from '@react-three/fiber/webgpu';
import { createShapeData } from './shape-data';
import { storyProgress } from './choreography';
import { edgeScrollTravel } from './margin-motion';

type Props = { count: number; paused: boolean; onReady: () => void; onError: () => void };
function Particles({ count, paused, onReady, onError }: Props) {
  const camera = useThree(s => s.camera);
  const size = useThree(s => s.size);
  const input = useRef({ x: 0, y: 0, vx: 0, vy: 0, active: 0, last: 0, anchors: [0, 1000, 2000, 3000, 3500, 4000, 5000, 5500], clear: 4 });
  const diagnostics = useRef({ enabled: false, forceZeroSteps: false, pending: false, previous: null as Float32Array | null, samples: 0, zeroStepSamples: 0, maxJump: 0, nonFinite: 0, worst: {} as Record<string, unknown> });
  const simulation = useRef({ time: 0, accumulator: 0, ready: false, frames: 0 });
  const { logo, knot, sphere, positions, displacement, velocity } = useBuffers(() => {
    const shapes = createShapeData(count);
    return {
      logo: instancedArray(shapes.logo, 'vec3'), knot: instancedArray(shapes.knot, 'vec3'), sphere: instancedArray(shapes.sphere, 'vec3'),
      positions: instancedArray(count, 'vec4'), displacement: instancedArray(count, 'vec3'), velocity: instancedArray(count, 'vec3'),
    };
  }, 'particles');
  const { pointer, pointerVelocity, active, progress, clock, steps, scale, aspect, clear, mobile, edgeTravel } = useNodes(() => ({
    pointer: uniform(new Vector3()), pointerVelocity: uniform(new Vector3()), active: uniform(0), progress: uniform(0),
    clock: uniform(0), steps: uniform(0), scale: uniform(1), aspect: uniform(1), clear: uniform(4), mobile: uniform(0), edgeTravel: uniform(0),
  }), 'motion');
  const { silver, peach, blue, lavender, strength } = useUniforms({ silver: new Color('#e8edf2'), peach: new Color('#e5ac81'), blue: new Color('#82b9e3'), lavender: new Color('#b2a0d5'), strength: 1 }, 'appearance');

  useLayoutEffect(() => {
    if (camera instanceof OrthographicCamera) { camera.zoom = size.height / 10; camera.updateProjectionMatrix(); }
    aspect.value = size.width / size.height;
    scale.value = Math.min(1, size.width / size.height * 1.35);
    mobile.value = size.width < 700 ? 1 : 0;
  }, [camera, size, aspect, scale, mobile]);

  useEffect(() => {
    diagnostics.current.enabled = new URLSearchParams(location.search).has('diagnostics');
    diagnostics.current.forceZeroSteps = new URLSearchParams(location.search).get('diagnostics') === 'zero-step';
    const measure = () => {
      const regions = [...document.querySelectorAll<HTMLElement>('[data-pose]')].map(el => ({ top: el.getBoundingClientRect().top + scrollY, height: el.offsetHeight }));
      if (regions.length === 5) {
        const [hero, intro, knot, schedule, finale] = regions;
        input.current.anchors = [hero.top + hero.height * .5, intro.top + innerHeight * .35, knot.top - innerHeight * .05, knot.top + knot.height * .45, knot.top + knot.height * .55, schedule.top + innerHeight * .35, finale.top + innerHeight * .05, finale.top + finale.height * .52];
      }
      const reading = document.querySelector('.reading')?.getBoundingClientRect();
      input.current.clear = reading ? reading.width / innerHeight * 5 + .35 : 4;
    };
    const pointerMove = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return;
      const data = input.current;
      const now = performance.now();
      const x = (e.clientX / innerWidth - .5) * 10 * innerWidth / innerHeight;
      const y = (.5 - e.clientY / innerHeight) * 10;
      const dt = Math.max(.016, (now - data.last) / 1000);
      data.vx = Math.max(-10, Math.min(10, (x - data.x) / dt));
      data.vy = Math.max(-10, Math.min(10, (y - data.y) / dt));
      data.x = x; data.y = y; data.last = now;
      data.active = e.target instanceof Element && e.target.closest('a,button,summary,pre') ? 0 : 1;
    };
    const leave = () => { input.current.active = 0; };
    const resume = () => { simulation.current.accumulator = 0; leave(); };
    const observer = new ResizeObserver(measure);
    observer.observe(document.body);
    measure();
    let alive = true;
    void document.fonts.ready.then(() => { if (alive) measure(); });
    window.addEventListener('resize', measure);
    window.addEventListener('pointermove', pointerMove, { passive: true });
    document.addEventListener('pointerleave', leave);
    window.addEventListener('blur', leave);
    document.addEventListener('visibilitychange', resume);
    return () => {
      alive = false; observer.disconnect(); window.removeEventListener('resize', measure); window.removeEventListener('pointermove', pointerMove);
      document.removeEventListener('pointerleave', leave); window.removeEventListener('blur', leave); document.removeEventListener('visibilitychange', resume);
    };
  }, []);

  const build = useCallback(() => {
    const seed = hash(instanceIndex.add(17));
    const seed2 = hash(instanceIndex.add(731));
    const seed3 = hash(instanceIndex.add(2713));
    const delay = seed.mul(.17);
    const p = progress;
    const a = smoothstep(delay.add(.12), delay.add(.79), p);
    const b = smoothstep(delay.add(1.1), delay.add(1.8), p);
    const c = smoothstep(delay.add(2.12), delay.add(2.79), p);
    const d = smoothstep(delay.add(3.12), delay.add(3.79), p);
    const spin = clock.mul(.085);
    const turn = (v: Node<'vec3'>, angle: Node<'float'>) => vec3(v.x.mul(cos(angle)).add(v.z.mul(sin(angle))), v.y, v.z.mul(cos(angle)).sub(v.x.mul(sin(angle))));
    const lp = logo.element(instanceIndex);
    const kp = knot.element(instanceIndex);
    const sp = sphere.element(instanceIndex);
    const stream = vec3(sin(clock.mul(.3).add(lp.y.mul(2)).add(seed2.mul(6))).mul(.065), cos(clock.mul(.27).add(lp.x.mul(2)).add(seed3.mul(6))).mul(.065), sin(clock.mul(.4).add(seed2.mul(12))).mul(.13));
    const logoTarget = turn(vec3(lp).add(stream), sin(clock.mul(.22)).mul(.12)).mul(scale).add(vec3(0, float(.45).sub(mobile.mul(1.15)), 0));
    const knotTarget = turn(vec3(kp), spin).mul(scale.mul(1.2)).add(vec3(mobile.oneMinus().mul(1.2), -.2, 0));
    const sphereTarget = turn(vec3(sp), spin.mul(.6)).mul(scale).add(vec3(0, -1.4, 0));
    // Keep each particle on the side nearest its logo sample instead of crossing the whole field.
    const side = lp.x.greaterThan(0).select(1, -1);
    const depth = seed3;
    const phase = seed2.mul(Math.PI * 2).add(clock.mul(seed.mul(.14).add(.16)));
    const halfWidth = aspect.mul(5);
    // A broad field, including dim particles behind the text, with density biased toward the edges.
    const edgeBias = pow(seed3, .48);
    const centerX = mix(halfWidth.mul(.16), halfWidth.mul(.97), edgeBias).mul(side);
    const parallax = seed.lessThan(.1).select(.018, depth.mul(.48).add(.1));
    const centerY = seed2.sub(.5).mul(10.8).add(edgeTravel.mul(parallax)).add(8).mod(16).sub(8);
    const orbitRadius = depth.mul(.19).add(.07);
    const orbit = vec3(cos(phase).mul(orbitRadius), sin(phase).mul(orbitRadius.mul(.75)), sin(phase).mul(.15));
    const margin = vec3(centerX, centerY, depth.sub(.5).mul(4)).add(orbit);
    const target = mix(mix(mix(mix(logoTarget, margin, a), knotTarget, b), margin, c), sphereTarget, d);
    const breath = vec3(sin(clock.mul(.5).add(seed2.mul(40))), cos(clock.mul(.4).add(seed3.mul(40))), sin(clock.mul(.3).add(seed.mul(30)))).mul(.025);
    const ideal = target.add(breath);
    const ambient = vec3(seed.sub(.5).mul(aspect.mul(13)), seed2.sub(.5).mul(11), seed3.mul(5).sub(3)).add(orbit.mul(.3));
    const isAmbient = hash(instanceIndex.add(911)).greaterThan(.91);
    const finalIdeal = isAmbient.select(ambient, ideal);
    const update = Fn(() => {
      // Build the whole ideal-position graph outside the substep loop. A zero-step
      // frame must not reuse TSL temporaries whose first assignment was inside that loop.
      const idealPosition = finalIdeal.toVar('particleIdeal');
      const offset = displacement.element(instanceIndex);
      const speed = velocity.element(instanceIndex);
      Loop({ start: 0, end: steps, type: 'int', condition: '<' }, () => {
        const position = idealPosition.add(offset);
        const diff = position.xy.sub(pointer.xy);
        const distance = length(diff);
        const radius = mobile.greaterThan(.5).select(.8, 1.05);
        const falloff = smoothstep(0, radius, distance).oneMinus().mul(active).mul(strength);
        const force = vec3(diff.div(max(distance, .08)), .18).mul(falloff.mul(45)).add(pointerVelocity.mul(falloff.mul(.6)));
        speed.addAssign(force.sub(offset.mul(55)).sub(speed.mul(15)).mul(1 / 120));
        offset.addAssign(speed.mul(1 / 120));
      });
      positions.element(instanceIndex).assign(vec4(idealPosition.add(offset), 1));
    })().compute(count);
    const coords = uv().sub(.5).mul(2);
    const radius2 = coords.dot(coords);
    // Approximate pixel integration of the Gaussian: preserve energy as the footprint crosses pixels.
    // The old tiny exponential core and subpixel crosses aliased severely during surface rotation.
    const pixelWidth = fwidth(coords);
    const variance = pixelWidth.dot(pixelWidth).div(24).add(.12);
    const core = exp(radius2.div(variance.mul(-2))).mul(float(.12).div(variance));
    const halo = exp(radius2.mul(-2.2)).mul(.065);
    const bright = pow(seed2, 12);
    const reading = a.mul(b.oneMinus()).add(c.mul(d.oneMinus()));
    // Explicit xyz keeps the shader's attribute interpretation independent of storage padding.
    const finalPosition = positions.toAttribute().xyz;
    const edgeWeight = smoothstep(clear.mul(.18), clear.mul(.95), abs(finalPosition.x));
    const marginOpacity = mix(float(.14), float(.62), edgeWeight);
    const opacity = core.add(halo).mul(smoothstep(.55, 1, length(coords)).oneMinus())
      .mul(mix(float(1), marginOpacity, reading)).mul(isAmbient.select(.06, .4));
    const paletteSeed = hash(instanceIndex.add(419));
    const tint = paletteSeed.lessThan(.66).select(silver,
      paletteSeed.lessThan(.8).select(blue, paletteSeed.lessThan(.92).select(peach, lavender)));
    return {
      update, positionNode: finalPosition,
      colorNode: tint.mul(bright.mul(.7).add(.72)),
      opacityNode: opacity,
      sizeNode: vec2(seed.mul(.9).add(3.6).add(bright.mul(7))).mul(isAmbient.select(.8, 1)),
    };
  }, [logo, knot, sphere, positions, displacement, velocity, progress, clock, steps, scale, aspect, clear, mobile, pointer, active, pointerVelocity, count, silver, peach, blue, lavender, strength, edgeTravel]);
  const nodes = useLocalNodes(build);

  useFrame(({ delta }) => {
    if (paused) { simulation.current.accumulator = 0; return; }
    const data = input.current;
    const dt = Math.min(delta, 1 / 30);
    simulation.current.time += dt;
    clock.value = simulation.current.time;
    progress.value = storyProgress(scrollY + innerHeight / 2, data.anchors, [0, 1, 1, 2, 2, 3, 3, 4]);
    edgeTravel.value = edgeScrollTravel(scrollY + innerHeight / 2, data.anchors, progress.value, innerHeight);
    clear.value = data.clear;
    pointer.value.set(data.x, data.y, 0);
    const damping = Math.exp(-dt * 10);
    pointerVelocity.value.set(data.vx, data.vy, 0);
    data.vx *= damping; data.vy *= damping;
    active.value += (data.active - active.value) * (1 - Math.exp(-dt * 12));
    simulation.current.accumulator = Math.min(simulation.current.accumulator + dt, 4 / 120);
    steps.value = Math.floor(simulation.current.accumulator * 120);
    simulation.current.accumulator -= steps.value / 120;
    // Opt-in GPU regression probe: exercise the zero-substep path even on slow displays.
    if (diagnostics.current.forceZeroSteps) steps.value = simulation.current.frames % 2 === 0 ? 0 : 2;
  }, { phase: 'input' });
  useFrame(({ renderer }) => {
    if (paused) return;
    try {
      renderer.compute(nodes.update);
      simulation.current.frames++;
      if (!simulation.current.ready && simulation.current.frames > 2) { simulation.current.ready = true; onReady(); }
    } catch (error) { console.error('Particle compute failed', error); onError(); }
  }, { phase: 'update' });

  useFrame(({ renderer }) => {
    const report = diagnostics.current;
    if (simulation.current.frames < 30 || !report.enabled || report.pending || report.samples >= 32 || paused) return;
    report.pending = true;
    const sampledSteps = steps.value;
    void renderer.getArrayBufferAsync(positions.value).then(buffer => {
      const current = new Float32Array(buffer);
      const stride = current.length / count;
      for (let i = 0; i < current.length; i += stride) {
        if (!Number.isFinite(current[i] + current[i + 1] + current[i + 2])) report.nonFinite++;
        if (report.previous) {
          const jump = Math.hypot(current[i] - report.previous[i], current[i + 1] - report.previous[i + 1], current[i + 2] - report.previous[i + 2]);
          if (jump > report.maxJump) {
            report.maxJump = jump;
            report.worst = { particle: i / stride, before: Array.from(report.previous.slice(i, i + 4)), after: Array.from(current.slice(i, i + 4)), frame: simulation.current.frames, progress: progress.value, samples: report.samples, steps: steps.value };
          }
        }
      }
      report.previous = current;
      report.samples++;
      if (sampledSteps === 0) report.zeroStepSamples++;
      if (report.samples === 32) console.info('Particle position diagnostic', JSON.stringify({ samples: report.samples, zeroStepSamples: report.zeroStepSamples, maxJump: report.maxJump, nonFinite: report.nonFinite, stride, worst: report.worst }));
    }).catch(error => console.error('Particle diagnostic failed', error)).finally(() => { report.pending = false; });
  }, { phase: 'finish' });

  const setCount = useCallback((object: Sprite | null) => {
    // Three supports object.count for instanced sprites; Sprite's declarations omit it.
    if (object) (object as Sprite & { count: number }).count = count;
  }, [count]);
  return <sprite ref={setCount} frustumCulled={false}>
    <pointsNodeMaterial positionNode={nodes.positionNode} colorNode={nodes.colorNode} opacityNode={nodes.opacityNode} sizeNode={nodes.sizeNode} sizeAttenuation={false} transparent depthWrite={false} depthTest={false} blending={AdditiveBlending} alphaToCoverage={false} />
  </sprite>;
}
export function ParticleField(props: Props) {
  const { onError } = props;
  const created = useCallback(({ renderer }: { renderer: WebGPURenderer }) => {
    // Backend's type does not expose the implementation's capability flag.
    if (!(renderer.backend as typeof renderer.backend & { isWebGPUBackend?: boolean }).isWebGPUBackend) { onError(); return; }
    renderer.onDeviceLost = () => onError();
  }, [onError]);
  return <Canvas orthographic camera={{ position: [0, 0, 20], near: .1, far: 100, zoom: 80 }} dpr={props.count <= 6144 ? 1 : [1, 1.5]} frameloop={props.paused ? 'demand' : 'always'} renderer={{ alpha: true, antialias: true, trackTimestamp: false }} onCreated={created}>
    <Particles {...props} />
  </Canvas>;
}
