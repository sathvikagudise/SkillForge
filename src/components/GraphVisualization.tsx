import { useEffect, useRef, useCallback, useState } from "react";

type GraphNode = {
  id: number;
  title: string;
  description?: string;
  difficulty?: string;
  estimated_time?: number;
};

type GraphEdge = {
  id: number;
  from_node_id: number;
  to_node_id: number;
  relation_type: string;
};

type GraphVisualizationProps = {
  nodes: GraphNode[];
  edges: GraphEdge[];
  statuses: Record<number, string>;
  onNodeClick?: (nodeId: number) => void;
  width?: number;
  height?: number;
};

type Position = { x: number; y: number; vx: number; vy: number };

const NODE_RADIUS = 28;
const REPULSION = 800;
const ATTRACTION = 0.005;
const DAMPING = 0.85;
const MIN_VELOCITY = 0.1;

const STATUS_COLORS: Record<string, string> = {
  completed: "#22c55e",
  available: "#3b82f6",
  locked: "#9ca3af",
  in_progress: "#f59e0b",
};

const GraphVisualization = ({
  nodes, edges, statuses, onNodeClick, width = 800, height = 500,
}: GraphVisualizationProps) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [positions, setPositions] = useState<Record<number, Position>>({});
  const [dragging, setDragging] = useState<number | null>(null);
  const [hovered, setHovered] = useState<number | null>(null);
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [simulationDone, setSimulationDone] = useState(false);
  const dragRef = useRef({ offsetX: 0, offsetY: 0, nodeId: 0 });
  const transformRef = useRef({ x: 0, y: 0, scale: 1 });
  const animRef = useRef<number>(0);

  const centerX = width / 2;
  const centerY = height / 2;

  // Initialize positions
  useEffect(() => {
    const initial: Record<number, Position> = {};
    const angleStep = (2 * Math.PI) / nodes.length;
    nodes.forEach((n, i) => {
      const angle = angleStep * i;
      const radius = Math.min(width, height) * 0.3;
      initial[n.id] = {
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
        vx: 0, vy: 0,
      };
    });
    setPositions(initial);
    setSimulationDone(false);
  }, [nodes.length, centerX, centerY, width, height]);

  // Run force simulation
  useEffect(() => {
    if (!positions || Object.keys(positions).length === 0 || simulationDone) return;

    let running = true;
    const nodeIds = nodes.map((n) => n.id);
    const nodeMap = new Map(nodes.map((n) => [n.id, n]));

    const simulate = () => {
      if (!running) return;
      let maxVel = 0;
      setPositions((prev) => {
        const next = { ...prev };

        // Repulsion (Coulomb's law)
        for (let i = 0; i < nodeIds.length; i++) {
          for (let j = i + 1; j < nodeIds.length; j++) {
            const a = next[nodeIds[i]];
            const b = next[nodeIds[j]];
            if (!a || !b) continue;
            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            const force = REPULSION / (dist * dist);
            const fx = (dx / dist) * force;
            const fy = (dy / dist) * force;
            a.vx -= fx;
            a.vy -= fy;
            b.vx += fx;
            b.vy += fy;
          }
        }

        // Attraction along edges
        for (const edge of edges) {
          const a = next[edge.from_node_id];
          const b = next[edge.to_node_id];
          if (!a || !b) continue;
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const force = ATTRACTION * dist;
          a.vx += (dx / dist) * force;
          a.vy += (dy / dist) * force;
          b.vx -= (dx / dist) * force;
          b.vy -= (dy / dist) * force;
        }

        // Center gravity
        for (const id of nodeIds) {
          const p = next[id];
          if (!p) continue;
          p.vx += (centerX - p.x) * 0.001;
          p.vy += (centerY - p.y) * 0.001;
        }

        // Apply velocities
        for (const id of nodeIds) {
          const p = next[id];
          if (!p) continue;
          if (dragging === id) continue;
          p.vx *= DAMPING;
          p.vy *= DAMPING;
          p.x += p.vx;
          p.y += p.vy;
          const vel = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
          if (vel > maxVel) maxVel = vel;
        }

        return next;
      });

      if (maxVel > MIN_VELOCITY) {
        animRef.current = requestAnimationFrame(simulate);
      } else {
        setSimulationDone(true);
      }
    };

    animRef.current = requestAnimationFrame(simulate);
    return () => {
      running = false;
      cancelAnimationFrame(animRef.current);
    };
  }, [positions, edges, nodes, centerX, centerY, dragging, simulationDone]);

  // Convert node coords to screen coords
  const toScreen = useCallback(
    (p: Position) => ({
      x: p.x * transform.scale + transform.x,
      y: p.y * transform.scale + transform.y,
    }),
    [transform]
  );

  // Mouse handlers for dragging
  const handleMouseDown = useCallback(
    (e: React.MouseEvent, nodeId: number) => {
      e.stopPropagation();
      const p = positions[nodeId];
      if (!p) return;
      const sp = toScreen(p);
      dragRef.current = { offsetX: e.clientX - sp.x, offsetY: e.clientY - sp.y, nodeId };
      setDragging(nodeId);
    },
    [positions, toScreen]
  );

  useEffect(() => {
    if (dragging === null) return;
    const handleMouseMove = (e: MouseEvent) => {
      setPositions((prev) => {
        const p = { ...prev[dragRef.current.nodeId] };
        if (!p) return prev;
        p.x = (e.clientX - dragRef.current.offsetX - transformRef.current.x) / transformRef.current.scale;
        p.y = (e.clientY - dragRef.current.offsetY - transformRef.current.y) / transformRef.current.scale;
        return { ...prev, [dragRef.current.nodeId]: p };
      });
    };
    const handleMouseUp = () => setDragging(null);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [dragging]);

  // Pan / zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.min(3, Math.max(0.3, transformRef.current.scale * delta));
    const mx = e.clientX;
    const my = e.clientY;
    transformRef.current = {
      scale: newScale,
      x: mx - (mx - transformRef.current.x) * (newScale / transformRef.current.scale),
      y: my - (my - transformRef.current.y) * (newScale / transformRef.current.scale),
    };
    setTransform({ ...transformRef.current });
  }, []);

  const handlePanStart = useCallback((e: React.MouseEvent) => {
    if (dragging !== null) return;
    const startX = e.clientX - transformRef.current.x;
    const startY = e.clientY - transformRef.current.y;
    const handleMove = (ev: MouseEvent) => {
      transformRef.current = { ...transformRef.current, x: ev.clientX - startX, y: ev.clientY - startY };
      setTransform({ ...transformRef.current });
    };
    const handleUp = () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
    };
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
  }, [dragging]);

  const edgeMap = new Map<string, GraphEdge>();
  for (const e of edges) {
    edgeMap.set(`${e.from_node_id}-${e.to_node_id}`, e);
  }

  const nodeById = new Map(nodes.map((n) => [n.id, n]));

  return (
    <svg
      ref={svgRef}
      width={width}
      height={height}
      className="bg-white rounded-lg border cursor-grab"
      onWheel={handleWheel}
      onMouseDown={handlePanStart}
    >
      <defs>
        <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="32" refY="3.5" orient="auto">
          <polygon points="0 0, 10 3.5, 0 7" fill="#94a3b8" />
        </marker>
      </defs>
      <g transform={`translate(${transform.x},${transform.y}) scale(${transform.scale})`}>
        {/* Edges */}
        {edges.map((edge) => {
          const fromP = positions[edge.from_node_id];
          const toP = positions[edge.to_node_id];
          if (!fromP || !toP) return null;
          const dx = toP.x - fromP.x;
          const dy = toP.y - fromP.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const rx = (dx / dist) * NODE_RADIUS;
          const ry = (dy / dist) * NODE_RADIUS;
          return (
            <line
              key={`e-${edge.id}`}
              x1={fromP.x + rx}
              y1={fromP.y + ry}
              x2={toP.x - rx}
              y2={toP.y - ry}
              stroke={edge.relation_type === "prereq" ? "#f59e0b" : "#94a3b8"}
              strokeWidth={1.5}
              strokeDasharray={edge.relation_type === "related" ? "4,3" : "none"}
              markerEnd="url(#arrowhead)"
            />
          );
        })}

        {/* Nodes */}
        {nodes.map((n) => {
          const p = positions[n.id];
          if (!p) return null;
          const isHovered = hovered === n.id;
          const status = statuses[n.id] || "locked";
          const color = STATUS_COLORS[status] || "#9ca3af";

          return (
            <g
              key={`n-${n.id}`}
              transform={`translate(${p.x},${p.y})`}
              style={{ cursor: onNodeClick ? "pointer" : "default" }}
              onMouseEnter={() => setHovered(n.id)}
              onMouseLeave={() => setHovered(null)}
              onMouseDown={(e) => handleMouseDown(e, n.id)}
              onClick={(e) => {
                e.stopPropagation();
                if (onNodeClick && status === "available") onNodeClick(n.id);
              }}
            >
              <circle
                r={NODE_RADIUS}
                fill={color}
                fillOpacity={isHovered ? 0.85 : 0.65}
                stroke={isHovered ? "#1e293b" : "white"}
                strokeWidth={isHovered ? 3 : 2}
              />
              <text
                textAnchor="middle"
                dy="0.35em"
                fill="white"
                fontSize={11}
                fontWeight="bold"
                pointerEvents="none"
              >
                {n.title.length > 12 ? n.title.slice(0, 11) + "…" : n.title}
              </text>
              {/* Difficulty indicator */}
              {n.difficulty && (
                <circle
                  cy={NODE_RADIUS + 6}
                  r={4}
                  fill={
                    n.difficulty === "hard" ? "#ef4444" :
                    n.difficulty === "medium" ? "#f59e0b" :
                    "#22c55e"
                  }
                />
              )}
              {/* Tooltip on hover */}
              {isHovered && (
                <g>
                  <rect
                    x={-80}
                    y={-NODE_RADIUS - 50}
                    width={160}
                    height={40}
                    rx={6}
                    fill="white"
                    stroke="#e2e8f0"
                    strokeWidth={1}
                  />
                  <text
                    x={0}
                    y={-NODE_RADIUS - 30}
                    textAnchor="middle"
                    fill="#1e293b"
                    fontSize={12}
                    fontWeight="bold"
                  >
                    {n.title}
                  </text>
                  <text
                    x={0}
                    y={-NODE_RADIUS - 16}
                    textAnchor="middle"
                    fill="#64748b"
                    fontSize={10}
                  >
                    {status} · {n.estimated_time ? `${n.estimated_time}min` : ""}
                    {n.description ? ` · ${n.description.slice(0, 30)}` : ""}
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </g>
    </svg>
  );
};

export default GraphVisualization;
