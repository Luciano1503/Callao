package com.callao.backend.modules.catalog.dto;

public record ColorCatalogResponse(
	Long id,
	String nombre,
	String codigoHex
) {
}
