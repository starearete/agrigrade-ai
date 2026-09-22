package com.agrigrade.chat.repository;

import com.agrigrade.chat.entity.Conversation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ConversationRepository extends JpaRepository<Conversation, Long> {

    Optional<Conversation> findByPublicId(String publicId);

    @Query("SELECT c FROM Conversation c WHERE (c.farmer.id = :userId OR c.buyer.id = :userId) AND c.status = 'ACTIVE' ORDER BY c.lastMessageAt DESC NULLS LAST, c.createdAt DESC")
    List<Conversation> findAllByUserId(@Param("userId") Long userId);

    @Query("SELECT c FROM Conversation c WHERE c.farmer.id = :farmerId AND c.buyer.id = :buyerId AND c.status = 'ACTIVE'")
    Optional<Conversation> findActiveConversationBetween(@Param("farmerId") Long farmerId, @Param("buyerId") Long buyerId);

    // Backward-compatible lookup for existing callers
    default Optional<Conversation> findActiveConversation(Long farmerId, Long buyerId, Long listingId) {
        return findActiveConversationBetween(farmerId, buyerId);
    }
}
