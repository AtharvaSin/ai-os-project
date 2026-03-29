# Video Production — Component Catalog

> Auto-generated index of all components in the video-production system.
> Last updated: 2026-03-27

---

## Common Library (`src/common/`)

Shared, brand-agnostic building blocks. Every component accepts `BrandTokens` as a prop (or is a pure utility module). No hardcoded colors or fonts.

### Effects (`src/common/effects/`)

| Component | File | Props | Description |
|-----------|------|-------|-------------|
| FilmGrain | effects/FilmGrain.tsx | `baseFrequency?` (0.65), `opacity?` (0.06), `numOctaves?` (3), `zIndex?` (100) | SVG feTurbulence grain overlay with per-frame seed rotation |
| Vignette | effects/Vignette.tsx | `opacity?` (0.4), `color?` (rgba), `zIndex?` (12) | Radial gradient edge darkening |
| ScanLines | effects/ScanLines.tsx | `opacity?` (0.02), `lineSpacing?` (4), `animated?` (true), `scrollSpeed?` (60), `zIndex?` (95) | Horizontal CRT/surveillance scan lines with optional scroll animation |
| GlowPulse | effects/GlowPulse.tsx | `color`, `intensity?` (0.3), `pulseDuration?` (45), `size?` (60), `zIndex?` (5) | Animated radial glow with sinusoidal intensity pulsing |
| NoiseTexture | effects/NoiseTexture.tsx | _(utility module)_ | Perlin noise functions: `smoothNoise`, `animatedNoise`, `floatingOffset`, `hueShift`. Re-exports `noise2D`, `noise3D` from `@remotion/noise` |
| MotionBlur | effects/MotionBlur.tsx | _(presets module)_ | Re-exports `CameraMotionBlur`, `Trail` from `@remotion/motion-blur`. Presets: light, standard, heavy, cinematic |

### Typography (`src/common/typography/`)

| Component | File | Props | Description |
|-----------|------|-------|-------------|
| TypewriterText | typography/TypewriterText.tsx | `text`, `tokens`, `speed?` (50ms), `showCursor?` (true), `fontSize?`, `useDisplayFont?` | Character-by-character reveal with blinking cursor |
| TextPunch | typography/TextPunch.tsx | `text`, `tokens`, `delay?` (0), `autoSize?` (true) | Full-screen slam-in impact text (1.8x to 1x scale with heavy damping) |
| WordReveal | typography/WordReveal.tsx | `text`, `tokens`, `startDelay?` (0), `wordDelay?` (4), `fontSize?` | Staggered word-by-word spring fade-up entrance |
| CountUp | typography/CountUp.tsx | `target`, `tokens`, `delay?` (0), `prefix?`, `suffix?`, `decimals?` (0), `fontSize?` | Animated number counter with tabular-nums formatting |
| KaraokeSubtitle | typography/KaraokeSubtitle.tsx | `groups` (SubtitleGroup[]), `tokens`, `fontSize?`, `bottomOffset?` (120) | Word-by-word highlighted subtitle overlay with active word accent |

### Layout (`src/common/layout/`)

