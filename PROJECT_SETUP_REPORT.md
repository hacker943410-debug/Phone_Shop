# Project Setup Report

최종 갱신: 2026-04-18

## 1. 현재 환경 요약

- 작업 경로: `C:\Project\PhoneShop`
- 런타임: `Node.js` + `Next.js 16 App Router`
- 패키지 매니저: `pnpm`
- 데이터베이스: `SQLite` (`prisma/dev.db`)
- ORM: `Prisma 7`
- 인증: credentials + 서명 세션 쿠키
- 테스트: `Vitest` + `Playwright`
- 로컬 개발 서버: `http://localhost:3000`에서 `node` 프로세스로 실행 중

## 2. 현재 동작하는 기능

- 로그인 / 로그아웃 / 보호 라우트 / 관리자 전용 설정 메뉴 접근 제어
- 기초정보 관리: 통신사 / 요금제 / 부가서비스 / 매장 CRUD
- 정책 관리: 일반 정책 CRUD + 통신사별 개통 가능 규칙 관리
- 재고 관리: IMEI 기준 등록 / 수정 / 상태 관리 / 매장 연결
- 고객 관리: 등록 / 수정 / 검색 / 거래 이력 조회
- 판매 관리: 판매 등록 / 취소 / 할인 / 리베이트 / 정책 수익 / 총이익 계산
- 판매 등록 흐름: `/sales/new` 위저드 + 판매 관리 화면의 런처 모달
- 미수금 관리: 목록 / 수납 등록 / 수납 취소 / 취소 감사 추적
- 대시보드: 기간/매장 필터, KPI, 차트, 운영 체크, 상세 모달, 매장별 매출 실적
- 보고서: 인쇄용 보고서 + CSV 다운로드 + 매장 필터 연동
- 공통 입력 UX: 커스텀 날짜 선택기 / 선택 목록 박스 / 목록 페이지네이션

## 3. 현재 구현 상태 판단

MVP 핵심 흐름은 완료됐고, 현재는 `11단계. 운영 중 추가 요구사항 후속 패치`를 통해 운영 화면 사용성을 빠르게 다듬는 단계다.

현재 바로 사용할 수 있는 흐름:
- 로그인 후 역할별 워크스페이스 진입
- 관리자 기준 기초정보 / 정책 / 매장 / 개통 가능 규칙 관리
- 재고 등록과 매장 단위 재고 추적
- 고객 등록 / 검색 / 거래 이력 조회
- 판매 등록 / 취소 / 상세 확인
- 미수금 추적 / 수납 처리 / 취소 감사 추적
- 대시보드 기간/매장 집계 조회
- CSV 다운로드 / 인쇄용 보고서 출력

아직 남아 있는 작업:
- 커스텀 날짜/선택 입력과 뒤로가기 상호작용의 최종 E2E QA
- Playwright 실행을 막고 있는 Next 16 Turbopack Windows junction 오류 정리
- 배포 준비 문서와 외부 환경 연결 정리

## 4. 최근 검증 결과

2026-04-18 기준 최근 통과:
- `pnpm lint`
- `pnpm typecheck`
- `pnpm vitest run src/lib/sales-url-state.test.ts`
- `pnpm build`

추가 확인:
- `pnpm playwright test tests/e2e/home.spec.ts`는 2026-04-18에 재시도했지만, 테스트 시작 전 Next 16 Turbopack이 `.next/dev/node_modules/better-sqlite3-*` junction을 다시 만들지 못해 실패했다 (`os error 145`).

## 5. 남은 우선순위

1. Next 16 Turbopack Windows junction 오류를 정리하고 `pnpm playwright test tests/e2e/home.spec.ts` 재실행
2. 배포 준비 문서 정리와 외부 환경 연결

## 6. 외부 서비스 수동 작업

아직 필요한 수동 작업:
- Vercel 로그인 후 `vercel link`
- 운영 환경 변수 등록
- 배포용 영속 DB 전략 확정

## 6-1. 현재 운영 합의

- 실제 배포는 사용자 승인 전까지 진행하지 않는다.
- 수정 작업은 메뉴 단위 요청 기준으로 재검토 후 패치한다.
- 메뉴별 패치 뒤에는 영향 범위 기준으로 필요한 검증만 재실행한다.

## 6-2. 현재 배포 준비 상태

- Git remote 연결 확인: `origin` 존재
- `.vercel` 링크 상태: 아직 없음
- 현재 기본 DB 전략: 로컬 SQLite 파일
- 현재 배포 기준 문서: [DEPLOYMENT_READINESS.md](./DEPLOYMENT_READINESS.md)
- 현재 배포 전 점검 명령: `pnpm deploy:check`
- 최신 점검 결과: `SESSION_SECRET` 운영값 미설정, 로컬 SQLite 경고, Vercel 미연결 상태

## 6-3. 분석 보고서 검토 결과

- 분석 입력 문서: [PHONESHOP_ANALYSIS_REPORT.md](./PHONESHOP_ANALYSIS_REPORT.md)
- 실행 기준 문서: [PHONESHOP_IMPROVEMENT_PLAN.md](./PHONESHOP_IMPROVEMENT_PLAN.md)
- 2026-04-18 기준 실제 실행은 `신규 고객 -> 고객 등록 -> 판매 등록` 연계와 매장/기간 drill-down 정리까지 반영됐다.
- 다음 개선 축은 Playwright 재검증을 막는 Turbopack dev-server 문제 해소와 배포 준비 문서 정리다.

