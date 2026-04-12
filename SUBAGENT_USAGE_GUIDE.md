# PhoneShop Subagent Usage Guide

문서 허브: [PROJECT_DOCS.md](./PROJECT_DOCS.md)

작성일: 2026-04-11  
대상 프로젝트: `C:\Project\PhoneShop`

## 1. 목적

이 문서는 `PhoneShop`에서 작업을 시작하고 진행할 때 사용할 프로젝트 전용 서브에이전트의 상세 사용 방법을 정리한다.

이 문서가 답하는 질문:

- 어떤 서브에이전트가 등록되어 있는가
- 각 서브에이전트는 언제 써야 하는가
- 어떤 입력을 줘야 하는가
- 어떤 결과를 기대해야 하는가
- 어떤 순서와 조합이 안전한가
- 작업 도중 어떤 시점에 다른 서브에이전트로 넘겨야 하는가

기본 원칙:

- 승인 전까지는 `로컬 개발`만 진행한다.
- 서브에이전트는 `역할이 좁을수록` 좋다.
- 한 서브에이전트가 모든 걸 하지 않는다.
- 구현은 작게 나누고, 검증은 자주 한다.

## 2. 현재 등록된 서브에이전트

현재 프로젝트 `.codex/config.toml`에 등록된 PhoneShop 전용 서브에이전트:

- `phoneshop-kickoff-planner`
- `phoneshop-ui-architect`
- `phoneshop-feature-builder`
- `phoneshop-quality-guard`

정의 파일 위치:

- [.codex/agents/phoneshop-kickoff-planner.toml](C:/Project/PhoneShop/.codex/agents/phoneshop-kickoff-planner.toml:1)
- [.codex/agents/phoneshop-ui-architect.toml](C:/Project/PhoneShop/.codex/agents/phoneshop-ui-architect.toml:1)
- [.codex/agents/phoneshop-feature-builder.toml](C:/Project/PhoneShop/.codex/agents/phoneshop-feature-builder.toml:1)
- [.codex/agents/phoneshop-quality-guard.toml](C:/Project/PhoneShop/.codex/agents/phoneshop-quality-guard.toml:1)

## 3. 사용 전 체크리스트

서브에이전트를 실제로 쓰기 전에 아래를 확인한다.

### 필수

- Codex를 재시작해서 최신 `.codex/config.toml`과 MCP 설정을 읽게 한다.
- 작업 루트가 `C:\Project\PhoneShop`인지 확인한다.
- 현재 작업이 `로컬 개발 범위`인지 확인한다.
- 요청 범위를 한 문장으로 설명할 수 있는지 확인한다.

### 권장

- 시작 전에 [PROJECT_SETUP_REPORT.md](C:/Project/PhoneShop/PROJECT_SETUP_REPORT.md:1)를 읽어 현재 환경을 다시 확인한다.
- 스킬 기준이 필요하면 [SKILL_USAGE_GUIDE.md](C:/Project/PhoneShop/SKILL_USAGE_GUIDE.md:1)를 함께 본다.
- 작업이 크면 먼저 `phoneshop-kickoff-planner`를 거친다.

## 4. 호출 기준

GSD 문서 기준으로 서브에이전트는 `spawn_agent(agent_type="정확한이름", message="...")` 형태로 호출하는 구조에 맞춰 등록되어 있다.

즉, 사용할 때 중요한 것은 아래 두 가지다.

1. `agent_type` 이름을 정확히 쓴다
2. 입력 메시지에 범위, 파일, 완료 기준을 같이 준다

정확한 이름:

- `phoneshop-kickoff-planner`
- `phoneshop-ui-architect`
- `phoneshop-feature-builder`
- `phoneshop-quality-guard`

## 5. 서브에이전트별 상세 사용법

### 5.1 `phoneshop-kickoff-planner`

역할:

- 요구사항을 첫 실행 가능한 슬라이스로 자른다
- 어떤 파일부터 만질지 정한다
- 어떤 검증을 먼저 해야 하는지 정한다
- 다음 담당 서브에이전트를 추천한다

