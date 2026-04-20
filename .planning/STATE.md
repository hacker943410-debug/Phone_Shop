# STATE.md

## Project Reference

- Core value: 휴대폰 매장 운영 핵심 흐름을 하나의 워크스페이스에서 빠르게 처리할 수 있게 한다.
- Current focus: 일정 관리 도메인의 수동 일정 CRUD와 검증 안정화까지 마무리했다.

## Current Position

- Phase: `11단계. 운영 중 추가 요구사항 후속 패치`
- Active slice: `일정 관리 CRUD + 외부 dev-server 검증 안정화`
- Status: `paused`

## Progress

- `[██████████]` 일정 관리의 `ManualSchedule` 스키마, 월간 집계, no-key 공휴일 fallback, 캘린더/요약 패널 UI, 수동 일정 CRUD, schedule E2E까지 반영 완료

## Recent Decisions

- 자동 일정은 DB에 저장하지 않고 조회 시 계산형으로 유지한다.
- 공휴일 조회는 no-key 공개 API 기준 연 단위 서버 fetch + 메모리 캐시 fallback으로 처리한다.
- Prisma schema 변경 후 webpack dev server는 재시작해서 최신 client를 반영한다.
- `PLAYWRIGHT_BASE_URL` 기반 webpack dev server 재사용은 shared SQLite 검증 안정화를 위한 보조 경로로 유지한다.
- 외부 webpack dev server + shared SQLite 재사용 시 Playwright는 직렬 실행(`workers=1`)으로 검증한다.
- dev 세션에서 stale Prisma client가 남아 새 delegate를 잃을 수 있으므로 `src/lib/prisma.ts`에서 필요한 delegate 존재 여부를 확인하고 재생성한다.

## Pending Todos

- 배포 준비 문서와 외부 환경 연결 재개

## Blockers / Concerns

- no-key 공휴일 공개 API 실데이터는 `/schedule?month=2026-05` 화면 기준으로 재확인됐다.
- `pnpm playwright test tests/e2e/home.spec.ts tests/e2e/modal-a11y.spec.ts tests/e2e/schedule.spec.ts`는 현재 상태에서 `pnpm dev` self-start 경로로도 다시 통과했다.
- 공휴일 API는 primary hosted JSON 실패 시 공개 fallback API를 거친 뒤 캐시 또는 빈 결과로 렌더링된다.

## Session Continuity

- Last session: 2026-04-20
- Stopped at: 일정 관리 CRUD와 외부 dev-server 검증 안정화 완료
- Resume file: `.planning/.continue-here.md`
