package com.callao.backend.modules.supervisor_evaluados.infrastructure;

import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import com.callao.backend.modules.supervisor_evaluados.dto.EvaluatedGroupSummaryResponse;
import com.callao.backend.modules.supervisor_evaluados.dto.EvaluatedPersonResponse;

import lombok.RequiredArgsConstructor;

@Repository
@RequiredArgsConstructor
public class SupervisorEvaluadosRepository {

	private final JdbcTemplate jdbcTemplate;

	public Optional<GroupRow> findLatestGroupBySupervisor(Long supervisorId) {
		return queryOptionalGroup(
			"""
			SELECT g.id,
			       g.numero_grupo,
			       g.color_id,
			       c.nombre AS color_nombre,
			       c.codigo_hex AS color_hex,
			       g.supervisor_id,
			       g.observaciones,
			       g.estado,
			       g.registrado_en,
			       g.finalizado_en
			FROM callao.grupos_evaluacion g
			INNER JOIN callao.colores_grupo c ON c.id = g.color_id
			WHERE g.supervisor_id = ?
			ORDER BY g.numero_grupo DESC, g.id DESC
			LIMIT 1
			""",
			supervisorId
		);
	}

	public Optional<GroupRow> findGroupById(Long groupId) {
		return queryOptionalGroup(
			"""
			SELECT g.id,
			       g.numero_grupo,
			       g.color_id,
			       c.nombre AS color_nombre,
			       c.codigo_hex AS color_hex,
			       g.supervisor_id,
			       g.observaciones,
			       g.estado,
			       g.registrado_en,
			       g.finalizado_en
			FROM callao.grupos_evaluacion g
			INNER JOIN callao.colores_grupo c ON c.id = g.color_id
			WHERE g.id = ?
			""",
			groupId
		);
	}

	public List<EvaluatedGroupSummaryResponse> findGroupsBySupervisor(Long supervisorId) {
		return jdbcTemplate.query(
			"""
			SELECT g.id,
			       g.numero_grupo,
			       c.nombre AS color_nombre,
			       c.codigo_hex AS color_hex,
			       g.estado,
			       COUNT(e.id) AS total_evaluados,
			       g.registrado_en
			FROM callao.grupos_evaluacion g
			INNER JOIN callao.colores_grupo c ON c.id = g.color_id
			LEFT JOIN callao.evaluados_grupo e ON e.grupo_id = g.id
			WHERE g.supervisor_id = ?
			GROUP BY g.id, g.numero_grupo, c.nombre, c.codigo_hex, g.estado, g.registrado_en
			ORDER BY g.numero_grupo DESC, g.id DESC
			""",
			(rs, rowNum) -> new EvaluatedGroupSummaryResponse(
				rs.getLong("id"),
				rs.getInt("numero_grupo"),
				rs.getString("color_nombre"),
				rs.getString("color_hex"),
				rs.getString("estado"),
				rs.getInt("total_evaluados"),
				rs.getTimestamp("registrado_en").toLocalDateTime()
			),
			supervisorId
		);
	}

	public List<EvaluatedPersonResponse> findEvaluatedByGroup(Long groupId) {
		return jdbcTemplate.query(
			"""
			SELECT e.id,
			       e.grupo_id,
			       e.numero_fila,
			       e.dni,
			       e.nombres,
			       e.placa,
			       e.categoria_id,
			       c.codigo AS categoria_codigo,
			       c.nombre AS categoria_nombre,
			       e.resultado_final,
			       e.creado_en,
			       e.es_vip
			FROM callao.evaluados_grupo e
			INNER JOIN callao.categorias c ON c.id = e.categoria_id
			WHERE e.grupo_id = ?
			ORDER BY e.numero_fila ASC, e.id ASC
			""",
			(rs, rowNum) -> new EvaluatedPersonResponse(
				rs.getLong("id"),
				rs.getLong("grupo_id"),
				rs.getInt("numero_fila"),
				rs.getString("dni"),
				rs.getString("nombres"),
				rs.getString("placa"),
				rs.getLong("categoria_id"),
				rs.getString("categoria_codigo"),
				rs.getString("categoria_nombre"),
				rs.getString("resultado_final"),
				rs.getTimestamp("creado_en").toLocalDateTime(),
				rs.getBoolean("es_vip")
			),
			groupId
		);
	}

