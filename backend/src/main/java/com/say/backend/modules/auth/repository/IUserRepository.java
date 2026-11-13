package com.say.backend.modules.auth.repository;

import com.say.backend.modules.auth.entity.User;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface IUserRepository extends JpaRepository<User, UUID> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
    Optional<User> findByUsername(String username);
    boolean existsByUsername(String username);
    boolean existsByUsernameAndIdNot(String username, UUID id);

    @Query("SELECT u FROM User u WHERE " +
           "(LOWER(u.displayName) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "OR LOWER(COALESCE(u.username, '')) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "OR LOWER(u.email) LIKE LOWER(CONCAT('%', :query, '%'))) " +
           "AND (:excludeUserId IS NULL OR u.id <> :excludeUserId) " +
           "ORDER BY u.displayName ASC")
    List<User> searchUsers(@Param("query") String query, @Param("excludeUserId") UUID excludeUserId, Pageable pageable);
}
