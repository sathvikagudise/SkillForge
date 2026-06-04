# Flashcards Feature Architecture

## Component Hierarchy

```
DashboardLayout
  └─ Flashcards Page
      ├─ Header (Title + "New Deck" button)
      │
      ├─ Modal: Generate Flashcards
      │   ├─ Term Input
      │   ├─ Count Input
      │   └─ Generate Button → aiAPI.defineMany()
      │
      ├─ Modal: Preview Generated Cards
      │   ├─ Close Button
      │   ├─ Save All Button → flashcardsAPI.create() × N
      │   └─ FlipCard Components (preview)
      │
      └─ Card Section: Your Flashcard Decks
          └─ FlashcardItem Components
              ├─ Question Display
              ├─ Answer Preview
              ├─ Flip Button
              ├─ Edit Button → Edit Modal
              │   ├─ Question Input
              │   ├─ Answer TextArea
              │   ├─ Difficulty Select
              │   └─ Save Button → flashcardsAPI.update()
              └─ Delete Button → flashcardsAPI.delete() + confirmation
```

## API Flow Diagram

### Generate & Save Flow
```
Frontend                          Backend                      Database
   │                                │                            │
   ├─ User enters term ─────────────→                            │
   │  & count (3)                    │                            │
   │                                 │                            │
   ├─ Generate button click ────────→ POST /api/ai/define_many   │
   │                                  │ (term, count)              │
   │                                  │                            │
   │                                  ├─ Gemini API call          │
   │                                  │ (with fallback)            │
   │                                  │                            │
   │← JSON: [{q,a,difficulty},...] ─┤                            │
   │                                  │                            │
   ├─ Show preview modal             │                            │
   │  (flip cards)                    │                            │
   │                                  │                            │
   ├─ Save All button ───────────────→ POST /flashcards/ × 3      │
   │                                  │ (question, answer, diff)   │
   │                                  │                            │
   │                                  ├─ Create Flashcard(1)      │
   │                                  │ ├─ Save to DB ────────────→ INSERT
   │                                  │ └─ Return FlashcardOut      │
   │                                  │                            │
   │                                  ├─ Create Flashcard(2)      │
   │                                  │ ├─ Save to DB ────────────→ INSERT
   │                                  │ └─ Return FlashcardOut      │
   │                                  │                            │
   │                                  ├─ Create Flashcard(3)      │
   │                                  │ ├─ Save to DB ────────────→ INSERT
   │                                  │ └─ Return FlashcardOut      │
   │                                  │                            │
   │← { id, question, ... } × 3 ────┤                            │
   │                                  │                            │
   ├─ Fire dataChanged event         │                            │
   │  (trigger reload)                │                            │
   │                                  │                            │
   ├─ GET /flashcards/ ─────────────→ Query all user cards       │
   │                                  │ ├─ SELECT * FROM          │
   │                                  │ │  flashcards             │
   │                                  │ │  WHERE user_id=X        │
   │                                  │ └─ ORDER BY created_at    │
   │                                  │                            │
   │← [{id, q, a, diff, ...}, ...] ┤                            │
   │                                  │                            │
   ├─ Render cards in UI             │                            │
   │  (no page refresh!)              │                            │
```

### Edit Card Flow
```
Frontend                          Backend                      Database
   │                                │                            │
   ├─ Click Edit button             │                            │
   ├─ Show edit modal               │                            │
   │  (with current data)            │                            │
   │                                 │                            │
   ├─ Modify question/answer        │                            │
   │  & difficulty                   │                            │
   │                                 │                            │
   ├─ Save button ───────────────────→ PUT /flashcards/5          │
   │                                  │ (question, answer, diff)   │
   │                                  │                            │
   │                                  ├─ Get card (id=5, user=X)  │
   │                                  │ ├─ SELECT * FROM          │
   │                                  │ │  flashcards             │
   │                                  │ │  WHERE id=5 AND         │
   │                                  │ │        user_id=X        │
   │                                  │                            │
   │                                  ├─ Update fields            │
   │                                  │ └─ SAVE ──────────────────→ UPDATE
   │                                  │                            │
   │← { id, question, ... } ────────┤                            │
   │                                  │                            │
   ├─ Close modal                    │                            │
   ├─ Fire dataChanged event         │                            │
   │                                  │                            │
   ├─ GET /flashcards/ ─────────────→ (reload card list)         │
   │                                  │                            │
   │← Updated card list ────────────┤                            │
   │                                  │                            │
   ├─ UI shows updated card          │                            │
```

### Delete Card Flow
```
Frontend                          Backend                      Database
   │                                │                            │
   ├─ Click Delete button           │                            │
   ├─ Show confirmation             │                            │
   │                                 │                            │
   ├─ User confirms                 │                            │
   │                                 │                            │
   ├─ DELETE /flashcards/5 ────────→ Verify user owns card       │
   │                                  │ ├─ SELECT * FROM          │
   │                                  │ │  flashcards             │
   │                                  │ │  WHERE id=5 AND         │
   │                                  │ │        user_id=X        │
   │                                  │                            │
   │                                  ├─ Delete record            │
   │                                  │ └─ DELETE ────────────────→ DELETE
   │                                  │                            │
   │← { status: "deleted" } ────────┤                            │
   │                                  │                            │
   ├─ Fire dataChanged event         │                            │
   │                                  │                            │
   ├─ GET /flashcards/ ─────────────→ (reload card list)         │
   │                                  │                            │
   │← Updated card list ────────────┤                            │
   │  (without deleted card)          │                            │
   │                                  │                            │
   ├─ UI updated instantly           │                            │
```

