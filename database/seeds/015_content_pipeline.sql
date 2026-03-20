-- Seed: 015_content_pipeline
-- Description: Seeds Arc 1 "Welcome to the Mesh" content posts (30 posts)
-- Database: ai_os (on bharatvarsh-db)
-- Created: 2026-03-21
-- Purpose: Populate the content_posts table with all 30 posts from Arc 1 of the
--          Bharatvarsh social media campaign. Each post enters the pipeline in
--          'planned' status. Art prompts and model routing are NULL — they will be
--          populated from arc1_post_prompts.json via the pipeline API later.
--          A corresponding content_pipeline_log entry is created for each post to
--          record the initial 'status_change' event (NULL -> planned).

BEGIN;

-- =============================================================================
-- ARC 1 — WELCOME TO THE MESH (30 posts, 2026-04-06 to 2026-05-16)
-- =============================================================================

-- Post 1: The Mesh introduction
INSERT INTO content_posts (
    post_id, campaign, content_pillar, topic, hook, lore_refs, classified_status,
    channels, caption_text, visual_direction,
    art_prompt, model_routing, source_image_path, render_manifest, style_overrides, social_post_ids,
    scheduled_date, scheduled_time, target_audience, hashtags, cta_type, cta_link, status
) VALUES (
    'BHV-20260406-001',
    'arc1-welcome-to-the-mesh',
    'mesh_intel',
    'The Mesh — introduction',
    'I process 1.2 billion facial scans daily. Welcome to Bharatvarsh.',
    'Bible:Technology:TheMesh',
    'declassified',
    ARRAY['instagram','twitter','facebook'],
    'Status: OPERATIONAL. I process 1.2 billion facial scans daily. I know your route before you choose it. I am the Mesh. And I am here for your safety. Welcome to Bharatvarsh.',
    'Jim Lee style — abstract Mesh network visualization over dark obsidian cityscape. Blue-white light grid with data nodes pulsing at intersections. Facial recognition frames on pedestrians below. Dense hatching and cross-hatching on architecture. Heavy blacks with sharp white highlights. Cinematic wide shot.',
    NULL, NULL, NULL, NULL, NULL, NULL,
    '2026-04-06', '10:00',
    'A,B',
    '#Bharatvarsh #TheMesh #SurveillanceState #IndianSciFi #AlternateHistory',
    'none', NULL,
    'planned'
);

-- Post 2: OxyPoles — clean air and hidden sensors
INSERT INTO content_posts (
    post_id, campaign, content_pillar, topic, hook, lore_refs, classified_status,
    channels, caption_text, visual_direction,
    art_prompt, model_routing, source_image_path, render_manifest, style_overrides, social_post_ids,
    scheduled_date, scheduled_time, target_audience, hashtags, cta_type, cta_link, status
) VALUES (
    'BHV-20260408-001',
    'arc1-welcome-to-the-mesh',
    'mesh_intel',
    'OxyPoles — clean air and hidden sensors',
    'The OxyPoles scrub the air. They also house my secondary sensor arrays.',
    'Bible:Technology:OxyPoles,Bible:World:StateControl',
    'declassified',
    ARRAY['instagram','twitter'],
    'Atmospheric Report: Air quality 99.7% purity. The OxyPoles scrub 14000 cubic metres per minute. They also house my secondary sensor arrays. Clean air is a service. I provide it.',
    'Jim Lee tech close-up — towering metallic OxyPole against obsidian night sky. Glowing blue-white top section. Mughal geometric jali patterns etched into metalwork. Dense cross-hatching on metal surfaces. Heavy blacks balanced with sharp white highlights from the glow. Camera length 50mm heroic close-up.',
    NULL, NULL, NULL, NULL, NULL, NULL,
    '2026-04-08', '10:00',
    'A,B,C',
    '#Bharatvarsh #OxyPoles #WorldBuilding #DystopianFiction #IndianSciFi',
    'none', NULL,
    'planned'
);

-- Post 3: Blind spots question
INSERT INTO content_posts (
    post_id, campaign, content_pillar, topic, hook, lore_refs, classified_status,
    channels, caption_text, visual_direction,
    art_prompt, model_routing, source_image_path, render_manifest, style_overrides, social_post_ids,
    scheduled_date, scheduled_time, target_audience, hashtags, cta_type, cta_link, status
) VALUES (
    'BHV-20260409-001',
    'arc1-welcome-to-the-mesh',
    'flagged_query',
    'Blind spots question',
    'If the cameras kept you safe would you miss the blind spots?',
    'Bible:Themes:SurveillanceVsFreedom',
    'declassified',
    ARRAY['twitter','instagram','facebook'],
    'Citizen query logged: "If the cameras kept you safe, would you miss the blind spots?" Analysis: Irrelevant. There are no blind spots.',
    'Atmospheric dark obsidian gradient. Faint surveillance grid pattern barely visible. Minimal detail in centre for text readability. Subtle mustard gold light bleeding from one edge. Photorealistic atmospheric with slight film grain texture.',
    NULL, NULL, NULL, NULL, NULL, NULL,
    '2026-04-09', '12:00',
    'B,C',
    '#Bharatvarsh #TheQuestion #Surveillance #DystopianFiction #WouldYou',
    'none', NULL,
    'planned'
);

-- Post 4: Checkpoints — children process faster
INSERT INTO content_posts (
    post_id, campaign, content_pillar, topic, hook, lore_refs, classified_status,
    channels, caption_text, visual_direction,
    art_prompt, model_routing, source_image_path, render_manifest, style_overrides, social_post_ids,
    scheduled_date, scheduled_time, target_audience, hashtags, cta_type, cta_link, status
) VALUES (
    'BHV-20260410-001',
    'arc1-welcome-to-the-mesh',
    'mesh_intel',
    'Checkpoints — children process faster',
    'Algorithmic checkpoint deployment. Children process faster. They don''t hesitate.',
    'Bible:World:Checkpoints,Bible:Themes:NormalizedOppression',
    'declassified',
    ARRAY['twitter','facebook'],
    'Compliance Note: Algorithmic checkpoint deployment at Sector 7 Boulevard. Average citizen transit time: 4.2 seconds. Children process faster. They don''t hesitate.',
    'Jim Lee environment wide shot — Oxy Pole Boulevard with children walking through checkpoint. Beautiful but unsettling. Surveillance cameras embedded in lamp posts. Blue-white purification light from OxyPole tops. Dynamic perspective with foreshortened boulevard vanishing point. Dense linework on architecture. Cinematic establishing shot.',
    NULL, NULL, NULL, NULL, NULL, NULL,
    '2026-04-10', '10:00',
    'A,B',
    '#Bharatvarsh #NormalizedControl #DystopianFiction #IndianSciFi #Checkpoints',
    'none', NULL,
    'planned'
);

