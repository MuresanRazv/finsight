package org.finsight.coreapi.user;

import org.finsight.coreapi.user.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Integer> {
    Optional<User> findByEmail(String email);
    List<User> findByEmailIn(Collection<String> emails);

    @Query(value = "SELECT * FROM _user u WHERE u.settings -> 'tickers' @> cast(:ticker as jsonb)", nativeQuery = true)
    List<User> findUsersWatchingTicker(@Param("ticker") String ticker);
}
