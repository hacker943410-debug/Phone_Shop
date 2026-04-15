import { render, screen, within } from "@testing-library/react";
import type { ReactNode } from "react";

import { WorkspaceNav } from "@/components/workspace/workspace-nav";
import {
  getNavigationItemsForRole,
  type AuthenticatedUser,
} from "@/lib/auth/access";

const pathnameState = vi.hoisted(() => ({
  pathname: "/sales",
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: ReactNode;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => pathnameState.pathname,
}));

vi.mock("@/app/actions/auth", () => ({
  logoutAction: vi.fn(),
}));

const currentUser: AuthenticatedUser = {
  id: "user-admin",
  username: "admin",
  displayName: "관리자",
  role: "ADMIN",
  isActive: true,
};

describe("WorkspaceNav", () => {
  it("renders quick actions and sidebar menu in the updated order", () => {
    const { container } = render(
      <WorkspaceNav
        currentUser={currentUser}
        items={getNavigationItemsForRole("ADMIN")}
      />,
    );

    const sidebar = screen.getByRole("navigation", {
      name: "워크스페이스 사이드바",
    });
    const menuList = container.querySelector("ul");

    expect(
      within(sidebar).getByRole("link", { name: "판매 등록" }),
    ).toHaveAttribute("href", "/sales/new");
    expect(
      within(sidebar).getByRole("link", { name: "재고 입고" }),
    ).toHaveAttribute("href", "/inventory");
    expect(menuList).not.toBeNull();
    expect(
      within(menuList as HTMLUListElement)
        .getAllByRole("link")
        .map((link) => link.getAttribute("href")),
    ).toEqual([
      "/",
      "/sales",
      "/receivables",
      "/customers",
      "/inventory",
      "/settings/base",
      "/settings/policies",
    ]);
  });

  it("renders only labels without descriptions or badges", () => {
    render(
      <WorkspaceNav
        currentUser={currentUser}
        items={getNavigationItemsForRole("ADMIN")}
      />,
    );

    expect(screen.getByText("판매 관리")).toBeInTheDocument();
    expect(screen.queryByText("MVP")).not.toBeInTheDocument();
    expect(
      screen.queryByText("오늘 판매, 수납, 미수 흐름 요약"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("IMEI 기준 재고 상태 추적"),
    ).not.toBeInTheDocument();
  });
});
