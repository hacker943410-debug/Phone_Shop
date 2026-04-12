# Project Setup Report

최종 갱신: 2026-04-12

## 1. 현재 환경 요약

- 작업 경로: `C:\Project\PhoneShop`
- 런타임: Node.js + Next.js 16 App Router
- 패키지 매니저: `pnpm`
- 데이터베이스: SQLite (`prisma/dev.db`)
- ORM: Prisma 7
- 인증: credentials + 서명 세션 쿠키
- 테스트: Vitest + Playwright

## 2. 현재 동작하는 기능

- 로그인 / 로그아웃 / 보호 라우트
- 관리자 전용 설정 메뉴 접근 제어
- 통신사 / 요금제 / 부가서비스 / 정책 CRUD
- 재고 등록 / 수정 / 검색 / 상태 관리 / IMEI 중복 방지
- 고객 등록 / 수정 / 검색 / 상세 이력 조회
- 판매 등록 / 취소 / 할인 / 리베이트 / 정책 수익 / 총이익 계산
- 미수금 목록 / 수납 등록 / 수납 취소 / 초과 수납 차단
- 대시보드 실데이터 집계
- CSV 다운로드와 인쇄용 보고서

## 3. 현재 구현 상태 판단

MVP 핵심 흐름은 8단계까지 완료됐다.

현재 바로 사용할 수 있는 흐름:
- 로그인 후 역할별 워크스페이스 진입
- 관리자 기준 기초정보/정책 관리
- 재고 등록과 판매 가능 재고 추적
- 고객 등록/검색/거래 이력 조회
- 판매 등록과 취소
- 미수금 추적과 수납 처리
- 대시보드 기간 집계 조회
- CSV 다운로드 / 인쇄용 보고서 출력

아직 남아 있는 작업:
- 테스트 범위 확대와 예외 처리 정리
- GitHub 원격 저장소 연결과 초기 커밋 정리
- Vercel 연결과 배포 준비

## 4. 최근 검증 결과

이번 턴 기준 최신 통과:
- `pnpm check`
- `pnpm test:e2e`
- `pnpm build`
- 로컬 개발 서버 응답 확인: `http://localhost:3000/login` 상태코드 `200`

추가로 데이터 계층/인증 단계에서 이미 통과한 명령:
- `pnpm db:generate`
- `pnpm db:migrate`
- `pnpm db:seed`

## 5. 남은 우선순위

1. 9단계: 안정화와 출시 준비
2. 테스트 보강과 E2E 시나리오 확장
3. GitHub / Vercel 연결

## 6. 외부 서비스 수동 작업

아직 필요한 수동 작업:
- Git 글로벌 `user.name`, `user.email` 설정 확인
- GitHub 로그인과 원격 저장소 생성/연결
- Vercel 로그인 후 `vercel link`

## 7. 현재 라우트 상태

- `/` 대시보드: 실데이터 카드, 기간 필터, 운영 체크, 담당자 요약, 최근 판매
- `/inventory` 재고 관리
- `/customers` 고객 관리
- `/sales` 판매 관리
- `/receivables` 미수금 관리
- `/settings/base` 기초정보 관리
- `/settings/policies` 정책 관리
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

## 9. 최근 개발 진행 기록

### 2026-04-12 1단계 완료: 데이터 구조와 저장 계층

- SQLite + Prisma 데이터 계층 도입
- 핵심 엔티티 스키마, 마이그레이션, 시드 데이터 구성
- 검증:
- `pnpm db:generate`
- `pnpm db:migrate`
- `pnpm db:seed`
- `pnpm check`
- `pnpm test:e2e`

### 2026-04-12 2단계 완료: 인증과 권한 관리

- credentials 로그인과 세션 쿠키 구현
- 보호 라우트와 관리자 전용 메뉴 제한 연결
- 검증:
- `pnpm db:seed`
- `pnpm check`
- `pnpm test:e2e`

### 2026-04-12 3단계 완료: 기초정보 / 정책 관리

- 통신사, 요금제, 부가서비스, 정책 CRUD 연결
- 판매 화면 참조 데이터와 정책 기간 처리 연결
- 검증:
- `pnpm check`
- `pnpm test:e2e`

### 2026-04-12 4단계 완료: 재고 관리

- 재고 등록/수정/검색/상태 관리 구현
- IMEI 중복 방지와 판매 가능 재고 노출 조건 연결
- 검증:
- `pnpm check`
- `pnpm test:e2e`

### 2026-04-12 5단계 완료: 고객 관리

- 고객 등록/수정/검색/상세 조회 구현
- 연락처 정규화/중복 방지와 판매/미수금 이력 연결
- 검증:
- `pnpm check`
- `pnpm test:e2e`

### 2026-04-12 6단계 완료: 판매 관리와 계산 로직

- 판매 등록/취소 서버 액션 구현
- 할인/리베이트/정책 수익/총이익 계산 로직 추가
- 재고 상태 전환, 고객 현재 통신사 갱신, 미수금 생성 연결
- 검증:
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm test:e2e`
- `pnpm check`

### 2026-04-12 7단계 완료: 미수금 관리와 수납

- 미수금 목록, 기간/상태 필터, 수납 등록/취소 화면 구현
- 잔액/상태 재계산과 초과 수납 차단 로직 추가
- 검증:
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm test:e2e`
- `pnpm check`

### 2026-04-12 8단계 완료: 대시보드 실데이터와 기본 보고

- 홈 대시보드를 판매/수납/미수금 실데이터 집계로 교체
- 기간 프리셋과 직접 지정 필터, 담당자 요약, 날짜별 흐름, 최근 판매 패널 구현
- `/reports/summary` 인쇄용 보고서 페이지 추가
- `/api/reports/summary` CSV 다운로드 경로 추가
- 공통 집계/CSV 포맷 헬퍼와 단위 테스트 추가
- E2E를 실데이터 대시보드와 보고 링크 기준으로 갱신
- 검증:
- `pnpm check`
- `pnpm test:e2e`
- `pnpm build`

### 2026-04-12 9단계 진행 중: 안정화와 출시 준비

- `/api/reports/summary` 라우트 테스트 추가로 인증 리다이렉트와 CSV 헤더/BOM 검증
- 대시보드 날짜 직접 지정과 보고서 다운로드 중심으로 E2E 시나리오 보강
- 로컬 개발 서버 실행 확인 완료
- 확인 URL:
- `http://localhost:3000`
- 검증:
- `pnpm check`
- `pnpm test:e2e`
- `pnpm build`
