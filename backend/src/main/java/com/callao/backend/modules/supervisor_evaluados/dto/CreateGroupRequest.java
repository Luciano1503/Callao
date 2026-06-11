package com.callao.backend.modules.supervisor_evaluados.dto;

import jakarta.validation.constraints.NotNull;

public record CreateGroupRequest(
	@NotNull(message = "El supervisor es obligatorio.")
	Long supervisorId,

	Long colorId
) {
}
