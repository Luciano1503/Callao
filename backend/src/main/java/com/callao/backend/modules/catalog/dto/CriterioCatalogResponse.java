package com.callao.backend.modules.catalog.dto;

public record CriterioCatalogResponse(
	Long id,
	Long tipoCriterioId,
	String tipoCodigo,
	String tipoNombre,
	Integer codigo,
	String descripcion,
	String siglas
) {
}
