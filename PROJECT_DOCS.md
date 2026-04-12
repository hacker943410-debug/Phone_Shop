# PhoneShop Documentation Hub

이 문서는 PhoneShop 프로젝트 문서의 진입점이다.  
무엇을 봐야 할지 빠르게 찾을 수 있도록 문서 역할과 우선순위를 정리한다.

## 문서 역할

| 문서 | 역할 | 비고 |
| --- | --- | --- |
| [README.md](./README.md) | 실행 방법과 기본 소개 | 첫 진입점 |
| [PROJECT_DOCS.md](./PROJECT_DOCS.md) | 문서 허브 | 현재 문서 |
| [PHONE_SHOP_REQUIREMENTS_TEMPLATE.md](./PHONE_SHOP_REQUIREMENTS_TEMPLATE.md) | 요구사항 정리 템플릿 | 제품 범위 논의 시 사용 |
| [PHONE_SHOP_WORK_PLAN.md](./PHONE_SHOP_WORK_PLAN.md) | 단계별 실행 계획과 진행 메모 | 현재 진행 기준 문서 |
| [PROJECT_SETUP_REPORT.md](./PROJECT_SETUP_REPORT.md) | 현재 환경 상태와 최근 개발 기록 | 현재 상태 기준 문서 |
| [PROJECT_SETUP_PLAN.md](./PROJECT_SETUP_PLAN.md) | 초기 계획 히스토리 | 참고용, 현재 상태 문서 아님 |
| [AGENTS.md](./AGENTS.md) | Codex 작업 지침 | 자동 로드 지침 |

## 지금 무엇을 봐야 하나

기능 진행 상태를 확인할 때:
- [PHONE_SHOP_WORK_PLAN.md](./PHONE_SHOP_WORK_PLAN.md)
- `4. 다음 실행 대상`과 `5. 진행 메모`를 먼저 본다.

현재 코드/환경 상태를 확인할 때:
- [PROJECT_SETUP_REPORT.md](./PROJECT_SETUP_REPORT.md)
- `2. 현재 동작하는 기능`, `4. 최근 검증 결과`, `9. 최근 개발 진행 기록`을 먼저 본다.

요구사항을 다시 정리할 때:
- [PHONE_SHOP_REQUIREMENTS_TEMPLATE.md](./PHONE_SHOP_REQUIREMENTS_TEMPLATE.md)

초기 계획의 배경을 확인할 때:
- [PROJECT_SETUP_PLAN.md](./PROJECT_SETUP_PLAN.md)

## 현재 기준 요약

- 2026-04-12 기준 8단계 `대시보드와 기본 보고`까지 완료됐다.
- 다음 실행 대상은 9단계 `안정화와 출시 준비`다.
- 최신 검증 통과 상태는 `pnpm check`, `pnpm test:e2e`, `pnpm build`다.

## 운영 원칙

- 새 문서를 만들기 전에 기존 문서에 연결할 수 있는지 먼저 확인한다.
- 현재 상태는 [PROJECT_SETUP_REPORT.md](./PROJECT_SETUP_REPORT.md), 진행 계획은 [PHONE_SHOP_WORK_PLAN.md](./PHONE_SHOP_WORK_PLAN.md)를 기준으로 본다.
- 과거 계획 문서인 [PROJECT_SETUP_PLAN.md](./PROJECT_SETUP_PLAN.md)는 참고용으로만 사용한다.
