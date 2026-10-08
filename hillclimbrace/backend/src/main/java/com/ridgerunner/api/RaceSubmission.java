package com.ridgerunner.api;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RaceSubmission(
        @NotBlank @Size(max = 24) String playerName,
        @Min(1) @Max(520) int distanceMeters,
        @Min(0) @Max(20) int coins,
        @Min(1) @Max(3600) int durationSeconds) {
}