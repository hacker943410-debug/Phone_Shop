# PhoneShop Work Plan

최종 갱신: 2026-04-20

## 현재 상태

- 현재 작업 기준: `11단계. 운영 중 추가 요구사항 후속 패치`
- 현재 활성 단계: `일정 관리 CRUD / 검증 안정화 마감`
- 현재 상태 요약: `ManualSchedule` 모델 / migration / seed, no-key 공휴일 공개 API 클라이언트 + 연도 캐시 fallback, 일정 관리 page-data와 월간 캘린더 / 우측 요약 패널, 날짜 클릭 기반 수동 일정 CRUD, 일정 관리 unit/E2E 검증까지 반영했다. 공개 API 실데이터와 `pnpm dev` self-start E2E도 현재 상태에서 재확인됐고, 다음 구현은 배포 준비 정리다.

| Workstream | 상태 | 메모 |
| --- | --- | --- |
| A | 완료 | 전역 토큰, 공통 프리미티브, 커스텀 날짜/선택 입력 정리 |
| B | 완료 | 셸/네비게이션/헤더 밀도/사이드바 UX 정리 |
| C | 완료 | 대시보드 차트형 개편, 상세 모달, 매장 필터 도입 |
| D | 완료 | 매장 축 / 개통 가능 규칙 / 기초정보·정책 연동 |
| E | 대부분 완료 | 판매 관리 compact UI, 런처 모달, 자동 필터, 상세 모달, 페이지네이션 |
| F | 완료 | 신규 고객 -> 판매 등록 후속 흐름 및 홈 시나리오 재검증 완료 |
| G | 기초 계층 완료 | 일정 관리 모델 / 집계 / 캘린더 / 요약 패널 / 회귀 검증 완료 |

## 기준 문서

- 문서 허브: [PROJECT_DOCS.md](./PROJECT_DOCS.md)
- 현재 환경/구성 기준: [PROJECT_SETUP_REPORT.md](./PROJECT_SETUP_REPORT.md)
- 디자인 기준: [PHONESHOP_DESIGN_GUIDE.md](./PHONESHOP_DESIGN_GUIDE.md)
- 개선 입력: [PHONESHOP_IMPROVEMENT_PLAN.md](./PHONESHOP_IMPROVEMENT_PLAN.md)
- 과거 계획 참고: [PROJECT_SETUP_PLAN.md](./PROJECT_SETUP_PLAN.md)

## 목표

- 휴대폰 매장 운영에 필요한 재고, 고객, 판매, 미수금, 정책, 매장 운영 흐름을 MVP 범위로 완성한다.
- 관리자와 직원이 같은 워크스페이스를 사용하되, 권한과 메뉴 밀도는 운영 목적에 맞게 분리한다.
- 대시보드와 보고서에서 기간/매장 기준 지표를 빠르게 확인할 수 있게 한다.
- 디자인 가이드 기준으로 워크스페이스 UI를 `Warm Professional` 방향으로 유지하면서 실사용 밀도를 높인다.

## 전체 진행 요약

- [x] 로그인, 권한 분리, 보호 라우트
- [x] 기초정보/정책 CRUD
- [x] 재고 관리
- [x] 고객 관리
- [x] 판매 등록/취소와 계산 로직
- [x] 미수금 목록/수납 등록/수납 취소
- [x] 대시보드 데이터, CSV 다운로드, 인쇄용 보고서
- [x] 디자인 리뉴얼 패치 1차 완료
- [ ] 운영 중 추가 요구사항 후속 패치

## 단계별 계획

### 1단계. 데이터 구조와 기본 설정

목표:
- SQLite + Prisma 기반 데이터 구조를 안정화한다.

완료 항목:
- [x] Prisma 도입과 SQLite 연결
- [x] 사용자, 고객, 재고, 판매, 미수금, 수납, 정책 스키마 설계
- [x] 마이그레이션 생성
- [x] 시드 데이터 구성

### 2단계. 인증과 권한

