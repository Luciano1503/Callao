package com.callao.backend.modules.final_review.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record FinalizeEvaluationRowRequest(
	@NotNull(message = "El evaluado es obligatorio.")
	Long evaluadoId,

	@NotBlank(message = "El resultado es obligatorio.")
	String resultadoFinal
) {
}
