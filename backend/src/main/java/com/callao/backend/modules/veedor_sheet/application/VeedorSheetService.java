package com.callao.backend.modules.veedor_sheet.application;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.callao.backend.modules.veedor_sheet.dto.VeedorGroupSummaryResponse;
import com.callao.backend.modules.veedor_sheet.dto.SaveVeedorSheetRequest;
import com.callao.backend.modules.veedor_sheet.dto.SaveVeedorSheetRowRequest;
import com.callao.backend.modules.veedor_sheet.dto.VeedorSheetResponse;
import com.callao.backend.modules.veedor_sheet.infrastructure.VeedorSheetRepository;
import com.callao.backend.modules.veedor_sheet.infrastructure.VeedorSheetRepository.FichaRow;
import com.callao.backend.modules.veedor_sheet.infrastructure.VeedorSheetRepository.GroupRow;
import com.callao.backend.modules.veedor_sheet.infrastructure.VeedorSheetRepository.TipoVeedorRow;
import com.callao.backend.shared.error.BusinessException;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class VeedorSheetService {

	private static final String FINALIZED_STATUS = "FINALIZADO";

	private final VeedorSheetRepository repository;

	public List<VeedorGroupSummaryResponse> findGroups() {
		return repository.findGroups();
	}

	public VeedorSheetResponse getCurrentSheet(String tipoVeedor) {
		TipoVeedorRow tipo = findTipoVeedor(tipoVeedor);
		GroupRow group = repository.findLatestGroup()
			.orElseThrow(() -> new BusinessException("No existen grupos de evaluacion registrados."));

		return buildResponse(group, tipo);
	}

	public VeedorSheetResponse getSheet(String tipoVeedor, Long groupId) {
		TipoVeedorRow tipo = findTipoVeedor(tipoVeedor);
		GroupRow group = repository.findGroupById(groupId)
			.orElseThrow(() -> new BusinessException("El grupo seleccionado no existe."));

		return buildResponse(group, tipo);
	}

	@Transactional
	public VeedorSheetResponse save(String tipoVeedor, SaveVeedorSheetRequest request) {
		TipoVeedorRow tipo = findTipoVeedor(tipoVeedor);
		GroupRow group = repository.findGroupById(request.grupoId())
			.orElseThrow(() -> new BusinessException("El grupo seleccionado no existe."));

		if (FINALIZED_STATUS.equals(group.estado())) {
			throw new BusinessException("La evaluacion ya fue finalizada por el administrador.");
		}
		
		if ("BORRADOR".equals(group.estado())) {
			throw new BusinessException("El supervisor todavia no ha finalizado este grupo de evaluados.");
		}

		List<SaveVeedorSheetRowRequest> rows = request.evaluados() == null ? List.of() : request.evaluados();
		List<Long> evaluatedIds = rows.stream()
			.map(SaveVeedorSheetRowRequest::evaluadoGrupoId)
			.distinct()
			.toList();

		if (!repository.allEvaluatedBelongToGroup(group.id(), evaluatedIds)) {
			throw new BusinessException("Uno o mas evaluados no pertenecen al grupo seleccionado.");
		}

		List<Long> criterionIds = rows.stream()
			.flatMap(row -> mergeCriteria(row.habilidadIds(), row.reglamentoIds()).stream())
			.distinct()
			.toList();

		if (!repository.allCriteriaExist(criterionIds)) {
			throw new BusinessException("Uno o mas criterios seleccionados no existen o estan inactivos.");
		}

		Long fichaId = repository.upsertFicha(
			group.id(),
			tipo.id(),
			request.veedorId(),
			blankToNull(request.observaciones())
		);

		for (SaveVeedorSheetRowRequest row : rows) {
			Long detalleId = repository.upsertDetalle(
				fichaId,
				row.evaluadoGrupoId(),
				blankToNull(row.observacion())
			);
			repository.replaceCriteria(detalleId, mergeCriteria(row.habilidadIds(), row.reglamentoIds()));
		}

		return buildResponse(group, tipo);
	}

	private VeedorSheetResponse buildResponse(GroupRow group, TipoVeedorRow tipo) {
		FichaRow ficha = repository.findFicha(group.id(), tipo.id())
			.orElse(new FichaRow(null, null, "EN_PROCESO"));

		return new VeedorSheetResponse(
			ficha.id(),
			group.id(),
			group.numeroGrupo(),
			group.colorNombre(),
			group.colorHex(),
			tipo.codigo(),
			tipo.nombre(),
			group.estado(),
			ficha.estado(),
			ficha.observaciones(),
			group.registradoEn(),
			repository.findRows(group.id(), ficha.id() == null ? -1L : ficha.id())
		);
	}

	private TipoVeedorRow findTipoVeedor(String tipoVeedor) {
		String normalized = normalizeCode(tipoVeedor);
		return repository.findTipoVeedor(normalized)
			.orElseThrow(() -> new BusinessException("El tipo de veedor seleccionado no existe."));
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
