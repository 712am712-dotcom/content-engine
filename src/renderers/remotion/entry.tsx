import { registerRoot, Composition } from "remotion";
import React from "react";
import type { ComponentType } from "react";
import { MFDTradeToday, type MFDTradeTodayProps } from "./compositions/mfd-trade-today";
import { AESignal, type AESignalProps } from "./compositions/ae-signal";
import { computeSlideFrames } from "../../lib/timing";

const FPS = 30;
// Fallback duration used before calculateMetadata resolves
const DEFAULT_DURATION = 600;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const MFDTradeTodayComp = MFDTradeToday as any as ComponentType<Record<string, unknown>>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const AESignalComp = AESignal as any as ComponentType<Record<string, unknown>>;

const FORMATS = {
  vertical_30s:  { width: 1080, height: 1920 },
  square_30s:    { width: 1080, height: 1080 },
  landscape_30s: { width: 1920, height: 1080 },
} as const;

const MFD_DEFAULT_PROPS: MFDTradeTodayProps = {
  hook: "Oil dropped 10%. Here's why that's wrong.",
  points: [
    "Iran re-closed the Strait within hours",
    "Infrastructure damage takes months to fix",
    "Defense stocks win either way",
  ],
  cta: "Get the full brief free",
  url: "marketsfordummies.com",
};

const AE_DEFAULT_PROPS: AESignalProps = {
  hook: "AI didn't replace jobs. It replaced junior work.",
  points: [
    "Entry-level coding roles down 35% YoY",
    "Senior roles up — orgs need people who can direct AI",
    "The moat is judgment, not syntax",
  ],
  takeaway: "Learn to direct AI or get directed out.",
  cta: "Follow @artificialeducation",
};

// ── calculateMetadata helpers ────────────────────────────────────────────────

function mfdDuration(props: Record<string, unknown>): number {
  const hook   = String(props.hook ?? "");
  const points = (props.points as string[] | undefined) ?? [];
  const trade  = points[points.length - 1] ?? String(props.cta ?? "");
  return computeSlideFrames(hook, points, trade, FPS).total;
}

function aeDuration(props: Record<string, unknown>): number {
  const hook    = String(props.hook ?? "");
  const points  = (props.points as string[] | undefined) ?? [];
  const trade   = String(props.takeaway ?? points[points.length - 1] ?? "");
  return computeSlideFrames(hook, points, trade, FPS).total;
}

// ── Root ─────────────────────────────────────────────────────────────────────

function Root() {
  return (
    <>
      {(Object.entries(FORMATS) as [keyof typeof FORMATS, { width: number; height: number }][]).map(
        ([fmt, { width, height }]) => (
          <React.Fragment key={fmt}>
            <Composition
              id={`MFDTradeToday-${fmt.replace(/_/g, "-")}`}
              component={MFDTradeTodayComp}
              durationInFrames={DEFAULT_DURATION}
              fps={FPS}
              width={width}
              height={height}
              defaultProps={MFD_DEFAULT_PROPS as unknown as Record<string, unknown>}
              calculateMetadata={({ props }) => ({
                durationInFrames: mfdDuration(props),
              })}
            />
            <Composition
              id={`AESignal-${fmt.replace(/_/g, "-")}`}
              component={AESignalComp}
              durationInFrames={DEFAULT_DURATION}
              fps={FPS}
              width={width}
              height={height}
              defaultProps={AE_DEFAULT_PROPS as unknown as Record<string, unknown>}
              calculateMetadata={({ props }) => ({
                durationInFrames: aeDuration(props),
              })}
            />
          </React.Fragment>
        )
      )}
    </>
  );
}

registerRoot(Root);
