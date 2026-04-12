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
  description: string;
  badge?: string;
  roles: AuthRole[];
}

export const workspaceNavigation: WorkspaceNavigationItem[] = [
  {
    href: "/",
    label: "대시보드",
    description: "오늘 판매, 수납, 미수금 흐름",
    roles: ["ADMIN", "STAFF"],
  },
  {
    href: "/inventory",
    label: "재고 관리",
    description: "IMEI 기준 재고 추적",
    badge: "MVP",
    roles: ["ADMIN", "STAFF"],
  },
  {
    href: "/customers",
    label: "고객 관리",
    description: "연락처 기준 고객 이력",
    badge: "MVP",
    roles: ["ADMIN", "STAFF"],
  },
  {
    href: "/sales",
    label: "판매 관리",
    description: "할인, 리베이트, 수익 계산",
    badge: "MVP",
    roles: ["ADMIN", "STAFF"],
  },
  {
    href: "/receivables",
    label: "미수금 관리",
    description: "분할 수납과 잔액 추적",
    badge: "MVP",
    roles: ["ADMIN", "STAFF"],
  },
  {
    href: "/settings/base",
    label: "기초정보",
    description: "통신사, 요금제, 부가서비스",
    roles: ["ADMIN"],
  },
  {
    href: "/settings/policies",
    label: "정책 관리",
    description: "리베이트, 할인, 수익 정책",
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