	public List<com.callao.backend.modules.supervisor_evaluados.dto.SupervisorConsultaResponse> findAllEvaluatedBySupervisor(Long supervisorId) {
		return jdbcTemplate.query(
			"""
			SELECT e.id,
			       e.grupo_id,
			       g.numero_grupo,
			       cg.nombre AS color_nombre,
			       e.dni,
			       e.nombres,
			       e.placa,
			       c.codigo AS categoria_codigo,
			       g.estado AS estado_grupo,
			       e.resultado_final,
			       e.es_vip,
			       g.registrado_en,
			       e.creado_en
			FROM callao.evaluados_grupo e
			INNER JOIN callao.grupos_evaluacion g ON g.id = e.grupo_id
			LEFT JOIN callao.colores_grupo cg ON cg.id = g.color_id
			INNER JOIN callao.categorias c ON c.id = e.categoria_id
			WHERE g.supervisor_id = ?
			ORDER BY e.creado_en DESC
			""",
			(rs, rowNum) -> new com.callao.backend.modules.supervisor_evaluados.dto.SupervisorConsultaResponse(
				rs.getLong("id"),
				rs.getLong("grupo_id"),
				rs.getInt("numero_grupo"),
				rs.getString("color_nombre"),
				rs.getString("dni"),
				rs.getString("nombres"),
				rs.getString("placa"),
				rs.getString("categoria_codigo"),
				rs.getString("estado_grupo"),
				rs.getString("resultado_final"),
				rs.getBoolean("es_vip"),
				toLocalDateTime(rs.getTimestamp("registrado_en")),
				toLocalDateTime(rs.getTimestamp("creado_en"))
			),
			supervisorId
		);
	}

	public GroupRow createGroup(Integer groupNumber, Long colorId, Long supervisorId) {
		Long groupId = jdbcTemplate.queryForObject(
			"""
			INSERT INTO callao.grupos_evaluacion (numero_grupo, color_id, supervisor_id)
			VALUES (?, ?, ?)
			RETURNING id
			""",
			Long.class,
			groupNumber,
			colorId,
			supervisorId
		);

		return findGroupById(groupId).orElseThrow();
	}

	public void createEvaluated(CreateEvaluatedRow row) {
		jdbcTemplate.update(
			"""
			INSERT INTO callao.evaluados_grupo (
				grupo_id,
				numero_fila,
				dni,
				nombres,
				placa,
				categoria_id,
				es_vip
			)
			VALUES (?, ?, ?, ?, ?, ?, false)
			""",
			row.grupoId(),
			row.numeroFila(),
			row.dni(),
			row.nombres(),
			row.placa(),
			row.categoriaId()
		);
	}

	public void finalizeGroup(Long groupId, Long supervisorId, String observations) {
		jdbcTemplate.update(
			"""
			UPDATE callao.grupos_evaluacion
			SET estado = 'REGISTRADO',
			    observaciones = ?,
			    finalizado_por = ?,
			    finalizado_en = CURRENT_TIMESTAMP
			WHERE id = ?
			  AND supervisor_id = ?
			""",
			observations,
			supervisorId,
			groupId,
			supervisorId
		);
	}

	public void updateGroupColor(Long groupId, Long supervisorId, Long colorId) {
		jdbcTemplate.update(
			"""
			UPDATE callao.grupos_evaluacion
			SET color_id = ?
			WHERE id = ?
			  AND supervisor_id = ?
			""",
			colorId,
			groupId,
			supervisorId
		);
	}

