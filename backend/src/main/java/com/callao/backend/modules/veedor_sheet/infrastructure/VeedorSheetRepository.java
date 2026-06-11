package com.callao.backend.modules.veedor_sheet.infrastructure;

import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import com.callao.backend.modules.veedor_sheet.dto.VeedorGroupSummaryResponse;
import com.callao.backend.modules.veedor_sheet.dto.VeedorSheetRowResponse;

import lombok.RequiredArgsConstructor;

@Repository
@RequiredArgsConstructor
public class VeedorSheetRepository {

	private final JdbcTemplate jdbcTemplate;

	public Optional<TipoVeedorRow> findTipoVeedor(String tipoCodigo) {
		try {
			TipoVeedorRow row = jdbcTemplate.queryForObject(
				"""
				SELECT id, codigo, nombre
				FROM callao.tipos_veedor
				WHERE codigo = ?
				""",
				(rs, rowNum) -> new TipoVeedorRow(
					rs.getLong("id"),
					rs.getString("codigo"),
					rs.getString("nombre")
				),
				tipoCodigo
			);

			return Optional.ofNullable(row);
		} catch (EmptyResultDataAccessException exception) {
			return Optional.empty();
		}
	}

	public Optional<GroupRow> findLatestGroup() {
		try {
			GroupRow row = jdbcTemplate.queryForObject(
				"""
				SELECT g.id,
				       g.numero_grupo,
				       c.nombre AS color_nombre,
				       c.codigo_hex AS color_hex,
				       g.estado,
				       g.registrado_en
				FROM callao.grupos_evaluacion g
				INNER JOIN callao.colores_grupo c ON c.id = g.color_id
				ORDER BY g.numero_grupo DESC, g.id DESC
				LIMIT 1
				""",
				(rs, rowNum) -> mapGroup(rs)
			);

			return Optional.ofNullable(row);
		} catch (EmptyResultDataAccessException exception) {
			return Optional.empty();
		}
	}

	public List<VeedorGroupSummaryResponse> findGroups() {
		return jdbcTemplate.query(
			"""
			SELECT g.id,
			       g.numero_grupo,
			       c.nombre AS color_nombre,
			       c.codigo_hex AS color_hex,
			       g.estado,
			       (SELECT COUNT(*) FROM callao.evaluados_grupo WHERE grupo_id = g.id) AS total_evaluados,
			       g.registrado_en
			FROM callao.grupos_evaluacion g
			INNER JOIN callao.colores_grupo c ON c.id = g.color_id
			ORDER BY g.numero_grupo DESC, g.id DESC
			LIMIT 20
			""",
			(rs, rowNum) -> new VeedorGroupSummaryResponse(
				rs.getLong("id"),
				rs.getInt("numero_grupo"),
				rs.getString("color_nombre"),
				rs.getString("color_hex"),
				rs.getString("estado"),
				rs.getInt("total_evaluados"),
				toLocalDateTime(rs.getTimestamp("registrado_en"))
			)
		);
	}

	public Optional<GroupRow> findGroupById(Long groupId) {
		try {
			GroupRow row = jdbcTemplate.queryForObject(
				"""
				SELECT g.id,
				       g.numero_grupo,
				       c.nombre AS color_nombre,
				       c.codigo_hex AS color_hex,
				       g.estado,
				       g.registrado_en
				FROM callao.grupos_evaluacion g
				INNER JOIN callao.colores_grupo c ON c.id = g.color_id
				WHERE g.id = ?
				""",
				(rs, rowNum) -> mapGroup(rs),
				groupId
			);

			return Optional.ofNullable(row);
		} catch (EmptyResultDataAccessException exception) {
			return Optional.empty();
		}
	}

	public Optional<FichaRow> findFicha(Long groupId, Long tipoVeedorId) {
		try {
			FichaRow row = jdbcTemplate.queryForObject(
				"""
				SELECT id, observaciones, estado
				FROM callao.fichas_veedor
				WHERE grupo_id = ?
				  AND tipo_veedor_id = ?
				""",
				(rs, rowNum) -> new FichaRow(
					rs.getLong("id"),
					rs.getString("observaciones"),
					rs.getString("estado")
				),
				groupId,
				tipoVeedorId
			);

			return Optional.ofNullable(row);
		} catch (EmptyResultDataAccessException exception) {
			return Optional.empty();
		}
	}

	public List<VeedorSheetRowResponse> findRows(Long groupId, Long fichaId) {
		return jdbcTemplate.query(
			"""
			SELECT e.id AS evaluado_grupo_id,
			       e.numero_fila,
			       e.dni,
			       e.nombres,
			       e.placa,
			       c.codigo AS categoria_codigo,
			       e.resultado_final,
			       d.observacion,
			       COALESCE(
			         ARRAY_AGG(DISTINCT ce.id) FILTER (WHERE tc.codigo <> 'REGLAMENTO_TRANSITO'),
			         ARRAY[]::bigint[]
			       ) AS habilidad_ids,
			       COALESCE(
			         ARRAY_AGG(DISTINCT ce.id) FILTER (WHERE tc.codigo = 'REGLAMENTO_TRANSITO'),
			         ARRAY[]::bigint[]
			       ) AS reglamento_ids
			FROM callao.evaluados_grupo e
			INNER JOIN callao.categorias c ON c.id = e.categoria_id
			LEFT JOIN callao.fichas_veedor_detalle d
			       ON d.evaluado_grupo_id = e.id
			      AND d.ficha_veedor_id = ?
			LEFT JOIN callao.fichas_veedor_detalle_criterios dc ON dc.ficha_veedor_detalle_id = d.id
			LEFT JOIN callao.criterios_evaluacion ce ON ce.id = dc.criterio_evaluacion_id
			LEFT JOIN callao.tipos_criterio_evaluacion tc ON tc.id = ce.tipo_criterio_id
			WHERE e.grupo_id = ?
			GROUP BY e.id, e.numero_fila, e.dni, e.nombres, e.placa, c.codigo, e.resultado_final, d.observacion
			ORDER BY e.numero_fila ASC, e.id ASC
			""",
			(rs, rowNum) -> new VeedorSheetRowResponse(
				rs.getLong("evaluado_grupo_id"),
				rs.getInt("numero_fila"),
				rs.getString("dni"),
				rs.getString("nombres"),
				rs.getString("categoria_codigo"),
				rs.getString("placa"),
				rs.getString("resultado_final"),
				rs.getString("observacion"),
				longArray(rs.getArray("habilidad_ids")),
				longArray(rs.getArray("reglamento_ids"))
			),
			fichaId,
			groupId
		);
	}

