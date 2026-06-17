package com.callao.backend.modules.final_review.dto;

import java.util.List;

public record FinalReviewVeedorResponse(
	String tipoVeedorCodigo,
	List<FinalReviewCriterionResponse> habilidades,
	List<FinalReviewCriterionResponse> reglamentos
) {
}
