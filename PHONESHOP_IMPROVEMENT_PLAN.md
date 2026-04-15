# PhoneShop Improvement Plan

최종 갱신: 2026-04-14

이 문서는 [PHONESHOP_ANALYSIS_REPORT.md](./PHONESHOP_ANALYSIS_REPORT.md)를 실제 코드 기준으로 다시 검토해, 바로 실행 가능한 개선 작업으로 정리한 기준 문서다.

분석 보고서는 입력 문서로 유지하고, 실제 다음 작업의 우선순위와 범위 판단은 이 문서를 기준으로 잡는다.

## 1. 운영 원칙

- 실제 배포는 사용자 승인 전까지 진행하지 않는다.
- 수정 작업은 메뉴별 요청 단위로 나눠 패치한다.
- 한 번에 하나의 작업 흐름만 닫는다.
- 각 패치 뒤에는 영향 범위에 맞는 테스트만 다시 실행한다.
- 분석 보고서의 모든 제안을 즉시 구현하지 않고, 현재 코드와 충돌하는 내용은 보정한다.

## 2. 검증 요약

| 항목 | 분석 보고서 요지 | 코드 기준 판단 | 작업 반영 |
| --- | --- | --- | --- |
| 판매 목록 검색/필터 부재 | 가장 시급한 UX 문제 | 확인됨. 판매 페이지는 공지 파라미터만 읽고 최근 12건만 조회한다 | 1순위 |
| 목록 페이지 페이지네이션 부재 | 재고/고객/판매/미수금 전체 조회 문제 | 확인됨. 네 메뉴 모두 서버 페이지네이션이 없다 | 2순위 |
| 판매 지원금 입력 UI 누락 | `subsidyAmount` 활용 불가 | 확인됨. 스키마/계산 로직은 있으나 폼 입력과 저장 연결이 없다 | 1순위 |
| 수납 취소 사유 누락 | 감사 추적 약함 | 확인됨. 수납 등록 메모는 있으나 취소 시 사유 입력 없이 상태만 바뀐다 | 3순위 |
| 모바일 네비게이션 대응 약함 | 작은 화면에서 사이드바가 상단에 쌓임 | 확인됨. 현재는 작은 화면에서 스택 레이아웃이다 | 4순위 |
| 요금제 상세 필드 누락 | 요구사항 대비 `RatePlan` 상세 항목 부족 | 확인됨. 현재 `monthlyFee`, `description` 중심이다 | 5순위 |
| 비밀번호 해시 방식 미확인 | 보안 점검 필요 | 보정 필요. 현재 `scrypt` 기반 해시를 사용한다 | 문서 보정만 |
| GitHub 원격 저장소 미연결 | 배포 준비 누락 | 보정 필요. 현재 `origin` remote는 이미 연결돼 있다 | 문서 보정만 |
| SQLite라 배포 불가 | 전체 배포 불가로 표현 | 보정 필요. Vercel은 부적합하지만 Node/Docker는 영속 스토리지 전제로 가능하다 | 배포 문서 기준 유지 |

## 3. 권장 작업 순서

### Workstream 1. 판매 관리 개선

목표:
- 실사용 기준으로 가장 큰 불편 요소를 먼저 줄인다.

상태:
- 2026-04-14 1차 구현 완료

범위:
- 판매 목록 검색/필터 추가
- 판매 목록 페이지네이션 추가
- 판매 등록 폼에 `subsidyAmount` 입력 연결

주요 파일:
- `src/app/(workspace)/sales/page.tsx`
- `src/components/workspace/sales-overview.tsx`
- `src/components/workspace/sales-entry-form.tsx`
- `src/app/actions/sales.ts`
- `src/components/workspace/sales-types.ts`

검증:
- `pnpm test`
- 판매 관련 E2E 또는 신규 E2E
- 완료 범위: 판매 검색/필터, 판매 페이지네이션, `subsidyAmount` 입력/저장/표시

### Workstream 2. 공통 목록 페이지네이션

목표:
- 데이터가 늘어나도 목록 화면이 버티도록 공통 규칙을 만든다.

상태:
- 2026-04-14 구현 완료

범위:
- 재고 / 고객 / 판매 / 미수금 목록의 페이지네이션 규칙 정의
- URL 쿼리 기반 `page`, `pageSize` 도입
- 서버 쿼리 `skip` / `take` 적용

