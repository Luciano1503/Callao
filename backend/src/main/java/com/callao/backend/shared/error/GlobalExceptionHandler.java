package com.callao.backend.shared.error;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import com.callao.backend.modules.auth.application.InvalidCredentialsException;
import com.callao.backend.shared.api.ApiResponse;

@RestControllerAdvice
public class GlobalExceptionHandler {

	@ExceptionHandler(MethodArgumentNotValidException.class)
	public ResponseEntity<ApiResponse<Map<String, String>>> handleValidation(MethodArgumentNotValidException exception) {
		Map<String, String> errors = exception.getBindingResult()
			.getFieldErrors()
			.stream()
			.collect(
				java.util.stream.Collectors.toMap(
					error -> error.getField(),
					error -> error.getDefaultMessage() == null ? "Valor invalido" : error.getDefaultMessage(),
					(first, second) -> first
				)
			);

		return ResponseEntity
			.status(HttpStatus.BAD_REQUEST)
			.body(ApiResponse.error("La solicitud contiene errores de validacion.", errors));
	}

	@ExceptionHandler(InvalidCredentialsException.class)
	public ResponseEntity<ApiResponse<Void>> handleInvalidCredentials(InvalidCredentialsException exception) {
		return ResponseEntity
			.status(HttpStatus.UNAUTHORIZED)
			.body(ApiResponse.error(exception.getMessage(), null));
	}

	@ExceptionHandler(BusinessException.class)
	public ResponseEntity<ApiResponse<Void>> handleBusiness(BusinessException exception) {
		return ResponseEntity
			.status(HttpStatus.BAD_REQUEST)
			.body(ApiResponse.error(exception.getMessage(), null));
	}

	@ExceptionHandler(Exception.class)
	public ResponseEntity<ApiResponse<Void>> handleUnexpected(Exception exception) {
		exception.printStackTrace();
		return ResponseEntity
			.status(HttpStatus.INTERNAL_SERVER_ERROR)
			.body(ApiResponse.error("Ocurrio un error interno.", null));
	}
}
