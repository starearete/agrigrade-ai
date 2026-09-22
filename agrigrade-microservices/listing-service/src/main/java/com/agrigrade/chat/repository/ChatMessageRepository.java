package com.agrigrade.chat.repository;

import com.agrigrade.chat.entity.ChatMessage;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {

    Optional<ChatMessage> findByPublicId(String publicId);

    Optional<ChatMessage> findBySenderIdAndClientMessageId(Long senderId, String clientMessageId);

    @Query("SELECT m FROM ChatMessage m WHERE m.conversation.id = :conversationId ORDER BY m.sentAt ASC, m.id ASC")
    List<ChatMessage> findByConversationIdOrderBySentAtAsc(@Param("conversationId") Long conversationId);

    @Query("SELECT m FROM ChatMessage m WHERE m.conversation.id = :conversationId ORDER BY m.sentAt DESC, m.id DESC")
    List<ChatMessage> findLatestMessagesByConversationId(@Param("conversationId") Long conversationId, Pageable pageable);

    @Query("SELECT m FROM ChatMessage m WHERE m.conversation.id = :conversationId AND m.id < :beforeId ORDER BY m.sentAt DESC, m.id DESC")
    List<ChatMessage> findOlderMessagesByConversationId(@Param("conversationId") Long conversationId, @Param("beforeId") Long beforeId, Pageable pageable);

    @Query("SELECT COUNT(m) FROM ChatMessage m WHERE m.recipient.id = :userId AND m.status != 'READ'")
    long countTotalUnreadByUserId(@Param("userId") Long userId);

    @Query("SELECT COUNT(m) FROM ChatMessage m WHERE m.conversation.id = :conversationId AND m.recipient.id = :userId AND m.status != 'READ'")
    long countUnreadByConversationAndUserId(@Param("conversationId") Long conversationId, @Param("userId") Long userId);

    @Modifying
    @Query("UPDATE ChatMessage m SET m.status = 'DELIVERED', m.deliveredAt = :now WHERE m.recipient.id = :userId AND m.status = 'SENT'")
    int markAllSentAsDeliveredForUser(@Param("userId") Long userId, @Param("now") LocalDateTime now);

    @Modifying
    @Query("UPDATE ChatMessage m SET m.status = 'READ', m.readAt = :now WHERE m.conversation.id = :conversationId AND m.recipient.id = :userId AND m.status != 'READ'")
    int markAllAsReadInConversation(@Param("conversationId") Long conversationId, @Param("userId") Long userId, @Param("now") LocalDateTime now);

    @Modifying
    @Query("DELETE FROM ChatMessage m WHERE m.conversation.id = :conversationId")
    int deleteByConversationId(@Param("conversationId") Long conversationId);
}
