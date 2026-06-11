package com.callao.backend.modules.final_review.infrastructure;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import com.callao.backend.modules.final_review.dto.FinalReviewGroupResponse;
import com.callao.backend.modules.final_review.dto.FinalReviewPersonResponse;
import com.callao.backend.modules.final_review.dto.FinalReviewVeedorResponse;

import lombok.RequiredArgsConstructor;

@Repository
@RequiredArgsConstructor
public class FinalReviewRepository {

	private final JdbcTemplate jdbcTemplate;

	public List<FinalReviewGroupResponse> findGroups() {
		return jdbcTemplate.query(
			"""
			SELECT g.id,
			       g.numero_grupo,
			       g.color_id,
			       c.nombre AS color_nombre,
			       c.codigo_hex AS color_hex,
			       CASE
			         WHEN g.estado = 'FINALIZADO' THEN 'FINALIZADO'
			         WHEN COUNT(e.id) FILTER (WHERE e.resultado_final <> 'PENDIENTE') > 0 THEN 'EN_REVISION'
			         ELSE 'PENDIENTE'
			       END AS estado_revision,
			       COUNT(e.id) AS total_evaluados,
			       g.registrado_en
			FROM callao.grupos_evaluacion g
			INNER JOIN callao.colores_grupo c ON c.id = g.color_id
			LEFT JOIN callao.evaluados_grupo e ON e.grupo_id = g.id
			GROUP BY g.id, g.numero_grupo, g.color_id, c.nombre, c.codigo_hex, g.estado, g.registrado_en
			ORDER BY g.numero_grupo DESC, g.id DESC
			""",
			(rs, rowNum) -> new FinalReviewGroupResponse(
				rs.getLong("id"),
				rs.getInt("numero_grupo"),
				rs.getLong("color_id"),
				rs.getString("color_nombre"),
				rs.getString("color_hex"),
				rs.getString("estado_revision"),
				rs.getInt("total_evaluados"),
				rs.getTimestamp("registrado_en").toLocalDateTime()
			)
		);
	}

	public Optional<FinalReviewGroupResponse> findGroup(Long groupId) {
		return findGroups().stream()
			.filter(group -> group.id().equals(groupId))
			.findFirst();
	}

	public Optional<Long> findTipoVeedorId(String tipoVeedorCodigo) {
		try {
			Long id = jdbcTemplate.queryForObject(
				"""
				SELECT id
				FROM callao.tipos_veedor
				WHERE codigo = ?
				""",
				Long.class,
				tipoVeedorCodigo
			);
			return Optional.ofNullable(id);
		} catch (EmptyResultDataAccessException exception) {
			return Optional.empty();
		}
	}

