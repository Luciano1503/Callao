package com.callao.backend.modules.evaluator_circuit.dto;

import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;

public record UpdateEvaluatorSheetRequest(
	@NotNull(message = "El evaluador es obligatorio.")
	Long evaluadorId,

	String observaciones,

	@Valid
	List<UpdateEvaluatorReviewRequest> revisiones
) {
}
