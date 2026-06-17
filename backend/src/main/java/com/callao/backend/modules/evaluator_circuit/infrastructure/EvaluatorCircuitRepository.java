package com.callao.backend.modules.evaluator_circuit.infrastructure;

import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import com.callao.backend.modules.evaluator_circuit.dto.EvaluatorCriterionResponse;
import com.callao.backend.modules.evaluator_circuit.dto.EvaluatorSheetSummaryResponse;
import com.callao.backend.modules.evaluator_circuit.dto.EvaluatorVeedorReviewResponse;

import lombok.RequiredArgsConstructor;

@Repository
@RequiredArgsConstructor
public class EvaluatorCircuitRepository {

	private static final String REGLAMENTO_TRANSITO = "REGLAMENTO_TRANSITO";

	private final JdbcTemplate jdbcTemplate;

	public List<EvaluatorSheetSummaryResponse> findSheets() {
		return jdbcTemplate.query(
			"""
			SELECT e.id AS evaluado_id,
			       e.grupo_id,
			       g.numero_grupo,
			       e.dni,
			       e.nombres,
			       e.categoria_id,
			       c.codigo AS categoria_codigo,
			       c.nombre AS categoria_nombre,
			       e.es_vip,
			       e.placa,
			       e.resultado_final,
			       g.estado AS estado_grupo,
			       COALESCE(fc.estado, 'EN_PROCESO') AS estado_ficha_circuito,
			       g.registrado_en,
			       fc.evaluador_id,
			       u.nombres AS evaluador_nombre,
			       fc.observaciones AS observaciones_circuito,
			       fc.registrado_en AS circuito_registrado_en,
			       fc.actualizado_en AS circuito_actualizado_en
			FROM callao.evaluados_grupo e
			INNER JOIN callao.grupos_evaluacion g ON g.id = e.grupo_id
			INNER JOIN callao.categorias c ON c.id = e.categoria_id
			LEFT JOIN callao.fichas_circuito fc ON fc.evaluado_grupo_id = e.id
			LEFT JOIN callao.usuarios u ON u.id = fc.evaluador_id
			ORDER BY g.numero_grupo DESC, e.numero_fila ASC, e.id ASC
			""",
			(rs, rowNum) -> mapSummary(rs)
		);
	}

	public Optional<EvaluatorSheetSummaryResponse> findSheet(Long evaluatedId) {
		try {
			EvaluatorSheetSummaryResponse row = jdbcTemplate.queryForObject(
				"""
				SELECT e.id AS evaluado_id,
				       e.grupo_id,
				       g.numero_grupo,
				       e.dni,
				       e.nombres,
				       e.categoria_id,
				       c.codigo AS categoria_codigo,
				       c.nombre AS categoria_nombre,
				       e.es_vip,
				       e.placa,
				       e.resultado_final,
				       g.estado AS estado_grupo,
				       COALESCE(fc.estado, 'EN_PROCESO') AS estado_ficha_circuito,
				       g.registrado_en,
				       fc.evaluador_id,
				       u.nombres AS evaluador_nombre,
				       fc.observaciones AS observaciones_circuito,
				       fc.registrado_en AS circuito_registrado_en,
				       fc.actualizado_en AS circuito_actualizado_en
				FROM callao.evaluados_grupo e
				INNER JOIN callao.grupos_evaluacion g ON g.id = e.grupo_id
				INNER JOIN callao.categorias c ON c.id = e.categoria_id
				LEFT JOIN callao.fichas_circuito fc ON fc.evaluado_grupo_id = e.id
				LEFT JOIN callao.usuarios u ON u.id = fc.evaluador_id
				WHERE e.id = ?
				""",
				(rs, rowNum) -> mapSummary(rs),
				evaluatedId
			);

			return Optional.ofNullable(row);
		} catch (EmptyResultDataAccessException exception) {
			return Optional.empty();
		}
	}

