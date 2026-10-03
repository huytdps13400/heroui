import {render} from "@heroui/testing/browser";
import {page} from "vitest/browser";

import {Table} from "@/components/table";

// The resizer's position on the column boundary lives in CSS; Vite Tailwind compiles `@/styles.css`.
import "@/styles.css";

const rows = [
  {id: "1", name: "Kate", role: "CEO"},
  {id: "2", name: "John", role: "CTO"},
];

const renderResizableTable = (dir: "ltr" | "rtl") =>
  render(
    <div dir={dir}>
      <Table>
        <Table.ResizableContainer>
          <Table.Content aria-label="Team" className="min-w-[400px]">
            <Table.Header>
              <Table.Column isRowHeader defaultWidth="1fr" id="name">
                Name
                <Table.ColumnResizer />
              </Table.Column>
              <Table.Column defaultWidth="1fr" id="role">
                Role
              </Table.Column>
            </Table.Header>
            <Table.Body items={rows}>
              {(row) => (
                <Table.Row>
                  <Table.Cell>{row.name}</Table.Cell>
                  <Table.Cell>{row.role}</Table.Cell>
                </Table.Row>
              )}
            </Table.Body>
          </Table.Content>
        </Table.ResizableContainer>
      </Table>
    </div>,
  );

// Sub-pixel rounding is expected; anything beyond that means the handle is off the boundary.
const TOLERANCE = 1;

describe("Table (browser)", () => {
  describe("column resizer", () => {
    for (const dir of ["ltr", "rtl"] as const) {
      it(`renders the resizer centered on the column's inline-end edge when dir="${dir}"`, async () => {
        await renderResizableTable(dir);

        await expect.element(page.getByRole("grid", {name: "Team"})).toBeInTheDocument();

        const column = page.getByRole("columnheader", {name: "Name"}).element();
        const resizer = column.querySelector<HTMLElement>('[data-slot="table-column-resizer"]')!;

        const columnRect = column.getBoundingClientRect();
        const resizerRect = resizer.getBoundingClientRect();
        const inlineEnd = dir === "rtl" ? columnRect.left : columnRect.right;
        const resizerCenter = resizerRect.left + resizerRect.width / 2;

        expect(Math.abs(resizerCenter - inlineEnd)).toBeLessThanOrEqual(TOLERANCE);
      });
    }
  });
});
