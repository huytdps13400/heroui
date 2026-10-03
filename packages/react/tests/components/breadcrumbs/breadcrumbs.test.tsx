import {render, screen, setupUser} from "@heroui/testing/helpers";

import {Breadcrumbs} from "@/components/breadcrumbs";

const renderBreadcrumbs = (
  props: Partial<{isDisabled: boolean; separator: React.ReactNode}> = {},
) =>
  render(
    <Breadcrumbs
      data-testid="breadcrumbs"
      isDisabled={props.isDisabled}
      separator={props.separator}
    >
      <Breadcrumbs.Item href="#home">Home</Breadcrumbs.Item>
      <Breadcrumbs.Item href="#products">Products</Breadcrumbs.Item>
      <Breadcrumbs.Item>Laptop</Breadcrumbs.Item>
    </Breadcrumbs>,
  );

describe("Breadcrumbs", () => {
  let user: ReturnType<typeof setupUser>;

  beforeAll(() => {
    user = setupUser();
  });

  it("exposes data-slot, BEM block, and a labelled list role", () => {
    renderBreadcrumbs();

    const root = screen.getByTestId("breadcrumbs");

    expect(root).toHaveAttribute("data-slot", "breadcrumbs");
    expect(root.className).toEqual(expect.stringContaining("breadcrumbs"));
    expect(screen.getByRole("list")).toBe(root);
    expect(screen.getAllByRole("listitem")).toHaveLength(3);
  });

  it("renders each item as a link with data-slot", () => {
    renderBreadcrumbs();

    expect(document.querySelectorAll('[data-slot="breadcrumbs-item"]')).toHaveLength(3);
    expect(screen.getByRole("link", {name: "Home"})).toHaveAttribute("href", "#home");
    expect(screen.getByRole("link", {name: "Products"})).toHaveAttribute("href", "#products");
  });

  it("exposes current page on the last item without separator", () => {
    renderBreadcrumbs();

    const current = screen.getByText("Laptop");

    expect(current.closest("li")).toHaveAttribute("data-current", "true");
    expect(screen.getByRole("link", {name: "Laptop"})).toHaveAttribute("aria-current", "page");
  });

  it("renders a default chevron separator between non-final items", () => {
    renderBreadcrumbs();

    expect(document.querySelectorAll('[data-slot="breadcrumbs-separator"]')).toHaveLength(2);
  });

  it("supports a custom separator", () => {
    renderBreadcrumbs({separator: <span data-testid="custom-separator">/</span>});

    const separators = document.querySelectorAll('[data-slot="breadcrumbs-separator"]');

    expect(separators).toHaveLength(2);
    expect(screen.getAllByTestId("custom-separator")).toHaveLength(2);
  });

  it("exposes aria-disabled on links when isDisabled", () => {
    renderBreadcrumbs({isDisabled: true});

    expect(screen.getByRole("link", {name: "Home"})).toHaveAttribute("aria-disabled", "true");
    expect(screen.getByRole("link", {name: "Products"})).toHaveAttribute("aria-disabled", "true");
  });

  it("calls onPress when a non-current item is activated", async () => {
    const onPress = vi.fn();

    render(
      <Breadcrumbs>
        <Breadcrumbs.Item href="#home" onPress={onPress}>
          Home
        </Breadcrumbs.Item>
        <Breadcrumbs.Item>Current</Breadcrumbs.Item>
      </Breadcrumbs>,
    );

    await user.click(screen.getByRole("link", {name: "Home"}));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("supports item children as a render function that owns the item content", () => {
    render(
      <Breadcrumbs>
        <Breadcrumbs.Item href="#home">
          {() => <span data-testid="custom-item">Home</span>}
        </Breadcrumbs.Item>
        <Breadcrumbs.Item>Current</Breadcrumbs.Item>
      </Breadcrumbs>,
    );

    expect(screen.getByTestId("custom-item")).toHaveTextContent("Home");
    // The render function replaces the whole item, so no Link or separator is added for it.
    expect(screen.queryByRole("link", {name: "Home"})).toBeNull();
  });

  it("passes the breadcrumb render props to item children render functions", () => {
    render(
      <Breadcrumbs>
        <Breadcrumbs.Item href="#home">
          {({isCurrent}) => <span data-testid="home">{isCurrent ? "current" : "not current"}</span>}
        </Breadcrumbs.Item>
        <Breadcrumbs.Item>
          {({isCurrent}) => (
            <span data-testid="laptop">{isCurrent ? "current" : "not current"}</span>
          )}
        </Breadcrumbs.Item>
      </Breadcrumbs>,
    );

    expect(screen.getByTestId("home")).toHaveTextContent(/^not current$/);
    expect(screen.getByTestId("laptop")).toHaveTextContent(/^current$/);
  });

  it("applies item-level render and style to the item only, not to the inner link", () => {
    render(
      <Breadcrumbs>
        <Breadcrumbs.Item
          href="#home"
          render={(props) => <li {...(props as any)} data-custom="bar" />}
          style={{color: "red"}}
        >
          Home
        </Breadcrumbs.Item>
        <Breadcrumbs.Item>Laptop</Breadcrumbs.Item>
      </Breadcrumbs>,
    );

    const link = screen.getByRole("link", {name: "Home"});
    const item = link.closest('[data-slot="breadcrumbs-item"]');

    expect(link.tagName).toBe("A");
    expect(link).not.toHaveAttribute("data-custom");
    expect(link).not.toHaveAttribute("style");
    expect(item).toHaveAttribute("data-custom", "bar");
    expect(item).toHaveStyle({color: "rgb(255, 0, 0)"});
  });
});
