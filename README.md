# Pixel

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
- [**기능명세서**](https://docs.google.com/document/d/1NF72_1mwEQ3hJ8Z-Mnz5tXwjF_DNuQDbSoFgbxPNnLY/edit?tab=t.0)
- [**ERD**](https://www.erdcloud.com/d/DwiHC3dKiuFQnvyha)

## 🛠 기술 스택

| **구분** | **기술** |
|---|---|
| **Frontend** | React, TypeScript, Vite, Tailwind CSS, CSS, React Router |
| **UI / UX** | Radix UI, Lucide React, MUI, Figma |
| **Backend** | Java 21, Spring Boot, Spring Data JPA, Spring Security, Spring Validation, Spring WebSocket |
| **Auth** | JWT, OAuth2, Google Login, Kakao Login |
| **AI** | Google Gemini API, RAG (Retrieval-Augmented Generation) |
| **Database** | Oracle Database, H2 Database (테스트용) |
| **Storage** | Cloudflare R2 |
| **Infra / SDK** | AWS SDK S3 (Cloudflare R2 연동) |
| **Build Tool** | Gradle |
| **Test** | JUnit 5, Spring Boot Test, Spring Security Test |
| **Collaboration** | Figma, Notion |

#### ♣️ Backend
- Java 21
- Spring Boot
- Spring Data JPA
- Spring Security
- Spring Validation
- Spring WebSocket

#### ♠️ DataBase
- Oracle Database
- H2 Database (테스트용)

#### ♥️ Build Tool
- Gradle

#### ♦️ Frontend
- React
- TypeScript
- Vite
- Tailwind CSS
- CSS
- React Router

#### 🧩 Auth
- JWT
- OAuth2
- Google Login
- Kakao Login

#### 🤖 AI
- Google Gemini API
- RAG (Retrieval-Augmented Generation)

#### ☁️ Storage
- Cloudflare R2
- AWS SDK S3 (R2 연동)

#### 🧪 Test
- JUnit 5
- Spring Boot Test
- Spring Security Test

#### 🛠 기타
- Lombok
- DevTools
- Validation
- Radix UI
- Lucide React
- MUI
- Figma
- Notion

## 👥 팀원 소개

| 이름  | 역할 | 담당 기능 |
|-----|----|-------|
| 고완석 | 팀장 |       |
| 이소연 | 팀원 |       |
| 정재운 | 팀원 |       |
| 김재준 | 팀원 |       |

## ✨ 주요 기능

### 1️⃣ 개인화된 메인 피드
- 사용자는 디자이너들의 포트폴리오를 피드 방식으로 볼 수 있다
- 유저의 팔로우 목록을 기반으로 선호하는 디자이너의 최신 게시물을 우선적으로 노출하는 로직 구현

### 2️⃣ 카테고리 기반 탐색
- 그래픽 디자인, 포토그래피, 일러스트레이션, 3D Art 등 카테고리별 디자인을 실시간으로 탐색 가능

### 3️⃣ 폴더형 컬렉션 시스템
- 사용자가 직접 폴더를 생성하고 관심 있는 포스트를 분류하여 저장할 수 있는 아카이빙 기능

### 4️⃣ 실시간 채팅방
- 고객과 디자이너는 실시간으로 대화방에서 연락하며 협업할 수 있는 커뮤니케이션 가능

### 5️⃣ 디자인 공고 및 의뢰
- 클라이언트가 구인 공고(projects/new)를 올리고 디자이너가 이를 지원하는 프로젝트 매칭 시스템


## 📂 디렉토리 구조
```Markdown
pixel_project2/
├─ config/                  
│      
├─ common/
│ ├─ enums/                 
│
├─ controller/               
│
├─ service/                 
│ └─ impl/                 
│
├─ Entity/                   
│
└─ DTO/                      
│
└─ Repository/
```


## 🤝 Team Convention

### 🔹 커밋 규칙

본 프로젝트는 커밋 메시지를 통해 **작업 내용과 변경 이력을 명확히 파악**할 수 있도록 아래 규칙을 따릅니다.

### 📌 커밋 메시지 기본 형식

```text
[기능분류]: [작성내용] - [날짜]
```

- **기능분류:** 작업의 성격
- **수정/작성내용:** 추가·수정한 작업 내용을 간단히 요약
- **수정/작성일:** 작업을 완료한 날짜 (YYYY-MM-DD)

#### 기능분류(Type)

| 타입     | 의미         |
|--------|------------|
| feat   | 새로운 기능 추가  |
| docs   | 문서 작성 / 수정 |
| fix    | 버그 수정      |
| refact | 코드 리팩토링    |

### Commit 규칙 상세

```text
[기능분류]: [파일명] - [작업내용] - [날짜]
```

- 작성내용 앞에 작업한 파일명 명시
- 작업내용을 중심으로 간단히 작성

```text
# 예시
git commit -m "feat: Login/index.js - 로그인 추가 - 26.01.22"
git commit -m "feat: components/Header.js - 헤더구현 - 26.01.22"
git commit -m "feat: component/Header.js, Home/index.js - 헤더로 메인화면 돌아가는 기능 구현 - 26.01.22"
```

---

### 🔹 브랜치 전략

본 프로젝트는 아래와 같은 브랜치 구조를 사용합니다.

#### 📌 브랜치 구조

```text
main      (배포 브랜치)
 ↑
feature   (통합 브랜치)
 ↑
t1 ~ t7   (작업 브랜치)
```

#### 📌 Pull Request(PR) 정책

본 프로젝트는 안정적인 코드 통합과 배포를 위해  
Pull Request 기반 협업 방식을 사용합니다.

##### **main 브랜치**
    - 배포 전용 브랜치로 사용한다.
    - **팀장만 push 및 merge 권한**을 가진다.
    - 개인 작업 및 직접적인 수정은 금지한다.

##### **feature 브랜치**
    - 작업 브랜치에서 작업한 내용을 통합하는 브랜치이다.
    - 작업 브랜치에서 직접 main으로의 push는 불가하다.
    - 반드시 Pull Request(PR)를 통해서만 병합할 수 있다.
    - PR은 팀장의 승인으로만 merge 가능하다.

##### **기능별 브랜치**
    - 각 팀원은 본인에게 할당된 브랜치에서만 작업한다.
    - 작업 완료 되면 feature 브랜치를 대상으로 PR을 생성한다.

#### 📌 Pull Request 진행 절차

1. 기능별 브랜치에서 기능 개발을 진행한다.
2. 작업 완료 후 **feature 브랜치를 대상으로 <br>Pull Request를 생성**한다.
3. PR에는 작업 내용 및 변경 사항을 간단히 설명한다.
4. 팀장이 PR을 리뷰하고 승인(Approve)한다.
5. 승인 완료 후 feature 브랜치에 병합된다.

#### 📌 브랜치 보호 규칙

- **main, feature 브랜치는 보호 브랜치로 설정**한다.
- 보호 브랜치에는 다음 규칙을 적용한다.
    - 직접 push 금지
    - Pull Request 없이 merge 금지
    - 팀장 승인 필수
    - 오류가 존재하는 코드 merge 금지

--- 

### 🔹 트러블 슈팅 & 해결 방식

| 문제상황 | 원인 | 해결방법 |
|------|----|------|
|      |    |      |
|      |    |      |
|      |    |      |
|      |    |      |


---

## 협업 가이드
1. 백엔드팀
