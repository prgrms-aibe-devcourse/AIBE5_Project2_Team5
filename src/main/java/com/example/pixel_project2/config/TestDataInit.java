package com.example.pixel_project2.config;

import com.example.pixel_project2.common.entity.*;
import com.example.pixel_project2.common.entity.enums.*;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;

@Component
@Profile("local")
@RequiredArgsConstructor
public class TestDataInit implements ApplicationRunner {

    private final EntityManager em;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        // 이미 데이터가 있는지 확인 (재실행 시 중복 생성 방지)
        Long count = em.createQuery("SELECT COUNT(u) FROM User u", Long.class).getSingleResult();
        if (count > 0) {
            return;
        }

        String encodedPassword = passwordEncoder.encode("password123!");

        // 디자이너 데이터 정의 (분야별 5명)
        String[][] designersInfo = {
                {"UIUX_Master", "박준서", "사용자를 생각하는 따뜻한 UI/UX", "UI_UX", "https://i.pravatar.cc/150?u=21", "UI 디자이너"},
                {"Logo_Maker", "김지은", "미니멀하고 현대적인 감각의 브랜드 설계", "GRAPHIC_DESIGN", "https://i.pravatar.cc/150?u=22", "브랜드 디자이너"},
                {"Illust_God", "김태영", "스토리와 따뜻함을 담은 일러스트레이터", "ILLUSTRATION", "https://i.pravatar.cc/150?u=23", "일러스트레이터"},
                {"3D_Creator", "최민수", "비주얼의 한계를 넘어, 3D 크리에이터", "THREED_ART", "https://i.pravatar.cc/150?u=24", "3D 아티스트"},
                {"Photo_Magic", "이수진", "순간의 찰나를 영원히 남기는 포토그래퍼", "PHOTOGRAPHY", "https://i.pravatar.cc/150?u=25", "포토그래퍼"}
        };

        // 각 디자이너별 작업물 피드 제목 패턴 (5개씩)
        String[][] feedTitles = {
                // 박준서 (UI_UX)
                {"모바일 금융 앱 리디자인 프로젝트", "미니멀 투두웹 UI 기획", "글로벌 커머스 플랫폼 UX 설계", "헬스케어 서비스 대시보드", "웨어러블 스마트워치 인터페이스"},
                // 김지은 (GRAPHIC_DESIGN)
                {"Electric Mint 브랜딩 프로젝트", "스타트업 기업 아이덴티티 통합", "로컬 카페 시즌 패키징 디자인", "자연친화적 뷰티 브랜드 로고 제작", "IT 컨퍼런스 메인 포스터 디자인"},
                // 김태영 (ILLUSTRATION)
                {"어느 봄날의 오후 (Digital Art)", "동화책 '작은 별' 삽화 작업물", "매거진 B 커버 일러스트 연재", "도심 속 오아시스 컨셉 아트", "반려동물 캐릭터 디자인 시리즈"},
                // 최민수 (THREED_ART)
                {"Cyberpunk 2077 팬아트 3D 모델링", "미래형 스마트홈 인테리어 렌더링", "메타버스 아바타 모션 에셋", "게임 컨셉 무기 3D 조형", "초현실주의 3D 풍경화"},
                // 이수진 (PHOTOGRAPHY)
                {"비오는 날의 도쿄 거리 스냅", "매거진 룩북 패션 포토그래피", "흑백으로 담은 서울의 야경", "제품 광고 사진: 커피 원두 스튜디오컷", "아프리카 사바나 야생동물 다큐멘터리"}
        };

        for (int i = 0; i < designersInfo.length; i++) {
            String loginId = designersInfo[i][0];
            String nickname = designersInfo[i][1];
            String intro = designersInfo[i][2];
            Category category = Category.valueOf(designersInfo[i][3]);
            String profileUrl = designersInfo[i][4];
            String jobTitle = designersInfo[i][5];

            // 1. 유저 계정 생성
            User user = User.builder()
                    .loginId(loginId)
                    .password(encodedPassword)
                    .nickname(nickname)
                    .name(nickname)
                    .profileImage(profileUrl)
                    .role(UserRole.DESIGNER)
                    .provider(Provider.LOCAL)
                    .followCount((int) (Math.random() * 500) + 50)
                    .build();
            em.persist(user);

            // 2. 디자이너 상세 정보 생성
            Designer designer = Designer.builder()
                    .user(user)
                    .job(jobTitle)
                    .introduction(intro)
                    .rating((float) (Math.round((Math.random() * 1.5 + 3.5) * 10) / 10.0)) // 3.5 ~ 5.0
                    .workStatus(WorkStatus.AVAILABLE)
                    .workType(WorkType.FREELANCER)
                    .build();
            em.persist(designer);

            // 3. 포트폴리오 피드 5개씩 생성
            for (int j = 0; j < 5; j++) {
                String title = feedTitles[i][j];
                String description = title + "에 대한 상세 설명입니다. " + intro + " 컨셉을 바탕으로 제작된 고퀄리티 포트폴리오 프로젝트입니다.";

                Post post = Post.builder()
                        .user(user)
                        .title(title)
                        .pickCount((int) (Math.random() * 450) + 50) // 50 ~ 500
                        .postType(PostType.PORTFOLIO)
                        .category(category)
                        .images(new ArrayList<>())
                        .build();

                // 4. 게시물 이미지 연결 (picsum 사용, 매번 다른 이미지)
                PostImage postImage = PostImage.builder()
                        .post(post)
                        .imageUrl("https://picsum.photos/seed/" + loginId + "_" + j + "/800/600")
                        .sortOrder(1)
                        .build();
                post.getImages().add(postImage);
                
                em.persist(post);

                // 5. [NEW] Feed 상세 정보 생성 (설명글 포함)
                Feed feed = Feed.builder()
                        .post(post)
                        .description(description)
                        .portfolioUrl("https://behance.net/gallery/" + (int)(Math.random() * 1000000))
                        .build();
                em.persist(feed);
            }
        }
        
        System.out.println("============== 픽셀(Pickxel) 로컬 시스템 ==============");
        System.out.println("=> [TestDataInit] 테스트용 디자이너 5명 및 피드 25개 생성 완료!");
        System.out.println("=====================================================");
    }
}
