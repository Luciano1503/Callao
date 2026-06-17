package com.callao.backend.modules.final_review.dto;

import java.time.LocalDateTime;

public record FinalReviewGroupResponse(
	Long id,
	Integer numeroGrupo,
	Long colorId,
	String colorNombre,
	String colorHex,
	String estado,
	Integer totalEvaluados,
	LocalDateTime registradoEn,
	String observaciones
) {
}
