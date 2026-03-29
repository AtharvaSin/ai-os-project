#!/usr/bin/env python3
"""
seed_content_arc2.py
--------------------
Arc 2 — Characters & Stakes (Posts 6–10)

1. Checks whether migration 020 (content_posts table) exists in the live DB.
   If not, applies database/migrations/020_content_pipeline.sql automatically.
2. Upserts the 5 Arc 2 posts into content_posts (idempotent via ON CONFLICT DO NOTHING).
3. Appends the 5 rows to content-pipelines/bharatvarsh/calendar/content_calendar.csv (skips if already present).

Run from project root:
    python scripts/seed_content_arc2.py
"""

import os
import sys
import csv
import ssl
import pathlib
import textwrap

try:
    import pg8000.native as pg
except ImportError:
    sys.exit("pg8000 not found — run: pip install pg8000")

# ── DB connection ──────────────────────────────────────────────────────────────
# Local docker postgres (ai-os-postgres-local) — runs on host port 5434.
# For production (Cloud SQL): start cloud-sql-proxy on 127.0.0.1:15432
#   and change DB_HOST/DB_PORT/DB_PASS accordingly.
DB_HOST = os.environ.get("DB_HOST", "127.0.0.1")
DB_PORT = int(os.environ.get("DB_PORT", "5434"))
DB_NAME = os.environ.get("DB_NAME", "ai_os")
DB_USER = os.environ.get("DB_USER", "ai_os_admin")
DB_PASS = os.environ.get("AI_OS_DB_PASSWORD", "localdev")

PROJECT_ROOT = pathlib.Path(__file__).parent.parent
MIGRATION_FILE = PROJECT_ROOT / "database" / "migrations" / "020_content_pipeline.sql"
CALENDAR_CSV   = PROJECT_ROOT / "content-pipelines/bharatvarsh" / "calendar" / "content_calendar.csv"


# ── Arc 2 post data ────────────────────────────────────────────────────────────

