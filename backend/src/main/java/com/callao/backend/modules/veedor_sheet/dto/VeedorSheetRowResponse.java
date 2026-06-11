package com.callao.backend.modules.veedor_sheet.dto;

import java.util.List;

public record VeedorSheetRowResponse(
	Long evaluadoGrupoId,
	Integer numeroFila,
	String dni,
	String nombres,
	String categoriaCodigo,
	String placa,
	String resultadoFinal,
	String observacion,
	List<Long> habilidadIds,
	List<Long> reglamentoIds
) {
}
