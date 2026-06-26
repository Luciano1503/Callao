package com.callao.backend.modules.evaluator_circuit.infrastructure;

import java.util.List;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import com.callao.backend.modules.evaluator_circuit.domain.VipRegistry;

import lombok.RequiredArgsConstructor;

@Repository
@RequiredArgsConstructor
public class VipRegistryRepository {

	private final JdbcTemplate jdbcTemplate;

	private final RowMapper<VipRegistry> rowMapper = (rs, rowNum) -> {
		Integer id = rs.getObject("id") != null ? rs.getInt("id") : null;
		String dni = rs.getString("dni");
		String nombres = rs.getString("nombres");
		Integer creadoPor = rs.getObject("creado_por") != null ? rs.getInt("creado_por") : null;
		java.time.Instant creadoEn = rs.getTimestamp("creado_en") != null ? rs.getTimestamp("creado_en").toInstant() : null;
		return new VipRegistry(id, dni, nombres, creadoPor, creadoEn);
	};

	public List<VipRegistry> findAll() {
		return jdbcTemplate.query(
			"SELECT id, dni, nombres, creado_por, creado_en FROM callao.vip_registry ORDER BY id DESC",
			rowMapper
		);
	}

	public boolean existsByDni(String dni) {
		Integer count = jdbcTemplate.queryForObject(
			"SELECT count(1) FROM callao.vip_registry WHERE dni = ?",
			Integer.class,
			dni
		);
		return count != null && count > 0;
	}

	public VipRegistry findByDni(String dni) {
		List<VipRegistry> results = jdbcTemplate.query(
			"SELECT id, dni, nombres, creado_por, creado_en FROM callao.vip_registry WHERE dni = ?",
			rowMapper,
			dni
		);
		return results.isEmpty() ? null : results.get(0);
	}

	public VipRegistry save(VipRegistry registry) {
		jdbcTemplate.update(
			"INSERT INTO callao.vip_registry (dni, nombres, creado_por) VALUES (?, ?, ?)",
			registry.dni(),
			registry.nombres(),
			registry.creadoPor()
		);
		return registry;
	}

	public void deleteByDni(String dni) {
		jdbcTemplate.update("DELETE FROM callao.vip_registry WHERE dni = ?", dni);
	}

	public void updateVipStatusInEvaluados(String dni, boolean esVip) {
		jdbcTemplate.update("UPDATE callao.evaluados_grupo SET es_vip = ? WHERE dni = ?", esVip, dni);
	}
}
