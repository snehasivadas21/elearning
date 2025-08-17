import React, { useRef, useEffect, useState } from "react";
import { motion, animate, useMotionValue } from "framer-motion";
import { FaGraduationCap, FaBookOpen, FaClipboardCheck, FaChalkboardTeacher, FaUserTie, FaCertificate, FaTrophy } from "react-icons/fa";
import confetti from "canvas-confetti";


const stations = [
  { key: "enroll", label: "Enroll", desc: "Choose a course", icon: <FaGraduationCap /> , pos: 0.06},
  { key: "study", label: "Study", desc: "Complete modules", icon: <FaBookOpen /> , pos: 0.22},
  { key: "quizzes", label: "Quizzes", desc: "Test knowledge", icon: <FaClipboardCheck /> , pos: 0.37},
  { key: "live", label: "Live Sessions", desc: "Join sessions", icon: <FaChalkboardTeacher /> , pos: 0.55},
  { key: "mock", label: "Mock Interview", desc: "Practice interviews", icon: <FaUserTie /> , pos: 0.70},
  { key: "cert", label: "Certificate", desc: "Get certified", icon: <FaCertificate /> , pos: 0.84},
  { key: "job", label: "Job", desc: "Victory!", icon: <FaTrophy /> , pos: 0.98},
];

