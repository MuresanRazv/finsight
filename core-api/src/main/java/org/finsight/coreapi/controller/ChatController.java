package org.finsight.coreapi.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.finsight.coreapi.dto.ChatRequestDto;
import org.finsight.coreapi.dto.RichChatResponseDto;
import org.finsight.coreapi.service.ChatService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;

    @PostMapping
    public ResponseEntity<RichChatResponseDto> chat(@Valid @RequestBody ChatRequestDto request) {
        return ResponseEntity.ok(chatService.processChatQuery(request));
    }
}