	public void updateGroupRegistrationDate(Long groupId, Long supervisorId, LocalDateTime registrationDate) {
		jdbcTemplate.update(
			"""
			UPDATE callao.grupos_evaluacion
			SET registrado_en = ?
			WHERE id = ?
			  AND supervisor_id = ?
			""",
			registrationDate,
			groupId,
			supervisorId
		);
	}

	public int countEvaluated(Long groupId) {
		Integer count = jdbcTemplate.queryForObject(
			"SELECT COUNT(1) FROM callao.evaluados_grupo WHERE grupo_id = ?",
			Integer.class,
			groupId
		);

		return count == null ? 0 : count;
	}

	public boolean existsEvaluatedDniInGroup(Long groupId, String dni) {
		Integer count = jdbcTemplate.queryForObject(
			"""
			SELECT COUNT(1)
			FROM callao.evaluados_grupo
			WHERE grupo_id = ?
			  AND dni = ?
			""",
			Integer.class,
			groupId,
			dni
		);

		return count != null && count > 0;
	}

	public boolean existsEvaluatedPlacaInGroup(Long groupId, String placa) {
		Integer count = jdbcTemplate.queryForObject(
			"""
			SELECT COUNT(1)
			FROM callao.evaluados_grupo
			WHERE grupo_id = ?
			  AND placa = ?
			""",
			Integer.class,
			groupId,
			placa
		);

		return count != null && count > 0;
	}

	public boolean existsActiveCategory(Long categoryId) {
		Integer count = jdbcTemplate.queryForObject(
			"""
			SELECT COUNT(1)
			FROM callao.categorias
			WHERE id = ?
			  AND activo = TRUE
			""",
			Integer.class,
			categoryId
		);

		return count != null && count > 0;
	}

	public List<Long> findActiveColorIds() {
		return jdbcTemplate.query(
			"""
			SELECT id
			FROM callao.colores_grupo
			WHERE activo = TRUE
			ORDER BY id ASC
			""",
			(rs, rowNum) -> rs.getLong("id")
		);
	}

	public boolean existsActiveColor(Long colorId) {
		Integer count = jdbcTemplate.queryForObject(
			"""
			SELECT COUNT(1)
			FROM callao.colores_grupo
			WHERE id = ?
			  AND activo = TRUE
			""",
			Integer.class,
			colorId
		);

		return count != null && count > 0;
	}

	private Optional<GroupRow> queryOptionalGroup(String sql, Object... args) {
		try {
			GroupRow group = jdbcTemplate.queryForObject(
				sql,
				(rs, rowNum) -> new GroupRow(
					rs.getLong("id"),
					rs.getInt("numero_grupo"),
					rs.getLong("color_id"),
					rs.getString("color_nombre"),
					rs.getString("color_hex"),
					rs.getLong("supervisor_id"),
					rs.getString("observaciones"),
					rs.getString("estado"),
					rs.getTimestamp("registrado_en").toLocalDateTime(),
					toLocalDateTime(rs.getTimestamp("finalizado_en"))
				),
				args
			);

			return Optional.ofNullable(group);
		} catch (EmptyResultDataAccessException exception) {
			return Optional.empty();
		}
	}

	private LocalDateTime toLocalDateTime(Timestamp timestamp) {
		return timestamp == null ? null : timestamp.toLocalDateTime();
	}

	public record CreateEvaluatedRow(
		Long grupoId,
		Integer numeroFila,
		String dni,
		String nombres,
		String placa,
		Long categoriaId
	) {
	}

	public record GroupRow(
		Long id,
		Integer numeroGrupo,
		Long colorId,
		String colorNombre,
		String colorHex,
		Long supervisorId,
		String observaciones,
		String estado,
		LocalDateTime registradoEn,
		LocalDateTime finalizadoEn
	) {
	}
}
