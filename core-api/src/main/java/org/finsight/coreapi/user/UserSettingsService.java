package org.finsight.coreapi.user;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.finsight.coreapi.user.User;
import org.finsight.coreapi.user.UserSettingsDto;
import org.finsight.coreapi.user.UserNotFoundException;
import org.finsight.coreapi.user.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserSettingsService {

    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;

    @Transactional(readOnly = true)
    public UserSettingsDto getUserSettings(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UserNotFoundException("User not found with email: " + email));
        return objectMapper.convertValue(user.getSettings(), UserSettingsDto.class);
    }

    @Transactional
    public void updateUserSettings(String email, UserSettingsDto settings) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UserNotFoundException("User not found with email: " + email));
        user.setSettings(objectMapper.valueToTree(settings));
        userRepository.save(user);
    }
}
