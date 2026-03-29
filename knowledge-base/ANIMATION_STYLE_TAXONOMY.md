# Animation Style Taxonomy for Web Technologies

> **Purpose:** Comprehensive reference of animation styles achievable with modern web technologies (React, Remotion, CSS, SVG, Canvas, WebGL). Each style is categorized by type, rated by complexity, and annotated with input requirements and automation potential.
>
> **Last updated:** 2026-03-27

---

## How to Read This Taxonomy

Each animation style entry follows this format:

| Field | Meaning |
|-------|---------|
| **Inputs** | What raw materials are needed: `text-only`, `images`, `video-clips`, `audio`, `3d-models`, `custom-illustrations`, `data/JSON` |
| **Complexity** | `simple` (1-2 days, single component), `moderate` (3-5 days, multiple coordinated components), `complex` (1-2 weeks, custom shaders/physics/heavy math) |
| **Programmatic?** | `fully` = can be generated from data/text alone with zero custom assets. `mostly` = needs minimal generic assets (stock photos, fonts). `partially` = needs some custom creative work (illustrations, recordings). `asset-heavy` = relies primarily on custom creative assets. |
| **Tech Stack** | Primary technologies: `React/CSS`, `SVG`, `Canvas`, `WebGL/Three.js`, `Remotion`, `D3.js`, `Lottie` |

---

## 1. Motion Graphics

Animated graphic design elements, typically used for titles, transitions, and data display. The bread-and-butter of programmatic video.

### 1.1 Kinetic Typography

Animated text where words and letters move, scale, rotate, and transform to emphasize meaning and rhythm.

- **Inputs:** text-only (optionally audio for beat-sync)
- **Complexity:** simple to moderate
- **Programmatic?** fully
- **Tech Stack:** React/CSS, Remotion (`interpolate`, `spring`), SVG for path-following text
- **Subtypes:**
  - **Word-by-word reveal** -- Words appear sequentially with fade, slide, or scale. Staggered `spring()` per word.
  - **Letter explosion/assembly** -- Individual characters scatter or converge. Each letter gets independent transform.
  - **Bounce/elastic text** -- Spring physics on text elements. Uses `spring()` with high stiffness, low damping.
  - **Path-following text** -- Text follows an SVG path curve. Uses `<textPath>` with animated `startOffset`.
  - **Scale emphasis** -- Key words grow large then settle. Uses `interpolate` with overshoot easing.
  - **Rotating/spinning text** -- Words rotate on axis. CSS `transform: rotateX/Y/Z` driven by frame.
  - **Glitch text** -- Rapid position/color/clip-path shifts simulating digital corruption. Random offsets per frame.
  - **Gradient/color sweep** -- Color transitions across text via animated `background-clip: text` or SVG gradient stops.
- **Already built in project:** `BharatvarshPost.tsx` (typewriter with cursor), `TextPunch.tsx`, `Subtitle.tsx`

### 1.2 Lower Thirds

Name/title overlays that slide in from edges, hold, then exit. Standard broadcast pattern.

- **Inputs:** text-only (name, title, optional icon/logo image)
- **Complexity:** simple
- **Programmatic?** fully
- **Tech Stack:** React/CSS, Remotion (`spring`, `interpolate`)
- **Subtypes:**
  - **Slide-in bar** -- Horizontal bar slides from left with accent stripe. Spring enter, spring exit.
  - **Split reveal** -- Two halves slide apart to reveal text underneath.
  - **Underline wipe** -- Text appears with a horizontal line drawing beneath it.
  - **Frosted glass** -- Translucent backdrop-filter card slides into position.
  - **Angled/diagonal** -- Parallelogram-shaped card with CSS `skewX` transform.
- **Already built in project:** `LowerThird.tsx` (pillar-accented slide-in bar)

### 1.3 Title Cards / Full-Screen Titles

Full-frame text compositions for episode intros, chapter markers, or quote displays.

- **Inputs:** text-only (optionally background image)
- **Complexity:** simple
- **Programmatic?** fully
- **Tech Stack:** React/CSS, Remotion, SVG for decorative elements
- **Subtypes:**
  - **Centered fade** -- Text fades in at center, holds, fades out. The simplest animation.
  - **Staggered multi-line** -- Each line enters with a delay. Spring or interpolate per line.
  - **Split-screen text** -- Two text blocks on contrasting backgrounds.
  - **Text behind image** -- Text appears, then an image slides over partially occluding it (parallax depth).
  - **Stamp/seal drop** -- Text slams into frame with spring overshoot. Like `BharatvarshPost.tsx` "1717" stamp.
  - **Redacted/declassified** -- Text reveals through animated clip-path or mask, as if unredacting a document.
- **Already built in project:** `ChapterCard.tsx`, `BharatvarshPost.tsx` (multi-phase title sequence)

### 1.4 Transitions

Visual bridges between scenes or content sections.

- **Inputs:** none (purely procedural)
- **Complexity:** simple to moderate
- **Programmatic?** fully
- **Tech Stack:** Remotion `@remotion/transitions` (fade, slide, wipe, flip, clockWipe), CSS, WebGL for advanced
- **Subtypes:**
  - **Crossfade** -- Opacity blend between scenes. `fade()` presentation.
  - **Slide** -- Scene slides in from any direction. `slide({ direction })` presentation.
  - **Wipe** -- Hard edge sweeps across revealing next scene. `wipe()` presentation.
  - **Clock wipe** -- Radial sweep like a clock hand. `clockWipe()` presentation.
  - **Flip** -- 3D card flip rotation. `flip()` presentation.
  - **Zoom through** -- Scale up current scene until it fills, then scale down to reveal next.
  - **Shape mask** -- Circle, diamond, or star shape expands from a point to reveal next scene. SVG `<clipPath>` animated.
  - **Morph/liquid** -- Organic blob shape transition. SVG path morphing or WebGL displacement.
  - **Light leak** -- Bright anamorphic flare over cut point. `@remotion/light-leaks` with `<TransitionSeries.Overlay>`.
  - **Glitch cut** -- Rapid random slice displacement for 3-5 frames at cut point.
  - **Diagonal tear** -- Angled line splits frame. Already used in `BharatvarshPost.tsx`.
- **Already built in project:** `transitions.ts` utility, `BharatvarshPost.tsx` (diagonal tear glow)

### 1.5 Logo Reveals / Intro Stings

Animated logo appearances for brand openings.

- **Inputs:** images (logo SVG or PNG), optionally audio (sting sound)
- **Complexity:** simple to moderate
- **Programmatic?** mostly (needs logo asset)
- **Tech Stack:** React/CSS, SVG animation, Remotion
- **Subtypes:**
  - **Draw-on** -- SVG path stroke animation revealing logo outline, then fill. Uses `@remotion/paths` `evolvePath`.
  - **Particle assembly** -- Scattered dots converge to form logo shape. Canvas or many `<div>` elements.
  - **Scale bounce** -- Logo drops in with spring overshoot. Single `spring()` call.
  - **Glitch reveal** -- Logo appears through rapid distortion frames.
  - **Mask wipe** -- Gradient or shape mask sweeps to reveal logo.
  - **3D rotation** -- Logo rotates from edge-on to face-on. CSS `perspective` + `rotateY`.
- **Already built in project:** `LogoIntro.tsx`, `IntroSting.tsx`

### 1.6 Data Counters / Animated Numbers

Numbers that count up/down to a target value, often used for statistics and metrics.

