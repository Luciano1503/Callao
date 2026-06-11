package com.callao.backend.modules.supervisor_evaluados.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record FinalizeGroupRequest(
	@NotNull(message = "El supervisor es obligatorio.")
	Long supervisorId,

	@Size(max = 1200, message = "Las observaciones no deben superar 1200 caracteres.")
	String observaciones
) {
}
