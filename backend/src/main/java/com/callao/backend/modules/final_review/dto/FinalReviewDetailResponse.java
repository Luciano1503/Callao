package com.callao.backend.modules.final_review.dto;

import java.util.List;

import java.util.Map;

public record FinalReviewDetailResponse(
	FinalReviewGroupResponse grupo,
	List<FinalReviewPersonResponse> evaluados,
	Map<String, String> observacionesVeedores
) {
}