	public List<EvaluatorVeedorReviewResponse> findReviews(Long evaluatedId, Long groupId) {
		List<ReviewSqlRow> rows = jdbcTemplate.query(
			"""
			SELECT tv.id AS tipo_veedor_id,
			       tv.codigo AS tipo_veedor_codigo,
			       tv.nombre AS tipo_veedor_nombre,
			       fv.id AS ficha_id,
			       fv.veedor_id,
			       u.nombres AS veedor_nombre,
			       fv.estado AS estado_ficha,
			       fv.observaciones AS observaciones_ficha,
			       fv.registrado_en,
			       fv.actualizado_en,
			       d.id AS detalle_id,
			       d.observacion AS observacion_evaluado,
			       ce.id AS criterio_id,
			       ce.codigo AS criterio_codigo,
			       ce.siglas,
			       ce.descripcion,
			       tc.codigo AS tipo_criterio_codigo
			FROM callao.tipos_veedor tv
			LEFT JOIN callao.fichas_veedor fv
			       ON fv.tipo_veedor_id = tv.id
			      AND fv.grupo_id = ?
			LEFT JOIN callao.usuarios u ON u.id = fv.veedor_id
			LEFT JOIN callao.fichas_veedor_detalle d
			       ON d.ficha_veedor_id = fv.id
			      AND d.evaluado_grupo_id = ?
			LEFT JOIN callao.fichas_veedor_detalle_criterios dc ON dc.ficha_veedor_detalle_id = d.id
			LEFT JOIN callao.criterios_evaluacion ce ON ce.id = dc.criterio_evaluacion_id
			LEFT JOIN callao.tipos_criterio_evaluacion tc ON tc.id = ce.tipo_criterio_id
			ORDER BY tv.id ASC, ce.codigo ASC
			""",
			(rs, rowNum) -> new ReviewSqlRow(
				rs.getLong("tipo_veedor_id"),
				rs.getString("tipo_veedor_codigo"),
				rs.getString("tipo_veedor_nombre"),
				getNullableLong(rs, "ficha_id"),
				getNullableLong(rs, "veedor_id"),
				rs.getString("veedor_nombre"),
				rs.getString("estado_ficha"),
				rs.getString("observaciones_ficha"),
				toLocalDateTime(rs.getTimestamp("registrado_en")),
				toLocalDateTime(rs.getTimestamp("actualizado_en")),
				getNullableLong(rs, "detalle_id"),
				rs.getString("observacion_evaluado"),
				getNullableLong(rs, "criterio_id"),
				getNullableInteger(rs, "criterio_codigo"),
				rs.getString("siglas"),
				rs.getString("descripcion"),
				rs.getString("tipo_criterio_codigo")
			),
			groupId,
			evaluatedId
		);

		Map<String, ReviewAccumulator> reviews = new LinkedHashMap<>();
		for (ReviewSqlRow row : rows) {
			ReviewAccumulator accumulator = reviews.computeIfAbsent(
				row.tipoVeedorCodigo(),
				key -> new ReviewAccumulator(row)
			);

			if (row.criterioId() == null) {
				continue;
			}

			EvaluatorCriterionResponse criterion = new EvaluatorCriterionResponse(
				row.criterioId(),
				row.criterioCodigo(),
				row.siglas(),
				row.descripcion(),
				row.tipoCriterioCodigo()
			);

			if (REGLAMENTO_TRANSITO.equals(row.tipoCriterioCodigo())) {
				accumulator.reglamentos().add(criterion);
			} else {
				accumulator.habilidades().add(criterion);
			}
		}

		return reviews.values()
			.stream()
			.map(ReviewAccumulator::toResponse)
			.toList();
	}

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

	public Optional<Long> findFichaId(Long groupId, Long tipoVeedorId) {
		try {
			Long id = jdbcTemplate.queryForObject(
				"""
				SELECT id
				FROM callao.fichas_veedor
				WHERE grupo_id = ?
				  AND tipo_veedor_id = ?
				""",
				Long.class,
				groupId,
				tipoVeedorId
			);
			return Optional.ofNullable(id);
		} catch (EmptyResultDataAccessException exception) {
			return Optional.empty();
		}
	}

	public boolean criteriaBelongToVeedor(Long tipoVeedorId, List<Long> criterionIds) {
		if (criterionIds.isEmpty()) {
			return true;
		}

		Integer count = jdbcTemplate.queryForObject(
			"""
			SELECT COUNT(DISTINCT ce.id)
			FROM callao.criterios_evaluacion ce
			INNER JOIN callao.tipo_veedor_tipo_criterio tvtc ON tvtc.tipo_criterio_id = ce.tipo_criterio_id
			WHERE ce.activo = TRUE
			  AND tvtc.tipo_veedor_id = ?
			  AND ce.id = ANY(?)
			""",
			Integer.class,
			tipoVeedorId,
			(Object) criterionIds.toArray(Long[]::new)
		);

		return count != null && count == criterionIds.size();
	}

	public Long upsertCircuitSheet(Long evaluatedId, Long evaluatorId, String observations) {
		return jdbcTemplate.queryForObject(
			"""
			INSERT INTO callao.fichas_circuito (
				evaluado_grupo_id,
				evaluador_id,
				observaciones,
				estado
			)
			VALUES (?, ?, ?, 'GUARDADO')
			ON CONFLICT (evaluado_grupo_id)
			DO UPDATE SET
				evaluador_id = EXCLUDED.evaluador_id,
				observaciones = EXCLUDED.observaciones,
				estado = 'GUARDADO',
				actualizado_en = CURRENT_TIMESTAMP
			RETURNING id
			""",
			Long.class,
			evaluatedId,
			evaluatorId,
			observations
		);
	}

