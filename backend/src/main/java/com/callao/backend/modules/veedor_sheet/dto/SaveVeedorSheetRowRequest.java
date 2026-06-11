package com.callao.backend.modules.veedor_sheet.dto;

import java.util.List;

import jakarta.validation.constraints.NotNull;

public record SaveVeedorSheetRowRequest(
	@NotNull(message = "El evaluado es obligatorio.")
	Long evaluadoGrupoId,

	String observacion,
	List<Long> habilidadIds,
	List<Long> reglamentoIds
) {
}