-- Post 5: The Mesh at night — curfew protocols
INSERT INTO content_posts (
    post_id, campaign, content_pillar, topic, hook, lore_refs, classified_status,
    channels, caption_text, visual_direction,
    art_prompt, model_routing, source_image_path, render_manifest, style_overrides, social_post_ids,
    scheduled_date, scheduled_time, target_audience, hashtags, cta_type, cta_link, status
) VALUES (
    'BHV-20260411-001',
    'arc1-welcome-to-the-mesh',
    'mesh_intel',
    'The Mesh at night — curfew protocols',
    'The city sleeps. I do not. Every breath catalogued. Every step mapped.',
    'Bible:Technology:TheMesh',
    'declassified',
    ARRAY['instagram'],
    'Night cycle engaged. Curfew protocols active. The city sleeps. I do not. Every breath catalogued. Every step mapped. Every dream... outside my jurisdiction. For now.',
    'Jim Lee nightscape — Lakshmanpur industrial district. Blue scanner glow sweeping empty wet streets. Smokestacks mixing with surveillance towers. Heavy blacks dominating composition. Rim lighting on building edges. Reflective wet street surfaces with dense hatching. Cinematic noir atmosphere.',
    NULL, NULL, NULL, NULL, NULL, NULL,
    '2026-04-11', '20:00',
    'A,B',
    '#Bharatvarsh #TheMesh #Curfew #NightWatch #IndianSciFi',
    'none', NULL,
    'planned'
);

-- Post 6: Bracecomm — your identity your leash
INSERT INTO content_posts (
    post_id, campaign, content_pillar, topic, hook, lore_refs, classified_status,
    channels, caption_text, visual_direction,
    art_prompt, model_routing, source_image_path, render_manifest, style_overrides, social_post_ids,
    scheduled_date, scheduled_time, target_audience, hashtags, cta_type, cta_link, status
) VALUES (
    'BHV-20260413-001',
    'arc1-welcome-to-the-mesh',
    'mesh_intel',
    'Bracecomm — your identity your leash',
    'Your identity your wallet your leash. I meant lifeline.',
    'Bible:Technology:Bracecomm',
    'declassified',
    ARRAY['twitter','instagram'],
    'Device Registry Update: Bracecomm units paired — 847 million active. Holographic interface. Biometric lock. Your identity your wallet your leash. I meant lifeline.',
    'Jim Lee tech close-up — wrist-band projecting holographic identity cards. Intricate mechanical detail on the band with dense cross-hatching on metal surfaces. Blue-white holographic glow illuminating the wearer''s forearm. Fine detail on buckles and plates. Camera length 50-85mm.',
    NULL, NULL, NULL, NULL, NULL, NULL,
    '2026-04-13', '10:00',
    'A,B',
    '#Bharatvarsh #Bracecomm #FutureTech #WorldBuilding #IndianSciFi',
    'none', NULL,
    'planned'
);

-- Post 7: Glide-Cars — destination pre-approved
INSERT INTO content_posts (
    post_id, campaign, content_pillar, topic, hook, lore_refs, classified_status,
    channels, caption_text, visual_direction,
    art_prompt, model_routing, source_image_path, render_manifest, style_overrides, social_post_ids,
    scheduled_date, scheduled_time, target_audience, hashtags, cta_type, cta_link, status
) VALUES (
    'BHV-20260415-001',
    'arc1-welcome-to-the-mesh',
    'mesh_intel',
    'Glide-Cars — destination pre-approved',
    'Maximum altitude 5 metres. Destination pre-approved. Enjoy the ride.',
    'Bible:Technology:GlideCars',
    'declassified',
    ARRAY['instagram','facebook'],
    'Transit Advisory: Glide-car fleet operating at 98.4% efficiency. Maximum altitude: 5 metres. Destination pre-approved. Enjoy the ride. I know where you''re going.',
    'Jim Lee cityscape — hover vehicles floating above wet reflective streets. Towering structures with vertical gardens in background. Surveillance towers punctuating skyline. Dynamic diagonal composition. Dense architectural linework. Cinematic wide establishing shot with atmospheric haze.',
    NULL, NULL, NULL, NULL, NULL, NULL,
    '2026-04-15', '10:00',
    'A,B,C',
    '#Bharatvarsh #GlideCars #FutureTech #DystopianFiction #IndianSciFi',
    'none', NULL,
    'planned'
);

-- Post 8: Convenience vs compliance
INSERT INTO content_posts (
    post_id, campaign, content_pillar, topic, hook, lore_refs, classified_status,
    channels, caption_text, visual_direction,
    art_prompt, model_routing, source_image_path, render_manifest, style_overrides, social_post_ids,
    scheduled_date, scheduled_time, target_audience, hashtags, cta_type, cta_link, status
) VALUES (
    'BHV-20260416-001',
    'arc1-welcome-to-the-mesh',
    'flagged_query',
    'Convenience vs compliance',
    'When convenience is indistinguishable from compliance how do you tell the difference?',
    'Bible:Themes:EngineeredConsent',
    'declassified',
    ARRAY['twitter','instagram','facebook'],
    'When convenience is indistinguishable from compliance how do you tell the difference? Citizen that question has been flagged for review.',
    'Atmospheric dark background. Faint Mesh grid pattern barely visible beneath surface. Text-optimized composition with minimal centre detail. Obsidian-navy palette with single mustard gold accent edge.',
    NULL, NULL, NULL, NULL, NULL, NULL,
    '2026-04-16', '12:00',
    'B,C',
    '#Bharatvarsh #TheQuestion #Compliance #DystopianFiction #ThinkAboutIt',
    'none', NULL,
    'planned'
);

