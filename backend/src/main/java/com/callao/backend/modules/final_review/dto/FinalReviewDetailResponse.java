package com.callao.backend.modules.final_review.dto;

import java.util.List;

public record FinalReviewDetailResponse(
	FinalReviewGroupResponse grupo,
	List<FinalReviewPersonResponse> evaluados
) {
}
