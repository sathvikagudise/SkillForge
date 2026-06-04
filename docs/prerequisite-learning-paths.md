# Prerequisite-Based Learning Paths — Knowledge Graph

## Why this is best

- Turns your knowledge graph from a static diagram into an adaptive learning engine.
- Learners automatically follow a logical path instead of guessing what to study next.
- Stronger students progress faster; weaker students get targeted support.
- Prevents confusion by only showing learners material they are ready for.
- Works for any subject — simple, powerful, and content‑agnostic.

## How it works (simple version)

- Each node represents a concept.
- Edges show “depends on” or “learn before this.”
- Learners must complete Node A before Node B unlocks.
- The LMS creates a personalized route for every learner based on their progress and mastery.

## Implementation sketch (practical)

1. Data model
   - Node: id, title, description, content_ref (lesson/quiz/flashcards), estimated_time, difficulty.
   - Edge: from_node_id, to_node_id, relation_type ("prereq" / "related").
   - Learner state: user_id, node_id, status (locked/unlocked/in_progress/completed), score, last_reviewed.

2. Authoring
   - Content creators tag lessons/flashcards/quizzes with the node id.
   - When adding an edge, the system enforces acyclic prerequisites (or warns about cycles).

3. Unlock rules
   - Node B is unlocked when all required predecessor nodes have status `completed` (or when mastery threshold is reached).
   - Optionally allow soft-unlock: permit access but mark as "recommended to complete prerequisites first."

4. Personalization
   - Build adaptive paths by computing topological order from nodes the learner hasn’t completed, then filter by prerequisites satisfied by the learner’s completed set.
   - Speed up strong learners by skipping optional remedial nodes; offer extra practice to weaker learners.

5. UI flow (learner)
   - Knowledge Graph view shows nodes with status badges (locked, available, in progress, completed).
   - Click an available node to open lesson/quiz/flashcards. Completing it updates learner state and may unlock downstream nodes in real time.
   - Recommended path view: linear sequence derived from the learner’s current state (useful for ‘next lesson’ UX).

6. Assessment and mastery
   - Use quizzes or checks to mark a node as `completed` only when the learner demonstrates required mastery (e.g., score threshold on node quiz).
   - Support revisiting and spaced repetition by re‑unlocking review nodes based on last review time and difficulty.

7. Edge cases
   - Cycles: prevent during authoring or present the author with explicit overrides.
   - Multiple parents: require all parents by default, or allow configurable rules (any-of / majority / all-of).
   - Importing content: map legacy lessons to nodes and run a quick validation to ensure prerequisites are satisfiable.

## Why this improves learning outcomes

- Reduces cognitive overload by presenting a curated sequence tailored to prior knowledge.
- Encourages mastery before progression, improving retention and transfer.
- Scales across subjects because the graph and unlock logic are content-agnostic.

## Quick API ideas

- GET `/knowledge/graph` — return nodes + edges + learner status for the current user.
- POST `/knowledge/node/{id}/complete` — mark node completed (with optional assessment payload).
- GET `/knowledge/path/next` — returns the next recommended nodes for the user.

## Next steps (engineering)

- Add DB migrations for Node, Edge, LearnerState tables (or use existing graph table if present).
- Add API endpoints to serve graph, mark completion, compute recommended path.
- Update `KnowledgeGraph` UI to show lock/unlock badges and affordances to progress.
- Add simple authoring UI to create nodes and prerequisite edges.


---

If you want, I can implement the minimal backend model + migration and wire a simple `/knowledge/graph` endpoint plus a UI update in `src/pages/KnowledgeGraph.tsx` to visualize lock/unlock state and a "Next" button for learners. Tell me whether to proceed with backend, frontend, or both.