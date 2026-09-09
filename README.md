# Fiber 10 particle study

A Next.js one-pager with a persistent React Three Fiber v10 WebGPU scene. The same GPU particle population transitions through the Poimandres mark, flowing reading margins, a torus knot and a faceted sphere.

[Live demo](https://dennissmolek.github.io/fiber-ten-particles/) · [Source](https://github.com/DennisSmolek/fiber-ten-particles)

## Run

```sh
pnpm install
pnpm dev
```

Open http://localhost:3006. A real WebGPU adapter is required for the animated edition. `?no3d` shows the static fallback. Reduced motion also selects the static edition. The lower-right control pauses and resumes animation.

```sh
pnpm typecheck
pnpm lint
pnpm test
pnpm build
pnpm start
```

## GitHub Pages

Pushing to `main` runs `.github/workflows/pages.yml`: install the locked dependencies, check types, lint, test, export static HTML and assets, and deploy through GitHub Pages. You can also run it manually from the Actions tab. Pages uses the GitHub Actions publishing source.

The workflow reads the Pages base path so JavaScript and CSS load correctly under `/fiber-ten-particles/`. The normal local development and server build keep their root URL. To reproduce the Pages export locally:

```sh
PAGES_BASE_PATH=/fiber-ten-particles pnpm build:pages
```

The generated site is in `out/`; serve it under `/fiber-ten-particles/` when checking that build. Use `pnpm build:pages` without the base-path variable to export for a domain root. No application server or deployment secret is required; the workflow uses GitHub's built-in token.

## Motion ownership

- `src/experience/shape-data.ts` samples the original workshop mark and procedural meshes once, assigning stable particle identities.
- `src/experience/choreography.ts` maps measured DOM intervals to sculpture and margin poses. Repeated pose values create reading holds.
- `src/experience/margin-motion.ts` lets orbit centers counter-scroll at different depth rates during reading holds, freezing their travel during shape transitions. Edge density is weighted rather than clipped around the content.
- `src/experience/particle-field.tsx` owns `useBuffers`, TSL nodes, uniforms and the frame phases. Compute updates independent displacement and velocity slots with bounded 1/120-second steps, then writes the final position. The instanced sprite material reads that buffer directly.
- `src/experience/index.tsx` provides the client-only boundary, capability gate, static edition, visibility handling and pause control.

The pointer disturbance is independent of each particle's ideal scroll/time position. Releasing the pointer restores the current ideal, rather than steering toward the nearest surface or a previous pose. All variable-size particles use instanced sprites, not native one-pixel WebGPU points. A complete scene unmount also unmounts its Canvas and renderer; there are no independent scene swaps that leave old buffer scopes attached.

## Current scope

This is the first visual prototype for review, not a published v10 release announcement. Core pins match the workshop: Fiber 10.0.0-alpha.5, Three 0.185.1, React 19.2.8 and Next 16.3.0. The Poimandres mark comes from the workshop's brand component. TSL and compute are Three.js features integrated into React through Fiber v10.

Particle count is chosen once at startup: 24,576 on desktop, 12,288 at intermediate widths and 6,144 on mobile. Mobile uses DPR 1; larger layouts cap DPR at 1.5. Normal rendering has no GPU readback. There is no live population reallocation, external model asset, bloom pass, analytics or backend service.

For the flicker regression, open `?diagnostics=zero-step`, settle at the desired scroll position and reload. This opt-in probe alternates zero and two physics substeps and reads 32 GPU position samples into a console report. A stationary shape should move smoothly without jumps to the origin. The ideal-position TSL graph is explicitly evaluated before the substep loop, including on zero-step frames. `?diagnostics` samples normal timing instead; remove the query for normal performance. Soft, pixel-filtered sprite cores also reduce subpixel shimmer. Silver particles include restrained blue, peach and lavender variants.

Verified locally: TypeScript, ESLint, production build, scroll interval tests, spring recovery reference, development and production WebGPU rendering, pointer disturbance, shape reveals, pause/resume, restored scroll, narrow layout and `?no3d`. Browser checks are on the development machine; mobile viewport emulation is not a physical phone benchmark. Reduced-motion and device-loss paths are implemented but are not claimed as hardware-tested. Frame-rate budgets remain to be profiled on agreed devices.

The next art-direction pass should focus on stronger surface-following flow in the logo, edge/halo sampling, richer depth cues and the character of the dispersal. See `SPEC.md` for the intended direction.
