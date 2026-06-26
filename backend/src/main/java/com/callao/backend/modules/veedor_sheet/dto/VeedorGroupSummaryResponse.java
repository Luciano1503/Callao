package com.callao.backend.modules.veedor_sheet.dto;

import java.time.LocalDateTime;

public record VeedorGroupSummaryResponse(
	Long id,
	Integer numeroGrupo,
	String colorNombre,
	String colorHex,
	String estado,
	Integer totalEvaluados,
	LocalDateTime registradoEn,
	Boolean veedorFinalizado
) {
}