| Component | File | Props | Description |
|-----------|------|-------|-------------|
| SafeArea | layout/SafeArea.tsx | `children`, `margin?` (5%) | Platform-safe margins wrapper using percentage padding |
| AccentBar | layout/AccentBar.tsx | `color`, `width?` (80), `height?` (4), `delay?` (0), `animated?` (true) | Animated accent bar with spring width reveal |
| LetterboxBars | layout/LetterboxBars.tsx | `aspectRatio?` (2.35), `animated?` (false), `delay?` (0), `color?` (#000) | Cinematic black bars for any target aspect ratio |
| ProgressBar | layout/ProgressBar.tsx | `color`, `height?` (3), `position?` ('bottom'), `zIndex?` (90) | Video progress indicator bar tracking playback position |
| Watermark | layout/Watermark.tsx | `text?`, `imageSrc?`, `position?` ('bottom-right'), `opacity?` (0.3), `size?` (14), `fontFamily?`, `color?` | Corner logo or text watermark |

### Data Visualization (`src/common/data-viz/`)

| Component | File | Props | Description |
|-----------|------|-------|-------------|
| StatCard | data-viz/StatCard.tsx | `value`, `label`, `tokens`, `delay?` (0), `prefix?`, `suffix?`, `decimals?` | Animated metric card with CountUp, AccentBar, and spring scale entrance |

### Media (`src/common/media/`)

| Component | File | Props | Description |
|-----------|------|-------|-------------|
| KenBurnsImage | media/KenBurnsImage.tsx | `src`, `direction?` ('in'), `maxScale?` (1.2), `pan?` ('up'), `panDistance?` (15) | Slow zoom and pan on static image with configurable direction |

### Animations (`src/common/animations/`) — Utility Modules

| Module | Exports | Description |
|--------|---------|-------------|
| springs.ts | `SPRING_CONFIGS` (fast, smooth, bouncy, impact, cinematic), `useSpring(options)` hook | Reusable spring physics presets and a hook returning 0-to-1 spring value |
| easing.ts | `EASING` (enter, exit, move, snap, overshoot) | Custom easing curves built on Remotion's `Easing` primitives |
| interpolations.ts | `useSlideIn`, `useScaleIn`, `useFadeIn`, `useSlamIn` | Higher-level animation hooks returning transform + opacity values |
| sequencing.ts | `staggerDelay`, `staggeredDuration`, `staggerDelays` | Helpers for calculating staggered entrance timing |

### Transitions (`src/common/transitions/`) — Utility Modules

| Module | Exports | Description |
|--------|---------|-------------|
| presets.ts | `fadeTransition`, `slideTransition`, `wipeTransition`, `flipTransition`, `clockWipeTransition` | Pre-configured scene transitions using `@remotion/transitions` |
| durations.ts | `TRANSITION_DURATION` (quick: 9f, standard: 15f, slow: 30f, cinematic: 45f) | Standardized transition length constants at 30fps |

### Utilities (`src/common/utils/`) — Utility Modules

| Module | Exports | Description |
|--------|---------|-------------|
| brand-tokens.ts | `BrandTokens` interface, `DEFAULT_FONT_SIZES` | Universal brand contract accepted by all common components |
| audio.ts | `createVolumeEnvelope`, `MusicTrackConfig`, `SpeechSegment` | Volume envelope generation with fade-in/out and speech ducking |
| colors.ts | `withOpacity`, `glowShadow`, `accentBarStyle` | Brand-neutral color manipulation (hex to rgba, glow shadows) |
| fonts.ts | `SHARED_FONTS`, `loadSharedFonts` | Google Fonts loading via `@remotion/google-fonts` (Inter, JetBrains Mono) |
| subtitles.ts | `groupSubtitles`, `getActiveGroup`, `getActiveWordIndex`, `SubtitleWord`, `SubtitleGroup` | Word-level subtitle grouping for karaoke-style overlays |
| timing.ts | `DEFAULT_FPS`, `secondsToFrames`, `framesToSeconds`, `msToFrames`, `framesToMs`, `calculateFrameTiming` | Frame/second/millisecond conversion helpers |

---

## Project: Bharatvarsh (`src/projects/bharatvarsh/`) — 22 components

Context B brand: obsidian backgrounds, mustard gold accent, Bebas Neue display font, Jim Lee comic art style, film grain + vignette effects.

### Core Components

| Component | File | Description |
|-----------|------|-------------|
| BharatvarshBackground | BharatvarshBackground.tsx | Extends base background with film grain (6% opacity), vignette, story-angle faction color tint, and Ken Burns animation |
| BharatvarshEndCard | BharatvarshEndCard.tsx | Lead-generation end card with CTA URL, obsidian background, surveillance grid, mustard accent bar, faction glow stripe |
| BharatvarshIntro | BharatvarshIntro.tsx | Channel-specific intro card with three visual modes: declassified_report (stamp flicker), graffiti_photo (atmospheric fade), news_article (BVN-24x7 masthead) |
| BharatvarshSubtitle | BharatvarshSubtitle.tsx | Branded text overlay with Bebas Neue (short phrases) or Crimson Pro (narrative), mustard accent line, spring entrance |
| BharatvarshVideo | BharatvarshVideo.tsx | Main composition assembling intro, content slides, and end card. Supports all three content channels |

### Compositions

| Component | File | Description |
|-----------|------|-------------|
| BharatvarshPost | compositions/BharatvarshPost.tsx | Static branded post composition with Context B typography (Bebas Neue, Crimson Pro, Inter, JetBrains Mono) |
| BracecommReel | compositions/BracecommReel.tsx | BHV-20260427-001: 10s product-reveal reel with Apple keynote energy, 5 scenes, Bharatsena palette, two-layer audio |
| BracecommReelV2 | compositions/BracecommReelV2.tsx | V2 exploded-view reel: assembled device teardown, component callouts, stats overlay, keyword highlighting |
| TridentSurveillance | compositions/TridentSurveillance.tsx | BHV-20260415-001: 10s surveillance tape aesthetic (4:5), CCTV timestamp, trident reveal, Tribhuj palette |
| TridentSurveillanceReel | compositions/TridentSurveillanceReel.tsx | 8s 9:16 reel variant using Jim Lee illustration as background, CCTV HUD overlay, cinematic text reveals |

### Seven Cities Series (`compositions/seven-cities/`)

| Component | File | Description |
|-----------|------|-------------|
| SevenCitiesReel | seven-cities/SevenCitiesReel.tsx | BHV-20260503-001: 18s master composition for BVN-24x7 breaking news broadcast, orientation-aware (9:16 and 16:9) |
| BVNLogo | seven-cities/BVNLogo.tsx | Scene 1 standby: obsidian + CRT scanline overlay, logo reveal with particle burst |
| BreakingBanner | seven-cities/BreakingBanner.tsx | Scene 2 red banner wipe with "BREAKING" text animation |
| NationalMap | seven-cities/NationalMap.tsx | Scene 2 centrepiece: India outline map with cyan wireframe look and animated city dots |
| ChyronBar | seven-cities/ChyronBar.tsx | Lower-third navy bar with mustard accent stripe, spring slide-up, orientation-aware positioning |
| DustParticles | seven-cities/DustParticles.tsx | Floating dust/debris SVG particles with deterministic sin/cos oscillation and staggered lifecycles |
| WarRoomOverlay | seven-cities/WarRoomOverlay.tsx | Seven city monitoring console panels with sequential activation and status readouts |
| SceneTransition | seven-cities/SceneTransition.tsx | Quick black-dip transition overlay ramping to 0.8 opacity at midpoint |
| ScrollingTicker | seven-cities/ScrollingTicker.tsx | Bottom ticker bar with continuous scrolling marquee of breaking news headlines (3x text for seamless loop) |
| TridentDrawOn | seven-cities/TridentDrawOn.tsx | Scene 5: trident spray-paint simulation via stroke-dashoffset SVG animation |
| HookLockup | seven-cities/HookLockup.tsx | Scene 6: end card with surveillance grid, question hook, CTA URL |
| BrandOverlay | seven-cities/BrandOverlay.tsx | Global film grain + vignette overlay for broadcast texture |

---

## Project: AI&U (`src/projects/aiu/`) — 63 components

Context C/D brand: dark educational theme, amber/pillar-colored accents, Space Grotesk display font, Fireship-inspired pacing.

### Components (`components/`)

| Component | File | Description |
|-----------|------|-------------|
| BRollDrop | components/BRollDrop.tsx | Image/meme flash overlay with scale-pop entrance (0.8 to 1.0) and rotation correction |
| CalloutHighlight | components/CalloutHighlight.tsx | SVG-based annotations (circle, arrow, box, underline) with stroke-dashoffset draw-on effect |
| ChapterCard | components/ChapterCard.tsx | Full-screen section transition with chapter number, mini-promise title, pillar gradient strip |
| CodeBlock | components/CodeBlock.tsx | Syntax-highlighted code display with line-by-line reveal and optional file name tab |
| ComparisonChart | components/ComparisonChart.tsx | Side-by-side comparison in two modes: horizontal bars or cards with staggered spring entrance |
| EndScreen | components/EndScreen.tsx | CTA + Subscribe + Next Video: two-column layout with video preview and subscribe button |
| ExperienceOrbit | components/ExperienceOrbit.tsx | Animated credential badges orbiting creator avatar in pseudo-3D elliptical path |
| GuardrailsRiskCard | components/GuardrailsRiskCard.tsx | Semi-transparent warning overlay showing 4 AI risks with pulsing dots |
| HighlightBox | components/HighlightBox.tsx | Bordered card with title and staggered bullet points for disclaimers and key callouts |
| InternPunch | components/InternPunch.tsx | 16-bit "AI Intern" pixel art character overlay with speech bubble and trait highlights |
| IntroSting | components/IntroSting.tsx | 2-3 second branded opening with logo spring, glow pulse, accent line sweep |
| KeyTermCard | components/KeyTermCard.tsx | Notification-style keyword explainer overlay in top corner for longform videos |
| LogoIntro | components/LogoIntro.tsx | 5-second channel bumper: three pillar-colored energy orbs converge, flash, reveal wordmark |
| LowerThird | components/LowerThird.tsx | Name and title overlay: left-aligned dark card with pillar accent bar, spring slide-in/out |
| PersonaBadge | components/PersonaBadge.tsx | Compact persona overlay badge with pixel portrait, title, and descriptor. Entrance + settle animation |
| PillarBadge | components/PillarBadge.tsx | Pill-shaped badge showing pillar name with accent color background (sm, md, lg sizes) |
| ProcessFlow | components/ProcessFlow.tsx | Animated horizontal node chain with staggered spring entrance and arrow draw-on connections |
| ProgressBar | components/ProgressBar.tsx | Thin horizontal bar with pillar-colored fill and glow at the fill end |
| SolutionEngineCard | components/SolutionEngineCard.tsx | Compact overlay card for solution engines with pixel art icon, title, description |
| StatCard | components/StatCard.tsx | Data point overlay with large value, label, source attribution, pillar accent top border |
| StepNotification | components/StepNotification.tsx | Semi-transparent step announcement card for framework step transitions |
| SubtitleOverlay | components/SubtitleOverlay.tsx | Word-level animated subtitles (karaoke style) with active word pillar accent highlight |
| TextPunch | components/TextPunch.tsx | Bold text statement flash: full-screen centered impact text with slam-in animation |
| Watermark | components/Watermark.tsx | Always-on AI&U logo watermark at low opacity in bottom-right corner |

### Tool Animations (`components/tool-animations/`)

| Component | File | Description |
|-----------|------|-------------|
| ToolChatGPT | tool-animations/ToolChatGPT.tsx | "The Enterprise Vault": 4s looping animation with hexagonal security shield assembly |
| ToolCopilot | tool-animations/ToolCopilot.tsx | "The Copilot Constellation": 4s loop with 6 Microsoft app icons orbiting in 3D ellipse |
| ToolCopilotStudio | tool-animations/ToolCopilotStudio.tsx | "The Custom Workshop": 4s loop with assembly ring of knowledge docs and connectors |
| ToolGemini | tool-animations/ToolGemini.tsx | "The Gemini Weave": 4s loop with Google-colored thread weaving through 6 product icons |
| ToolLogos | tool-animations/ToolLogos.tsx | Accurate inline SVG logo components for all AI tool brand marks |
| ToolWorkflowBuilders | tool-animations/ToolWorkflowBuilders.tsx | "The Node Graph": 4s loop with node-based workflow diagram and data packet animation |

### Video 2 Diagrams (`components/video2-diagrams/`)

| Component | File | Description |
|-----------|------|-------------|
| DeploymentLanes | video2-diagrams/DeploymentLanes.tsx | 8-bit pixel art highway with 3 AI deployment lanes (Personal, Workspace, Hybrid) and pixel vehicles |
| ExplorerToolkit | video2-diagrams/ExplorerToolkit.tsx | Cave-based 8-bit pixel art: G03 explorer discovers 5 magical AI tools as glowing cave etchings |
| FiveStepRoadmap | video2-diagrams/FiveStepRoadmap.tsx | Vertical roadmap infographic: numbered waypoints with spring-in content cards for each step |
| PainPointsBusiness | video2-diagrams/PainPointsBusiness.tsx | "The Corporate Gauntlet": dark 2x2 grid of pixel-art stations depicting business pain points |
| PersonaGateway | video2-diagrams/PersonaGateway.tsx | RPG "Character Select" intro screen: 4 glowing podiums with silhouette reveals over 14s |
| PixelCharacters | video2-diagrams/PixelCharacters.tsx | 16-bit pixel art character sprites built from absolutely-positioned div rectangles |
| VideoRoadmap8Bit | video2-diagrams/VideoRoadmap8Bit.tsx | Mario-style side-scrolling pixel art roadmap with walking explorer and 4 milestone signposts |
| VillageBuilder | video2-diagrams/VillageBuilder.tsx | 8-bit pixel art village that grows with 5 buildings representing AI impact areas |

### Compositions (`compositions/`)

| Component | File | Description |
|-----------|------|-------------|
| AIUDisclaimerCard | compositions/AIUDisclaimerCard.tsx | "Before We Begin" card with 3 disclaimer bullets, amber border draw, spring entrance |
| AIUIntroSting | compositions/AIUIntroSting.tsx | Branded 3-second channel intro: staggered "AI" / "&" / "U" spring-in, tagline word fade-up |
| AIULongForm | compositions/AIULongForm.tsx | Main long-form video assembler reading input.json: IntroSting, ChapterCards, Scenes, EndScreen |
| AIULowerThird | compositions/AIULowerThird.tsx | Name/title overlay card for face cam with typewriter name reveal and subtitle fade |
| AIUShort | compositions/AIUShort.tsx | YouTube Shorts (1080x1920 vertical) reframing with hook text, pillar badge, subtitles, end CTA |
| AIUTest | compositions/AIUTest.tsx | Hello World test composition verifying brand tokens, fonts, logo, pillar colors, and animations |
| AIUThumbnail | compositions/AIUThumbnail.tsx | Thumbnail composition router (1280x720 still) dispatching to BigPromise, BeforeAfter, or WorkflowDiagram |
| AIUVideoRoadmap | compositions/AIUVideoRoadmap.tsx | "What We'll Cover Today" agenda with vertical timeline and 4 spring-in stops |
| TestCompositions | compositions/TestCompositions.tsx | One-per-component test compositions for visual verification in Remotion Studio |
| Video2ExperienceOrbit | compositions/Video2ExperienceOrbit.tsx | Render-ready 13.5s ExperienceOrbit composition for DaVinci Resolve import |
| Video2Part3 | compositions/Video2Part3.tsx | Part 3 "The Tool-First Trap": B-roll with KeyTermCard overlay |
| Video2Part4 | compositions/Video2Part4.tsx | Part 4: Chapter Card + 5-Step Roadmap standalone compositions (no video elements) |
| Video2Part5 | compositions/Video2Part5.tsx | Part 5: Step 1 and Step 2 deep-dive with facecam, StepNotification overlays, blur effects |
| Video2Part6 | compositions/Video2Part6.tsx | Part 6: Steps 3, 4, and 5 deep-dive as four independently-rendered segments |
| Video2Part7 | compositions/Video2Part7.tsx | Part 7: Business Professional Persona with 13 independently-rendered compositions |
| Video2Part7Composite | compositions/Video2Part7Composite.tsx | Part 7 composite: single render-ready composition with embedded B-roll and all S7 graphics |
| Video2Section1 | compositions/Video2Section1.tsx | Section 1 render-ready compositions with assigned background music for DaVinci Resolve |

### Scenes (`scenes/`)

| Component | File | Description |
|-----------|------|-------------|
| BRollScene | scenes/BRollScene.tsx | Visual insert scene with 4 animation presets: ken_burns, slide_in, fade, flash. Optional text overlay and karaoke subtitles |
| DiagramScene | scenes/DiagramScene.tsx | Full-screen diagram overlay with optional voiceover audio and karaoke subtitles |
| FacecamScene | scenes/FacecamScene.tsx | Full-frame facecam with optional LowerThird, SubtitleOverlay, graphic overlays, Watermark |
| FullScreenTextScene | scenes/FullScreenTextScene.tsx | Full-frame text cards with 4 style variants: statements, rhetorical questions, numbered rules, myth-busting |
| overlayRenderer | scenes/overlayRenderer.tsx | Centralized helper mapping GraphicOverlay types to their React components |
| ScreenRecScene | scenes/ScreenRecScene.tsx | Screen recording with smooth zoom transitions, CalloutHighlight annotations, optional PIP facecam |
| SplitScreenScene | scenes/SplitScreenScene.tsx | Side-by-side layout: 40% facecam + 60% screen recording with pillar accent divider |

### Thumbnails (`thumbnails/`)

| Component | File | Description |
|-----------|------|-------------|
| BeforeAfter | thumbnails/BeforeAfter.tsx | Template B: split layout with desaturated "BEFORE" and pillar-glow "AFTER", center arrow |
| BigPromise | thumbnails/BigPromise.tsx | Template A: face image left, 2-4 word claim text right with pillar accent underline |
| WorkflowDiagram | thumbnails/WorkflowDiagram.tsx | Template C: 3-5 connected nodes with one highlighted active node (1280x720) |

---

## Project: AI OS (`src/projects/ai-os/`) — 1 component

Context A brand: command-center dark theme, electric accents, DM Sans/Space Grotesk typography.

| Component | File | Description |
|-----------|------|-------------|
| AIOSRepoIntro | ai-os/AIOSRepoIntro.tsx | AI OS repository introduction clip with Space Grotesk typography and AI&U color palette |

---

## Statistics

| Category | Count |
|----------|-------|
| **Common library** | 18 components (6 effects, 5 typography, 5 layout, 1 data-viz, 1 media) |
| **Common utilities** | 4 animation modules + 2 transition modules + 6 utility modules |
| **Bharatvarsh** | 22 project-specific (5 core + 5 compositions + 12 seven-cities) |
| **AI&U** | 63 project-specific (24 components + 6 tool-animations + 8 video2-diagrams + 15 compositions + 7 scenes + 3 thumbnails) |
| **AI OS** | 1 project-specific |
| **Total** | **106 components** (18 common + 88 project-specific) |

---

## CLI Tools

| Command | Script | Description |
|---------|--------|-------------|
| `npm run catalog` | `tsx cli/catalog.ts` | List all registered components across projects |
| `npm run new-video` | `tsx cli/new-video.ts` | Scaffold new video workspace (creates brief.md, assets/, components/, renders/) |
| `npm run graduate` | `tsx cli/graduate.ts` | Promote a workspace component to `src/common/` |
| `npm run render` | `tsx cli/render.ts` | Render a specific composition to file |

---

## Engine Modules (`src/engine/`)

| Module | Description |
|--------|-------------|
| brand-resolver.ts | Resolves BrandTokens from project configuration |
| project-config.ts | Parses and validates project.yaml files |
| registry.ts | Composition registry for cross-project discovery |
| timeline-loader.ts | Loads and validates video timeline definitions |
