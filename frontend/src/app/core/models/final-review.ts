export interface FinalReviewGroup {
  id: number;
  numeroGrupo: number;
  colorId: number;
  colorNombre: string;
  colorHex: string;
  estado: 'PENDIENTE' | 'EN_REVISION' | 'FINALIZADO';
  totalEvaluados: number;
  registradoEn: string;
  observaciones?: string | null;
}

export interface FinalReviewCriterion {
  siglas: string;
  gravedad: 'LEVE' | 'GRAVE' | 'MUY GRAVE';
}

export interface FinalReviewVeedor {
  tipoVeedorCodigo: string;
  habilidades: FinalReviewCriterion[];
  reglamentos: FinalReviewCriterion[];
}

export interface FinalReviewPerson {
  id: number;
  numeroFila: number;
  dni: string;
  nombres: string;
  categoriaCodigo: string;
  placa: string | null;
  esVip: boolean;
  resultadoFinal: 'PENDIENTE' | 'APROBADO' | 'DESAPROBADO';
  revisiones: FinalReviewVeedor[];
}

export interface FinalReviewDetail {
  grupo: FinalReviewGroup;
  evaluados: FinalReviewPerson[];
  observacionesVeedores: Record<string, string>;
}

export interface FinalizeEvaluationRequest {
  adminId: number;
  resultados: FinalizeEvaluationRowRequest[];
}

export interface FinalizeEvaluationRowRequest {
  evaluadoId: number;
  resultadoFinal: 'PENDIENTE' | 'APROBADO' | 'DESAPROBADO';
}
