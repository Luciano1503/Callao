package com.callao.backend.modules.supervisor_evaluados.dto;

import jakarta.validation.constraints.NotNull;

public record UpdateGroupColorRequest(
	@NotNull(message = "El supervisor es obligatorio.")
	Long supervisorId,

	@NotNull(message = "El color es obligatorio.")
	Long colorId
) {
}
