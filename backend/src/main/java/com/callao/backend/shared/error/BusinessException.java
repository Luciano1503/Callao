package com.callao.backend.shared.error;

public class BusinessException extends RuntimeException {

	public BusinessException(String message) {
		super(message);
	}
}