- **Inputs:** data/JSON (target numbers, labels)
- **Complexity:** simple
- **Programmatic?** fully
- **Tech Stack:** React/CSS, Remotion (`interpolate`)
- **Subtypes:**
  - **Rolling counter** -- Number increments from 0 to target over duration. `Math.round(interpolate(...))`.
  - **Odometer/slot machine** -- Digit columns scroll vertically to target. Per-digit `translateY` animation.
  - **Percentage ring** -- Circular SVG progress ring fills to percentage. `stroke-dashoffset` animation.
  - **Stat card pop** -- Number + label card scales in with spring, number counts up simultaneously.
- **Already built in project:** `StatCard.tsx`

### 1.7 Particle Systems

Collections of many small elements moving according to rules (physics, noise, attractors).

- **Inputs:** none (fully procedural), optionally images for particle sprites
- **Complexity:** moderate to complex
- **Programmatic?** fully
- **Tech Stack:** Canvas (for thousands of particles), React/CSS (for dozens), WebGL (for millions), `@remotion/noise`
- **Subtypes:**
  - **Floating dots** -- Perlin noise-driven gentle drift. Uses `noise2D`/`noise3D` from `@remotion/noise`.
  - **Rising particles** -- Embers, bubbles, or snow drifting upward. Y position decreases over time with X wobble.
  - **Confetti burst** -- Explosion of colored rectangles with gravity and rotation. Physics simulation per particle.
  - **Connection mesh** -- Dots with lines drawn between nearby ones (constellation/network effect). Distance-based line opacity.
  - **Attractor field** -- Particles orbit or flow toward a point. Force-based position updates.
  - **Audio-reactive particles** -- Particle size/speed/color driven by audio frequency data. `@remotion/media-utils` `visualizeAudio`.
- **Already built in project:** `noise.ts` (Perlin noise utilities, floating offset, noise grid generation)

---

## 2. 2D Animation

Traditional and digital animation styles that operate in two-dimensional space.

### 2.1 Frame-by-Frame / Sprite Animation

Sequential display of hand-drawn or pre-rendered frames.

- **Inputs:** custom-illustrations (sprite sheets or frame sequences)
- **Complexity:** simple (code), asset-heavy (art)
- **Programmatic?** asset-heavy -- requires pre-drawn frames, code just sequences them
- **Tech Stack:** React/CSS (`background-position` cycling), Canvas, Remotion (`useCurrentFrame() % totalFrames`)
- **Notes:** Code selects frame based on `Math.floor(frame / framesPerImage) % totalFrames`. The animation itself is trivial; the art is the bottleneck.

### 2.2 Tweened / Keyframe Animation

Properties (position, scale, rotation, opacity, color) interpolate smoothly between keyframe values over time.

- **Inputs:** text-only or images (depending on what is being tweened)
- **Complexity:** simple to moderate
- **Programmatic?** fully (for geometric shapes and text) to mostly (when tweening images)
- **Tech Stack:** React/CSS, Remotion (`interpolate`, `spring`, `Easing`), SVG transforms
- **Notes:** This is the default animation model in Remotion. Every `interpolate()` call is a tween. Easing functions (cubic, elastic, bounce) control the feel. Spring physics provide natural motion without manual easing curves.

### 2.3 Cutout Animation

Characters or objects built from separate flat pieces (arms, legs, head) that pivot at joints. Like a paper puppet.

- **Inputs:** custom-illustrations (body part assets as separate PNGs or SVGs)
- **Complexity:** moderate
- **Programmatic?** partially -- needs custom artwork split into articulated pieces, motion is code-driven
- **Tech Stack:** React/CSS (nested `transform-origin` + `rotate`), SVG groups with transforms
- **Notes:** Each body part is a positioned `<div>` or SVG `<g>` with `transform-origin` at its joint. Rotation angles are driven by `interpolate()` or `spring()`. Can create walk cycles, gestures, and expressions programmatically once assets exist.

### 2.4 SVG Path Morphing

One SVG shape smoothly transforms into another by interpolating path data.

- **Inputs:** text-only (for simple geometric morphs) or custom-illustrations (for complex shapes)
- **Complexity:** moderate
- **Programmatic?** mostly -- simple shapes are fully programmatic, complex shapes need design
- **Tech Stack:** SVG, `flubber` or `d3-interpolate-path` libraries, `@remotion/paths`
- **Notes:** Shapes must have compatible point counts for smooth morphing. Libraries like `flubber` handle mismatched point counts. Useful for icon transitions, shape storytelling, and abstract morphing sequences.

### 2.5 Lottie / After Effects Integration

Pre-built vector animations exported from After Effects as JSON, rendered in the browser.

- **Inputs:** custom-illustrations (Lottie JSON files, created in After Effects or similar)
- **Complexity:** simple (integration), asset-heavy (creation)
- **Programmatic?** partially -- playback is programmatic, creation requires design tools
- **Tech Stack:** `@remotion/lottie`, React
- **Notes:** Massive library of free Lottie animations available on LottieFiles. Ideal for icons, loading spinners, and decorative elements. In Remotion, playback must be driven by `useCurrentFrame()`, not Lottie's internal timer.

### 2.6 Rotoscope / Traced Video

Hand-drawn or auto-traced outlines over live-action video footage.

- **Inputs:** video-clips (source footage), optionally custom-illustrations (manual traces)
- **Complexity:** complex
- **Programmatic?** partially -- AI edge detection can automate tracing, but artistic cleanup is manual
- **Tech Stack:** Canvas (edge detection filters), SVG (vector traces), external AI tools for auto-trace
- **Notes:** Achievable programmatically with Canny edge detection or Sobel filters applied to video frames via Canvas. The "A Scanner Darkly" look. More artistic versions require manual frame-by-frame tracing outside the browser.

---

## 3. 3D Animation

Three-dimensional rendering using WebGL, typically via Three.js and React Three Fiber.

### 3.1 Full 3D Scene (React Three Fiber)

Complete 3D environments with models, lighting, cameras, and materials.

- **Inputs:** 3d-models (GLTF/GLB), optionally images (textures), audio
- **Complexity:** complex
- **Programmatic?** partially -- scene setup is code, but models and textures need creation
- **Tech Stack:** `@remotion/three`, React Three Fiber, Three.js
- **Subtypes:**
  - **Product showcase** -- 3D model rotating on turntable with studio lighting.
  - **Architectural walkthrough** -- Camera path through 3D environment.
  - **Character animation** -- Rigged 3D model with skeletal animation (GLTF animations).
  - **Physics simulation** -- Objects falling, colliding, stacking. Libraries like `@react-three/cannon`.
- **Notes:** In Remotion, all animation MUST be driven by `useCurrentFrame()`. The `useFrame()` hook from `@react-three/fiber` is forbidden. Use `<ThreeCanvas>` wrapper with explicit `width` and `height`. Any `<Sequence>` inside `<ThreeCanvas>` needs `layout="none"`.

### 3.2 Isometric Scenes

Fake 3D using CSS transforms or pre-rendered isometric viewpoints. No actual WebGL needed.

- **Inputs:** text-only (for geometric isometric), images (for illustrated isometric)
- **Complexity:** moderate
- **Programmatic?** fully (for geometric/block-based) to partially (for illustrated)
- **Tech Stack:** React/CSS (`transform: rotateX(60deg) rotateZ(45deg)`), SVG
- **Subtypes:**
  - **Block world** -- Minecraft-like voxel grids. Pure CSS 3D transforms on colored divs.
  - **City/building** -- Isometric building diagrams built from rectangles with parallelogram transforms.
  - **Flowchart/system** -- Isometric boxes connected by angled lines for architecture diagrams.
  - **Pixel art / 8-bit isometric** -- Already built: `VideoRoadmap8Bit.tsx`.
