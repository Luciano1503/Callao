package com.callao.backend.modules.catalog.dto;

import java.util.List;

public record VeedorCriteriosResponse(
	String tipoVeedorCodigo,
	List<CriterioCatalogResponse> habilidades,
	List<CriterioCatalogResponse> reglamentos
) {
}
