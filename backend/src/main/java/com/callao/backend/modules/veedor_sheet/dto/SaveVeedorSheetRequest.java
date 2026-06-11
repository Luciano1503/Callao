package com.callao.backend.modules.veedor_sheet.dto;

import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;

public record SaveVeedorSheetRequest(
	@NotNull(message = "El veedor es obligatorio.")
	Long veedorId,

	@NotNull(message = "El grupo es obligatorio.")
	Long grupoId,

	String observaciones,

	@Valid
	List<SaveVeedorSheetRowRequest> evaluados
) {
}
