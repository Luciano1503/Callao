package com.callao.backend.modules.veedor_sheet.web;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.security.access.prepost.PreAuthorize;

import com.callao.backend.modules.veedor_sheet.application.VeedorSheetService;
import com.callao.backend.modules.veedor_sheet.dto.VeedorGroupSummaryResponse;
import com.callao.backend.modules.veedor_sheet.dto.SaveVeedorSheetRequest;
import com.callao.backend.modules.veedor_sheet.dto.VeedorSheetResponse;
import com.callao.backend.shared.api.ApiResponse;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/veedores")
@RequiredArgsConstructor
@PreAuthorize("hasRole('VEEDOR') or hasRole('ADMIN')")
public class VeedorSheetController {

	private final VeedorSheetService service;

	@GetMapping("/{tipoVeedor}/grupos")
	public ResponseEntity<ApiResponse<List<VeedorGroupSummaryResponse>>> findGroups(@PathVariable String tipoVeedor) {
		return ResponseEntity.ok(ApiResponse.ok("Grupos encontrados.", service.findGroups(tipoVeedor)));
	}

	@GetMapping("/{tipoVeedor}/ficha-actual")
	public ResponseEntity<ApiResponse<VeedorSheetResponse>> getCurrentSheet(@PathVariable String tipoVeedor) {
		return ResponseEntity.ok(ApiResponse.ok("Ficha de veedor encontrada.", service.getCurrentSheet(tipoVeedor)));
	}

	@GetMapping("/{tipoVeedor}/fichas/{groupId}")
	public ResponseEntity<ApiResponse<VeedorSheetResponse>> getSheet(
		@PathVariable String tipoVeedor,
		@PathVariable Long groupId
	) {
		return ResponseEntity.ok(ApiResponse.ok("Ficha de veedor encontrada.", service.getSheet(tipoVeedor, groupId)));
	}

	@PostMapping("/{tipoVeedor}/fichas")
	public ResponseEntity<ApiResponse<VeedorSheetResponse>> save(
		@PathVariable String tipoVeedor,
		@Valid @RequestBody SaveVeedorSheetRequest request
	) {
		return ResponseEntity.ok(ApiResponse.ok("Ficha de veedor guardada correctamente.", service.save(tipoVeedor, request)));
	}
}
