# PhoneShop

PhoneShop은 휴대폰 매장에서 사용할 장부형 웹 애플리케이션 프로젝트입니다.

현재 상태:
- `Next.js 16`
- `React 19`
- `TypeScript`
- `Tailwind CSS 4`
- `Vitest`
- `Playwright`

## 시작 문서

가장 먼저 볼 문서:
- [PROJECT_DOCS.md](./PROJECT_DOCS.md)
- [PHONE_SHOP_REQUIREMENTS_TEMPLATE.md](./PHONE_SHOP_REQUIREMENTS_TEMPLATE.md)
- [PROJECT_SETUP_REPORT.md](./PROJECT_SETUP_REPORT.md)
- [DEPLOYMENT_READINESS.md](./DEPLOYMENT_READINESS.md)

문서 역할 빠른 요약:
- `PROJECT_DOCS.md`: 전체 문서 맵과 기준 문서 정리
- `PHONE_SHOP_REQUIREMENTS_TEMPLATE.md`: 서비스 요구사항 입력 양식
- `PROJECT_SETUP_REPORT.md`: 현재 환경과 설치 결과
- `SKILL_USAGE_GUIDE.md`: 스킬/MCP 사용 기준
- `SUBAGENT_USAGE_GUIDE.md`: 서브에이전트 사용 기준

## 개발 실행

```bash
pnpm dev
```

브라우저:
- `http://localhost:3000`

주요 명령:

```bash
pnpm db:seed
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e
pnpm check
pnpm deploy:check
pnpm deploy:check:vercel
```

개발용 로그인 계정:
- 관리자: `admin / admin1234!`
- 직원: `jihu_kim / staff1234!`

## 문서 운영 원칙

- 루트 문서는 [PROJECT_DOCS.md](./PROJECT_DOCS.md)를 기준으로 연결합니다.
- 중복 설명이 필요할 때는 같은 내용을 복제하지 않고 기준 문서로 링크합니다.
- 현재 환경은 [PROJECT_SETUP_REPORT.md](./PROJECT_SETUP_REPORT.md)를 기준으로 확인합니다.
- 서비스 요구사항은 [PHONE_SHOP_REQUIREMENTS_TEMPLATE.md](./PHONE_SHOP_REQUIREMENTS_TEMPLATE.md)에 누적합니다.

## 배포 준비

- 배포 준비 기준은 [DEPLOYMENT_READINESS.md](./DEPLOYMENT_READINESS.md)를 봅니다.
- 실제 배포는 사용자 승인 전까지 진행하지 않습니다.
- 현재 구조는 `PrismaBetterSqlite3` 기반이므로, 배포 대상에 따라 DB 전략을 먼저 확정해야 합니다.
