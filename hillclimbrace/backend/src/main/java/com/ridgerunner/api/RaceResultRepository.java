package com.ridgerunner.api;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RaceResultRepository extends JpaRepository<RaceResult, Long> {
    List<RaceResult> findTop10ByOrderByDistanceMetersDescDurationSecondsAscCreatedAtAsc();
}