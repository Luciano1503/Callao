package com.callao.backend.modules.auth.dto;

public record LoginResponse(
	Long usuarioId,
	String dni,
	String nombres,
	String correo,
	String celular,
	String rolCodigo,
	String rolNombre,
	boolean debeCambiarPassword
) {
}