POSTS = [
    {
        "post_id":             "BHV-20260421-001",
        "campaign":            "arc2-characters-and-stakes",
        "story_angle":         "bharatsena",
        "distillation_filter": "novel_intro",
        "content_channel":     "declassified_report",
        "topic":               "Officer Profile — Kahaan, Head of Mesh Intelligence Division",
        "hook":                "22 years. Zero infractions. Psychological profile: [REDACTED].",
        "caption_text": textwrap.dedent("""\
            BHARATVARSH DIRECTORATE OF MESH INTELLIGENCE
            PERSONNEL RECORD — FIELD DIVISION
            — DECLASSIFIED EXCERPT, MARCH 2026 —

            DESIGNATION: Senior Investigation Officer, Division Head
            SERVICE NUMBER: MID-042-[REDACTED]
            AGE AT ASSIGNMENT: 42
            YEARS IN SERVICE: 22
            COMMENDATIONS: 17
            INFRACTIONS: 0

            CAREER SUMMARY:
            Graduated Bharatsena Advanced Training Institute, 2003. Ranked first in cohort. Declined parallel-track appointment to Directorate command structure — requested field assignment. Fourth time a first-rank graduate has done so in the Institute's history.

            Specialisation: High-topology anomaly investigation. Called in when the Mesh sees something it cannot classify.

            CURRENT ASSIGNMENT: Chief Investigative Officer, Operation 20-10.
            Assignment effective: 21 October 2025.

            DIRECTORATE AUTHORISATION: Full Omega-level clearance granted for the duration of Operation 20-10. Precedent: first field officer granted Omega clearance while retaining operational command since the 1984 Emergency.

            PSYCHOLOGICAL PROFILE: [REDACTED — OMEGA CLEARANCE]
            PERSONAL HISTORY: [REDACTED — OMEGA CLEARANCE]

            NOTE FROM DIRECTOR GENERAL, MESH INTELLIGENCE:
            "He will find what we cannot find. He always has. Give him what he asks for."

            www.welcometobharatvarsh.com"""),
        "lore_refs":          "Bible:Characters:Kahaan,Bible:World:MeshIntelligence,Bible:Timeline:2025-20-10-Bombings",
        "classified_status":  "declassified",
        "platforms":          "instagram,twitter,facebook",
        "format_instagram":   "feed_post",
        "format_twitter":     "single_tweet",
        "format_facebook":    "post",
        "visual_direction": textwrap.dedent("""\
            Jim Lee graphic novel spread — a declassified Bharatsena Directorate personnel dossier rendered as a dramatic panel composition. Left column: a high-contrast surveillance-style portrait of a man in his early forties. The photograph has the quality of a Mesh hovercam capture — slightly elevated angle, not posed, clinical precision. His face is composed, not cold: watchful eyes carrying seventeen commendations and zero infractions in a single gaze. Bharatsena officer collar at the neck. The portrait is bordered in Mustard Gold (#F1C232) — a system flag marking the file as currently active.

            Right column: JetBrains Mono typeface dossier fields on aged paper (#C3B49B warm tones). Four blocks of text. Three are visible. One — the psychological profile — is covered by a solid black REDACTED bar rendered with the graphic density of Jim Lee's heaviest cross-hatching. The personal history block carries a second identical bar. The weight of the black bars dominates the right side of the composition.

            At the top-right: the Bharatsena Directorate seal — an abstracted Ashoka Chakra enclosed in a hexagonal surveillance grid. At the bottom of the document: a deep-red stamp at a slight angle reading DECLASSIFIED, and alongside it, a secondary stamp: OMEGA ACCESS REQUIRED FOR FULL RECORD.

            Background: obsidian (#0A0D12) outer frame. The document sits slightly angled — as if placed on a desk and photographed, not scanned. The imperfection makes it feel found rather than produced. Dense cross-hatching in the portrait's shadows, particularly around the eyes and jaw. The gold border on the photograph catches simulated light from above. Everything else is cool obsidian and warm aged paper."""),
        "status":             "planned",
        "scheduled_date":     "2026-04-21",
        "scheduled_time":     "12:00",
        "target_audience":    "A,B,C",
        "hashtags":           "#Bharatvarsh #KahaanFile #MeshIntelligence #WhoIsHe #21Oct2025 #IndianSciFi #DystopianFiction",
        "cta_type":           "website",
        "cta_link":           "https://welcometobharatvarsh.com",
    },
    {
        "post_id":             "BHV-20260424-001",
        "campaign":            "arc2-characters-and-stakes",
        "story_angle":         "akakpen",
        "distillation_filter": "living_without_religion",
        "content_channel":     "graffiti_photo",
        "topic":               "The Last Temple — Darjeeling Treaty Hills, c. 2019",
        "hook":                "A Bharatsena survey drone documented this in November 2019. The drone was subsequently lost to a jammer at 4,200 feet. The shrine was not disturbed.",
        "caption_text": textwrap.dedent("""\
            The Treaty Zone has no Form R-17.

            No application. No 6-to-8-week processing window. No 23% approval rate. No Department of Civic Harmony sign-off. No APPROVED CONTEMPLATION SPACE plaque on the wall.

            The shrine in the photograph above was documented by a Bharatsena survey drone during a routine perimeter sweep in November 2019. The drone was subsequently lost to a jammer signal at approximately 4,200 feet above sea level.

            The shrine was not disturbed. No record was made of the site's religious classification. No Form R-17 applicant has ever been asked: are your beads stone or electronic? Are your prayers pointed east? Does your incense burn at dawn?

            Inside Bharatvarsh, every one of those questions has an answer on file.

            Up here, they just don't ask.

            www.welcometobharatvarsh.com

            ·
            ·
            ·

            #Bharatvarsh #TreatyZone #TheLastTemple #FormR17 #WhatTheyCallContraband #IndianSciFi #DystopianFiction"""),
        "lore_refs":          "Bible:World:TreatyZone,Bible:World:ReligionBanned,Bible:Locations:DarjeelingTreatyHills",
        "classified_status":  "declassified",
        "platforms":          "instagram,twitter",
        "format_instagram":   "feed_post",
        "format_twitter":     "single_tweet",
        "format_facebook":    "",
        "visual_direction": textwrap.dedent("""\
            Jim Lee atmospheric composition — a mountain shrine at the Treaty Zone's Darjeeling Hills, pre-dawn golden hour. A low stone altar built into a natural rocky outcrop, its surface worn smooth by years of weather and touch. Three brass vessels hold incense sticks, one still burning — a thin thread of smoke rising vertically in still air, the one element with no cross-hatching. At the altar's centre: a small brass figurine, its form suggested rather than defined — enough to read as sacred, not enough to specify. Above the altar, strung between two ancient cedar trees: prayer flags in faded orange, white, and deep red, their edges fraying, each tear rendered in precise Jim Lee linework.

            The valley behind drops away sharply into morning mist — vast, deep, unmonitored. Distant pine ridgelines dissolve into haze. The sky above the shrine is clear. No hovercams. No surveillance grid. The emptiness of the sky is a presence.

            At the lower right of the composition, barely within frame: the inert chassis of a Bharatsena survey drone, face-down on a bed of moss, its blue scanner light dead. It fell here. The shrine stands above it. The only technology in the frame. It does not dominate. It does not belong.

            Akakpen palette only: deep greens (#162B18), bark brown (#4E3B2A), warm ochre of the brass vessels, muted prayer flag colours, morning mist as atmospheric depth. No artificial light. No HUD elements. Rule of thirds: shrine at centre-left, drone at lower-right, prayer flags as a diagonal line between sacred and fallen. Maximum textural detail on the rock altar surface, cedar bark, fraying prayer flag edges, drone chassis."""),
        "status":             "planned",
        "scheduled_date":     "2026-04-24",
        "scheduled_time":     "18:00",
        "target_audience":    "A,B",
        "hashtags":           "#Bharatvarsh #TreatyZone #TheLastTemple #FormR17 #WhatTheyCallContraband #IndianSciFi #DystopianFiction",
        "cta_type":           "website",
        "cta_link":           "https://welcometobharatvarsh.com",
    },
    {
        "post_id":             "BHV-20260427-001",
        "campaign":            "arc2-characters-and-stakes",
        "story_angle":         "bharatsena",
        "distillation_filter": "med_mil_progress",
        "content_channel":     "news_article",
        "topic":               "Bracecomm 4.0 — 98.6% Adoption. Zones 4 & 5 Achieve Zero Crime.",
        "hook":                "\"The citizen who wears it is known. The citizen who is known is safe.\" — Dept. of Civic Harmony, October 15, 2025.",
        "caption_text": textwrap.dedent("""\
            [BVN-24x7 TECHNOLOGY DESK] The Bracecomm 4.0 has reached 98.6% voluntary civilian adoption across Bharatvarsh — the highest uptake of any consumer technology in the nation's recorded history, the Department of Civic Harmony confirmed today.

            New capabilities in the 4.0 iteration:
            — Passive health diagnostics: pulse, SpO2, cortisol index, sleep quality score
            — Integrated biometric e-wallet: transit, retail, civic services — one wrist, everything
            — Emergency alert broadcast: Directorate notifications delivered direct to wrist
            — Citizen Convenience Index tracking: updated hourly, visible to the wearer and to the Mesh
            — Seismic-grade impact detection: automated emergency response for accidents and falls

            The Department notes that Zones 4 and 5 — the first two zones to achieve full Bracecomm 4.0 adoption — were designated Zero Crime Zones in Q2 2025. Third consecutive quarter of zero recorded criminal incidents in both zones.

            A Department spokesperson, when asked about the remaining 1.4% of citizens without devices:

            "The Bracecomm is not a surveillance device. It is a care device. The citizen who wears it is known. The citizen who is known is safe."

            Outreach officers have been assigned to assist the remaining unregistered citizens with the transition process.

            This report was filed: October 15, 2025.

            www.welcometobharatvarsh.com

            ·
            ·
            ·

            #Bharatvarsh #Bracecomm #ZeroCrime #TheCitizenWhoIsKnown #October2025 #IndianSciFi #DystopianFiction"""),
        "lore_refs":          "Bible:World:Bracecomm,Bible:World:MeshPhase3,Bible:World:ZeroCrime",
        "classified_status":  "declassified",
        "platforms":          "twitter,instagram,facebook",
        "format_instagram":   "feed_post",
        "format_twitter":     "single_tweet",
        "format_facebook":    "post",
        "visual_direction": textwrap.dedent("""\
            BVN-24x7 broadcast frame rendered as a Jim Lee graphic novel panel. Top bar: BVN-24x7 masthead in institutional sans-serif on navy (#0B2742). Lower-third chyron in the same navy with a Mustard Gold (#F1C232) accent stripe: "BRACECOMM 4.0 LAUNCH — ZONES 4 & 5 ACHIEVE ZERO CRIME DESIGNATION."

            Main frame: Jim Lee close-up — a wrist, anonymous, gender-neutral, lit from above by the device's own glow. The Bracecomm 4.0: matte obsidian casing, curved holographic display in Mesh cyan (#17D0E3). Display shows: a pulse waveform, location grid reference (LAKSHMANPUR — ZONE 4), citizen convenience index at 94, and a small green indicator glowing: ZERO CRIME ZONE. The device is genuinely beautiful. The kind of thing you'd want to wear.

            The hand is open, relaxed. There is nothing threatening in the image.

            Behind the wrist, in shallow focus: a residential street at night. An OxyPole's green glow. A Mesh hovercam visible in the upper distance, its scanner light a small cold blue. The street is empty — not abandoned, perfectly empty. Zero crime. Nothing to see.

            Dense Jim Lee cross-hatching on the device chassis, forearm musculature, shadow between the fingers. The holographic readout in fine precision linework with cyan glow. Palette: deep navy and obsidian, the Bracecomm display the only warm light source.

            At the lower right of the broadcast frame, in small but legible type: October 15, 2025. Six days before Operation 20-10 begins."""),
        "status":             "planned",
        "scheduled_date":     "2026-04-27",
        "scheduled_time":     "10:00",
        "target_audience":    "A,B,C",
        "hashtags":           "#Bharatvarsh #Bracecomm #ZeroCrime #TheCitizenWhoIsKnown #October2025 #IndianSciFi #DystopianFiction",
        "cta_type":           "website",
        "cta_link":           "https://welcometobharatvarsh.com",
    },
    {
        "post_id":             "BHV-20260430-001",
        "campaign":            "arc2-characters-and-stakes",
        "story_angle":         "tribhuj",
        "distillation_filter": "living_without_religion",
        "content_channel":     "declassified_report",
        "topic":               "Evidence Inventory — Tribhuj Puran Seized, Block 14-C, 2024",
        "hook":                "They burned the books. The Directorate estimates 847 copies remain in circulation in Lakshmanpur alone.",
        "caption_text": textwrap.dedent("""\
            LAKSHMANPUR DISTRICT AUTHORITY
            EVIDENCE DISPOSAL RECORD — LMP-2024-R17-0091
            Filed: 14 September 2024
            Location: Block 7, Sector 7 — Basement Level 3, Unit 14-C.

            ITEMS SEIZED:

            ITEM 01 — Tribhuj Puran (printed copy, 3 copies recovered)
            Classification: Banned publication. Directive 1984-R, Section 12.
            Disposition: INCINERATED.

            ITEM 02 — Personal counting apparatus, non-electronic. 108 beads, natural stone. Single cord, hand-knotted.
            Classification: Unregistered sensory aid per Form R-17 Approved Aids Schedule.
            Disposition: INCINERATED.

            ITEM 03 — Grey cloth bearing trident insignia, approximately 40cm × 40cm. Condition: well-worn.
            Classification: Banned faction symbol. Directive 2003-T, Section 4.
            Disposition: INCINERATED.

            ITEM 04 — Handwritten correspondence, 3 pages. Language: Hindi. Author: unknown.
            Contents: [REDACTED — CLEARANCE LEVEL DELTA-3]
            Disposition: TRANSFERRED TO MESH INTELLIGENCE ARCHIVE.

            SUSPECT NOTE ON FILE:
            Upon completion of inventory, the suspect requested return of Item 02 — the counting beads — for personal use during the processing period. Request denied per Evidence Protocol Section 4, Clause 17-B. Suspect complied without incident.

            DIRECTORATE ESTIMATE (appended):
            847 copies of the Tribhuj Puran believed to remain in active circulation in Lakshmanpur district alone. Methods of reproduction: handwritten transcription, illicit photocopier access, microfilm. Recommendation: continued enforcement.

            For civic services and Form R-17 contemplation permits: www.welcometobharatvarsh.com

            ·
            ·
            ·

            #Bharatvarsh #TribhujPuran #Block14C #847CopiesRemain #TheyBurnedTheBooks #IndianSciFi #DystopianFiction"""),
        "lore_refs":          "Bible:World:ReligionBanned,Bible:World:TribhujPuran,Bible:Themes:EngineeredConsent,Bible:Characters:Rudra:Tribhuj",
        "classified_status":  "declassified",
        "platforms":          "instagram,twitter,facebook",
        "format_instagram":   "feed_post",
        "format_twitter":     "single_tweet",
        "format_facebook":    "post",
        "visual_direction": textwrap.dedent("""\
            Jim Lee forensic evidence spread — a formal evidence table, institutional grey, overhead lighting rendered as flat even light with heavy shadow in the corners. Three objects laid out with numbered evidence tags.

            COMPOSITIONAL FOCUS — ITEM 02, centre frame: 108 natural stone prayer beads coiled on the metal table. Jim Lee renders each bead individually: slightly different in size and surface texture, the cord knotted at regular intervals, worn smooth by years of daily handling. The beads are the most human object in the frame — the most delicate, the most personal. They catch the overhead light in a way the other objects do not. They have no INCINERATED stamp over them yet. In the composition, they are in the moment just before.

            Left of the beads: three copies of the Tribhuj Puran, stacked. Cloth-bound, deep charcoal grey covers. On the top copy: a grey trident — three prongs, embossed into the cloth — and nothing else. Spines cracked, pages softened by reading. No title text.

            Right of the beads: the grey trident cloth, unfolded flat. 40cm × 40cm — smaller than you expect. The trident marking centred. This is the same grey cloth from the Sector 7 wall, from the stone in the mountains. On an evidence table it looks very small.

            Around the objects: case number LMP-2024-R17-0091 visible on the form. Over Items 01, 02, and 03: large red rubber-stamp INCINERATED. Over Item 04: TRANSFERRED with a REDACTED bar below it.

            Palette: cool grey evidence table, obsidian shadows, the warm ochre of the stone beads as the single living colour, red INCINERATED stamps as the only other colour. Everything else is grey and shadow."""),
        "status":             "planned",
        "scheduled_date":     "2026-04-30",
        "scheduled_time":     "12:00",
        "target_audience":    "B,C",
        "hashtags":           "#Bharatvarsh #TribhujPuran #Block14C #847CopiesRemain #TheyBurnedTheBooks #IndianSciFi #DystopianFiction",
        "cta_type":           "website",
        "cta_link":           "https://welcometobharatvarsh.com",
    },
    {
        "post_id":             "BHV-20260503-001",
        "campaign":            "arc2-characters-and-stakes",
        "story_angle":         "akakpen",
        "distillation_filter": "novel_intro",
        "content_channel":     "graffiti_photo",
        "topic":               "Unnamed Subject — Treaty Zone Settlement, Nepal Hills, c. 2010",
        "hook":                "He was last seen in Lakshmanpur in 2003. The photograph above was taken approximately 2010. The subject has never been identified.",
        "caption_text": textwrap.dedent("""\
            The photograph was recovered from a Bharatsena Field Reconnaissance Archive, declassified March 2026.

            It was taken by a surveillance unit conducting a boundary sweep of Treaty Zone settlement clusters, approximately 2010. The standard field protocol for documentary photography applies: subjects are not to be approached, engaged, or identified during the sweep. The photograph was filed under: UNIDENTIFIED SUBJECT — NO BRACECOMM REGISTRY MATCH — NO ACTION REQUIRED.

            No further records were found under this case number.

            The following note was appended by the field officer who submitted the photograph:

            "Subject was seated at the eastern edge of the settlement for approximately four hours. He did not move. He did not eat. At some point — I did not see when — he placed something on the stone beside him and left it there when he departed. I retrieved it after he left. Grey cloth. Small. I am not sure why, but I put it back."

            The item in question is visible at the lower right of the frame.

            He was last seen in Lakshmanpur in 2003.

            www.welcometobharatvarsh.com

            ·
            ·
            ·

            #Bharatvarsh #UnnamedSubject #WhoIsHe #TreatyZone #GreyCloth #IndianSciFi #DystopianFiction"""),
        "lore_refs":          "Bible:Characters:Rudra,Bible:Timeline:2003-RudraExile,Bible:World:TreatyZone",
        "classified_status":  "declassified",
        "platforms":          "instagram,twitter",
        "format_instagram":   "feed_post",
        "format_twitter":     "single_tweet",
        "format_facebook":    "",
        "visual_direction": textwrap.dedent("""\
            Jim Lee documentary portrait — surveillance photograph aesthetic, slightly telephoto-compressed, authentically imperfect framing. A man seated on a flat rock at the eastern edge of a Treaty Zone mountain settlement. Three-quarter profile: his face is visible but not centred, gaze directed out over the valley below. He does not know the camera is there, or he does not care.

            He is in his late forties. Weathered. The kind of lean that comes from years outdoors. Strong hands folded loosely in his lap. His clothing is practical: earth-toned, worn at the elbows, the collar faded. He sits with the unhurried ease of someone who has stopped being in a hurry.

            On the flat rock beside him: a folded grey cloth, small — 40cm × 40cm. Not displayed. Not hidden. Simply there. The trident in the fold is barely visible — you would have to look, and know what you were looking for. Jim Lee renders it at one-third the linework density of everything else, as if the cloth itself is trying not to draw attention.

            Behind him: cedar structures of the settlement, smoke from a distant fire, two or three other figures barely visible in the middle ground. The Treaty Zone valley falls away into morning haze. The sky above is wide and clear. No hovercams. No grid. Nothing watching except the camera he doesn't know about.

            The photograph rendered as a scanned surveillance print: slightly grainy, framing slightly imperfect, subject not quite centred. Documentary, not composed. The grain is Jim Lee's cross-hatching at micro-scale simulating film grain. Palette entirely Akakpen: deep greens (#162B18), bark brown (#4E3B2A), pale morning light, the grey of the cloth the only neutral. No artificial light sources."""),
        "status":             "planned",
        "scheduled_date":     "2026-05-03",
        "scheduled_time":     "18:00",
        "target_audience":    "A,B",
        "hashtags":           "#Bharatvarsh #UnnamedSubject #WhoIsHe #TreatyZone #GreyCloth #IndianSciFi #DystopianFiction",
        "cta_type":           "website",
        "cta_link":           "https://welcometobharatvarsh.com",
    },
]


