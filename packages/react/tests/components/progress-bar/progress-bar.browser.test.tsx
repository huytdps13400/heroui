import {render} from "@heroui/testing/browser";
import {page} from "vitest/browser";

import {ProgressBar} from "@/components/progress-bar";

// The indeterminate sweep is a CSS keyframe animation; Vite Tailwind compiles `@/styles.css`.
import "@/styles.css";

const renderIndeterminate = (dir: "ltr" | "rtl") =>
  render(
    <div className="w-[300px]" dir={dir}>
      <ProgressBar isIndeterminate aria-label="Loading">
        <ProgressBar.Track>
          <ProgressBar.Fill />
        </ProgressBar.Track>
      </ProgressBar>
    </div>,
  );

const getTrack = () => document.querySelector<HTMLElement>('[data-slot="progress-bar-track"]')!;
const getFill = () => document.querySelector<HTMLElement>('[data-slot="progress-bar-fill"]')!;

/** Freeze the sweep at a given progress (0 = first frame, 1 = last frame) and measure the fill. */
const fillRectAt = (progress: 0 | 1) => {
  const [animation] = getFill().getAnimations();
  const duration = Number(animation!.effect!.getComputedTiming().duration);

  animation!.pause();
  animation!.currentTime = progress === 0 ? 0 : duration - 1;

  return getFill().getBoundingClientRect();
};

// Sub-pixel rounding is expected; anything beyond that means the fill is inside the track.
const TOLERANCE = 1;

describe("ProgressBar (browser)", () => {
  describe("indeterminate", () => {
    for (const dir of ["ltr", "rtl"] as const) {
      it(`sweeps the fill in from the inline-start edge to past the inline-end edge when dir="${dir}"`, async () => {
        await renderIndeterminate(dir);

        await expect.element(page.getByRole("progressbar", {name: "Loading"})).toBeInTheDocument();

        const track = getTrack().getBoundingClientRect();
        const first = fillRectAt(0);
        const last = fillRectAt(1);

        if (dir === "ltr") {
          // Starts fully hidden past the left edge, ends fully hidden past the right edge.
          expect(first.right).toBeLessThanOrEqual(track.left + TOLERANCE);
          expect(last.left).toBeGreaterThanOrEqual(track.right - TOLERANCE);
        } else {
          // Mirrored: starts fully hidden past the right edge, ends fully hidden past the left edge.
          expect(first.left).toBeGreaterThanOrEqual(track.right - TOLERANCE);
          expect(last.right).toBeLessThanOrEqual(track.left + TOLERANCE);
        }
      });
    }
  });
});
