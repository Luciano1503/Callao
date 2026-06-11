package com.callao.backend.modules.evaluator_circuit.dto;

import java.util.List;

public record EvaluatorSheetDetailResponse(
	EvaluatorSheetSummaryResponse ficha,
	List<EvaluatorVeedorReviewResponse> revisiones
) {
}
