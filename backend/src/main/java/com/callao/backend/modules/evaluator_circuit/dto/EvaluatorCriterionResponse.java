package com.callao.backend.modules.evaluator_circuit.dto;

public record EvaluatorCriterionResponse(
	Long id,
	Integer codigo,
	String siglas,
	String descripcion,
	String tipoCodigo
) {
}
