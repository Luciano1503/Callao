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

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

	private final AuthService authService;

	@PostMapping("/login")
	public ResponseEntity<ApiResponse<LoginResponse>> login(@Valid @RequestBody LoginRequest request) {
		return ResponseEntity.ok(ApiResponse.ok("Inicio de sesion correcto.", authService.login(request)));
	}

	@PostMapping("/change-password")
	public ResponseEntity<ApiResponse<Void>> changePassword(@Valid @RequestBody ChangePasswordRequest request) {
		authService.changePassword(request);
		return ResponseEntity.ok(ApiResponse.ok("Contrasena actualizada correctamente.", null));
	}
}
