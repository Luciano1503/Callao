package com.callao.backend.modules.supervisor_evaluados.dto;

import java.time.LocalDateTime;

public record EvaluatedPersonResponse(
	Long id,
	Long grupoId,
	Integer numeroFila,
	String dni,
	String nombres,
	String placa,
	Long categoriaId,
	String categoriaCodigo,
	String categoriaNombre,
	String resultadoFinal,
	LocalDateTime creadoEn
) {
}
