package com.callao.backend.modules.auth.infrastructure;

import java.util.Optional;

import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import lombok.RequiredArgsConstructor;

@Repository
@RequiredArgsConstructor
public class AuthRepository {

	private final JdbcTemplate jdbcTemplate;

	public Optional<AuthUserRow> findActiveByIdentifier(String identifier) {
		String normalized = identifier == null ? "" : identifier.trim().toLowerCase();

		try {
			AuthUserRow user = jdbcTemplate.queryForObject(
				"""
				SELECT u.id,
				       u.dni,
				       u.nombres,
				       u.correo,
				       u.celular,
				       u.password_hash,
				       u.estado,
				       u.debe_cambiar_password,
				       r.codigo AS rol_codigo,
				       r.nombre AS rol_nombre
				FROM callao.usuarios u
				INNER JOIN callao.roles r ON r.id = u.rol_id
				WHERE u.estado = 'ACTIVO'
				  AND (LOWER(u.correo) = ? OR u.dni = ?)
				""",
				(rs, rowNum) -> new AuthUserRow(
					rs.getLong("id"),
					rs.getString("dni"),
					rs.getString("nombres"),
					rs.getString("correo"),
					rs.getString("celular"),
					rs.getString("password_hash"),
					rs.getString("estado"),
					rs.getBoolean("debe_cambiar_password"),
					rs.getString("rol_codigo"),
					rs.getString("rol_nombre")
				),
				normalized,
				identifier == null ? "" : identifier.trim()
			);

			return Optional.ofNullable(user);
		} catch (EmptyResultDataAccessException exception) {
			return Optional.empty();
		}
	}

	public Optional<AuthUserRow> findActiveById(Long userId) {
		try {
			AuthUserRow user = jdbcTemplate.queryForObject(
				"""
				SELECT u.id,
				       u.dni,
				       u.nombres,
				       u.correo,
				       u.celular,
				       u.password_hash,
				       u.estado,
				       u.debe_cambiar_password,
				       r.codigo AS rol_codigo,
				       r.nombre AS rol_nombre
				FROM callao.usuarios u
				INNER JOIN callao.roles r ON r.id = u.rol_id
				WHERE u.estado = 'ACTIVO'
				  AND u.id = ?
				""",
				(rs, rowNum) -> new AuthUserRow(
					rs.getLong("id"),
					rs.getString("dni"),
					rs.getString("nombres"),
					rs.getString("correo"),
					rs.getString("celular"),
					rs.getString("password_hash"),
					rs.getString("estado"),
					rs.getBoolean("debe_cambiar_password"),
					rs.getString("rol_codigo"),
					rs.getString("rol_nombre")
				),
				userId
			);

			return Optional.ofNullable(user);
		} catch (EmptyResultDataAccessException exception) {
			return Optional.empty();
		}
	}

	public void updatePassword(Long userId, String passwordHash) {
		jdbcTemplate.update(
			"""
			UPDATE callao.usuarios
			SET password_hash = ?,
			    debe_cambiar_password = FALSE,
			    actualizado_en = CURRENT_TIMESTAMP
			WHERE id = ?
			""",
			passwordHash,
			userId
		);
	}

	public record AuthUserRow(
		Long id,
		String dni,
		String nombres,
		String correo,
		String celular,
		String passwordHash,
		String estado,
		boolean debeCambiarPassword,
		String rolCodigo,
		String rolNombre
	) {
	}
}
