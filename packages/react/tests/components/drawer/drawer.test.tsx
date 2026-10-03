import {
  User,
  cleanup,
  fireEvent,
  render,
  runAllTimers,
  screen,
  setupUser,
} from "@heroui/testing/helpers";

import {Drawer} from "@/components/drawer";
import {isDrawerDragTargetOwnedBy} from "@/components/drawer/drawer.utils";

import {DrawerFixture, StackedDrawerFixture} from "./fixtures";

const renderDrawer = (
  props: {
    defaultOpen?: boolean;
    isOpen?: boolean;
    isDismissable?: boolean;
    isKeyboardDismissDisabled?: boolean;
    onOpenChange?: (open: boolean) => void;
    placement?: "top" | "bottom" | "left" | "right";
  } = {},
) => render(<DrawerFixture {...props} />);

describe("Drawer", () => {
  let user: ReturnType<typeof setupUser>;
  let testUtilUser: User;

  beforeEach(() => {
    vi.useFakeTimers({shouldAdvanceTime: true});
    user = setupUser({advanceTimers: vi.advanceTimersByTime});
    testUtilUser = new User({
      interactionType: "mouse",
      advanceTimer: vi.advanceTimersByTime,
    });
  });

  afterEach(() => {
    cleanup();
    runAllTimers();
    vi.useRealTimers();
  });

  it("exposes compound slots via Dialog tester", async () => {
    renderDrawer();

    const tester = testUtilUser.createTester("Dialog", {
      root: screen.getByRole("button", {name: "Open Drawer"}),
      overlayType: "modal",
    });

    expect(tester.getDialog()).toBeNull();

    await tester.open();
    runAllTimers();

    const dialog = tester.getDialog();

    expect(dialog).not.toBeNull();
    expect(dialog).toHaveAttribute("data-slot", "drawer-dialog");
    expect(dialog?.className).toEqual(expect.stringContaining("drawer__dialog"));
    expect(document.querySelector('[data-slot="drawer-backdrop"]')).not.toBeNull();
    expect(document.querySelector('[data-slot="drawer-content"]')).not.toBeNull();
    expect(document.querySelector('[data-slot="drawer-handle"]')).not.toBeNull();
    expect(document.querySelector('[data-slot="drawer-header"]')).not.toBeNull();
    expect(document.querySelector('[data-slot="drawer-body"]')).not.toBeNull();
    expect(document.querySelector('[data-slot="drawer-footer"]')).not.toBeNull();
    expect(screen.getByRole("heading", {name: "Drawer Title"})).toBeInTheDocument();

    await tester.close();
    runAllTimers();

    expect(tester.getDialog()).toBeNull();
  });

  it("supports Escape dismiss when dismissable", async () => {
    const onOpenChange = vi.fn();

    renderDrawer({defaultOpen: true, onOpenChange});
    runAllTimers();

    expect(screen.getByRole("dialog")).toBeInTheDocument();

    await user.keyboard("{Escape}");
    runAllTimers();

    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("blocks Escape dismiss when keyboard dismiss is disabled", async () => {
    const onOpenChange = vi.fn();

    renderDrawer({defaultOpen: true, isKeyboardDismissDisabled: true, onOpenChange});
    runAllTimers();

    expect(screen.getByRole("dialog")).toBeInTheDocument();

    await user.keyboard("{Escape}");
    runAllTimers();

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(onOpenChange).not.toHaveBeenCalledWith(false);
  });

  it("supports closing via CloseTrigger when outside dismiss is disabled", async () => {
    const onOpenChange = vi.fn();

    renderDrawer({defaultOpen: true, isDismissable: false, onOpenChange});
    runAllTimers();

    await user.click(screen.getByRole("button", {name: "Close"}));
    runAllTimers();

    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("exposes placement content modifier and data-placement", async () => {
    renderDrawer({defaultOpen: true, placement: "right"});
    runAllTimers();

    const content = document.querySelector('[data-slot="drawer-content"]');

    expect(content).toHaveAttribute("data-placement", "right");
    expect(content?.className).toEqual(expect.stringContaining("drawer__content--right"));
  });

  it("supports controlled isOpen", async () => {
    const onOpenChange = vi.fn();

    const {rerender} = renderDrawer({isOpen: false, onOpenChange});

    runAllTimers();

    expect(screen.queryByRole("dialog")).toBeNull();

    rerender(<DrawerFixture isOpen onOpenChange={onOpenChange} />);
    runAllTimers();

    expect(screen.getByRole("dialog")).toBeInTheDocument();

    await user.keyboard("{Escape}");
    runAllTimers();

    expect(onOpenChange).toHaveBeenCalledWith(false);
    // Controlled: stays open until `isOpen` changes.
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("supports handle ownership across stacked drawers", () => {
    render(<StackedDrawerFixture />);
    runAllTimers();

    const childHandle = screen.getByTestId("child-drawer-handle");
    const childDialog = childHandle.closest<HTMLElement>('[data-slot="drawer-dialog"]');
    const parentDialog = screen
      .getByTestId("parent-drawer-handle")
      .closest<HTMLElement>('[data-slot="drawer-dialog"]');

    expect(childDialog).not.toBeNull();
    expect(parentDialog).not.toBeNull();

    if (!childDialog || !parentDialog) return;

    expect(isDrawerDragTargetOwnedBy(childHandle, childDialog)).toBe(true);
    expect(isDrawerDragTargetOwnedBy(childHandle, parentDialog)).toBe(false);
  });

  it("keeps drag-to-dismiss working when Drawer.Dialog receives pointer handlers", () => {
    const onPointerDown = vi.fn();
    const onPointerMove = vi.fn();

    render(
      <Drawer defaultOpen>
        <Drawer.Backdrop>
          <Drawer.Content placement="bottom">
            <Drawer.Dialog onPointerDown={onPointerDown} onPointerMove={onPointerMove}>
              <Drawer.Handle data-testid="drawer-handle" />
              <Drawer.Heading>Drawer Title</Drawer.Heading>
            </Drawer.Dialog>
          </Drawer.Content>
        </Drawer.Backdrop>
      </Drawer>,
    );
    runAllTimers();

    const dialog = screen.getByRole("dialog");
    const handle = screen.getByTestId("drawer-handle");

    // jsdom does not implement pointer capture.
    dialog.setPointerCapture = vi.fn();

    fireEvent.pointerDown(handle, {button: 0, clientY: 100, pointerId: 1});
    fireEvent.pointerMove(handle, {clientY: 160, pointerId: 1});

    expect(onPointerDown).toHaveBeenCalledTimes(1);
    expect(onPointerMove).toHaveBeenCalledTimes(1);
    expect(dialog.style.transform).toBe("translateY(60px)");
  });
});
