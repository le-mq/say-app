package com.say.backend.modules.social.repository;

import com.say.backend.modules.social.entity.Friendship;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface IFriendshipRepository extends JpaRepository<Friendship, UUID> {

    Optional<Friendship> findByRequesterIdAndAddresseeId(UUID requesterId, UUID addresseeId);

    @Query("""
        SELECT f FROM Friendship f
        WHERE (f.requester.id = :userId1 AND f.addressee.id = :userId2)
           OR (f.requester.id = :userId2 AND f.addressee.id = :userId1)
    """)
    Optional<Friendship> findFriendshipBetween(@Param("userId1") UUID userId1, @Param("userId2") UUID userId2);

    List<Friendship> findByAddresseeIdAndStatus(UUID addresseeId, String status);

    @Query("""
        SELECT f FROM Friendship f
        WHERE (f.requester.id = :userId OR f.addressee.id = :userId)
          AND f.status = 'ACCEPTED'
    """)
    List<Friendship> findAllAcceptedFriendships(@Param("userId") UUID userId);

    @Query("""
        SELECT CASE 
            WHEN f.requester.id = :userId THEN f.addressee.id 
            ELSE f.requester.id 
        END
        FROM Friendship f
        WHERE (f.requester.id = :userId OR f.addressee.id = :userId)
          AND f.status = 'ACCEPTED'
    """)
    List<UUID> findAcceptedFriendUserIds(@Param("userId") UUID userId);
}
