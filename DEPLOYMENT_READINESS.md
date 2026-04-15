# Deployment Readiness

이 문서는 PhoneShop의 배포 준비 기준 문서다.

실제 배포는 자동으로 진행하지 않으며, 사용자 승인 전까지 보류한다.

## 현재 합의

- 먼저 배포 준비 상태를 만든다.
- 이후에는 메뉴별 재검토 요청 단위로 패치한다.
- 최종 배포는 모든 확인이 끝난 뒤 사용자 승인 시점에만 진행한다.

## 현재 아키텍처 기준

- 런타임: Next.js 16 Node.js 서버
- 데이터베이스 접근: `PrismaBetterSqlite3`
- 현재 기본 DB URL: `file:./prisma/dev.db`
- 인증: 서버 전용 `SESSION_SECRET` 기반 서명 쿠키

현재 코드 기준에서 가장 안전한 1차 배포 경로는 다음 둘 중 하나다.

- Node.js 서버 배포
- Docker 배포

현재 구조에서 바로 Vercel을 목표로 삼기 어려운 이유:

- 앱이 `PrismaBetterSqlite3` 기반 로컬 SQLite 어댑터를 사용한다.
- 기본 `DATABASE_URL`도 로컬 파일 경로다.
- 따라서 Vercel로 가려면 먼저 내구성 있는 외부 DB 전략과 Prisma 연결 방식을 바꿔야 한다.

## 현재 준비 상태

- [x] `build` / `start` 스크립트 존재
- [x] Git remote 연결 확인
- [x] `pnpm check` 품질 게이트 존재
- [ ] 운영용 `SESSION_SECRET` 준비
- [ ] 운영용 `DATABASE_URL` 확정
- [ ] 배포 대상 결정
- [ ] Vercel 링크

최신 사전 점검 결과:

- `pnpm deploy:check`: `SESSION_SECRET` 운영값 미설정, 로컬 SQLite 경로 경고
- `pnpm deploy:check:vercel`: 로컬 SQLite 어댑터 사용, `SESSION_SECRET` 미설정, `.vercel` 링크 없음으로 실패

## 배포 전 점검 명령

기본 Node.js 서버 기준:

```bash
pnpm deploy:check
```

Vercel 기준 확인:

```bash
pnpm deploy:check:vercel
```

## 점검 항목

`pnpm deploy:check`는 아래 항목을 확인한다.

- `build` / `start` 스크립트 존재 여부
- `.env.example`에 필수 서버 환경 변수 문서화 여부
- `SESSION_SECRET` 설정 여부
- `DATABASE_URL` 설정 여부
- 로컬 SQLite 파일 사용 여부
- Git remote 연결 여부
- Vercel 목표일 때 `.vercel/project.json` 존재 여부
- `pnpm check` 명령 존재 여부

## 운영 환경 변수

필수 변수:

- `DATABASE_URL`
- `SESSION_SECRET`

권장 기준:

- `SESSION_SECRET`는 개발 기본값이 아닌 긴 랜덤 문자열을 사용한다.
- `DATABASE_URL`이 `file:` 형식이면 배포 서버에 영속 스토리지가 있어야 한다.

## 실제 배포 직전 순서

1. 배포 대상을 확정한다.
2. 운영 환경 변수 값을 준비한다.
3. `pnpm check`
4. `pnpm build`
5. `pnpm deploy:check`
6. 사용자에게 최종 승인 요청
7. 승인 이후에만 실제 배포 수행