- **Already built in project:** `VideoRoadmap8Bit.tsx` (8-bit pixel art isometric roadmap)

### 3.3 Pseudo-3D Effects

Depth illusion without actual 3D rendering: parallax layers, CSS perspective, and depth-of-field simulation.

- **Inputs:** images (multiple layers at different depths)
- **Complexity:** simple to moderate
- **Programmatic?** mostly -- needs layered source images or assets
- **Tech Stack:** React/CSS (`perspective`, `translateZ`, parallax multipliers), Remotion
- **Subtypes:**
  - **Parallax layers** -- Background moves slower than foreground. Different `translateX` speeds per layer.
  - **CSS perspective cards** -- Cards tilt in 3D space on hover/scroll. `perspective` + `rotateX/Y`.
  - **Depth blur** -- Background layers get progressive `filter: blur()` to simulate depth-of-field.
  - **2.5D camera** -- Pan and zoom across layered 2D scene creating depth illusion.

### 3.4 Shader Effects

Custom GLSL shaders for visual effects applied to textures, shapes, or the entire frame.

- **Inputs:** none (procedural) or images/video-clips (as texture inputs)
- **Complexity:** complex
- **Programmatic?** fully (for procedural shaders) to mostly (when processing existing media)
- **Tech Stack:** WebGL, Three.js `ShaderMaterial`, React Three Fiber, `@react-three/postprocessing`
- **Subtypes:**
  - **Displacement mapping** -- Image distortion using a noise texture. Liquid/heat-haze effect.
  - **Chromatic aberration** -- RGB channel separation at edges. Classic lens effect.
  - **Bloom/glow** -- Bright areas bleed light. Post-processing pass.
  - **Noise/grain** -- Procedural noise overlay (simpler version already built with SVG in `FilmGrain.tsx`).
  - **Color grading** -- LUT-based color transformation. Full-frame color shift.
  - **Pixelation/mosaic** -- Reduce resolution for stylistic effect. Quantize UV coordinates.
  - **Kaleidoscope** -- Mirror and rotate UV coordinates for symmetrical patterns.

### 3.5 Map Animations

Geographic visualizations with animated camera, routes, and markers.

- **Inputs:** data/JSON (coordinates, route data), API key (Mapbox)
- **Complexity:** moderate to complex
- **Programmatic?** fully -- all data-driven, no custom art needed
- **Tech Stack:** Mapbox GL JS, `@turf/turf`, Remotion
- **Subtypes:**
  - **Route trace** -- Animated line drawing along a path. `lineSliceAlong` for geodesic or linear interpolation for straight.
  - **Camera flyover** -- Camera position interpolated along route with pitch and bearing.
  - **Marker pop-in** -- Locations appear with spring animations as camera passes.
  - **3D terrain** -- Mapbox 3D buildings and terrain with animated camera.
- **Notes:** Must render with `--gl=angle --concurrency=1`. Set `interactive: false`, `fadeDuration: 0`. Camera must be driven by `useCurrentFrame()`.

---

## 4. Explainer / Educational

Styles optimized for teaching concepts, processes, and systems.

### 4.1 Whiteboard Animation

Simulated hand-drawing on a white background with elements appearing as if sketched in real-time.

- **Inputs:** text-only (for simple diagrams) or custom-illustrations (for complex drawings)
- **Complexity:** moderate
- **Programmatic?** mostly -- SVG path draw-on for line art, but complex illustrations need pre-made SVGs
- **Tech Stack:** SVG (`stroke-dasharray`/`stroke-dashoffset` animation), `@remotion/paths`, React
- **Subtypes:**
  - **Line draw-on** -- SVG paths reveal stroke progressively. `evolvePath()` from `@remotion/paths`.
  - **Sketch + label** -- Drawing appears, then text label fades in beside it.
  - **Hand-drawn style** -- Use rough/sketchy SVG filters or libraries like `rough.js` for hand-drawn aesthetic.
  - **Progressive diagram** -- Complex diagram builds element by element with draw-on strokes.

### 4.2 Diagram Builds

System architecture, flowcharts, org charts, and relationship diagrams that construct themselves step by step.

- **Inputs:** data/JSON (node labels, connections, hierarchy)
- **Complexity:** moderate
- **Programmatic?** fully
- **Tech Stack:** React/CSS, SVG (for connection lines), Remotion
- **Subtypes:**
  - **Flowchart** -- Boxes connected by arrows, nodes pop in with stagger, arrows draw between them. Already built: `ProcessFlow.tsx`.
  - **Architecture diagram** -- Layered system blocks with labeled connections.
  - **Mind map** -- Central node with branching children that expand outward.
  - **Org chart** -- Hierarchical tree with nodes dropping into position.
  - **Sequence diagram** -- Vertical lifelines with horizontal messages animating between them.
  - **State machine** -- States as circles, transitions as arrows with labels. Active state highlighted.
  - **Network graph** -- Force-directed node layout with connections. Nodes settle into position via physics.
- **Already built in project:** `ProcessFlow.tsx`, `FiveStepRoadmap.tsx`, `DeploymentLanes.tsx`, `ExplorerToolkit.tsx`

### 4.3 Code Walkthroughs

Animated code display with syntax highlighting, line-by-line reveals, and annotation callouts.

- **Inputs:** text-only (source code strings)
- **Complexity:** moderate
- **Programmatic?** fully
- **Tech Stack:** React/CSS, Remotion, syntax highlighting libraries (Shiki, Prism)
- **Subtypes:**
  - **Line-by-line reveal** -- Code lines appear sequentially with typewriter or fade effect.
  - **Highlight + annotate** -- Specific code sections highlight while an annotation callout appears.
  - **Diff animation** -- Old code fades/slides out, new code slides in. Red/green highlighting.
  - **Terminal/console** -- Monospace text appearing character by character with blinking cursor. Command + response pattern.
  - **Code morphing** -- One code block transforms into another with smooth interpolation of changed sections.
- **Already built in project:** `CodeBlock.tsx`

### 4.4 Step-by-Step Tutorials

Numbered steps that appear sequentially with visual demonstrations.

- **Inputs:** text-only (step descriptions), optionally images or video-clips (screenshots, demos)
- **Complexity:** simple to moderate
- **Programmatic?** fully (text-only) to mostly (with screenshots)
- **Tech Stack:** React/CSS, Remotion
- **Subtypes:**
  - **Numbered card sequence** -- Cards with step numbers slide in one at a time.
  - **Checklist build** -- Checkboxes appear and get checked off sequentially.
  - **Screen recording overlay** -- Video clip plays with animated cursor, hotspot highlights, and step labels.
  - **Split: instruction + visual** -- Left side shows step text, right side shows corresponding visual.
- **Already built in project:** `StepNotification.tsx`

### 4.5 Comparison / Before-After

Side-by-side or sequential presentation showing differences between two states.

- **Inputs:** text-only or images (two states to compare)
- **Complexity:** simple
- **Programmatic?** fully (text) to mostly (images)
- **Tech Stack:** React/CSS, Remotion
- **Subtypes:**
  - **Split screen** -- Vertical divider with "before" left and "after" right. Divider can slide.
  - **Swipe reveal** -- Draggable/animated divider revealing the "after" state underneath.
  - **Flip card** -- Card rotates 180deg to show the other side.
  - **Pros/cons table** -- Two-column table that builds row by row.
  - **Morph transition** -- First state smoothly transforms into second state.
- **Already built in project:** `ComparisonChart.tsx`, `BeforeAfter.tsx` (thumbnail), `SplitScreenScene.tsx`

---

## 5. Social Media