	public Long upsertFicha(Long groupId, Long tipoVeedorId, Long veedorId, String observaciones) {
		return jdbcTemplate.queryForObject(
			"""
			INSERT INTO callao.fichas_veedor (
				grupo_id,
				tipo_veedor_id,
				veedor_id,
				observaciones,
				estado
			)
			VALUES (?, ?, ?, ?, 'GUARDADO')
			ON CONFLICT (grupo_id, tipo_veedor_id)
			DO UPDATE SET
				veedor_id = EXCLUDED.veedor_id,
				observaciones = EXCLUDED.observaciones,
				estado = 'GUARDADO',
				actualizado_en = CURRENT_TIMESTAMP
			RETURNING id
			""",
			Long.class,
			groupId,
			tipoVeedorId,
			veedorId,
			observaciones
		);
	}

	public Long upsertDetalle(Long fichaId, Long evaluadoGrupoId, String observacion) {
		return jdbcTemplate.queryForObject(
			"""
			INSERT INTO callao.fichas_veedor_detalle (
				ficha_veedor_id,
				evaluado_grupo_id,
				observacion
			)
			VALUES (?, ?, ?)
			ON CONFLICT (ficha_veedor_id, evaluado_grupo_id)
			DO UPDATE SET
				observacion = EXCLUDED.observacion,
				actualizado_en = CURRENT_TIMESTAMP
			RETURNING id
			""",
			Long.class,
			fichaId,
			evaluadoGrupoId,
			observacion
		);
	}

	public void replaceCriteria(Long detalleId, List<Long> criterionIds) {
		jdbcTemplate.update(
			"DELETE FROM callao.fichas_veedor_detalle_criterios WHERE ficha_veedor_detalle_id = ?",
			detalleId
		);

		for (Long criterionId : criterionIds) {
			jdbcTemplate.update(
				"""
				INSERT INTO callao.fichas_veedor_detalle_criterios (
					ficha_veedor_detalle_id,
					criterio_evaluacion_id
				)
				VALUES (?, ?)
				ON CONFLICT (ficha_veedor_detalle_id, criterio_evaluacion_id) DO NOTHING
				""",
				detalleId,
				criterionId
			);
		}
	}

	public boolean allEvaluatedBelongToGroup(Long groupId, List<Long> evaluatedIds) {
		if (evaluatedIds.isEmpty()) {
			return true;
		}

		Integer count = jdbcTemplate.queryForObject(
			"""
			SELECT COUNT(1)
			FROM callao.evaluados_grupo
			WHERE grupo_id = ?
			  AND id = ANY(?)
			""",
			Integer.class,
			groupId,
			(Object) evaluatedIds.toArray(Long[]::new)
		);

		return count != null && count == evaluatedIds.size();
	}

	public boolean allCriteriaExist(List<Long> criterionIds) {
		if (criterionIds.isEmpty()) {
			return true;
		}

		Integer count = jdbcTemplate.queryForObject(
			"""
			SELECT COUNT(1)
			FROM callao.criterios_evaluacion
			WHERE activo = TRUE
			  AND id = ANY(?)
			""",
			Integer.class,
			(Object) criterionIds.toArray(Long[]::new)
		);

		return count != null && count == criterionIds.size();
	}

	private GroupRow mapGroup(java.sql.ResultSet rs) throws java.sql.SQLException {
		return new GroupRow(
			rs.getLong("id"),
			rs.getInt("numero_grupo"),
			rs.getString("color_nombre"),
			rs.getString("color_hex"),
			rs.getString("estado"),
			toLocalDateTime(rs.getTimestamp("registrado_en"))
		);
	}

	private LocalDateTime toLocalDateTime(Timestamp timestamp) {
		return timestamp == null ? null : timestamp.toLocalDateTime();
	}

	private List<Long> longArray(java.sql.Array array) throws java.sql.SQLException {
		if (array == null) {
			return List.of();
		}

		Long[] values = (Long[]) array.getArray();
		return List.of(values);
	}

	public record TipoVeedorRow(
		Long id,
		String codigo,
		String nombre
	) {
	}

	public record GroupRow(
		Long id,
		Integer numeroGrupo,
		String colorNombre,
		String colorHex,
		String estado,
		LocalDateTime registradoEn
	) {
	}

	public record FichaRow(
		Long id,
		String observaciones,
		String estado
	) {
	}
}
