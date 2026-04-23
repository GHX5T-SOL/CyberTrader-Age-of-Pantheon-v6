import { Composition } from "remotion";
import { Phase1Teaser } from "./compositions/Phase1Teaser";

export const Root = () => {
  return (
    <>
      <Composition
        id="Phase1Teaser"
        component={Phase1Teaser}
        durationInFrames={210}
        fps={30}
        width={1080}
        height={1920}
      />
    </>
  );
};
