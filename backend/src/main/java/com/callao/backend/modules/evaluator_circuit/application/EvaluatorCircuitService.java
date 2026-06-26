package com.callao.backend.modules.evaluator_circuit.application;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.callao.backend.modules.evaluator_circuit.dto.EvaluatorSheetDetailResponse;
import com.callao.backend.modules.evaluator_circuit.dto.EvaluatorSheetSummaryResponse;
import com.callao.backend.modules.evaluator_circuit.dto.UpdateEvaluatorReviewRequest;
import com.callao.backend.modules.evaluator_circuit.dto.UpdateEvaluatorSheetRequest;
import com.callao.backend.modules.evaluator_circuit.dto.ToggleVipRequest;
import com.callao.backend.modules.evaluator_circuit.infrastructure.EvaluatorCircuitRepository;
import com.callao.backend.modules.evaluator_circuit.infrastructure.EvaluatorCircuitRepository.TipoVeedorRow;
import com.callao.backend.shared.error.BusinessException;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class EvaluatorCircuitService {

	private static final String FINALIZED_STATUS = "FINALIZADO";

	private final EvaluatorCircuitRepository repository;
	private final SimpMessagingTemplate messagingTemplate;

	public List<EvaluatorSheetSummaryResponse> findSheets() {
		return repository.findSheets();
	}

	public EvaluatorSheetDetailResponse findDetail(Long evaluatedId) {
		EvaluatorSheetSummaryResponse sheet = findSheetOrThrow(evaluatedId);
		return new EvaluatorSheetDetailResponse(sheet, repository.findReviews(sheet.evaluadoId(), sheet.grupoId()));
	}

	@Transactional
	public EvaluatorSheetDetailResponse update(Long evaluatedId, UpdateEvaluatorSheetRequest request) {
		if (request.evaluadorId() == null || request.evaluadorId() <= 0) {
			throw new BusinessException("El evaluador es obligatorio.");
		}

		org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
		Long loggedInUserId = (Long) auth.getPrincipal();
		boolean isAdmin = auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

		if (!isAdmin && !loggedInUserId.equals(request.evaluadorId())) {
			throw new com.callao.backend.shared.error.BusinessException("No tienes permisos para realizar esta acción en nombre de otro usuario.");
		}

		EvaluatorSheetSummaryResponse sheet = findSheetOrThrow(evaluatedId);
		ensureEditable(sheet);

		repository.upsertCircuitSheet(sheet.evaluadoId(), request.evaluadorId(), blankToNull(request.observaciones()));

		List<UpdateEvaluatorReviewRequest> reviews = request.revisiones() == null ? List.of() : request.revisiones();
		for (UpdateEvaluatorReviewRequest review : reviews) {
			updateReview(sheet, review);
		}

		repository.recalculateResultadosFinales(sheet.evaluadoId());

		return findDetail(sheet.evaluadoId());
	}

	@Transactional
	public EvaluatorSheetDetailResponse toggleVip(Long evaluatedId, ToggleVipRequest request) {
		if (request.evaluadorId() == null || request.evaluadorId() <= 0) {
			throw new BusinessException("El evaluador es obligatorio.");
		}

		EvaluatorSheetSummaryResponse sheet = findSheetOrThrow(evaluatedId);
		ensureEditable(sheet);

		repository.updateVipStatus(evaluatedId, request.esVip());

		EvaluatorSheetDetailResponse detail = findDetail(evaluatedId);
		messagingTemplate.convertAndSend("/topic/veedores", detail);
		return detail;
	}

	private void updateReview(EvaluatorSheetSummaryResponse sheet, UpdateEvaluatorReviewRequest request) {
		TipoVeedorRow tipo = repository.findTipoVeedor(normalizeCode(request.tipoVeedorCodigo()))
			.orElseThrow(() -> new BusinessException("El tipo de veedor seleccionado no existe."));

		Long fichaId = repository.findFichaId(sheet.grupoId(), tipo.id())
			.orElseThrow(() -> new BusinessException("La ficha de " + tipo.nombre() + " aun no fue registrada por el veedor."));

		List<Long> criterionIds = mergeCriteria(request.habilidadIds(), request.reglamentoIds());
		if (!repository.criteriaBelongToVeedor(tipo.id(), criterionIds)) {
			throw new BusinessException("Uno o mas criterios no pertenecen al tipo de veedor " + tipo.nombre() + ".");
		}

		Long detailId = repository.upsertDetail(
			fichaId,
			sheet.evaluadoId(),
			blankToNull(request.observacionEvaluado())
		);
		repository.replaceCriteria(detailId, criterionIds);
		repository.touchVeedorSheet(fichaId);
	}

	private EvaluatorSheetSummaryResponse findSheetOrThrow(Long evaluatedId) {
		if (evaluatedId == null || evaluatedId <= 0) {
			throw new BusinessException("La ficha solicitada no es valida.");
		}

		return repository.findSheet(evaluatedId)
			.orElseThrow(() -> new BusinessException("La ficha solicitada no existe."));
	}

	private void ensureEditable(EvaluatorSheetSummaryResponse sheet) {
		org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
		boolean isAdmin = auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

		if (!isAdmin && FINALIZED_STATUS.equals(sheet.estadoGrupo())) {
			throw new BusinessException("La evaluacion ya fue finalizada por el administrador y no admite modificaciones.");
		}
	}

	private String normalizeCode(String value) {
		return value == null ? "" : value.trim().replace('-', '_').toUpperCase(Locale.ROOT);
	}

	private List<Long> mergeCriteria(List<Long> habilidadIds, List<Long> reglamentoIds) {
		Set<Long> ids = new LinkedHashSet<>();
		if (habilidadIds != null) {
			ids.addAll(habilidadIds);
		}
		if (reglamentoIds != null) {
			ids.addAll(reglamentoIds);
		}

		return new ArrayList<>(ids);
	}

	private String blankToNull(String value) {
		if (value == null || value.trim().isBlank()) {
			return null;
		}

		return value.trim();
	}
}