목표:
- 관리자/직원 로그인과 메뉴 접근 제어를 붙인다.

완료 항목:
- [x] Credentials 로그인
- [x] 세션 쿠키 기반 인증
- [x] 보호 라우트 적용
- [x] 관리자 전용 메뉴 제한

### 3단계. 기초정보와 정책 관리

목표:
- 통신사, 요금제, 부가서비스, 정책, 매장/운영 규칙 관리 흐름을 안정화한다.

완료 항목:
- [x] 기초정보 CRUD
- [x] 정책 CRUD
- [x] 활성 상태/기간 기준 조회
- [x] 판매 화면 참조 데이터 연결
- [x] 매장 관리 추가
- [x] 통신사별 개통 가능 규칙 관리 추가

### 4단계. 재고 관리

목표:
- IMEI 기준 재고 등록, 검색, 상태 관리를 지원하고 매장 축을 연결한다.

완료 항목:
- [x] 재고 등록/수정
- [x] IMEI 중복 방지
- [x] 상태/노출 필터
- [x] 판매 가능 재고만 판매 화면에 노출
- [x] 매장 기준 재고 연결

### 5단계. 고객 관리

목표:
- 고객 등록, 검색, 상세 이력 조회 흐름을 완성한다.

완료 항목:
- [x] 고객 등록/수정
- [x] 연락처 중복 방지
- [x] 고객 검색과 필터
- [x] 판매/미수금 이력 연결

### 6단계. 판매 관리와 계산 로직

목표:
- 판매 등록, 정책 자동 매칭, 수익 계산, 취소 흐름을 구현하고 운영 UI를 정리한다.

완료 항목:
- [x] 판매 등록 서버 액션
- [x] 할인/리베이트/정책 수익 계산
- [x] 재고 상태 전환과 고객 현재 통신사 갱신
- [x] 판매 취소와 관련 데이터 복구
- [x] 매장 기준 판매/수납 연결
- [x] 판매 조회 compact UI와 상세 모달 정리

### 7단계. 미수금과 수납

목표:
- 미수금 목록과 수납 처리 흐름을 구현한다.

완료 항목:
- [x] 데이터 기반 미수금 목록
- [x] 고객/기간/상태 필터
- [x] 수납 등록
- [x] 수납 취소
- [x] 초과 수납 차단과 잔액 재계산
- [x] 수납 취소 감사 추적

### 8단계. 대시보드와 기본 보고

목표:
- 운영 지표와 기본 보고 기능을 제공한다.

완료 항목:
- [x] 대시보드 데이터 연결
- [x] 기간 프리셋과 직접 날짜 필터
- [x] 매장 필터 기준 집계
- [x] 개통 가능 고객 계산
- [x] 매장별 매출 실적 / 담당자 요약 / 기간 흐름 / 통신사별 개통 추이 차트
- [x] CSV 다운로드 1차 구현
- [x] 인쇄용 보고서 페이지 1차 구현

### 9단계. 테스트와 출고 준비

목표:
- MVP를 실제 사용 가능한 상태로 다듬는다.

현재 상태:
- [x] 핵심 계산/목록/권한 흐름 기본 검증
- [ ] 운영 시나리오 기준 추가 테스트 보강
- [ ] 배포 운영 문서 확장

### 10단계. 디자인 리뉴얼 패치

목표:
- [PHONESHOP_DESIGN_GUIDE.md](./PHONESHOP_DESIGN_GUIDE.md) 기준으로 워크스페이스 UI를 재정비한다.
- 카드 나열 중심 화면을 테이블/상세 패널 중심 구조로 바꾼다.
- 판매 등록 흐름을 별도 작업 화면과 단계형 위저드로 분리한다.
- 반응형 구조와 공통 상호작용 패턴을 정리한다.