언제 쓰는가:

- 새 기능을 처음 시작할 때
- 요청이 넓거나 애매할 때
- 페이지 하나가 아니라 흐름 전체를 다루는 요청일 때
- “어디서부터 시작해야 하지?” 상태일 때

적합한 작업 예:

- 상품 목록 페이지 시작
- 상품 상세 페이지 구조 시작
- 장바구니 기능 분해
- 체크아웃 흐름 분해
- 로그인/계정 기능 1차 분해

주 입력 요소:

- 기능 목표
- 현재 범위
- 제외할 것
- 원하는 첫 결과물

좋은 입력 예시:

```text
상품 목록 페이지를 시작한다.
범위는 상단 히어로 없이 상품 그리드, 필터 바, 정렬 UI까지다.
백엔드는 아직 붙이지 않는다.
첫 구현 슬라이스와 예상 파일, 검증 명령까지 정리해라.
```

기대 결과:

- 목표 요약
- 첫 구현 슬라이스
- 예상 수정 파일 목록
- 리스크/가정
- 검증 명령
- 다음 담당 에이전트 추천

이 에이전트에 기대하지 말아야 할 것:

- 최종 UI 구현
- 대규모 코드 작성
- 리뷰 완료 판정

다음으로 넘길 대상:

- UI 구조가 중요하면 `phoneshop-ui-architect`
- 바로 구현 가능하면 `phoneshop-feature-builder`

### 5.2 `phoneshop-ui-architect`

역할:

- 화면 구조와 컴포넌트 구성 정의
- 시각 방향과 컴포넌트 계약 정리
- 반응형과 접근성 고려
- 현재 스택에서 구현 가능한 수준으로 UI를 구체화

언제 쓰는가:

- 페이지 UI 구조가 먼저 필요한 경우
- 공통 컴포넌트가 필요한 경우
- 카드, 필터, CTA, 섹션 배치가 중요한 경우
- 장바구니/체크아웃처럼 변환율에 영향이 큰 화면일 때

적합한 작업 예:

- 상품 카드 디자인 구조
- 목록/상세/체크아웃 레이아웃
- 공통 버튼/배지/섹션 블록 설계
- 모바일/데스크톱 레이아웃 정리

주 입력 요소:

- 대상 화면
- 필요한 섹션
- 제외할 요소
- 시각 방향 키워드
- 반응형 요구

좋은 입력 예시:

```text
상품 목록 페이지 UI 구조를 정리해라.
필요한 요소는 상단 카테고리 바, 필터 영역, 상품 카드 그리드, 페이지네이션이다.
톤은 프리미엄 전자제품 스토어 느낌으로 가되 과장된 애니메이션은 빼라.
모바일과 데스크톱 기준도 포함해라.
```

기대 결과:

- 시각 목표
- 페이지 구조
- 컴포넌트 분해
- 반응형 기준
- 접근성 고려
- 구현/검증 방향

이 에이전트에 기대하지 말아야 할 것:

- 데이터 모델 설계
- API 설계
- 기능 전체 구현 완료

다음으로 넘길 대상:

- 실제 구현은 `phoneshop-feature-builder`
- UI 변경 후 위험 점검은 `phoneshop-quality-guard`

### 5.3 `phoneshop-feature-builder`

역할:

- 실제 기능을 구현한다
- 관련 테스트를 추가하거나 갱신한다
- 로컬 검증을 수행한다

언제 쓰는가:

- 범위가 정해졌고 바로 구현 가능한 경우
- UI와 기능을 하나의 슬라이스로 묶어 진행할 때
- App Router, Client Component, 테스트까지 포함해 바꿔야 할 때

적합한 작업 예:

- 상품 목록 페이지 구현
- 상세 페이지 레이아웃 + 상태 구현
- 장바구니 상태와 UI 연결
- 체크아웃 폼 1차 구현

주 입력 요소:

- 구현할 목표
- 만질 파일 또는 후보 파일
- 완료 기준
- 검증 범위

좋은 입력 예시:

```text
상품 목록 첫 버전을 구현해라.
src/app/products/page.tsx와 관련 컴포넌트를 중심으로 작업한다.
정적 목업 데이터로 카드 12개를 보여주고 필터 바 UI까지 만든다.
관련 테스트가 필요하면 추가하고, lint/typecheck/test까지 확인해라.
```

기대 결과:

- 실제 코드 변경
- 필요한 테스트 추가
- 실행한 검증 명령
- 남은 리스크 또는 미실행 검증

이 에이전트에 기대하지 말아야 할 것:

- 제품 전략 결정
- 디자인 방향 최초 정의
- 리뷰 역할

다음으로 넘길 대상:

- 구현 후 검수는 `phoneshop-quality-guard`
- UI 재설계가 필요하면 `phoneshop-ui-architect`

### 5.4 `phoneshop-quality-guard`

역할:

- 구현 변경을 리뷰한다
- 회귀, 버그, 누락 테스트, 접근성, 보안 리스크를 찾는다
- findings-first 방식으로 결과를 돌려준다

언제 쓰는가:

- 기능 구현 직후
- 병합 전
- 큰 UI 수정 후
- 폼/주문/인증 흐름 점검 시

적합한 작업 예:

- 상품 목록 구현 리뷰
- 장바구니 상태 변경 리뷰
- 체크아웃 폼 접근성 점검
- 계정 기능 보안/회귀 점검

주 입력 요소:

- 검토 대상 범위
- 변경된 파일
- 우선 보고 싶은 리스크

좋은 입력 예시:

```text
방금 구현한 상품 목록 변경을 리뷰해라.
주요 대상은 src/app/products/page.tsx와 src/components 아래 새 카드 컴포넌트다.
버그, 접근성, 누락 테스트를 우선 봐라.
발견 사항을 심각도 순으로 정리해라.
```

기대 결과:

- 심각도 순 findings
- 파일 기준 참조
- 남은 리스크
- 테스트 갭

이 에이전트에 기대하지 말아야 할 것:

- 자동 구현 완성
- 기획 확정

다음으로 넘길 대상:

- 수정이 필요하면 `phoneshop-feature-builder`
- UI 구조 문제면 `phoneshop-ui-architect`

## 6. 추천 사용 순서

기본 순서:

1. `phoneshop-kickoff-planner`
2. `phoneshop-ui-architect`
3. `phoneshop-feature-builder`
4. `phoneshop-quality-guard`

이 순서를 쓰면 좋은 경우:

- 새 페이지나 새 흐름을 처음 시작할 때
- 범위와 UI와 구현과 검수를 한 번에 관리하고 싶을 때

### 빠른 시작 순서

작업이 작으면 아래처럼 줄여도 된다.

1. `phoneshop-feature-builder`
2. `phoneshop-quality-guard`

예:

- 버튼 상태 수정
- 카드 텍스트 조정
- 테스트 보강

### UI 중심 순서

1. `phoneshop-kickoff-planner`
2. `phoneshop-ui-architect`
3. `phoneshop-feature-builder`

예:

- 상품 카드 리디자인
- 체크아웃 레이아웃 변경

### 로직 중심 순서

1. `phoneshop-kickoff-planner`
2. `phoneshop-feature-builder`
3. `phoneshop-quality-guard`

예:

- 장바구니 상태 로직
- 인증 흐름

## 7. 작업 규모별 추천

### 작은 작업

예:

- 버튼 문구 수정
- 카드 배지 스타일 수정
- 테스트 1개 추가

추천:

- `phoneshop-feature-builder`
- 필요 시 `phoneshop-quality-guard`

### 중간 작업

예:

- 상품 카드 컴포넌트 추가
- 상품 목록 페이지 첫 구현
- 필터 바 UI 추가

추천:

- `phoneshop-kickoff-planner`
- `phoneshop-ui-architect`
- `phoneshop-feature-builder`
- `phoneshop-quality-guard`

### 큰 작업

예:

- 장바구니 전체 흐름
- 체크아웃 페이지
- 계정/로그인 흐름

추천:

- `phoneshop-kickoff-planner`
- 필요한 경우 `sequential-thinking` 활용
- `phoneshop-ui-architect`
- `phoneshop-feature-builder`
- `phoneshop-quality-guard`

## 8. 병렬 사용 규칙

병렬로 돌릴 때는 `파일 소유권`을 먼저 나눈다.

### 안전한 조합

- `phoneshop-kickoff-planner` + `phoneshop-ui-architect`
- `phoneshop-kickoff-planner` + `phoneshop-quality-guard`
- `phoneshop-ui-architect` + `phoneshop-quality-guard`

이유:

- planner는 계획 중심
- quality guard는 읽기 중심
- UI architect는 구조와 스타일 중심

### 주의 조합

- `phoneshop-ui-architect` + `phoneshop-feature-builder`
- `phoneshop-feature-builder` + `phoneshop-feature-builder`

이유:

- 둘 이상이 같은 `src/app/*`, `src/components/*`를 만질 가능성이 높다

안전하게 쓰는 방법:

- 각 에이전트에 파일 소유권을 명시한다
- 겹치는 파일은 한 에이전트만 담당한다

좋은 예:

- UI architect: `src/components/catalog-card.tsx`, `src/app/globals.css`
- feature builder: `src/app/products/page.tsx`, `tests/e2e/products.spec.ts`

나쁜 예:

- 두 에이전트가 동시에 `src/app/products/page.tsx`를 수정

## 9. 에이전트에게 줘야 할 입력 형식

서브에이전트에게 일을 맡길 때는 아래 5가지를 포함하면 품질이 크게 올라간다.

1. 목표
2. 범위
3. 제외 범위
4. 파일 힌트
5. 완료 기준

권장 템플릿:

```text
목표:
[무엇을 만들거나 검토할지]

범위:
[이번 작업에 포함할 것]

제외:
[이번에는 하지 않을 것]

파일 힌트:
[관련 파일 또는 예상 파일]

완료 기준:
[검증 기준, 기대 결과]
```

## 10. 실제 프롬프트 템플릿

### planner 호출 템플릿

```text
목표:
상품 상세 페이지 작업을 시작한다.

범위:
상단 갤러리, 가격/옵션 영역, 주요 CTA, 기본 정보 섹션까지 포함한다.

제외:
실제 결제 연동, 리뷰 API, 추천 상품 로직은 제외한다.

파일 힌트:
src/app/products/[id]/page.tsx
src/components

완료 기준:
첫 구현 슬라이스와 예상 파일, 리스크, 검증 명령을 정리한다.
```

### ui-architect 호출 템플릿

```text
목표:
상품 상세 페이지의 UI 구조를 설계한다.

범위:
이미지 갤러리, 가격 블록, 옵션 선택, CTA, 배송/신뢰 정보 섹션을 포함한다.

제외:
실제 상태 관리와 API 로직은 제외한다.

파일 힌트:
src/app/products/[id]/page.tsx
src/components

완료 기준:
레이아웃 구조, 컴포넌트 분해, 모바일/데스크톱 기준, 접근성 고려를 제안한다.
```

### feature-builder 호출 템플릿

```text
목표:
상품 상세 페이지 첫 버전을 구현한다.

범위:
정적 데이터 기반 레이아웃, 옵션 선택 UI, CTA 버튼, 신뢰 정보 섹션을 포함한다.

제외:
백엔드 연동, 주문 생성, 사용자 계정 연동은 제외한다.

파일 힌트:
src/app/products/[id]/page.tsx
src/components
tests/e2e

완료 기준:
코드 구현, 필요한 테스트 추가, 실행한 검증 명령까지 정리한다.
```

### quality-guard 호출 템플릿

```text
목표:
방금 만든 상품 상세 페이지 변경을 리뷰한다.

범위:
버그, 회귀, 접근성, 누락 테스트를 우선 본다.

제외:
디자인 취향 수준의 의견은 제외한다.

파일 힌트:
src/app/products/[id]/page.tsx
src/components
tests/e2e

완료 기준:
findings-first 형식으로 심각도 순 결과를 정리한다.
```