## 7. 현재 라우트 상태

- `/` 대시보드: 기간/매장 필터, KPI, 차트, 운영 체크, 상세 모달
- `/inventory` 재고 관리
- `/customers` 고객 관리
- `/sales` 판매 관리
- `/sales/new` 판매 등록 위저드
- `/receivables` 미수금 관리
- `/settings/base` 기초정보 + 매장 관리
- `/settings/policies` 정책 + 개통 가능 규칙 관리
- `/reports/summary` 인쇄용 보고서
- `/api/reports/summary` CSV 다운로드

## 8. 단계별 완료 상태

- [x] 1단계 데이터 구조와 저장 계층
- [x] 2단계 인증과 권한
- [x] 3단계 기초정보와 정책 관리
- [x] 4단계 재고 관리
- [x] 5단계 고객 관리
- [x] 6단계 판매 관리와 계산 로직
- [x] 7단계 미수금과 수납
- [x] 8단계 대시보드와 기본 보고
- [ ] 9단계 안정화와 출시 준비
- [x] 10단계 디자인 리뉴얼 패치
- [ ] 11단계 운영 중 추가 요구사항 후속 패치

## 9. 최근 개발 진행 기록

### 2026-04-12 1~8단계 완료

- Prisma + SQLite 데이터 계층, 인증/권한, 기초정보/정책, 재고, 고객, 판매, 미수금, 대시보드/기본 보고까지 MVP 핵심 흐름 구현
- 검증:
- `pnpm db:generate`
- `pnpm db:migrate`
- `pnpm db:seed`
- `pnpm check`
- `pnpm test:e2e`

### 2026-04-14 운영 후속 패치 1차

- 배포 준비 기준 문서와 점검 스크립트 정리
- 판매 목록 필터/검색/페이지네이션 보강
- 미수금 수납 취소 감사 추적 보강
- 디자인 리뉴얼 이후 사이드바와 전역 메뉴 UI 품질 개선 반영
- 검증:
- `pnpm check`
- `pnpm build`
- `pnpm test:e2e tests/e2e/home.spec.ts`

### 2026-04-15 대시보드 / 데이터 축 확장

- 대시보드를 카드 중심 화면에서 차트/상세 모달 중심 운영 화면으로 재구성
- 커스텀 날짜 선택기와 선택 목록 박스를 도입하고 전역 입력 상호작용을 통일
- `CarrierActivationRule`을 추가해 통신사별 개통 가능 규칙을 정책 관리에 연결
- `Store` 축을 추가해 매장 관리, 매장별 재고/판매/수납 연결, 대시보드/보고서/판매관리 매장 필터를 구현
- 검증:
- `pnpm prisma generate`
- `pnpm prisma migrate dev --name add_carrier_activation_rule`
- `pnpm prisma migrate dev --name add_store_dimension`
- `pnpm prisma db seed`
- `pnpm typecheck`
- `pnpm build`

### 2026-04-15 판매 관리 UX 개편

- 상단 설명/보조 패널을 걷어내고 판매 조회 필터를 한 줄 자동 반영 구조로 압축
- 판매 이력을 compact 테이블 + 상세 모달 + 아이콘 액션 구조로 재구성
- `판매 등록 화면 열기`를 런처 모달로 바꾸고 `기존 고객` / `신규 고객` 선택 흐름을 추가
- 페이지네이션을 `<< < 현재페이지 > >>` 형태로 고정하고 필터/아이콘 상호작용을 안정화
- 날짜 선택기 의존성 루프를 수정해 `Maximum update depth exceeded` 런타임 오류를 제거
- 검증:
- `pnpm typecheck`
- `pnpm build`
- `pnpm playwright test tests/e2e/home.spec.ts`

### 2026-04-18 판매 handoff / drill-down / QA 정리

- 판매 등록 런처의 `신규 고객` 분기를 `/customers?returnTo=/sales/new` 기반 handoff 흐름으로 연결
- 고객 저장 이후 `/sales/new?customerId=...`로 복귀하도록 연결하고 판매 등록 화면에서 고객을 선선택하도록 보강
- 판매 목록 URL 상태에 `storeId`, `dateFrom`, `dateTo`를 포함해 필터, 페이지네이션, 담당자 drill-down, 고객 화면 왕복에서 문맥이 유지되도록 정리
- 보고서 화면에서 현재 기간/매장 기준 판매 목록 drill-down과 일자별 판매 drill-down 링크를 추가
- 커스텀 날짜/선택 컨트롤과 대시보드/판매 필터 바를 리팩터링해 hook-effect lint 경고를 제거
- 검증:
- `pnpm lint`
- `pnpm typecheck`
- `pnpm vitest run src/lib/sales-url-state.test.ts`
- `pnpm build`
- `pnpm playwright test tests/e2e/home.spec.ts`는 Turbopack Windows junction 오류로 웹서버 기동 단계에서 실패
### 2026-04-18 Console Layout And Customer Management Follow-up

- Refined the workspace toward a wider console layout with less explanatory copy and more table-first surfaces.
- Added shared layered popovers for custom select/date controls so expanded lists are no longer hidden behind lower panels.
- Unified input and select trigger heights across the workspace.
- Added dashboard top filters for store and period presets and tightened date picker / modal placement behavior.
- Rebuilt `/customers` with auto-apply filters, tighter filter widths, icon actions, and modal-based customer detail / sales / receivable views.
- Manual verification continued on the webpack dev server while the Turbopack Windows junction issue remains unresolved.
