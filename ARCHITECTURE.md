# 📐 Kiến Trúc Tính Năng - Khám Phá Bộ Đề

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React)                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  App.tsx                                                         │
│  ├── Route: /explore-sets → ExploreSetsPage                     │
│  └── Navigation: UserLayout (links to /explore-sets)           │
│                                                                   │
│  ExploreSetsPage.tsx                                             │
│  ├── State: sets[], filters, loading, pagination               │
│  ├── UI Components:                                             │
│  │   ├── Search Input (onChange → filter & load)              │
│  │   ├── Category Selector (Academic, Geography, etc)         │
│  │   ├── Cards Grid (responsive 1-3 columns)                  │
│  │   │   ├── Title, Description, Type badge                  │
│  │   │   ├── Question count                                   │
│  │   │   ├── PIN display                                      │
│  │   │   └── Action buttons (Play, Copy PIN)                  │
│  │   └── Load More button (pagination)                        │
│  │                                                              │
│  └── API Calls:                                                 │
│      └── publicApi.listSets({q, type, limit, offset})         │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
                                ↓
        ┌─── HTTP (with credentials) ───┐
        ↓                                 ↓
┌──────────────────────────────────────────────────────┐
│         BACKEND (Express.js + Node.js)               │
├──────────────────────────────────────────────────────┤
│                                                       │
│  public.route.js                                    │
│  GET /api/public/sets                              │
│  ├── Query params: ?q, ?type, ?limit, ?offset     │
│  └── Handler: publicController.listVerifiedSets   │
│                                                       │
│  public.controller.js → listVerifiedSets()         │
│  ├── Build filter: { verified: true }              │
│  ├── Add type filter: if type provided            │
│  ├── Add search filter: if q provided             │
│  ├── Pagination: skip & limit                      │
│  ├── Sort: newest first (createdAt: -1)           │
│  ├── Query DB: QuestionSet.find(filter)           │
│  ├── Map response with id, pin, title, type, count│
│  └── Return: { data: [...], total: number }       │
│                                                       │
│  content.route.js (Admin only)                     │
│  ├── PATCH /api/content/sets/:id/verify          │
│  │   └── Handler: updateQuestionSetVerify()      │
│  └── Protected by: protect + requireAdmin        │
│                                                       │
│  content.controller.js → updateQuestionSetVerify()│
│  ├── Get id from params                           │
│  ├── Get verified boolean from body               │
│  ├── Update: QuestionSet.findByIdAndUpdate()     │
│  └── Return: updated set with new verified status│
│                                                       │
└──────────────────────────────────────────────────────┘
                        ↓
        ┌─── Mongoose + MongoDB ───┐
        ↓                            ↓
┌──────────────────────────────────────────────────────┐
│           DATABASE (MongoDB Atlas)                   │
├──────────────────────────────────────────────────────┤
│                                                       │
│  Collection: question_sets                          │
│  ├── _id: ObjectId                                  │
│  ├── title: String ✨ (searchable)                 │
│  ├── description: String                            │
│  ├── type: String ✨ (filterable)                  │
│  ├── questionIds: [ObjectId]                        │
│  ├── pin: String (unique)                           │
│  ├── verified: Boolean ✨ (MAIN FILTER)            │
│  ├── createdBy: ObjectId (ref User)                │
│  ├── timestamps: {createdAt, updatedAt}           │
│  └── Index: {generatorTopic, generatorCount, ...} │
│                                                       │
│  Sample Documents (5 inserted):                    │
│  ┌─────────────────────────────────────────────┐  │
│  │ {                                             │  │
│  │   _id: "6990a37f8b70e630d9307081",          │  │
│  │   title: "Geography Basics",                │  │
│  │   type: "Geography",                        │  │
│  │   verified: true,     ← Only these shown   │  │
│  │   pin: "4WAVP9",                           │  │
│  │   questionIds: [ObjectId],                 │  │
│  │   createdAt: "2024-01-XX..."               │  │
│  │ }                                            │  │
│  │                                              │  │
│  │ {                                            │  │
│  │   title: "Math Fundamentals",              │  │
│  │   type: "Academic",                        │  │
│  │   verified: true,                          │  │
│  │   pin: "QUM2SY",                           │  │
│  │   ...                                       │  │
│  │ }                                            │  │
│  │ ... 3 more verified sets                   │  │
│  └─────────────────────────────────────────────┘  │
│                                                       │
└──────────────────────────────────────────────────────┘
```

## Data Flow - User Interaction

```
USER INTERACTION FLOW:

1. User opens /explore-sets page
   ↓
2. useEffect triggers → load() function called
   ↓
3. Frontend calls: publicApi.listSets()
   ↓
4. HTTP GET /api/public/sets?type=&q=&limit=12&offset=0
   ↓
5. Backend receives, filters by verified: true
   ↓
6. Returns all 5 sets: {data: [...], total: 5}
   ↓
7. Frontend renders cards grid (responsive layout)
   ↓
