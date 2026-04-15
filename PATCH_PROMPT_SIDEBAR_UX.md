# AI 패치 지시 프롬프트 — 사이드바 UX 개선

> **용도**: 이 문서를 그대로 AI(Codex, Gemini, Claude 등)에게 붙여넣어 패치를 실행하도록 지시할 수 있습니다.  
> **기준 문서**: `PHONESHOP_DESIGN_GUIDE.md` §12 (메뉴 배치 최적화)  
> **검증 근거**: 2026-04-14 구현 검증 결과 — 아래 3가지 항목이 미적용 상태로 확인됨

---

## 패치 목표

PhoneShop 워크스페이스 사이드바의 미완료 UX 개선 항목 3가지를 구현한다.

1. **메뉴 순서 재배치** — 업무 빈도 기준으로 메뉴 순서 변경
2. **퀵 액션 버튼 추가** — 사이드바 상단에 "판매 등록" / "재고 입고" 바로가기 버튼
3. **메뉴 아이템 부제목 제거** — 각 메뉴 설명 텍스트 제거, label+badge 단순 리스트 전환

---

## 프로젝트 기술 스택 (참고)

- **프레임워크**: Next.js 16.2.3 (App Router)
- **UI**: React 19, Tailwind CSS v4
- **언어**: TypeScript
- **패키지 관리**: pnpm
- **검증 명령**: `pnpm check` (lint + typecheck + unit test), `pnpm build`

---

## 수정 대상 파일

### 1. `src/lib/auth/access.ts`
- `workspaceNavigation` 배열의 메뉴 순서를 변경한다.

### 2. `src/components/workspace/workspace-nav.tsx`
- 각 메뉴 아이템에서 description/부제목 텍스트 렌더링을 제거한다.
- 사이드바 상단에 퀵 액션 버튼 2개를 추가한다.

### 3. `src/components/workspace/workspace-shell.tsx` (필요 시)
- 레이아웃 구조 변경이 필요한 경우에만 수정한다.

---

## 패치 1: 메뉴 순서 재배치

**파일**: `src/lib/auth/access.ts`

**현재 순서**:
```
1. 대시보드      (/)
2. 재고 관리     (/inventory)
3. 고객 관리     (/customers)
4. 판매 관리     (/sales)
5. 미수금 관리   (/receivables)
── 관리자 전용 ──
6. 기초정보      (/settings/base)
7. 정책 관리     (/settings/policies)
```

**변경 후 순서** (업무 빈도 기준):
```
── 일상 업무 ──
1. 대시보드      (/)
2. 판매 관리     (/sales)     ← 2번째로 이동
3. 미수금 관리   (/receivables) ← 3번째로 이동
── 정보 관리 ──
4. 고객 관리     (/customers)
5. 재고 관리     (/inventory)
── 설정 (관리자 전용) ──
6. 기초정보      (/settings/base)
7. 정책 관리     (/settings/policies)
```

**구현 방법**:
- `workspaceNavigation` 배열에서 항목 순서만 변경한다.
- 각 항목의 `href`, `label`, `roles`, `badge` 등 다른 속성은 변경하지 않는다.
- 관리자 전용 항목(`roles: ["ADMIN"]`)은 기존 방식대로 분리 렌더링을 유지한다.

---

## 패치 2: 퀵 액션 버튼 추가

**파일**: `src/components/workspace/workspace-nav.tsx`

**목표**: 사이드바 메뉴 목록 위에 자주 사용하는 액션 2개를 바로가기 버튼으로 배치한다.

**UI 구조 (ASCII)**:
```
[PhoneShop Ledger 로고/제목 영역]
─────────────────────────────
[＋ 판매 등록]   ← /sales/new 링크, 파란색 Primary 버튼
[  재고 입고  ]   ← /inventory 링크, Secondary 버튼
─────────────────────────────
● 대시보드
  판매 관리
  미수금 관리
  ...
```

**버튼 스타일**:
- 판매 등록: `bg-blue-600 text-white hover:bg-blue-700` (전체 너비, h-8~h-9)
- 재고 입고: `border border-gray-300 bg-white text-gray-700 hover:bg-gray-50` (전체 너비)
- 두 버튼 사이: `gap-2`
- 버튼 구역과 메뉴 목록 사이: 구분선

**접근 제어**:
- 두 버튼 모두 `ADMIN`과 `STAFF` 모두에게 표시한다.
- `<Link href="/sales/new">` / `<Link href="/inventory">` 형태의 Next.js 링크로 구현한다.

---

## 패치 3: 메뉴 아이템 부제목(description) 제거

**파일**: `src/components/workspace/workspace-nav.tsx`

**현재 문제**:
각 메뉴 아이템에 label 아래 description 텍스트(예: "IMEI 기준 재고 상태 추적", "할인, 리베이트, 수익 계산 관리")가 렌더링되어 사이드바가 불필요하게 넓어지고 있음.

**변경 방향**:
- 메뉴 아이템을 **메뉴명(label) + 뱃지(badge)** 단순 구조로 변경
- description 텍스트는 렌더링하지 않음
- `WorkspaceNavigationItem` 타입의 `description` 필드는 삭제하지 말고, UI에서만 표시하지 않음

**변경 전 (예시)**:
```tsx
<div>
  <span className="font-medium">{item.label}</span>
  <span className="text-xs text-muted">{item.description}</span>  {/* 제거 */}
</div>
```

**변경 후**:
```tsx
<div className="flex items-center gap-2">
  <span className="font-medium">{item.label}</span>
  {item.badge && <span className="badge">{item.badge}</span>}
</div>
```

---

## 검증 방법

패치 완료 후 아래 순서로 검증한다:

```bash
# 1. 타입 오류, 린트, 단위 테스트 일괄 확인
pnpm check

# 2. 프로덕션 빌드 확인
pnpm build
```

**수동 확인 체크리스트**:
- [ ] 메뉴 순서: 대시보드 → 판매 관리 → 미수금 관리 → 고객 관리 → 재고 관리 → (구분선) → 기초정보 → 정책 관리
- [ ] 각 메뉴 아이템에 description 텍스트가 보이지 않음 (label + badge만 표시)
- [ ] 사이드바 상단에 "판매 등록" (파란색) / "재고 입고" (흰색 테두리) 버튼 표시
- [ ] "판매 등록" 버튼 클릭 → `/sales/new` 이동
- [ ] "재고 입고" 버튼 클릭 → `/inventory` 이동
- [ ] 기초정보 / 정책 관리는 관리자 계정에서만 보임 (기존 권한 유지)
- [ ] 활성 메뉴 하이라이트가 순서 변경 후에도 정상 작동

---

## 완료 기준

- `pnpm check` 통과
- `pnpm build` 통과
- 수동 확인 체크리스트 전항목 ✅
- 기존 기능(판매 등록, 재고 관리, 고객 관리, 미수금 수납)에 영향 없음

---

## 주의사항

1. `src/lib/auth/access.ts`의 `workspaceNavigation`이 네비게이션의 **단일 소스**이다. 이 파일만 순서 변경하면 사이드바에 자동 반영된다.
2. `WorkspaceNavigationItem` 타입 인터페이스는 변경하지 않는다.
3. 비즈니스 로직(서버 액션, 계산 로직, DB 쿼리)은 일절 변경하지 않는다.
4. Tailwind CSS v4 문법을 유지한다.