주요 파일:
- `src/app/(workspace)/inventory/page.tsx`
- `src/app/(workspace)/customers/page.tsx`
- `src/app/(workspace)/sales/page.tsx`
- `src/app/(workspace)/receivables/page.tsx`
- 각 overview 컴포넌트

검증:
- `pnpm test`
- 목록 쿼리 중심 수동 확인
- 완료 범위: 재고 / 고객 / 미수금 서버 페이지네이션, 공통 페이지네이션 UI, 페이지 이동 E2E

### Workstream 3. 미수금 감사 추적 보강

목표:
- 수납 취소와 조정 흐름의 설명 가능성을 높인다.

상태:
- 2026-04-14 구현 완료

범위:
- 수납 취소 사유 입력
- 취소 사유 저장 방식 확정
- 필요 시 관리자 전용 조정 흐름 설계

주요 파일:
- `src/app/actions/receivables.ts`
- `src/components/workspace/receivables-overview.tsx`
- `src/components/workspace/receivables-types.ts`
- `prisma/schema.prisma` 검토

검증:
- `pnpm test`
- 미수금 흐름 E2E 또는 수동 시나리오
- 완료 범위: 취소 사유 필수 입력, 취소 담당자/시각/사유 저장, 감사 정보 UI, 서버 액션 단위 테스트

### Workstream 4. 반응형 네비게이션과 정보 밀도 개선

목표:
- 태블릿/모바일에서 현재 레이아웃의 길이 문제를 줄인다.

범위:
- 모바일 네비게이션 패턴 확정
- 데이터 목록의 밀도 개선
- 빈 상태와 오류 안내 문구 통일

주요 파일:
- `src/components/workspace/workspace-shell.tsx`
- `src/components/workspace/workspace-nav.tsx`
- overview 계열 컴포넌트

### Workstream 5. 요구사항과 스키마 보강

목표:
- 현재 요구사항 문서가 빠뜨린 운영 규칙을 채운다.

범위:
- 페이지네이션 기준
- 빈 상태 / 오류 안내 문구 기준
- CSV 칼럼 기준
- 인쇄 레이아웃 기준
- `RatePlan` 상세 필드 필요 여부 재확정

관련 문서:
- `PHONE_SHOP_REQUIREMENTS_TEMPLATE.md`
- `PHONESHOP_ANALYSIS_REPORT.md`
- 본 문서

### Workstream 6. 배포 아키텍처 결정

목표:
- 실제 배포 직전에 흔들리지 않도록 대상 환경을 먼저 고정한다.

범위:
- Node.js 서버 또는 Docker 기준 운영 경로 확정
- Vercel 목표 여부는 DB 전략 변경 가능성까지 포함해 별도 결정
- `SESSION_SECRET` 운영값 준비

관련 문서:
- `DEPLOYMENT_READINESS.md`

## 4. 지금 바로 다음 작업으로 권장하는 메뉴

다음 메뉴 패치 요청은 `반응형 UI`를 먼저 잡는 것이 가장 효율적이다.

이유:
- 미수금 감사 추적 보강까지 끝나서, 이제 기능 리스크보다 화면 사용성 개선이 더 큰 잔여 과제다.
- 현재 레이아웃은 모바일과 태블릿에서 네비게이션 길이와 카드 정보 밀도가 먼저 부딪히는 상태다.
- 반응형 UI를 정리한 뒤 페이지네이션/오류/CSV 기준 문서를 보강하면 문서와 화면이 같이 안정된다.
- 배포 준비 문서는 이미 별도로 분리돼 있어 다음 메뉴 패치와 충돌하지 않는다.

## 5. 보정된 해석 메모

- 고객/재고/미수금은 이미 검색/필터가 있다. 현재 부족한 핵심은 페이지네이션이다.
- 고객 숨김 처리는 스키마에는 있으나 고객 UI에는 아직 노출되지 않는다.
- 재고 숨김 처리는 이미 UI에 있다.
- 비밀번호 해시 방식은 미확인이 아니라 `scrypt` 기반 구현 상태다.
- SQLite 사용은 전체 배포 불가가 아니라, 현재 Vercel 방향과 충돌하는 상태로 보는 것이 정확하다.

## 6. 다음 작업 요청용 체크리스트

사용자가 메뉴별 패치를 요청할 때 아래 형식으로 바로 이어서 진행한다.

1. 대상 메뉴 확정
2. 이번 패치 범위 1개로 제한
3. 영향 파일 확인
4. 패치
5. 관련 테스트만 실행
6. 문서 기준 업데이트 여부 확인
