import { registerRoot } from "@remotion/core";
import React from "react";
import { Composition } from "@remotion/core";
import { MFDTradeToday } from "./compositions/mfd-trade-today";
import { AESignal } from "./compositions/ae-signal";

const WIDTH = 1080;
const HEIGHT = 1920;
const FPS = 30;
const DURATION = 900; // 30 seconds

function Root() {
  return (
    <>
      <Composition
        id="MFDTradeToday"
        component={MFDTradeToday}
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
        }}
      />
      <Composition
        id="AESignal"
        component={AESignal}
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
        }}
      />
    </>
  );
}

registerRoot(Root);
