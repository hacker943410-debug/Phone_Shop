# PhoneShop Project Setup Plan

문서 허브: [PROJECT_DOCS.md](./PROJECT_DOCS.md)

작성일: 2026-04-10
기준 문서: `C:\Project\SKILL_INSTALL_ANALYSIS.md`
대상 프로젝트: `C:\Project\PhoneShop`
개발 환경: Windows 11

## 1. 목적

이 문서는 `PhoneShop` 프로젝트를 시작하기 전에 필요한 개발 환경, Codex 활용 방식, 하네스 엔지니어링 구성, 배포 흐름을 실제 실행 가능한 형태로 정리한 계획 보고서다.

이번 계획의 목표는 아래 3가지다.

- Windows 11 환경에서 바로 개발을 시작할 수 있도록 로컬 도구 구성을 확정한다.
- 개발 중 즉시 확인 가능한 피드백 루프를 만든다.
- 최종적으로 웹사이트를 배포하고 런칭할 수 있는 운영 흐름을 잡는다.

## 2. 검토 기준

이번 계획은 아래 두 축을 기준으로 작성했다.

- 내부 기준: `C:\Project\SKILL_INSTALL_ANALYSIS.md`
- 외부 확인: 2026-04-10 기준 공식 문서와 저장소

참고한 핵심 외부 기준:

- Node.js Releases
- Next.js Installation / Testing
- Vercel Environments
- GitHub Protected Branches
- GSD 저장소
- UI UX Pro Max 저장소
- ECC 저장소

## 3. 현재 환경 점검 결과

2026-04-10 기준 실제 확인 결과:

- `git` 사용 가능
  - 버전: `2.53.0.windows.2`
- `python` / `py` 사용 가능
  - 버전: `3.12.10`
- `node` / `npm` / `npx` 사용 가능
  - Node 버전: `24.14.1`
  - npm 버전: `11.11.0`
- `corepack` 사용 가능
  - 버전: `0.34.6`
- `codex` 사용 가능
  - 버전: `0.118.0`

미설치 또는 미확인 항목:

- `pnpm`
- `gh`
- `vercel`
- `docker`
- Git 글로벌 사용자 정보
  - `git config --global user.name`
  - `git config --global user.email`

추가 관찰:

- `~/.codex/skills`에는 시스템 스킬만 존재한다.
- `~/.gemini/GEMINI.md`가 이미 존재한다.
- 따라서 전역 설치 충돌을 최소화하는 방향이 유리하다.

## 4. 핵심 판단

`C:\Project\SKILL_INSTALL_ANALYSIS.md`의 결론과 현재 환경을 함께 보면, `PhoneShop`에 가장 적합한 방향은 아래와 같다.

### 4.1 우선 채택

- 프로젝트별 `GSD` 로컬 설치
- `Codex` 중심 작업 방식
- UI 비중이 높으므로 `UI UX Pro Max` 활용
- 전역 기본 시스템보다 프로젝트 단위 설정 우선

### 4.2 보류

- `ECC` 전역 설치
- `Docker` 기반 개발 표준화
- `bun` 기반 패키지 매니저 전환

### 4.3 판단 이유

- `PhoneShop`은 웹 UI 품질과 빠른 확인 루프가 중요하다.
- `GSD`는 프로젝트 운영 구조를 잡는 데 적합하다.
- `UI UX Pro Max`는 UI 설계와 구현 보조에 적합하다.
- `ECC`는 강력하지만 범위가 넓고 `GSD`와 운영 역할이 일부 겹친다.
- 이미 `~/.gemini` 전역 설정이 있으므로 전역 충돌을 줄이는 편이 안전하다.

## 5. PhoneShop 권장 기술 스택

`PhoneShop`의 시작 스택은 아래 조합을 권장한다.

- 프레임워크: `Next.js` App Router
- 언어: `TypeScript`
- 스타일링: `Tailwind CSS`
- 패키지 매니저: `pnpm`
- 린트: `ESLint`
- 단위/컴포넌트 테스트: `Vitest` + `React Testing Library`
- E2E 테스트: `Playwright`
- AI 작업 보조:
  - `Codex`
  - `GSD` 로컬 설치
  - `UI UX Pro Max`
- 배포: `Vercel`
- 협업/운영: `GitHub`

## 6. 하네스 엔지니어링 구성

이 프로젝트에서 말하는 하네스 엔지니어링은 "AI와 개발 도구가 반복 가능한 방식으로 계획, 구현, 검증, 배포까지 연결되는 구조"를 의미한다.

`PhoneShop`에는 아래 구성을 권장한다.

### 6.1 작업 하네스

- 메인 작업 에이전트: `Codex`
- 프로젝트 운영 프레임: `GSD`
- UI 설계 보조: `UI UX Pro Max`

역할 분리:

- `Codex`: 실제 구현, 수정, 검증
- `GSD`: 작업 구조화, 단계 분리, 실행 흐름 유지
- `UI UX Pro Max`: UI/UX 품질 보조

### 6.2 검증 하네스

- 로컬 개발 서버로 즉시 확인
- 저장 후 즉시 화면 반영
- 단위 테스트
- 핵심 사용자 플로우 E2E 테스트
- 배포 전 Preview URL 검토

### 6.3 배포 하네스

- 기능 작업은 브랜치 단위로 진행
- 브랜치 또는 PR 기준 Preview 배포
- `main` 반영 시 Production 배포
- `main`에는 보호 규칙 적용

## 7. 설치 우선순위

### 1순위

프로젝트 시작에 반드시 필요한 항목:

- Git 글로벌 사용자 정보 설정
- `pnpm` 활성화
- `Next.js` 프로젝트 초기화
- `GSD` 로컬 설치

### 2순위

UI 작업 효율을 높이는 항목:

- `UI UX Pro Max`
- 기본 디자인 토큰 정리
- 공통 레이아웃 규칙 정리

### 3순위

운영 안정성을 높이는 항목:

- `Vitest`
- `Playwright`
- `GitHub` 원격 저장소 연결
- `Vercel` 연결
- 브랜치 보호 규칙

### 보류 항목

- `ECC` 전역 설치
- `Docker`
- `bun`

## 8. 추천 실행 순서

### 단계 1. 기본 환경 정리

```powershell
git config --global user.name "YOUR_NAME"
git config --global user.email "YOUR_EMAIL"
corepack enable
corepack prepare pnpm@latest --activate
```

### 단계 2. 프로젝트 초기화

```powershell
cd C:\Project\PhoneShop
git init
pnpm create next-app@latest . --ts --tailwind --eslint --app --src-dir --import-alias "@/*"
```

### 단계 3. Codex 작업 하네스 설치

```powershell
npx get-shit-done-cc@latest --codex --local
npm install -g uipro-cli
uipro init --ai codex
```

설치 방향:

- `GSD`는 프로젝트 로컬 설치
- `UI UX Pro Max`는 우선 프로젝트 기준 설치
- 전역 설치는 실제 사용 빈도를 본 뒤 결정

### 단계 4. 검증 하네스 추가

권장 추가 항목:

- `Vitest`
- `React Testing Library`
- `Playwright`

권장 범위:

- 유틸/상태 로직: 단위 테스트
- 핵심 화면 컴포넌트: 컴포넌트 테스트
- 구매 흐름, 장바구니, 상품 탐색: E2E 테스트

### 단계 5. 운영/배포 하네스 연결

권장 순서:

- GitHub 저장소 생성 및 원격 연결
- Vercel 프로젝트 연결
- Preview 배포 확인
- `main` 브랜치 보호 설정
- Production 배포 기준 확정

## 9. 개발 운영 방식 권장안

### 9.1 로컬 개발 루프

개발 중에는 아래 흐름을 기본 루프로 사용한다.

1. 기능 단위 브랜치 생성
2. Codex로 구현
3. 로컬 개발 서버에서 즉시 확인
4. 테스트 실행
5. 브랜치 푸시
6. Preview 배포 확인
7. 검토 후 `main` 병합

### 9.2 브랜치 전략

- `main`: 배포 가능한 안정 브랜치
- `feature/*`: 기능 개발
- `fix/*`: 버그 수정
- `chore/*`: 설정 및 유지보수

### 9.3 배포 전략

- Preview: 브랜치/PR 검토용
- Production: `main` 반영 후 사용자 공개

이 구조는 개발 중 즉시 확인과 런칭 전 검증을 동시에 만족시킨다.

## 10. ECC에 대한 판단

현 시점에서는 `ECC`를 `PhoneShop`의 기본 전역 시스템으로 채택하지 않는 것을 권장한다.

이유:

- 역할 범위가 너무 넓다.
- `GSD`와 운영 성격이 일부 겹친다.
- Codex, Gemini, 기타 전역 설정과 충돌 가능성이 있다.
- 지금 단계의 목표는 "빠르게 시작하고 즉시 확인 가능한 웹 개발 루프를 만드는 것"이다.

권장 방식:

- 필요 시 `C:\Project` 아래 별도 샌드박스 폴더에서 먼저 검증
- 실제 효용이 확인되면 이후 도입 여부 재판단

## 11. 최종 결론

`PhoneShop`의 현재 최적 시작안은 아래와 같다.

- 메인 에이전트: `Codex`
- 프로젝트 운영 시스템: `GSD 로컬 설치`
- UI 보조 시스템: `UI UX Pro Max`
- 웹 프레임워크: `Next.js + TypeScript + Tailwind`
- 품질 하네스: `Vitest + Playwright`
- 배포 하네스: `GitHub + Vercel`

한 줄 결론:

`PhoneShop`은 "Codex 중심 + GSD 로컬 + UI UX Pro Max + Next.js + Preview 배포" 구조로 시작하는 것이 가장 실용적이다.

## 12. 다음 실행 제안

바로 이어서 진행할 추천 작업:

1. `pnpm` 활성화
2. `PhoneShop`에 `Next.js` 초기 프로젝트 생성
3. `GSD` 로컬 적용
4. `UI UX Pro Max` 적용
5. 기본 폴더 구조와 초기 화면 생성
6. 테스트 하네스 추가
7. GitHub / Vercel 연결

## 13. 참고 링크

- 내부 기준 문서: `C:\Project\SKILL_INSTALL_ANALYSIS.md`
- GSD: `https://github.com/gsd-build/get-shit-done`
- UI UX Pro Max: `https://github.com/nextlevelbuilder/ui-ux-pro-max-skill`
- ECC: `https://github.com/affaan-m/everything-claude-code`
- Node.js Releases: `https://nodejs.org/en/about/previous-releases`
- Next.js Installation: `https://nextjs.org/docs/app/getting-started/installation`
- Next.js Vitest Guide: `https://nextjs.org/docs/app/guides/testing/vitest`
- Next.js Playwright Guide: `https://nextjs.org/docs/app/guides/testing/playwright`
- Vercel Environments: `https://vercel.com/docs/deployments/environments`
- GitHub Protected Branches: `https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches`