	public List<FinalReviewPersonResponse> findPeople(Long groupId) {
		List<PersonRow> people = jdbcTemplate.query(
			"""
			SELECT e.id,
			       e.numero_fila,
			       e.dni,
			       e.nombres,
			       e.placa,
			       c.codigo AS categoria_codigo,
			       e.resultado_final
			FROM callao.evaluados_grupo e
			INNER JOIN callao.categorias c ON c.id = e.categoria_id
			WHERE e.grupo_id = ?
			ORDER BY e.numero_fila ASC, e.id ASC
			""",
			(rs, rowNum) -> new PersonRow(
				rs.getLong("id"),
				rs.getInt("numero_fila"),
				rs.getString("dni"),
				rs.getString("nombres"),
				rs.getString("categoria_codigo"),
				rs.getString("placa"),
				rs.getString("resultado_final")
			),
			groupId
		);

		List<CriteriaRow> criteria = jdbcTemplate.query(
			"""
			SELECT d.evaluado_grupo_id,
			       tv.codigo AS tipo_veedor_codigo,
			       ce.siglas,
			       tc.codigo AS tipo_criterio_codigo
			FROM callao.fichas_veedor_detalle d
			INNER JOIN callao.fichas_veedor fv ON fv.id = d.ficha_veedor_id
			INNER JOIN callao.tipos_veedor tv ON tv.id = fv.tipo_veedor_id
			INNER JOIN callao.fichas_veedor_detalle_criterios dc ON dc.ficha_veedor_detalle_id = d.id
			INNER JOIN callao.criterios_evaluacion ce ON ce.id = dc.criterio_evaluacion_id
			INNER JOIN callao.tipos_criterio_evaluacion tc ON tc.id = ce.tipo_criterio_id
			WHERE fv.grupo_id = ?
			""",
			(rs, rowNum) -> new CriteriaRow(
				rs.getLong("evaluado_grupo_id"),
				rs.getString("tipo_veedor_codigo"),
				rs.getString("siglas"),
				rs.getString("tipo_criterio_codigo")
			),
			groupId
		);

		Map<Long, Map<String, VeedorBuilder>> builders = new HashMap<>();
		for (CriteriaRow row : criteria) {
			builders
				.computeIfAbsent(row.evaluadoId(), k -> new HashMap<>())
				.computeIfAbsent(row.tipoVeedorCodigo(), k -> new VeedorBuilder(row.tipoVeedorCodigo()))
				.addCriterion(row.siglas(), row.tipoCriterioCodigo());
		}

		List<FinalReviewPersonResponse> result = new ArrayList<>();
		for (PersonRow p : people) {
			Map<String, VeedorBuilder> personBuilders = builders.getOrDefault(p.id(), Map.of());
			List<FinalReviewVeedorResponse> revisiones = personBuilders.values().stream()
				.map(VeedorBuilder::build)
				.toList();

			result.add(new FinalReviewPersonResponse(
				p.id(),
				p.numeroFila(),
				p.dni(),
				p.nombres(),
				p.categoriaCodigo(),
				p.placa(),
				p.resultadoFinal(),
				revisiones
			));
		}

		return result;
	}

	public boolean groupExists(Long groupId) {
		try {
			Integer count = jdbcTemplate.queryForObject(
				"SELECT COUNT(1) FROM callao.grupos_evaluacion WHERE id = ?",
				Integer.class,
				groupId
			);
			return count != null && count > 0;
		} catch (EmptyResultDataAccessException exception) {
			return false;
		}
	}

	public void updateResult(Long groupId, Long evaluatedId, String result, Long adminId) {
		jdbcTemplate.update(
			"""
			UPDATE callao.evaluados_grupo
			SET resultado_final = ?,
			    revisado_por = ?,
			    revisado_en = CURRENT_TIMESTAMP,
			    actualizado_en = CURRENT_TIMESTAMP
			WHERE id = ?
			  AND grupo_id = ?
			""",
			result,
			adminId,
			evaluatedId,
			groupId
		);
	}

	public void finalizeGroup(Long groupId, Long adminId) {
		jdbcTemplate.update(
			"""
			UPDATE callao.grupos_evaluacion
			SET estado = 'FINALIZADO',
			    finalizado_por = ?,
			    finalizado_en = CURRENT_TIMESTAMP
			WHERE id = ?
			""",
			adminId,
			groupId
		);
	}

	private record PersonRow(
		Long id,
		Integer numeroFila,
		String dni,
		String nombres,
		String categoriaCodigo,
		String placa,
		String resultadoFinal
	) {}

	private record CriteriaRow(
		Long evaluadoId,
		String tipoVeedorCodigo,
		String siglas,
		String tipoCriterioCodigo
	) {}

	private static class VeedorBuilder {
		private final String tipoVeedorCodigo;
		private final List<String> habilidades = new ArrayList<>();
		private final List<String> reglamentos = new ArrayList<>();

		public VeedorBuilder(String tipoVeedorCodigo) {
			this.tipoVeedorCodigo = tipoVeedorCodigo;
		}

		public void addCriterion(String siglas, String tipoCriterioCodigo) {
			if ("REGLAMENTO_TRANSITO".equals(tipoCriterioCodigo)) {
				reglamentos.add(siglas);
			} else {
				habilidades.add(siglas);
			}
		}

		public FinalReviewVeedorResponse build() {
			return new FinalReviewVeedorResponse(tipoVeedorCodigo, habilidades, reglamentos);
		}
	}
}