완료 범위:
- [x] 전역 토큰, 배경, 테두리, 타이포, 폼 스타일 정리
- [x] `workspace-shell`, `workspace-nav`, `workspace-primitives`, `admin-form-controls` 리팩터
- [x] 대시보드 / 재고 / 고객 / 판매 / 미수금 화면 구조 정리
- [x] 목록-상세 구조 전환
- [x] 확인 버튼, notice, 입력 안전장치 공통화
- [x] `/sales/new` 3단계 위저드 도입
- [x] 판매 관리, 판매 등록, 판매 지원 패널 카피 정리
- [x] 최종 검증 완료

검증 결과:
- [x] `pnpm check`
- [x] `pnpm build`

### 11단계. 운영 중 추가 요구사항 후속 패치

목표:
- 운영 중 확인된 대시보드 / 판매관리 / 공통 입력 UX 이슈를 빠르게 보정한다.
- 매장 기준 데이터 축과 운영용 차트/상세 흐름을 정리한다.
- 화면 상단 공간, 버튼 상호작용, 카드 밀도, 필터 상호작용을 실사용 중심으로 재구성한다.

오늘 반영 항목:
- [x] 사이드바 메뉴 정리, `판매 등록` CTA 대비 개선, MVP 마크 제거
- [x] 상단 설명 문구 제거와 헤더/현황 카드 밀도 최적화
- [x] 커스텀 날짜 선택기 / 선택 목록 박스 도입 및 전역 hover / pointer 정리
- [x] 대시보드 차트형 개편, 상세 모달, 범례 토글, 운영 체크 재구성
- [x] `CarrierActivationRule` 도입과 정책 관리 UI 연결
- [x] `Store` 축 도입과 기초정보 / 재고 / 판매 / 수납 / 대시보드 / 보고서 연결
- [x] 대시보드 매장 필터 및 매장별 매출 실적 집계 구현
- [x] 판매 관리 compact 필터/테이블/상세 모달/아이콘 액션/페이지네이션 적용
- [x] 판매 등록 런처 모달 도입 (`기존 고객` / `신규 고객`)
- [x] 날짜 선택기 의존성 루프와 판매 관리 뒤로가기/필터 상호작용 문제 수정
- [x] 일정 관리 메뉴 라우트 / 스캐폴드 화면 추가
- [x] `ManualSchedule` 모델 / migration / seed 추가
- [x] 공휴일 API 클라이언트와 cache fallback 추가
- [x] 일정 관리 page-data / 월간 캘린더 / 우측 요약 패널 구현
- [x] 날짜 클릭 기반 수동 일정 생성 / 수정 / 완료 / 삭제 server action 추가
- [x] 일정 관리 CRUD 모달과 캘린더 상호작용 연결
- [x] 일정 관리 action / E2E 검증 추가
- [x] 외부 dev server 재사용 시 Playwright serial verification 안정화
- [x] 공통 / 대시보드 / 판매 / 미수금 모달 portal + focus trap + body scroll lock 정리
- [x] 홈 / 모달 접근성 Playwright 시나리오를 최신 UI 기준으로 갱신
- [x] stale Prisma client를 해소하도록 webpack dev server 재기동 후 `/schedule` 회귀 확인
- [x] `pnpm prisma migrate dev --name add_manual_schedule`
- [x] `pnpm prisma generate`
- [x] `pnpm prisma db seed`
- [x] `pnpm lint`
- [x] `pnpm typecheck`
- [x] `pnpm build`
- [x] `pnpm vitest run src/lib/schedule.test.ts`
- [x] `pnpm vitest run src/app/actions/schedules.test.ts`
- [x] `pnpm vitest run src/lib/activation-rules.test.ts src/lib/dashboard-reporting.test.ts src/components/dashboard/dashboard-overview.test.tsx src/components/workspace/workspace-nav.test.tsx src/app/api/reports/summary/route.test.ts src/app/actions/receivables.test.ts`
- [x] `pnpm playwright test tests/e2e/home.spec.ts`
- [x] `PLAYWRIGHT_BASE_URL=http://localhost:3000 pnpm playwright test tests/e2e/home.spec.ts tests/e2e/modal-a11y.spec.ts`
- [x] `PLAYWRIGHT_BASE_URL=http://localhost:3101 pnpm playwright test tests/e2e/home.spec.ts tests/e2e/modal-a11y.spec.ts tests/e2e/schedule.spec.ts`