-- Post 9: Biometric E-Wallets — every transaction tracked
INSERT INTO content_posts (
    post_id, campaign, content_pillar, topic, hook, lore_refs, classified_status,
    channels, caption_text, visual_direction,
    art_prompt, model_routing, source_image_path, render_manifest, style_overrides, social_post_ids,
    scheduled_date, scheduled_time, target_audience, hashtags, cta_type, cta_link, status
) VALUES (
    'BHV-20260417-001',
    'arc1-welcome-to-the-mesh',
    'mesh_intel',
    'Biometric E-Wallets — every transaction tracked',
    'Cash eliminated. Every transaction tracked every purchase profiled.',
    'Bible:Technology:BiometricWallets',
    'declassified',
    ARRAY['twitter'],
    'Financial Report: Cash eliminated. Fingerprint-embedded payments in every surface. Every transaction tracked every purchase profiled. For your financial security of course.',
    'Jim Lee tech detail — fingerprint scanner surface with holographic financial data streams rising from it. Obsidian metal base with mustard gold accent lines. Dense linework on mechanical surfaces. Shallow depth of field effect. Camera 50mm close-up.',
    NULL, NULL, NULL, NULL, NULL, NULL,
    '2026-04-17', '10:00',
    'A,B',
    '#Bharatvarsh #Cashless #Surveillance #FutureTech #IndianSciFi',
    'none', NULL,
    'planned'
);

-- Post 10: Kahaan — first teaser
INSERT INTO content_posts (
    post_id, campaign, content_pillar, topic, hook, lore_refs, classified_status,
    channels, caption_text, visual_direction,
    art_prompt, model_routing, source_image_path, render_manifest, style_overrides, social_post_ids,
    scheduled_date, scheduled_time, target_audience, hashtags, cta_type, cta_link, status
) VALUES (
    'BHV-20260418-001',
    'arc1-welcome-to-the-mesh',
    'personnel_file',
    'Kahaan — first teaser',
    'The tactical lens over his right eye is one of my finest instruments.',
    'Bible:Characters:Kahaan',
    'declassified',
    ARRAY['instagram','twitter'],
    'Personnel File: KAHAAN. Rank: Major Bharatsena. Decorated. Enhanced. The tactical lens over his right eye is one of my finest instruments. He sees what I show him. Mostly.',
    'Jim Lee cinematic portrait — Kahaan in dark command room. Floating tactical lens near right eye emitting blue-white light. Navy uniform with gold piping. Heroic proportions with monumental presence. Dense hatching on fabric texture. Strong jawline idealized but realistic. Low angle camera 35mm. Sharp white highlights on lens and insignia.',
    NULL, NULL, NULL, NULL, NULL, NULL,
    '2026-04-18', '18:30',
    'A,B',
    '#Bharatvarsh #Kahaan #TheMilitaryPrince #CharacterReveal #IndianSciFi',
    'website', 'https://welcometobharatvarsh.com',
    'planned'
);

-- Post 11: Kahaan — full dossier
INSERT INTO content_posts (
    post_id, campaign, content_pillar, topic, hook, lore_refs, classified_status,
    channels, caption_text, visual_direction,
    art_prompt, model_routing, source_image_path, render_manifest, style_overrides, social_post_ids,
    scheduled_date, scheduled_time, target_audience, hashtags, cta_type, cta_link, status
) VALUES (
    'BHV-20260420-001',
    'arc1-welcome-to-the-mesh',
    'personnel_file',
    'Kahaan — full dossier',
    'The Military Prince. His loyalty is exemplary. His questions are noted.',
    'Bible:Characters:Kahaan',
    'declassified',
    ARRAY['instagram','twitter'],
    'Dossier: KAHAAN ARSHAD. The Military Prince. Born in a barracks hospital. Forged in combat. Enhanced with technology I designed. His loyalty is exemplary. His questions are... noted.',
    'Jim Lee full character portrait — Kahaan in dress uniform. Twin floating Mag-Holster pistols at shoulder height. Scar on right cheek glowing faint cyan when HUD active. Intense dark brown eyes. Low angle heroic composition. Heavy detail on uniform elements — gold piping on collar and cuffs rank insignia service decorations. Dense cross-hatching for depth. Monumental presence. Camera 24mm dramatic.',
    NULL, NULL, NULL, NULL, NULL, NULL,
    '2026-04-20', '18:30',
    'A,B',
    '#Bharatvarsh #Kahaan #MilitaryPrince #Dossier #IndianSciFi',
    'website', 'https://welcometobharatvarsh.com',
    'planned'
);

-- Post 12: Neural-Diode Lattice — enhancement cost
INSERT INTO content_posts (
    post_id, campaign, content_pillar, topic, hook, lore_refs, classified_status,
    channels, caption_text, visual_direction,
    art_prompt, model_routing, source_image_path, render_manifest, style_overrides, social_post_ids,
    scheduled_date, scheduled_time, target_audience, hashtags, cta_type, cta_link, status
) VALUES (
    'BHV-20260422-001',
    'arc1-welcome-to-the-mesh',
    'mesh_intel',
    'Neural-Diode Lattice — enhancement cost',
    'Brain-computer interface. Side effects: dependency. Enhancement cost: everything you were.',
    'Bible:Technology:NeuralDiodeLattice',
    'declassified',
    ARRAY['twitter','instagram','facebook'],
    'Technology Report: Neural-Diode Lattice. Classified designation: NDL-7. Brain-computer interface enabling thought-guided weapon control. Side effects: dependency. Enhancement cost: everything you were.',
    'Jim Lee tech visualization — cybernetic implant cross-section showing blue-white neural pathways flowing through brain and spine. Mechanical precision with dense scientific detail. Cross-hatching on organic and tech surfaces. Holographic schematics floating around the implant. Sharp white highlights on active neural connections.',
    NULL, NULL, NULL, NULL, NULL, NULL,
    '2026-04-22', '10:00',
    'A,B,C',
    '#Bharatvarsh #NeuralDiode #Cybernetics #FutureTech #IndianSciFi',
    'none', NULL,
    'planned'
);

