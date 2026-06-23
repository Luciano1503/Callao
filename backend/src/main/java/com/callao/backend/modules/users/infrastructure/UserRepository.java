package com.callao.backend.modules.users.infrastructure;

import java.util.List;
import java.util.Optional;

import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import com.callao.backend.modules.users.dto.UserResponse;

import lombok.RequiredArgsConstructor;

@Repository
@RequiredArgsConstructor
public class UserRepository {

	private final JdbcTemplate jdbcTemplate;

	public UserRow create(CreateUserRow row) {
		return jdbcTemplate.queryForObject(
			"""
			INSERT INTO callao.usuarios (
				rol_id,
				dni,
				nombres,
				correo,
				celular,
				password_hash,
				estado,
				debe_cambiar_password,
				firma_jpg_url,
				creado_por
			)
			VALUES (?, ?, ?, ?, ?, ?, ?, TRUE, ?, ?)
			RETURNING id, rol_id, dni, nombres, correo, celular, password_hash, estado, debe_cambiar_password, creado_en, firma_jpg_url
			""",
			(rs, rowNum) -> new UserRow(
				rs.getLong("id"),
				rs.getLong("rol_id"),
				rs.getString("dni"),
				rs.getString("nombres"),
				rs.getString("correo"),
				rs.getString("celular"),
				rs.getString("password_hash"),
				rs.getString("estado"),
				rs.getBoolean("debe_cambiar_password"),
				rs.getTimestamp("creado_en").toLocalDateTime(),
				rs.getString("firma_jpg_url")
			),
			row.rolId(),
			row.dni(),
			row.nombres(),
			row.correo(),
			row.celular(),
			row.passwordHash(),
			row.estado(),
			row.firmaJpgUrl(),
			row.creadoPor()
		);
	}

	public List<UserResponse> findAll() {
		return jdbcTemplate.query(
			"""
			SELECT u.id,
			       u.dni,
			       u.nombres,
			       u.correo,
			       u.celular,
			       u.rol_id,
			       r.codigo AS rol_codigo,
			       r.nombre AS rol_nombre,
			       u.estado,
			       u.debe_cambiar_password,
			       u.creado_en,
			       u.firma_jpg_url
			FROM callao.usuarios u
			INNER JOIN callao.roles r ON r.id = u.rol_id
			ORDER BY u.creado_en DESC, u.id DESC
			""",
			(rs, rowNum) -> new UserResponse(
				rs.getLong("id"),
				rs.getString("dni"),
				rs.getString("nombres"),
				rs.getString("correo"),
				rs.getString("celular"),
				rs.getLong("rol_id"),
				rs.getString("rol_codigo"),
				rs.getString("rol_nombre"),
				rs.getString("estado"),
				rs.getBoolean("debe_cambiar_password"),
				true,
				rs.getTimestamp("creado_en").toLocalDateTime(),
				rs.getString("firma_jpg_url")
			)
		);
	}

	public Optional<UserResponse> findById(Long userId) {
		try {
			UserResponse user = jdbcTemplate.queryForObject(
				"""
				SELECT u.id,
				       u.dni,
				       u.nombres,
				       u.correo,
				       u.celular,
				       u.rol_id,
				       r.codigo AS rol_codigo,
				       r.nombre AS rol_nombre,
				       u.estado,
				       u.debe_cambiar_password,
				       u.creado_en,
				       u.firma_jpg_url
				FROM callao.usuarios u
				INNER JOIN callao.roles r ON r.id = u.rol_id
				WHERE u.id = ?
				""",
				(rs, rowNum) -> new UserResponse(
					rs.getLong("id"),
					rs.getString("dni"),
					rs.getString("nombres"),
					rs.getString("correo"),
					rs.getString("celular"),
					rs.getLong("rol_id"),
					rs.getString("rol_codigo"),
					rs.getString("rol_nombre"),
					rs.getString("estado"),
					rs.getBoolean("debe_cambiar_password"),
					true,
					rs.getTimestamp("creado_en").toLocalDateTime(),
					rs.getString("firma_jpg_url")
				),
				userId
			);

			return Optional.ofNullable(user);
		} catch (EmptyResultDataAccessException exception) {
			return Optional.empty();
		}
	}

	public int deactivate(Long userId) {
		return jdbcTemplate.update(
			"""
			UPDATE callao.usuarios
			SET estado = 'INACTIVO'
			WHERE id = ?
			""",
			userId
		);
	}

	public int update(Long userId, String nombres, String correo, String celular, Long rolId, String estado) {
		return jdbcTemplate.update(
			"""
			UPDATE callao.usuarios
			SET nombres = ?,
			    correo = ?,
			    celular = ?,
			    rol_id = ?,
			    estado = ?,
			    actualizado_en = CURRENT_TIMESTAMP
			WHERE id = ?
			""",
			nombres, correo, celular, rolId, estado, userId
		);
	}

	public boolean existsByCorreoExcluding(String correo, Long excludeUserId) {
		Integer count = jdbcTemplate.queryForObject(
			"""
			SELECT COUNT(1)
			FROM callao.usuarios
			WHERE LOWER(correo) = LOWER(?)
			  AND id != ?
			""",
			Integer.class,
			correo,
			excludeUserId
		);
		return count != null && count > 0;
	}

	public Optional<RoleRow> findRoleById(Long roleId) {
		try {
			RoleRow role = jdbcTemplate.queryForObject(
				"""
				SELECT id, codigo, nombre
				FROM callao.roles
				WHERE id = ?
				""",
				(rs, rowNum) -> new RoleRow(
					rs.getLong("id"),
					rs.getString("codigo"),
					rs.getString("nombre")
				),
				roleId
			);

			return Optional.ofNullable(role);
		} catch (EmptyResultDataAccessException exception) {
			return Optional.empty();
		}
	}

	public boolean existsByDniOrCorreo(String dni, String correo) {
		Integer count = jdbcTemplate.queryForObject(
			"""
			SELECT COUNT(1)
			FROM callao.usuarios
			WHERE dni = ?
			   OR LOWER(correo) = LOWER(?)
			""",
			Integer.class,
			dni,
			correo
		);

		return count != null && count > 0;
	}

	public record CreateUserRow(
		Long rolId,
		String dni,
		String nombres,
		String correo,
		String celular,
		String passwordHash,
		String estado,
		String firmaJpgUrl,
		Long creadoPor
	) {
	}

	public record UserRow(
		Long id,
		Long rolId,
		String dni,
		String nombres,
		String correo,
		String celular,
		String passwordHash,
		String estado,
		boolean debeCambiarPassword,
		java.time.LocalDateTime creadoEn,
		String firmaJpgUrl
	) {
	}

	public record RoleRow(
		Long id,
		String codigo,
		String nombre
	) {
	}
}
