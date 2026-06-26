package com.callao.backend.modules.evaluator_circuit.domain;

import java.time.Instant;

public record VipRegistry(
	Integer id,
	String dni,
	String nombres,
	Integer creadoPor,
	Instant creadoEn
) {
	public static VipRegistry create(String dni, String nombres, Integer creadoPor) {
		return new VipRegistry((Integer) null, dni, nombres, creadoPor, Instant.now());
	}
}