export default function RoadmapCinematic({
  height = 280,
  stroke = 8,
  travelDuration = 8000,
  autoPlay = true,
}) {
  const svgRef = useRef(null);
  const pathRef = useRef(null);
  const vehicleRef = useRef(null);
  const [pathLen, setPathLen] = useState(0);
  const progress = useMotionValue(0); // 0..1
  const [activeStations, setActiveStations] = useState({});
  const [playing, setPlaying] = useState(false);
  const [drawComplete, setDrawComplete] = useState(false);

  // Draw path stroke animation using strokeDashoffset
  useEffect(() => {
    if (!pathRef.current) return;
    const path = pathRef.current;
    const len = path.getTotalLength();
    setPathLen(len);

    // setup initial dash
    path.style.strokeDasharray = len;
    path.style.strokeDashoffset = len;

    // animate drawing the path
    const ctrl = animate(1, 0, {
      duration: 1.6,
      ease: [0.2, 0.8, 0.2, 1],
      onUpdate: (v) => {
        const offset = len * v;
        path.style.strokeDashoffset = offset;
      },
      onComplete: () => {
        setDrawComplete(true);
      },
    });

    return () => ctrl.stop();
  }, []);

  // When drawComplete, autoplay travel
  useEffect(() => {
    if (drawComplete && autoPlay) {
      startTravel();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drawComplete]);

  // Travel animation: animate progress from 0 to 1
  function startTravel() {
    if (!pathRef.current) return;
    setPlaying(true);
    setActiveStations({}); // reset
    const controls = animate(progress, 1, {
      duration: travelDuration / 1000,
      ease: "linear",
      onUpdate: (v) => {
        // check stations triggers
        stations.forEach((s) => {
          if (v >= s.pos && !activeStations[s.key]) {
            // mark station active
            setActiveStations((prev) => ({ ...prev, [s.key]: true }));
          }
        });

        // when very close to end, trigger final confetti
        if (v > 0.995) {
          triggerVictory();
        }
        // move the vehicle
        moveVehicleAlongPath(v);
      },
      onComplete: () => {
        setPlaying(false);
      },
    });

    return () => controls.stop();
  }

  function reset() {
    progress.set(0);
    setActiveStations({});
    setDrawComplete(false);
    setPlaying(false);
    if (pathRef.current) {
      // hide path again and redraw
      const len = pathRef.current.getTotalLength();
      pathRef.current.style.strokeDashoffset = len;
      // animate draw again
      const ctrl = animate(1, 0, {
        duration: 1.6,
        ease: [0.2, 0.8, 0.2, 1],
        onUpdate: (v) => {
          const offset = len * v;
          pathRef.current.style.strokeDashoffset = offset;
        },
        onComplete: () => {
          setDrawComplete(true);
          startTravel();
        },
      });
      return () => ctrl.stop();
    }
  }

  // Moves the vehicle element to the point along path for t in [0,1]
  function moveVehicleAlongPath(t) {
    if (!pathRef.current || !vehicleRef.current || !svgRef.current) return;
    const path = pathRef.current;
    const svg = svgRef.current;
    const len = path.getTotalLength();
    const pt = path.getPointAtLength(Math.max(0, Math.min(len, t * len)));

    // Convert SVG point to translate values: use the SVG's client rect offset for container
    // But simplest is to set vehicle transform based on SVG coordinates:
    vehicleRef.current.setAttribute("transform", `translate(${pt.x}, ${pt.y})`);
    // rotate vehicle to path tangent
    const delta = 0.01 * len;
    const ahead = path.getPointAtLength(Math.min(len, Math.max(0, t * len + delta)));
    const angle = Math.atan2(ahead.y - pt.y, ahead.x - pt.x) * (180 / Math.PI);
    vehicleRef.current.setAttribute("transform", `translate(${pt.x}, ${pt.y}) rotate(${angle})`);
  }

  function triggerVictory() {
    // small confetti burst
    confetti({
      particleCount: 120,
      spread: 70,
      origin: { x: 0.9, y: 0.2 },
    });
    confetti({
      particleCount: 80,
      spread: 110,
      origin: { x: 0.1, y: 0.3 },
    });
  }

  // initial move (so it sits at start before travel)
  useEffect(() => {
    moveVehicleAlongPath(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathLen]);

  // Simple responsive svg path (curved road). You can replace path d to make it more fancy.
  const viewWidth = 1400; // design width; the SVG scales responsively
  const viewHeight = height;

  return (
    <div className="w-full py-12 bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-bold">Road to Success</h2>
          <div className="flex gap-2">
            <button
              className="px-5 py-2 rounded-md bg-indigo-600 text-white text-md shadow"
              onClick={() => {
                if (!playing) startTravel();
              }}
            >
              Play
            </button>
            <button
              className="px-5 py-2 rounded-md border text-md"
              onClick={() => {
                reset();
              }}
            >
              Replay
            </button>
          </div>
        </div>

        <div className="relative rounded-xl bg-white p-6 shadow">
          <div className="overflow-x-auto">
            {/* SVG container */}
            <svg
              ref={svgRef}
              viewBox={`0 0 ${viewWidth} ${viewHeight}`}
              width="100%"
              height={height}
              preserveAspectRatio="xMidYMid meet"
              className="block"
            >
              {/* subtle background road shadow */}
              <path
                d={getRoadPathD(viewWidth, viewHeight)}
                fill="none"
                stroke="rgba(15,23,42,0.04)"
                strokeWidth={stroke + 6}
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* main road path (animated draw) */}
              <path
                ref={pathRef}
                d={getRoadPathD(viewWidth, viewHeight)}
                fill="none"
                stroke="#6d28d9"
                strokeWidth={stroke}
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ filter: "drop-shadow(0 6px 10px rgba(99,102,241,0.08))" }}
              />

              {/* dashed center line along path: create many markers along path positions */}
              {Array.from({ length: 70 }).map((_, i) => {
                const t = i / 69;
                // compute position on path for each dash
                const pt = getPointOnPathAtT(pathRef.current, getRoadPathD(viewWidth, viewHeight), t);
                if (!pt) return null;
                return (
                  <rect
                    key={i}
                    x={pt.x - 4}
                    y={pt.y - 1}
                    width={8}
                    height={2}
                    rx={1}
                    fill="#fff"
                    opacity={0.85}
                    transform={`rotate(${pt.angle}, ${pt.x}, ${pt.y})`}
                  />
                );
              })}

              {/* stations markers (visual circles and icons) */}
              {stations.map((s, idx) => {
                // find point for station pos
                const pt = getPointOnPathAtT(pathRef.current, getRoadPathD(viewWidth, viewHeight), s.pos);
                const visible = activeStations[s.key];
                if (!pt) {
                  // fallback: place evenly
                  const fallbackX = 80 + idx * 180;
                  const fallbackY = viewHeight / 2;
                  return (
                    <g key={s.key} transform={`translate(${fallbackX}, ${fallbackY})`}>
                      <circle r="18" fill="#fff" stroke="#6d28d9" strokeWidth="3" />
                      <text x="0" y="6" fontSize="14" textAnchor="middle" fill="#6d28d9">
                        {s.icon}
                      </text>
                    </g>
                  );
                }

                return (
                  <g key={s.key} transform={`translate(${pt.x}, ${pt.y})`}>
                    {/* connector tiny ring */}
                    <motion.circle
                      r={visible ? 18 : 12}
                      fill={visible ? "#6d28d9" : "#fff"}
                      stroke="#6d28d9"
                      strokeWidth={visible ? 3 : 2}
                      initial={{ r: 12, opacity: 0.8 }}
                      animate={{ r: visible ? 18 : 12 }}
                      transition={{ type: "spring", stiffness: 300, damping: 24 }}
                    />
                    {/* icon (render via foreignObject for React icon fallback) */}
                    <foreignObject x={-12} y={-12} width={24} height={24}>
                      <div style={{ width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <div style={{ color: visible ? "#fff" : "#6d28d9", fontSize: 14 }}>
                          {s.icon}
                        </div>
                      </div>
                    </foreignObject>
                    {/* popup label when active */}
                    <motion.g
                      initial={{ opacity: 0, y: 12 }}
                      animate={visible ? { opacity: 1, y: -40 } : { opacity: 0, y: 12 }}
                      transition={{ type: "spring", stiffness: 380, damping: 28, duration: 0.6 }}
                    >
                      <rect x={-80} y={-80} rx={12} width={160} height={56} fill="#fff" stroke="#e6e6f0" />
                      <text x={-66} y={-58} fontSize="14" fill="#0f172a" fontWeight="600">
                        {s.label}
                      </text>
                      <text x={-66} y={-42} fontSize="11" fill="#475569">
                        {s.desc}
                      </text>
                    </motion.g>
                  </g>
                );
              })}

              {/* vehicle: a simple car-like group */}
              <g>
                <motion.g
                  ref={vehicleRef}
                  initial={false}
                  style={{ originX: "center", originY: "center" }}
                  // the transform is set imperatively in moveVehicleAlongPath
                >
                  {/* shadow */}
                  <ellipse cx="0" cy={viewHeight / 2 + 18} rx="28" ry="6" fill="rgba(15,23,42,0.06)" />
                  <g transform="translate(-18,-10) scale(1.1)">
                    <rect x={0} y={0} rx={8} width={36} height={18} fill="#111827" opacity={0.9} />
                    <rect x={4} y={2} rx={4} width={28} height={12} fill="#8b5cf6" />
                    <circle cx={7} cy={20} r={3.6} fill="#0f172a" />
                    <circle cx={29} cy={20} r={3.6} fill="#0f172a" />
                  </g>
                </motion.g>
              </g>
            </svg>
          </div>

          {/* legend / station list below (desktop) */}
          <div className="mt-6 grid grid-cols-2 md:grid-cols-7 gap-3 items-center">
            {stations.map((s) => (
              <div key={s.key} className="flex items-center gap-2 text-xs">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${activeStations[s.key] ? "bg-indigo-600 text-white" : "bg-white border"}`}>
                  <div style={{ fontSize: 14 }}>{s.icon}</div>
                </div>
                <div>
                  <div className={`font-medium ${activeStations[s.key] ? "text-slate-900" : "text-slate-500"}`}>{s.label}</div>
                  <div className="text-[11px] text-slate-400">{s.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}


function getRoadPathD(w, h) {
  // We'll create a gentle S-curve path across the width
  const leftPad = 80;
  const rightPad = 80;
  const midY = h / 2;
  const x1 = leftPad;
  const x2 = w * 0.22;
  const x3 = w * 0.42;
  const x4 = w * 0.62;
  const x5 = w * 0.82;
  const x6 = w - rightPad;

  // Adjust vertical control offsets for variety
  return `M ${x1} ${midY}
    C ${x1 + 90} ${midY - 60}, ${x2 - 40} ${midY + 40}, ${x2} ${midY}
    S ${x3 + 20} ${midY - 50}, ${x3} ${midY}
    S ${x4 - 20} ${midY + 60}, ${x4} ${midY}
    S ${x5 + 20} ${midY - 40}, ${x5} ${midY}
    S ${x6 - 60} ${midY + 30}, ${x6} ${midY}`;
}

/**
 * Safe helper: if pathRef exists, compute point; otherwise approximate from d path
 * If pathRef exists we use it; otherwise we approximate by sampling cubic path in SVG (fallback not perfect).
 */
function getPointOnPathAtT(pathElement, pathD, t) {
  try {
    if (pathElement) {
      const len = pathElement.getTotalLength();
      const p = pathElement.getPointAtLength(Math.max(0, Math.min(len, t * len)));
      // compute small tangent for angle
      const delta = Math.max(1, len * 0.002);
      const ahead = pathElement.getPointAtLength(Math.min(len, Math.max(0, t * len + delta)));
      const angle = Math.atan2(ahead.y - p.y, ahead.x - p.x) * (180 / Math.PI);
      return { x: p.x, y: p.y, angle };
    } else {
      // fallback: parse pathD? too heavy — return null to let caller fallback
      return null;
    }
  } catch (err) {
    return null;
  }
}