Format-specific animations optimized for platform dimensions and engagement patterns.

### 5.1 Carousel / Multi-Slide

Sequential slides designed for Instagram carousel, LinkedIn documents, or swipeable formats.

- **Inputs:** text-only or images (per-slide content)
- **Complexity:** simple
- **Programmatic?** fully
- **Tech Stack:** React/CSS, Remotion (render each slide as a frame or sequence)
- **Subtypes:**
  - **Slide deck** -- Clean cards with consistent branding, title + body + visual per slide.
  - **Story arc carousel** -- Narrative across slides: hook, problem, insight, solution, CTA.
  - **Data carousel** -- Each slide presents one stat or data point with animated chart.
  - **Tutorial carousel** -- Step-by-step instruction, one step per slide.
- **Output formats:** Static PNGs (for true carousels), or video (for animated carousel effect in Reels)

### 5.2 Stories / Reels (Vertical Video)

9:16 aspect ratio animations optimized for Instagram Stories/Reels, TikTok, and YouTube Shorts.

- **Inputs:** text-only, images, or video-clips depending on style
- **Complexity:** simple to moderate
- **Programmatic?** fully (text-driven) to partially (video-based)
- **Tech Stack:** React/CSS, Remotion (1080x1920 or 1080x1350 compositions)
- **Subtypes:**
  - **Text story** -- Bold text on gradient/image background with animated entry. 5-15 seconds.
  - **Quote card reel** -- Animated quote with attribution, background motion, and music.
  - **Quick tip** -- Hook text, explanation, takeaway. Fast cuts, bold typography.
  - **Reaction / hot take** -- Bold opinion text slamming into frame with emphasis effects.
  - **Behind-the-scenes** -- Video clip with branded overlay, lower third, and stickers.
  - **Countdown / teaser** -- Numbers counting down with suspenseful reveals.

### 5.3 Quote Cards

Static or animated text compositions featuring quotations, aphorisms, or key statements.

- **Inputs:** text-only (quote + attribution), optionally images (background, author photo)
- **Complexity:** simple
- **Programmatic?** fully
- **Tech Stack:** React/CSS, Remotion
- **Subtypes:**
  - **Centered serif** -- Elegant centered text on solid/gradient background. Fade-in animation.
  - **Bold statement** -- Large sans-serif text with accent color highlight on key words.
  - **Typed quote** -- Typewriter effect revealing the quote character by character.
  - **Floating text** -- Words drift gently with noise-driven motion on abstract background.

### 5.4 Countdown Timers

Animated timers counting down to an event, product launch, or deadline.

- **Inputs:** data/JSON (target date/time, event name)
- **Complexity:** simple
- **Programmatic?** fully
- **Tech Stack:** React/CSS, SVG (for circular progress), Remotion
- **Subtypes:**
  - **Digital clock** -- HH:MM:SS display with rolling digits.
  - **Circular countdown** -- SVG arc that depletes as time passes.
  - **Flip clock** -- Retro split-flap display animation. CSS `rotateX` on upper/lower halves.
  - **Progress bar** -- Linear bar that fills or depletes.

### 5.5 Announcement / Event Promo

Short animated announcements for launches, events, sales, or milestones.

- **Inputs:** text-only (event details), optionally images (product shots, speaker photos)
- **Complexity:** simple to moderate
- **Programmatic?** fully (text) to mostly (with images)
- **Tech Stack:** React/CSS, Remotion
- **Subtypes:**
  - **Save the date** -- Date prominently animated with supporting details.
  - **Speaker spotlight** -- Photo + name + topic with animated entry.
  - **Product launch** -- Product image with dynamic text reveals and countdown.
  - **Milestone celebration** -- Numbers counting up with confetti or particle effects.

---

## 6. Cinematic

Film-inspired visual techniques that add production value and atmosphere.

### 6.1 Ken Burns Effect

Slow pan and zoom across static images, creating the illusion of camera movement through still photography.

- **Inputs:** images (high-resolution photos or artwork)
- **Complexity:** simple
- **Programmatic?** mostly -- needs images, motion is fully procedural
- **Tech Stack:** React/CSS (`transform: scale() translate()`), Remotion (`interpolate` for smooth motion)
- **Notes:** Requires high-resolution source images (at least 2x the output resolution) to allow zooming without pixelation. Scale typically ranges from 1.0 to 1.1 over 5-10 seconds.
- **Already built in project:** `BharatvarshBackground.tsx` (Ken Burns with blur transitions), `BharatvarshPost.tsx`

### 6.2 Parallax Depth

Multiple layers moving at different speeds to create depth perception during pans and zooms.

- **Inputs:** images (multiple layers: background, midground, foreground, optionally text)
- **Complexity:** simple to moderate
- **Programmatic?** mostly -- needs layered assets, motion is procedural
- **Tech Stack:** React/CSS (`translateX/Y` with speed multipliers per layer), Remotion
- **Subtypes:**
  - **Horizontal parallax** -- Layers slide left/right at different speeds during pan.
  - **Vertical parallax** -- Layers move up/down at different speeds (scroll-like).
  - **Zoom parallax** -- Layers scale at different rates during zoom, creating depth rush.
  - **Atmospheric parallax** -- Far layers have blur and desaturation, near layers are sharp.

### 6.3 Film Grain / Analog Effects

Simulated film stock imperfections for vintage or cinematic atmosphere.

- **Inputs:** none (fully procedural)
- **Complexity:** simple
- **Programmatic?** fully
- **Tech Stack:** SVG (`feTurbulence` filter), CSS (noise texture overlay), WebGL (shader grain)
- **Subtypes:**
  - **Film grain** -- Random noise overlay. SVG `feTurbulence` with frame-varying seed. Already built.
  - **VHS / scan lines** -- Horizontal lines + color bleeding + tracking artifacts. CSS linear gradients + color shifts.
  - **Vignette** -- Radial darkening at frame edges. CSS `radial-gradient`. Already built.
  - **Light leaks** -- Bright warm spots bleeding from edges. `@remotion/light-leaks` or CSS gradients.
  - **Dust and scratches** -- Animated overlay sprites of dust particles and vertical scratch lines.
  - **Color grade / LUT** -- Overall color shift (teal-orange, bleach bypass, etc.). CSS `filter` combinations or WebGL.
  - **Surveillance grid** -- Grid overlay with timestamp. CSS `background-image` linear gradients. Already built.
  - **Scanline sweep** -- Single bright horizontal line slowly scanning vertically. Already built.
- **Already built in project:** `FilmGrain.tsx`, `BharatvarshBackground.tsx` (vignette + surveillance grid), `BharatvarshPost.tsx` (grain + vignette + scanline sweep)

### 6.4 Letterbox / Aspect Ratio

Cinematic black bars and aspect ratio framing for dramatic effect.

- **Inputs:** none (purely compositional)
- **Complexity:** simple
- **Programmatic?** fully
- **Tech Stack:** React/CSS (black bars via positioned divs or padding)
- **Subtypes:**
  - **Cinematic bars** -- Top and bottom black bars creating 2.35:1 or 2.39:1 widescreen look.
  - **Animated letterbox** -- Bars slide in to narrow the frame for dramatic moments.
  - **Frame-within-frame** -- Decorative border or frame overlay.
  - **Aspect ratio shift** -- Bars animate from 16:9 to 2.39:1 for tone shift.

### 6.5 Title Sequences

Multi-element opening sequences combining typography, motion, imagery, and sound design.

