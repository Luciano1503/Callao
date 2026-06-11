package com.callao.backend.modules.auth.dto;

import jakarta.validation.constraints.NotBlank;

public record LoginRequest(
	@NotBlank(message = "Ingrese su correo o DNI.")
	String usuario,

	@NotBlank(message = "Ingrese su contrasena.")
	String password
) {
}
