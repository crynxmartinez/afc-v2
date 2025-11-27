# AFC v2.0 Database

## Setup Instructions

Run these SQL files **in order** in Supabase SQL Editor:

1. `01-schema.sql` - Creates all tables and indexes
2. `02-functions.sql` - Creates all stored procedures
3. `03-triggers.sql` - Creates all triggers
4. `04-policies.sql` - Creates all RLS policies
5. `05-seed.sql` - Inserts default data (levels, XP config, storage)

## Tables Overview

| Table | Description |
|-------|-------------|
| `users` | User accounts, profiles, settings |
| `contests` | Contest information |
| `entries` | Contest submissions (4-phase artwork) |
| `reactions` | Entry reactions (like, love, fire, clap, star) |
| `comments` | Entry comments with reply support |
| `comment_likes` | Likes on comments |
| `follows` | User follow relationships |
| `notifications` | User notifications |
| `contest_winners` | Winner records |
| `transactions` | Points purchases and prizes |
| `xp_config` | XP rewards configuration |
| `xp_history` | XP transaction history |
| `levels` | Level configuration |
| `shares` | Social sharing tracking |
| `contact_submissions` | Contact form submissions |

## Key Functions

| Function | Description |
|----------|-------------|
| `get_contest_status(start, end, finalized)` | Calculate contest status from dates |
| `award_xp(user_id, action, ref_id, desc)` | Award XP to user |
| `get_level_progress(user_id)` | Get user's level progress |
| `add_points(user_id, amount)` | Add points to user |
| `deduct_points(user_id, amount)` | Deduct points from user |
| `finalize_contest_and_select_winners(contest_id)` | Finalize contest and distribute prizes |
| `is_following(follower_id, following_id)` | Check if user follows another |
| `get_user_stats(user_id)` | Get comprehensive user stats |

## Contest Status

Status is **calculated**, not stored:

```sql
-- Use the view instead of the table directly
SELECT * FROM contests_with_status;

-- Or use the function
SELECT get_contest_status(start_date, end_date, finalized_at);
```

Status values:
- `upcoming` - Before start_date
- `active` - Between start_date and end_date
- `ended` - After end_date, not finalized
- `finalized` - Prizes distributed

## Prize Distribution

```
Prize Pool = Sum of top 3 entries' reactions

Distribution:
- 1st Place: 50%
- 2nd Place: 20%
- 3rd Place: 10%
- Remaining: 20% (platform)
```

## XP System

Default XP rewards:
- Submit entry: 50 XP
- Entry approved: 25 XP
- Receive reaction: 5 XP
- Give reaction: 2 XP
- Receive comment: 10 XP
- Give comment: 5 XP
- Gain follower: 15 XP
- Win 1st place: 200 XP
- Win 2nd place: 150 XP
- Win 3rd place: 100 XP

## Storage Buckets

| Bucket | Purpose | Max Size |
|--------|---------|----------|
| `avatars` | User profile pictures | 5MB |
| `covers` | User cover photos | 10MB |
| `entries` | Entry artwork | 10MB |
| `contests` | Contest thumbnails | 10MB |
| `sponsors` | Sponsor logos | 5MB |
