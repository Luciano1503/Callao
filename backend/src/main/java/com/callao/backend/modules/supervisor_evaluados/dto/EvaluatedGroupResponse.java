package com.callao.backend.modules.supervisor_evaluados.dto;

import java.time.LocalDateTime;
import java.util.List;

public record EvaluatedGroupResponse(
	Long id,
	Integer numeroGrupo,
	Long colorId,
	String colorNombre,
	String colorHex,
	Long supervisorId,
	String observaciones,
	String estado,
	LocalDateTime registradoEn,
	LocalDateTime finalizadoEn,
	Integer totalEvaluados,
	Integer capacidadMaxima,
	Boolean puedeAgregar,
	List<EvaluatedPersonResponse> evaluados
) {
}
