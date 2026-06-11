package com.callao.backend.modules.supervisor_evaluados.dto;

import java.time.LocalDateTime;

public record EvaluatedGroupSummaryResponse(
	Long id,
	Integer numeroGrupo,
	String colorNombre,
	String colorHex,
	String estado,
	Integer totalEvaluados,
	LocalDateTime registradoEn
) {
}
