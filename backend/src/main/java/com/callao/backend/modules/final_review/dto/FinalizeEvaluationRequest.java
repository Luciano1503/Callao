package com.callao.backend.modules.final_review.dto;

import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;

public record FinalizeEvaluationRequest(
	@NotNull(message = "El administrador es obligatorio.")
	Long adminId,

	@Valid
	List<FinalizeEvaluationRowRequest> resultados
) {
}
