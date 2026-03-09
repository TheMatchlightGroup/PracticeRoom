import React, { useState, useRef, useEffect, useMemo } from "react";
import { Card } from "@/components/ui/card";
import type { ContourPoint } from "@/lib/audio/pitchAnalysis";

const MIDI_NOTES = [
  "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B",
];

function midiToNoteName(midi: number): string {
  const octave = Math.floor(midi / 12) - 1;
  const noteName = MIDI_NOTES[midi % 12];
  return `${noteName}${octave}`;
}

interface PitchContourChartProps {
  contourPoints: ContourPoint[];
  mode?: "midi" | "cents";
  targetMidi?: number | null;
  height?: number;
  title?: string;
  showStats?: boolean;
  stats?: {
    stabilityScore?: number;
    voicedRatio?: number;
    drift?: number;
    jitter?: number;
  };
  showLegend?: boolean;
}

interface HoverState {
  active: boolean;
  x: number;
  y: number;
  pointIndex: number | null;
  point?: ContourPoint | null;
}

const StatBadge = ({ label, value }: { label: string; value: string }) => (
  <div className="inline-flex items-center px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-xs font-medium text-blue-800">
    <span className="text-blue-600 mr-1">•</span> {label}: <span className="font-semibold ml-1">{value}</span>
  </div>
);

/**
 * Simple moving average smoothing
 */
function smoothPoints(points: ContourPoint[], windowSize: number): ContourPoint[] {
  if (windowSize <= 1 || points.length === 0) return points;

  const smoothed: ContourPoint[] = [];
  const half = Math.floor(windowSize / 2);

  for (let i = 0; i < points.length; i++) {
    const start = Math.max(0, i - half);
    const end = Math.min(points.length, i + half + 1);
    const window = points.slice(start, end);

    // Only smooth if we have voiced points in window
    const voicedInWindow = window.filter((p) => p.midi !== null);

    if (voicedInWindow.length === 0) {
      smoothed.push(points[i]);
    } else {
      const avgMidi =
        voicedInWindow.reduce((sum, p) => sum + p.midi!, 0) / voicedInWindow.length;
      const avgCents =
        voicedInWindow.reduce((sum, p) => sum + (p.cents || 0), 0) / voicedInWindow.length;
      const avgConf =
        voicedInWindow.reduce((sum, p) => sum + p.conf, 0) / voicedInWindow.length;

      smoothed.push({
        t: points[i].t,
        midi: points[i].midi !== null ? avgMidi : null,
        cents: points[i].cents !== null ? avgCents : null,
        conf: avgConf,
      });
    }
  }

  return smoothed;
}