다음 세션 이어갈 항목:
- [ ] 배포 준비 문서와 외부 환경 연결 정리 재개

### 11-A. 일정 관리 메뉴 신규 도입 준비

목표:
- 유지기간 만료 고객을 월간 캘린더 기준으로 관리할 수 있게 한다.
- 판매, 수납 완료, 유지기간 만료, 공휴일, 수동 일정을 한 화면에서 합쳐 본다.

기준 문서:
- [SCHEDULE_MANAGEMENT_PLAN.md](./SCHEDULE_MANAGEMENT_PLAN.md)

확정 범위:
- 최상위 운영 메뉴 `/schedule`
- `ADMIN`, `STAFF` 공용 접근
- 상단 `3일`, `7일` 유지만료 요약 카드
- 월간 캘린더 + 우측 요약 패널
- 날짜 클릭 신규 일정 모달
- no-key 공휴일 공개 API 연동

비고:
- 자동 일정은 저장하지 않고 계산형으로 유지
- 수동 일정만 별도 모델로 저장

## 리뉴얼 구현 요약

### 공통 스타일 / 컨트롤

- 대상 파일:
  - `src/app/globals.css`
  - `src/app/layout.tsx`
  - `src/components/workspace/workspace-shell.tsx`
  - `src/components/workspace/workspace-nav.tsx`
  - `src/components/workspace/workspace-primitives.tsx`
  - `src/components/workspace/admin-form-controls.tsx`
  - `src/components/workspace/form-client-controls.tsx`
  - `src/components/workspace/ui-classnames.ts`

- 반영 내용:
  - 웜 화이트 + 블루 포인트 톤 유지
  - 과도한 글래스/대형 라운딩 스타일 축소
  - 커스텀 날짜 선택기 / 선택 목록 박스 / hover / focus / pointer 패턴 공통화

### 대시보드 / 보고서

- 대상 파일:
  - `src/components/dashboard/dashboard-overview.tsx`
  - `src/components/dashboard/dashboard-visuals.tsx`
  - `src/components/dashboard/dashboard-filter-bar.tsx`
  - `src/components/dashboard/dashboard-detail-dialog.tsx`
  - `src/lib/dashboard-reporting.ts`
  - `src/lib/activation-rules.ts`
  - `src/app/reports/summary/page.tsx`
  - `src/app/api/reports/summary/route.ts`

- 반영 내용:
  - KPI + 차트 + 상세 모달 중심 구조 재편
  - 매장 필터와 매장별 매출 실적 차트 추가
  - 개통 가능 고객 / 통신사별 개통 추이 / 기간 흐름 / 담당자 요약 정리

### 판매 관리

- 대상 파일:
  - `src/app/(workspace)/sales/page.tsx`
  - `src/app/(workspace)/sales/new/page.tsx`
  - `src/app/(workspace)/sales/sales-page-data.ts`
  - `src/components/workspace/sales-overview.tsx`
  - `src/components/workspace/sales-entry-form.tsx`
  - `src/components/workspace/sales-filter-bar.tsx`
  - `src/components/workspace/sales-history-table.tsx`
  - `src/components/workspace/sales-launcher.tsx`
  - `src/components/workspace/sales-pagination-controls.tsx`

- 반영 내용:
  - 판매 조회 필터 자동 반영화
  - 판매 이력 compact 테이블 + 상세 모달 + 아이콘 액션 구조 전환
  - `판매 등록 화면 열기`를 런처 모달로 변경
  - 페이지네이션/뒤로가기/상세 보기 상호작용 안정화

## 테스트와 검증

