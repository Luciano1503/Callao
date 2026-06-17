package com.callao.backend.modules.final_review.dto;

import java.util.List;

public record FinalReviewPersonResponse(
	Long id,
	Integer numeroFila,
	String dni,
	String nombres,
	String categoriaCodigo,
	String placa,
	String resultadoFinal,
	boolean esVip,
	List<FinalReviewVeedorResponse> revisiones
) {
}