export default function PitchContourChart({
  contourPoints,
  mode: initialMode = "midi",
  targetMidi,
  height = 320,
  title = "Pitch Contour",
  showStats = true,
  stats,
  showLegend = true,
}: PitchContourChartProps) {
  const [mode, setMode] = useState<"midi" | "cents">(initialMode);
  const [smoothing, setSmoothing] = useState<"off" | "light" | "medium">("off");
  const [confidenceFilter, setConfidenceFilter] = useState(0.0);
  const [hover, setHover] = useState<HoverState>({
    active: false,
    x: 0,
    y: 0,
    pointIndex: null,
  });
  const [animate, setAnimate] = useState(true);
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Trigger animation on mount
  useEffect(() => {
    setAnimate(true);
  }, []);

  // Filter by confidence
  const filteredPoints = useMemo(() => {
    return contourPoints.map((p) => ({
      ...p,
      midi: p.conf >= confidenceFilter ? p.midi : null,
      cents: p.conf >= confidenceFilter ? p.cents : null,
    }));
  }, [contourPoints, confidenceFilter]);

  // Apply smoothing
  const displayPoints = useMemo(() => {
    const windowSize = smoothing === "light" ? 3 : smoothing === "medium" ? 5 : 1;
    return smoothPoints(filteredPoints, windowSize);
  }, [filteredPoints, smoothing]);

  // Calculate stats
  const voicedPoints = useMemo(() => {
    return displayPoints.filter((p) => p.midi !== null);
  }, [displayPoints]);

  const chartStats = useMemo(() => {
    if (voicedPoints.length === 0) {
      return { minMidi: 0, maxMidi: 127, minCents: 0, maxCents: 0 };
    }

    const midis = voicedPoints.map((p) => p.midi!);
    const minMidi = Math.min(...midis);
    const maxMidi = Math.max(...midis);

    let minCents = 0;
    let maxCents = 0;
    if (mode === "cents" && targetMidi !== undefined) {
      const cents = voicedPoints
        .filter((p) => p.cents !== null)
        .map((p) => Math.abs(p.cents!));
      if (cents.length > 0) {
        maxCents = Math.max(...cents);
        minCents = -maxCents;
      }
    }

    return { minMidi, maxMidi, minCents, maxCents };
  }, [voicedPoints, mode, targetMidi]);

  // Insufficient data
  if (voicedPoints.length < 8) {
    return (
      <Card className="p-6 bg-white border-2 border-dashed border-gray-300 flex items-center justify-center" style={{ height: `${height}px` }}>
        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-2">
            Not enough voiced audio to render a contour.
          </p>
          <p className="text-xs text-muted-foreground">
            Try sustaining a vowel (e.g., "ah") in a quiet room.
          </p>
        </div>
      </Card>
    );
  }

  // Chart dimensions with proper margins
  const margin = { top: 20, right: 24, bottom: 48, left: 64 };
  const innerWidth = 800 - margin.left - margin.right; // Fixed container width
  const innerHeight = height - margin.top - margin.bottom;

  // Time domain (actual data range)
  const timeValues = displayPoints.map((p) => p.t);
  const minT = Math.min(...timeValues);
  const maxT = Math.max(...timeValues);
  const timeDuration = Math.max(maxT - minT, 0.1); // Extend if too short
  const xDomain = [minT, maxT || minT + 1];

  // Y-axis range
  let yMin: number, yMax: number;
  if (mode === "cents" && targetMidi !== undefined) {
    const centValues = voicedPoints
      .filter((p) => p.cents !== null)
      .map((p) => Math.abs(p.cents!));
    const maxAbs = centValues.length > 0 ? Math.max(...centValues) : 0;
    yMin = -maxAbs - 5;
    yMax = maxAbs + 5;
  } else {
    yMin = Math.max(chartStats.minMidi - 2, 0);
    yMax = Math.min(chartStats.maxMidi + 2, 127);
  }
  const yRange = Math.max(yMax - yMin, 1);

  // Scale functions (pixel-based)
  const scaleX = (time: number): number => {
    return ((time - xDomain[0]) / (xDomain[1] - xDomain[0])) * innerWidth;
  };

  const scaleY = (value: number): number => {
    return innerHeight - ((value - yMin) / yRange) * innerHeight;
  };

  // Get y value for a point
  const getYValue = (point: ContourPoint): number | null => {
    return mode === "cents" ? point.cents : point.midi;
  };

  // Build path segments for line
  const pathSegments: string[] = [];
  let currentSegment = "";

  for (let i = 0; i < displayPoints.length; i++) {
    const point = displayPoints[i];
    const yValue = getYValue(point);

    if (yValue !== null && yValue !== undefined) {
      const x = scaleX(point.t);
      const y = scaleY(yValue);

      if (currentSegment === "") {
        currentSegment = `M ${x} ${y}`;
      } else {
        currentSegment += ` L ${x} ${y}`;
      }
    } else {
      if (currentSegment) {
        pathSegments.push(currentSegment);
        currentSegment = "";
      }
    }
  }

  if (currentSegment) {
    pathSegments.push(currentSegment);
  }

  // Y-axis ticks
  const yTicks: { value: number; label: string }[] = [];
  const tickCount = 5;
  for (let i = 0; i <= tickCount; i++) {
    const value = yMin + (yRange / tickCount) * i;
    let label: string;
    if (mode === "cents") {
      label = `${value.toFixed(0)}¢`;
    } else {
      label = midiToNoteName(Math.round(value));
    }
    yTicks.push({ value, label });
  }

  // X-axis ticks
  const xTicks: { value: number; label: string }[] = [];
  const xTickCount = Math.min(Math.ceil(timeDuration / 5), 4);
  for (let i = 0; i <= xTickCount; i++) {
    const value = xDomain[0] + (timeDuration / xTickCount) * i;
    xTicks.push({ value, label: `${value.toFixed(1)}s` });
  }

  // Handle hover
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current || voicedPoints.length === 0) return;

    const svg = svgRef.current;
    const rect = svg.getBoundingClientRect();
    const relX = e.clientX - rect.left - margin.left;
    const relY = e.clientY - rect.top - margin.top;

    // Convert pixel to time (within chart bounds)
    if (relX < 0 || relX > innerWidth) {
      setHover({ active: false, x: 0, y: 0, pointIndex: null });
      return;
    }

    const timeFromPixel = xDomain[0] + (relX / innerWidth) * (xDomain[1] - xDomain[0]);

    // Find nearest voiced point
    let nearestIndex = -1;
    let minDist = Infinity;

    for (let i = 0; i < displayPoints.length; i++) {
      const point = displayPoints[i];
      if (point.midi === null) continue;

      const dist = Math.abs(point.t - timeFromPixel);
      if (dist < minDist) {
        minDist = dist;
        nearestIndex = i;
      }
    }

    if (nearestIndex >= 0) {
      const point = displayPoints[nearestIndex];
      const yValue = getYValue(point);
      setHover({
        active: true,
        x: scaleX(point.t) + margin.left,
        y: yValue !== null ? scaleY(yValue) + margin.top : margin.top,
        pointIndex: nearestIndex,
        point,
      });
    }
  };

  const handleMouseLeave = () => {
    setHover({ active: false, x: 0, y: 0, pointIndex: null });
  };

  return (
    <div ref={containerRef} className="w-full">
      <Card className="p-6 bg-white rounded-xl shadow-sm">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h3 className="text-lg font-semibold text-foreground">{title}</h3>

          {/* Stats badges */}
          {showStats && (
            <div className="flex flex-wrap gap-2">
              {stats?.stabilityScore !== undefined && (
                <StatBadge label="Stability" value={`${stats.stabilityScore.toFixed(0)}%`} />
              )}
              {stats?.voicedRatio !== undefined && (
                <StatBadge label="Voiced" value={`${(stats.voicedRatio * 100).toFixed(0)}%`} />
              )}
              {stats?.drift !== undefined && (
                <StatBadge label="Drift" value={`${stats.drift.toFixed(2)}¢/s`} />
              )}
              {stats?.jitter !== undefined && (
                <StatBadge label="Jitter" value={`${stats.jitter.toFixed(2)}¢`} />
              )}
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6 sm:items-center justify-between">
          <div className="flex flex-wrap gap-3">
            {/* View mode */}
            <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setMode("midi")}
                className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                  mode === "midi"
                    ? "bg-white text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                MIDI
              </button>
              {targetMidi !== undefined && (
                <button
                  onClick={() => setMode("cents")}
                  className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                    mode === "cents"
                      ? "bg-white text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Cents
                </button>
              )}
            </div>

            {/* Smoothing */}
            <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
              {(["off", "light", "medium"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setSmoothing(s)}
                  className={`px-3 py-1.5 rounded text-xs font-medium transition-colors capitalize ${
                    smoothing === s
                      ? "bg-white text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Confidence filter */}
          <div className="flex items-center gap-2 text-xs">
            <label className="text-muted-foreground">Confidence:</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={confidenceFilter}
              onChange={(e) => setConfidenceFilter(parseFloat(e.target.value))}
              className="w-24 h-1.5 rounded-lg appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${
                  confidenceFilter * 100
                }%, #e5e7eb ${confidenceFilter * 100}%, #e5e7eb 100%)`,
              }}
            />
            <span className="text-muted-foreground w-8 text-right">{(confidenceFilter * 100).toFixed(0)}%</span>
          </div>
        </div>

        {/* Chart */}
        <div className="relative overflow-hidden rounded-lg border border-gray-200 bg-white" style={{ minHeight: `${height}px` }}>
          <svg
            ref={svgRef}
            width="100%"
            height={height}
            viewBox={`0 0 ${margin.left + innerWidth + margin.right} ${height}`}
            preserveAspectRatio="xMidYMid meet"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className="cursor-crosshair"
          >
            {/* Chart area group with margins */}
            <g transform={`translate(${margin.left}, ${margin.top})`}>
              {/* Horizontal grid lines */}
              {yTicks.map((tick) => {
                const y = scaleY(tick.value);
                return (
                  <line
                    key={`grid-${tick.value}`}
                    x1="0"
                    y1={y}
                    x2={innerWidth}
                    y2={y}
                    stroke="#e5e7eb"
                    strokeWidth="1"
                    opacity="0.3"
                  />
                );
              })}

              {/* Y-axis */}
              <line
                x1="0"
                y1="0"
                x2="0"
                y2={innerHeight}
                stroke="#1f2937"
                strokeWidth="2"
              />

              {/* X-axis */}
              <line
                x1="0"
                y1={innerHeight}
                x2={innerWidth}
                y2={innerHeight}
                stroke="#1f2937"
                strokeWidth="2"
              />

              {/* Pitch contour line */}
              {pathSegments.map((pathData, idx) => (
                <path
                  key={`segment-${idx}`}
                  d={pathData}
                  fill="none"
                  stroke="#2563eb"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity="0.9"
                  style={
                    animate
                      ? {
                          animation: `dashAnimation 500ms ease-out forwards`,
                          animationDelay: `${idx * 50}ms`,
                        }
                      : undefined
                  }
                />
              ))}

              {/* Target line */}
              {targetMidi !== undefined && (
                <>
                  {mode === "midi" ? (
                    <>
                      <line
                        x1="0"
                        y1={scaleY(targetMidi)}
                        x2={innerWidth}
                        y2={scaleY(targetMidi)}
                        stroke="#10b981"
                        strokeWidth="2"
                        strokeDasharray="4,4"
                        opacity="0.6"
                      />
                      <text
                        x={innerWidth + 4}
                        y={scaleY(targetMidi)}
                        dominantBaseline="middle"
                        className="fill-emerald-600"
                        fontSize="11"
                        fontWeight="600"
                      >
                        Target
                      </text>
                    </>
                  ) : (
                    <>
                      <line
                        x1="0"
                        y1={scaleY(0)}
                        x2={innerWidth}
                        y2={scaleY(0)}
                        stroke="#10b981"
                        strokeWidth="2"
                        strokeDasharray="4,4"
                        opacity="0.6"
                      />
                      <text
                        x={innerWidth + 4}
                        y={scaleY(0)}
                        dominantBaseline="middle"
                        className="fill-emerald-600"
                        fontSize="11"
                        fontWeight="600"
                      >
                        Target
                      </text>
                    </>
                  )}
                </>
              )}

              {/* Hover vertical line */}
              {hover.active && (
                <>
                  <line
                    x1={hover.x - margin.left}
                    y1="0"
                    x2={hover.x - margin.left}
                    y2={innerHeight}
                    stroke="#94a3b8"
                    strokeWidth="1.5"
                    opacity="0.4"
                    pointerEvents="none"
                  />
                  {hover.point && hover.point.midi !== null && (
                    <circle
                      cx={hover.x - margin.left}
                      cy={hover.y - margin.top}
                      r="4"
                      fill="#2563eb"
                      opacity="0.8"
                      pointerEvents="none"
                    />
                  )}
                </>
              )}
            </g>

            {/* Y-axis ticks and labels (outside chart group) */}
            {yTicks.map((tick) => {
              const y = scaleY(tick.value) + margin.top;
              return (
                <g key={`ytick-${tick.value}`}>
                  <line
                    x1={margin.left - 5}
                    y1={y}
                    x2={margin.left}
                    y2={y}
                    stroke="#1f2937"
                    strokeWidth="1"
                  />
                  <text
                    x={margin.left - 8}
                    y={y}
                    textAnchor="end"
                    dominantBaseline="middle"
                    fontSize="12"
                    className="fill-muted-foreground"
                  >
                    {tick.label}
                  </text>
                </g>
              );
            })}

            {/* X-axis ticks and labels (outside chart group) */}
            {xTicks.map((tick) => {
              const x = scaleX(tick.value) + margin.left;
              return (
                <g key={`xtick-${tick.value}`}>
                  <line
                    x1={x}
                    y1={margin.top + innerHeight}
                    x2={x}
                    y2={margin.top + innerHeight + 5}
                    stroke="#1f2937"
                    strokeWidth="1"
                  />
                  <text
                    x={x}
                    y={margin.top + innerHeight + 16}
                    textAnchor="middle"
                    fontSize="12"
                    className="fill-muted-foreground"
                  >
                    {tick.label}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Hover tooltip */}
          {hover.active && hover.point && (
            <div
              className="absolute bg-white border border-gray-300 rounded-lg shadow-lg px-3 py-2 pointer-events-none z-10"
              style={{
                left: `${Math.min(hover.x + 12, containerRef.current?.offsetWidth || 300)}px`,
                top: `${hover.y - 40}px`,
              }}
            >
              <div className="text-xs font-medium text-foreground">
                <p>Time: {hover.point.t.toFixed(2)}s</p>
                {hover.point.midi !== null && (
                  <p>
                    {mode === "cents"
                      ? `Cents: ${hover.point.cents?.toFixed(0)}¢`
                      : `Pitch: ${midiToNoteName(Math.round(hover.point.midi))} (${hover.point.midi.toFixed(1)})`}
                  </p>
                )}
                <p className="text-muted-foreground">Confidence: {(hover.point.conf * 100).toFixed(0)}%</p>
              </div>
            </div>
          )}
        </div>

        {/* Caption and legend */}
        <div className="mt-4 flex flex-col sm:flex-row sm:justify-between sm:items-end gap-3 text-xs text-muted-foreground">
          <p>Gaps indicate unvoiced frames</p>
          {showLegend && (
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-0.5 bg-blue-500"></div>
                <span>Detected pitch</span>
              </div>
              {targetMidi !== undefined && (
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-0.5 bg-emerald-600"
                    style={{ backgroundImage: "repeating-linear-gradient(to right, #10b981 0, #10b981 4px, transparent 4px, transparent 8px)" }}
                  ></div>
                  <span>Target</span>
                </div>
              )}
            </div>
          )}
        </div>
      </Card>

      <style>{`
        @keyframes dashAnimation {
          from {
            stroke-dashoffset: 1000;
          }
          to {
            stroke-dashoffset: 0;
          }
        }

        input[type="range"] {
          -webkit-appearance: none;
          width: 100%;
        }

        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }

        input[type="range"]::-moz-range-thumb {
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }
      `}</style>
    </div>
  );
}
