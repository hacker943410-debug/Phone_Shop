export const authRoles = ["ADMIN", "STAFF"] as const;

export type AuthRole = (typeof authRoles)[number];

export interface AuthenticatedUser {
  id: string;
  username: string;
  displayName: string;
  role: AuthRole;
  isActive: boolean;
}

export interface WorkspaceNavigationItem {
  href: string;
  label: string;
  roles: AuthRole[];
}

export const workspaceNavigation: WorkspaceNavigationItem[] = [
  {
    href: "/",
    label: "대시보드",
    roles: ["ADMIN", "STAFF"],
  },
  {
    href: "/sales",
    label: "판매 관리",
    roles: ["ADMIN", "STAFF"],
  },
  {
    href: "/receivables",
    label: "미수금 관리",
    roles: ["ADMIN", "STAFF"],
  },
  {
    href: "/customers",
    label: "고객 관리",
    roles: ["ADMIN", "STAFF"],
  },
  {
    href: "/schedule",
    label: "일정 관리",
    roles: ["ADMIN", "STAFF"],
  },
  {
    href: "/inventory",
    label: "재고 관리",
    roles: ["ADMIN", "STAFF"],
  },
  {
    href: "/settings/base",
    label: "기초정보",
    roles: ["ADMIN"],
  },
  {
    href: "/settings/policies",
    label: "정책 관리",
    roles: ["ADMIN"],
  },
];

const publicPaths = new Set(["/login"]);

export function isPublicPath(pathname: string) {
  return publicPaths.has(pathname);
}

export function isProtectedPath(pathname: string) {
  return !isPublicPath(pathname);
}

export function canAccessPath(pathname: string, role: AuthRole) {
  if (pathname.startsWith("/settings")) {
    return role === "ADMIN";
  }

  return true;
}

export function getNavigationItemsForRole(role: AuthRole) {
  return workspaceNavigation.filter((item) => item.roles.includes(role));
}

export function getRoleLabel(role: AuthRole) {
  return role === "ADMIN" ? "관리자" : "직원";
}

export function normalizeRedirectPath(value?: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/";
  }

  return value;
}

export function resolvePostLoginPath(role: AuthRole, value?: string | null) {
  const pathname = normalizeRedirectPath(value);
  return canAccessPath(pathname, role) ? pathname : "/";
}
