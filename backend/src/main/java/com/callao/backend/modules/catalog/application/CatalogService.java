package com.callao.backend.modules.catalog.application;

import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;

import com.callao.backend.modules.catalog.dto.CategoriaCatalogResponse;
import com.callao.backend.modules.catalog.dto.ColorCatalogResponse;
import com.callao.backend.modules.catalog.dto.CriterioCatalogResponse;
import com.callao.backend.modules.catalog.dto.RolCatalogResponse;
import com.callao.backend.modules.catalog.dto.TipoCriterioCatalogResponse;
import com.callao.backend.modules.catalog.dto.VeedorCriteriosResponse;
import com.callao.backend.modules.catalog.infrastructure.CatalogRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class CatalogService {

	private static final String REGLAMENTO_TRANSITO = "REGLAMENTO_TRANSITO";

	private static final Map<String, String> CRITERIO_PRINCIPAL_POR_VEEDOR = Map.of(
		"TORRE_POSTERIOR", "HABILIDAD_CONDUCTIVA",
		"TORRE_FRONTAL", "HABILIDAD_CONDUCTIVA",
		"ESTACIONAMIENTO_PARALELO", "ESTACIONAMIENTO_PARALELO",
		"ESTACIONAMIENTO_DIAGONAL", "ESTACIONAMIENTO_DIAGONAL"
	);

	private final CatalogRepository catalogRepository;

	public List<RolCatalogResponse> getRoles() {
		return catalogRepository.findRoles();
	}

	public List<CategoriaCatalogResponse> getCategorias() {
		return catalogRepository.findCategorias();
	}

	public List<ColorCatalogResponse> getColores() {
		return catalogRepository.findColores();
	}

	public List<TipoCriterioCatalogResponse> getTiposCriterio() {
		return catalogRepository.findTiposCriterio();
	}

	public List<CriterioCatalogResponse> getCriteriosByTipo(String tipoCodigo) {
		return catalogRepository.findCriteriosByTipo(normalizeCode(tipoCodigo));
	}

	public VeedorCriteriosResponse getCriteriosByTipoVeedor(String tipoVeedor) {
		String normalizedVeedor = normalizeCode(tipoVeedor);
		String tipoPrincipal = CRITERIO_PRINCIPAL_POR_VEEDOR.getOrDefault(normalizedVeedor, "HABILIDAD_CONDUCTIVA");

		return new VeedorCriteriosResponse(
			normalizedVeedor,
			catalogRepository.findCriteriosByTipo(tipoPrincipal),
			catalogRepository.findCriteriosByTipo(REGLAMENTO_TRANSITO)
		);
	}

	private String normalizeCode(String value) {
		return value == null ? "" : value.trim().replace('-', '_').toUpperCase();
	}
}
