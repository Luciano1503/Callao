package com.callao.backend.modules.catalog.infrastructure;

import java.util.List;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import com.callao.backend.modules.catalog.dto.CategoriaCatalogResponse;
import com.callao.backend.modules.catalog.dto.ColorCatalogResponse;
import com.callao.backend.modules.catalog.dto.CriterioCatalogResponse;
import com.callao.backend.modules.catalog.dto.RolCatalogResponse;
import com.callao.backend.modules.catalog.dto.TipoCriterioCatalogResponse;

import lombok.RequiredArgsConstructor;

@Repository
@RequiredArgsConstructor
public class CatalogRepository {

	private final JdbcTemplate jdbcTemplate;

	public List<RolCatalogResponse> findRoles() {
		return jdbcTemplate.query(
			"""
			SELECT id, codigo, nombre
			FROM callao.roles
			ORDER BY id
			""",
			(rs, rowNum) -> new RolCatalogResponse(
				rs.getLong("id"),
				rs.getString("codigo"),
				rs.getString("nombre")
			)
		);
	}

	public List<CategoriaCatalogResponse> findCategorias() {
		return jdbcTemplate.query(
			"""
			SELECT id, codigo, nombre
			FROM callao.categorias
			WHERE activo = TRUE
			ORDER BY codigo
			""",
			(rs, rowNum) -> new CategoriaCatalogResponse(
				rs.getLong("id"),
				rs.getString("codigo"),
				rs.getString("nombre")
			)
		);
	}

	public List<ColorCatalogResponse> findColores() {
		return jdbcTemplate.query(
			"""
			SELECT id, nombre, codigo_hex
			FROM callao.colores_grupo
			WHERE activo = TRUE
			ORDER BY id
			""",
			(rs, rowNum) -> new ColorCatalogResponse(
				rs.getLong("id"),
				rs.getString("nombre"),
				rs.getString("codigo_hex")
			)
		);
	}

	public List<TipoCriterioCatalogResponse> findTiposCriterio() {
		return jdbcTemplate.query(
			"""
			SELECT id, codigo, nombre
			FROM callao.tipos_criterio_evaluacion
			ORDER BY nombre
			""",
			(rs, rowNum) -> new TipoCriterioCatalogResponse(
				rs.getLong("id"),
				rs.getString("codigo"),
				rs.getString("nombre")
			)
		);
	}

	public List<CriterioCatalogResponse> findCriteriosByTipo(String tipoCodigo) {
		return jdbcTemplate.query(
			"""
			SELECT ce.id,
			       ce.tipo_criterio_id,
			       tc.codigo AS tipo_codigo,
			       tc.nombre AS tipo_nombre,
			       ce.codigo,
			       ce.descripcion,
			       ce.siglas
			FROM callao.criterios_evaluacion ce
			INNER JOIN callao.tipos_criterio_evaluacion tc ON tc.id = ce.tipo_criterio_id
			WHERE tc.codigo = ?
			  AND ce.activo = TRUE
			ORDER BY ce.codigo
			""",
			(rs, rowNum) -> new CriterioCatalogResponse(
				rs.getLong("id"),
				rs.getLong("tipo_criterio_id"),
				rs.getString("tipo_codigo"),
				rs.getString("tipo_nombre"),
				rs.getInt("codigo"),
				rs.getString("descripcion"),
				rs.getString("siglas")
			),
			tipoCodigo
		);
	}

	public List<com.callao.backend.modules.catalog.dto.VehiculoCatalogResponse> findVehiculos() {
		return jdbcTemplate.query(
			"""
			SELECT id, placa
			FROM callao.vehiculos
			WHERE activo = TRUE
			ORDER BY placa
			""",
			(rs, rowNum) -> new com.callao.backend.modules.catalog.dto.VehiculoCatalogResponse(
				rs.getLong("id"),
				rs.getString("placa")
			)
		);
	}
}
