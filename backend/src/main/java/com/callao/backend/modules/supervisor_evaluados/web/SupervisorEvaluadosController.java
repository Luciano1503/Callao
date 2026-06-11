package com.callao.backend.modules.supervisor_evaluados.web;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.callao.backend.modules.supervisor_evaluados.application.SupervisorEvaluadosService;
import com.callao.backend.modules.supervisor_evaluados.dto.CreateEvaluatedRequest;
import com.callao.backend.modules.supervisor_evaluados.dto.CreateGroupRequest;
import com.callao.backend.modules.supervisor_evaluados.dto.EvaluatedGroupResponse;
import com.callao.backend.modules.supervisor_evaluados.dto.EvaluatedGroupSummaryResponse;
import com.callao.backend.modules.supervisor_evaluados.dto.FinalizeGroupRequest;
import com.callao.backend.modules.supervisor_evaluados.dto.UpdateGroupColorRequest;
import com.callao.backend.shared.api.ApiResponse;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/supervisor-evaluados")
@RequiredArgsConstructor
public class SupervisorEvaluadosController {

	private final SupervisorEvaluadosService supervisorEvaluadosService;

	@GetMapping("/grupos")
	public ResponseEntity<ApiResponse<List<EvaluatedGroupSummaryResponse>>> findGroups(@RequestParam Long supervisorId) {
		return ResponseEntity.ok(ApiResponse.ok("Grupos encontrados.", supervisorEvaluadosService.findGroups(supervisorId)));
	}

	@GetMapping("/grupos/actual")
	public ResponseEntity<ApiResponse<EvaluatedGroupResponse>> getCurrentGroup(@RequestParam Long supervisorId) {
		return ResponseEntity.ok(ApiResponse.ok("Grupo actual encontrado.", supervisorEvaluadosService.getCurrentGroup(supervisorId)));
	}

	@GetMapping("/grupos/{groupId}")
	public ResponseEntity<ApiResponse<EvaluatedGroupResponse>> findGroup(
		@PathVariable Long groupId,
		@RequestParam Long supervisorId
	) {
		return ResponseEntity.ok(ApiResponse.ok("Grupo encontrado.", supervisorEvaluadosService.findGroup(groupId, supervisorId)));
	}

	@PostMapping("/grupos")
	public ResponseEntity<ApiResponse<EvaluatedGroupResponse>> createGroup(@Valid @RequestBody CreateGroupRequest request) {
		return ResponseEntity.ok(ApiResponse.ok("Grupo creado correctamente.", supervisorEvaluadosService.createNextGroup(request)));
	}

	@PostMapping("/grupos/{groupId}/evaluados")
	public ResponseEntity<ApiResponse<EvaluatedGroupResponse>> addEvaluated(
		@PathVariable Long groupId,
		@Valid @RequestBody CreateEvaluatedRequest request
	) {
		return ResponseEntity.ok(ApiResponse.ok("Evaluado registrado correctamente.", supervisorEvaluadosService.addEvaluated(groupId, request)));
	}

	@PostMapping("/grupos/{groupId}/color")
	public ResponseEntity<ApiResponse<EvaluatedGroupResponse>> updateGroupColor(
		@PathVariable Long groupId,
		@Valid @RequestBody UpdateGroupColorRequest request
	) {
		return ResponseEntity.ok(ApiResponse.ok("Color del grupo actualizado correctamente.", supervisorEvaluadosService.updateGroupColor(groupId, request)));
	}

	@PostMapping("/grupos/{groupId}/finalizar")
	public ResponseEntity<ApiResponse<EvaluatedGroupResponse>> finalizeGroup(
		@PathVariable Long groupId,
		@Valid @RequestBody FinalizeGroupRequest request
	) {
		return ResponseEntity.ok(ApiResponse.ok("Grupo finalizado correctamente.", supervisorEvaluadosService.finalizeGroup(groupId, request)));
	}
}
