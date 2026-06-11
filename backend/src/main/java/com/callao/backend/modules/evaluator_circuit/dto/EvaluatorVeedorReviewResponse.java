package com.callao.backend.modules.evaluator_circuit.dto;

import java.time.LocalDateTime;
import java.util.List;

public record EvaluatorVeedorReviewResponse(
	String tipoVeedorCodigo,
	String tipoVeedorNombre,
	Long fichaId,
	Long detalleId,
	Long veedorId,
	String veedorNombre,
	String estadoFicha,
	String observacionesFicha,
	String observacionEvaluado,
	LocalDateTime registradoEn,
	LocalDateTime actualizadoEn,
	List<EvaluatorCriterionResponse> habilidades,
	List<EvaluatorCriterionResponse> reglamentos
) {
}
