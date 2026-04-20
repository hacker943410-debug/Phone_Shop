# PhoneShop Documentation Hub

이 문서는 PhoneShop 프로젝트 문서의 진입점이다.  
무엇을 봐야 할지 빠르게 찾을 수 있도록 문서 역할과 우선순위를 정리한다.

## 문서 역할

| 문서 | 역할 | 비고 |
| --- | --- | --- |
| [README.md](./README.md) | 실행 방법과 기본 소개 | 첫 진입점 |
| [PROJECT_DOCS.md](./PROJECT_DOCS.md) | 문서 허브 | 현재 문서 |
| [PHONE_SHOP_REQUIREMENTS_TEMPLATE.md](./PHONE_SHOP_REQUIREMENTS_TEMPLATE.md) | 요구사항 정리 템플릿 | 제품 범위 논의 시 사용 |
| [SCHEDULE_MANAGEMENT_PLAN.md](./SCHEDULE_MANAGEMENT_PLAN.md) | 일정 관리 메뉴 신규 도입 계획 | 일정 관리 기준 문서 |
| [PHONE_SHOP_WORK_PLAN.md](./PHONE_SHOP_WORK_PLAN.md) | 단계별 실행 계획과 진행 메모 | 현재 진행 기준 문서 |
| [PROJECT_SETUP_REPORT.md](./PROJECT_SETUP_REPORT.md) | 현재 환경 상태와 최근 개발 기록 | 현재 상태 기준 문서 |
| [DEPLOYMENT_READINESS.md](./DEPLOYMENT_READINESS.md) | 배포 준비 기준과 점검 절차 | 배포 전 기준 문서 |
| [PHONESHOP_ANALYSIS_REPORT.md](./PHONESHOP_ANALYSIS_REPORT.md) | 외부/보조 분석 입력 문서 | 검토 대상 |
| [PHONESHOP_IMPROVEMENT_PLAN.md](./PHONESHOP_IMPROVEMENT_PLAN.md) | 분석 보고서 검증 후 정리한 실행 기준 | 다음 작업 기준 문서 |
| [PROJECT_SETUP_PLAN.md](./PROJECT_SETUP_PLAN.md) | 초기 계획 히스토리 | 참고용, 현재 상태 문서 아님 |
| [AGENTS.md](./AGENTS.md) | Codex 작업 지침 | 자동 로드 지침 |

## 지금 무엇을 봐야 하나

기능 진행 상태를 확인할 때:
- [PHONE_SHOP_WORK_PLAN.md](./PHONE_SHOP_WORK_PLAN.md)
- `현재 상태`, `11단계. 운영 중 추가 요구사항 후속 패치`, `진행 메모`를 먼저 본다.

현재 코드/환경 상태를 확인할 때:
- [PROJECT_SETUP_REPORT.md](./PROJECT_SETUP_REPORT.md)
- `2. 현재 동작하는 기능`, `4. 최근 검증 결과`, `9. 최근 개발 진행 기록`을 먼저 본다.

배포 준비 상태를 확인할 때:
- [DEPLOYMENT_READINESS.md](./DEPLOYMENT_READINESS.md)
- `현재 아키텍처 기준`, `현재 준비 상태`, `배포 전 점검 명령`을 먼저 본다.

분석 보고서 기반 개선 계획을 확인할 때:
- [PHONESHOP_IMPROVEMENT_PLAN.md](./PHONESHOP_IMPROVEMENT_PLAN.md)
- `검증 요약`, `권장 작업 순서`, `지금 바로 다음 작업으로 권장하는 메뉴`를 먼저 본다.

요구사항을 다시 정리할 때:
- [PHONE_SHOP_REQUIREMENTS_TEMPLATE.md](./PHONE_SHOP_REQUIREMENTS_TEMPLATE.md)

일정 관리 메뉴 도입 계획을 확인할 때:
- [SCHEDULE_MANAGEMENT_PLAN.md](./SCHEDULE_MANAGEMENT_PLAN.md)
- `자동 일정`, `수동 일정`, `공휴일 공개 API 연동 방침`, `구현 순서`를 먼저 본다.

초기 계획의 배경을 확인할 때:
- [PROJECT_SETUP_PLAN.md](./PROJECT_SETUP_PLAN.md)

## 현재 기준 요약

- 2026-04-12 기준 8단계 `대시보드와 기본 보고`까지 완료됐다.
- 2026-04-14 기준 판매 관리 개선, 공통 목록 페이지네이션, 미수금 감사 추적 보강까지 반영됐다.
- 2026-04-15 기준 11단계 후속 패치에서 대시보드 차트형 개편, 개통 가능 규칙, 매장 축 도입, 판매 관리 UI 리뉴얼까지 반영됐다.
- 2026-04-20 기준 일정 관리 메뉴는 `ManualSchedule` 모델, no-key 공휴일 공개 API fallback, 월간 캘린더, 우측 요약 패널, 날짜 클릭 기반 수동 일정 CRUD까지 반영됐다.
- 2026-04-20 기준 공통 / 대시보드 / 판매 / 미수금 모달 접근성 보강과 홈 / 모달 / 일정 관리 E2E 회귀가 외부 webpack dev server 재사용 모드와 `pnpm dev` self-start 경로 모두에서 다시 확인됐다.
- 현재 다음 실행 대상은 배포 준비 문서 보강과 외부 환경 연결 정리다.
- 최신 검증 통과 상태는 `pnpm lint`, `pnpm typecheck`, `pnpm vitest run src/lib/holidays.test.ts src/lib/schedule.test.ts src/app/actions/schedules.test.ts src/components/workspace/workspace-nav.test.tsx`, `pnpm playwright test tests/e2e/home.spec.ts tests/e2e/modal-a11y.spec.ts tests/e2e/schedule.spec.ts`다.

## 운영 원칙

- 새 문서를 만들기 전에 기존 문서에 연결할 수 있는지 먼저 확인한다.
- 현재 상태는 [PROJECT_SETUP_REPORT.md](./PROJECT_SETUP_REPORT.md), 진행 계획은 [PHONE_SHOP_WORK_PLAN.md](./PHONE_SHOP_WORK_PLAN.md)를 기준으로 본다.
- 분석 보고서는 [PHONESHOP_ANALYSIS_REPORT.md](./PHONESHOP_ANALYSIS_REPORT.md)로 보관하되, 실제 실행 기준은 [PHONESHOP_IMPROVEMENT_PLAN.md](./PHONESHOP_IMPROVEMENT_PLAN.md)를 따른다.
- 과거 계획 문서인 [PROJECT_SETUP_PLAN.md](./PROJECT_SETUP_PLAN.md)는 참고용으로만 사용한다.
- 배포 준비가 끝나도 실제 배포는 사용자 승인 전까지 진행하지 않는다.
- 메뉴별 수정은 사용자 요청 단위로 다시 확인하고 패치한다.
