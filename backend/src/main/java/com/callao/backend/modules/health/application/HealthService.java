package com.callao.backend.modules.health.application;

import java.time.Instant;

import org.springframework.stereotype.Service;

import com.callao.backend.modules.health.dto.HealthResponse;

@Service
public class HealthService {

	public HealthResponse getStatus() {
		return new HealthResponse("UP", "Callao Backend", Instant.now());
	}
}
