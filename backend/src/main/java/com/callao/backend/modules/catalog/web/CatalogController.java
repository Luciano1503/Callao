package com.callao.backend.modules.catalog.web;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.callao.backend.modules.catalog.application.CatalogService;
import com.callao.backend.modules.catalog.dto.CategoriaCatalogResponse;
import com.callao.backend.modules.catalog.dto.ColorCatalogResponse;
import com.callao.backend.modules.catalog.dto.CriterioCatalogResponse;
import com.callao.backend.modules.catalog.dto.RolCatalogResponse;
import com.callao.backend.modules.catalog.dto.TipoCriterioCatalogResponse;
import com.callao.backend.modules.catalog.dto.VeedorCriteriosResponse;
import com.callao.backend.shared.api.ApiResponse;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/catalogos")
@RequiredArgsConstructor
public class CatalogController {

	private final CatalogService catalogService;

	@GetMapping("/roles")
	public ResponseEntity<ApiResponse<List<RolCatalogResponse>>> getRoles() {
		return ResponseEntity.ok(ApiResponse.ok("Roles obtenidos.", catalogService.getRoles()));
	}

	@GetMapping("/categorias")
	public ResponseEntity<ApiResponse<List<CategoriaCatalogResponse>>> getCategorias() {
		return ResponseEntity.ok(ApiResponse.ok("Categorias obtenidas.", catalogService.getCategorias()));
	}

	@GetMapping("/colores")
	public ResponseEntity<ApiResponse<List<ColorCatalogResponse>>> getColores() {
		return ResponseEntity.ok(ApiResponse.ok("Colores obtenidos.", catalogService.getColores()));
	}

	@GetMapping("/vehiculos")
	public ResponseEntity<ApiResponse<List<com.callao.backend.modules.catalog.dto.VehiculoCatalogResponse>>> getVehiculos() {
		return ResponseEntity.ok(ApiResponse.ok("Vehículos obtenidos.", catalogService.getVehiculos()));
	}

	@GetMapping("/sedes")
	public ResponseEntity<ApiResponse<List<com.callao.backend.modules.catalog.dto.SedeCatalogResponse>>> getSedes() {
		return ResponseEntity.ok(ApiResponse.ok("Sedes obtenidas.", catalogService.getSedes()));
	}

	@GetMapping("/criterios/tipos")
	public ResponseEntity<ApiResponse<List<TipoCriterioCatalogResponse>>> getTiposCriterio() {
		return ResponseEntity.ok(ApiResponse.ok("Tipos de criterio obtenidos.", catalogService.getTiposCriterio()));
	}

	@GetMapping("/criterios")
	public ResponseEntity<ApiResponse<List<CriterioCatalogResponse>>> getCriterios(@RequestParam String tipo) {
		return ResponseEntity.ok(ApiResponse.ok("Criterios obtenidos.", catalogService.getCriteriosByTipo(tipo)));
	}

	@GetMapping("/veedores/{tipoVeedor}/criterios")
	public ResponseEntity<ApiResponse<VeedorCriteriosResponse>> getCriteriosVeedor(@PathVariable String tipoVeedor) {
		return ResponseEntity.ok(ApiResponse.ok("Criterios del veedor obtenidos.", catalogService.getCriteriosByTipoVeedor(tipoVeedor)));
	}

	@GetMapping("/firmas-roles")
	public ResponseEntity<ApiResponse<java.util.Map<String, String>>> getFirmasRoles() {
		return ResponseEntity.ok(ApiResponse.ok("Firmas de roles obtenidas.", catalogService.getFirmasRoles()));
	}

	@GetMapping("/firmas-grupo/{groupId}")
	public ResponseEntity<ApiResponse<java.util.Map<String, String>>> getFirmasGrupo(@PathVariable Long groupId) {
		return ResponseEntity.ok(ApiResponse.ok("Firmas del grupo obtenidas.", catalogService.getFirmasGrupo(groupId)));
	}
}
