# Flashcards Feature - Complete Guide

## Overview
The Flashcards feature has been fully implemented with a term-based generation workflow, live UI updates, and edit/delete capabilities.

## How It Works

### 1. **Generate Flashcards by Term**
- Click **"New Deck"** button
- Enter a **term** (e.g., "Osmosis", "Photosynthesis", "Quantum Computing")
- Specify the number of **flip points** (default: 3)
  - This creates N important points/definitions related to the term
  - Each point becomes a separate flashcard
- Click **"Generate"** to call the AI (Gemini)

### 2. **AI Generation Process**
- The term is sent to the backend `/api/ai/define_many` endpoint
- Gemini generates multiple Q&A pairs based on the term
- The AI returns JSON with format:
  ```json
  [
    {
      "question": "What is Osmosis?",
      "answer": "Osmosis is the movement of water molecules...",
      "difficulty": "medium"
    },
    ...
  ]
  ```

### 3. **Preview & Flip Cards**
- A modal opens showing "Preview Generated Cards for '{term}'"
- Each card displays:
  - **Front side**: The question/term
  - **Flip button**: Click to reveal the answer
  - **Answer side**: Full definition (when flipped)
- All cards are shown in the preview before saving

### 4. **Save All Cards**
- Click **"Save All"** to save all generated cards to the database
- Each card is sent via `POST /flashcards/` with:
  ```json
  {
    "question": "...",
    "answer": "...",
    "difficulty": "medium"
  }
  ```
- The UI automatically refreshes (no page reload needed)
- Cards appear in the **"Your Flashcard Decks"** section

### 5. **Study Your Cards**
Cards display in the "Your Flashcard Decks" section with:
- **Question** (front side)
- **Partial answer** preview (first 100 characters)
- **Flip button** to reveal full answer
- **Edit button** (pencil icon) to modify the card
- **Delete button** (trash icon) to remove the card
- **Difficulty badge** (easy/medium/hard)

### 6. **Edit a Card**
- Click the **Edit button** (pencil icon) on any card
- A modal opens allowing you to:
  - Change the **question**
  - Change the **answer**
  - Change the **difficulty** (easy/medium/hard)
- Click **"Save"** to update
- The UI refreshes automatically

### 7. **Delete a Card**
- Click the **Delete button** (trash icon) on any card
- Confirm deletion in the confirmation dialog
- The card is removed from the database and UI updates instantly

## Live UI Updates (No Refresh Needed)

The Flashcards page uses an **event-driven update system**:
- After saving new cards, a `dataChanged` event is fired
- The page automatically reloads the flashcards list
- New cards appear immediately without a page refresh
- Same applies to edit/delete operations

## API Endpoints

### Generate Flashcards by Term
```
POST /api/ai/define_many
Body: { "term": "Osmosis", "count": 3 }
Response: [
  { "question": "...", "answer": "...", "difficulty": "medium" },
  ...
]
```

### Create a Flashcard
```
POST /flashcards/
Body: { "question": "...", "answer": "...", "difficulty": "medium" }
Response: { "id": 1, "question": "...", "answer": "...", "difficulty": "medium" }
```

### List All Flashcards
```
GET /flashcards/
Response: [
  { "id": 1, "question": "...", "answer": "...", "difficulty": "medium" },
  ...
]
```

### Update a Flashcard
```
PUT /flashcards/{id}
Body: { "question": "...", "answer": "...", "difficulty": "medium" }
Response: { "id": 1, "question": "...", "answer": "...", "difficulty": "medium" }
```

### Delete a Flashcard
```
DELETE /flashcards/{id}
Response: { "status": "deleted" }
```

## Files Modified/Created

### Frontend
- `src/services/api.ts` - Added `flashcardsAPI.update()` method
- `src/pages/Flashcards.tsx` - Complete rewrite with:
  - Term-based generation UI
  - Preview modal with flip cards
  - FlashcardItem component with edit/delete
  - Live dataChanged event listener

### Backend
- `backend/app/schemas/ai.py` - Added `id` field to `FlashcardOut`
- `backend/app/routes/flashcards.py` - All CRUD endpoints (already complete)
- `backend/app/services/flashcard_service.py` - update/delete functions (already complete)
- `backend/app/services/gemini_service.py` - Robust AI wrapper with fallback

## Authentication

All flashcard operations require authentication:
- Token is stored in `localStorage` as `access_token`
- Token is automatically attached to all requests in the `apiCall` helper
- If not authenticated, you'll see "Not authenticated" or "Sign in to save" messages

## Difficulty Levels

Cards can be assigned difficulty levels:
- **easy** - Basic concepts
- **medium** - Standard difficulty (default)
- **hard** - Advanced/complex topics

## Error Handling

The system handles errors gracefully:
- **Generation errors**: Shows helpful alert messages
- **Save failures**: User is notified with the error message
- **Network errors**: The `apiCall` helper converts HTTP errors to readable messages
- **No AI client**: Falls back to mock responses for testing

## Testing Workflow

### To Test End-to-End:

1. **Sign in** to the application
2. Go to **Flashcards** section
3. Click **"New Deck"**
4. Enter a term: e.g., "Osmosis"
5. Set count: "3"
6. Click **"Generate"**
7. Verify the preview shows 3 flip cards
8. Click flip buttons to test the flip animation
9. Click **"Save All"**
10. Verify cards appear in the "Your Flashcard Decks" section
11. Click a **Flip button** on a saved card to reveal the answer
12. Click the **Edit button** (pencil) to modify a card
13. Click the **Delete button** (trash) to remove a card
14. Verify all changes appear instantly without page refresh

## Notes

- The AI uses **Gemini** to generate definitions (fallback to mock if API key missing)
- All cards are stored per user in the database
- Cards are sorted by creation date (newest first)
- The preview modal auto-closes after saving
- Edit/delete operations confirm changes with alerts
- All timestamps and metadata are handled by the database automatically
