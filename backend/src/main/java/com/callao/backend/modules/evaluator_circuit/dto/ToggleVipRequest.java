package com.callao.backend.modules.evaluator_circuit.dto;

import jakarta.validation.constraints.NotNull;

public record ToggleVipRequest(
	@NotNull(message = "El evaluador es obligatorio.")
	Long evaluadorId,

	boolean esVip
) {
}
