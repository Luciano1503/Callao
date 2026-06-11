package com.callao.backend.modules.users.dto;

import java.time.LocalDateTime;

public record UserResponse(
	Long id,
	String dni,
	String nombres,
	String correo,
	String celular,
	Long rolId,
	String rolCodigo,
	String rolNombre,
	String estado,
	boolean debeCambiarPassword,
	boolean emailSent,
	LocalDateTime creadoEn
) {
}
