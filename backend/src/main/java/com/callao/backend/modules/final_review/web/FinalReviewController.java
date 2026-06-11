package com.callao.backend.modules.final_review.web;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;

import org.springframework.web.bind.annotation.RestController;

import com.callao.backend.modules.final_review.application.FinalReviewService;
import com.callao.backend.modules.final_review.dto.FinalReviewDetailResponse;
import com.callao.backend.modules.final_review.dto.FinalReviewGroupResponse;
import com.callao.backend.modules.final_review.dto.FinalizeEvaluationRequest;
import com.callao.backend.shared.api.ApiResponse;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/admin/revision-final")
@RequiredArgsConstructor
public class FinalReviewController {

	private final FinalReviewService service;

	@GetMapping("/grupos")
	public ResponseEntity<ApiResponse<List<FinalReviewGroupResponse>>> findGroups() {
		return ResponseEntity.ok(ApiResponse.ok("Grupos encontrados.", service.findGroups()));
	}

	@GetMapping("/grupos/{groupId}")
	public ResponseEntity<ApiResponse<FinalReviewDetailResponse>> findDetail(
		@PathVariable Long groupId
	) {
		return ResponseEntity.ok(ApiResponse.ok("Detalle de grupo encontrado.", service.findDetail(groupId)));
	}

	@PostMapping("/grupos/{groupId}/finalizar")
	public ResponseEntity<ApiResponse<FinalReviewDetailResponse>> finalizeEvaluation(
		@PathVariable Long groupId,
		@Valid @RequestBody FinalizeEvaluationRequest request
	) {
		return ResponseEntity.ok(ApiResponse.ok("Evaluacion finalizada correctamente.", service.finalizeEvaluation(groupId, request)));
	}
}
