package com.example.pixel_project2.follow.service;

import com.example.pixel_project2.common.entity.Follow;
import com.example.pixel_project2.common.entity.User;
import com.example.pixel_project2.common.repository.FollowRepository;
import com.example.pixel_project2.common.repository.UserRepository;
import com.example.pixel_project2.config.jwt.AuthenticatedUser;
import com.example.pixel_project2.follow.dto.FollowResponse;
import com.example.pixel_project2.follow.dto.FollowingUserResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.pixel_project2.notification.service.NotificationService;
import com.example.pixel_project2.common.entity.enums.NotificationType;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class FollowServiceImpl implements FollowService {
    private final FollowRepository followRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    @Override
    @Transactional
    public FollowResponse follow(AuthenticatedUser currentUser, Long targetUserId) {
        if (currentUser.id().equals(targetUserId)) {
            throw new IllegalArgumentException("자기 자신은 팔로우할 수 없습니다.");
        }

        User follower = findUser(currentUser.id());
        User following = findUser(targetUserId);

        if (followRepository.countRelation(follower.getId(), following.getId()) == 0) {
            Follow savedFollow = followRepository.save(Follow.builder()
                    .follower(follower)
                    .following(following)
                    .build());
            following.setFollowCount((following.getFollowCount() == null ? 0 : following.getFollowCount()) + 1);

            notificationService.createNotification(
                    following.getId(),
                    follower.getId(),
                    NotificationType.FOLLOW,
                    savedFollow.getFollow_id(),
                    follower.getNickname() + "님이 회원님을 팔로우하기 시작했습니다."
            );
        }

        return buildResponse(follower.getId(), following.getId(), true);
    }

    @Override
    @Transactional
    public FollowResponse unfollow(AuthenticatedUser currentUser, Long targetUserId) {
        if (currentUser.id().equals(targetUserId)) {
            throw new IllegalArgumentException("자기 자신의 팔로우를 취소할 수 없습니다.");
        }

        User following = findUser(targetUserId);
        followRepository.findRelation(currentUser.id(), targetUserId)
                .ifPresent(follow -> {
                    followRepository.delete(follow);
                    following.setFollowCount(Math.max((following.getFollowCount() == null ? 0 : following.getFollowCount()) - 1, 0));
                });

        return buildResponse(currentUser.id(), targetUserId, false);
    }

    @Override
    public List<FollowingUserResponse> getFollowingUsers(AuthenticatedUser currentUser) {
        return followRepository.findFollowingByFollowerId(currentUser.id()).stream()
                .map(Follow::getFollowing)
                .map(user -> FollowingUserResponse.builder()
                        .userId(user.getId())
                        .nickname(user.getNickname())
                        .name(user.getName())
                        .profileImage(user.getProfileImage())
                        .role(user.getRole().name())
                        .build())
                .toList();
    }

    private FollowResponse buildResponse(Long followerId, Long targetUserId, boolean following) {
        return FollowResponse.builder()
                .targetUserId(targetUserId)
                .following(following)
                .followerCount(followRepository.countFollowers(targetUserId))
                .followingCount(followRepository.countFollowing(followerId))
                .build();
    }

    private User findUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
    }
}