## 11. handoff 규칙

서브에이전트 사이에 넘길 때는 handoff 메시지를 짧고 구체적으로 쓴다.

권장 형식:

```text
이전 결과:
[무엇이 정리되었는지]

다음 작업:
[지금 무엇을 해야 하는지]

고정 조건:
[바꾸면 안 되는 조건]

파일:
[핵심 파일]

검증:
[필수 검증]
```

좋은 예:

```text
이전 결과:
상품 목록 페이지 첫 슬라이스로 필터 바, 카드 그리드, 페이지네이션이 확정됨.

다음 작업:
카드 컴포넌트와 목록 페이지를 정적 데이터 기준으로 구현.

고정 조건:
백엔드 연동 없음, 로컬 개발만, 모바일 우선 반응형 유지.

파일:
src/app/products/page.tsx
src/components/catalog-card.tsx

검증:
pnpm lint
pnpm typecheck
pnpm test
```

## 12. 검증 책임

각 서브에이전트가 가져야 하는 기본 검증 책임:

### kickoff-planner

- 구현 전 검증 계획 제시

### ui-architect

- 반응형/접근성 고려 명시

### feature-builder

- 최소 하나 이상의 실제 검증 실행
- 가능하면 `pnpm lint`, `pnpm typecheck`, 관련 테스트

### quality-guard

- findings-first 결과
- 테스트 갭 명시

## 13. 현재 환경 기준 운영 규칙

- 로컬 개발만 진행한다.
- GitHub 연결, PR 생성, Vercel 배포는 착수 범위에서 제외한다.
- `.codex/get-shit-done` 내부 파일은 수정하지 않는다.
- Next.js 판단은 `next-best-practices`를 우선한다.
- UI 방향은 `frontend-design`을 우선하고 `UI UX Pro Max`는 보조로 쓴다.
- 품질 점검은 `accessibility-a11y`, `security-best-practices`를 기준으로 본다.

## 14. MCP 사용 기준

현재 기준으로 서브에이전트가 활용할 수 있는 MCP:

- `sequential-thinking`
- `playwright`
- 프로젝트 로컬 `.mcp.json`의 `filesystem`, `next-devtools`

우선 사용 기준:

- 긴 사고 분해: `sequential-thinking`
- 브라우저 상호작용 검증: `playwright`
- Next.js 런타임/에러 추적: `next-devtools`
- 파일 구조 보조 탐색: `filesystem`

권장 해석:

- planner가 애매한 문제를 자를 때 `sequential-thinking`
- UI architect와 quality guard가 브라우저 상태를 확인할 때 `playwright`
- feature builder가 런타임 문제를 추적할 때 `next-devtools`

## 15. 트러블슈팅

### 에이전트가 안 보이는 경우

- Codex를 재시작한다.
- `.codex/config.toml`에 에이전트 등록이 있는지 확인한다.

### 범위가 계속 커지는 경우

- `phoneshop-kickoff-planner`로 다시 범위를 자른다.
- “이번 작업에서 제외할 것”을 반드시 명시한다.

### UI와 구현이 자꾸 충돌하는 경우

- `phoneshop-ui-architect`와 `phoneshop-feature-builder`의 파일 소유권을 분리한다.
- 구조 결정 후 구현으로 넘긴다.

### 리뷰가 추상적인 경우

- `phoneshop-quality-guard` 호출 시 “버그/접근성/누락 테스트 우선”을 명시한다.
- 검토 대상 파일을 같이 준다.

## 16. 빠른 시작 요약

가장 실전적인 기본 흐름:

1. `phoneshop-kickoff-planner`로 첫 슬라이스 정리
2. `phoneshop-ui-architect`로 화면 구조 정리
3. `phoneshop-feature-builder`로 구현
4. `phoneshop-quality-guard`로 검수

한 줄 기준:

`PhoneShop`은 planner가 범위를 자르고, UI architect가 구조를 정하고, builder가 구현하고, quality guard가 리스크를 잡는 방식으로 착수한다.