- **Inputs:** text-only (titles, credits), images (logo), audio (music/sound design)
- **Complexity:** moderate to complex
- **Programmatic?** mostly -- text and motion are procedural, needs logo and audio assets
- **Tech Stack:** React/CSS, SVG, Remotion `TransitionSeries`, optionally WebGL
- **Subtypes:**
  - **Minimal text** -- Names fade in and out on black with subtle motion. Think Fincher-style.
  - **Layered collage** -- Multiple images and text fragments overlap and animate independently.
  - **Typography journey** -- Camera "moves through" a landscape of 3D-positioned text. CSS `perspective`.
  - **Animated logo + credits** -- Logo reveal followed by sequential credit cards.
- **Already built in project:** `IntroSting.tsx`, `LogoIntro.tsx`

---

## 7. Data Visualization

Animated charts, graphs, and infographics that bring data to life.

### 7.1 Animated Bar Charts

Vertical or horizontal bars that grow from zero to their data values.

- **Inputs:** data/JSON (values, labels, categories)
- **Complexity:** simple
- **Programmatic?** fully
- **Tech Stack:** React/CSS, SVG, D3.js, Remotion (`spring` with stagger delay)
- **Subtypes:**
  - **Staggered grow** -- Bars grow one at a time left to right. `spring()` with per-bar delay.
  - **Grouped bars** -- Multiple bars per category for comparison. Color-coded groups.
  - **Stacked bars** -- Segments stack on top of each other per category.
  - **Racing bars** -- Bars that reorder and resize over time (bar chart race). Animated position + width.
  - **Radial bar chart** -- Bars arranged in a circle. SVG arcs with animated sweep.
- **Already built in project:** `charts-bar-chart.tsx` (staggered gold bars with axes)

### 7.2 Animated Line/Area Charts

Lines and filled areas that draw on progressively, showing trends over time.

- **Inputs:** data/JSON (time series data points)
- **Complexity:** moderate
- **Programmatic?** fully
- **Tech Stack:** SVG, `@remotion/paths` (`evolvePath`), D3.js line generators, Remotion
- **Subtypes:**
  - **Line draw-on** -- Path traces from left to right. `evolvePath()` with progress interpolation.
  - **Area fill** -- Line draws on, then area beneath fills with a downward wipe.
  - **Multi-line comparison** -- Multiple lines draw simultaneously with legend.
  - **Sparkline** -- Minimal small line chart without axes. Compact inline visualization.
  - **Path with marker** -- Dot follows the line as it draws. `getPointAtLength()`.

### 7.3 Animated Pie/Donut Charts

Circular charts with segments that fill or grow into position.

- **Inputs:** data/JSON (categories, values/percentages)
- **Complexity:** simple to moderate
- **Programmatic?** fully
- **Tech Stack:** SVG (circles with `stroke-dasharray`/`stroke-dashoffset`), D3.js arc generators
- **Subtypes:**
  - **Sequential fill** -- Segments fill one at a time around the circle.
  - **Simultaneous grow** -- All segments grow from center outward simultaneously.
  - **Exploded segment** -- One segment pulls outward for emphasis.
  - **Donut with center stat** -- Donut chart with large number in center counting up.

### 7.4 Animated Infographics

Complex multi-element data stories combining charts, icons, text, and illustrations.

- **Inputs:** data/JSON, optionally images (icons, illustrations)
- **Complexity:** moderate to complex
- **Programmatic?** mostly -- data and layout are procedural, may need icon/illustration assets
- **Tech Stack:** React/CSS, SVG, D3.js, Remotion
- **Subtypes:**
  - **Stat dashboard** -- Multiple KPI cards + charts on a single frame. Elements stagger in.
  - **Timeline infographic** -- Horizontal or vertical timeline with data points and milestones.
  - **Comparison infographic** -- Two-column with matching data points for A vs B comparison.
  - **Icon array / pictograph** -- Grid of icons where filled/colored icons represent data proportions.
  - **Map infographic** -- Geographic data overlaid on a simplified map shape.

### 7.5 Dashboard Animations

Simulated real-time dashboard displays with multiple data widgets updating.

- **Inputs:** data/JSON (metrics, time series, status values)
- **Complexity:** moderate
- **Programmatic?** fully
- **Tech Stack:** React/CSS, SVG, Remotion
- **Subtypes:**
  - **Startup reveal** -- Dashboard widgets populate one by one with staggered animations.
  - **Live update simulation** -- Values change over time, charts redraw, status indicators flip.
  - **Zoom into widget** -- Camera zooms from overview to a specific chart for detail.
  - **Dark mode command center** -- HUD-style display with glowing elements and grid backgrounds.

---

## 8. Brand / Marketing

Animation styles for product marketing, testimonials, and commercial content.

### 8.1 Product Showcases

Animated presentations highlighting product features and benefits.

- **Inputs:** images (product screenshots/photos, UI mockups), text-only (feature descriptions)
- **Complexity:** moderate
- **Programmatic?** mostly -- needs product images, motion and layout are procedural
- **Tech Stack:** React/CSS, Remotion, optionally WebGL for 3D product renders
- **Subtypes:**
  - **Feature highlight reel** -- Product image with callout bubbles pointing to features that animate in.
  - **Screen walkthrough** -- Animated cursor moving through a UI with hotspot highlights.
  - **Device mockup** -- Product displayed inside a phone/laptop frame with scrolling content.
  - **Zoom and pan** -- Ken Burns over high-res product images with annotation overlays.
  - **Exploded view** -- Product components separate and label themselves (2D or 3D).
  - **3D product spin** -- 360-degree rotation of product model. Three.js turntable.

### 8.2 Testimonial Animations

Animated customer quotes and social proof presentations.

- **Inputs:** text-only (quote, name, title), optionally images (headshot, company logo)
- **Complexity:** simple
- **Programmatic?** fully (text) to mostly (with photos)
- **Tech Stack:** React/CSS, Remotion
- **Subtypes:**
  - **Quote card** -- Testimonial text with attribution, animated entry and exit.
  - **Star rating reveal** -- Stars fill in with animation alongside the quote.
  - **Social proof ticker** -- Scrolling testimonials like a news ticker.
  - **Video testimonial frame** -- Video clip in branded frame with name overlay.

### 8.3 Pricing / Feature Tables

Animated comparison tables and pricing plan displays.

- **Inputs:** data/JSON (plans, features, prices)
- **Complexity:** simple
- **Programmatic?** fully
- **Tech Stack:** React/CSS, Remotion
- **Subtypes:**
  - **Column build** -- Pricing columns rise up with stagger, features check off row by row.
  - **Highlight plan** -- One plan grows larger or glows to indicate the recommended option.
  - **Feature checkmark sweep** -- Checkmarks cascade diagonally across the comparison table.

### 8.4 Call-to-Action Animations

Attention-grabbing end-screen or in-video CTAs.

- **Inputs:** text-only (CTA text, URL), optionally images (button graphics, QR codes)
- **Complexity:** simple
- **Programmatic?** fully
- **Tech Stack:** React/CSS, Remotion
- **Subtypes:**
  - **Button pulse** -- CTA button with glowing pulse animation.
  - **Arrow/pointer** -- Animated arrow drawing attention to subscribe/click target.
  - **QR code reveal** -- QR code materializes with scan-line effect.
  - **End card** -- Subscribe button + next video thumbnail + social links. Spring animations.
- **Already built in project:** `EndScreen.tsx`

### 8.5 Logo / Brand Animations

Animated brand identity elements for intros, outros, and watermarks.

