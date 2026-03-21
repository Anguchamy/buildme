package com.buildme.dto.response;

import java.util.List;

public record AICaptionResponse(
    List<String> captions,
    List<String> suggestedHashtags,
    String bestTimeToPost
) {}
