package com.buildme.repository;

import com.buildme.model.Platform;
import com.buildme.model.SocialAccount;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SocialAccountRepository extends JpaRepository<SocialAccount, Long> {
    List<SocialAccount> findByWorkspaceId(Long workspaceId);
    List<SocialAccount> findByWorkspaceIdAndPlatform(Long workspaceId, Platform platform);
    Optional<SocialAccount> findByWorkspaceIdAndPlatformAndAccountId(Long workspaceId, Platform platform, String accountId);
    List<SocialAccount> findByWorkspaceIdAndConnectedTrue(Long workspaceId);
}
