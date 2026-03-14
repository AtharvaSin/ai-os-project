-- Seed: 002_seed_contacts
-- Description: Sample contacts, important dates, audiences, and memberships
-- Purpose: Test data for Birthday Wishes pipeline and audience management
-- Created: 2026-03-14

BEGIN;

-- =============================================================================
-- CONTACTS (10 people — mix of professional & personal, India/UAE/US based)
-- =============================================================================

INSERT INTO contacts (id, name, email, phone, company, title, contact_type, tags, notes, linkedin_url, location) VALUES

-- Professional contacts
('d1000000-0000-0000-0000-000000000001',
 'Rohan Mehta', 'rohan.mehta@techcorp.in', '+91-9876543210',
 'TechCorp India', 'VP of Engineering',
 'professional',
 ARRAY['tech', 'mentor', 'senior-leader'],
 'Met at GCP Summit 2025. Strong AI/ML background. Potential advisor for AI&U channel.',
 'https://linkedin.com/in/rohanmehta',
 'Bangalore, India'),

('d1000000-0000-0000-0000-000000000002',
 'Priya Sharma', 'priya.sharma@cloudnative.io', '+91-9123456789',
 'CloudNative Solutions', 'Cloud Architect',
 'professional',
 ARRAY['cloud', 'gcp', 'collaborator'],
 'Collaborated on GCP migration project. Expert in Cloud Run and serverless.',
 'https://linkedin.com/in/priyasharma-cloud',
 'Hyderabad, India'),

('d1000000-0000-0000-0000-000000000003',
 'Ahmed Al-Rashid', 'ahmed.rashid@rakfin.ae', '+971-50-1234567',
 'RAK Financial Services', 'Director of Digital Innovation',
 'professional',
 ARRAY['fintech', 'uae', 'client', 'banking'],
 'Key contact at RAKBANK ecosystem. Interested in AI compliance tools.',
 'https://linkedin.com/in/ahmedalrashid',
 'Dubai, UAE'),

('d1000000-0000-0000-0000-000000000004',
 'Sarah Chen', 'sarah.chen@zealogics.com', '+1-415-555-0123',
 'Zealogics Inc', 'Senior TPM',
 'professional',
 ARRAY['zealogics', 'tpm', 'colleague'],
 'Fellow TPM at Zealogics. Great resource for onboarding and process questions.',
 'https://linkedin.com/in/sarahchen-tpm',
 'San Francisco, USA'),

('d1000000-0000-0000-0000-000000000005',
 'Vikram Desai', 'vikram.desai@startupforge.in', '+91-9988776655',
 'StartupForge', 'Founder & CEO',
 'professional',
 ARRAY['startup', 'investor', 'ai'],
 'Angel investor interested in AI tools. Read Bharatvarsh and loved it.',
 'https://linkedin.com/in/vikramdesai-sf',
 'Mumbai, India'),

-- Personal contacts
('d1000000-0000-0000-0000-000000000006',
 'Ananya Singh', 'ananya.singh@gmail.com', '+91-9876501234',
 NULL, NULL,
 'personal',
 ARRAY['family', 'close'],
 'Sister. Based in Delhi. Works in graphic design — potential collaborator for Bharatvarsh graphic novel.',
 NULL,
 'Delhi, India'),

('d1000000-0000-0000-0000-000000000007',
 'Karthik Nair', 'karthik.nair@gmail.com', '+91-9011223344',
 'Infosys', 'Technical Lead',
 'both',
 ARRAY['college-friend', 'tech', 'close'],
 'College friend, now at Infosys. Early reader of Bharatvarsh. Subscriber to AI&U.',
 'https://linkedin.com/in/karthiknair-dev',
 'Pune, India'),

('d1000000-0000-0000-0000-000000000008',
 'Meera Joshi', 'meera.joshi@outlook.com', '+91-9556677889',
 'Penguin Random House India', 'Associate Editor',
 'professional',
 ARRAY['publishing', 'bharatvarsh', 'creative'],
 'Editor contact at Penguin. Discussed sequel publishing possibilities.',
 'https://linkedin.com/in/meerajoshi-editor',
 'Mumbai, India'),