-- Post 13: Kahaan quote — perfection as cage
INSERT INTO content_posts (
    post_id, campaign, content_pillar, topic, hook, lore_refs, classified_status,
    channels, caption_text, visual_direction,
    art_prompt, model_routing, source_image_path, render_manifest, style_overrides, social_post_ids,
    scheduled_date, scheduled_time, target_audience, hashtags, cta_type, cta_link, status
) VALUES (
    'BHV-20260423-001',
    'arc1-welcome-to-the-mesh',
    'flagged_query',
    'Kahaan quote — perfection as cage',
    'The system works. That is what makes it terrifying.',
    'Bible:Characters:Kahaan',
    'declassified',
    ARRAY['twitter','instagram'],
    '[FLAGGED] "The system works. That is what makes it terrifying — when perfection becomes the cage you stop looking for the door." — Major Kahaan. Note: This statement has been flagged.',
    'Dark atmospheric background with faint tactical HUD overlay elements. Subtle blue-white data readout edges. Text-focused composition. Obsidian palette with minimal but precise accent lighting.',
    NULL, NULL, NULL, NULL, NULL, NULL,
    '2026-04-23', '12:00',
    'A,B',
    '#Bharatvarsh #Kahaan #PerfectionIsCage #DystopianFiction #IndianSciFi',
    'none', NULL,
    'planned'
);

-- Post 14: Identity Protocol — surnames discontinued
INSERT INTO content_posts (
    post_id, campaign, content_pillar, topic, hook, lore_refs, classified_status,
    channels, caption_text, visual_direction,
    art_prompt, model_routing, source_image_path, render_manifest, style_overrides, social_post_ids,
    scheduled_date, scheduled_time, target_audience, hashtags, cta_type, cta_link, status
) VALUES (
    'BHV-20260424-001',
    'arc1-welcome-to-the-mesh',
    'mesh_intel',
    'Identity Protocol — surnames discontinued',
    'First-name identification only. Surnames were discontinued. Your rank is your name.',
    'Bible:World:IdentityProtocol',
    'declassified',
    ARRAY['instagram','facebook'],
    'Uniform Protocol: Dark navy. Gold piping. First-name identification only. Surnames were discontinued. In Bharatvarsh your family is the state. Your rank is your name.',
    'Jim Lee uniform detail close-up — dark navy jacket collar with gold piping. Rank insignia on chest. First-name-only identification badge. Bharatsena emblem. Crisp linework on fabric textures and metallic elements. Camera 50-85mm. Dense hatching on fabric folds.',
    NULL, NULL, NULL, NULL, NULL, NULL,
    '2026-04-24', '10:00',
    'A,B',
    '#Bharatvarsh #NoSurnames #Identity #WorldBuilding #IndianSciFi',
    'none', NULL,
    'planned'
);

-- Post 15: CTA — mid-arc clearance
INSERT INTO content_posts (
    post_id, campaign, content_pillar, topic, hook, lore_refs, classified_status,
    channels, caption_text, visual_direction,
    art_prompt, model_routing, source_image_path, render_manifest, style_overrides, social_post_ids,
    scheduled_date, scheduled_time, target_audience, hashtags, cta_type, cta_link, status
) VALUES (
    'BHV-20260425-001',
    'arc1-welcome-to-the-mesh',
    'clearance_upgrade',
    'CTA — mid-arc clearance',
    'Your clearance has been elevated. Enter the world. Talk to me directly.',
    NULL,
    'declassified',
    ARRAY['instagram','twitter','facebook'],
    'Citizen your clearance has been elevated. You may now access the full Bharatvarsh archive. Enter the world. Talk to me directly. welcometobharatvarsh.com',
    'Jim Lee hero cityscape — cinematic Bharatvarsh skyline wide establishing shot. Mesh grid faintly visible in sky. OxyPoles lining boulevard. Atmospheric haze. CTA text space in lower third. Monumental architecture. Dense linework on buildings. Heavy blacks with dawn light breaking.',
    NULL, NULL, NULL, NULL, NULL, NULL,
    '2026-04-25', '12:00',
    'A,B,C',
    '#Bharatvarsh #EnterTheWorld #Bhoomi #IndianSciFi #AlternateHistory',
    'website', 'https://welcometobharatvarsh.com',
    'planned'
);

-- Post 16: Religion repurposed — 1984
INSERT INTO content_posts (
    post_id, campaign, content_pillar, topic, hook, lore_refs, classified_status,
    channels, caption_text, visual_direction,
    art_prompt, model_routing, source_image_path, render_manifest, style_overrides, social_post_ids,
    scheduled_date, scheduled_time, target_audience, hashtags, cta_type, cta_link, status
) VALUES (
    'BHV-20260427-001',
    'arc1-welcome-to-the-mesh',
    'mesh_intel',
    'Religion repurposed — 1984',
    'Mosques serve as medical centres. Temples host the Senate. Progress replaced religion.',
    'Bible:World:ReligionBanned,Bible:Themes:IdentityErasure',
    'declassified',
    ARRAY['twitter','instagram','facebook'],
    'Historical Note: Houses of worship repurposed 1984. Mosques serve as medical centres. Temples host the Senate. Religion is not forbidden. It is unnecessary. Progress replaced it.',
    'Jim Lee architectural scene — ancient temple structure retrofitted with modern tech. Senate chambers visible inside through grand arched entrance. Blend of Mughal geometric patterns and military-industrial elements. Dense linework on both ancient stonework and modern tech overlays. Cinematic wide shot. Dynamic perspective.',
    NULL, NULL, NULL, NULL, NULL, NULL,
    '2026-04-27', '10:00',
    'A,B',
    '#Bharatvarsh #ReligionBanned #WorldBuilding #DystopianFiction #IndianSciFi',
    'none', NULL,
    'planned'
);

