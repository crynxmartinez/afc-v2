# 📖 AFC v2.0 - Complete Application Documentation

## **Arena for Creatives (AFC)**

A competitive art platform where Filipino digital artists submit artwork in 4 phases, receive votes (reactions) from the community, and **automatically** win prizes based on popularity.

---

## 🎯 **CORE CONCEPT**

```
Artists submit artwork → Community votes → System auto-selects winners → Prizes distributed
```

### **Key Principles:**
1. **1 Reaction = 1 Vote = 1 Point** in the prize pool
2. **Top 3 highest votes win** - no admin selection needed
3. **Automatic finalization** - system handles everything when contest ends
4. **4-Phase artwork** - shows the creative process

---

## 🏆 **CONTEST LIFECYCLE (FULLY AUTOMATIC)**

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  UPCOMING   │ →  │   ACTIVE    │ →  │   ENDED     │ →  │  FINALIZED  │
│             │    │             │    │             │    │             │
│ Before      │    │ Users can   │    │ System      │    │ Winners     │
│ start_date  │    │ submit &    │    │ auto-checks │    │ announced,  │
│             │    │ vote        │    │ every 5 min │    │ prizes sent │
│             │    │             │    │             │    │             │
│ Admin only  │    │ Community   │    │ AUTOMATIC   │    │ AUTOMATIC   │
│ creates     │    │ participates│    │ No admin    │    │ No admin    │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
```

### **Status Calculation (from dates, not stored):**
| Status | Condition |
|--------|-----------|
| `upcoming` | `NOW() < start_date` |
| `active` | `start_date <= NOW() <= end_date` |
| `ended` | `NOW() > end_date` AND `finalized_at IS NULL` |
| `finalized` | `finalized_at IS NOT NULL` |

### **What Happens When Contest Ends:**
1. System checks every 5 minutes for ended contests
2. Finds all contests where `end_date < NOW()` AND `finalized_at IS NULL`
3. For each ended contest:
   - Gets top 3 entries by `reactions_count` (votes)
   - Calculates prize pool from their total votes
   - Distributes prizes (50% / 20% / 10%)
   - Awards XP to winners
   - Sends notifications
   - Records in `contest_winners` table
   - Sets `finalized_at = NOW()`

**NO ADMIN INTERVENTION REQUIRED!**

---

## 💰 **VOTING & PRIZE SYSTEM**

### **How Voting Works:**
```
1 Reaction = 1 Vote = 1 Point
```

| Action | Result |
|--------|--------|
| User reacts to Entry A | Entry A gets +1 vote |
| User changes reaction | Still 1 vote (just different type) |
| User removes reaction | Entry A gets -1 vote |

### **How Prize Pool is Calculated:**
```
Prize Pool = Total votes on 1st place + 2nd place + 3rd place

Example:
┌─────────────────────────────────────────────────┐
│ Entry A (1st): 50 votes                         │
│ Entry B (2nd): 30 votes                         │
│ Entry C (3rd): 20 votes                         │
│─────────────────────────────────────────────────│
│ Prize Pool = 50 + 30 + 20 = 100 points          │
└─────────────────────────────────────────────────┘
```

### **Prize Distribution:**
| Place | Percentage | Example (100 pts pool) | What Winner Gets |
|-------|------------|------------------------|------------------|
| 🥇 1st | 50% | 50 points | Points + 200 XP + Notification |
| 🥈 2nd | 20% | 20 points | Points + 150 XP + Notification |
| 🥉 3rd | 10% | 10 points | Points + 100 XP + Notification |
| Platform | 20% | 20 points | Not distributed (platform fee) |

### **Tiebreaker Rule:**
If two entries have the same votes, the one submitted **earlier** wins.

---

## ⭐ **REACTION TYPES (All Equal 1 Vote)**

| Reaction | Emoji | Value |
|----------|-------|-------|
| Like | 👍 | 1 vote |
| Love | ❤️ | 1 vote |
| Fire | 🔥 | 1 vote |
| Clap | 👏 | 1 vote |
| Star | ⭐ | 1 vote |

### **Rules:**
- One reaction per user per entry
- Can change reaction type (still counts as 1 vote)
- Can remove reaction (removes the vote)
- Cannot vote on your own entry (optional - can be enabled)

---

## 👥 **USER ROLES**

### **Regular User**
| Can Do | Cannot Do |
|--------|-----------|
| ✅ Browse contests & entries | ❌ Create contests |
| ✅ Create account & profile | ❌ Approve/reject entries |
| ✅ Submit entries to contests | ❌ Access admin panel |
| ✅ Vote (react) on entries | ❌ Manually finalize contests |
| ✅ Comment on entries | |
| ✅ Follow other artists | |
| ✅ Earn XP and level up | |
| ✅ Win prizes | |

### **Admin**
| Can Do | Cannot Do |
|--------|-----------|
| ✅ All user abilities | ❌ Choose winners (automatic) |
| ✅ Create/edit/delete contests | ❌ Manually set prize amounts |
| ✅ Approve/reject entry submissions | |
| ✅ View admin dashboard | |
| ✅ Manage users | |

**Note:** Admin does NOT select winners. The system does it automatically based on votes.

---

## 📝 **ENTRY SUBMISSION FLOW**

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   DRAFT     │ →  │   PENDING   │ →  │  APPROVED   │
│             │    │             │    │             │
│ User is     │    │ Waiting for │    │ Visible to  │
│ working on  │    │ admin       │    │ public,     │
│ entry       │    │ review      │    │ can receive │
│             │    │             │    │ VOTES       │
└─────────────┘    └─────────────┘    └─────────────┘
                                            │
                                            ↓
                   ┌─────────────┐    ┌─────────────┐
                   │  REJECTED   │    │   WINNER    │
                   │             │    │             │
                   │ User can    │    │ If in top 3 │
                   │ edit and    │    │ when contest│
                   │ resubmit    │    │ ends        │
                   └─────────────┘    └─────────────┘
```

