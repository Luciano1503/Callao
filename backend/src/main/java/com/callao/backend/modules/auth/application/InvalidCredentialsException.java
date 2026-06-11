package com.callao.backend.modules.auth.application;

public class InvalidCredentialsException extends RuntimeException {
	public InvalidCredentialsException() {
		super("Credenciales invalidas.");
	}
}
