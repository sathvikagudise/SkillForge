from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..db import get_db
from ..models import Node, Edge, LearnerState
from ..schemas.knowledge import GraphOut, LearnerStateOut
from ..utils.auth_dep import get_current_user
from typing import List
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/graph", response_model=GraphOut)
def get_graph(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    nodes = db.query(Node).all()
    edges = db.query(Edge).all()
    # Load learner states for this user
    states = db.query(LearnerState).filter(LearnerState.user_id == current_user.id).all()

    # If learner has no state for a node, consider it locked unless it's rootless
    learner_states = []
    for s in states:
        learner_states.append(LearnerStateOut(node_id=s.node_id, status=s.status, score=s.score, last_reviewed=(s.last_reviewed.isoformat() if s.last_reviewed else None)))

    return {"nodes": nodes, "edges": edges, "learner_states": learner_states}


@router.post("/node/{node_id}/complete")
def complete_node(node_id: int, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    # mark node completed for user; unlock downstream nodes that have all prerequisites completed
    node = db.query(Node).filter(Node.id == node_id).first()
    if not node:
        raise HTTPException(status_code=404, detail="Node not found")

    # upsert learner state
    state = db.query(LearnerState).filter(LearnerState.user_id == current_user.id, LearnerState.node_id == node_id).first()
    now = datetime.utcnow()
    if not state:
        state = LearnerState(user_id=current_user.id, node_id=node_id, status='completed', score=1.0, last_reviewed=now)
        db.add(state)
    else:
        state.status = 'completed'
        state.score = 1.0
        state.last_reviewed = now

    db.commit()

    # Unlock downstream nodes whose all prerequisites are completed
    # Find edges where from_node is a prereq to to_node
    edges = db.query(Edge).filter(Edge.relation_type == 'prereq').all()
    # Build prereq map
    prereq_map = {}
    for e in edges:
        prereq_map.setdefault(e.to_node_id, []).append(e.from_node_id)

    # For each node that depends on someone, check if all prereqs completed
    for target_node, prereqs in prereq_map.items():
        # check if user already has state completed
        existing = db.query(LearnerState).filter(LearnerState.user_id == current_user.id, LearnerState.node_id == target_node).first()
        if existing and existing.status == 'completed':
            continue

        all_done = True
        for p in prereqs:
            s = db.query(LearnerState).filter(LearnerState.user_id == current_user.id, LearnerState.node_id == p, LearnerState.status == 'completed').first()
            if not s:
                all_done = False
                break

        if all_done:
            if not existing:
                new_state = LearnerState(user_id=current_user.id, node_id=target_node, status='available')
                db.add(new_state)
            else:
                existing.status = 'available'

    db.commit()
    return {"status": "ok"}


@router.get('/path/next')
def next_path(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    states = {s.node_id: s for s in db.query(LearnerState).filter(LearnerState.user_id == current_user.id).all()}
    nodes = db.query(Node).all()
    edges = db.query(Edge).filter(Edge.relation_type == 'prereq').all()
    prereq_map = {}
    for e in edges:
        prereq_map.setdefault(e.to_node_id, []).append(e.from_node_id)

    # Weight map for difficulty
    diff_weight = {"easy": 1, "medium": 2, "hard": 3}

    available = []
    for n in nodes:
        s = states.get(n.id)
        if s and s.status == 'completed':
            continue
        if s and s.status == 'available':
            available.append(n)
            continue
        prereqs = prereq_map.get(n.id, [])
        if not prereqs:
            available.append(n)
            continue
        ok = True
        for p in prereqs:
            ps = states.get(p)
            if not ps or ps.status != 'completed':
                ok = False
                break
        if ok:
            available.append(n)

    # Score-based ranking: lower score = higher priority
    def score(n: Node) -> float:
        s = 0.0
        # Difficulty: prefer easier topics first
        s += diff_weight.get(n.difficulty or "medium", 2) * 10
        # Estimated time: prefer shorter topics
        s += (n.estimated_time or 30) * 0.5
        # Depth in graph: prefer topics with fewer prerequisites already available
        prereq_count = len(prereq_map.get(n.id, []))
        s -= prereq_count * 3
        return s

    available.sort(key=score)
    available = available[:15]
    return {"next": available}