('d1000000-0000-0000-0000-000000000009',
 'James O''Brien', 'james.obrien@msft.com', '+1-206-555-0456',
 'Microsoft', 'Principal PM',
 'professional',
 ARRAY['tech', 'mentor', 'ex-colleague'],
 'Former manager at a previous role. Great mentor for product management.',
 'https://linkedin.com/in/jamesobrien-pm',
 'Seattle, USA'),

('d1000000-0000-0000-0000-000000000010',
 'Fatima Al-Zahra', 'fatima.zahra@dubaitech.ae', '+971-55-9876543',
 'Dubai Tech Hub', 'Community Manager',
 'professional',
 ARRAY['uae', 'community', 'events'],
 'Runs Dubai tech community meetups. Good for AI&U channel promotion in UAE.',
 'https://linkedin.com/in/fatimazahra-dth',
 'Dubai, UAE');

-- =============================================================================
-- IMPORTANT DATES (birthdays spread across the year, some near today for testing)
-- =============================================================================

INSERT INTO important_dates (id, contact_id, date_type, date_value, year_known, label, reminder_days_before) VALUES

-- Birthdays near today (March 2026) for pipeline testing
('e1000000-0000-0000-0000-000000000001',
 'd1000000-0000-0000-0000-000000000001',
 'birthday', '1988-03-16', TRUE, NULL, 2),

('e1000000-0000-0000-0000-000000000002',
 'd1000000-0000-0000-0000-000000000006',
 'birthday', '1998-03-18', TRUE, NULL, 3),

('e1000000-0000-0000-0000-000000000003',
 'd1000000-0000-0000-0000-000000000007',
 'birthday', '1995-03-21', TRUE, NULL, 1),

-- Birthdays in other months
('e1000000-0000-0000-0000-000000000004',
 'd1000000-0000-0000-0000-000000000002',
 'birthday', '1990-07-12', TRUE, NULL, 2),

('e1000000-0000-0000-0000-000000000005',
 'd1000000-0000-0000-0000-000000000003',
 'birthday', '1985-11-05', TRUE, NULL, 3),

('e1000000-0000-0000-0000-000000000006',
 'd1000000-0000-0000-0000-000000000004',
 'birthday', '1992-09-23', TRUE, NULL, 1),

('e1000000-0000-0000-0000-000000000007',
 'd1000000-0000-0000-0000-000000000005',
 'birthday', '1983-01-08', TRUE, NULL, 2),

('e1000000-0000-0000-0000-000000000008',
 'd1000000-0000-0000-0000-000000000008',
 'birthday', '1991-05-30', TRUE, NULL, 2),

('e1000000-0000-0000-0000-000000000009',
 'd1000000-0000-0000-0000-000000000009',
 'birthday', '1978-08-14', TRUE, NULL, 3),

('e1000000-0000-0000-0000-000000000010',
 'd1000000-0000-0000-0000-000000000010',
 'birthday', '1993-12-01', TRUE, NULL, 2),

-- Non-birthday important dates
('e1000000-0000-0000-0000-000000000011',
 'd1000000-0000-0000-0000-000000000004',
 'work_anniversary', '2024-06-15', TRUE, 'Started at Zealogics', 1),

('e1000000-0000-0000-0000-000000000012',
 'd1000000-0000-0000-0000-000000000003',
 'custom', '2025-10-20', TRUE, 'RAKBANK partnership signed', 7);

-- =============================================================================
-- CONTACT RELATIONSHIPS
-- =============================================================================

INSERT INTO contact_relationships (contact_id_a, contact_id_b, relationship_type, description, strength) VALUES

('d1000000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000002',
 'colleague', 'Both spoke at GCP Summit 2025', 3),

('d1000000-0000-0000-0000-000000000004', 'd1000000-0000-0000-0000-000000000009',
 'colleague', 'Both in TPM function, different companies', 2),

('d1000000-0000-0000-0000-000000000003', 'd1000000-0000-0000-0000-000000000010',
 'colleague', 'Both in Dubai tech ecosystem', 3),

('d1000000-0000-0000-0000-000000000005', 'd1000000-0000-0000-0000-000000000008',
 'collaborator', 'Vikram considering investing in Bharatvarsh transmedia', 2);

-- =============================================================================
-- AUDIENCES (3 segments)
-- =============================================================================

