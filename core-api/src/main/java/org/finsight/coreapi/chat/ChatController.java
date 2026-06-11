package org.finsight.coreapi.chat;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.finsight.coreapi.chat.ChatRequestDto;
import org.finsight.coreapi.chat.RichChatResponseDto;
import org.finsight.coreapi.chat.ChatService;
import org.finsight.coreapi.user.User;
import org.finsight.coreapi.user.UserRepository;
import org.finsight.coreapi.user.UserUsageLimitService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;
    private final UserRepository userRepository;
    private final UserUsageLimitService userUsageLimitService;

    @PostMapping
    public ResponseEntity<RichChatResponseDto> chat(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody ChatRequestDto request
    ) {
        User user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));
        userUsageLimitService.checkAndIncrementRagQuery(user);
        return ResponseEntity.ok(chatService.processChatQuery(request));
    }
}
