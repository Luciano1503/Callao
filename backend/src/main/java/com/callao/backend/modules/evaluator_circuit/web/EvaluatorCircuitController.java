package com.callao.backend.modules.evaluator_circuit.web;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.callao.backend.modules.evaluator_circuit.application.EvaluatorCircuitService;
import com.callao.backend.modules.evaluator_circuit.dto.EvaluatorSheetDetailResponse;
import com.callao.backend.modules.evaluator_circuit.dto.EvaluatorSheetSummaryResponse;
import com.callao.backend.modules.evaluator_circuit.dto.ToggleVipRequest;
import com.callao.backend.modules.evaluator_circuit.dto.UpdateEvaluatorSheetRequest;
import com.callao.backend.shared.api.ApiResponse;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/evaluador-circuito")
@RequiredArgsConstructor
public class EvaluatorCircuitController {

	private final EvaluatorCircuitService service;

	@GetMapping("/fichas")
	public ResponseEntity<ApiResponse<List<EvaluatorSheetSummaryResponse>>> findSheets() {
		return ResponseEntity.ok(ApiResponse.ok("Fichas de evaluacion encontradas.", service.findSheets()));
	}

	@GetMapping("/fichas/{evaluatedId}")
	public ResponseEntity<ApiResponse<EvaluatorSheetDetailResponse>> findDetail(@PathVariable Long evaluatedId) {
		return ResponseEntity.ok(ApiResponse.ok("Detalle de ficha encontrado.", service.findDetail(evaluatedId)));
	}

	@PostMapping("/fichas/{evaluatedId}")
	public ResponseEntity<ApiResponse<EvaluatorSheetDetailResponse>> update(
		@PathVariable Long evaluatedId,
		@Valid @RequestBody UpdateEvaluatorSheetRequest request
	) {
		return ResponseEntity.ok(ApiResponse.ok("Ficha de evaluacion actualizada correctamente.", service.update(evaluatedId, request)));
	}

	@PostMapping("/fichas/{evaluatedId}/vip")
	public ResponseEntity<ApiResponse<EvaluatorSheetDetailResponse>> toggleVip(
		@PathVariable Long evaluatedId,
		@Valid @RequestBody ToggleVipRequest request
	) {
		return ResponseEntity.ok(ApiResponse.ok("Estado VIP actualizado correctamente.", service.toggleVip(evaluatedId, request)));
	}
}