# ── Helpers ────────────────────────────────────────────────────────────────────

def connect():
    kwargs = dict(host=DB_HOST, port=DB_PORT,
                  database=DB_NAME, user=DB_USER, password=DB_PASS)
    # Only add SSL when connecting to Cloud SQL (not local docker)
    if DB_HOST not in ("127.0.0.1", "localhost"):
        import ssl as _ssl
        ssl_ctx = _ssl.create_default_context()
        ssl_ctx.check_hostname = False
        ssl_ctx.verify_mode = _ssl.CERT_NONE
        kwargs["ssl_context"] = ssl_ctx
    return pg.Connection(**kwargs)


def table_exists(conn, table_name):
    row = conn.run(
        "SELECT EXISTS (SELECT 1 FROM information_schema.tables "
        "WHERE table_schema = 'public' AND table_name = :t)",
        t=table_name,
    )
    return row[0][0]


def apply_migration(conn):
    print("Applying migration 020 (content_posts + content_pipeline_log)…")
    sql = MIGRATION_FILE.read_text(encoding="utf-8")
    # pg8000 native executes the whole script in one call
    conn.run(sql)
    print("  Migration 020 applied.")


def upsert_posts(conn):
    inserted = 0
    skipped  = 0
    for p in POSTS:
        existing = conn.run(
            "SELECT 1 FROM content_posts WHERE post_id = :pid", pid=p["post_id"]
        )
        if existing:
            print(f"  SKIP  {p['post_id']} (already in DB)")
            skipped += 1
            continue

        conn.run(
            """
            INSERT INTO content_posts (
                post_id, campaign, content_pillar, story_angle, distillation_filter,
                content_channel, topic, hook, caption_text, lore_refs,
                classified_status, channels, visual_direction,
                scheduled_date, scheduled_time, target_audience,
                hashtags, cta_type, cta_link, status
            ) VALUES (
                :post_id, :campaign, :story_angle, :story_angle, :distillation_filter,
                :content_channel, :topic, :hook, :caption_text, :lore_refs,
                :classified_status, :channels, :visual_direction,
                :scheduled_date, :scheduled_time, :target_audience,
                :hashtags, :cta_type, :cta_link, 'planned'
            )
            """,
            post_id            = p["post_id"],
            campaign           = p["campaign"],
            story_angle        = p["story_angle"],
            distillation_filter= p["distillation_filter"],
            content_channel    = p["content_channel"],
            topic              = p["topic"],
            hook               = p["hook"],
            caption_text       = p["caption_text"],
            lore_refs          = p["lore_refs"],
            classified_status  = p["classified_status"],
            channels           = p["platforms"].split(","),
            visual_direction   = p["visual_direction"],
            scheduled_date     = p["scheduled_date"] if p["scheduled_date"] else None,
            scheduled_time     = p["scheduled_time"] or None,
            target_audience    = p["target_audience"],
            hashtags           = p["hashtags"],
            cta_type           = p["cta_type"],
            cta_link           = p["cta_link"],
        )

        # audit log entry
        conn.run(
            """
            INSERT INTO content_pipeline_log (post_id, action, new_status, details, performed_by)
            VALUES (:pid, 'status_change', 'planned',
                    :details::jsonb, 'seed_content_arc2.py')
            """,
            pid     = p["post_id"],
            details = '{"note":"Arc 2 seed — Characters & Stakes batch"}',
        )

        print(f"  INSERT {p['post_id']} — {p['topic'][:55]}")
        inserted += 1

    return inserted, skipped