INSERT INTO audiences (id, name, slug, description, criteria, is_dynamic) VALUES

('f1000000-0000-0000-0000-000000000001',
 'Bharatvarsh Readers', 'bharatvarsh_readers',
 'People who have read or are interested in the Bharatvarsh novel and transmedia universe.',
 '{"tags_any": ["bharatvarsh", "creative", "publishing"], "notes_contains": "Bharatvarsh"}'::JSONB,
 FALSE),

('f1000000-0000-0000-0000-000000000002',
 'Professional Network', 'professional_network',
 'Core professional contacts — tech leaders, collaborators, mentors, and clients.',
 '{"contact_type": ["professional", "both"], "tags_any": ["tech", "cloud", "fintech", "tpm", "mentor"]}'::JSONB,
 FALSE),

('f1000000-0000-0000-0000-000000000003',
 'AI&U Subscribers', 'ai_and_u_subscribers',
 'People subscribed to or interested in the AI&U YouTube channel content.',
 '{"tags_any": ["ai", "ai-and-u"], "notes_contains": "AI&U"}'::JSONB,
 FALSE);

-- =============================================================================
-- AUDIENCE MEMBERS
-- =============================================================================

-- Bharatvarsh Readers
INSERT INTO audience_members (audience_id, contact_id, metadata) VALUES
('f1000000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000005',
 '{"source": "direct", "read_novel": true, "notes": "Loved the novel, potential investor for transmedia"}'::JSONB),
('f1000000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000007',
 '{"source": "direct", "read_novel": true, "notes": "Early reader, college friend"}'::JSONB),
('f1000000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000008',
 '{"source": "professional", "read_novel": true, "notes": "Editor at Penguin, sequel discussions"}'::JSONB),
('f1000000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000006',
 '{"source": "family", "read_novel": true, "notes": "Sister, potential graphic novel collaborator"}'::JSONB);

-- Professional Network
INSERT INTO audience_members (audience_id, contact_id, metadata) VALUES
('f1000000-0000-0000-0000-000000000002', 'd1000000-0000-0000-0000-000000000001',
 '{"source": "conference", "relationship": "mentor"}'::JSONB),
('f1000000-0000-0000-0000-000000000002', 'd1000000-0000-0000-0000-000000000002',
 '{"source": "project", "relationship": "collaborator"}'::JSONB),
('f1000000-0000-0000-0000-000000000002', 'd1000000-0000-0000-0000-000000000003',
 '{"source": "client", "relationship": "client"}'::JSONB),
('f1000000-0000-0000-0000-000000000002', 'd1000000-0000-0000-0000-000000000004',
 '{"source": "workplace", "relationship": "colleague"}'::JSONB),
('f1000000-0000-0000-0000-000000000002', 'd1000000-0000-0000-0000-000000000005',
 '{"source": "network", "relationship": "investor"}'::JSONB),
('f1000000-0000-0000-0000-000000000002', 'd1000000-0000-0000-0000-000000000009',
 '{"source": "previous-company", "relationship": "mentor"}'::JSONB),
('f1000000-0000-0000-0000-000000000002', 'd1000000-0000-0000-0000-000000000010',
 '{"source": "community", "relationship": "acquaintance"}'::JSONB);

-- AI&U Subscribers
INSERT INTO audience_members (audience_id, contact_id, metadata) VALUES
('f1000000-0000-0000-0000-000000000003', 'd1000000-0000-0000-0000-000000000001',
 '{"source": "direct-invite", "interested_pillars": ["Building AI Workflows"]}'::JSONB),
('f1000000-0000-0000-0000-000000000003', 'd1000000-0000-0000-0000-000000000002',
 '{"source": "direct-invite", "interested_pillars": ["Building AI Workflows", "Using AI Tools"]}'::JSONB),
('f1000000-0000-0000-0000-000000000003', 'd1000000-0000-0000-0000-000000000007',
 '{"source": "early-subscriber", "interested_pillars": ["AI for Common Person", "Using AI Tools"]}'::JSONB),
('f1000000-0000-0000-0000-000000000003', 'd1000000-0000-0000-0000-000000000010',
 '{"source": "community-event", "interested_pillars": ["AI for Common Person"]}'::JSONB);

COMMIT;
