package com.callao.backend.modules.supervisor_evaluados.dto;

import java.time.LocalDateTime;

import jakarta.validation.constraints.NotNull;

public record UpdateGroupDateRequest(
	@NotNull(message = "El supervisor es obligatorio.")
	Long supervisorId,

	@NotNull(message = "La fecha y hora de registro es obligatoria.")
	LocalDateTime registradoEn
) {
}
