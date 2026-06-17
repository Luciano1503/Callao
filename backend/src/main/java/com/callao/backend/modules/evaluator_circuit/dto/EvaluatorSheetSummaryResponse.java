package com.callao.backend.modules.evaluator_circuit.dto;

import java.time.LocalDateTime;

public record EvaluatorSheetSummaryResponse(
	Long evaluadoId,
	Long grupoId,
	Integer numeroGrupo,
	String dni,
	String nombres,
	boolean esVip,
	Long categoriaId,
	String categoriaCodigo,
	String categoriaNombre,
	String placa,
	String resultadoFinal,
	String estadoGrupo,
	String estadoFichaCircuito,
	LocalDateTime registradoEn,
	Long evaluadorId,
	String evaluadorNombre,
	String observacionesCircuito,
	LocalDateTime circuitoRegistradoEn,
	LocalDateTime circuitoActualizadoEn
) {
}