### **4-Phase Artwork:**
| Phase | Art | Cosplay | Photography |
|-------|-----|---------|-------------|
| Phase 1 | Sketch | Concept | Raw Photo |
| Phase 2 | Line Art | Props/Materials | Edit 1 |
| Phase 3 | Base Colors | Work in Progress | Edit 2 |
| Phase 4 | Final Artwork | Final Photo | Final |

### **Submission Rules:**
- One entry per user per contest
- Must upload at least Phase 1
- Entry goes to "pending" when submitted
- Admin approves or rejects
- Only "approved" entries can receive votes
- Votes only count from approved entries

---

## 📊 **XP & LEVEL SYSTEM**

### **How to Earn XP:**

| Action | XP Earned |
|--------|-----------|
| Submit entry | +50 XP |
| Entry approved | +25 XP |
| Receive a vote | +5 XP |
| Give a vote | +2 XP |
| Receive a comment | +10 XP |
| Give a comment | +5 XP |
| Gain a follower | +15 XP |
| Follow someone | +3 XP |
| **Win 1st place** | **+200 XP** |
| **Win 2nd place** | **+150 XP** |
| **Win 3rd place** | **+100 XP** |
| Share entry | +10 XP |
| Complete profile | +50 XP |
| Daily login | +10 XP |

### **Level Progression:**

| Level | XP Required | Title | Bonus |
|-------|-------------|-------|-------|
| 1 | 0 | Newcomer | - |
| 2 | 100 | Beginner | - |
| 3 | 300 | Apprentice | - |
| 4 | 600 | Artist | - |
| 5 | 1,000 | Skilled Artist | - |
| 6 | 1,500 | Expert | - |
| 7 | 2,100 | Master | - |
| 8 | 2,800 | Grand Master | - |
| 9 | 3,600 | Legend | - |
| 10 | 4,500 | Champion | +100 points |
| 15 | 10,500 | Legendary | +250 points |
| 20 | 19,000 | Ultimate | +500 points |

---

## 🔔 **NOTIFICATION SYSTEM**

### **Automatic Notifications:**

| Event | Notification |
|-------|--------------|
| Someone votes on your entry | "John reacted to your entry" |
| Someone comments on your entry | "Jane commented on your entry" |
| Someone replies to your comment | "Mike replied to your comment" |
| Someone follows you | "Sarah started following you" |
| **You win 1st place** | "🏆 Congratulations! You won 1st place and earned 50 points!" |
| **You win 2nd place** | "🥈 Congratulations! You won 2nd place and earned 20 points!" |
| **You win 3rd place** | "🥉 Congratulations! You won 3rd place and earned 10 points!" |

### **Notification Settings (User can toggle):**
- ✅ Reaction notifications
- ✅ Comment notifications
- ✅ Follow notifications
- ✅ Contest notifications

---

## 📱 **PAGE STRUCTURE**

### **Public Pages (No login required):**

| Page | URL | Description |
|------|-----|-------------|
| Home | `/` | Landing page, featured contests |
| Contests | `/contests` | List all contests (filter by status) |
| Contest Detail | `/contest/:id` | Single contest with all entries |
| Entry Detail | `/entry/:id` | Single entry with votes/comments |
| Winners | `/winners` | Hall of fame - past winners |
| Leaderboard | `/leaderboard` | Top artists by XP |
| Profile | `/profile/:username` | User public profile |

