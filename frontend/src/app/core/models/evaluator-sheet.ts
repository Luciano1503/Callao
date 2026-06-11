export interface EvaluatorCriterion {
  id: number;
  codigo: number;
  siglas: string;
  descripcion: string;
  tipoCodigo: string;
}

export interface EvaluatorSheetSummary {
  evaluadoId: number;
  grupoId: number;
  numeroGrupo: number;
  dni: string;
  nombres: string;
  categoriaId: number;
  categoriaCodigo: string;
  categoriaNombre: string;
  placa: string | null;
  resultadoFinal: string;
  estadoGrupo: string;
  estadoFichaCircuito: string;
  registradoEn: string;
  evaluadorId: number | null;
  evaluadorNombre: string | null;
  observacionesCircuito: string | null;
  circuitoRegistradoEn: string | null;
  circuitoActualizadoEn: string | null;
}

export interface EvaluatorVeedorReview {
  tipoVeedorCodigo: string;
  tipoVeedorNombre: string;
  fichaId: number | null;
  detalleId: number | null;
  veedorId: number | null;
  veedorNombre: string | null;
  estadoFicha: string | null;
  observacionesFicha: string | null;
  observacionEvaluado: string | null;
  registradoEn: string | null;
  actualizadoEn: string | null;
  habilidades: EvaluatorCriterion[];
  reglamentos: EvaluatorCriterion[];
}

export interface EvaluatorSheetDetail {
  ficha: EvaluatorSheetSummary;
  revisiones: EvaluatorVeedorReview[];
}

export interface UpdateEvaluatorReview {
  tipoVeedorCodigo: string;
  observacionEvaluado: string | null;
  habilidadIds: number[];
  reglamentoIds: number[];
}

export interface UpdateEvaluatorSheetRequest {
  evaluadorId: number;
  observaciones: string | null;
  revisiones: UpdateEvaluatorReview[];
}
