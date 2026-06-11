package com.callao.backend.modules.users.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record UpdateUserRequest(
	@NotBlank(message = "Los nombres son obligatorios.")
	@Size(max = 160, message = "Los nombres no deben superar 160 caracteres.")
	String nombres,

	@NotBlank(message = "El correo es obligatorio.")
	@Email(message = "El correo no tiene un formato valido.")
	@Pattern(regexp = "^[^\\s@]+@[^\\s@]+\\.[^\\s@]{2,}$", message = "El correo no tiene un formato valido.")
	@Size(max = 160, message = "El correo no debe superar 160 caracteres.")
	String correo,

	@Pattern(regexp = "^$|\\d{9}$", message = "El celular debe tener 9 digitos.")
	String celular,

	@NotNull(message = "El rol es obligatorio.")
	Long rolId,

	@NotBlank(message = "El estado es obligatorio.")
	String estado
) {
}