### **Auth Pages:**

| Page | URL | Description |
|------|-----|-------------|
| Login | `/login` | Sign in |
| Register | `/register` | Create account |
| Forgot Password | `/forgot-password` | Reset password |

### **User Pages (Login required):**

| Page | URL | Description |
|------|-----|-------------|
| Dashboard | `/dashboard` | Personal overview |
| Submit Entry | `/submit/:contestId` | Submit to a contest |
| My Entries | `/my-entries` | Your submissions |
| Settings | `/settings` | Profile & notification settings |
| Notifications | `/notifications` | All your notifications |

### **Admin Pages (Admin only):**

| Page | URL | Description |
|------|-----|-------------|
| Admin Dashboard | `/admin` | Overview & stats |
| Manage Contests | `/admin/contests` | Create/edit contests |
| Create Contest | `/admin/contests/create` | New contest form |
| Review Entries | `/admin/entries` | Approve/reject queue |
| Manage Users | `/admin/users` | View/edit users |

**Note:** No "Finalize Contest" page needed - it's automatic!

---

## 🔐 **AUTHENTICATION FLOW**

### **Sign Up:**
```
1. User enters: email, username, password
2. Supabase creates auth.users record
3. Trigger auto-creates public.users profile
4. User redirected to dashboard
5. (Optional) Email verification
```

### **Sign In:**
```
1. User enters: email, password
2. Supabase authenticates
3. Session created
4. User data loaded from public.users
5. Redirected to dashboard
```

---

## 🎨 **CONTEST CATEGORIES**

| Category | Description | Typical Phases |
|----------|-------------|----------------|
| **Art** | Digital artwork, illustrations | Sketch → Lines → Colors → Final |
| **Cosplay** | Costume play photography | Concept → Props → WIP → Final |
| **Photography** | Photo editing contests | Raw → Edit 1 → Edit 2 → Final |
| **Music** | Music production | Demo → Draft → Mix → Master |
| **Video** | Video creation | Storyboard → Footage → Edit → Final |

---

## 👤 **USER PROFILE**

### **Profile Fields:**
| Field | Type | Description |
|-------|------|-------------|
| username | Text | Unique, cannot change |
| display_name | Text | Can change anytime |
| avatar_url | Image | Profile picture |
| cover_photo_url | Image | Banner image |
| bio | Text | About me |
| location | Text | City/Country |
| website | URL | Personal website |
| instagram_url | URL | Instagram link |
| twitter_url | URL | Twitter/X link |
| portfolio_url | URL | Portfolio link |
| skills | Array | Tags like "Digital Art", "3D" |
| available_for_work | Boolean | Open for commissions |

### **Profile Stats (Auto-calculated):**
| Stat | Description |
|------|-------------|
| Level | Current level (1-20) |
| XP | Total experience points |
| Points Balance | Spendable points |
| Total Entries | Number of submissions |
| Total Wins | Number of contest wins |
| Total Reactions | Votes received |
| Followers | People following you |
| Following | People you follow |

---

## 🔄 **COMPLETE DATA FLOW EXAMPLE**

### **Scenario: User Joins Contest and Wins**

```
DAY 1: Contest Created
─────────────────────────────────────────────────────────
1. Admin creates "December Art Challenge"
2. Sets: start_date = Dec 1, end_date = Dec 31
3. Contest status = "upcoming"

DAY 2: Contest Starts (Dec 1)
─────────────────────────────────────────────────────────
4. System calculates status = "active"
5. Users can now submit entries

DAY 5: User Submits Entry
─────────────────────────────────────────────────────────
6. User uploads Phase 1-4 images
7. Entry created with status = "draft"
8. User clicks "Submit for Review"
9. Entry status → "pending"
10. User earns +50 XP for submitting

DAY 6: Admin Reviews
─────────────────────────────────────────────────────────
11. Admin sees entry in review queue
12. Admin clicks "Approve"
13. Entry status → "approved"
14. User earns +25 XP for approval
15. Entry now visible on contest page

DAY 7-30: Voting Period
─────────────────────────────────────────────────────────
16. Community members view entries
17. They click reaction buttons to vote
18. Each reaction = 1 vote
19. Entry's reactions_count increases
20. Entry owner earns +5 XP per vote received

DAY 31: Contest Ends (Dec 31, 11:59 PM)
─────────────────────────────────────────────────────────
21. System calculates status = "ended"
22. No more voting allowed

WITHIN 5 MINUTES: Auto-Finalization
─────────────────────────────────────────────────────────
23. Cron job runs auto_finalize_ended_contests()
24. System finds this contest (ended, not finalized)
25. Gets top 3 entries by reactions_count:
    - Entry A: 50 votes (1st)
    - Entry B: 30 votes (2nd)  
    - Entry C: 20 votes (3rd)
26. Calculates prize pool: 50 + 30 + 20 = 100 points
27. Distributes prizes:
    - 1st: 50 points (50%)
    - 2nd: 20 points (20%)
    - 3rd: 10 points (10%)
28. Awards XP:
    - 1st: +200 XP
    - 2nd: +150 XP
    - 3rd: +100 XP
29. Updates winners' points_balance
30. Updates winners' wins_count
31. Creates contest_winners records
32. Creates transaction records
33. Sends notification to each winner
34. Sets contest.finalized_at = NOW()
35. Contest status = "finalized"

RESULT:
─────────────────────────────────────────────────────────
✅ Winners automatically selected
✅ Prizes automatically distributed
✅ XP automatically awarded
✅ Notifications automatically sent
✅ No admin action required!
```

