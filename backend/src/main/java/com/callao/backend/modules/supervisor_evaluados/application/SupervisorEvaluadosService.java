package com.callao.backend.modules.supervisor_evaluados.application;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.callao.backend.modules.supervisor_evaluados.dto.CreateEvaluatedRequest;
import com.callao.backend.modules.supervisor_evaluados.dto.CreateGroupRequest;
import com.callao.backend.modules.supervisor_evaluados.dto.EvaluatedGroupResponse;
import com.callao.backend.modules.supervisor_evaluados.dto.EvaluatedGroupSummaryResponse;
import com.callao.backend.modules.supervisor_evaluados.dto.EvaluatedPersonResponse;
import com.callao.backend.modules.supervisor_evaluados.dto.FinalizeGroupRequest;
import com.callao.backend.modules.supervisor_evaluados.dto.UpdateGroupColorRequest;
import com.callao.backend.modules.supervisor_evaluados.infrastructure.SupervisorEvaluadosRepository;
import com.callao.backend.modules.supervisor_evaluados.infrastructure.SupervisorEvaluadosRepository.CreateEvaluatedRow;
import com.callao.backend.modules.supervisor_evaluados.infrastructure.SupervisorEvaluadosRepository.GroupRow;
import com.callao.backend.shared.error.BusinessException;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class SupervisorEvaluadosService {

	private static final int MAX_EVALUATED_BY_GROUP = 10;
	private static final String DRAFT_STATUS = "BORRADOR";

	private final SupervisorEvaluadosRepository repository;
	private final SimpMessagingTemplate messagingTemplate;

	@Transactional
	public EvaluatedGroupResponse getCurrentGroup(Long supervisorId) {
		validateSupervisor(supervisorId);

		return repository.findLatestGroupBySupervisor(supervisorId)
			.map(group -> buildResponse(group.id()))
			.orElse(null);
	}

	public List<EvaluatedGroupSummaryResponse> findGroups(Long supervisorId) {
		validateSupervisor(supervisorId);
		return repository.findGroupsBySupervisor(supervisorId);
	}

	public EvaluatedGroupResponse findGroup(Long groupId, Long supervisorId) {
		validateSupervisor(supervisorId);
		GroupRow group = findGroupOrThrow(groupId);
		ensureGroupBelongsToSupervisor(group, supervisorId);
		return buildResponse(group.id());
	}

	@Transactional
	public EvaluatedGroupResponse createNextGroup(CreateGroupRequest request) {
		Long supervisorId = request.supervisorId();
		validateSupervisor(supervisorId);

		GroupRow latest = repository.findLatestGroupBySupervisor(supervisorId).orElse(null);
		if (latest != null && DRAFT_STATUS.equals(latest.estado()) && repository.countEvaluated(latest.id()) < MAX_EVALUATED_BY_GROUP) {
			throw new BusinessException("Complete los 10 evaluados del grupo actual antes de crear un nuevo grupo.");
		}

		int nextGroupNumber = repository.getMaxGroupNumber() + 1;
		Long colorId = request.colorId() == null ? resolveColorId(nextGroupNumber) : request.colorId();
		ensureActiveColor(colorId);
		GroupRow created = repository.createGroup(nextGroupNumber, colorId, supervisorId);
		return buildResponse(created.id());
	}

	@Transactional
	public EvaluatedGroupResponse updateGroupColor(Long groupId, UpdateGroupColorRequest request) {
		Long supervisorId = request.supervisorId();
		validateSupervisor(supervisorId);
		ensureActiveColor(request.colorId());

		GroupRow group = findGroupOrThrow(groupId);
		ensureGroupBelongsToSupervisor(group, supervisorId);
		ensureDraft(group);

		repository.updateGroupColor(groupId, supervisorId, request.colorId());
		return buildResponse(groupId);
	}

	@Transactional
	public EvaluatedGroupResponse updateGroupDate(Long groupId, com.callao.backend.modules.supervisor_evaluados.dto.UpdateGroupDateRequest request) {
		Long supervisorId = request.supervisorId();
		validateSupervisor(supervisorId);

		if (request.registradoEn() == null) {
			throw new BusinessException("La fecha de registro es obligatoria.");
		}

		GroupRow group = findGroupOrThrow(groupId);
		ensureGroupBelongsToSupervisor(group, supervisorId);
		ensureDraft(group);

		repository.updateGroupRegistrationDate(groupId, supervisorId, request.registradoEn());
		return buildResponse(groupId);
	}

	@Transactional
	public EvaluatedGroupResponse addEvaluated(Long groupId, CreateEvaluatedRequest request) {
		Long supervisorId = request.supervisorId();
		validateSupervisor(supervisorId);

		GroupRow group = findGroupOrThrow(groupId);
		ensureGroupBelongsToSupervisor(group, supervisorId);
		ensureDraft(group);

		int currentTotal = repository.countEvaluated(groupId);
		if (currentTotal >= MAX_EVALUATED_BY_GROUP) {
			throw new BusinessException("El grupo ya tiene 10 evaluados. Cree un nuevo grupo para continuar.");
		}

		String dni = clean(request.dni());
		if (!dni.matches("\\d{8}")) {
			throw new BusinessException("El DNI debe tener 8 digitos.");
		}

		if (repository.existsEvaluatedDniInGroup(groupId, dni)) {
			throw new BusinessException("Este DNI ya fue registrado en el grupo actual.");
		}

		if (!repository.existsActiveCategory(request.categoriaId())) {
			throw new BusinessException("La categoria seleccionada no existe o esta inactiva.");
		}

		String placaClean = cleanUpper(request.placa());
		if (placaClean != null && !placaClean.isBlank()) {
			if (repository.existsEvaluatedPlacaInGroup(groupId, placaClean)) {
				throw new BusinessException("Esta placa ya fue registrada en el grupo actual.");
			}
		}

		repository.createEvaluated(new CreateEvaluatedRow(
			groupId,
			currentTotal + 1,
			dni,
			clean(request.nombres()),
			placaClean,
			request.categoriaId()
		));

		EvaluatedGroupResponse response = buildResponse(groupId);
		messagingTemplate.convertAndSend("/topic/veedores", response);
		return response;
	}

	@Transactional
	public EvaluatedGroupResponse finalizeGroup(Long groupId, FinalizeGroupRequest request) {
		Long supervisorId = request.supervisorId();
		validateSupervisor(supervisorId);

		GroupRow group = findGroupOrThrow(groupId);
		ensureGroupBelongsToSupervisor(group, supervisorId);
		ensureDraft(group);

		int currentTotal = repository.countEvaluated(groupId);
		if (currentTotal != MAX_EVALUATED_BY_GROUP) {
			throw new BusinessException("El grupo debe tener 10 evaluados antes de guardarse como finalizado.");
		}

		repository.finalizeGroup(groupId, supervisorId, cleanNullable(request.observaciones()));
		return buildResponse(groupId);
	}

	private EvaluatedGroupResponse buildResponse(Long groupId) {
		GroupRow group = findGroupOrThrow(groupId);
		List<EvaluatedPersonResponse> evaluated = repository.findEvaluatedByGroup(groupId);
		int total = evaluated.size();

		return new EvaluatedGroupResponse(
			group.id(),
			group.numeroGrupo(),
			group.colorId(),
			group.colorNombre(),
			group.colorHex(),
			group.supervisorId(),
			group.observaciones(),
			group.estado(),
			group.registradoEn(),
			group.finalizadoEn(),
			total,
			MAX_EVALUATED_BY_GROUP,
			DRAFT_STATUS.equals(group.estado()) && total < MAX_EVALUATED_BY_GROUP,
			evaluated
		);
	}

	private GroupRow findGroupOrThrow(Long groupId) {
		if (groupId == null) {
			throw new BusinessException("El grupo es obligatorio.");
		}

		return repository.findGroupById(groupId)
			.orElseThrow(() -> new BusinessException("El grupo solicitado no existe."));
	}

	public EvaluatedGroupResponse getGroup(Long groupId, Long supervisorId) {
		GroupRow group = repository.findGroupById(groupId)
			.filter(g -> g.supervisorId().equals(supervisorId))
			.orElseThrow(() -> new BusinessException("Grupo no encontrado o no autorizado"));

		return buildResponse(group.id());
	}

	public List<com.callao.backend.modules.supervisor_evaluados.dto.SupervisorConsultaResponse> getConsultas(Long supervisorId) {
		return repository.findAllEvaluated();
	}

	private void ensureGroupBelongsToSupervisor(GroupRow group, Long supervisorId) {
		if (!group.supervisorId().equals(supervisorId)) {
			throw new BusinessException("El grupo no pertenece al supervisor indicado.");
		}
	}

	private void ensureDraft(GroupRow group) {
		if (!DRAFT_STATUS.equals(group.estado())) {
			throw new BusinessException("El grupo ya fue finalizado y no admite modificaciones.");
		}
	}

	private Long resolveColorId(int groupNumber) {
		List<Long> colorIds = repository.findActiveColorIds();
		if (colorIds.isEmpty()) {
			throw new BusinessException("No existen colores activos para asignar al grupo.");
		}

		int colorIndex = Math.floorMod(groupNumber - 1, colorIds.size());
		return colorIds.get(colorIndex);
	}

	private void ensureActiveColor(Long colorId) {
		if (colorId == null || !repository.existsActiveColor(colorId)) {
			throw new BusinessException("El color seleccionado no existe o esta inactivo.");
		}
	}

	private void validateSupervisor(Long supervisorId) {
		if (supervisorId == null || supervisorId <= 0) {
			throw new BusinessException("El supervisor es obligatorio.");
		}
		
		org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
		Long loggedInUserId = (Long) auth.getPrincipal();
		boolean isAdmin = auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

		if (!isAdmin && !loggedInUserId.equals(supervisorId)) {
			throw new com.callao.backend.shared.error.BusinessException("No tienes permisos para realizar esta acción en nombre de otro usuario.");
		}
	}

	private String clean(String value) {
		return value == null ? "" : value.trim();
	}

	private String cleanUpper(String value) {
		String cleaned = clean(value);
		return cleaned.isBlank() ? null : cleaned.toUpperCase();
	}

	private String cleanNullable(String value) {
		String cleaned = clean(value);
		return cleaned.isBlank() ? null : cleaned;
	}
}