8. User actions:
   ├─ Search: onChange → setFilters → useEffect triggers load(true)
   ├─ Filter: onChange → setFilters → useEffect triggers load(true)
   ├─ Play: navigates to /play/{PIN}
   ├─ Copy PIN: navigator.clipboard.writeText()
   └─ Load More: calls load() with offset += limit


ADMIN VERIFICATION FLOW:

1. Admin goes to /admin/login
   ↓
2. Logs in, navigates to Content Management
   ↓
3. Sees all question sets (both verified & unverified)
   ↓
4. Toggles verify button on a set
   ↓
5. Frontend calls: adminApi.verifyQuestionSet(setId, true/false)
   ↓
6. HTTP PATCH /api/content/sets/{id}/verify
   ├─ Verified body: {"verified": boolean}
   ├─ Protected by: protect + requireAdmin middleware
   ├─ Updated in DB
   └─ Returns updated set
   ↓
7. Admin sees immediate update (optimistic + server confirmation)
   ↓
8. Regular user returns to /explore-sets
   ├─ If previously verified → Removed from list
   └─ If now verified → Appears in list
```

## API Endpoints Used

### Public Endpoints (No Auth Required)
```
GET /api/public/sets
├── Purpose: List all verified question sets
├── Query Params:
│   ├── q: string (search in title/description)
│   ├── type: string (filter by category)
│   ├── limit: number (items per page, max 50)
│   └── offset: number (pagination offset)
├── Response: { data: QuestionSetMeta[], total: number }
└── Filter Applied: { verified: true }

GET /api/public/sets/by-pin/:pin
├── Purpose: Get single set metadata by PIN
├── Response: { data: QuestionSetMeta }
└── Used for: Fetching set info before playing

GET /api/public/sets/by-pin/:pin/questions
├── Purpose: Get all questions in a set (for playing)
├── Response: { data: PlayQuestion[] }
└── Used for: PlayPage component
```

### Admin Endpoints (Auth + Admin Role Required)
```
PATCH /api/content/sets/:id/verify
├── Purpose: Toggle verify status of a question set
├── Auth: protect + requireAdmin middleware
├── Body: { verified: boolean }
├── Response: { success: true, data: QuestionSet }
├── Verification:
│   ├── Before: verified: false
│   ├── After: verified: true
│   └── Updated in MongoDB
└── Effect: Set appears/disappears from public /explore-sets
```

## Component Integration

```
UserLayout.tsx
├── Navigation Bar
│   ├── Logo & Home Link
│   └── Nav Menu
│       ├── Link to /explore (Explore Questions)
│       ├── Link to /explore-sets (★ NEW ★)  ← NEW LINK
│       └── Link to /create (Create Questions)
│
└── Main Content (Outlet)
    └─ ExploreSetsPage.tsx (when route is /explore-sets)
       ├── States:
       │   ├── sets: QuestionSetMeta[]
       │   ├── total: number
       │   ├── loading: boolean
       │   ├── error: string
       │   ├── filters: {type, search}
       │   ├── offset: number
       │   └── copiedPin: string | null
       │
       ├── Effects:
       │   └── useEffect([filters]) → load(true)
       │
       └── Handlers:
           ├── load(resetOffset): Fetch from API
           ├── handleSearch: Submit search
           ├── handleLoadMore: Pagination
           ├── copyPin: Clipboard
           └── playSet: Navigate to /play/{PIN}
```

## Filter & Search Logic

```javascript
// Backend sorting & filtering
const filter = { verified: true };  // MAIN REQUIREMENT

// Type filter (regex for case-insensitive)
if (type && type.trim()) {
  filter.type = new RegExp(type.trim(), 'i');
}

// Search in title + description
if (q && q.trim()) {
  const search = new RegExp(q.trim(), 'i');
  filter.$or = [
    { title: search },
    { description: search }
  ];
}

// Pagination
const skip = Math.max(0, parseInt(offset, 10));
const limit = Math.min(50, Math.max(1, parseInt(limit, 10)));

// Query
const sets = await QuestionSet
  .find(filter)
  .sort({ createdAt: -1 })  // Newest first
  .skip(skip)
  .limit(limit)
  .lean();  // Performance optimization
```

## Key Design Decisions

1. **Verified Flag as Main Filter**
   - Uses MongoDB `verified: true` as primary filter
   - Only shows sets explicitly approved by admin
   - Simple, performant, reliable

2. **Responsive Grid Layout**
   - 1 column on mobile
   - 2 columns on tablet
   - 3 columns on desktop
   - Uses Tailwind CSS grid system

3. **Optimistic UI Updates**
   - Admin verify/unverify shows immediately
   - Rollback on error
   - Smoothbar user experience

4. **Pagination Strategy**
   - Server-side pagination
   - "Load More" button instead of infinite scroll
   - Improves performance with large datasets

5. **PIN Copy with Feedback**
   - Visual feedback when amount copied
   - Auto-dismiss after 2 seconds
   - Standard UX pattern

---

**All systems working correctly - Feature ready for production! 🚀**
