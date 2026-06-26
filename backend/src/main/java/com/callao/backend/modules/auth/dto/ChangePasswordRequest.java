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
	@Size(min = 8, max = 72, message = "La contrasena nueva debe tener entre 8 y 72 caracteres.")
	@jakarta.validation.constraints.Pattern(regexp = "^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%^&+=!_\\-]).{8,}$", message = "La contraseña debe contener al menos una letra mayúscula, minúscula, carácter especial y números.")
	String newPassword,

	@NotBlank(message = "La confirmacion de contrasena es obligatoria.")
	String confirmNewPassword
) {
}