- **Inputs:** images (logo, brand colors defined in tokens)
- **Complexity:** simple to moderate
- **Programmatic?** mostly -- needs logo asset, animation is procedural
- **Tech Stack:** React/CSS, SVG, Remotion
- **Subtypes:**
  - **Watermark** -- Persistent semi-transparent logo in corner with subtle animation.
  - **Bumper** -- Short (2-3 second) logo animation for transitions between segments.
  - **Animated badge/stamp** -- Brand mark that stamps into frame with spring physics.
  - **Branded frame** -- Persistent border/overlay with brand colors, logo, and tagline.
- **Already built in project:** `Watermark.tsx`, `PillarBadge.tsx`

---

## 9. Abstract / Generative

Procedurally generated visual art driven by algorithms, mathematics, and noise functions.

### 9.1 Perlin/Simplex Noise Fields

Smooth, organic patterns generated by noise algorithms, creating flowing landscapes and textures.

- **Inputs:** none (fully procedural)
- **Complexity:** moderate
- **Programmatic?** fully
- **Tech Stack:** `@remotion/noise` (`noise2D`, `noise3D`), Canvas, WebGL
- **Subtypes:**
  - **Flow field** -- Arrows or lines following noise-derived angle field. Organic streaming patterns.
  - **Terrain heightmap** -- Noise values as elevation, rendered as contour lines or colored gradient.
  - **Noise-driven color** -- Each pixel colored by noise value through a gradient map.
  - **Animated fog/clouds** -- 3D noise sampled with time dimension for evolving cloud formations.
  - **Organic mesh deformation** -- Noise applied to vertex positions for wobbling/breathing shapes.
- **Already built in project:** `noise.ts` (`smoothNoise`, `animatedNoise`, `generateNoiseGrid`, `floatingOffset`, `hueShift`)

### 9.2 Fractal Rendering

Self-similar mathematical patterns: Mandelbrot, Julia sets, recursive trees, and L-systems.

- **Inputs:** none (fully procedural, parameterized by mathematical constants)
- **Complexity:** moderate (CPU) to complex (real-time GPU)
- **Programmatic?** fully
- **Tech Stack:** Canvas (CPU rendering), WebGL (GPU shader rendering for real-time)
- **Subtypes:**
  - **Mandelbrot/Julia zoom** -- Progressive zoom into fractal boundary with color mapping.
  - **Recursive tree** -- Branching structure that grows recursively. Canvas or SVG.
  - **L-system plant** -- Grammar-based generation of plant-like structures.
  - **Sierpinski / geometric fractals** -- Triangle, carpet, or other subdivisions that recurse.

### 9.3 Geometric / Sacred Geometry

Mathematically precise patterns: spirals, tessellations, mandalas, and symmetry groups.

- **Inputs:** none (fully procedural)
- **Complexity:** simple to moderate
- **Programmatic?** fully
- **Tech Stack:** SVG (precise vector shapes), Canvas, React/CSS
- **Subtypes:**
  - **Spiral build** -- Golden spiral or Fibonacci spiral drawing outward. SVG arc path animation.
  - **Tessellation** -- Repeating tile patterns that fill the screen. CSS `background-repeat` or SVG `<pattern>`.
  - **Mandala** -- Radially symmetric pattern that builds outward from center. SVG `<g>` with rotation copies.
  - **Morphing polygons** -- Regular polygons smoothly transforming between triangle, square, pentagon, etc.
  - **Lissajous curves** -- Parametric curves drawn by sine waves at different frequencies.

### 9.4 Audio-Reactive Visuals

Visual elements that respond to music or audio input in real-time.

- **Inputs:** audio (music track or sound file)
- **Complexity:** moderate to complex
- **Programmatic?** fully (given audio input)
- **Tech Stack:** `@remotion/media-utils` (`visualizeAudio`, `visualizeAudioWaveform`), Canvas, WebGL, SVG
- **Subtypes:**
  - **Spectrum bars** -- Vertical bars representing frequency bands. Classic equalizer visualization.
  - **Waveform display** -- Oscilloscope-style wave drawing. `createSmoothSvgPath()`.
  - **Bass-reactive shapes** -- Shapes pulse/scale on beat. Low-frequency extraction from spectrum data.
  - **Circular visualizer** -- Frequency bars arranged radially. Bars extend outward from center circle.
  - **Particle audio response** -- Particle system where velocity/size is modulated by audio energy.
  - **Background color pulse** -- Background hue/brightness shifts with music intensity.
  - **Audiogram / podcast visualizer** -- Waveform + speaker identity + transcript. Common podcast video format.
- **Notes:** Use `useWindowedAudioData()` for loading, `visualizeAudio()` for frequency spectrum (power-of-2 samples: 32-1024), `visualizeAudioWaveform()` for time-domain display. Apply logarithmic scaling for visual balance since bass naturally dominates.

### 9.5 Procedural / Algorithmic Art

Rule-based or algorithm-driven visual compositions.

- **Inputs:** none (fully procedural) or data/JSON (seeds, parameters)
- **Complexity:** moderate to complex
- **Programmatic?** fully
- **Tech Stack:** Canvas, SVG, WebGL, `@remotion/noise`
- **Subtypes:**
  - **Cellular automata** -- Conway's Game of Life or similar rule-based grid evolution.
  - **Reaction-diffusion** -- Turing patterns: spots and stripes emerging from simple rules. Canvas pixel manipulation.
  - **Agent/boid simulation** -- Flocking, swarming behavior. Many agents following simple rules creating emergent patterns.
  - **Growth simulation** -- Diffusion-limited aggregation, crystal growth, root/branch growth.
  - **Sorting visualization** -- Array elements visualized as bars or colors, sorting algorithm animated step by step.

---

## 10. UI/UX Animation

Interface-level animations for web applications, demos, and interactive prototypes.

### 10.1 Micro-Interactions

Small, purposeful animations that provide feedback for user actions.

- **Inputs:** none (purely interface-driven)
- **Complexity:** simple
- **Programmatic?** fully
- **Tech Stack:** React/CSS, Framer Motion, GSAP (for web apps); Remotion (for recording/demo videos)
- **Subtypes:**
  - **Button hover/press** -- Scale, color shift, shadow change on interaction. Spring physics.
  - **Toggle switch** -- Sliding knob with color transition.
  - **Like/heart** -- Heart fills with color, scales up with spring bounce.
  - **Checkbox** -- Checkmark draws on with path animation.
  - **Tooltip appear** -- Tooltip fades/slides in near cursor.
  - **Notification badge** -- Number badge bounces in when count changes.
  - **Pull to refresh** -- Elastic pull indicator with loading spinner.

### 10.2 Page Transitions

Animated transitions between routes or views in web applications.

- **Inputs:** none (purely structural)
- **Complexity:** simple to moderate
- **Programmatic?** fully
- **Tech Stack:** React/CSS, Framer Motion (`AnimatePresence`), GSAP, View Transitions API
- **Subtypes:**
  - **Crossfade** -- Old page fades out, new page fades in.
  - **Slide** -- Pages slide horizontally or vertically.
  - **Shared element** -- An element (card, image) smoothly morphs from its position on page A to its position on page B.
  - **Expand/collapse** -- Clicked element expands to fill the screen, becoming the new page.
  - **Iris/circle wipe** -- Circle expands from click point to reveal new page.
  - **Stagger children** -- New page elements enter one at a time with staggered delays.

### 10.3 Loading / Progress Indicators

Animated states for data loading, processing, and progress.