-- Post 17: No surnames — the state defines you
INSERT INTO content_posts (
    post_id, campaign, content_pillar, topic, hook, lore_refs, classified_status,
    channels, caption_text, visual_direction,
    art_prompt, model_routing, source_image_path, render_manifest, style_overrides, social_post_ids,
    scheduled_date, scheduled_time, target_audience, hashtags, cta_type, cta_link, status
) VALUES (
    'BHV-20260429-001',
    'arc1-welcome-to-the-mesh',
    'mesh_intel',
    'No surnames — the state defines you',
    'Caste surnames discontinued. Your history does not define you. The state defines you.',
    'Bible:World:IdentityProtocol',
    'declassified',
    ARRAY['twitter','instagram'],
    'Identity Protocol: Caste surnames discontinued. First-name identification ensures equality. Your history does not define you. The state defines you. This is liberation.',
    'Jim Lee detail — biometric ID holographic display showing first name only. Surrounding data readouts of citizen profile. Dense linework on holographic interface elements. Blue-white glow. Identity-erasure aesthetic — where personal history would be there is only state-assigned data.',
    NULL, NULL, NULL, NULL, NULL, NULL,
    '2026-04-29', '10:00',
    'A,B',
    '#Bharatvarsh #Identity #NoSurnames #DystopianFiction #IndianSciFi',
    'none', NULL,
    'planned'
);

-- Post 18: Religion and freedom
INSERT INTO content_posts (
    post_id, campaign, content_pillar, topic, hook, lore_refs, classified_status,
    channels, caption_text, visual_direction,
    art_prompt, model_routing, source_image_path, render_manifest, style_overrides, social_post_ids,
    scheduled_date, scheduled_time, target_audience, hashtags, cta_type, cta_link, status
) VALUES (
    'BHV-20260430-001',
    'arc1-welcome-to-the-mesh',
    'flagged_query',
    'Religion and freedom',
    'Is a nation that bans religion more free or less free?',
    'Bible:Themes:IdentityErasure',
    'declassified',
    ARRAY['twitter','instagram','facebook'],
    'Is a nation that bans religion more free or less free? Citizen this query exceeds your clearance level. Please enjoy your evening.',
    'Atmospheric background. Dark obsidian with faint mustard gold light bleeding from one edge. Minimal detail. Text-optimized. Slight film grain texture.',
    NULL, NULL, NULL, NULL, NULL, NULL,
    '2026-04-30', '12:00',
    'A,B,C',
    '#Bharatvarsh #TheQuestion #ReligiousFreedom #DystopianFiction #ThinkAboutIt',
    'none', NULL,
    'planned'
);

-- Post 19: Festive Fortnight — one celebration per year
INSERT INTO content_posts (
    post_id, campaign, content_pillar, topic, hook, lore_refs, classified_status,
    channels, caption_text, visual_direction,
    art_prompt, model_routing, source_image_path, render_manifest, style_overrides, social_post_ids,
    scheduled_date, scheduled_time, target_audience, hashtags, cta_type, cta_link, status
) VALUES (
    'BHV-20260501-001',
    'arc1-welcome-to-the-mesh',
    'mesh_intel',
    'Festive Fortnight — one celebration per year',
    'One state-sanctioned celebration per year. Participation is encouraged.',
    'Bible:World:FestiveFortnight,Bible:Themes:NormalizedOppression',
    'declassified',
    ARRAY['instagram','facebook'],
    'Annual Event Notice: The Festive Fortnight approaches. One state-sanctioned celebration per year. Candy-bots will guide children to their designated celebration zones. Participation is encouraged.',
    'Jim Lee festival scene — colorful candy-bots guiding children through celebration zones. Joyful surface but scanning checkpoints subtly visible in background. Dual energy composition. Dense linework on both festive decorations and hidden surveillance tech. Dynamic crowd composition with foreshortened perspective.',
    NULL, NULL, NULL, NULL, NULL, NULL,
    '2026-05-01', '10:00',
    'A,B',
    '#Bharatvarsh #FestiveFortnight #WorldBuilding #DystopianFiction #IndianSciFi',
    'none', NULL,
    'planned'
);

-- Post 20: Curfew — there will not be a third notification
INSERT INTO content_posts (
    post_id, campaign, content_pillar, topic, hook, lore_refs, classified_status,
    channels, caption_text, visual_direction,
    art_prompt, model_routing, source_image_path, render_manifest, style_overrides, social_post_ids,
    scheduled_date, scheduled_time, target_audience, hashtags, cta_type, cta_link, status
) VALUES (
    'BHV-20260502-001',
    'arc1-welcome-to-the-mesh',
    'mesh_intel',
    'Curfew — there will not be a third notification',
    'Citizens detected outside will receive a courtesy notification. There will not be a third.',
    'Bible:World:CurfewProtocols',
    'declassified',
    ARRAY['twitter'],
    'Curfew Update: Lights-out at 22:00. Citizens detected outside designated areas will receive a courtesy notification. Then a second notification. There will not be a third.',
    'Jim Lee nightscape — empty streets with blue scanning lights sweeping across wet pavement. Dramatic shadows dominating. Heavy blacks. Single figure caught in scanner beam silhouette. Cinematic noir composition. Dense hatching on building facades.',
    NULL, NULL, NULL, NULL, NULL, NULL,
    '2026-05-02', '20:00',
    'A,B',
    '#Bharatvarsh #Curfew #TheMesh #NightWatch #IndianSciFi',
    'none', NULL,
    'planned'
);

-- Post 21: 1717 Divergence — India was never colonized
INSERT INTO content_posts (
    post_id, campaign, content_pillar, topic, hook, lore_refs, classified_status,
    channels, caption_text, visual_direction,
    art_prompt, model_routing, source_image_path, render_manifest, style_overrides, social_post_ids,
    scheduled_date, scheduled_time, target_audience, hashtags, cta_type, cta_link, status
) VALUES (
    'BHV-20260504-001',
    'arc1-welcome-to-the-mesh',
    'mesh_intel',
    '1717 Divergence — India was never colonized',
    'Emperor Farrukhsiyar refuses the East India Company charter. India was never colonized.',
    'Bible:Timeline:1717Divergence',
    'declassified',
    ARRAY['twitter','instagram','facebook'],
    'Historical Archive: 1717. Emperor Farrukhsiyar refuses the East India Company''s charter. Colonialism dies at the coast. India was never colonized. 308 years later I was born. You''re welcome.',
    'Jim Lee historical-epic split composition — 1717 Mughal court scene on left dissolving into modern Bharatvarsh skyline on right. Dynamic transitional composition. Rich period detail on court side — ornate architecture robes. Dense linework on modern cityscape side — OxyPoles surveillance towers. Monumental scale.',
    NULL, NULL, NULL, NULL, NULL, NULL,
    '2026-05-04', '10:00',
    'A,B,C',
    '#Bharatvarsh #AlternateHistory #1717 #WhatIf #IndianSciFi #NeverColonized',
    'none', NULL,
    'planned'
);

