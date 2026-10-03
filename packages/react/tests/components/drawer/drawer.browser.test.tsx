import {render} from "@heroui/testing/browser";
import {isDocumentScrollLocked} from "@heroui/testing/helpers";
import {page, userEvent} from "vitest/browser";

import {DrawerFixture} from "./fixtures";

// Edge docking and the slide transform live in CSS; Vite Tailwind compiles `@/styles.css`.
import "@/styles.css";

const renderDrawer = () => render(<DrawerFixture />);

// Sub-pixel rounding is expected; anything beyond that means the panel is off its edge.
const TOLERANCE = 1;

describe("Drawer (browser)", () => {
  it("supports focus trap, scroll lock, and Escape focus restore", async () => {
    await renderDrawer();

    const trigger = page.getByRole("button", {name: "Open Drawer"});

    await trigger.click();

    const dialog = page.getByRole("dialog");

    await expect.element(dialog).toBeInTheDocument();
    expect(isDocumentScrollLocked()).toBe(true);
    expect(dialog.element().contains(document.activeElement)).toBe(true);

    await userEvent.tab();
    expect(dialog.element().contains(document.activeElement)).toBe(true);

    await userEvent.keyboard("{Escape}");

    await expect.element(dialog).not.toBeInTheDocument();
    expect(isDocumentScrollLocked()).toBe(false);
    await expect.element(trigger).toHaveFocus();
  });

  describe("horizontal placement", () => {
    let noTransitions: HTMLStyleElement;

    beforeEach(() => {
      // Measure the resting position, not a frame of the slide-in transition.
      noTransitions = document.createElement("style");
      noTransitions.textContent = ".drawer__dialog { transition: none !important; }";
      document.head.append(noTransitions);
    });

    afterEach(() => {
      noTransitions.remove();
      document.documentElement.removeAttribute("dir");
    });

    // `left` / `right` are physical placements: the slide-in/out translate and the drag-to-dismiss
    // axis are both physical, so the panel has to dock to the same physical edge in RTL too.
    for (const dir of ["ltr", "rtl"] as const) {
      for (const placement of ["left", "right"] as const) {
        it(`docks a ${placement} drawer to the ${placement} viewport edge when dir="${dir}"`, async () => {
          document.documentElement.setAttribute("dir", dir);

          await render(<DrawerFixture defaultOpen placement={placement} />);

          const dialog = page.getByRole("dialog");

          await expect.element(dialog).toBeInTheDocument();
          await expect
            .poll(() =>
              document.querySelector('[data-slot="drawer-content"]')?.hasAttribute("data-entering"),
            )
            .toBe(false);

          const rect = dialog.element().getBoundingClientRect();
          const distanceFromEdge =
            placement === "left" ? rect.left : document.documentElement.clientWidth - rect.right;

          expect(Math.abs(distanceFromEdge)).toBeLessThanOrEqual(TOLERANCE);
        });
      }
    }
  });
});