- **Inputs:** none (purely procedural)
- **Complexity:** simple
- **Programmatic?** fully
- **Tech Stack:** React/CSS, SVG, Lottie
- **Subtypes:**
  - **Spinner** -- Rotating circle or dots. CSS `rotate` animation (or frame-driven in Remotion).
  - **Progress bar** -- Linear fill from left to right with optional percentage text.
  - **Skeleton screen** -- Gray placeholder shapes with shimmer animation. Gradient sweep via CSS.
  - **Pulsing dots** -- Three dots scaling up and down in sequence.
  - **Circular progress** -- SVG circle with `stroke-dashoffset` depleting.
  - **Branded loader** -- Company logo with a custom animation cycle.

### 10.4 Scroll-Driven Animations

Animations triggered or driven by scroll position, creating narrative web experiences.

- **Inputs:** text-only and images (content sections)
- **Complexity:** moderate to complex
- **Programmatic?** fully
- **Tech Stack:** CSS `scroll-timeline`, GSAP `ScrollTrigger`, Framer Motion scroll hooks, Intersection Observer API
- **Subtypes:**
  - **Fade on scroll** -- Elements fade in when they enter the viewport.
  - **Parallax scrolling** -- Background moves slower than content.
  - **Sticky sections** -- Content sections pin while internal elements animate, then unpin.
  - **Horizontal scroll** -- Vertical scroll drives horizontal movement of content.
  - **Progress indicator** -- Top bar fills based on scroll depth.
  - **Number count on scroll** -- Statistics count up when scrolled into view.
- **Notes:** Not applicable to Remotion (no scroll), but relevant for web apps and React-based experiences.

### 10.5 List / Grid Animations

Animated additions, removals, and reordering of items in lists and grids.

- **Inputs:** data/JSON (list items)
- **Complexity:** simple to moderate
- **Programmatic?** fully
- **Tech Stack:** React/CSS, Framer Motion (`AnimatePresence`, `layoutId`), GSAP FLIP
- **Subtypes:**
  - **Stagger enter** -- Items enter one at a time with delay. Spring or tween per item.
  - **Layout animation** -- Items smoothly reposition when order changes. `layout` prop in Framer Motion.
  - **Exit animation** -- Removed items fade/slide/shrink out before being unmounted.
  - **Masonry reflow** -- Grid items smoothly reorganize when screen size or content changes.
  - **Drag reorder** -- Items can be dragged to new positions with other items making space.

---

## Cross-Cutting Capabilities

These techniques can be combined with any of the above categories.

### Audio Integration

| Technique | Tech Stack | Notes |
|-----------|------------|-------|
| Background music | `@remotion/media` `<Audio>` | Simple file playback, synced to timeline |
| Sound effects | `@remotion/media` `<Audio>` in `<Sequence>` | Triggered at specific frames |
| Voiceover | `@remotion/media` `<Audio>` + caption sync | Can use ElevenLabs TTS for generation |
| Audio visualization | `@remotion/media-utils` | Frequency/waveform extraction |
| Beat sync | Manual or `visualizeAudio` bass extraction | Align visual beats to audio beats |

### Typography System

| Technique | Tech Stack | Notes |
|-----------|------------|-------|
| Google Fonts | `@remotion/google-fonts` | Dynamic loading, tree-shakeable |
| Custom fonts | `FontFace` API + `staticFile()` | WOFF2 from public folder |
| Variable fonts | CSS `font-variation-settings` | Weight/width/slant animation |
| Emoji/icon fonts | Direct rendering | Platform-dependent appearance |
| Text measurement | DOM `measureText()` or `@remotion/layout-utils` | For responsive text sizing |

### Color & Theming

| Technique | Tech Stack | Notes |
|-----------|------------|-------|
| HSL manipulation | JavaScript math | Procedural color generation |
| Gradient animation | CSS `linear-gradient` + `background-position` | Moving gradient backgrounds |
| Color interpolation | `interpolateColors()` from Remotion | Smooth transitions between colors |
| Dynamic theming | CSS custom properties | Runtime theme switching |
| Brand token system | Design token constants | Consistent cross-video branding |

---

## Complexity Matrix (Summary)

| Category | Simple | Moderate | Complex |
|----------|--------|----------|---------|
| **1. Motion Graphics** | Lower thirds, counters, fade transitions | Kinetic typography, particle systems, logo reveals | Complex particle physics, advanced shader transitions |
| **2. 2D Animation** | Sprite playback, basic tweens | Cutout animation, SVG morphing, Lottie integration | Rotoscope, complex character animation |
| **3. 3D Animation** | Pseudo-3D, isometric blocks | Map animations, CSS perspective | Full Three.js scenes, custom shaders |
| **4. Explainer** | Step-by-step, comparison | Diagram builds, code walkthroughs, whiteboard | Complex interactive diagram systems |
| **5. Social Media** | Quote cards, countdowns, announcements | Carousel generators, multi-format reels | Platform-adaptive multi-output pipelines |
| **6. Cinematic** | Ken Burns, letterbox, grain | Parallax, title sequences | Multi-layer composited title sequences |
| **7. Data Viz** | Bar charts, pie charts, counters | Line charts, infographics, dashboards | Racing bar charts, real-time simulations |
| **8. Brand/Marketing** | Testimonials, CTAs, pricing tables | Product showcases, feature tours | 3D product spins, interactive demos |
| **9. Abstract/Generative** | Geometric patterns, tessellations | Noise fields, fractals, audio-reactive | Agent simulations, reaction-diffusion, GPU shaders |
| **10. UI/UX** | Micro-interactions, loaders, spinners | Page transitions, scroll-driven, list animations | Shared element transitions, physics-based gestures |

---

## Automation Potential Matrix (Summary)

| Fully Programmatic (text/data in, video out) | Needs Minimal Assets | Needs Custom Creative |
|----------------------------------------------|---------------------|----------------------|
| Kinetic typography | Ken Burns (needs photos) | Frame-by-frame 2D animation |
| Lower thirds | Logo reveals (needs logo SVG) | Cutout character animation |
| Title cards | Product showcase (needs screenshots) | Rotoscope |
| All transitions | Parallax (needs layered images) | Full 3D scenes (needs models) |
| Data counters | Testimonials (needs headshots) | Complex illustration-based infographics |
| All chart types | Whiteboard (needs SVG drawings) | Lottie creation (needs After Effects) |
| Diagram builds | Social stories (needs photos/clips) | |
| Code walkthroughs | Brand animations (needs logo) | |
| Quote cards | | |
| Countdown timers | | |
| Noise/generative art | | |
| Audio-reactive visuals | | |
| All UI/UX animations | | |
| Pricing/feature tables | | |
| Map animations | | |

---

## Tech Stack Decision Tree

```
What are you building?
|
+-- Programmatic video (MP4/WebM output)?
|   |
|   +-- YES --> Remotion
|       |
|       +-- 3D content? --> @remotion/three + React Three Fiber
|       +-- Charts/data? --> SVG + D3.js + @remotion/paths
|       +-- Transitions? --> @remotion/transitions (fade, slide, wipe, flip, clockWipe)
|       +-- Light effects? --> @remotion/light-leaks
|       +-- Audio reactive? --> @remotion/media-utils
|       +-- Noise/organic? --> @remotion/noise
|       +-- Lottie assets? --> @remotion/lottie
|       +-- Maps? --> Mapbox GL JS + @turf/turf
|       +-- Text measurement? --> @remotion/layout-utils
|       +-- Path animation? --> @remotion/paths
|
+-- Web app animation (in-browser)?
|   |
|   +-- React component animation? --> Framer Motion (now "Motion")
|   +-- Complex timeline / SVG morph? --> GSAP
|   +-- Scroll-driven? --> GSAP ScrollTrigger or CSS scroll-timeline
|   +-- Physics-based? --> React Spring
|   +-- 3D interactive? --> React Three Fiber
|   +-- Simple transitions? --> CSS transitions/animations
|
+-- Static image generation?
    |
    +-- Branded templates? --> React + Puppeteer/Playwright screenshot
    +-- Charts? --> D3.js + SVG export
    +-- Diagrams? --> React + SVG
```

