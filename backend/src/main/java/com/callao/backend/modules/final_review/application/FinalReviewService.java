package com.callao.backend.modules.final_review.application;

import java.util.List;
import java.util.Locale;
import java.util.Set;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.callao.backend.modules.final_review.dto.FinalReviewDetailResponse;
import com.callao.backend.modules.final_review.dto.FinalReviewGroupResponse;
import com.callao.backend.modules.final_review.dto.FinalizeEvaluationRequest;
import com.callao.backend.modules.final_review.dto.FinalizeEvaluationRowRequest;
import com.callao.backend.modules.final_review.infrastructure.FinalReviewRepository;
import com.callao.backend.shared.error.BusinessException;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class FinalReviewService {

	private static final Set<String> VALID_RESULTS = Set.of("PENDIENTE", "APROBADO", "DESAPROBADO");


	private final FinalReviewRepository repository;

	public List<FinalReviewGroupResponse> findGroups() {
		return repository.findGroups();
	}

	public FinalReviewDetailResponse findDetail(Long groupId) {
		FinalReviewGroupResponse group = repository.findGroup(groupId)
			.orElseThrow(() -> new BusinessException("El grupo seleccionado no existe."));

		return new FinalReviewDetailResponse(group, repository.findPeople(groupId));
	}

	@Transactional
	public FinalReviewDetailResponse finalizeEvaluation(Long groupId, FinalizeEvaluationRequest request) {
		if (!repository.groupExists(groupId)) {
			throw new BusinessException("El grupo seleccionado no existe.");
		}

		List<FinalizeEvaluationRowRequest> rows = request.resultados() == null ? List.of() : request.resultados();
		for (FinalizeEvaluationRowRequest row : rows) {
			String result = normalizeResult(row.resultadoFinal());
			repository.updateResult(groupId, row.evaluadoId(), result, request.adminId());
		}

		repository.finalizeGroup(groupId, request.adminId());
		return findDetail(groupId);
	}
	private String normalizeResult(String value) {
		String normalized = value == null ? "" : value.trim().toUpperCase(Locale.ROOT);
		if (!VALID_RESULTS.contains(normalized)) {
			throw new BusinessException("El resultado final no es valido.");
		}

		return normalized;
	}
}