	public Long upsertDetail(Long fichaId, Long evaluatedId, String observation) {
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
			evaluatedId,
			observation
		);
	}

	public void replaceCriteria(Long detailId, List<Long> criterionIds) {
		jdbcTemplate.update(
			"DELETE FROM callao.fichas_veedor_detalle_criterios WHERE ficha_veedor_detalle_id = ?",
			detailId
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
				detailId,
				criterionId
			);
		}
	}

	public void touchVeedorSheet(Long fichaId) {
		jdbcTemplate.update(
			"UPDATE callao.fichas_veedor SET actualizado_en = CURRENT_TIMESTAMP WHERE id = ?",
			fichaId
		);
	}

	public void recalculateResultadosFinales(Long evaluadoId) {
		if (evaluadoId == null || evaluadoId <= 0) {
			return;
		}

		jdbcTemplate.update(
			"""
			UPDATE callao.evaluados_grupo e
			SET resultado_final = CASE 
			    WHEN EXISTS (
			        SELECT 1 FROM callao.fichas_veedor_detalle d
			        JOIN callao.fichas_veedor_detalle_criterios dc ON dc.ficha_veedor_detalle_id = d.id
			        JOIN callao.criterios_evaluacion ce ON ce.id = dc.criterio_evaluacion_id
			        WHERE d.evaluado_grupo_id = e.id AND ce.gravedad = 'MUY GRAVE'
			    ) THEN 'DESAPROBADO'
			    ELSE 'APROBADO'
			END,
			actualizado_en = CURRENT_TIMESTAMP
			WHERE e.id = ? AND (SELECT estado FROM callao.grupos_evaluacion WHERE id = e.grupo_id) != 'FINALIZADO'
			""",
			evaluadoId
		);
	}

	private EvaluatorSheetSummaryResponse mapSummary(java.sql.ResultSet rs) throws java.sql.SQLException {
		return new EvaluatorSheetSummaryResponse(
			rs.getLong("evaluado_id"),
			rs.getLong("grupo_id"),
			rs.getInt("numero_grupo"),
			rs.getString("dni"),
			rs.getString("nombres"),
			rs.getBoolean("es_vip"),
			rs.getLong("categoria_id"),
			rs.getString("categoria_codigo"),
			rs.getString("categoria_nombre"),
			rs.getString("placa"),
			rs.getString("resultado_final"),
			rs.getString("estado_grupo"),
			rs.getString("estado_ficha_circuito"),
			toLocalDateTime(rs.getTimestamp("registrado_en")),
			getNullableLong(rs, "evaluador_id"),
			rs.getString("evaluador_nombre"),
			rs.getString("observaciones_circuito"),
			toLocalDateTime(rs.getTimestamp("circuito_registrado_en")),
			toLocalDateTime(rs.getTimestamp("circuito_actualizado_en"))
		);
	}

	private Long getNullableLong(java.sql.ResultSet rs, String column) throws java.sql.SQLException {
		long value = rs.getLong(column);
		return rs.wasNull() ? null : value;
	}

	private Integer getNullableInteger(java.sql.ResultSet rs, String column) throws java.sql.SQLException {
		int value = rs.getInt(column);
		return rs.wasNull() ? null : value;
	}

	private LocalDateTime toLocalDateTime(Timestamp timestamp) {
		return timestamp == null ? null : timestamp.toLocalDateTime();
	}

	public record TipoVeedorRow(
		Long id,
		String codigo,
		String nombre
	) {
	}

	private record ReviewSqlRow(
		Long tipoVeedorId,
		String tipoVeedorCodigo,
		String tipoVeedorNombre,
		Long fichaId,
		Long veedorId,
		String veedorNombre,
		String estadoFicha,
		String observacionesFicha,
		LocalDateTime registradoEn,
		LocalDateTime actualizadoEn,
		Long detalleId,
		String observacionEvaluado,
		Long criterioId,
		Integer criterioCodigo,
		String siglas,
		String descripcion,
		String tipoCriterioCodigo
	) {
	}

	private record ReviewAccumulator(
		ReviewSqlRow row,
		List<EvaluatorCriterionResponse> habilidades,
		List<EvaluatorCriterionResponse> reglamentos
	) {
		ReviewAccumulator(ReviewSqlRow row) {
			this(row, new ArrayList<>(), new ArrayList<>());
		}

		EvaluatorVeedorReviewResponse toResponse() {
			return new EvaluatorVeedorReviewResponse(
				row.tipoVeedorCodigo(),
				row.tipoVeedorNombre(),
				row.fichaId(),
				row.detalleId(),
				row.veedorId(),
				row.veedorNombre(),
				row.estadoFicha(),
				row.observacionesFicha(),
				row.observacionEvaluado(),
				row.registradoEn(),
				row.actualizadoEn(),
				List.copyOf(habilidades),
				List.copyOf(reglamentos)
			);
		}
	}
}
