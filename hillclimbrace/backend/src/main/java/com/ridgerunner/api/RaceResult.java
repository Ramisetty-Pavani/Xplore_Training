package com.ridgerunner.api;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "race_results")
public class RaceResult {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String playerName;
    private int distanceMeters;
    private int coins;
    private int durationSeconds;
    private Instant createdAt;

    protected RaceResult() {
    }

    public RaceResult(String playerName, int distanceMeters, int coins, int durationSeconds) {
        this.playerName = playerName;
        this.distanceMeters = distanceMeters;
        this.coins = coins;
        this.durationSeconds = durationSeconds;
    }

    @PrePersist
    void setCreatedAt() {
        createdAt = Instant.now();
    }

    public Long getId() {
        return id;
    }

    public String getPlayerName() {
        return playerName;
    }

    public int getDistanceMeters() {
        return distanceMeters;
    }

    public int getCoins() {
        return coins;
    }

    public int getDurationSeconds() {
        return durationSeconds;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}