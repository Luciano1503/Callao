package com.callao.backend.modules.auth.web;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.callao.backend.modules.auth.application.AuthService;
import com.callao.backend.modules.auth.dto.ChangePasswordRequest;
import com.callao.backend.modules.auth.dto.LoginRequest;
import com.callao.backend.modules.auth.dto.LoginResponse;
import com.callao.backend.shared.api.ApiResponse;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.Bandwidth;
import java.time.Duration;
import java.util.concurrent.ConcurrentHashMap;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

	private final AuthService authService;
	private final ConcurrentHashMap<String, Bucket> loginBuckets = new ConcurrentHashMap<>();

	public AuthController(AuthService authService) {
		this.authService = authService;
	}

	private Bucket resolveBucket(String ip) {
		return loginBuckets.computeIfAbsent(ip, k -> {
			Bandwidth limit = Bandwidth.classic(5, io.github.bucket4j.Refill.greedy(5, Duration.ofMinutes(1)));
			return Bucket.builder().addLimit(limit).build();
		});
	}

	@PostMapping("/login")
	public ResponseEntity<ApiResponse<LoginResponse>> login(@Valid @RequestBody LoginRequest request, HttpServletRequest httpRequest) {
		Bucket bucket = resolveBucket(httpRequest.getRemoteAddr());
		if (!bucket.tryConsume(1)) {
			return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
				.body(ApiResponse.error("Demasiados intentos. Por favor intente más tarde.", null));
		}
		return ResponseEntity.ok(ApiResponse.ok("Inicio de sesion correcto.", authService.login(request)));
	}

	@PostMapping("/change-password")
	public ResponseEntity<ApiResponse<Void>> changePassword(@Valid @RequestBody ChangePasswordRequest request) {
		authService.changePassword(request);
		return ResponseEntity.ok(ApiResponse.ok("Contrasena actualizada correctamente.", null));
	}
}
