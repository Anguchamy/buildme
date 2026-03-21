package com.buildme.repository;

import com.buildme.model.Subscription;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SubscriptionRepository extends JpaRepository<Subscription, Long> {
    Optional<Subscription> findByWorkspaceId(Long workspaceId);
    Optional<Subscription> findByRazorpaySubscriptionId(String razorpaySubscriptionId);
}
