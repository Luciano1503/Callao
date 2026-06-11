package com.callao.backend.modules.users.web;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.callao.backend.modules.users.application.UserService;
import com.callao.backend.modules.users.dto.CreateUserRequest;
import com.callao.backend.modules.users.dto.UpdateUserRequest;
import com.callao.backend.modules.users.dto.UserResponse;
import com.callao.backend.shared.api.ApiResponse;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

	private final UserService userService;

	@GetMapping
	public ResponseEntity<ApiResponse<List<UserResponse>>> findAll() {
		return ResponseEntity.ok(ApiResponse.ok("Usuarios encontrados.", userService.findAll()));
	}

	@PostMapping
	public ResponseEntity<ApiResponse<UserResponse>> create(@Valid @RequestBody CreateUserRequest request) {
		return ResponseEntity.ok(ApiResponse.ok("Usuario registrado correctamente.", userService.create(request)));
	}

	@DeleteMapping("/{userId}")
	public ResponseEntity<ApiResponse<UserResponse>> deactivate(@PathVariable Long userId) {
		return ResponseEntity.ok(ApiResponse.ok("Usuario dado de baja correctamente.", userService.deactivate(userId)));
	}

	@PutMapping("/{userId}")
	public ResponseEntity<ApiResponse<UserResponse>> update(
			@PathVariable Long userId,
			@Valid @RequestBody UpdateUserRequest request) {
		return ResponseEntity.ok(ApiResponse.ok("Usuario actualizado correctamente.", userService.update(userId, request)));
	}
}
