package com.callao.backend.modules.health.web;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.callao.backend.modules.health.application.HealthService;
import com.callao.backend.modules.health.dto.HealthResponse;
import com.callao.backend.shared.api.ApiResponse;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/health")
@RequiredArgsConstructor
public class HealthController {

	private final HealthService healthService;

	@GetMapping
	public ResponseEntity<ApiResponse<HealthResponse>> getStatus() {
		return ResponseEntity.ok(ApiResponse.ok("Servicio disponible.", healthService.getStatus()));
	}
}