최근 확인 결과:
- `pnpm prisma generate` 통과
- `pnpm prisma db seed` 통과
- `pnpm lint` 통과
- `pnpm typecheck` 통과
- `pnpm build` 통과
- `pnpm vitest run src/lib/holidays.test.ts src/lib/schedule.test.ts src/app/actions/schedules.test.ts src/components/workspace/workspace-nav.test.tsx` 통과
- `pnpm playwright test tests/e2e/home.spec.ts tests/e2e/modal-a11y.spec.ts tests/e2e/schedule.spec.ts` 통과
- `PLAYWRIGHT_BASE_URL=http://localhost:3000 pnpm playwright test tests/e2e/home.spec.ts tests/e2e/modal-a11y.spec.ts` 통과
- `PLAYWRIGHT_BASE_URL=http://localhost:3101 pnpm playwright test tests/e2e/home.spec.ts tests/e2e/modal-a11y.spec.ts tests/e2e/schedule.spec.ts` 통과

## 진행 메모

- 2026-04-14 Phase A-F: 디자인 리뉴얼 패치 1차 완료
- 2026-04-14 후속 패치: 사이드바 UX / 전역 메뉴 UI 품질 개선
- 2026-04-15 Workstream A: 커스텀 날짜 선택기 / 선택 목록 박스 도입과 전역 컨트롤 정리
- 2026-04-15 Workstream B: 대시보드 차트형 개편, 상세 모달, 범례 토글, 운영 체크 재구성
- 2026-04-15 Workstream C: `CarrierActivationRule` / `Store` 축 도입과 기초정보·정책·대시보드·보고서 연동
- 2026-04-15 Workstream D: 판매 관리 compact UI, 런처 모달, 자동 필터, 페이지네이션 정리
- 2026-04-15 Workstream E: 날짜 선택기 의존성 루프와 판매 관리 상호작용 회귀 수정
- 2026-04-20 Workstream F: 일정 관리 메뉴 스캐폴드 추가와 일정 도메인 착수
- 2026-04-20 Workstream G: 모달 접근성 보강, 홈 / 모달 E2E 최신화 및 회귀 통과

## 다음 작업 기준

- 현재 문서는 2026-04-20 기준 일정 관리 CRUD, no-key 공휴일 검증, direct self-start E2E 재확인까지 반영한다.
- 다음 작업은 배포 준비 문서 정리와 외부 환경 연결부터 시작한다.
- 중복 계획 문서를 늘리기보다 이 문서와 [PROJECT_SETUP_REPORT.md](./PROJECT_SETUP_REPORT.md), [.planning/.continue-here.md](./.planning/.continue-here.md)를 우선 갱신한다.
## 2026-04-18 Current Follow-up Snapshot

- Workspace screens were pushed further toward a console-style layout with wider data surfaces and less explanatory copy.
- Shared select/date popovers were moved onto independent layers and control heights were normalized.
- Dashboard filters were expanded and customer management was rebuilt around auto-apply filters plus modal-driven detail flows.
- The next recommended step is deployment-readiness cleanup and external environment setup.

## 2026-04-20 Follow-up Verification

- Confirmed `/schedule?month=2026-05` renders live holidays from the no-key public source, including 노동절, 어린이날, 부처님 오신 날, and the substitute holiday.
- Added focused holiday source tests and re-ran the key unit suite with `src/lib/holidays.test.ts`.
- Re-ran `pnpm playwright test tests/e2e/home.spec.ts tests/e2e/modal-a11y.spec.ts tests/e2e/schedule.spec.ts` without `PLAYWRIGHT_BASE_URL`; the direct `pnpm dev` self-start path passed on the current machine state.

## 2026-04-20 Current Follow-up Snapshot

- Added `ManualSchedule` schema/migration/seed data plus the holiday API client and monthly cache fallback.
- Implemented schedule month aggregation, the calendar board, and the right-side summary panel for `/schedule`.
- Regenerated Prisma client, restarted the webpack dev server, and refreshed `tests/e2e/home.spec.ts` expectations for the current report and schedule UI.
- Verified `home` and `modal-a11y` Playwright scenarios again against the refreshed webpack dev server at `http://localhost:3000`.
