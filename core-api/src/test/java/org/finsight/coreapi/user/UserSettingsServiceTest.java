package org.finsight.coreapi.user;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserSettingsServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private ObjectMapper objectMapper;

    @InjectMocks
    private UserSettingsService userSettingsService;

    private User user;
    private UserSettingsDto settingsDto;
    private JsonNode settingsJson;

    @BeforeEach
    void setUp() {
        settingsDto = new UserSettingsDto(List.of("AAPL", "TSLA"));
        settingsJson = mock(JsonNode.class);
        user = User.builder()
                .id(1)
                .email("john.doe@example.com")
                .settings(settingsJson)
                .build();
    }

    @Test
    void getUserSettings_ShouldReturnSettings_WhenUserExists() {
        when(userRepository.findByEmail("john.doe@example.com")).thenReturn(Optional.of(user));
        when(objectMapper.convertValue(settingsJson, UserSettingsDto.class)).thenReturn(settingsDto);

        UserSettingsDto result = userSettingsService.getUserSettings("john.doe@example.com");

        assertThat(result).isEqualTo(settingsDto);
        verify(userRepository).findByEmail("john.doe@example.com");
        verify(objectMapper).convertValue(settingsJson, UserSettingsDto.class);
    }

    @Test
    void updateUserSettings_ShouldUpdateSettings_WhenUserExists() {
        when(userRepository.findByEmail("john.doe@example.com")).thenReturn(Optional.of(user));
        when(objectMapper.valueToTree(settingsDto)).thenReturn(settingsJson);

        userSettingsService.updateUserSettings("john.doe@example.com", settingsDto);

        assertThat(user.getSettings()).isEqualTo(settingsJson);
        verify(userRepository).save(user);
    }
}
