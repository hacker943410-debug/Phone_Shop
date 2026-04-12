# PhoneShop Skill Usage Guide

문서 허브: [PROJECT_DOCS.md](./PROJECT_DOCS.md)

작성일: 2026-04-11  
대상 프로젝트: `C:\Project\PhoneShop`

## 1. 목적

이 문서는 `PhoneShop` 프로젝트에서 현재 설치된 스킬들을 언제, 왜, 어떤 순서로 사용할지 정리한 운영 가이드다.

핵심 원칙:

- 승인 전까지는 `로컬 개발`만 진행한다.
- 배포 관련 스킬은 사용하지 않는다.
- 한 번에 스킬을 너무 많이 섞지 않는다.
- 기본은 `주 스킬 1개 + 보조 스킬 1개` 조합으로 쓴다.

## 2. 현재 스킬 구성

### 2.1 프로젝트 로컬 스킬

프로젝트 내부 `.codex/`에 설치된 스킬:

- `GSD`
- `UI UX Pro Max`

역할:

- `GSD`: 작업 구조화, 단계 분리, 검증 흐름 유지
- `UI UX Pro Max`: 디자인 시스템 검색, 색상/타이포/패턴 추천

### 2.2 전역 Codex 스킬

전역 `~/.codex/skills`에 설치된 스킬:

- `next-best-practices`
- `react-best-practices`
- `accessibility-a11y`
- `security-best-practices`
- `nextjs-react-typescript`
- `frontend-design`

역할:

- `next-best-practices`: Next.js App Router 구현 규칙
- `react-best-practices`: React 구조/렌더링/성능 최적화
- `accessibility-a11y`: 접근성 검수
- `security-best-practices`: 보안 검수
- `nextjs-react-typescript`: TS/컴포넌트 구조 정리
- `frontend-design`: UI 방향성과 시각 품질 기준

## 2.3 현재 MCP 구성

현재 `PhoneShop`에서 사용하도록 정리한 MCP 구성은 아래와 같다.

### 전역 Codex MCP

`~/.codex/config.toml`에 등록:

- `sequential-thinking`
- `playwright`

역할:

- `sequential-thinking`: 복잡한 문제를 단계별로 분해할 때 사용
- `playwright`: 브라우저 상호작용, 스크린샷, 실제 렌더링 검증

### 프로젝트 로컬 MCP

`[.mcp.json](./.mcp.json)`에 등록:

- `filesystem`
- `next-devtools`

역할:

- `filesystem`: 프로젝트 루트 `C:\Project\PhoneShop` 범위 파일 접근
- `next-devtools`: Next.js 16 개발 서버의 상태, 에러, 라우트, 런타임 정보를 MCP로 노출

구성 이유:

- 전역에서 유용한 서버는 글로벌로 둔다.
- 프로젝트에 종속적인 서버는 로컬 `.mcp.json`으로 한정한다.
- 이렇게 분리하면 다른 프로젝트와 충돌 가능성이 줄어든다.

## 3. 우선순위

현재 `PhoneShop` 기준 권장 우선순위:

1. `GSD`
2. `next-best-practices`
3. `frontend-design`
4. `accessibility-a11y`
5. `react-best-practices`
6. `nextjs-react-typescript`
7. `security-best-practices`
8. `UI UX Pro Max`

우선순위 해석:

- `GSD`는 작업 운영의 기본 프레임이다.
- `next-best-practices`는 현재 스택이 `Next.js 16 App Router`라서 구현 시 최우선이다.
- `frontend-design`은 쇼핑몰 UI 품질 확보에 중요하다.
- `accessibility-a11y`는 마감 직전이 아니라 화면 단위 완료 시마다 반복 적용한다.
- `security-best-practices`는 로그인, 주문, 결제, 관리자 기능이 들어갈 때 우선순위가 크게 올라간다.
- `UI UX Pro Max`는 주 지휘 스킬이 아니라 디자인 검색/보조용으로 쓰는 것이 적절하다.

MCP 우선순위는 아래 기준으로 본다.

1. `next-devtools`
2. `playwright`
3. `sequential-thinking`
4. `filesystem`

해석:

- `next-devtools`는 현재 스택이 `Next.js 16`이라 가장 직접적인 개발 이득이 있다.
- `playwright`는 실제 UI 검증에 유용하다.
- `sequential-thinking`은 설계/디버깅 시점에만 켠다.
- `filesystem`은 보조 수단이며, 기본 파일 작업 도구를 대체하지 않는다.

## 4. 단계별 사용 규칙

### 4.1 기능 시작 단계

주 스킬:

- `GSD`

보조 스킬:

- 필요 시 `next-best-practices`
- 필요 시 `sequential-thinking`

목적:

- 기능 범위 분리
- 작업 단계 정의
- 검증 기준 확정

예:

- 상품 목록
- 상품 상세
- 장바구니
- 체크아웃
- 주문 내역

권장 방식:

