package com.callao.backend.modules.evaluator_circuit.api;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.callao.backend.modules.evaluator_circuit.application.VipRegistryService;
import com.callao.backend.modules.evaluator_circuit.domain.VipRegistry;
import com.callao.backend.shared.api.ApiResponse;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/evaluador-circuito/vip-registry")
@RequiredArgsConstructor
@PreAuthorize("hasRole('EVALUADOR_CIRCUITO') or hasRole('ADMIN')")
public class VipRegistryController {

	private final VipRegistryService service;

	@GetMapping
	public ResponseEntity<ApiResponse<List<VipRegistry>>> findAll() {
		return ResponseEntity.ok(ApiResponse.ok("Registros VIP obtenidos con éxito", service.findAll()));
	}

	@GetMapping("/{dni}")
	@PreAuthorize("hasAnyRole('SUPERVISOR_EVALUADOS', 'EVALUADOR_CIRCUITO', 'ADMIN')")
	public ResponseEntity<ApiResponse<VipRegistry>> findByDni(@PathVariable String dni) {
		VipRegistry registry = service.findByDni(dni);
		if (registry == null) {
			return ResponseEntity.status(404).body(ApiResponse.error("Usuario VIP no encontrado", null));
		}
		return ResponseEntity.ok(ApiResponse.ok("Usuario VIP encontrado", registry));
	}

	@PostMapping
	public ResponseEntity<ApiResponse<VipRegistry>> register(@Valid @RequestBody RegisterVipRequest request) {
		VipRegistry registered = service.register(request.dni(), request.nombres());
		return ResponseEntity.ok(ApiResponse.ok("Usuario VIP registrado con éxito", registered));
	}

	@DeleteMapping("/{dni}")
	public ResponseEntity<ApiResponse<Void>> delete(@PathVariable String dni) {
		service.delete(dni);
		return ResponseEntity.ok(ApiResponse.ok("Usuario VIP eliminado con éxito", null));
	}

	public record RegisterVipRequest(
		@NotBlank(message = "El DNI es obligatorio")
		@Pattern(regexp = "^\\d{8}$", message = "El DNI debe tener 8 dígitos numéricos")
		String dni,

		@NotBlank(message = "Los nombres son obligatorios")
		String nombres
	) {}
}
