-- Seed: 013_seed_bharatvarsh_lore
-- Description: Bharatvarsh lore tables — characters, factions, locations, technology,
--              concepts, timeline events, relationships, and writing fragments
-- Source: Character reports, Novel World bible, Army Tech Bible, Hypertech Metropoles,
--         Indrapur HQ, Tribhuj Report
-- Created: 2026-03-18

BEGIN;

-- =============================================================================
-- LORE ENTITIES — Characters (7)
-- =============================================================================

INSERT INTO lore_entities (id, entity_type, name, name_devanagari, slug, tagline, summary, full_description, disclosure, faction, tags, visual_keys, metadata, sort_order)
VALUES
(
    'b0000000-0000-0000-c4a0-000000000001',
    'character',
    'Kahaan Arshad',
    'कहान अर्शद',
    'kahaan-arshad',
    $$Every answer pulls a deeper thread, and every thread leads closer to the hands that built the cage$$,
    $$Major of Bharatsena, age 26, the "Military Prince." Lead investigator of the 20-10 bombings across seven cities. Cybernetically enhanced with an experimental neural-diode lattice after a devastating Africa peacekeeping ambush that killed his squad. Brilliant, ambitious, and haunted by survivor guilt.$$,
    $$Kahaan Arshad is the novel''s protagonist and the embodiment of its central contradiction. At twenty-six he already holds the rank of Major in the Bharatsena — trim, athletic, light-bearded, wearing standard dress blues with twin shoulder holsters and a high-tech monocle in combat. His mother Aaliyah died of blood cancer when he was four, breeding a perfection-driven insecurity that his cordial but morally estranged relationship with his father, Dr. Sahil Arshad (lead defence-biotech scientist and confidant of General Pratap), never healed.

The Africa peacekeeping mission ambush was the crucible that forged him: a suicide bomber decimated his squad, and Kahaan was rebuilt with an experimental neural-diode lattice that lets him magnetically manipulate compact firearms and pilot vehicles by thought. The implants come with neural fatigue, tinnitus, and transient paralysis if he exceeds the safety threshold. His twin Mag-Holster pistols hover at palm-height — his visual signature.

Kahaan begins the story certain that a benevolent dictatorship is the surest road to order. Yet as his investigation of the 20-10 bombings unspools, he confronts mounting evidence of state-sponsored atrocities and recognises those same tactics in his own behaviour. His eventual self-revelation — that humility and empathy are prerequisites for leadership — marks the pivot from selfish driver of events to reluctant steward of democracy. In the climax he cedes power to Rudra and begins dismantling the surveillance state.$$,
    'declassified',
    'bharatsena',
    ARRAY['protagonist', 'cybernetic', 'investigator', 'military-prince'],
    '{"build": "trim athletic", "hair": "military-regulation short, light beard", "signature": "twin Mag-Holster pistols hovering at palm-height", "combat": "HUD monocle with blue reflections over left eye", "casual": "earth-tone utility shirts and boots", "arc_visual": "medals polished at start, zero by end"}'::JSONB,
    '{"age": 26, "born": 1999, "rank": "Major", "cybernetics": "neural-diode lattice", "ptsd_triggers": ["loud blasts", "burning circuitry smell"], "mother": "Aaliyah Khan Arshad (deceased)", "father": "Dr. Sahil Arshad (Omar)"}'::JSONB,
    1
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO lore_entities (id, entity_type, name, name_devanagari, slug, tagline, summary, full_description, disclosure, faction, tags, visual_keys, metadata, sort_order)
VALUES
(
    'b0000000-0000-0000-c4a0-000000000002',
    'character',
    'Rudra Rathore',
    'रुद्र राठौड़',
    'rudra-rathore',
    $$Security exists to protect every life, never to dominate$$,
    $$Mid-50s, founder-commander of the Tribhuj resistance, self-exiled hermit in the high Himalayas. Born circa 1970 in a Tribhuj monastery during post-Partition riots. A mirror-hero to Kahaan — represents messy freedom and principled disengagement versus authoritarian control.$$,
    $$Rudra Rathore is the novel''s moral fulcrum: a scar-latticed, powerful figure who embodies the road not taken. Son of dispossessed farmers who fled communal riots, he was raised inside Tribhuj monasteries that sheltered all faiths and tutored in archery, guerrilla tactics, and non-sectarian philosophy by Tribhuj monks.

First seen camouflaged in an olive hood, balanced on spruce branches with two arrows nocked, motionless as bark — visual shorthand for predator-calm precision. He carries a battered trident in larger set-pieces, wears a silver ring embossed with the trident head, and bears a black-ink trident tattoo on his chest: the brand of leadership. His body language is defined by stillness first, then action in one decisive burst, and a piercing gaze "that sees beyond people''s pretence."

After founding the modern Tribhuj as a resistance creed in the 1990s, Rudra was driven underground when the Directorate crushed the movement. He retreated to a hermit''s existence in the high Himalaya, teaching villagers and children basic defence drills under assumed anonymity. His return to the story represents messy freedom — he champions democracy but refuses any official post, illustrating the drawbacks of total disengagement. At the climax, Kahaan hands him authority to lead the nation toward its first democratic sunrise in decades.$$,
    'declassified',
    'tribhuj',
    ARRAY['resistance-leader', 'hermit', 'mentor', 'mirror-hero', 'archer'],
    '{"build": "scar-latticed powerful body", "signature": "battered trident", "accessory": "silver ring with trident emblem", "tattoo": "black trident on chest", "movement": "stillness then decisive burst", "first_seen": "olive hood, balanced on spruce branches, two arrows nocked"}'::JSONB,
    '{"age_circa": 55, "born_circa": 1970, "former_title": "Founder-Commander of Tribhuj", "current_status": "self-exiled hermit, high Himalaya", "fighting_style": "archery, guerrilla tactics"}'::JSONB,
    2
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO lore_entities (id, entity_type, name, name_devanagari, slug, tagline, summary, full_description, disclosure, faction, tags, visual_keys, metadata, sort_order)
VALUES
(
    'b0000000-0000-0000-c4a0-000000000003',
    'character',
    'General Pratap',
    'जनरल प्रताप',
    'general-pratap',
    $$Order requires sacrifice. He decides who pays.$$,
    $$Supreme military leader of Bharatvarsh, age 85 but reads 65-70. The smiling architect of order — benevolent face of the military technocracy in public, cold instrument of precision and pressure in the war room. Heads the General Directorate with Parliament as a rubber stamp.$$,
    $$General Pratap is Bharatvarsh''s apex figure: the smiling architect of order. At eighty-five years old he looks far younger — a testament to the regime''s anti-ageing biotech and a living emblem of engineered stability. Standing 6 feet 2 inches, well-built and fair-skinned with a regulation neat chevron moustache and short silvering hair, he embodies his four identity pillars: Father of the State (public), the Knife in the Map Room (war-room), Austere Minimalist (always), and Controlled Magnanimity (strategic).

In public his demeanour is disarming — a baritone calm, measured syllables, micro-smiles you can hear, and a signature right-edge mouth twitch when performing warmth. In the war room the mask drops: corners flatten, vocabulary sharpens, cadence shortens, and he never raises his volume. He lets silence work before he cuts. His iconography is precise: a signet ring bearing the army emblem (Ashoka-style wheel in a three-triangle frame) on his right hand, a Commander''s Omni-Handle pen-baton that doubles as a dagger, and an unadorned great-coat of matte tech-wool that drinks light.

Pratap orchestrated the 20-10 bombings under a false Tribhuj flag to justify tightening his grip. He is Kahaan''s patron, philosophical mirror, and ideological antagonist — what happens when control becomes an end in itself. His "my-way-or-the-highway" value system warps prosperity into oppression.$$,
    'declassified',
    'bharatsena',
    ARRAY['antagonist', 'dictator', 'general', 'directorate'],
    '{"build": "6ft2, well-built, robust at 85", "face": "squared jaw, deep-set eyes, chevron moustache, silver temples", "public_mask": "disarming smile with right-edge twitch", "war_room": "flat corners, micro-squint, still head", "signature_prop": "signet ring with army emblem", "weapon": "Omni-Handle pen-baton/dagger"}'::JSONB,
    '{"age": 85, "reads_as": "65-70", "height": "6ft2", "skin": "fair", "hand_dominance": "right", "rank": "General", "pillars": ["Father of the State", "The Knife in the Map Room", "Austere Minimalist", "Controlled Magnanimity"]}'::JSONB,
    3
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO lore_entities (id, entity_type, name, name_devanagari, slug, tagline, summary, full_description, disclosure, faction, tags, visual_keys, metadata, sort_order)
VALUES
(
    'b0000000-0000-0000-c4a0-000000000004',
    'character',
    'Major Hana',
    'मेजर हना',
    'hana-takwale',
    $$The East remembers what the Mesh forgot$$,
    $$Major, age 26-28, Kahaan''s tactical-operations second-in-command. The moral compass of the squad — an Olympic-grade markswoman who began as the consummate model soldier but whose empathy increasingly puts her at odds with the regime''s brutality. Daughter of Colonel Arvind, a decorated war-hero sniper.$$,
    $$Major Hana (surname suppressed by the regime''s no-surname edict) is the novel''s moral lens. At 5 feet 8 inches, athletic-wiry with a chin-length wedge bob and dark-brown eyes, she looks every millimetre the regulation poster-officer. Recruits half-joke that when Hana straightens Kahaan''s collar, the operation is officially under way.

But beneath the starch is a woman at war with herself. Raised under the gaze of her father Colonel Arvind''s framed medals, she entered Trishul Academy two years early and broke his marksmanship record — earning only "Good grouping" as praise. Her formative disillusion came during a Jharkhand insurgency sweep, where "collateral villages neutralised" meant a clay stove still warm beside a child''s sandal. Each subsequent black-site rotation taught her to keep her hand steady while vomiting into the grey-water drain each night.

She trains snipers in the morning and teaches village girls to code by night. Her arc moves from loyal major with quiet dissent, through discovering archival proof tying Pratap and her father''s unit to war crimes, to refusing a shoot-to-kill directive and saving hostages — for which her father calls her "disgrace." She is Kahaan''s essential counter-melody: human, fallible, and fiercely compassionate.$$,
    'declassified',
    'bharatsena',
    ARRAY['moral-compass', 'markswoman', 'second-in-command', 'humanitarian'],
    '{"build": "5ft8, athletic-wiry, 7.3 heads tall", "hair": "chin-length wedge bob, side-swept fringe, brown", "eyes": "dark-brown", "dominant_hand": "left", "signature": "twin shoulder holsters, cross-draw with left hand", "casual": "dark jeans, fitted tee, utility jacket"}'::JSONB,
    '{"age": "26-28", "rank": "Major", "father": "Colonel Arvind", "speciality": "Olympic-grade marksmanship, 800m record", "languages": "multilingual", "gear": "precision rifle, Brace-Comm (left wrist), field-dressing kit"}'::JSONB,
    4
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO lore_entities (id, entity_type, name, name_devanagari, slug, tagline, summary, full_description, disclosure, faction, tags, visual_keys, metadata, sort_order)
VALUES
(
    'b0000000-0000-0000-c4a0-000000000005',
    'character',
    'Major Surya',
    'मेजर सूर्य',
    'surya',
    $$No family. No armband. Justice over order.$$,
    $$Age 32, Major in Bharatsena, off-record special ops lead of the classified Guhyakas unit. Betrayed by his own chain of command after Treaty Hills and subjected to Facility IV intake at the Thar sublevels. Escaped before any experiment began. Operates from the shadows to expose Operation KACHA.$$,
    $$Surya is the novel''s cautionary portrait of vengeance aimed at justice. A lean-athletic man with a vertical spine, minimal sway, and economical movement, he reads corners first and faces second. His Hyderabad Telugu inflection colours terse, clipped declaratives with casual inserts — "ekkada?", "namaste ram," "aithe."

He has no family, no armband, no sentimental charms. His unit, the Guhyakas (classified special-ops), was his only anchor until the chain of command betrayed him after Treaty Hills. Black-bag captured, he was taken to the Thar sublevels for intake into Facility IV — the floor housing Operation KACHA, the army''s cyborg enhancement program. He witnessed the A-Delta / B-Omega collar system and KACHA Venus glyphs during intake before escaping through a service shaft into the desert night.

His moral rails are absolute: civilians off-limits, precision violence only, no spectacle. His core wound is institutional betrayal by command; his surface goal is punishing betrayers and exposing KACHA; his real need is regaining agency without becoming what he hunts. He carries weapons from his fallen friend Prateek''s cache and operates through safehouses, drawing evidence from six years of covert missions across the continent.$$,
    'redacted',
    'bharatsena',
    ARRAY['special-ops', 'guhyakas', 'whistleblower', 'covert', 'vengeance'],
    '{"build": "lean-athletic, compact power", "posture": "vertical spine, shoulders relaxed, chin neutral", "hands": "quiet at belt line, explode only on action", "eyes": "read corners first, faces second", "wardrobe": "matte graphite shell, soft armor, no tokens, no armband"}'::JSONB,
    '{"age": 32, "age_at": 2022, "rank": "Major", "unit": "Guhyakas (classified special-ops)", "dialect": "Hyderabad Telugu", "voice_inserts": ["ekkada", "namaste ram", "aithe", "saru", "inka", "chalu"], "moral_rails": "civilians off-limits, precision violence only, no spectacle"}'::JSONB,
    5
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO lore_entities (id, entity_type, name, name_devanagari, slug, tagline, summary, full_description, disclosure, faction, tags, visual_keys, metadata, sort_order)
VALUES
(
    'b0000000-0000-0000-c4a0-000000000006',
    'character',
    'Arshi of Akakpen',
    'अर्शी',
    'arshi',
    $$Some presences are felt before they are understood$$,
    $$Princess of Akakpen, age 23-25, daughter of Queen Kaali. Heir-apparent who assumes executive duties as the story progresses. Cross-trained in sword, bow, martial arts, and firearms. Begins defiant, ends authoritative.$$,
    $$Arshi of Akakpen is the novel''s bridge between tribal autonomy and national reform. At 5 feet 5 inches, slim-athletic with long straight hair framed by two fine frontal braids and striking dark-blue eyes, she carries herself with a defiance that gradually tempers into executive stillness.

Her identity is rooted in the Akakpen tribe — the Eastern-Himalayan communities that forced the Directorate into face-saving treaties and maintain de-facto autonomy. As Kaali''s daughter, she inhabits the intersection of ancient governance and modern resistance. Her wardrobe shifts between formal council attire (tailored graphite overdress with deep teal and muted indigo accents, Akakpen knot brooch), battle-ready alpine whites (cloak, reflective goggles, mountain boots with steel-teeth crampons), and casual travel wear.

Her arc moves from principled resistance through tactical calm under pressure to compassionate authority. Her sidearm is a compact pulse gun (stun/disrupt/lethal modes) carried IWB at 4-o-clock. She enters the wider narrative through the alpine search for allies and the gate standoff with Kahaan, eventually assuming council leadership as Kaali''s condition worsens.$$,
    'classified',
    NULL,
    ARRAY['princess', 'akakpen', 'heir', 'warrior', 'diplomat'],
    '{"build": "5ft5, slim athletic", "hair": "long straight, center part, two fine frontal braids, black-brown", "eyes": "dark blue (#0F2749)", "skin": "light-medium, neutral-warm", "defiance_tell": "chin lifts 2-3 degrees, weight on rear foot, gaze steady", "authority_tell": "feet planted, pelvis neutral, minimal head movement"}'::JSONB,
    '{"age": "23-25", "title": "Princess of Akakpen", "mother": "Queen Kaali", "arc": "defiant to authoritative", "training": ["sword", "bow", "mixed martial arts", "firearms"], "sidearm": "compact pulse gun (stun/disrupt/lethal)"}'::JSONB,
    6
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO lore_entities (id, entity_type, name, name_devanagari, slug, tagline, summary, full_description, disclosure, faction, tags, visual_keys, metadata, sort_order)
VALUES
(
    'b0000000-0000-0000-c4a0-000000000007',
    'character',
    'Queen Kaali',
    'काली',
    'kaali',
    $$Strength is not the absence of softness — it is softness with a spine$$,
    $$Matriarch and Queen of the Akakpen tribe, late 50s. Steel-calm mountain queen, protector first, ruler always. Publicly stern; privately tender. Currently bed-ridden in ICU with severe burns, half-head and one eye bandaged. Her death-bed wish becomes Kahaan''s final yardstick at the climax.$$,
    $$Kaali is the living experiment in small-scale democracy that the novel holds up against the Directorate''s continental control. At 5 feet 7 inches, slim and poised in her late fifties, she carries herself with an upright spine and economical movement — never fussy, never restless. Her face, inspired by Michelle Yeoh''s bone structure, frames green emerald-olive eyes beneath straight brows, with long grey hair gathered by a gold queen''s hair-ring into a sleek ponytail.

Her wardrobe reflects alt-advanced functional fashion: dark-olive matte regalia with antique gold piping for council, camouflage modular layers with a small bow and short sword for field operations, and graceful column dresses for private moments. In her present state — ICU bed-ridden with an oxygen mask, half-head and one eye bandaged — authority is expressed entirely through gaze, stillness, and measured words, her gold hair-ring resting on the bedside tray as a talisman of persisting sovereignty.

As Akakpen''s matriarch she is strict yet nurturing, so protective of daughter Arshi that her own benevolence shades toward soft autocracy. Her death-bed wish, fulfilled at the climax, becomes Kahaan''s final yardstick for every choice. She embodies the question: can power be wielded with compassion without eventually calcifying into control?$$,
    'declassified',
    NULL,
    ARRAY['queen', 'matriarch', 'akakpen', 'tribal-leader', 'icu'],
    '{"build": "5ft7, slim, poised, late 50s", "face_seed": "Michelle Yeoh adjacent, NE Indian", "hair": "long straight grey with white streaks, gold queen hair-ring ponytail", "eyes": "green (emerald-olive)", "skin": "fair-wheatish, neutral-warm", "icu": "oxygen mask, half-head and one eye bandaged (right side), dignity shawl in deep green"}'::JSONB,
    '{"age": "late 50s", "title": "Queen/Matriarch of Akakpen", "daughter": "Arshi", "weapons_pre_injury": ["small recurve bow", "short single-edge sword"], "palette": ["#162B18", "#223F1C", "#4B6B32", "#598AA5", "#ECF1F5"], "accent_metal": "antique gold"}'::JSONB,
    7
)
ON CONFLICT (slug) DO NOTHING;

-- =============================================================================
-- LORE ENTITIES — Factions (5)
-- =============================================================================

INSERT INTO lore_entities (id, entity_type, name, name_devanagari, slug, tagline, summary, full_description, disclosure, faction, tags, visual_keys, metadata, sort_order)
VALUES
(
    'b0000000-0000-0000-fac0-000000000001',
    'faction',
    'Bharatsena',
    'भारतसेना',
    'bharatsena',
    $$Polite inevitability. Order through control.$$,
    $$The government military arm of Bharatvarsh. Hierarchical structure organised into three continental commands: Northern Plains Command, Peninsular Command, and Eastern & Himalayan Treaty Zone. Headed by General Pratap and the General Directorate.$$,
    $$Bharatsena is the military backbone of the Bharatvarsh technocracy — a continent-spanning army that functions as government, police, and social infrastructure rolled into one. Its uniform palette is powder-blue shirts under navy outer layers, with the army emblem (an Ashoka-style wheel in a three-triangle frame) placed as a large mark centered on the back, small mark on the left shoulder, and division/command text only on the right shoulder (ALL CAPS, plain military block).

The army cultivates a "peace-through-strength" brand domestically and abroad. Cities run on spotless efficiency — glide-cars, biometric payments, vertical gardens — while expression is censored and the army''s benevolent image hides a hard edge. All technology passes through a compulsory defence-first cycle in classified labs before partial civilian release. Soldiers benefit from anti-ageing serums, cybernetic prosthetics, memory-editing chips, and advanced drone artillery.

Parliament exists as a rubber stamp; civil courts defer to martial tribunals in matters of "national cohesion." The Directorate governs through three blocs, with the Northern Plains Command being the densest population and tightest surveillance, the Peninsular Command serving as the industrial and naval heart, and the Eastern-Himalayan Treaty Zone maintaining semi-autonomous status.$$,
    'public',
    NULL,
    ARRAY['military', 'government', 'directorate', 'army'],
    '{"palette": "powder-blue shirts, navy outer layers", "emblem": "Ashoka-style wheel in three-triangle frame, monochrome", "emblem_colors": "mustard on navy / navy on powder-blue", "placement": "large back center, small left shoulder, right shoulder text-only ALL CAPS"}'::JSONB,
    '{"commands": ["Northern Plains Command", "Peninsular Command", "Eastern & Himalayan Treaty Zone"], "head": "General Pratap", "governing_body": "General Directorate"}'::JSONB,
    10
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO lore_entities (id, entity_type, name, name_devanagari, slug, tagline, summary, full_description, disclosure, faction, tags, visual_keys, metadata, sort_order)
VALUES
(
    'b0000000-0000-0000-fac0-000000000002',
    'faction',
    'Akakpen Tribe',
    'अककपेन',
    'akakpen-tribe',
    $$Where ancient ways resist modern control$$,
    $$Autonomous tribal nation in the Eastern-Himalayan Treaty Zone. Forced the Directorate into face-saving treaties after decades of guerrilla stalemate. Led by Queen Kaali, succeeded by Princess Arshi. Maintain de-facto autonomy where regular troops cannot enter without tribal consent.$$,
    $$The Akakpen represent the novel''s living alternative to centralized military rule. Occupying the Eastern-Himalayan wilds — a geography of high passes, dense forests, and steep valleys — they forced the Directorate into the Teesta-Nepal treaties after decades of guerrilla stalemate. Regular Bharatsena troops need tribal consent to enter these hills, making the Akakpen one of the few communities that maintained genuine self-governance.

Their culture blends ancient martial traditions with modern defensive technology. Villages employ drone-avoidance techniques (timber pergolas, heat masking, shale reflectors), non-lethal perimeter defences, and mesh communications. Children are trained in archery, tracking, and survival alongside formal education. The Akakpen emblem is a knot logo rendered in matte black, brushed silver, or reflective micro-foil.

Under Kaali''s leadership, the tribe demonstrates that strict governance can coexist with compassion — though the novel questions whether even this small-scale benevolence shades toward soft autocracy. As Kaali''s health fails, Arshi''s assumption of executive duties represents the next generation''s attempt to preserve tribal autonomy while engaging with the wider political upheaval.$$,
    'declassified',
    NULL,
    ARRAY['tribal', 'autonomous', 'eastern-himalayan', 'guerrilla', 'treaty-zone'],
    '{"palette": ["#2B2E33 graphite", "#0F4C5C deep teal", "#394B76 muted indigo", "#E9ECEF winter white"], "emblem": "Akakpen knot logo", "emblem_finishes": ["matte black", "brushed silver", "reflective micro-foil"], "terrain": "high mountain passes, dense forests, steep valleys"}'::JSONB,
    '{"territory": "Eastern-Himalayan Treaty Zone", "governance": "tribal monarchy, council system", "treaties": ["Teesta Treaty", "Nepal Treaty"], "leader": "Queen Kaali", "heir": "Princess Arshi"}'::JSONB,
    11
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO lore_entities (id, entity_type, name, name_devanagari, slug, tagline, summary, full_description, disclosure, faction, tags, visual_keys, metadata, sort_order)
VALUES
(
    'b0000000-0000-0000-fac0-000000000003',
    'faction',
    'The Tribhuj',
    'त्रिभुज',
    'tribhuj',
    $$Returns like a banned verse spoken aloud$$,
    $$Banned resistance creed founded by Rudra Rathore. Three-pronged protection philosophy that began as an ascetic martial wing guarding multi-faith pilgrims. Championed democracy after the army''s rise, was crushed, and vanished into legend until the 20-10 bombings invoked its name.$$,
    $$The Tribhuj is the novel''s most complex symbol — simultaneously a genuine resistance philosophy, a banned historical movement, and a false-flag brand weaponized by the regime itself. Long before the dictatorship, it began as an ascetic martial wing that protected multi-faith pilgrims during lawless decades. Its symbol, the geometric trident, was "neat and ruthless" — a mark of principled defence.

After the army''s rise to permanent power, the Tribhuj championed democracy and was declared treasonous. The regime spent decades erasing it: banning the Tribhuj Puran (the movement''s philosophical text), destroying monasteries, and imprisoning adherents. Rudra Rathore founded the modern Tribhuj in the 1990s as a three-pronged resistance philosophy, but was driven underground when the Directorate crushed the renewed movement.

The twist at the novel''s heart: the seven coordinated 20-10 bombings that invoke the Tribhuj name were actually orchestrated by General Pratap under a false flag. The historical Tribhuj vowed never to harm innocents; the sophistication of the attacks — carried out by Army-trained operatives with Army-grade technology — points to insider engineering rather than genuine resistance.$$,
    'declassified',
    NULL,
    ARRAY['resistance', 'banned', 'democracy', 'philosophical', 'false-flag'],
    '{"emblem": "geometric trident, three-pronged", "original_finish": "ascetic, minimal", "impostor_finish": "electric-blue glitch-flare, scanline bloom, chromatic aberration", "propaganda": "graffiti, stickers, pamphlets in HN/MR/TN scripts"}'::JSONB,
    '{"founder": "Rudra Rathore (modern)", "philosophy": "three-pronged protection: defend the innocent, champion free choice, resist tyranny", "status": "banned, declared treasonous", "banned_text": "Tribhuj Puran", "historical_vow": "never harm innocents"}'::JSONB,
    12
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO lore_entities (id, entity_type, name, name_devanagari, slug, tagline, summary, full_description, disclosure, faction, tags, visual_keys, metadata, sort_order)
VALUES
(
    'b0000000-0000-0000-fac0-000000000004',
    'faction',
    'The Directorate',
    'निदेशालय',
    'directorate',
    $$Doctrine and infrastructure — services arrive on time, and so do consequences$$,
    $$The ruling military government body of Bharatvarsh. General Pratap at the helm. Controls all three continental commands and maintains Bharatvarsh''s position as a UN veto-holding superpower. Parliament reduced to pageantry; martial tribunals rule on matters of national cohesion.$$,
    $$The General Directorate is the political apex of Bharatvarsh''s military technocracy — the governing council that transformed a one-year emergency in 1978 into four decades of permanent military rule. General Pratap sits at its summit, surrounded by a circle of brigadiers who control the three continental commands.

The Directorate''s genius is its brand: benevolent inevitability. It delivers gleaming highways, net-zero towers, free healthcare, and a crime rate that has "almost vanished." In exchange, it banned religion, caste surnames, and independent media. Former mosques and temples now house cancer institutes and senate chambers — architectural reminders that faith has been repurposed for state utility.

The regime cultivates "peace-through-strength" internationally, holding a permanent UN Security Council veto, trading green technology with the EU and Japan, co-developing AI with the United States, and maintaining a wary friendship with China. School textbooks celebrate democracy''s brief "chaotic" phase to justify permanent military stewardship. History before 1984 is printed intact; after 1984, tightly curated.$$,
    'public',
    NULL,
    ARRAY['government', 'ruling-body', 'technocracy', 'surveillance-state'],
    '{"aesthetic": "glass-and-steel institutional, austere, minimal ornament", "signature": "Chandragupta portrait, Bharatvarsh map, framed constitutional preamble"}'::JSONB,
    '{"head": "General Pratap", "type": "military technocracy", "un_status": "permanent veto member", "allies": ["EU", "Japan", "USA (tech co-development)"], "rivals": ["China (wary friendship)", "Russia (muted cold-war)"], "banned": ["religion", "caste surnames", "independent media", "social media"]}'::JSONB,
    13
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO lore_entities (id, entity_type, name, name_devanagari, slug, tagline, summary, full_description, disclosure, faction, tags, visual_keys, metadata, sort_order)
VALUES
(
    'b0000000-0000-0000-fac0-000000000005',
    'faction',
    'Kahaan''s Squad',
    'कहान का दस्ता',
    'kahaans-squad',
    $$The sharpest edge the Directorate ever forged — and the one that cut back$$,
    $$Elite investigation unit assembled for the 20-10 bombing probe. Members: Rishaan, Badr, Taksh, Tara (surveillance analyst), and Manan (critically injured in tunnel ambush). Each embodies a sliver of Kahaan''s weakness or potential.$$,
    $$Kahaan''s Squad is the elite investigation unit assembled to probe the 20-10 bombings — the sharpest instrument the Directorate believed it could point at the crisis. Each member mirrors a facet of Kahaan''s character: his brilliance, his blind spots, and his capacity for growth.

Tara serves as the surveillance analyst who can trace a suspect across multiple cities in minutes using gait analysis alone. Manan provides comic relief and human warmth until his critical injury in the tunnel ambush marks the novel''s "visit to death." Badr, Taksh, and Rishaan round out the tactical, analytical, and field capabilities of the unit.

The squad''s arc parallels the larger story: they begin as loyal instruments of the regime, gradually discover that the evidence trail leads back to their own command structure, and must choose between obedience and justice. Their ultimate decision to stand with Kahaan against Pratap completes the novel''s argument that even those forged within a corrupt system can choose to break it.$$,
    'declassified',
    'bharatsena',
    ARRAY['investigation', 'elite-unit', 'squad', 'bombing-probe'],
    '{}'::JSONB,
    '{"members": ["Rishaan", "Badr", "Taksh", "Tara (surveillance analyst)", "Manan"], "mission": "20-10 bombing investigation", "commander": "Major Kahaan Arshad"}'::JSONB,
    14
)
ON CONFLICT (slug) DO NOTHING;

-- =============================================================================
-- LORE ENTITIES — Locations (12)
-- =============================================================================

INSERT INTO lore_entities (id, entity_type, name, name_devanagari, slug, tagline, summary, full_description, disclosure, faction, tags, visual_keys, metadata, sort_order)
VALUES
(
    'b0000000-0000-0000-a0c0-000000000001',
    'location',
    'Indrapur HQ',
    'इंद्रापुर मुख्यालय',
    'indrapur-hq',
    $$Where glass walls mask iron will$$,
    $$Government seat and Directorate headquarters. A 12-storey all-glass oval on the ceremonial axis of old assembly grounds. Central sealed shaft descends to a nuclear bunker. Houses the Command Suite, War Room, helipad, and motorcade interfaces.$$,
    $$Indrapur HQ is the nerve center of Bharatvarsh''s military technocracy — a low-rise, large-footprint oval in plan that commands without towering. Its all-glass facade of low-iron laminated glass with pale grey interlayer presents an institutional calm, while vertical fins at 3-metre spacing create a quiet architectural cadence. At approximately 52 metres and 12 storeys, it reads as "not very tall but commanding."

The building''s spine is a central sealed shaft (black design) running from roof to basement to an underground nuclear bunker, isolated from all public shafts. The top floor houses General Pratap''s Command Suite (west, with skylight for soft top-fill and the Tri-Anchor Wall: foundational leader portrait, framed national preamble, strategic wall map on cold back-lit glass), connected by a glass corridor to the War Room (elliptical glass map-table, translucent command panes with illegible glyph UI). The east end features a flush rooftop helipad and evac apron.

Security operates in four zones: Green (badge-only lobby), Amber (badge plus wrist-scan vestibule), Red (dual unlock with escort for war-room and helipad), and Black (sealed central shaft with independent protocol).$$,
    'declassified',
    'bharatsena',
    ARRAY['headquarters', 'government', 'command-center', 'indrapur'],
    '{"shape": "low-rise oval", "facade": "pale grey laminated glass, vertical fins at 3m spacing", "height": "~52m / 12 storeys", "features": ["helipad east end", "skylight west", "Tri-Anchor Wall", "motorcade elevators", "central sealed shaft to nuclear bunker"], "desk": "dark basalt stone slab", "floors": "charcoal composite, 10-12% reflectance"}'::JSONB,
    '{"precinct": "Government core of Indrapur", "security_zones": ["Green (badge-only)", "Amber (badge + wrist-scan)", "Red (dual unlock + escort)", "Black (sealed shaft)"], "right_shoulder_text": "DIRECTORATE HQ"}'::JSONB,
    20
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO lore_entities (id, entity_type, name, name_devanagari, slug, tagline, summary, full_description, disclosure, faction, tags, visual_keys, metadata, sort_order)
VALUES
(
    'b0000000-0000-0000-a0c0-000000000002',
    'location',
    'Lakshmanpur',
    'लक्ष्मणपुर',
    'lakshmanpur',
    $$Where smoke meets surveillance$$,
    $$Northern river-plain metropole. One of the 20-10 bombing sites. A broad alluvial plain city with fog-prone winters and monsoon mirror streets. The Festival Fortnight takes place here. OxyPoles line primary boulevards at 60-80 metre spacing.$$,
    $$Lakshmanpur is the novel''s showcase of Bharatvarsh''s polished dystopia. Commuters coast above six-lane boulevards flanked by holographic billboards proclaiming "Working Hard, So you don''t have to." Festival Fortnight — the single state-sponsored holiday — draws massive crowds, and it is during this festival that one of the 20-10 bombings strikes. The city sits on a broad alluvial plain with a meandering river, levees, and shallow flood terraces.

The urban fabric is built from pale limestone, sandstone, and concrete with oxidized bronze rails and ceramic jali panels. Fog-prone winter mornings soften OxyPole halos into ghostly silhouettes. During monsoon, the streets become mirrors — puddled neon, hovercam cones reflected, raindrop bokeh. In the pre-monsoon brass heat, glare off pale stone creates shimmer above the hover lanes.

Heritage micro-sets survive as repurposed institutions: a compact sandstone mandir, a three-bay prayer hall with twin minarets, and a basilica — all now serving state functions, architectural reminders that faith has been repurposed for utility.$$,
    'public',
    NULL,
    ARRAY['city', 'northern-plains', 'bombing-site', 'metropole'],
    '{"geography": "broad alluvial plain, meandering river", "materials": "pale limestone, sandstone, concrete, oxidized bronze", "weather_vignettes": ["milk-glass morning fog", "brass noon heat shimmer", "monsoon mirror night"], "civic_features": ["OxyPole grid 60-80m", "hover lanes", "vertical gardens", "biometric metro gates"]}'::JSONB,
    '{"command": "Northern Plains Command", "climate": "fog winters, monsoon summers", "significance": "20-10 bombing site, Festival Fortnight location"}'::JSONB,
    21
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO lore_entities (id, entity_type, name, name_devanagari, slug, tagline, summary, full_description, disclosure, faction, tags, visual_keys, metadata, sort_order)
VALUES
(
    'b0000000-0000-0000-a0c0-000000000003',
    'location',
    'Mysuru Tech Hub',
    'मैसूर',
    'mysuru',
    $$Granite and algorithms under a dry-season sun$$,
    $$Interior plateau tech-hub city. Slightly elevated, granitic shelves with crisp horizons and strong sun angles. Stone-forward storefronts and pergola-covered transit forecourts.$$,
    $$Mysuru serves as Bharatvarsh''s interior plateau technology hub — a city built on granitic shelves with hard shadows and polished basalt that warms quickly under clear skies. The dry season delivers high contrast and strong occlusion shadows; the monsoon brings sudden lushness with heavy rain sheets cascading from step-eaves through courtyard water-chains.

The cityscape features xeric shrubs and hardy lawn bands in dry months, pergola vines over transit forecourts, and rooftop gardens with shallow-soil species. Heritage micro-sets here include a gopuram-inspired parametric gateway, deep shade arcades with low domes, and a hill-slope granite chapel. The urban fabric is stone-forward: granite, basalt plinths, laterite blocks, fibre-cement louvers, and matte ceramic plazas designed to avoid specular glare during the intense dry months.$$,
    'public',
    NULL,
    ARRAY['city', 'peninsular', 'tech-hub', 'plateau'],
    '{"geography": "interior plateau, granitic shelves", "materials": "granite, basalt, laterite, fibre-cement louvers", "weather": "clear dry winters, monsoon cascades"}'::JSONB,
    '{"command": "Peninsular Command", "climate": "dry winters, pronounced wet season"}'::JSONB,
    22
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO lore_entities (id, entity_type, name, name_devanagari, slug, tagline, summary, full_description, disclosure, faction, tags, visual_keys, metadata, sort_order)
VALUES
(
    'b0000000-0000-0000-a0c0-000000000004',
    'location',
    'Kolkata Corridor',
    'कोलकाता कॉरिडोर',
    'kolkata-corridor',
    $$Delta winds carry secrets the Mesh cannot hear$$,
    $$Deltaic aerotropolis in eastern Bharatvarsh. Lowland delta with embankments, mangrove influence, and frequent pre-monsoon evening squalls. Anti-corrosion architecture and wind-flex palms along skywalks.$$,
    $$The Kolkata Corridor is Bharatvarsh''s eastern delta aerotropolis — a lowland city shaped by water, humidity, and storm. Pre-monsoon evenings bring turbulent clouds, sodium street pools, and distant lightning. During the long monsoon, wind-driven rain floods curb edges under soft, low-contrast days. The brief winter offers clearer nights and cooler daylight.

Architecture here prioritizes corrosion resistance: sealed concrete for salt-air, anti-slip terracotta tiles, deep balconies with rain-chains. The cityscape features wind-flex palms, mangrove-inspired planters near waterways, and lush planter boxes on skywalks. Heritage micro-sets include terracotta-heavy curved roofs, broad-eaved structures with river-breeze verandahs, and a riverside basilica with screened porches.$$,
    'public',
    NULL,
    ARRAY['city', 'eastern', 'delta', 'aerotropolis'],
    '{"geography": "lowland delta, embankments, mangrove", "materials": "sealed concrete, anti-slip terracotta, corrosion-aware metals", "weather": "humid, storm-prone, long monsoon"}'::JSONB,
    '{"command": "Eastern & Himalayan Treaty Zone (nearby)", "climate": "humid subtropical, frequent squalls"}'::JSONB,
    23
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO lore_entities (id, entity_type, name, name_devanagari, slug, tagline, summary, full_description, disclosure, faction, tags, visual_keys, metadata, sort_order)
VALUES
(
    'b0000000-0000-0000-a0c0-000000000005',
    'location',
    'Eastern Himalayan Wilds',
    'पूर्वी हिमालयी वन',
    'eastern-himalayan-wilds',
    $$Where the army''s maps end and real sovereignty begins$$,
    $$Semi-autonomous tribal highlands under the Teesta-Nepal treaties. Home to the Akakpen and other indigenous communities. No-fly valleys, drone-avoidance villages, mesh communications. Regular troops cannot enter without tribal consent.$$,
    $$The Eastern Himalayan Wilds represent the antithesis of Bharatvarsh''s urban control grid. Under the Teesta-Nepal treaties, these highlands maintain de-facto autonomy — regular Bharatsena troops need tribal consent to enter, and rival powers watch for any treaty violation to drag the army before UN courts.

Villages employ sophisticated low-tech countermeasures: timber pergolas over key lanes for overhead occlusion, stove baffles and ground-run vents for heat masking, and shale reflectors that flash sky colour at common UAV viewpoints to confuse auto-exposure. Children learn movement via colour-coded trail systems (yellow-thread routes, muster logic) and are drilled in avalanche response, fire chains, and predator protocols.

The landscape itself is a fortress: high passes, dense forests, steep valleys, no-fly zones respected by both sides of the treaty. Communication runs through mesh networks with quiet-band zones near sacred and sleeping areas.$$,
    'declassified',
    NULL,
    ARRAY['wilderness', 'tribal-territory', 'treaty-zone', 'autonomous', 'himalayas'],
    '{"terrain": "high passes, dense forests, steep valleys", "defences": "timber pergolas, heat masking, shale reflectors, no-fly valleys", "infrastructure": "mesh comms, quiet-band zones, trail colour systems"}'::JSONB,
    '{"treaties": ["Teesta Treaty", "Nepal Treaty"], "access": "tribal consent required for regular troops", "tribes": ["Akakpen"]}'::JSONB,
    24
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO lore_entities (id, entity_type, name, name_devanagari, slug, tagline, summary, full_description, disclosure, faction, tags, visual_keys, metadata, sort_order)
VALUES
(
    'b0000000-0000-0000-a0c0-000000000006',
    'location',
    'Thar Sublevels — Facility IV',
    'थार उप-स्तर',
    'thar-sublevels',
    $$What goes in doesn''t come out the same$$,
    $$Deep desert military installation housing Operation KACHA, the army''s cyborg enhancement program. Biometric fortress with iris/voice locks, A-Delta/B-Omega collar system. Where Surya was taken for intake and escaped through a service shaft.$$,
    $$The Thar Sublevels are Bharatvarsh''s darkest secret — a biometric fortress buried beneath the desert housing Facility IV, the floor of Operation KACHA. The installation requires voiceprint, iris-scan, and keycard authentication at every stage, with A-Delta and B-Omega collars marking subjects in the cyborg enhancement pipeline.

Surya was black-bag captured and brought here after Treaty Hills. During intake he witnessed the KACHA Venus glyphs on binders and the collar system before escaping through a service shaft into the desert night using a waveform backdoor. The sublevels extend at least to Level -4, with manifests revealing discrepancies that Solar-Lab surface facilities cannot account for.

The facility represents the regime''s ultimate betrayal of its "benevolent technocracy" brand: the conversion of loyal soldiers into weapons without consent, in service of a power structure that has ceased to distinguish between protection and domination.$$,
    'classified',
    'bharatsena',
    ARRAY['military-installation', 'black-site', 'kacha', 'cyborg', 'desert'],
    '{"terrain": "deep desert, subterranean", "security": "biometric fortress — iris, voice, keycard", "markers": "A-Delta/B-Omega collars, KACHA Venus glyph", "escape_route": "service shaft to desert surface"}'::JSONB,
    '{"location": "Thar Desert", "depth": "at least Sublevel -4", "program": "Operation KACHA", "biometrics": ["voiceprint", "iris-scan", "keycard"]}'::JSONB,
    25
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO lore_entities (id, entity_type, name, name_devanagari, slug, tagline, summary, full_description, disclosure, faction, tags, visual_keys, metadata, sort_order)
VALUES
(
    'b0000000-0000-0000-a0c0-000000000007',
    'location',
    'Phoenix Mall',
    'फीनिक्स मॉल',
    'phoenix-mall',
    $$Commerce as camouflage$$,
    $$Urban commercial center where Kahaan conducts covert surveillance in civilian dress. Earth-tone utility shirts let him blend with crowds. Key set-piece location for intelligence gathering.$$,
    $$Phoenix Mall is one of the novel''s key urban set-pieces — a civilian commercial center where Kahaan deploys in earth-tone utility shirts and boots to blend with crowds during covert surveillance operations. The mall represents the everyday texture of Bharatvarsh''s polished dystopia: biometric payments at every counter, holographic advertisements, and the pervasive awareness that the Mesh sees everything.$$,
    'public',
    NULL,
    ARRAY['urban', 'commercial', 'surveillance', 'set-piece'],
    '{"type": "commercial mega-mall", "significance": "covert surveillance set-piece"}'::JSONB,
    '{"purpose": "intelligence gathering, covert ops"}'::JSONB,
    26
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO lore_entities (id, entity_type, name, name_devanagari, slug, tagline, summary, full_description, disclosure, faction, tags, visual_keys, metadata, sort_order)
VALUES
(
    'b0000000-0000-0000-a0c0-000000000008',
    'location',
    'Andaman Cellular Jail',
    'अंडमान सेल्युलर जेल',
    'andaman-cellular-jail',
    $$Where no one who goes in ever comes out$$,
    $$A vast pentagonal fortress on its own island. D-Wing houses interrogation suites for political dissidents. The regime''s ultimate tool of fear and silencing.$$,
    $$The Andaman Cellular Jail is Bharatvarsh''s most feared detention facility — a vast pentagonal fortress on its own island, far from any media or oversight. D-Wing''s interrogation suites are where dissidents disappear: "where no one who goes in ever comes out." The facility serves as the regime''s blunt instrument for silencing opposition, a counterpoint to the Directorate''s benevolent public image.$$,
    'classified',
    'bharatsena',
    ARRAY['prison', 'detention', 'political', 'island-fortress'],
    '{"shape": "pentagonal fortress", "location": "isolated island", "feature": "D-Wing interrogation suites"}'::JSONB,
    '{"purpose": "political detention, interrogation", "status": "active"}'::JSONB,
    27
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO lore_entities (id, entity_type, name, name_devanagari, slug, tagline, summary, full_description, disclosure, faction, tags, visual_keys, metadata, sort_order)
VALUES
(
    'b0000000-0000-0000-a0c0-000000000009',
    'location',
    'BVN-24x7 Studio',
    'बीवीएन स्टूडियो',
    'bvn-studio',
    $$The screen the nation trusts — and the screen that cracks$$,
    $$National broadcast network headquarters in Mumbai. Site of the New Tribhuj''s dramatic studio hijack where Jwala delivered the resistance broadcast on live television, exposing the army''s operation to millions.$$,
    $$BVN-24x7 is Bharatvarsh''s premier broadcast network — the screen the nation trusts. The New Tribhuj''s infiltration and hijacking of the studio is one of the novel''s most kinetic set-pieces: Adil''s face-morph disguise, Jwala''s centred-on-lens broadcast in a maroon dress, door-wedge micro-jammers, stairwell denial grenades, and a sixty-second window before security regains control. The operation reveals that the "terrorists" possess Army-grade technology — spoofed keycards, bio-signature sleeves, sub-dermal pigment scales — pointing toward insider provenance.$$,
    'declassified',
    NULL,
    ARRAY['media', 'broadcast', 'mumbai', 'hijack', 'set-piece'],
    '{"type": "broadcast studio complex", "key_spaces": ["anchor desk", "control room", "lift gallery", "stair core", "rooftop egress"]}'::JSONB,
    '{"location": "Mumbai", "significance": "New Tribhuj studio hijack"}'::JSONB,
    28
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO lore_entities (id, entity_type, name, name_devanagari, slug, tagline, summary, full_description, disclosure, faction, tags, visual_keys, metadata, sort_order)
VALUES
(
    'b0000000-0000-0000-a0c0-000000000010',
    'location',
    'Bhojpal',
    'भोजपाल',
    'bhojpal',
    $$History''s echo, rewritten in steel$$,
    $$One of the seven 20-10 bombing sites. A major city in the Northern Plains Command.$$,
    $$Bhojpal is one of the seven cities struck in the coordinated 20-10 bombings. As a major Northern Plains urban center, it showcases the standard Bharatvarsh metropolitan infrastructure: OxyPole grids, hover lanes, biometric checkpoints, and the ever-present Mesh surveillance. The bombing here shattered the myth that the regime''s surveillance apparatus made the homeland untouchable.$$,
    'public',
    NULL,
    ARRAY['city', 'northern-plains', 'bombing-site'],
    '{}'::JSONB,
    '{"command": "Northern Plains Command", "significance": "20-10 bombing site"}'::JSONB,
    29
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO lore_entities (id, entity_type, name, name_devanagari, slug, tagline, summary, full_description, disclosure, faction, tags, visual_keys, metadata, sort_order)
VALUES
(
    'b0000000-0000-0000-a0c0-000000000011',
    'location',
    'Gopakapattana',
    'गोपकपत्तन',
    'gopakapattana',
    $$The southern anchor holds its breath$$,
    $$One of the seven 20-10 bombing sites. Southern peninsular city.$$,
    $$Gopakapattana is one of the seven cities struck during the 20-10 coordinated bombings. Located in the Peninsular Command, it demonstrates the reach of the attacks — from the northern plains to the southern coast, the bombings were designed to make the entire nation feel vulnerable simultaneously. The city''s tropical architecture and naval proximity add distinct character to this bombing site.$$,
    'public',
    NULL,
    ARRAY['city', 'peninsular', 'bombing-site'],
    '{}'::JSONB,
    '{"command": "Peninsular Command", "significance": "20-10 bombing site"}'::JSONB,
    30
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO lore_entities (id, entity_type, name, name_devanagari, slug, tagline, summary, full_description, disclosure, faction, tags, visual_keys, metadata, sort_order)
VALUES
(
    'b0000000-0000-0000-a0c0-000000000012',
    'location',
    'Treaty Hills',
    'संधि पहाड़ी',
    'treaty-hills',
    $$The line between peace and betrayal runs through these ridges$$,
    $$Border region where the Teesta Treaty maintains fragile peace between the Directorate and eastern tribes. Site of Surya''s final past mission where he confronted Raaga, Rudra aborted on moral grounds, and Surya was internally flagged, leading to his capture.$$,
    $$Treaty Hills is the geographic and symbolic flashpoint where the Directorate''s authority meets tribal sovereignty. The Teesta Treaty maintains a fragile peace here, but beneath the diplomatic veneer, clandestine operations run on both sides. Surya''s final past mission at Treaty Hills — destroying an illicit Mesh-Spine relay node and confronting Raaga — was the operation that triggered his internal flagging and subsequent black-bag capture, setting the chain of events toward his Thar Sublevels intake.$$,
    'declassified',
    NULL,
    ARRAY['border', 'treaty-zone', 'mission-site', 'flashpoint'],
    '{"terrain": "border ridges, contested territory", "significance": "Teesta Treaty line"}'::JSONB,
    '{"treaties": ["Teesta Treaty"], "events": ["Surya final mission", "Mesh-Spine node destruction", "Raaga confrontation"]}'::JSONB,
    31
)
ON CONFLICT (slug) DO NOTHING;

-- =============================================================================
-- LORE ENTITIES — Technology (10)
-- =============================================================================

INSERT INTO lore_entities (id, entity_type, name, name_devanagari, slug, tagline, summary, full_description, disclosure, faction, tags, visual_keys, metadata, sort_order)
VALUES
(
    'b0000000-0000-0000-dec0-000000000001',
    'technology',
    'Brace-Comm',
    'ब्रेस-कॉम',
    'bracecomm',
    $$Command at your wrist. The Mesh in your sleeve.$$,
    $$Military wrist-band device that projects small holographic cards — call panes, map tiles, payment confirmations. Compact 3D panes hover inches above the wrist in cyan/blue-white light with fast edge falloff. Standard issue for all Bharatsena officers.$$,
    $$The Brace-Comm is Bharatvarsh''s ubiquitous wrist-worn command interface — a clean-cased military band that projects crisp 3D holographic panes just above the wrist. These panes display calls, maps, payment confirmations, and tactical data in cyan/blue-white light that fades quickly at the edges. In HQ settings the device is kept low-key and polite; in field operations the projections become more dynamic, showing map tiles and real-time intelligence.

The Brace-Comm doubles as a civilian payment device (replacing cash entirely in most transactions — paying with physical currency gets stares "as if money were a museum piece") and a biometric identifier for the Mesh surveillance network. Officers gesture to dismiss panes; civilians tap to confirm transactions. The technology represents the dual nature of Bharatvarsh''s innovation: genuinely useful convenience that simultaneously feeds the surveillance state.$$,
    'public',
    'bharatsena',
    ARRAY['wearable', 'holographic', 'communication', 'payment', 'surveillance'],
    '{"form": "slim military wrist band, clean casing", "projection": "3D panes hovering inches above wrist, cyan/blue-white, fast falloff", "interaction": "gesture to dismiss, tap to confirm"}'::JSONB,
    '{"issued_to": "all Bharatsena officers + civilians", "functions": ["communication", "mapping", "payment", "biometric ID"], "civilian_name": "wrist-phone (censored AR)"}'::JSONB,
    40
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO lore_entities (id, entity_type, name, name_devanagari, slug, tagline, summary, full_description, disclosure, faction, tags, visual_keys, metadata, sort_order)
VALUES
(
    'b0000000-0000-0000-dec0-000000000002',
    'technology',
    'Mag-Holster System',
    'मैग-होल्स्टर',
    'mag-holster',
    $$Frictionless lock. Invisible draw.$$,
    $$Magnetically manipulated compact firearms system. Slim magnetic plates integrated into shoulder rig/under-coat webbing. Holstered pistols snap home with a frictionless magnet-lock settle. Combined with neural-diode control, allows Kahaan to float weapons at shoulder height.$$,
    $$The Mag-Holster system is Bharatsena''s standard-issue weapon retention technology — slim magnetic plates integrated into twin high-ride shoulder holsters that create a frictionless lock/unlock mechanism for service pistols. Nearly invisible under an officer''s open navy coat, the plates give the impression of a tiny metallic "settle" when a holstered pistol snaps home.

For officers equipped with the neural-diode lattice (like Kahaan), the Mag-Holster plates interface with the implant to allow remote weapon manipulation — pistols can hover at shoulder height, subtly tilting as if on invisible gimbals, with a faint electric-blue shimmer line between operator and weapons. This "float" behaviour is Kahaan''s visual signature in combat sequences.$$,
    'declassified',
    'bharatsena',
    ARRAY['weapon-system', 'magnetic', 'holster', 'neural-interface'],
    '{"form": "slim magnetic plates in shoulder rig webbing", "visibility": "nearly invisible under open coat", "motion_cue": "metallic settle sound on holster", "float_effect": "faint electric-blue shimmer between operator and hovering pistols"}'::JSONB,
    '{"interface": "neural-diode lattice (optional)", "standard_use": "twin compact pistols", "placement": "high-ride shoulder holsters"}'::JSONB,
    41
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO lore_entities (id, entity_type, name, name_devanagari, slug, tagline, summary, full_description, disclosure, faction, tags, visual_keys, metadata, sort_order)
VALUES
(
    'b0000000-0000-0000-dec0-000000000003',
    'technology',
    'HUD Monocle',
    'एचयूडी मोनोकल',
    'hud-monocle',
    $$The lens that turns a soldier into a system$$,
    $$Floating curved rectangular lens worn over one eye (Kahaan: left eye). Displays electric-blue HUD with tiny ticks and glyphs, never legible text. Soft blue reflections on cheekbone. Powered down in HQ, active in field operations.$$,
    $$The HUD Monocle is Bharatsena''s augmented-reality combat interface — a thin, floating, curved rectangular lens positioned in front of one eye that displays tactical information in electric-blue light. The display shows micro-animations, ticks, and arcs but never legible text, casting soft blue reflections on the cheekbone and eyelid.

In office and HQ settings the monocle is powered down or quiescent (barely visible). In field operations it activates with micro-animations and occasional glance-flares when the wearer pivots. Not all officers are equipped — it requires compatible neural augmentation. Kahaan wears his over his left eye as part of his cybernetic enhancement suite.$$,
    'declassified',
    'bharatsena',
    ARRAY['augmented-reality', 'combat', 'hud', 'wearable'],
    '{"form": "floating curved rectangular lens, thin, translucent", "color": "electric blue glow", "display": "tiny HUD ticks/glyphs, never legible text", "reflection": "soft blue highlight on cheekbone/eyelid"}'::JSONB,
    '{"requirement": "neural augmentation compatible", "users": ["Kahaan (left eye)"], "states": ["off (HQ)", "active (field)"]}'::JSONB,
    42
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO lore_entities (id, entity_type, name, name_devanagari, slug, tagline, summary, full_description, disclosure, faction, tags, visual_keys, metadata, sort_order)
VALUES
(
    'b0000000-0000-0000-dec0-000000000004',
    'technology',
    'OxyPole',
    'ऑक्सी पोल',
    'oxy-pole',
    $$They scrub the air. They see everything.$$,
    $$Tree-shaped catalytic air-scrubbing towers lining city boulevards at 60-80 metre intervals. Height 8.5-9.2 metres with a crown of concentric vanes. Double as ambient surveillance nodes and civic lighting. The green facade masking an authoritarian core.$$,
    $$OxyPoles are Bharatvarsh''s signature urban infrastructure — slender "trunk" towers with a crown of 4-5 concentric ringed vanes that scrub exhaust from city air. Lining primary boulevards at 60-80 metre spacing and festival axes at 40-50 metres, they read as civic greenery tech rather than lamp posts.

In normal operation, the crown houses wash-head lighting at under 200 candelas per square metre with a subtle hologram cyan status tick. During emergency or curfew, the base rings pulse in safety amber at 30 beats per minute. The powder-coated aluminum mast (graphite finish) with stainless composite crown vanes gives the towers a clean institutional aesthetic.

The OxyPoles symbolize Bharatvarsh''s core contradiction: genuine environmental innovation (scrubbing air, providing public lighting) that simultaneously serves the surveillance state as ambient monitoring nodes. They are "the green facade masking an authoritarian core."$$,
    'public',
    'bharatsena',
    ARRAY['infrastructure', 'air-scrubbing', 'surveillance', 'urban', 'green-tech'],
    '{"height": "8.5-9.2m", "crown": "4-5 concentric vanes, 1.6m outer diameter", "mast": "280mm base to 180mm mid, graphite powder-coat", "states": ["passive (day)", "normal night (cyan tick)", "curfew (amber pulse 30 BPM)"]}'::JSONB,
    '{"spacing": "60-80m primary / 40-50m festival axes", "functions": ["air scrubbing", "ambient light", "surveillance node"], "materials": "aluminum mast, stainless composite crown"}'::JSONB,
    43
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO lore_entities (id, entity_type, name, name_devanagari, slug, tagline, summary, full_description, disclosure, faction, tags, visual_keys, metadata, sort_order)
VALUES
(
    'b0000000-0000-0000-dec0-000000000005',
    'technology',
    'Pulse Gun',
    'पल्स गन',
    'pulse-gun',
    $$Three modes. One trigger. No second chances.$$,
    $$Compact multi-mode sidearm with stun, disrupt, and lethal settings. Matte graphite chassis with white ceramic inlays and tiny amber status LEDs. Integral recoil sink. Standard carry for Akakpen-allied operatives and select officers.$$,
    $$The Pulse Gun is a compact multi-mode energy sidearm featuring three operational settings: stun (default for palace and civilian carry), disrupt (non-lethal area denial), and lethal. The chassis is matte graphite with white ceramic inlays and tiny amber status LEDs indicating mode and charge. An integral recoil sink and squared trigger guard create a low-snag profile suited to concealed carry at the 4-o''clock IWB position. The mode selector sits aft-left. It represents the technological sophistication available outside the Bharatsena''s standard-issue arsenal, particularly among tribal-allied forces.$$,
    'classified',
    NULL,
    ARRAY['weapon', 'energy', 'multi-mode', 'sidearm'],
    '{"form": "compact slide, integral recoil sink, squared trigger guard", "finish": "matte graphite, white ceramic inlays", "indicators": "tiny amber status LEDs", "modes": ["stun", "disrupt", "lethal"]}'::JSONB,
    '{"users": ["Arshi of Akakpen"], "carry": "IWB 4-o-clock", "default_mode": "stun"}'::JSONB,
    44
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO lore_entities (id, entity_type, name, name_devanagari, slug, tagline, summary, full_description, disclosure, faction, tags, visual_keys, metadata, sort_order)
VALUES
(
    'b0000000-0000-0000-dec0-000000000006',
    'technology',
    'Dart',
    'डार्ट',
    'dart',
    $$Silence before the drop$$,
    $$Non-lethal projectile weapon used in covert operations. Part of the Akakpen non-lethal toolkit alongside throw-lights and shoulder locks. Used when lethal force violates operational ethics.$$,
    $$The Dart is a non-lethal takedown tool favoured in covert operations — a silent, precision-delivery system that incapacitates targets without lasting harm. It features prominently in Surya''s operational ROE (rules of engagement), where his decision tree prioritizes non-lethal options when cover is available. The Dart, along with throw-lights and physical restraints, represents the ethical calibration of operatives who reject the regime''s "efficiency at any cost" doctrine.$$,
    'classified',
    NULL,
    ARRAY['weapon', 'non-lethal', 'covert', 'tranquilizer'],
    '{"form": "precision-delivery non-lethal projectile", "sound": "near-silent"}'::JSONB,
    '{"users": ["Surya", "Akakpen operatives"], "purpose": "non-lethal takedown", "ethics": "preferred when cover available"}'::JSONB,
    45
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO lore_entities (id, entity_type, name, name_devanagari, slug, tagline, summary, full_description, disclosure, faction, tags, visual_keys, metadata, sort_order)
VALUES
(
    'b0000000-0000-0000-dec0-000000000007',
    'technology',
    'The Mesh',
    'जाल',
    'the-mesh',
    $$The Mesh sees everything. Every transaction, every movement, every word spoken in the open.$$,
    $$Bharatvarsh''s nationwide surveillance lattice. Cross-checks faces, gaits, and emotional micro-expressions. Digital wallets record every sale; social media sentiment mined in real time. Analyst Tara can trace a suspect across multiple cities in minutes using gait alone.$$,
    $$The Mesh is the invisible architecture of Bharatvarsh''s control — a nationwide lattice of cameras, sensors, and AI that cross-checks faces, gaits, and even emotional micro-expressions. Digital wallets record every transaction; social media sentiment (what little remains after censorship) is mined in real time. Surveillance analyst Tara demonstrates its power by tracing suspects across multiple cities in minutes using gait analysis alone.

The Mesh''s tendrils extend through OxyPoles, checkpoint towers, hover-lane beacons, curb scanner bollards, and millions of embedded sensors. Where soft power fails, the system''s data feeds the hard power of shielded personnel carriers, drone artillery, and hypersonic helicopters. For most citizens the Mesh is invisible and "benevolent" — preventing crime, streamlining payments, ensuring "safety." For dissidents, it is a cage with no walls.$$,
    'public',
    'bharatsena',
    ARRAY['surveillance', 'network', 'AI', 'biometric', 'control'],
    '{"visibility": "invisible infrastructure", "feeds_into": ["OxyPoles", "checkpoint towers", "hover-lane beacons", "curb scanners"], "display": "translucent panels with abstract glyphs in HQ"}'::JSONB,
    '{"capabilities": ["facial recognition", "gait analysis", "micro-expression reading", "transaction tracking", "sentiment mining"], "coverage": "nationwide", "operator": "Bharatsena intelligence"}'::JSONB,
    46
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO lore_entities (id, entity_type, name, name_devanagari, slug, tagline, summary, full_description, disclosure, faction, tags, visual_keys, metadata, sort_order)
VALUES
(
    'b0000000-0000-0000-dec0-000000000008',
    'technology',
    'Neural-Diode Lattice',
    'न्यूरल-डायोड जालक',
    'neural-diode-lattice',
    $$The line between human and weapon dissolves$$,
    $$Experimental cybernetic implant embedded after Kahaan''s Africa incident. Enables magnetic manipulation of compact firearms and thought-piloting of vehicles. Exceeding the safety threshold causes neural fatigue, tinnitus, and transient paralysis.$$,
    $$The Neural-Diode Lattice is an experimental cybernetic implant developed through Bharatvarsh''s defence biotech program under Dr. Sahil Arshad. Embedded in Kahaan after the Africa peacekeeping ambush, it creates an electromagnetic interface between the nervous system and external hardware. The primary applications are magnetic manipulation of compact firearms (the "flying guns" effect) and thought-piloting of vehicles including his motorcycle and the Giddh X-200 scout chopper.

The lattice has strict operational limits: neural fatigue, tinnitus, and transient paralysis occur if the safety threshold is exceeded. A broken circuit severs control mid-operation — a vulnerability exploited during the tunnel ambush. Larger machines require external circuitry to interface with the implant. The technology connects directly to Operation KACHA, the Thar Sublevels program that sought to mass-produce cyborg soldiers without consent.$$,
    'classified',
    'bharatsena',
    ARRAY['cybernetic', 'implant', 'experimental', 'kacha-adjacent'],
    '{"visibility": "invisible (subcutaneous)", "effects": "electromagnetic shimmer when active, blue control lines to floating weapons"}'::JSONB,
    '{"developer": "Dr. Sahil Arshad / Defence biotech", "users": ["Kahaan Arshad"], "capabilities": ["magnetic weapon control", "thought-piloting vehicles"], "side_effects": ["neural fatigue", "tinnitus", "transient paralysis"], "connection": "Operation KACHA precursor"}'::JSONB,
    47
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO lore_entities (id, entity_type, name, name_devanagari, slug, tagline, summary, full_description, disclosure, faction, tags, visual_keys, metadata, sort_order)
VALUES
(
    'b0000000-0000-0000-dec0-000000000009',
    'technology',
    'Giddh X-200',
    'गिद्ध एक्स-200',
    'giddh-x200',
    $$Think it. Fly it. The sky is a thought away.$$,
    $$Scout chopper capable of thought-piloting via neural-diode interface. Twin-engine, autonomous approach and hold capability. Used by augmented officers for rapid reconnaissance and transport. Autopilots allow officers to read dossiers en route.$$,
    $$The Giddh X-200 is Bharatsena''s advanced scout/transport helicopter — a twin-engine platform capable of autonomous approach, hold, and landing. For officers equipped with the neural-diode lattice, the chopper can be thought-piloted, creating an intimate interface between pilot intention and aircraft response. Its autopilot capability is notable enough that senior officers routinely read dossiers while "not flying the chopper" en route to operations.

The aircraft represents the pinnacle of Bharatvarsh''s defence-first technology cycle: hypersonic capabilities, autonomous systems, and neural integration, all developed in classified labs before any civilian spin-off. During helipad operations at Indrapur HQ, the Giddh docks at the east-end flush apron with rotor wash strong enough to rip coat hems and force aides into wind shadows.$$,
    'declassified',
    'bharatsena',
    ARRAY['vehicle', 'helicopter', 'scout', 'neural-piloted', 'military'],
    '{"type": "twin-engine scout/transport helicopter", "control": "thought-piloted via neural-diode or autopilot", "docking": "flush rooftop helipad"}'::JSONB,
    '{"engine": "twin-engine", "modes": ["thought-piloted", "autopilot", "manual"], "capability": "autonomous approach/hold/landing", "users": ["augmented officers", "Kahaan"]}'::JSONB,
    48
)
ON CONFLICT (slug) DO NOTHING;

-- =============================================================================
-- LORE ENTITIES — Concepts (2)
-- =============================================================================

INSERT INTO lore_entities (id, entity_type, name, name_devanagari, slug, tagline, summary, full_description, disclosure, faction, tags, visual_keys, metadata, sort_order)
VALUES
(
    'b0000000-0000-0000-c00c-000000000001',
    'concept',
    'Operation KACHA',
    'ऑपरेशन कच्चा',
    'operation-kacha',
    $$Raw material in. Weapons out. Consent not required.$$,
    $$The army''s classified cyborg enhancement program based in Facility IV of the Thar Sublevels. Uses A-Delta/B-Omega collar system to mark subjects. Venus glyph on all program documentation. Surya escaped before experimentation; the program aims to mass-produce cyborg soldiers.$$,
    $$Operation KACHA (named for "raw" or "unfinished" — the state of subjects before conversion) is Bharatvarsh''s darkest secret: a program to mass-produce cyborg soldiers using involuntary subjects. Based in Facility IV of the Thar Sublevels, the program processes recruits through biometric gauntlets (voiceprint, iris-scan, keycard) and marks them with A-Delta or B-Omega collars indicating their processing tier.

All program documentation bears the KACHA Venus glyph — a distinctive mark that Surya recognized during his intake and later used to trace the program''s supply chain from African lithium corridors through Indore procurement to the Thar Sublevels. The program represents the Directorate''s ultimate moral failure: the conversion of loyal soldiers into weapons without consent, driven by a power structure that has ceased to distinguish between protection and domination.

KACHA connects directly to Kahaan''s neural-diode lattice (a related but earlier technology developed by his father) and to the broader evidence trail that eventually proves the Directorate''s complicity in the 20-10 bombings.$$,
    'classified',
    'bharatsena',
    ARRAY['program', 'cyborg', 'black-ops', 'classified', 'ethics'],
    '{"markers": "A-Delta/B-Omega collars", "glyph": "Venus symbol on all documentation", "location": "Facility IV, Thar Sublevels"}'::JSONB,
    '{"facility": "Thar Sublevels, Facility IV", "biometrics": ["voiceprint", "iris-scan", "keycard"], "supply_chain": ["African lithium corridor", "Indore procurement", "Solar-Lab", "Thar Sublevels"], "related": "neural-diode lattice program"}'::JSONB,
    50
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO lore_entities (id, entity_type, name, name_devanagari, slug, tagline, summary, full_description, disclosure, faction, tags, visual_keys, metadata, sort_order)
VALUES
(
    'b0000000-0000-0000-c00c-000000000002',
    'concept',
    'The 20-10 Bombings',
    '20-10 बम विस्फोट',
    'the-20-10-bombings',
    $$Seven cities. One night. The cage rattles.$$,
    $$Seven coordinated bombings across Bharatvarsh on October 20th, 2025. Attackers claim the long-dead name Tribhuj. Killed hundreds and tarnished Bharatvarsh''s aura of invulnerability. Actually a false-flag operation orchestrated by General Pratap to justify tightening control.$$,
    $$The 20-10 bombings are the novel''s inciting incident: seven synchronised explosions across Bharatvarsh on October 20th, 2025 — in Lakshmanpur, Bhojpal, Mysuru, Gopakapattana, Jammu, Kathmandu, and Kolkata. The attackers claimed the long-dead name of the Tribhuj, killing hundreds and shattering the notion that the Directorate''s surveillance state was impenetrable.

The investigation assigned to Kahaan gradually reveals the truth: the bombings were a false-flag operation orchestrated by General Pratap to justify emergency measures and further consolidate power. The evidence trail includes Army-supplied gelatin explosives, military-grade technology in the hands of the "terrorists," and operational patterns consistent with insider access rather than external resistance.

At Lakshmanpur, a band hijacked the open mic during Festival Fortnight, raining TRIBHUJ-stamped pamphlets — the first theatrically branded public claim. The bombings established the central mystery: "Whether this connects to the old Tribhuj is unknown," and Kahaan''s pursuit of that question drives the entire plot.$$,
    'declassified',
    NULL,
    ARRAY['event', 'bombings', 'false-flag', 'inciting-incident', 'investigation'],
    '{"visual": "coordinated explosions across seven cities, TRIBHUJ-stamped pamphlets", "aftermath": "military lockdown, investigation formed"}'::JSONB,
    '{"date": "2025-10-20", "cities": ["Lakshmanpur", "Bhojpal", "Mysuru", "Gopakapattana", "Jammu", "Kathmandu", "Kolkata"], "orchestrator": "General Pratap (false flag)", "claimed_by": "Tribhuj (name)", "investigator": "Major Kahaan Arshad"}'::JSONB,
    51
)
ON CONFLICT (slug) DO NOTHING;

-- =============================================================================
-- LORE TIMELINE — 20 Events
-- =============================================================================

INSERT INTO lore_timeline (id, year, date_label, era, title, description, significance, entities_involved, disclosure, sort_order, tags)
VALUES
('b0000000-0000-0000-d1e0-000000000001', 1717, '1717', 'Divergence',
 'Farrukhsiyar Refuses the EIC Charter',
 $$In this timeline, Mughal Emperor Farrukhsiyar refuses the East India Company''s charter request, preventing the foothold that would lead to British colonial domination. European powers are confined to minor coastal enclaves yielding diminishing returns.$$,
 'The point of divergence from real-world history. Prevents full-scale European conquest and enables independent industrialisation.',
 ARRAY['bharatvarsh'], 'public', 1, ARRAY['divergence', 'colonial', 'foundation']),

('b0000000-0000-0000-d1e0-000000000002', 1850, 'Pre-1850s', 'Independent Growth',
 'Indigenous Industrialisation',
 $$With colonial powers confined to minor enclaves, indigenous dynasties industrialise on their own terms. A loosely federated Bharatvarsh develops manufacturing, railways, and military capability independently.$$,
 'Establishes Bharatvarsh as a self-made industrial power without colonial exploitation.',
 ARRAY['bharatvarsh'], 'public', 2, ARRAY['industrialisation', 'independence']),

('b0000000-0000-0000-d1e0-000000000003', 1914, '1914-1918', 'World Wars',
 'First World War — Allied Partnership',
 $$A loosely federated Bharatvarsh becomes an indispensable Allied partner during WWI, providing troops, resources, and industrial output. Gains enormous diplomatic capital.$$,
 'Positions Bharatvarsh as a major world power and future Security Council member.',
 ARRAY['bharatvarsh', 'bharatsena'], 'public', 3, ARRAY['wwi', 'alliance', 'diplomacy']),

('b0000000-0000-0000-d1e0-000000000004', 1945, '1939-1945', 'World Wars',
 'Joint Manhattan Project and WWII Victory',
 $$Bharatvarsh collaborates with the United States on the atom bomb and is instrumental in ending WWII. This collaboration cements Bharatvarsh''s superpower status and permanent UN Security Council veto.$$,
 'Nuclear collaboration establishes the US-Bharatvarsh tech co-development axis that persists into the present.',
 ARRAY['bharatvarsh'], 'public', 4, ARRAY['wwii', 'nuclear', 'superpower', 'un-veto']),

('b0000000-0000-0000-d1e0-000000000005', 1960, '1950s-1970s', 'Democratic Crisis',
 'Sectarian Riots and Political Paralysis',
 $$Democracy flourishes initially but sectarian violence and political gridlock create a vacuum. Communal riots, assassinations, and coalition collapses erode public faith in democratic governance.$$,
 'Creates the conditions that allow the military to present itself as a necessary stabiliser.',
 ARRAY['bharatvarsh', 'tribhuj'], 'public', 5, ARRAY['democracy', 'crisis', 'sectarian']),

('b0000000-0000-0000-d1e0-000000000006', 1970, 'c. 1970', 'Democratic Crisis',
 'Birth of Rudra Rathore',
 $$Rudra is born to dispossessed farmers who fled communal riots, raised inside Tribhuj monasteries that sheltered all faiths. Begins his martial apprenticeship under Tribhuj monks.$$,
 'Origin of the character who will become the resistance''s moral anchor.',
 ARRAY['rudra-rathore', 'tribhuj'], 'declassified', 6, ARRAY['birth', 'character-origin']),

('b0000000-0000-0000-d1e0-000000000007', 1978, '1978', 'Emergency',
 'The One-Year Emergency Becomes Permanent',
 $$A supposedly "one-year emergency" hands full control to the army. Military tribunals replace civil courts for matters of "national cohesion." Parliament becomes a rubber stamp. The emergency never ends.$$,
 'The pivot from democracy to permanent military rule — the foundational act of the Directorate.',
 ARRAY['bharatsena', 'directorate'], 'public', 7, ARRAY['emergency', 'dictatorship', 'military-rule']),

('b0000000-0000-0000-d1e0-000000000008', 1984, '1984', 'Suppression',
 'Tribhuj Puran Banned — Religion and Caste Outlawed',
 $$The Tribhuj Puran is declared treasonous literature. Religion, caste surnames, and independent media are banned. Former temples and mosques are repurposed as government buildings, cancer institutes, and senate chambers.$$,
 'Completes the Directorate''s cultural erasure program. History before 1984 printed intact; after, tightly curated.',
 ARRAY['tribhuj', 'directorate'], 'public', 8, ARRAY['ban', 'religion', 'censorship', 'cultural-erasure']),

('b0000000-0000-0000-d1e0-000000000009', 1993, 'Early 1990s', 'Resistance',
 'Modern Tribhuj Founded by Rudra',
 $$Rudra Rathore founds the modern Tribhuj as a three-pronged resistance creed: defend the innocent, champion free choice, resist tyranny. The movement operates openly for a brief period before the Directorate moves to crush it.$$,
 'The rebirth of the Tribhuj as a political resistance rather than a purely spiritual order.',
 ARRAY['rudra-rathore', 'tribhuj'], 'declassified', 9, ARRAY['founding', 'resistance', 'democracy']),

('b0000000-0000-0000-d1e0-000000000010', 1999, '1999', 'Personal',
 'Kahaan Arshad Born',
 $$Kahaan is born to Dr. Sahil Arshad (defence-biotech scientist) and Aaliyah Khan Arshad. Aaliyah will die of blood cancer when Kahaan is four, shaping his perfection-driven insecurity.$$,
 'Birth of the protagonist, linking the personal to the political through his father''s defence connections.',
 ARRAY['kahaan-arshad'], 'declassified', 10, ARRAY['birth', 'character-origin']),

('b0000000-0000-0000-d1e0-000000000011', 2003, 'Early 2000s', 'Treaties',
 'Teesta Treaty Signed',
 $$The Teesta-Nepal treaties formalise the Eastern-Himalayan Treaty Zone, granting semi-autonomous status to tribal regions. Regular Bharatsena troops need tribal consent to enter. Rival powers watch for violations.$$,
 'Creates the legal framework protecting the Akakpen and other tribes — a persistent thorn in the Directorate''s side.',
 ARRAY['akakpen-tribe', 'directorate'], 'public', 11, ARRAY['treaty', 'autonomy', 'eastern-himalayan']),

('b0000000-0000-0000-d1e0-000000000012', 2005, 'Mid-2000s', 'Suppression',
 'Tribhuj Driven Underground',
 $$The Directorate crushes the renewed Tribhuj movement. Rudra retreats to hermit existence in the high Himalayas, teaching villagers under assumed anonymity. The resistance vanishes into legend.$$,
 'Forces the Tribhuj into legend, setting up the shock of its apparent return during the 20-10 bombings.',
 ARRAY['rudra-rathore', 'tribhuj', 'directorate'], 'declassified', 12, ARRAY['suppression', 'underground', 'exile']),

('b0000000-0000-0000-d1e0-000000000013', 2016, '2016/02', 'Surya Operations',
 'Ice Ridge Rescue — Surya''s First Crack',
 $$Surya leads the Ice Ridge extraction of stranded surveyors before a blizzard with minimal radio support. First crack in his belief that "order equals right." Residues: safety pin, breath/pulse HUD micro-line.$$,
 'Begins Surya''s six-year journey from loyal operative to whistleblower.',
 ARRAY['surya'], 'redacted', 13, ARRAY['mission', 'guhyakas', 'turning-point']),

('b0000000-0000-0000-d1e0-000000000014', 2021, '2021/06', 'Surya Operations',
 'African Lithium Corridor — Prateek KIA',
 $$Surya documents tampered lithium shipments with A-Delta cooler labels pointing to Indore. His closest friend Lt. Prateek Punya is killed in an ambush. Copper tag motif seeded.$$,
 'The personal loss that transforms Surya''s professional doubts into burning purpose.',
 ARRAY['surya'], 'redacted', 14, ARRAY['mission', 'death', 'evidence', 'africa']),

('b0000000-0000-0000-d1e0-000000000015', 2021, '2021/10', 'Surya Operations',
 'Treaty Hills — Final Past Mission',
 $$Surya''s final field operation. Destroys an illicit Mesh-Spine relay node, scratches RTE:7C-K-beta on a survey plate, and confronts Raaga. Rudra aborts on moral grounds. Surya is internally flagged by command.$$,
 'Triggers the chain of events leading to Surya''s capture and Thar intake.',
 ARRAY['surya', 'rudra-rathore', 'treaty-hills'], 'classified', 15, ARRAY['mission', 'betrayal', 'flagged']),

('b0000000-0000-0000-d1e0-000000000016', 2021, '2021/11', 'Capture',
 'Thar Sublevels Intake and Escape',
 $$Surya is black-bag captured and taken to Facility IV at the Thar Sublevels. During intake he witnesses A-Delta/B-Omega collars and KACHA Venus glyphs. Escapes through a service shaft using a waveform backdoor before any experiment begins.$$,
 'Surya''s first-hand witness of KACHA becomes the evidentiary foundation for the novel''s conspiracy plot.',
 ARRAY['surya', 'operation-kacha', 'thar-sublevels'], 'classified', 16, ARRAY['capture', 'escape', 'kacha', 'evidence']),

('b0000000-0000-0000-d1e0-000000000017', 2022, '2022/02-05', 'Surya Operations',
 'Indore Blackout Ledger Heist',
 $$During a power-grid blackout orchestrated by an ally, Surya extracts procurement proofs from the Indore facility in under 90 seconds. Tri-dot and Q-stroke signatures confirmed. "The paper is clean. The world isn''t."$$,
 'Provides documentary proof linking Directorate procurement to Operation KACHA supply chain.',
 ARRAY['surya'], 'classified', 17, ARRAY['heist', 'evidence', 'indore']),

('b0000000-0000-0000-d1e0-000000000018', 2024, '2024', 'Present Build-up',
 'Kahaan Promoted to Major',
 $$Kahaan receives his promotion to Major in the Bharatsena, consolidating his status as the "Military Prince." His cybernetic enhancements are fully operational. General Pratap positions him as the ideal investigator for the coming crisis.$$,
 'Sets the stage for Kahaan''s role in the 20-10 investigation.',
 ARRAY['kahaan-arshad', 'general-pratap'], 'declassified', 18, ARRAY['promotion', 'setup']),

('b0000000-0000-0000-d1e0-000000000019', 2025, '2025/10/20', 'The Novel',
 'The 20-10 Bombings',
 $$Seven coordinated bombings strike Lakshmanpur, Bhojpal, Mysuru, Gopakapattana, Jammu, Kathmandu, and Kolkata. Attackers claim the Tribhuj name. Hundreds killed. Bharatvarsh''s aura of invulnerability shattered. Kahaan assigned to investigate.$$,
 'The inciting incident of the novel. Everything that follows flows from this night.',
 ARRAY['kahaan-arshad', 'general-pratap', 'tribhuj', 'the-20-10-bombings'], 'public', 19, ARRAY['bombings', 'inciting-incident', 'crisis']),

('b0000000-0000-0000-d1e0-000000000020', 2026, 'Post-Novel', 'Aftermath',
 'Dictatorship Legitimacy Frays',
 $$In the aftermath of Kahaan''s broadcast confrontation with Pratap and the exposure of the false-flag operation, the Directorate''s legitimacy begins to crumble. Kahaan cedes power to Rudra. Bharatvarsh takes its first steps toward democratic governance in nearly fifty years.$$,
 'The novel''s resolution: the first democratic sunrise after decades of military rule.',
 ARRAY['kahaan-arshad', 'rudra-rathore', 'general-pratap', 'directorate'], 'declassified', 20, ARRAY['resolution', 'democracy', 'aftermath'])

ON CONFLICT DO NOTHING;

-- =============================================================================
-- LORE RELATIONSHIPS (~65)
-- =============================================================================

-- --- Characters → Factions ---

INSERT INTO lore_relationships (id, source_entity_id, target_entity_id, relationship, description, strength, is_spoiler)
VALUES
('b0000000-0000-0000-0e10-000000000001', 'b0000000-0000-0000-c4a0-000000000001', 'b0000000-0000-0000-fac0-000000000001', 'member_of', 'Major in the Bharatsena, lead investigator of the 20-10 bombings', 9, false),
('b0000000-0000-0000-0e10-000000000002', 'b0000000-0000-0000-c4a0-000000000002', 'b0000000-0000-0000-fac0-000000000003', 'leader_of', 'Founder-Commander of the modern Tribhuj resistance', 10, false),
('b0000000-0000-0000-0e10-000000000003', 'b0000000-0000-0000-c4a0-000000000003', 'b0000000-0000-0000-fac0-000000000001', 'leader_of', 'Supreme military leader and head of Bharatsena', 10, false),
('b0000000-0000-0000-0e10-000000000004', 'b0000000-0000-0000-c4a0-000000000003', 'b0000000-0000-0000-fac0-000000000004', 'leader_of', 'Head of the General Directorate, apex political figure', 10, false),
('b0000000-0000-0000-0e10-000000000005', 'b0000000-0000-0000-c4a0-000000000004', 'b0000000-0000-0000-fac0-000000000001', 'member_of', 'Major and tactical-operations second-in-command', 8, false),
('b0000000-0000-0000-0e10-000000000006', 'b0000000-0000-0000-c4a0-000000000005', 'b0000000-0000-0000-fac0-000000000001', 'member_of', 'Major, off-record special ops lead (Guhyakas)', 7, false),
('b0000000-0000-0000-0e10-000000000007', 'b0000000-0000-0000-c4a0-000000000006', 'b0000000-0000-0000-fac0-000000000002', 'member_of', 'Princess and heir-apparent of the Akakpen tribe', 9, false),
('b0000000-0000-0000-0e10-000000000008', 'b0000000-0000-0000-c4a0-000000000007', 'b0000000-0000-0000-fac0-000000000002', 'leader_of', 'Queen and Matriarch of the Akakpen tribe', 10, false),
('b0000000-0000-0000-0e10-000000000009', 'b0000000-0000-0000-c4a0-000000000001', 'b0000000-0000-0000-fac0-000000000005', 'commands', 'Commander of the elite 20-10 investigation squad', 9, false)
ON CONFLICT ON CONSTRAINT lore_rel_unique DO NOTHING;

-- --- Characters → Characters ---

INSERT INTO lore_relationships (id, source_entity_id, target_entity_id, relationship, description, strength, is_spoiler)
VALUES
-- Kahaan ↔ Pratap
('b0000000-0000-0000-0e10-000000000010', 'b0000000-0000-0000-c4a0-000000000001', 'b0000000-0000-0000-c4a0-000000000003', 'reports_to', 'Kahaan reports to Pratap as his military superior and patron', 8, false),
('b0000000-0000-0000-0e10-000000000011', 'b0000000-0000-0000-c4a0-000000000003', 'b0000000-0000-0000-c4a0-000000000001', 'mentor_of', 'Pratap is Kahaan''s patron and ideological mentor — until betrayal', 8, true),
('b0000000-0000-0000-0e10-000000000012', 'b0000000-0000-0000-c4a0-000000000001', 'b0000000-0000-0000-c4a0-000000000003', 'opposes', 'Kahaan ultimately opposes and deposes Pratap at the climax', 10, true),

-- Kahaan ↔ Hana
('b0000000-0000-0000-0e10-000000000013', 'b0000000-0000-0000-c4a0-000000000001', 'b0000000-0000-0000-c4a0-000000000004', 'commands', 'Kahaan commands Hana as her tactical superior', 8, false),
('b0000000-0000-0000-0e10-000000000014', 'b0000000-0000-0000-c4a0-000000000004', 'b0000000-0000-0000-c4a0-000000000001', 'allied_with', 'Hana is Kahaan''s closest ally and moral counterweight', 9, false),

-- Kahaan ↔ Rudra
('b0000000-0000-0000-0e10-000000000015', 'b0000000-0000-0000-c4a0-000000000001', 'b0000000-0000-0000-c4a0-000000000002', 'opposes', 'Initially pursues Rudra as suspected terrorist leader', 7, false),
('b0000000-0000-0000-0e10-000000000016', 'b0000000-0000-0000-c4a0-000000000001', 'b0000000-0000-0000-c4a0-000000000002', 'allied_with', 'Ultimately allies with Rudra and cedes power to him', 9, true),
('b0000000-0000-0000-0e10-000000000017', 'b0000000-0000-0000-c4a0-000000000002', 'b0000000-0000-0000-c4a0-000000000001', 'mentor_of', 'Rudra becomes the mentor Kahaan truly needed', 8, true),

-- Kahaan ↔ Surya
('b0000000-0000-0000-0e10-000000000018', 'b0000000-0000-0000-c4a0-000000000005', 'b0000000-0000-0000-c4a0-000000000001', 'allied_with', 'Surya''s evidence converges with Kahaan''s investigation', 7, true),

-- Kahaan ↔ Arshi
('b0000000-0000-0000-0e10-000000000019', 'b0000000-0000-0000-c4a0-000000000001', 'b0000000-0000-0000-c4a0-000000000006', 'opposes', 'Initial confrontation at the gate standoff, representing state vs tribe', 6, false),
('b0000000-0000-0000-0e10-000000000020', 'b0000000-0000-0000-c4a0-000000000001', 'b0000000-0000-0000-c4a0-000000000006', 'allied_with', 'Eventually allied against the Directorate', 7, true),

-- Rudra ↔ Pratap
('b0000000-0000-0000-0e10-000000000021', 'b0000000-0000-0000-c4a0-000000000002', 'b0000000-0000-0000-c4a0-000000000003', 'opposes', 'Lifelong philosophical enemies — freedom vs control', 10, false),

-- Surya ↔ Pratap
('b0000000-0000-0000-0e10-000000000022', 'b0000000-0000-0000-c4a0-000000000005', 'b0000000-0000-0000-c4a0-000000000003', 'opposes', 'Surya''s entire mission is to expose what Pratap has built', 9, true),

-- Kaali ↔ Arshi
('b0000000-0000-0000-0e10-000000000023', 'b0000000-0000-0000-c4a0-000000000007', 'b0000000-0000-0000-c4a0-000000000006', 'parent_of', 'Kaali is Arshi''s mother and queen', 10, false),
('b0000000-0000-0000-0e10-000000000024', 'b0000000-0000-0000-c4a0-000000000006', 'b0000000-0000-0000-c4a0-000000000007', 'child_of', 'Arshi is daughter and heir to Queen Kaali', 10, false),

-- Hana ↔ Pratap
('b0000000-0000-0000-0e10-000000000025', 'b0000000-0000-0000-c4a0-000000000004', 'b0000000-0000-0000-c4a0-000000000003', 'opposes', 'Discovers Pratap''s war crimes; refuses shoot-to-kill directive', 8, true),

-- Surya ↔ Rudra
('b0000000-0000-0000-0e10-000000000026', 'b0000000-0000-0000-c4a0-000000000005', 'b0000000-0000-0000-c4a0-000000000002', 'allied_with', 'Met at Treaty Hills; Rudra aborted mission on moral grounds', 6, false)
ON CONFLICT ON CONSTRAINT lore_rel_unique DO NOTHING;

-- --- Characters → Technology ---

INSERT INTO lore_relationships (id, source_entity_id, target_entity_id, relationship, description, strength, is_spoiler)
VALUES
('b0000000-0000-0000-0e10-000000000030', 'b0000000-0000-0000-c4a0-000000000001', 'b0000000-0000-0000-dec0-000000000008', 'uses', 'Kahaan''s experimental neural-diode lattice — his core cybernetic enhancement', 10, false),
('b0000000-0000-0000-0e10-000000000031', 'b0000000-0000-0000-c4a0-000000000001', 'b0000000-0000-0000-dec0-000000000002', 'uses', 'Twin Mag-Holster system for floating weapon control', 9, false),
('b0000000-0000-0000-0e10-000000000032', 'b0000000-0000-0000-c4a0-000000000001', 'b0000000-0000-0000-dec0-000000000003', 'uses', 'HUD Monocle over left eye in field operations', 8, false),
('b0000000-0000-0000-0e10-000000000033', 'b0000000-0000-0000-c4a0-000000000001', 'b0000000-0000-0000-dec0-000000000001', 'uses', 'Standard Brace-Comm wrist device', 7, false),
('b0000000-0000-0000-0e10-000000000034', 'b0000000-0000-0000-c4a0-000000000001', 'b0000000-0000-0000-dec0-000000000009', 'uses', 'Thought-pilots the Giddh X-200 scout chopper via neural-diode', 8, false),
('b0000000-0000-0000-0e10-000000000035', 'b0000000-0000-0000-c4a0-000000000004', 'b0000000-0000-0000-dec0-000000000001', 'uses', 'Hana''s Brace-Comm on left wrist for field briefings', 6, false),
('b0000000-0000-0000-0e10-000000000036', 'b0000000-0000-0000-c4a0-000000000006', 'b0000000-0000-0000-dec0-000000000005', 'uses', 'Arshi carries a compact pulse gun (stun/disrupt/lethal)', 7, false),
('b0000000-0000-0000-0e10-000000000037', 'b0000000-0000-0000-c4a0-000000000005', 'b0000000-0000-0000-dec0-000000000006', 'uses', 'Surya uses darts as primary non-lethal takedown', 6, false)
ON CONFLICT ON CONSTRAINT lore_rel_unique DO NOTHING;

-- --- Characters → Locations ---

INSERT INTO lore_relationships (id, source_entity_id, target_entity_id, relationship, description, strength, is_spoiler)
VALUES
('b0000000-0000-0000-0e10-000000000040', 'b0000000-0000-0000-c4a0-000000000003', 'b0000000-0000-0000-a0c0-000000000001', 'located_in', 'Pratap practically lives in his top-floor office at Indrapur HQ', 10, false),
('b0000000-0000-0000-0e10-000000000041', 'b0000000-0000-0000-c4a0-000000000001', 'b0000000-0000-0000-a0c0-000000000001', 'located_in', 'Kahaan operates from Indrapur HQ as investigation base', 8, false),
('b0000000-0000-0000-0e10-000000000042', 'b0000000-0000-0000-c4a0-000000000002', 'b0000000-0000-0000-a0c0-000000000005', 'located_in', 'Rudra''s hermit exile in the Eastern Himalayan Wilds', 9, false),
('b0000000-0000-0000-0e10-000000000043', 'b0000000-0000-0000-c4a0-000000000007', 'b0000000-0000-0000-a0c0-000000000005', 'located_in', 'Kaali rules the Akakpen from the Eastern Himalayan Wilds', 9, false),
('b0000000-0000-0000-0e10-000000000044', 'b0000000-0000-0000-c4a0-000000000006', 'b0000000-0000-0000-a0c0-000000000005', 'located_in', 'Arshi''s homeland in the Eastern Himalayan Wilds', 8, false),
('b0000000-0000-0000-0e10-000000000045', 'b0000000-0000-0000-c4a0-000000000005', 'b0000000-0000-0000-a0c0-000000000006', 'located_in', 'Surya was held at Facility IV before escaping', 7, true),
('b0000000-0000-0000-0e10-000000000046', 'b0000000-0000-0000-c4a0-000000000001', 'b0000000-0000-0000-a0c0-000000000007', 'located_in', 'Kahaan conducts covert surveillance at Phoenix Mall', 5, false),
('b0000000-0000-0000-0e10-000000000047', 'b0000000-0000-0000-c4a0-000000000005', 'b0000000-0000-0000-a0c0-000000000012', 'located_in', 'Surya''s final past mission was at Treaty Hills', 7, false)
ON CONFLICT ON CONSTRAINT lore_rel_unique DO NOTHING;

-- --- Factions → Factions ---

INSERT INTO lore_relationships (id, source_entity_id, target_entity_id, relationship, description, strength, is_spoiler)
VALUES
('b0000000-0000-0000-0e10-000000000050', 'b0000000-0000-0000-fac0-000000000003', 'b0000000-0000-0000-fac0-000000000004', 'opposes', 'The Tribhuj resistance opposes the Directorate''s military rule', 10, false),
('b0000000-0000-0000-0e10-000000000051', 'b0000000-0000-0000-fac0-000000000004', 'b0000000-0000-0000-fac0-000000000003', 'opposes', 'The Directorate has declared the Tribhuj treasonous for half a century', 10, false),
('b0000000-0000-0000-0e10-000000000052', 'b0000000-0000-0000-fac0-000000000002', 'b0000000-0000-0000-fac0-000000000004', 'opposes', 'The Akakpen maintain autonomy against Directorate control via treaties', 7, false),
('b0000000-0000-0000-0e10-000000000053', 'b0000000-0000-0000-fac0-000000000002', 'b0000000-0000-0000-fac0-000000000003', 'allied_with', 'The Akakpen and Tribhuj share opposition to centralised military rule', 6, false),
('b0000000-0000-0000-0e10-000000000054', 'b0000000-0000-0000-fac0-000000000001', 'b0000000-0000-0000-fac0-000000000004', 'allied_with', 'Bharatsena is the military arm of the Directorate government', 10, false),
('b0000000-0000-0000-0e10-000000000055', 'b0000000-0000-0000-fac0-000000000005', 'b0000000-0000-0000-fac0-000000000001', 'member_of', 'Kahaan''s Squad is an elite unit within Bharatsena', 8, false)
ON CONFLICT ON CONSTRAINT lore_rel_unique DO NOTHING;

-- --- Technology → Factions (origin) ---

INSERT INTO lore_relationships (id, source_entity_id, target_entity_id, relationship, description, strength, is_spoiler)
VALUES
('b0000000-0000-0000-0e10-000000000060', 'b0000000-0000-0000-dec0-000000000001', 'b0000000-0000-0000-fac0-000000000001', 'origin_of', 'Brace-Comm developed by Bharatsena Defence R&D', 8, false),
('b0000000-0000-0000-0e10-000000000061', 'b0000000-0000-0000-dec0-000000000002', 'b0000000-0000-0000-fac0-000000000001', 'origin_of', 'Mag-Holster system is standard Bharatsena issue', 8, false),
('b0000000-0000-0000-0e10-000000000062', 'b0000000-0000-0000-dec0-000000000003', 'b0000000-0000-0000-fac0-000000000001', 'origin_of', 'HUD Monocle developed for augmented Bharatsena officers', 7, false),
('b0000000-0000-0000-0e10-000000000063', 'b0000000-0000-0000-dec0-000000000007', 'b0000000-0000-0000-fac0-000000000004', 'origin_of', 'The Mesh surveillance network is operated by the Directorate', 10, false),
('b0000000-0000-0000-0e10-000000000064', 'b0000000-0000-0000-dec0-000000000008', 'b0000000-0000-0000-fac0-000000000001', 'origin_of', 'Neural-diode lattice developed by Bharatsena biotech division', 9, true),
('b0000000-0000-0000-0e10-000000000065', 'b0000000-0000-0000-dec0-000000000009', 'b0000000-0000-0000-fac0-000000000001', 'origin_of', 'Giddh X-200 is a Bharatsena military helicopter', 7, false)
ON CONFLICT ON CONSTRAINT lore_rel_unique DO NOTHING;

-- --- Concept connections ---

INSERT INTO lore_relationships (id, source_entity_id, target_entity_id, relationship, description, strength, is_spoiler)
VALUES
('b0000000-0000-0000-0e10-000000000070', 'b0000000-0000-0000-c00c-000000000001', 'b0000000-0000-0000-a0c0-000000000006', 'located_in', 'Operation KACHA is based in Facility IV of the Thar Sublevels', 10, false),
('b0000000-0000-0000-0e10-000000000071', 'b0000000-0000-0000-c00c-000000000001', 'b0000000-0000-0000-dec0-000000000008', 'origin_of', 'KACHA program is the scaled version of neural-diode technology', 9, true),
('b0000000-0000-0000-0e10-000000000072', 'b0000000-0000-0000-c4a0-000000000003', 'b0000000-0000-0000-c00c-000000000002', 'created_by', 'Pratap orchestrated the 20-10 bombings as a false-flag operation', 10, true)
ON CONFLICT ON CONSTRAINT lore_rel_unique DO NOTHING;

-- =============================================================================
-- WRITING FRAGMENTS (~35)
-- =============================================================================

-- --- Dialogue samples ---

INSERT INTO writing_fragments (id, fragment_type, content, character_id, style_notes, tags)
VALUES
('b0000000-0000-0000-f0a0-000000000001', 'dialogue',
 $$"Every answer pulls a deeper thread, and every thread leads closer to the hands that built the cage."$$,
 'b0000000-0000-0000-c4a0-000000000001',
 'Kahaan''s investigative voice — measured, analytical, growing cynical. Use when he is piecing together conspiracy evidence.',
 ARRAY['kahaan', 'investigation', 'conspiracy']),

('b0000000-0000-0000-f0a0-000000000002', 'dialogue',
 $$"Security exists to protect every life, never to dominate."$$,
 'b0000000-0000-0000-c4a0-000000000002',
 'Rudra''s philosophical voice — simple, declarative, weighty. His sentences carry the authority of someone who gave up power.',
 ARRAY['rudra', 'philosophy', 'resistance']),

('b0000000-0000-0000-f0a0-000000000003', 'dialogue',
 $$"Order requires sacrifice. He decides who pays."$$,
 'b0000000-0000-0000-c4a0-000000000003',
 'Narrator description of Pratap — not his own words but the way others understand him. His own speech is softer, more measured, more dangerous.',
 ARRAY['pratap', 'power', 'sacrifice']),

('b0000000-0000-0000-f0a0-000000000004', 'dialogue',
 $$"The paper is clean. The world isn''t."$$,
 'b0000000-0000-0000-c4a0-000000000005',
 'Surya''s terse, clipped style — Hyderabad Telugu cadence. Maximum meaning in minimum words. Use after evidence retrieval scenes.',
 ARRAY['surya', 'evidence', 'mission']),

('b0000000-0000-0000-f0a0-000000000005', 'dialogue',
 $$"Working Hard, So you don''t have to."$$,
 NULL,
 'Holographic billboard slogan in Lakshmanpur — the Directorate''s benevolent facade distilled into advertising copy. Dripping with irony in context.',
 ARRAY['propaganda', 'lakshmanpur', 'dystopia']),

('b0000000-0000-0000-f0a0-000000000006', 'dialogue',
 $$"Greetings from the Tribhuj."$$,
 NULL,
 'Jwala''s broadcast opening during the BVN studio hijack. Calm, centered, devastating. The voice that cracked the nation''s screen.',
 ARRAY['tribhuj', 'broadcast', 'jwala', 'new-tribhuj']),

('b0000000-0000-0000-f0a0-000000000007', 'dialogue',
 $$"Good grouping."$$,
 NULL,
 'Colonel Arvind''s only praise to Hana after she broke his marksmanship record — the faint praise that shaped her entire psychology. Two words that carry a childhood''s worth of longing.',
 ARRAY['hana', 'father', 'backstory'])

ON CONFLICT DO NOTHING;

-- --- Description passages ---

INSERT INTO writing_fragments (id, fragment_type, content, character_id, style_notes, tags)
VALUES
('b0000000-0000-0000-f0a0-000000000010', 'description',
 $$Rudra''s physique was scar-latticed yet powerful, a body forged by decades of martial discipline. First seen camouflaged in an olive hood, he balanced on spruce branches with two arrows nocked, motionless as bark — visual shorthand for predator-calm precision.$$,
 'b0000000-0000-0000-c4a0-000000000002',
 'Character introduction description. Emphasises stillness, scars as earned history, and nature camouflage. The prose should feel like holding a breath.',
 ARRAY['rudra', 'introduction', 'physical']),

('b0000000-0000-0000-f0a0-000000000011', 'description',
 $$Commuters coasted above six-lane boulevards flanked by holographic billboards. Festival Fortnight had just ended, but neon drones still patrolled for curfew violators. In cafes, civilians joked that paying cash got you stared at as if money were a museum piece.$$,
 NULL,
 'Lakshmanpur morning texture — the polished dystopia. Blend wonder and unease in equal measure. The tech dazzles; the implications chill.',
 ARRAY['lakshmanpur', 'worldbuilding', 'dystopia', 'texture']),

('b0000000-0000-0000-f0a0-000000000012', 'description',
 $$The Tri-Anchor Wall loomed behind Pratap''s desk: a foundational leader portrait in tone-on-tone metal, a framed national preamble in matte off-white, and a strategic wall map on frosted glass — all floating on a cold back-lit field that threw soft linear bars across faces and surfaces.$$,
 NULL,
 'Indrapur HQ Command Suite description. The three-item composition (portrait, preamble, map) recurs in every scene set here. The "bars" motif suggests prison.',
 ARRAY['indrapur-hq', 'command-suite', 'pratap', 'setting']),

('b0000000-0000-0000-f0a0-000000000013', 'description',
 $$Two compact pistols hovered at shoulder height with a faint electric-blue control shimmer, micro-adjusting in the air as if on invisible gimbals. Where Kahaan looked, they followed.$$,
 'b0000000-0000-0000-c4a0-000000000001',
 'Kahaan''s signature combat visual — the floating guns. Keep the shimmer understated; the effect should feel surgical, not cinematic.',
 ARRAY['kahaan', 'combat', 'cybernetic', 'mag-holster']),

('b0000000-0000-0000-f0a0-000000000014', 'description',
 $$Arshi stood at the gate, feet parallel and shoulder-width apart, palms visible at rib height for de-escalation. Behind her, the fortress faded into evening blue-hour. She did not blink as Kahaan approached.$$,
 'b0000000-0000-0000-c4a0-000000000006',
 'Arshi''s defiance posture — physical vocabulary of resistance. The composure speaks louder than any dialogue that might follow.',
 ARRAY['arshi', 'gate-standoff', 'defiance']),

('b0000000-0000-0000-f0a0-000000000015', 'description',
 $$With clipped navy-blue uniform, dark-brown wedge cut and the easy poise of a champion marksman, Major Hana looked every millimetre the regulation poster-officer. Yet passers-by sensed something the starch could not iron out: the human quickness in her eyes when civilian families wandered too close to a checkpoint.$$,
 'b0000000-0000-0000-c4a0-000000000004',
 'Hana''s introduction — military perfection with a humanitarian tell. The contrast between regulation exterior and empathetic interior defines her.',
 ARRAY['hana', 'introduction', 'character', 'empathy'])

ON CONFLICT DO NOTHING;

-- --- Action sequences ---

INSERT INTO writing_fragments (id, fragment_type, content, character_id, style_notes, tags)
VALUES
('b0000000-0000-0000-f0a0-000000000020', 'action',
 $$Surya set the wedge. Mirror check. Charge tape along the hinge edge. Mask on. Three breaths. Click. Push. He flooded the room with throw-light and decided in under two seconds: one hostile, armed, left corner. Dart. The man folded like wet paper. Surya pulled the room to cold.$$,
 'b0000000-0000-0000-c4a0-000000000005',
 'Surya''s CQB entry — staccato, verb-heavy, no adjective clutter. Each sentence is a single action. The prose moves at operator speed.',
 ARRAY['surya', 'action', 'cqb', 'breach']),

('b0000000-0000-0000-f0a0-000000000021', 'action',
 $$The door-wedge micro-jammer held. Aarush''s stairwell cans bought them ninety seconds of silence from the tower. Adil walked to the anchor desk as if he owned it — because tonight, in every way that mattered, he did. Jwala centered herself on the lens. The graphics tech loaded the montage. Then Adil raised the pistol.$$,
 NULL,
 'BVN studio hijack sequence — controlled chaos. The calm professionalism of the New Tribhuj operatives contrasts with the violence of the act.',
 ARRAY['new-tribhuj', 'studio-hijack', 'bvn', 'action']),

('b0000000-0000-0000-f0a0-000000000022', 'action',
 $$Hana''s scope-eye softened. Her lashes relaxed, breath released in a visible cloud. The barrel dipped. She chose the field-dressing kit over the trigger and was already running before the scope hit the ground.$$,
 'b0000000-0000-0000-c4a0-000000000004',
 'Hana''s mercy beat — the scope-lower motif. This gesture defines her arc: the moment a soldier becomes a healer. Silence after the barrel dips.',
 ARRAY['hana', 'mercy', 'moral-choice', 'sniper']),

('b0000000-0000-0000-f0a0-000000000023', 'action',
 $$The tunnel ambush came without warning. A broken circuit severed Kahaan''s control mid-flight — the floating pistols fell like dead birds. Then the blast. Manan was down. Kahaan''s ears rang with the ghost of Africa, and for three paralysed seconds, he was twenty-two again, kneeling in someone else''s blood.$$,
 'b0000000-0000-0000-c4a0-000000000001',
 'Kahaan''s visit-to-death beat — the circuit failure + PTSD flashback. The falling guns are the physical signal that control has failed. The prose should blur present and past.',
 ARRAY['kahaan', 'tunnel-ambush', 'ptsd', 'manan', 'crisis'])

ON CONFLICT DO NOTHING;

-- --- Internal monologue ---

INSERT INTO writing_fragments (id, fragment_type, content, character_id, style_notes, tags)
VALUES
('b0000000-0000-0000-f0a0-000000000030', 'internal_monologue',
 $$He had worshipped order the way drowning men worship air — as the only thing between him and the dark. But what if the air itself was poison?$$,
 'b0000000-0000-0000-c4a0-000000000001',
 'Kahaan''s mid-novel realisation. The metaphor of air/poison connects to OxyPoles (clean air masking surveillance). Layer the irony.',
 ARRAY['kahaan', 'realisation', 'order-vs-freedom']),

('b0000000-0000-0000-f0a0-000000000031', 'internal_monologue',
 $$Each medal she earned won a nod from Colonel Arvind, but each nod now felt like adding a coin to a corrupt treasury.$$,
 'b0000000-0000-0000-c4a0-000000000004',
 'Hana''s growing disillusionment — the medal/coin/treasury metaphor links military honour to moral bankruptcy. Quiet prose, not dramatic.',
 ARRAY['hana', 'disillusionment', 'father', 'medals']),

('b0000000-0000-0000-f0a0-000000000032', 'internal_monologue',
 $$Surya laid the weapons in an L-shape within arm''s reach, pressed his palm to the doorframe, and let five slow Telugu breaths count down to something that was not quite sleep.$$,
 'b0000000-0000-0000-c4a0-000000000005',
 'Surya''s decompression ritual — the L-shaped weapon layout and palm-press are consistent tells. Telugu breaths anchor his identity. Always end his quiet scenes this way.',
 ARRAY['surya', 'ritual', 'decompression', 'telugu'])

ON CONFLICT DO NOTHING;

-- --- World detail exposition ---

INSERT INTO writing_fragments (id, fragment_type, content, character_id, style_notes, tags)
VALUES
('b0000000-0000-0000-f0a0-000000000040', 'world_detail',
 $$Religion, caste surnames and most independent media are banned. Former mosques and temples now house cancer institutes and senate chambers — architectural reminders that faith has been repurposed for state utility.$$,
 NULL,
 'Core world exposition. The detail about repurposed religious buildings is one of the novel''s most powerful images. Use sparingly but consistently.',
 ARRAY['worldbuilding', 'religion-ban', 'architecture', 'dystopia']),

('b0000000-0000-0000-f0a0-000000000041', 'world_detail',
 $$A nationwide lattice of cameras cross-checks faces, gaits, and even emotional micro-expressions. Digital wallets record every sale; social media sentiment is mined in real time. Safety is bought with total transparency.$$,
 NULL,
 'The Mesh in summary — the bargain of Bharatvarsh. Citizens trade privacy for safety. The prose should read as neutral reportage that becomes chilling on reflection.',
 ARRAY['the-mesh', 'surveillance', 'worldbuilding']),

('b0000000-0000-0000-f0a0-000000000042', 'world_detail',
 $$OxyPoles — tree-shaped catalytic towers — scrubbed exhaust along the boulevard, their crowns humming a sub-audible note that sounded, if you listened too long, like a lullaby for a city that had forgotten how to sleep on its own.$$,
 NULL,
 'OxyPole poetic description — the lullaby metaphor makes the infrastructure feel both nurturing and narcotic. Use in establishing shots of any major city.',
 ARRAY['oxypole', 'worldbuilding', 'infrastructure', 'metaphor']),

('b0000000-0000-0000-f0a0-000000000043', 'world_detail',
 $$In the Andaman Cellular Jail — a vast pentagonal fortress on its own island — dissidents disappeared into D-Wing''s interrogation suites, where no one who goes in ever comes out.$$,
 NULL,
 'The Andaman Jail description — the regime''s blunt instrument. The passive voice ("disappeared") mirrors how the regime makes people vanish. Keep the tone flat, factual, terrifying.',
 ARRAY['andaman', 'prison', 'dissidents', 'worldbuilding']),

('b0000000-0000-0000-f0a0-000000000044', 'world_detail',
 $$All discoveries spend a compulsory defence-first cycle in classified labs before partial release to commercial firms. Anti-ageing serums, memory-editing chips, advanced prostheses — the army gets them first, and the people get what''s left.$$,
 NULL,
 'Technology trickle-down explanation — the "defence-first cycle" is key to understanding why civilian tech is always one generation behind military. The final clause carries the bitterness.',
 ARRAY['technology', 'defence-first', 'worldbuilding', 'inequality']),

('b0000000-0000-0000-f0a0-000000000045', 'world_detail',
 $$The Tribhuj Puran had been declared treasonous for almost half a century. Yet in the mountain villages, where the Mesh thinned to static and the OxyPoles gave way to actual trees, old women still hummed its verses while grinding spice.$$,
 NULL,
 'The persistence of banned culture — the contrast between digital suppression and human memory. "Actual trees" is the key detail: nature versus engineered greenery.',
 ARRAY['tribhuj', 'culture', 'resistance', 'mountains', 'worldbuilding']),

('b0000000-0000-0000-f0a0-000000000046', 'world_detail',
 $$Those who hunger for absolute power are, by definition, the people who must never wield it; a society thrives only when it is free to grow organically.$$,
 NULL,
 'The novel''s core thematic statement. Use as an epigraph or as Rudra''s final philosophical declaration. Every plot beat should test, stress, and ultimately prove this proposition.',
 ARRAY['theme', 'philosophy', 'power', 'freedom', 'core-argument'])

ON CONFLICT DO NOTHING;

COMMIT;