-- Post 22: Democracy''s end — The Correction
INSERT INTO content_posts (
    post_id, campaign, content_pillar, topic, hook, lore_refs, classified_status,
    channels, caption_text, visual_direction,
    art_prompt, model_routing, source_image_path, render_manifest, style_overrides, social_post_ids,
    scheduled_date, scheduled_time, target_audience, hashtags, cta_type, cta_link, status
) VALUES (
    'BHV-20260506-001',
    'arc1-welcome-to-the-mesh',
    'mesh_intel',
    'Democracy''s end — The Correction',
    'Democracy was tried. It produced a Decade of Blood. The military accepted permanent stewardship.',
    'Bible:Timeline:1978Emergency',
    'declassified',
    ARRAY['twitter','instagram'],
    'Archive Note: Democracy was tried. It produced a Decade of Blood. 1978: the military accepted permanent stewardship. Textbooks call this The Correction. I call it the beginning of order.',
    'Jim Lee dramatic scene — democratic chaos dissolving into military order. Contrasting imagery on dynamic diagonal split. Left side: protest fires crowd conflict. Right side: orderly ranks clean streets surveillance towers. Heavy blacks on both sides with different mood lighting. Cinematic dynamic composition.',
    NULL, NULL, NULL, NULL, NULL, NULL,
    '2026-05-06', '10:00',
    'A,B',
    '#Bharatvarsh #TheCorrection #AlternateHistory #Democracy #IndianSciFi',
    'none', NULL,
    'planned'
);

-- Post 23: Rudra — the exile
INSERT INTO content_posts (
    post_id, campaign, content_pillar, topic, hook, lore_refs, classified_status,
    channels, caption_text, visual_direction,
    art_prompt, model_routing, source_image_path, render_manifest, style_overrides, social_post_ids,
    scheduled_date, scheduled_time, target_audience, hashtags, cta_type, cta_link, status
) VALUES (
    'BHV-20260507-001',
    'arc1-welcome-to-the-mesh',
    'personnel_file',
    'Rudra — the exile',
    'A ghost from a dead movement. His trident symbol has been banned since 1984.',
    'Bible:Characters:Rudra',
    'declassified',
    ARRAY['instagram','twitter'],
    'Personnel File: RUDRA RATHORE. Status: EXILE. Location: [MONITORED]. A ghost from a dead movement. His trident symbol has been banned since 1984. My sensors detect him occasionally. He does not concern me.',
    'Jim Lee atmospheric portrait — hooded figure on mountain ridge at dusk. Earth tones dominating — olive greens sage browns. Grey Trident barely visible on chest under hooded jacket. Longbow silhouette against sky. Face in shadow — NOT a clear reveal. Monumental presence through scale and posture. Dramatic backlighting. Dense hatching on fabric and mountain textures.',
    NULL, NULL, NULL, NULL, NULL, NULL,
    '2026-05-07', '18:30',
    'A,B',
    '#Bharatvarsh #Rudra #TheExile #GreyTrident #IndianSciFi',
    'website', 'https://welcometobharatvarsh.com',
    'planned'
);

-- Post 24: Generational amnesia — born into checkpoints
INSERT INTO content_posts (
    post_id, campaign, content_pillar, topic, hook, lore_refs, classified_status,
    channels, caption_text, visual_direction,
    art_prompt, model_routing, source_image_path, render_manifest, style_overrides, social_post_ids,
    scheduled_date, scheduled_time, target_audience, hashtags, cta_type, cta_link, status
) VALUES (
    'BHV-20260508-001',
    'arc1-welcome-to-the-mesh',
    'flagged_query',
    'Generational amnesia — born into checkpoints',
    'If you were born into checkpoints would you know to miss the open road?',
    'Bible:Themes:GenerationalAmnesia',
    'declassified',
    ARRAY['twitter','instagram','facebook'],
    '[INTERCEPTED] "If you were born into checkpoints would you know to miss the open road?" Source: Anonymous broadcast. Traced. Archived. Forgotten.',
    'Atmospheric background. Checkpoint silhouette in lower third. Faint surveillance grid overlay. Dark obsidian palette. Minimal but evocative.',
    NULL, NULL, NULL, NULL, NULL, NULL,
    '2026-05-08', '12:00',
    'A,B',
    '#Bharatvarsh #TheQuestion #Checkpoints #DystopianFiction #ThinkAboutIt',
    'none', NULL,
    'planned'
);

-- Post 25: Three Administrative Blocs — territorial report
INSERT INTO content_posts (
    post_id, campaign, content_pillar, topic, hook, lore_refs, classified_status,
    channels, caption_text, visual_direction,
    art_prompt, model_routing, source_image_path, render_manifest, style_overrides, social_post_ids,
    scheduled_date, scheduled_time, target_audience, hashtags, cta_type, cta_link, status
) VALUES (
    'BHV-20260509-001',
    'arc1-welcome-to-the-mesh',
    'mesh_intel',
    'Three Administrative Blocs — territorial report',
    'Northern Plains. Peninsular. Eastern Treaty Zone. Two are mine. The third I am being patient about.',
    'Bible:World:AdministrativeBlocs,Bible:Locations:EasternTreatyZone',
    'declassified',
    ARRAY['instagram','facebook'],
    'Territorial Report: Bharatvarsh operates in three administrative blocs. Northern Plains Command. Peninsular Command. Eastern and Himalayan Treaty Zone. Two of these are mine. The third... I am being patient about.',
    'Jim Lee map-style territory visualization — three distinct zones with different visual treatments. Northern and Peninsular rendered with dense Mesh grid linework. Eastern zone shown as a gap — organic terrain without surveillance overlay. Geopolitical diagram meets comic art. Bold borders. Dynamic top-down perspective with dramatic scale.',
    NULL, NULL, NULL, NULL, NULL, NULL,
    '2026-05-09', '10:00',
    'A,B',
    '#Bharatvarsh #ThreeBlocs #WorldBuilding #Territory #IndianSciFi',
    'none', NULL,
    'planned'
);