def update_csv():
    existing_ids = set()
    rows = []

    if CALENDAR_CSV.exists():
        with open(CALENDAR_CSV, newline="", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            fieldnames = [fn for fn in reader.fieldnames if fn is not None]
            for row in reader:
                # Strip any None keys from trailing commas
                rows.append({k: v for k, v in row.items() if k is not None})
                existing_ids.add(row["post_id"])

    added = 0
    for p in POSTS:
        if p["post_id"] in existing_ids:
            print(f"  CSV SKIP  {p['post_id']} (already in CSV)")
            continue

        rows.append({
            "post_id":                  p["post_id"],
            "campaign":                 p["campaign"],
            "story_angle":              p["story_angle"],
            "distillation_filter":      p["distillation_filter"],
            "content_channel":          p["content_channel"],
            "topic":                    p["topic"],
            "hook":                     p["hook"],
            "caption_text":             p["caption_text"],
            "lore_refs":                p["lore_refs"],
            "classified_status":        p["classified_status"],
            "platforms":                p["platforms"],
            "format_instagram":         p["format_instagram"],
            "format_twitter":           p["format_twitter"],
            "format_facebook":          p["format_facebook"],
            "visual_direction":         p["visual_direction"],
            "prompt_template":          "",
            "asset_ids":                "",
            "status":                   p["status"],
            "scheduled_date":           p["scheduled_date"],
            "scheduled_time":           p["scheduled_time"],
            "target_audience":          p["target_audience"],
            "hashtags":                 p["hashtags"],
            "cta_type":                 p["cta_type"],
            "cta_link":                 p["cta_link"],
            "published_url":            "",
            "performance_impressions":  "",
            "performance_engagement":   "",
            "performance_clicks":       "",
            "performance_notes":        "",
        })
        print(f"  CSV ADD   {p['post_id']} — {p['topic'][:55]}")
        added += 1

    with open(CALENDAR_CSV, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames, quoting=csv.QUOTE_ALL)
        writer.writeheader()
        writer.writerows(rows)

    return added


# ── Main ───────────────────────────────────────────────────────────────────────

def main():
    print("\n══════════════════════════════════════════════════════════")
    print("  Bharatvarsh Content Arc 2 — Seed Script")
    print("  Posts 6–10: Characters & Stakes")
    print("══════════════════════════════════════════════════════════\n")

    # Step 1 — DB
    print("Connecting to Cloud SQL…")
    try:
        conn = connect()
        print("  Connected.\n")
    except Exception as e:
        sys.exit(f"DB connection failed: {e}")

    if not table_exists(conn, "content_posts"):
        apply_migration(conn)
    else:
        print("Migration 020 already applied — content_posts table exists.\n")

    print("Upserting posts into content_posts…")
    db_inserted, db_skipped = upsert_posts(conn)
    print(f"\n  DB: {db_inserted} inserted, {db_skipped} skipped.\n")

    # Step 2 — CSV
    print("Updating content_calendar.csv…")
    csv_added = update_csv()
    print(f"\n  CSV: {csv_added} rows added.\n")

    # Step 3 — Summary
    print("══════════════════════════════════════════════════════════")
    print("  COMPLETE")
    print(f"  DB:  {db_inserted} new rows in content_posts")
    print(f"  CSV: {csv_added} new rows in content_calendar.csv")
    print("══════════════════════════════════════════════════════════\n")
    print("Posts added to pipeline:")
    for p in POSTS:
        print(f"  post-{6 + POSTS.index(p)}  {p['post_id']}  {p['scheduled_date']}  {p['topic'][:50]}")
    print()


if __name__ == "__main__":
    main()
