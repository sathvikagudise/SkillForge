# 🎓 Flashcards Quick Start - 5 Minute Guide

## The Feature
Create flashcards by entering **one word** → AI generates **multiple flip points** → Study with flip animation → Edit/Delete anytime

---

## 🚀 Quick Start Workflow

### Step 1: Navigate to Flashcards
```
CMLP Dashboard → Left Sidebar → Click "Flashcards"
```

### Step 2: Generate Cards
```
1. Click blue "+ New Deck" button (top right)
2. See modal: "Generate Flashcards"
3. Enter term: "Osmosis" (or any word/concept)
4. Set count: "3" (means 3 important points)
5. Click "Generate" button
⏳ Wait 2-5 seconds for AI to create cards
```

### Step 3: Review Preview
```
Modal shows: "Preview Generated Cards for 'Osmosis'"
See 3 flip cards:
├─ Card 1: Click "Flip" to see definition
├─ Card 2: Click "Flip" to see definition
└─ Card 3: Click "Flip" to see definition
```

### Step 4: Save
```
Click "Save All" button
✅ Cards saved to database
✅ Modal closes automatically
✅ Cards appear in "Your Flashcard Decks" section
✅ NO PAGE REFRESH (instant update!)
```

---

## 📚 Study Your Cards

### See Your Cards
```
Section: "Your Flashcard Decks"
Each card shows:
┌─────────────────────────┐
│ Question/Term           │ ← Front side
│ Preview of answer...    │ ← Partial answer
│ [Flip] [Edit] [Delete]  │ ← Actions
│ Difficulty: medium      │ ← Badge
└─────────────────────────┘
```

### Flip to Study
```
Click [Flip] button
→ Answer appears (full text)
→ Click [Flip] again
→ Back to question
```

### Edit a Card
```
1. Click [Edit] button (pencil icon)
2. Modal opens: "Edit Flashcard"
3. Change question: "New question..."
4. Change answer: "New answer..."
5. Change difficulty: easy/medium/hard
6. Click "Save" button
✅ Card updates instantly (no refresh!)
```

### Delete a Card
```
1. Click [Delete] button (trash icon)
2. Confirmation dialog appears
3. Click "Delete" to confirm
✅ Card removed instantly (no refresh!)
```

---

## 🎯 Example Workflow

### Biology Class - Learning Photosynthesis
```
Term Input: "Photosynthesis"
Count: 4

Generated Cards:
1. Q: "What is photosynthesis?"
   A: "Process where plants convert light energy into chemical energy..."
   
2. Q: "What are the two stages of photosynthesis?"
   A: "Light-dependent reactions (in thylakoids) and light-independent reactions (in stroma)..."
   
3. Q: "What is the role of chlorophyll?"
   A: "Absorbs light energy (primarily red and blue wavelengths)..."
   
4. Q: "What are the products of photosynthesis?"
   A: "Glucose (C6H12O6) and oxygen (O2)..."

Action: Save All → Cards appear → Study with flip animation → Edit difficult ones → Delete wrong cards
```

---

## 🔧 Troubleshooting

| Problem | Solution |
|---------|----------|
| "Sign in to save generated cards" | You're not logged in. Sign in first, then generate |
| Generate button not working | Check internet connection, wait a moment |
| Cards not appearing after save | Refresh page manually (Ctrl+F5) |
| Can't edit/delete | Make sure you're signed in |
| Preview shows "Mock answer" | Gemini API not available, using fallback |
| UI doesn't update | Refresh the page |

---

## ⌨️ Keyboard Tips

```
Tab     → Navigate between fields/buttons
Enter   → Activate buttons / Save modal
Escape  → Close modal
```

---

## 🎨 UI Components Reference

```
Button Legend:
[+]      = Create new item
[Flip]   = Reveal answer
[Edit]   = Modify card (pencil icon)
[Delete] = Remove card (trash icon)
[Save]   = Confirm action
[Cancel] = Close without saving
```

---

## 📊 What Gets Saved

When you save cards, the system saves:
```json
{
  "id": 42,                    ← Unique identifier
  "question": "What is X?",    ← Front of card
  "answer": "X is...",         ← Back of card
  "difficulty": "medium",      ← easy/medium/hard
  "created_at": "2025-11-19T10:30:00Z"  ← Timestamp
}
```

---

## 🔐 Authentication

```
✅ You must be signed in
✅ Your cards are private (only you see them)
✅ Token auto-sent with each request
✅ Auto-logout if token expires
```

---

## 📱 Works On

```
✅ Desktop (Chrome, Firefox, Safari, Edge)
✅ Tablet (iPad, Android tablets)
✅ Mobile (iPhone, Android phones)
```

---

## ⚡ Pro Tips

1. **Start with 3-5 cards** per term (more is overwhelming)
2. **Use specific terms** (e.g., "Osmosis" → works great)
3. **Generic phrases** (e.g., "Math") → may be vague
4. **Edit immediately** if AI got something wrong
5. **Study daily** using the flip feature
6. **Adjust difficulty** as you learn (easy → medium → hard)
7. **Delete cards** you already know to focus on weak areas

---

## 📝 Keyboard Shortcuts (Coming Soon)

```
Coming in next update:
Ctrl+G  = Generate new deck
Ctrl+S  = Save current card
Ctrl+E  = Edit selected card
Ctrl+D  = Delete selected card
Space   = Flip card
```

---

## 🎓 Learning Path Suggestion

```
Day 1: Generate 3-5 cards on new topic
Day 2: Study cards daily (5 min review)
Day 3-7: Edit difficult cards, mark as "hard"
Week 2: Generate more cards, review previous ones
Week 3+: Test yourself with mastered cards

Remember: Spaced repetition = better retention!
```

---

## 🚀 Ready to Start?

```
1. Login to CMLP Portal
2. Go to Flashcards page
3. Click "New Deck"
4. Enter a term you want to learn
5. Click "Generate"
6. Review and save
7. Start studying! 📚
```

---

**Happy Learning! 🎓**

For detailed information, see `FLASHCARDS_GUIDE.md`