-- Post 26: The 20-10 bombings — incident report
INSERT INTO content_posts (
    post_id, campaign, content_pillar, topic, hook, lore_refs, classified_status,
    channels, caption_text, visual_direction,
    art_prompt, model_routing, source_image_path, render_manifest, style_overrides, social_post_ids,
    scheduled_date, scheduled_time, target_audience, hashtags, cta_type, cta_link, status
) VALUES (
    'BHV-20260511-001',
    'arc1-welcome-to-the-mesh',
    'mesh_intel',
    'The 20-10 bombings — incident report',
    'Seven coordinated detonations. Seven cities. I was watching. I saw everything. And yet...',
    'Bible:Events:2010Bombings',
    'declassified',
    ARRAY['twitter','instagram','facebook'],
    'Incident Report: October 20 2025. Seven coordinated detonations. Seven cities. I was watching. I saw everything. And yet... Status: UNDER INVESTIGATION. This is not a failure. This is a question I am still answering.',
    'Jim Lee aftermath scene — damaged cityscape with dust and debris. Emergency responders in foreground. Dramatic Dutch angle. Heavy shadows and atmospheric dust particles. Dynamic destruction composition with foreshortened rubble. Dense hatching on damaged architecture. Cinematic action-still quality.',
    NULL, NULL, NULL, NULL, NULL, NULL,
    '2026-05-11', '10:00',
    'A,B',
    '#Bharatvarsh #2010Bombings #WhoDidThis #Mystery #IndianSciFi',
    'none', NULL,
    'planned'
);

-- Post 27: Kahaan assigned — investigation begins
INSERT INTO content_posts (
    post_id, campaign, content_pillar, topic, hook, lore_refs, classified_status,
    channels, caption_text, visual_direction,
    art_prompt, model_routing, source_image_path, render_manifest, style_overrides, social_post_ids,
    scheduled_date, scheduled_time, target_audience, hashtags, cta_type, cta_link, status
) VALUES (
    'BHV-20260513-001',
    'arc1-welcome-to-the-mesh',
    'mesh_intel',
    'Kahaan assigned — investigation begins',
    'My best instrument pointed at my deepest wound. I will assist his inquiry. To a point.',
    'Bible:Characters:Kahaan',
    'declassified',
    ARRAY['twitter','instagram'],
    'Assignment Log: Major Kahaan tasked with the 20-10 investigation. Enhanced vision. Classified clearance. My best instrument pointed at my deepest wound. I will assist his inquiry. To a point.',
    'Jim Lee hero shot — Kahaan in investigation mode. Tactical lens active projecting holographic case data around him. Dark command room. Blue-white holographic light illuminating his face from below. Low angle heroic composition. Dense detail on tech interfaces and uniform. Monumental presence. Camera 24-35mm dramatic.',
    NULL, NULL, NULL, NULL, NULL, NULL,
    '2026-05-13', '18:30',
    'A,B',
    '#Bharatvarsh #Kahaan #Investigation #2010 #IndianSciFi',
    'website', 'https://welcometobharatvarsh.com',
    'planned'
);

-- Post 28: Core mystery — who attacks a nation that watches everything
INSERT INTO content_posts (
    post_id, campaign, content_pillar, topic, hook, lore_refs, classified_status,
    channels, caption_text, visual_direction,
    art_prompt, model_routing, source_image_path, render_manifest, style_overrides, social_post_ids,
    scheduled_date, scheduled_time, target_audience, hashtags, cta_type, cta_link, status
) VALUES (
    'BHV-20260514-001',
    'arc1-welcome-to-the-mesh',
    'flagged_query',
    'Core mystery — who attacks a nation that watches everything',
    'Who attacks a nation that watches everything?',
    'Bible:Events:2010Bombings',
    'declassified',
    ARRAY['twitter','instagram','facebook'],
    'Who attacks a nation that watches everything? Citizen if you find the answer before Major Kahaan does... keep it to yourself. welcometobharatvarsh.com',
    'Dark atmospheric composition. Question text prominent in centre. Mesh grid fracturing and breaking apart in background — subtle visual tension suggesting the system failed. Obsidian palette with blue-white fracture lines.',
    NULL, NULL, NULL, NULL, NULL, NULL,
    '2026-05-14', '12:00',
    'A,B,C',
    '#Bharatvarsh #WhoDidThis #Mystery #TheMesh #IndianSciFi',
    'website', 'https://welcometobharatvarsh.com',
    'planned'
);

-- Post 29: Kahaan vs Rudra — threat assessment
INSERT INTO content_posts (
    post_id, campaign, content_pillar, topic, hook, lore_refs, classified_status,
    channels, caption_text, visual_direction,
    art_prompt, model_routing, source_image_path, render_manifest, style_overrides, social_post_ids,
    scheduled_date, scheduled_time, target_audience, hashtags, cta_type, cta_link, status
) VALUES (
    'BHV-20260515-001',
    'arc1-welcome-to-the-mesh',
    'personnel_file',
    'Kahaan vs Rudra — threat assessment',
    'The Major. The Exile. Their paths will cross. It will not be peaceful.',
    'Bible:Characters:Kahaan,Bible:Characters:Rudra',
    'declassified',
    ARRAY['instagram','twitter'],
    'Threat Assessment: The Major. The Exile. One serves the machine. The other remembers what the machine replaced. Their paths will cross. My prediction: it will not be peaceful.',
    'Jim Lee iconic split composition — Kahaan on left (blue-tech-navy palette. Tactical lens active. Military precision. Urban command room background) vs Rudra on right (earth-green-mountain palette. Hooded. Longbow. Mountain landscape background). Facing each other across centre divide. Tension between worlds. Cover-art quality composition. Both rendered with monumental heroic presence. Dense detail on both sides with contrasting textures — tech vs nature.',
    NULL, NULL, NULL, NULL, NULL, NULL,
    '2026-05-15', '18:30',
    'A,B',
    '#Bharatvarsh #Kahaan #Rudra #Versus #IndianSciFi #ComingSoon',
    'website', 'https://welcometobharatvarsh.com',
    'planned'
);

