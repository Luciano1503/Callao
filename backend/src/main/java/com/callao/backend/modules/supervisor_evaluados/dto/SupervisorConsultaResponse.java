package com.callao.backend.modules.supervisor_evaluados.dto;

import java.time.LocalDateTime;

public record SupervisorConsultaResponse(
	Long id,
	Long grupoId,
	Integer numeroGrupo,
	String colorNombre,
	String colorHex,
	String dni,
	String nombres,
	String placa,
	String categoriaCodigo,
	String estadoGrupo,
	String resultadoFinal,
	Boolean esVip,
	LocalDateTime registradoEn,
	LocalDateTime creadoEn
) {
}
