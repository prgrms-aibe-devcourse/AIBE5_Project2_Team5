# 🎨 Pickxel (픽셀)

#### 디자이너들이 자신의 포트폴리오를 공유하고,<br>클라이언트가 이를 기반으로 디자인 의뢰를 맡길 수 있는 포트폴리오 기반 매칭 서비스.

## 📌 프로젝트 개요

최근 프리랜서 시장의 성장과 함께 기업 및 개인이 필요로 하는 디자인 작업을 외부 전문가에게 의뢰하는 수요가 증가하고 있다.<br>

그러나 적합한 디자이너를 찾거나, 디자이너가 자신의 역량을 효과적으로 알리는 데에는 여전히 많은 어려움이 존재한다.

이에 본 플랫폼은 디자이너와 의뢰인의 간극을 메우는 것을 목표로 삼았다.<br>
**디자이너는 자신의 포트폴리오, 경력, 전문 분야를 등록하여 자신의 역량을 홍보할 수 있으며,**  
**의뢰인은 프로젝트 요구사항에 맞는 디자이너를 검색하거나 직접 의뢰를 요청할 수 있다.**

또한, 실시간 메시지 기능을 통해 원활한 커뮤니케이션을 지원하고, 프로젝트 진행 상태를 관리할 수 있는 기능을 제공하여 협업의 효율성을 높인다.  
나아가, 사용자 간의 평가 및 리뷰 시스템을 도입하여 신뢰 기반의 생태계를 구축하고자 한다.

본 시스템은 사용자 친화적인 UI/UX와 안정적인 백엔드 구조를 기반으로, 프리랜서 디자이너 시장의 접근성을 높이고,   
양측 모두에게 실질적인 가치를 제공하는 것을 목표로 한다.

## 📌 프로젝트 기획서

- [**Figma**](https://www.figma.com/make/IC81zu8VKW7IRdIqzY8RnE/2%EC%B0%A8-%ED%94%84%EB%A1%9C%EC%A0%9D%ED%8A%B8-2?p=f&t=Auqo3BTwjEZceTea-0&preview-route=%2Fexplore)
- [**Notion**](https://www.notion.so/Team5-4-WTL-3-33e3550b7b5580af99a1f87a2a0e696e?source=copy_link)
- [**기능명세서**](https://docs.google.com/document/d/1NF72_1mwEQ3hJ8Z-Mnz5tXwjF_DNuQDbSoFgbxPNnLY/edit?usp=sharing)
- [**ERD**](https://www.erdcloud.com/d/4WcKC6ute8kiFfm46)

## 🛠 기술 스택 (Tech Stack)

| 분류 | 기술 스택 |
| :--- | :--- |
| **Frontend** | TypeScript, React 18, Vite, Tailwind CSS, Shadcn UI |
| **Backend** | Java 21, Spring Boot, Spring Security (OAuth2), JPA |
| **Real-time** | WebSocket (STOMP), SockJS |
| **Database** | Oracle Database |
| **Build & Tool** | Gradle, Pnpm, Figma |

---

## ✨ 주요 기능 (Key Features)

### 1. 피드형 포트폴리오 (Feed-style Portfolio)
- **가변형 그리드 레이아웃:** `react-responsive-masonry`를 활용하여 디자인 결과물을 핀터레스트 스타일로 시각화.
- **최적화된 렌더링:** `Skeleton UI`와 `Image Fallback` 로직을 통해 안정적인 이미지 로딩 경험 제공.

### 2. 폴더형 컬렉션 (Collections)
- **아카이빙 시스템:** 마음에 드는 디자인을 개인화된 폴더별로 저장하고 관리하는 기능.
- **실시간 UI 동기화:** 커스텀 훅을 통해 앱 전역에서 저장 상태를 즉각적으로 반영.

### 3. 프로젝트 매칭 (Project Matching)
- **정교한 카테고리 필터링:** 디자인 세부 분야별 매칭 알고리즘을 통해 최적의 파트너 연결.
- **위치 및 도구 기반 검색:** 디자이너의 활동 지역 및 보유 기술 스택을 기반으로 한 정밀 검색 지원.

### 4. 실시간 소통 및 알림 (Real-time Messaging)
- **WebSocket 채팅:** STOMP 프로토콜 기반의 양방향 실시간 메시징 시스템 구현.
- **푸시 알림:** 매칭 상태 변경이나 신규 메시지 수신 시 실시간 알림 서비스 제공.

---

## 📂 디렉토리 구조 (Directory Structure)

```markdown
Pickxel/
├── frontend/                # Vite + React 기반 프론트엔드
│   ├── src/
│   │   ├── app/
│   │   │   ├── api/         # Axios 기반 API 통신 모듈
│   │   │   ├── components/  # 공통 컴포넌트 및 Shadcn UI
│   │   │   ├── hooks/       # 비즈니스 로직 분리 (Custom Hooks)
│   │   │   ├── pages/       # 서비스 주요 화면
│   │   │   └── types/       # TypeScript 타입 정의
├── src/main/                # Spring Boot 기반 백엔드
│   ├── java/com/example/    # Java 소스 코드
│   └── resources/
│       ├── db/              # Oracle DB 스키마 및 초기화 SQL
│       └── application.yml  # 서버 설정 파일
└── README.md
```

---

## 💡 트러블 슈팅 (Troubleshooting)
#### 1. WebSocket 연결 안정성 확보
- [문제]
  - 페이지 이동 시 소켓 연결이 빈번하게 끊기는 현상.
- [해결]
  - WebSocket 연결을 전역 Context로 관리하고, 자동 재연결 로직을 적용하여 안정성을 개선했습니다.

#### 2. 소셜 로그인 유저 데이터 통합
- [문제]
  - 로그인 제공자별 식별 체계 차이로 인한 DB 저장 충돌.
- [해결]
  - 유저 테이블에 제공자 정보를 추가하여 식별자 구조를 유연하게 설계하고 데이터를 통합했습니다.

#### 3. 대용량 이미지 렌더링 최적화
- [문제]
  - 고해상도 이미지가 포함된 피드 로딩 시 성능 저하 발생.
- [해결]
  - Lazy Loading 기법과 스켈레톤 UI를 도입하여 초기 로딩 속도와 사용자 체감 성능을 개선했습니다.

---

## 🤝 Team Convention
🔹 커밋 규칙<br>
본 프로젝트는 커밋 메시지를 통해 작업 내용과 변경 이력을 명확히 파악할 수 있도록 아래 규칙을 따릅니다.

```
형식: [기능분류]: [작성내용] - [날짜]
```
[타입]
- feat(기능 추가)
- fix(버그 수정)
- docs(문서 작성)
- refact(리팩토링)
```
예시: feat: messageSocket.ts - 실시간 채팅 추가 - 2026-04-27
```
🔹 브랜치 전략
- main: 배포 전용 브랜치 (팀장만 관리)<br>
- feature: 작업 내용 통합 브랜치 (PR 필수)<br>
- t1 ~ t7: 개인별 기능 작업 브랜치