---

## Existing Project Inventory

Components and utilities already built across the two Remotion projects:

### remotion_video/ (Bharatvarsh pipeline)
| Component | Category | Style |
|-----------|----------|-------|
| `BharatvarshPost.tsx` | 1.3, 6.1, 6.3 | Multi-phase title sequence with Ken Burns, typewriter, stamp, film grain, vignette, scanline |
| `BharatvarshBackground.tsx` | 6.1, 6.3 | Ken Burns + film grain + vignette + surveillance grid + faction color tint |
| `BharatvarshSubtitle.tsx` | 1.1 | Animated subtitle overlay |
| `FilmGrain.tsx` | 6.3 | SVG feTurbulence grain overlay |
| `AIVideo.tsx` | 1.3 | Generic timeline-driven video with backgrounds, text, audio |
| `Background.tsx` | 6.1 | Ken Burns with blur transitions |
| `Subtitle.tsx` | 1.1 | Word-level subtitle display |
| `Word.tsx` | 1.1 | Individual word animation |

### aiu-youtube/remotion_aiu/ (AI&U pipeline)
| Component | Category | Style |
|-----------|----------|-------|
| `LowerThird.tsx` | 1.2 | Pillar-accented slide-in name/title |
| `IntroSting.tsx` | 6.5 | Channel intro animation |
| `LogoIntro.tsx` | 1.5 | Logo reveal |
| `ProgressBar.tsx` | 10.3 | Linear progress indicator |
| `Watermark.tsx` | 8.5 | Persistent brand mark |
| `ChapterCard.tsx` | 1.3 | Chapter title card |
| `CalloutHighlight.tsx` | 4.4 | Annotation callout |
| `StatCard.tsx` | 1.6 | Animated statistic display |
| `TextPunch.tsx` | 1.1 | Bold text emphasis animation |
| `SubtitleOverlay.tsx` | 1.1 | Subtitle display system |
| `ComparisonChart.tsx` | 4.5 | Before/after comparison |
| `EndScreen.tsx` | 8.4 | CTA end card |
| `ProcessFlow.tsx` | 4.2 | Animated horizontal node chain |
| `BRollDrop.tsx` | 6.2 | B-roll overlay with depth |
| `CodeBlock.tsx` | 4.3 | Syntax-highlighted code display |
| `KeyTermCard.tsx` | 4.4 | Term explainer card |
| `PillarBadge.tsx` | 8.5 | Content pillar indicator |
| `HighlightBox.tsx` | 4.4 | Key point highlight |
| `ExperienceOrbit.tsx` | 9.3 | Orbital diagram |
| `PersonaBadge.tsx` | 8.5 | User persona indicator |
| `StepNotification.tsx` | 4.4 | Step notification card |
| `SolutionEngineCard.tsx` | 4.2 | Solution display card |
| `GuardrailsRiskCard.tsx` | 7.4 | Risk metric card |
| `InternPunch.tsx` | 1.1 | Bold statement animation |
| `VideoRoadmap8Bit.tsx` | 3.2 | 8-bit isometric roadmap |
| `FiveStepRoadmap.tsx` | 4.2 | Five-step process diagram |
| `DeploymentLanes.tsx` | 4.2 | Deployment lane diagram |
| `ExplorerToolkit.tsx` | 4.2 | Toolkit showcase diagram |
| `VillageBuilder.tsx` | 4.2 | Village metaphor diagram |
| `PersonaGateway.tsx` | 4.2 | Persona routing diagram |
| `PainPointsBusiness.tsx` | 4.2 | Business pain point visualization |
| `PixelCharacters.tsx` | 2.1 | Pixel art characters |

### Utility Libraries
| Utility | Purpose |
|---------|---------|
| `noise.ts` | Perlin noise (2D/3D), floating offset, hue shift, noise grid generation |
| `animations.ts` | Spring configs (smooth, fast, bouncy), stagger utilities |
| `transitions.ts` | Scene transition helpers |
| `colors.ts` | Pillar color system, opacity utilities, glow generation |
| `shapes.ts` | Geometric shape utilities |
| `motion-blur.ts` | Motion blur simulation |
| `audio.ts` | Audio processing utilities |
| `fonts.ts` | Font loading and family constants |

---

## Sources

- [Remotion Official Site](https://www.remotion.dev/)
- [Remotion: Create Videos Programmatically with React - YUV.AI](https://yuv.ai/blog/remotion)
- [Claude Code Video with Remotion: Best Motion Guide 2026 - dplooy](https://www.dplooy.com/blog/claude-code-video-with-remotion-best-motion-guide-2026)
- [Motion Graphics for Developers: Remotion, Skills and AI Agents - Tekkix](https://tekkix.com/articles/ai/2026/02/motion-graphics-for-developers-remotion-skill)
- [SVG vs Canvas Animation: Best Choice for Modern Frontends - AugustInfoTech](https://www.augustinfotech.com/blogs/svg-vs-canvas-animation-what-modern-frontends-should-use-in-2026/)
- [The Complete SVG Animation Encyclopedia 2025 - SVG AI](https://www.svgai.org/blog/research/svg-animation-encyclopedia-complete-guide)
- [A Comparison of Animation Technologies - CSS-Tricks](https://css-tricks.com/comparison-animation-technologies/)
- [Comprehensive Guide to Animation 2025 - ERIC KIM](https://erickimphotography.com/comprehensive-guide-to-animation-2025-edition/)
- [2025 Animation Trends: 7 Types You Need to Master - Meshy](https://www.meshy.ai/blog/types-of-animation)
- [16 Animation Trends to Watch in 2025 - GarageFarm](https://garagefarm.net/blog/16-animation-trends-to-watch-in-2025-key-insights)
- [Motion UI Trends 2026: Interactive Design - Loma Technology](https://lomatechnology.com/blog/motion-ui-trends-2026/2911)
- [CSS/JS Animation Trends 2026: Motion and Micro-Interactions - WebPeak](https://webpeak.org/blog/css-js-animation-trends/)
- [Top React Animation Libraries 2025 - DronaHQ](https://www.dronahq.com/react-animation-libraries/)
- [React Three Fiber Introduction](https://r3f.docs.pmnd.rs/getting-started/introduction)
- [From Flat to Spatial: 3D Product Grid with React Three Fiber - Codrops](https://tympanus.net/codrops/2026/02/24/from-flat-to-spatial-creating-a-3d-product-grid-with-react-three-fiber/)
- [Kinetic Image Animations with React Three Fiber - Codrops](https://tympanus.net/codrops/2025/07/09/how-to-create-kinetic-image-animations-with-react-three-fiber/)
- [Web-Based Generative Art - DEV Community](https://dev.to/okoye_ndidiamaka_5e3b7d30/web-based-generative-art-how-algorithms-are-transforming-creativity-33m4)
- [Awesome Creative Coding - GitHub](https://github.com/terkelg/awesome-creative-coding)
- [D3.js Official](https://d3js.org/)
- [15 Best Whiteboard Explainer Videos 2025 - B2W](https://www.b2w.tv/blog/top-whiteboard-explainer-videos)
- [Types of Product Animation That Boost Engagement 2025 - Hatch Studios](https://hatchstudios.com/types-of-product-animation-that-boost-engagement-2025/)
- [react-kino: Cinematic Scroll-Driven Storytelling for React - GitHub](https://github.com/btahir/react-kino)
