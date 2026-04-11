import { registerRoot, Composition } from "remotion";
import React from "react";
import type { ComponentType } from "react";
import { MFDTradeToday, type MFDTradeTodayProps } from "./compositions/mfd-trade-today";
import { AESignal, type AESignalProps } from "./compositions/ae-signal";

const WIDTH = 1080;
const HEIGHT = 1920;
const FPS = 30;
const DURATION = 900; // 30 seconds

// Remotion requires component props to extend Record<string, unknown>.
// Double-cast via unknown at the entry point rather than adding index
// signatures to all composition interfaces.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const MFDTradeTodayComp = MFDTradeToday as any as ComponentType<Record<string, unknown>>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const AESignalComp = AESignal as any as ComponentType<Record<string, unknown>>;

function Root() {
  return (
    <>
      <Composition
        id="MFDTradeToday"
        component={MFDTradeTodayComp}
        durationInFrames={DURATION}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
        defaultProps={{
          hook: "Oil dropped 10%. Here's why that's wrong.",
          points: [
            "Iran re-closed the Strait within hours",
            "Infrastructure damage takes months to fix",
            "Defense stocks win either way",
          ],
          cta: "Get the full brief free",
          url: "marketsfordummies.com",
        } as Record<string, unknown>}
      />
      <Composition
        id="AESignal"
        component={AESignalComp}
        durationInFrames={DURATION}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
        defaultProps={{
          hook: "AI didn't replace jobs. It replaced junior work.",
          points: [
            "Entry-level coding roles down 35% YoY",
            "Senior roles up — orgs need people who can direct AI",
            "The moat is judgment, not syntax",
          ],
          takeaway: "Learn to direct AI or get directed out.",
          cta: "Follow @artificialeducation",
        } as Record<string, unknown>}
      />
    </>
  );
}

registerRoot(Root);