## Authentication Flow

```
User Signs In
    ↓
Login API returns access_token
    ↓
Frontend stores token in localStorage['access_token']
    ↓
All API calls attach:
    Authorization: Bearer <token>
    ↓
Backend validates token in get_current_user()
    ↓
Routes use current_user for authorization checks:
    - Verify card belongs to user
    - Set user_id when creating cards
    ↓
If token invalid/expired:
    - 401 error
    - Frontend removes token
    - Redirects to login
```

## Event-Driven UI Updates

```
┌─ Save Cards ──→ dataChanged event ──→ Window event listener
├─ Edit Card   ──→ dataChanged event ──→ Trigger load()
├─ Delete Card ──→ dataChanged event ──→ Update state
└─ Manual Add  ──→ dataChanged event ──→ Fetch fresh data

No page refresh needed - React state updates automatically
```

## Error Handling Chain

```
User Action
    ↓
Frontend API call → apiCall()
    ↓
Network error?
├─ YES → throw Error → catch block → alert user
└─ NO  → HTTP response
        ↓
   Status 200-299?
   ├─ YES → Parse JSON → return data
   └─ NO  → Build error message → throw Error
            ↓
        Backend error detail?
        ├─ YES → Show detail
        └─ NO  → Show status text
                 ↓
        Frontend catch block
        ├─ alert(error.message)
        └─ Log to console
```

## Data Validation

```
Frontend                           Backend
   │                                │
   ├─ User input validation         │
   │  (client-side)                 │
   ├─ Required field checks         │
   ├─ Text not empty               │
   │                                │
   ├─ Send JSON ──────────────────→ Pydantic validation
   │                                │
   │                              ├─ Type checking
   │                              ├─ Required fields
   │                              ├─ Default values
   │                              ├─ Business rules
   │                              │
   │                              ├─ Invalid? → 422 error
   │                              └─ Valid? → Process
   │                                 ↓
   │                              Database constraints
   │                              ├─ user_id FK exists
   │                              ├─ Not null checks
   │                              ├─ String length limits
   │                              │
   │← Response or Error ─────────┤
   │                                │
   ├─ Display to user              │
```

## File Dependencies

```
Flashcards.tsx
├── Imports from:
│   ├── @/services/api.ts
│   │   └── flashcardsAPI { list, create, update, delete }
│   │   └── aiAPI { defineMany }
│   │
│   ├── @/components/DashboardLayout
│   ├── @/components/ui/button
│   ├── @/components/ui/card
│   ├── @/components/ui/alert-dialog
│   │
│   └── lucide-react { Plus, Edit2, Trash2 }
│
api.ts
├── Calls:
│   ├── /flashcards/ (GET, POST, PUT, DELETE)
│   └── /api/ai/define_many (POST)
│
Backend Routes
├── routes/flashcards.py
│   ├── Imports from:
│   │   ├── models.Flashcard
│   │   ├── schemas.FlashcardOut
│   │   ├── services.flashcard_service
│   │   └── services.gemini_service (for generation)
│   │
│   └── Endpoints:
│       ├── POST / → create_flashcard
│       ├── GET / → list_flashcards
│       ├── PUT /{id} → update_card
│       └── DELETE /{id} → delete_card
│
├── routes/ai.py
│   ├── Imports from:
│   │   └── services.gemini_service { generate_definition }
│   │
│   └── Endpoints:
│       └── POST /define_many → define_many
│
├── services/flashcard_service.py
│   └── Functions: update_flashcard, delete_flashcard, list_flashcards_for_user
│
└── services/gemini_service.py
    ├── _call_genai() - Robust wrapper
    └── generate_definition() - Term → definition
```

## State Management

```
Frontend State (Flashcards.tsx)

Main State:
├─ cards[] - List of all user's flashcards
│
Generation State:
├─ open - Generate modal visibility
├─ termInput - User's term input
├─ countTerms - Number of cards to generate
├─ loadingDef - Loading state for generation
├─ previewCards[] - Generated cards before saving
├─ previewOpen - Preview modal visibility
│
Edit State (FlashcardItem):
├─ editOpen - Edit modal visibility
├─ editQuestion - Current edit value
├─ editAnswer - Current edit value
├─ editDifficulty - Current difficulty selection
├─ isFlipped - Card flip state
│
Backend State:
├─ Database: flashcards table with user_id FK
└─ Session: SQLAlchemy ORM objects
```

## Performance Considerations

1. **List Loading**: O(n) where n = user's cards
   - Indexed on user_id and created_at
   
2. **Card Operations**: O(1) for create/update/delete
   - Primary key lookup by card_id
   - User authorization check

3. **AI Generation**: ~2-5 seconds per request
   - Gemini API call with fallback
   - No real-time constraint

4. **UI Updates**: Instant after save
   - Event-driven reload
   - No full page refresh

## Security Measures

1. ✅ **Authentication**: JWT token required for all operations
2. ✅ **Authorization**: User can only access own cards
3. ✅ **Input Validation**: Pydantic models validate all inputs
4. ✅ **CORS**: Configured with specific origins
5. ✅ **SQL Injection**: Protected via ORM parameterization
6. ✅ **XSS**: React auto-escapes values
