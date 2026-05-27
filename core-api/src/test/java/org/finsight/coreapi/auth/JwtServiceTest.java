package org.finsight.coreapi.auth;

import io.jsonwebtoken.Claims;
import org.finsight.coreapi.user.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Date;

import static org.assertj.core.api.Assertions.assertThat;

class JwtServiceTest {

    private JwtService jwtService;
    private User user;
    private String secretKey = "404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970"; // 256-bit key

    @BeforeEach
    void setUp() {
        jwtService = new JwtService();
        ReflectionTestUtils.setField(jwtService, "secretKey", secretKey);
        ReflectionTestUtils.setField(jwtService, "jwtExpiration", 3600000L); // 1 hour
        ReflectionTestUtils.setField(jwtService, "refreshExpiration", 604800000L); // 7 days

        user = User.builder()
                .email("test@example.com")
                .build();
    }

    @Test
    void generateToken_ShouldReturnValidToken() {
        String token = jwtService.generateToken(user);
        
        assertThat(token).isNotNull();
        assertThat(jwtService.extractUsername(token)).isEqualTo("test@example.com");
    }

    @Test
    void isTokenValid_ShouldReturnTrue_ForValidToken() {
        String token = jwtService.generateToken(user);
        
        assertThat(jwtService.isTokenValid(token, user)).isTrue();
    }

    @Test
    void isTokenValid_ShouldReturnFalse_ForDifferentUser() {
        String token = jwtService.generateToken(user);
        User otherUser = User.builder().email("other@example.com").build();
        
        assertThat(jwtService.isTokenValid(token, otherUser)).isFalse();
    }

    @Test
    void generateRefreshToken_ShouldReturnValidToken() {
        String token = jwtService.generateRefreshToken(user);
        
        assertThat(token).isNotNull();
        assertThat(jwtService.extractUsername(token)).isEqualTo("test@example.com");
    }

    @Test
    void extractExpiration_ShouldReturnCorrectDate() {
        String token = jwtService.generateToken(user);
        Date expiration = jwtService.extractExpiration(token);
        
        assertThat(expiration).isAfter(new Date());
    }
}