- 기능을 phase 단위로 쪼갠다.
- 구현에 들어가기 전에 완료 기준을 먼저 정한다.
- 아키텍처가 꼬이거나 선택지가 여러 개면 `sequential-thinking`으로 단계 분해를 한다.

### 4.2 화면 방향 설계 단계

주 스킬:

- `frontend-design`

보조 스킬:

- `UI UX Pro Max`

목적:

- 브랜드 톤 결정
- 레이아웃 방향 설정
- 카드/배지/필터/CTA 스타일 결정

권장 방식:

- `frontend-design`으로 전체 톤과 구조를 잡는다.
- `UI UX Pro Max`로 색상, 타이포, 패턴, 레이아웃 참고안을 보강한다.

주의:

- `UI UX Pro Max`는 기본적으로 `html-tailwind` 예시가 많으므로, `Next.js` 기준으로 해석해서 적용한다.

### 4.3 구현 단계

주 스킬:

- `next-best-practices`

보조 스킬:

- `react-best-practices`
- `next-devtools`

목적:

- App Router 규칙 준수
- RSC/Client Component 경계 정리
- metadata, routing, loading, error 처리 안정화
- 렌더링 구조와 성능 최적화

권장 방식:

- Next.js 전용 판단은 항상 `next-best-practices`를 우선한다.
- 클라이언트 상태, 렌더 비용, 컴포넌트 분리 문제는 `react-best-practices`로 보강한다.
- 개발 서버 에러, 라우트 상태, 런타임 문제 추적은 `next-devtools`를 우선 활용한다.

### 4.4 구조 정리 단계

주 스킬:

- `nextjs-react-typescript`

목적:

- 타입 구조 정리
- props/interface 분리
- 파일 구조 정리
- 컴포넌트 책임 재배치

권장 방식:

- 구조가 흐트러질 때만 보조적으로 사용한다.
- 매번 주 스킬로 쓸 필요는 없다.

### 4.5 UI 마감 검수 단계

주 스킬:

- `accessibility-a11y`

보조 스킬:

- 필요 시 `frontend-design`
- `playwright`

목적:

- 키보드 탐색
- 포커스 상태
- 시맨틱 HTML
- 폼 라벨링
- 색 대비

권장 방식:

- 페이지 하나가 끝날 때마다 적용한다.
- 릴리즈 직전 한 번만 보는 방식은 피한다.
- 실제 상호작용 확인과 시각 검증은 `playwright` MCP 또는 기존 Playwright 테스트를 사용한다.

### 4.6 민감 기능 단계

주 스킬:

- `security-best-practices`

보조 스킬:

- `next-best-practices`

대상:

- 로그인
- 회원가입
- 관리자 기능
- 주문
- 결제
- 쿠폰
- 사용자 입력 저장 API

목적:

- 입력 검증
- 권한 체크
- 비밀값 관리
- API 보호
- 민감 데이터 처리 기준 점검

## 5. 충돌 회피 규칙

### 규칙 1. Next 전용 판단은 `next-best-practices` 우선

`next-best-practices`와 `nextjs-react-typescript`가 다르게 말하면 `next-best-practices`를 따른다.

이유:

- 현재 프로젝트는 `Next.js App Router`가 핵심 런타임 기준이기 때문이다.

### 규칙 2. UI 방향은 `frontend-design`, 재료 검색은 `UI UX Pro Max`

두 스킬이 UI를 모두 다루더라도 역할은 다르게 본다.

- `frontend-design`: 방향과 완성도 기준
- `UI UX Pro Max`: 색/폰트/패턴/스타일 후보 검색

### 규칙 3. `GSD`는 항상 바깥 레이어

`GSD`는 구현 규칙 스킬이 아니라 작업 운영 스킬이다.

따라서:

- phase 분리
- 진행 상태 관리
- 검증 순서 관리

에만 쓰고, 세부 UI/TS/React 규칙은 다른 스킬에 맡긴다.

### 규칙 4. 접근성과 보안은 마지막 한 번이 아니라 중간 점검형으로 사용

- `accessibility-a11y`: 화면 단위 완료 시마다
- `security-best-practices`: 인증/API/주문 기능 단위마다

### 규칙 5. MCP는 역할이 겹쳐도 우선순위를 지킨다

- Next.js 내부 상태 확인: `next-devtools` 우선
- 브라우저 렌더링/인터랙션 확인: `playwright` 우선
- 긴 사고 분해: `sequential-thinking`
- 파일 트리 조회: 기본 도구 우선, 필요 시 `filesystem`

이유:

- `filesystem`은 기본 셸/파일 도구와 기능이 겹치므로 남용할 필요가 없다.
- `next-devtools`와 `playwright`는 서로 다른 계층을 본다.
  - `next-devtools`: 프레임워크 내부 상태
  - `playwright`: 실제 브라우저 동작

## 6. 현재 단계에서 사용하지 않을 스킬

### `vercel-deploy`

사용 금지 이유:

- 현재 합의는 승인 전까지 `로컬 개발만 진행`하는 것이다.
- 배포용 스킬은 운영 정책과 충돌한다.

사용 시점:

- 모든 개발 완료
- 사용자 확인 완료
- 실제 배포 승인 이후

### 과도한 오케스트레이션 계열 스킬

주의 이유:

- `GSD`와 역할이 겹치면 작업 흐름이 복잡해진다.
- `.codex/config.toml`이나 hooks를 수정하는 계열은 충돌 가능성이 있다.

## 6.2 현재 보류하는 MCP 서버

아래 MCP 서버는 목록 자체는 유효하지만, 현재 `PhoneShop` 단계에서는 바로 구성하지 않았다.

### `context7`

보류 이유:

- `CONTEXT7_API_KEY`가 현재 환경에 없다.
- 키 없이 등록하면 실패하는 서버 구성이 된다.

사용 시점:

- Context7 API 키 확보 후
- 공식 문서 조회를 MCP로 통일하고 싶을 때

### `github`

보류 이유:

- `GITHUB_PERSONAL_ACCESS_TOKEN`이 현재 환경에 없다.
- 아직 GitHub 원격 저장소 연결도 완료되지 않았다.

사용 시점:

- GitHub 로그인 및 원격 연결 이후
- PR 생성, 이슈 트래킹 자동화가 필요할 때

### `postgres`

보류 이유:

- `DATABASE_URL`이 없다.
- 현재 프로젝트에 실제 DB가 아직 도입되지 않았다.

사용 시점:

- PostgreSQL 스키마가 실제로 생긴 이후

### `qdrant`

보류 이유:

- `QDRANT_URL`, `QDRANT_API_KEY`가 없다.
- 현재 환경에는 `uvx`도 없다.
- 지금 단계에서는 코드 메모리 계층보다 기능 개발이 우선이다.

사용 시점:

- 세션 기억 계층이 실제로 필요해진 이후

### `figma`

보류 이유:

- `FIGMA_ACCESS_TOKEN`이 없다.
- 현재 Figma 기반 단일 디자인 소스가 확인되지 않았다.

사용 시점:

- Figma 파일이 실제 구현 기준이 되는 시점

### `filesystem` 전역 등록

보류 이유:

- 프로젝트 경로가 고정된 MCP 서버를 전역으로 두면 다른 프로젝트와 섞이기 쉽다.
- 따라서 `PhoneShop`에서는 프로젝트 로컬 `.mcp.json` 방식만 사용한다.

## 7. 추천 조합

### 상품 목록 / 상품 상세

- `GSD`
- `frontend-design`
- `next-best-practices`
- `next-devtools`
- `accessibility-a11y`

### 장바구니 / 체크아웃 UI

- `GSD`
- `frontend-design`
- `next-best-practices`
- `react-best-practices`
- `playwright`
- `accessibility-a11y`

### 로그인 / 회원가입 / 계정

- `GSD`
- `next-best-practices`
- `nextjs-react-typescript`
- `next-devtools`
- `security-best-practices`
- `accessibility-a11y`

### 주문 / 결제 / 관리자 기능

- `GSD`
- `next-best-practices`
- `next-devtools`
- `playwright`
- `security-best-practices`
- `react-best-practices`

## 8. 실전 운영 예시

### 예시 1. 상품 목록 페이지 생성

순서:

1. `GSD`로 범위와 완료 기준 정의
2. `frontend-design`으로 레이아웃 방향 결정
3. 필요 시 `UI UX Pro Max`로 카드 스타일/색 조합 검색
4. `next-best-practices` 기준으로 구현
5. 개발 중 문제 추적은 `next-devtools` 활용
6. `react-best-practices`로 렌더링 구조 점검
7. `accessibility-a11y`로 검수

### 예시 2. 체크아웃 페이지 생성

순서:

1. `GSD`로 주문 흐름 분리
2. `frontend-design`으로 폼/요약 패널 구조 설계
3. `next-best-practices`로 페이지/서버 경계 구현
4. `next-devtools`로 개발 서버 상태와 에러 확인
5. `nextjs-react-typescript`로 타입 구조 정리
6. `security-best-practices`로 입력/민감 정보 처리 검수
7. `playwright`로 실제 체크아웃 상호작용 확인
8. `accessibility-a11y`로 폼 접근성 검수

## 9. 최종 운영 요약

한 줄 기준:

`PhoneShop`은 `GSD`로 작업을 운영하고, `next-best-practices`로 구현 기준을 잡고, `frontend-design`으로 UI 방향을 정하고, `accessibility-a11y`와 `security-best-practices`로 품질을 마감하는 구조로 운용한다.

실무 기준 기본 조합:

- 시작: `GSD`
- 구현: `next-best-practices`
- 개발 서버 추적: `next-devtools`
- UI: `frontend-design`
- 브라우저 검증: `playwright`
- 검수: `accessibility-a11y`
- 민감 기능: `security-best-practices`