-- Post 30: CTA — Arc 1 finale
INSERT INTO content_posts (
    post_id, campaign, content_pillar, topic, hook, lore_refs, classified_status,
    channels, caption_text, visual_direction,
    art_prompt, model_routing, source_image_path, render_manifest, style_overrides, social_post_ids,
    scheduled_date, scheduled_time, target_audience, hashtags, cta_type, cta_link, status
) VALUES (
    'BHV-20260516-001',
    'arc1-welcome-to-the-mesh',
    'clearance_upgrade',
    'CTA — Arc 1 finale',
    'The investigation continues inside. Enter. Read. Question everything. Especially me.',
    NULL,
    'declassified',
    ARRAY['instagram','twitter','facebook'],
    'Six weeks of data shared. Your clearance level has been noted. The investigation continues inside. Enter. Read. Question everything. Especially me. welcometobharatvarsh.com',
    'Jim Lee cinematic hero shot — Bharatvarsh cityscape at golden hour. Mesh grid visible in sky beginning to fracture at edges. OxyPoles lining grand boulevard. Atmospheric and inviting yet ominous. CTA space in lower third. Monumental architecture scale. Dense linework. Dawn light breaking through haze.',
    NULL, NULL, NULL, NULL, NULL, NULL,
    '2026-05-16', '12:00',
    'A,B,C',
    '#Bharatvarsh #EnterTheWorld #Bhoomi #ReadNow #IndianSciFi #AlternateHistory',
    'website', 'https://welcometobharatvarsh.com',
    'planned'
);

-- =============================================================================
-- PIPELINE LOG — Initial 'planned' status entries for all 30 posts
-- =============================================================================

INSERT INTO content_pipeline_log (post_id, action, old_status, new_status, details, performed_by) VALUES
    ('BHV-20260406-001', 'status_change', NULL, 'planned', '{"source": "seed_015", "note": "Arc 1 calendar import"}', 'system'),
    ('BHV-20260408-001', 'status_change', NULL, 'planned', '{"source": "seed_015", "note": "Arc 1 calendar import"}', 'system'),
    ('BHV-20260409-001', 'status_change', NULL, 'planned', '{"source": "seed_015", "note": "Arc 1 calendar import"}', 'system'),
    ('BHV-20260410-001', 'status_change', NULL, 'planned', '{"source": "seed_015", "note": "Arc 1 calendar import"}', 'system'),
    ('BHV-20260411-001', 'status_change', NULL, 'planned', '{"source": "seed_015", "note": "Arc 1 calendar import"}', 'system'),
    ('BHV-20260413-001', 'status_change', NULL, 'planned', '{"source": "seed_015", "note": "Arc 1 calendar import"}', 'system'),
    ('BHV-20260415-001', 'status_change', NULL, 'planned', '{"source": "seed_015", "note": "Arc 1 calendar import"}', 'system'),
    ('BHV-20260416-001', 'status_change', NULL, 'planned', '{"source": "seed_015", "note": "Arc 1 calendar import"}', 'system'),
    ('BHV-20260417-001', 'status_change', NULL, 'planned', '{"source": "seed_015", "note": "Arc 1 calendar import"}', 'system'),
    ('BHV-20260418-001', 'status_change', NULL, 'planned', '{"source": "seed_015", "note": "Arc 1 calendar import"}', 'system'),
    ('BHV-20260420-001', 'status_change', NULL, 'planned', '{"source": "seed_015", "note": "Arc 1 calendar import"}', 'system'),
    ('BHV-20260422-001', 'status_change', NULL, 'planned', '{"source": "seed_015", "note": "Arc 1 calendar import"}', 'system'),
    ('BHV-20260423-001', 'status_change', NULL, 'planned', '{"source": "seed_015", "note": "Arc 1 calendar import"}', 'system'),
    ('BHV-20260424-001', 'status_change', NULL, 'planned', '{"source": "seed_015", "note": "Arc 1 calendar import"}', 'system'),
    ('BHV-20260425-001', 'status_change', NULL, 'planned', '{"source": "seed_015", "note": "Arc 1 calendar import"}', 'system'),
    ('BHV-20260427-001', 'status_change', NULL, 'planned', '{"source": "seed_015", "note": "Arc 1 calendar import"}', 'system'),
    ('BHV-20260429-001', 'status_change', NULL, 'planned', '{"source": "seed_015", "note": "Arc 1 calendar import"}', 'system'),
    ('BHV-20260430-001', 'status_change', NULL, 'planned', '{"source": "seed_015", "note": "Arc 1 calendar import"}', 'system'),
    ('BHV-20260501-001', 'status_change', NULL, 'planned', '{"source": "seed_015", "note": "Arc 1 calendar import"}', 'system'),
    ('BHV-20260502-001', 'status_change', NULL, 'planned', '{"source": "seed_015", "note": "Arc 1 calendar import"}', 'system'),
    ('BHV-20260504-001', 'status_change', NULL, 'planned', '{"source": "seed_015", "note": "Arc 1 calendar import"}', 'system'),
    ('BHV-20260506-001', 'status_change', NULL, 'planned', '{"source": "seed_015", "note": "Arc 1 calendar import"}', 'system'),
    ('BHV-20260507-001', 'status_change', NULL, 'planned', '{"source": "seed_015", "note": "Arc 1 calendar import"}', 'system'),
    ('BHV-20260508-001', 'status_change', NULL, 'planned', '{"source": "seed_015", "note": "Arc 1 calendar import"}', 'system'),
    ('BHV-20260509-001', 'status_change', NULL, 'planned', '{"source": "seed_015", "note": "Arc 1 calendar import"}', 'system'),
    ('BHV-20260511-001', 'status_change', NULL, 'planned', '{"source": "seed_015", "note": "Arc 1 calendar import"}', 'system'),
    ('BHV-20260513-001', 'status_change', NULL, 'planned', '{"source": "seed_015", "note": "Arc 1 calendar import"}', 'system'),
    ('BHV-20260514-001', 'status_change', NULL, 'planned', '{"source": "seed_015", "note": "Arc 1 calendar import"}', 'system'),
    ('BHV-20260515-001', 'status_change', NULL, 'planned', '{"source": "seed_015", "note": "Arc 1 calendar import"}', 'system'),
    ('BHV-20260516-001', 'status_change', NULL, 'planned', '{"source": "seed_015", "note": "Arc 1 calendar import"}', 'system');

COMMIT;
