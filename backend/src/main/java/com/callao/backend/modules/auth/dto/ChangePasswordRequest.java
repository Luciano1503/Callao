package com.callao.backend.modules.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record ChangePasswordRequest(
	@NotNull(message = "El usuario es obligatorio.")
	Long usuarioId,

	@NotBlank(message = "La contrasena antigua es obligatoria.")
	String oldPassword,

	@NotBlank(message = "La contrasena nueva es obligatoria.")
	@Size(min = 6, max = 72, message = "La contrasena nueva debe tener entre 6 y 72 caracteres.")
	String newPassword,

	@NotBlank(message = "La confirmacion de contrasena es obligatoria.")
	String confirmNewPassword
) {
}
