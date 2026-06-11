package com.callao.backend.modules.veedor_sheet.dto;

import java.time.LocalDateTime;
import java.util.List;

public record VeedorSheetResponse(
	Long fichaId,
	Long grupoId,
	Integer numeroGrupo,
	String colorNombre,
	String colorHex,
	String tipoVeedorCodigo,
	String tipoVeedorNombre,
	String estadoGrupo,
	String estadoFicha,
	String observaciones,
	LocalDateTime registradoEn,
	List<VeedorSheetRowResponse> evaluados
) {
}
