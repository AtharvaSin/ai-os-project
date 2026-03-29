-- Sync content-pipelines/bharatvarsh CSV to content_posts DB
-- Updates status and taxonomy fields for the 7 active pipeline posts

-- Post 1 (id=1): BHV-20260406-001 - Temple Repurposing
UPDATE content_posts SET
    status = 'planned',
    story_angle = 'bharatsena',
    distillation_filter = 'living_without_religion',
    content_channel = 'declassified_report',
    updated_at = NOW()
WHERE post_id = 'BHV-20260406-001';

-- Post 2 (id=3): BHV-20260409-001 - Drone-Jammer Valley
UPDATE content_posts SET
    status = 'planned',
    story_angle = 'akakpen',
    distillation_filter = 'med_mil_progress',
    content_channel = 'graffiti_photo',
    updated_at = NOW()
WHERE post_id = 'BHV-20260409-001';

-- Post 3 (id=33): BHV-20260412-001 - 1717 Divergence
UPDATE content_posts SET
    status = 'planned',
    story_angle = 'bharatsena',
    distillation_filter = 'med_mil_progress',
    content_channel = 'news_article',
    updated_at = NOW()
WHERE post_id = 'BHV-20260412-001';

-- Post 4 (id=7): BHV-20260415-001 - Trident on the Wall
UPDATE content_posts SET
    status = 'planned',
    story_angle = 'tribhuj',
    distillation_filter = 'novel_intro',
    content_channel = 'graffiti_photo',
    updated_at = NOW()
WHERE post_id = 'BHV-20260415-001';

-- Post 5 (id=10): BHV-20260418-001 - Basement Meditation Permits
UPDATE content_posts SET
    status = 'planned',
    story_angle = 'bharatsena',
    distillation_filter = 'living_without_religion',
    content_channel = 'news_article',
    updated_at = NOW()
WHERE post_id = 'BHV-20260418-001';

-- Post 6 (id=31): BHV-20260421-001 - Major Kahaan Officer Profile (RENDERED)
UPDATE content_posts SET
    status = 'rendered',
    story_angle = 'bharatsena',
    distillation_filter = 'novel_intro',
    content_channel = 'declassified_report',
    updated_at = NOW()
WHERE post_id = 'BHV-20260421-001';

-- Post 7 (id=16): BHV-20260427-001 - Bracecomm 4.0 (RENDERED)
UPDATE content_posts SET
    story_angle = 'bharatsena',
    distillation_filter = 'med_mil_progress',
    content_channel = 'news_article',
    updated_at = NOW()
WHERE post_id = 'BHV-20260427-001';
