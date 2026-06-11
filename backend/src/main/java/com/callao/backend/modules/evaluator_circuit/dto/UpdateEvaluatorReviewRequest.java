package com.callao.backend.modules.evaluator_circuit.dto;

import java.util.List;

import jakarta.validation.constraints.NotBlank;

public record UpdateEvaluatorReviewRequest(
	@NotBlank(message = "El tipo de veedor es obligatorio.")
	String tipoVeedorCodigo,

	String observacionEvaluado,
	List<Long> habilidadIds,
	List<Long> reglamentoIds
) {
}