---

## 🛠️ **ADMIN WORKFLOWS**

### **Creating a Contest:**
```
1. Go to Admin → Contests → Create New
2. Fill in:
   - Title: "December Art Challenge"
   - Description: "Show us your best winter artwork!"
   - Category: Art
   - Start Date: Dec 1, 2024 00:00
   - End Date: Dec 31, 2024 23:59
   - (Optional) Sponsor info
3. Upload thumbnail
4. Click "Create Contest"
5. Done! Contest will auto-start and auto-end.
```

### **Reviewing Entries:**
```
1. Go to Admin → Entries
2. Filter by "Pending"
3. Click on entry to view
4. See all 4 phases
5. Click "Approve" or "Reject"
6. If reject, enter reason
7. User gets notified
```

### **What Admin Does NOT Do:**
- ❌ Select winners (automatic)
- ❌ Calculate prizes (automatic)
- ❌ Distribute prizes (automatic)
- ❌ Send winner notifications (automatic)
- ❌ Click "Finalize" button (automatic)

---

## 📱 **UI/UX SPECIFICATIONS**

### **Theme:**
- **Mode:** Dark by default
- **Primary:** Purple (#8B5CF6)
- **Background:** Dark gray (#0F0F0F)
- **Cards:** Slightly lighter (#1A1A1A)
- **Text:** White/Gray
- **Accent:** Gradient purple-pink

### **Responsive Breakpoints:**
| Device | Width | Navigation |
|--------|-------|------------|
| Desktop | > 1024px | Full sidebar |
| Tablet | 768-1024px | Collapsible sidebar |
| Mobile | < 768px | Bottom navigation |

### **Interactions:**
- Smooth page transitions
- Loading spinners on actions
- Toast notifications (success/error)
- Modal dialogs for confirmations
- Skeleton loaders for content
- Optimistic UI updates

---

## ✅ **SUMMARY TABLE**

| Feature | How it Works |
|---------|--------------|
| **Contests** | Admin creates, system manages lifecycle |
| **Entries** | 4-phase submission, admin approval |
| **Voting** | 1 reaction = 1 vote, 5 types available |
| **Winners** | Top 3 by votes, automatic selection |
| **Prizes** | 50%/20%/10% of top 3 votes |
| **Finalization** | Automatic every 5 minutes |
| **XP** | Earn from all actions, level up |
| **Notifications** | Real-time for all interactions |
| **Profiles** | Customizable, public/private |

---

## 🚀 **TECHNICAL NOTES**

### **Auto-Finalization Options:**

1. **Supabase pg_cron (Paid plans)**
   ```sql
   SELECT cron.schedule('auto-finalize', '*/5 * * * *', 
     $$SELECT * FROM auto_finalize_ended_contests()$$);
   ```

2. **Supabase Edge Function (Free plans)**
   - Create Edge Function that calls the SQL function
   - Use external cron service (cron-job.org, GitHub Actions)
   - Schedule to run every 5 minutes

3. **Frontend Trigger (Fallback)**
   - When user visits contest page
   - If contest ended but not finalized
   - Call the finalize function
   - Works but less reliable

---

## ❓ **FAQ**

**Q: What if there are ties?**
A: Earlier submission wins (by `created_at` timestamp).

**Q: What if contest has no entries?**
A: Contest still finalizes, but with 0 winners and 0 prize pool.

**Q: What if only 1 entry?**
A: That entry wins 1st place, 2nd and 3rd are empty.

**Q: Can admin override winners?**
A: No, winners are determined purely by votes.

**Q: What if someone cheats with multiple accounts?**
A: Implement IP tracking, email verification, or manual review.

**Q: Can votes be cast after contest ends?**
A: No, reactions can still be added but won't affect finalized results.

---

**Ready to build? Say "Go"!** 🚀
