package com.callao.backend.modules.supervisor_evaluados.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record CreateEvaluatedRequest(
	@NotNull(message = "El supervisor es obligatorio.")
	Long supervisorId,

	@NotBlank(message = "El DNI es obligatorio.")
	@Pattern(regexp = "\\d{8}", message = "El DNI debe tener 8 digitos.")
	String dni,

	@NotBlank(message = "Los nombres y apellidos son obligatorios.")
	@Size(max = 180, message = "Los nombres y apellidos no deben superar 180 caracteres.")
	String nombres,

	@NotNull(message = "La categoria es obligatoria.")
	Long categoriaId,

	boolean esVip,

	@Size(max = 20, message = "La placa no debe superar 20 caracteres.")
	String placa
) {
}
