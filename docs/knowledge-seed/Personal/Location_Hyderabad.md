# Location and Travel Context -- Hyderabad

Atharva Singh is based in Hyderabad, India. This document provides location context that helps with scheduling, timezone considerations, and local references.

## Location Details
- **City:** Hyderabad, Telangana, India
- **Timezone:** IST (Indian Standard Time, UTC+5:30)
- **No daylight saving time:** IST is constant year-round

## Timezone Implications
- **US East Coast (ET):** IST is 9.5 to 10.5 hours ahead (depending on EDT/EST)
- **US West Coast (PT):** IST is 12.5 to 13.5 hours ahead
- **UK (GMT/BST):** IST is 4.5 to 5.5 hours ahead
- **UAE (GST):** IST is 1.5 hours ahead
- **Working hours overlap with US:** Early morning IST (6-9 AM) overlaps with late US evening. Late evening IST (8-11 PM) overlaps with US morning.

## Professional Context
- Hyderabad is a major tech hub (HITEC City, Financial District) with strong presence of global tech companies
- Zealogics Inc (incoming employer) is HQ'd in New Jersey -- timezone overlap will be relevant for daily standups and meetings
- Previous employers (Accenture, People Tech Group) also had Hyderabad offices
- GCP asia-south1 region (Mumbai) is the closest GCP region, used for all AI OS infrastructure

## Cloud Scheduler Reference
- Task Notification daily trigger runs at 06:00 IST (00:30 UTC)
- Morning brief skill is designed for IST morning context

## Key Points
- Based in Hyderabad, India (IST, UTC+5:30)
- No daylight saving time -- IST is constant
- Zealogics HQ in New Jersey creates a 9.5-10.5 hour timezone gap
- GCP asia-south1 (Mumbai) is the primary deployment region
- All scheduled jobs reference IST for timing
