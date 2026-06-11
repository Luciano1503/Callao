package com.callao.backend.modules.health.dto;

import java.time.Instant;

public record HealthResponse(
	String status,
	String application,
	Instant timestamp
) {
}
