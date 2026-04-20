package com.example.pixel_project2.explore.service;

import com.example.pixel_project2.explore.dto.DesignerPostCount;
import com.example.pixel_project2.explore.dto.ExplorePolicyResponse;
import com.example.pixel_project2.explore.repository.ExplorerRepository;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ExploreServiceImpl implements ExploreService {
    private final ExplorerRepository explorerRepository;

    @Override
    public ExplorePolicyResponse getExplorePolicy() {
        return new ExplorePolicyResponse(true, true, true);
    }

    @Override
    @Transactional(readOnly = true)
    public List<DesignerPostCount> getDesignerListWithPostCount() {
        // Repository에서 작성한 JPQL/SQL COUNT 쿼리를 호출하여 결과 반환
        return explorerRepository.findDesignersWithPostCount();
    }
}
