package com.ridgerunner.api;

import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class RaceController {
    private final RaceResultRepository results;

    public RaceController(RaceResultRepository results) {
        this.results = results;
    }

    @GetMapping("/health")
    public Map<String, String> health() {
        return Map.of("status", "ok", "service", "ridge-runner-api");
    }

    @GetMapping("/leaderboard")
    public List<RaceResult> leaderboard() {
        return results.findTop10ByOrderByDistanceMetersDescDurationSecondsAscCreatedAtAsc();
    }

    @PostMapping("/races")
    @ResponseStatus(HttpStatus.CREATED)
    public RaceResult submitRace(@Valid @RequestBody RaceSubmission submission) {
        return results.save(new RaceResult(
                submission.playerName().trim(),
                submission.distanceMeters(),
                submission.coins(),
                submission.durationSeconds()));
    }
}