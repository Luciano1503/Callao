export interface FinalReviewGroup {
  id: number;
  numeroGrupo: number;
  colorId: number;
  colorNombre: string;
  colorHex: string;
  estado: 'PENDIENTE' | 'EN_REVISION' | 'FINALIZADO';
  totalEvaluados: number;
  registradoEn: string;
}

export interface FinalReviewVeedor {
  tipoVeedorCodigo: string;
  habilidades: string[];
  reglamentos: string[];
}

export interface FinalReviewPerson {
  id: number;
  numeroFila: number;
  dni: string;
  nombres: string;
  categoriaCodigo: string;
  placa: string | null;
  resultadoFinal: 'PENDIENTE' | 'APROBADO' | 'DESAPROBADO';
  revisiones: FinalReviewVeedor[];
}

export interface FinalReviewDetail {
  grupo: FinalReviewGroup;
  evaluados: FinalReviewPerson[];
}

export interface FinalizeEvaluationRequest {
  adminId: number;
  resultados: FinalizeEvaluationRowRequest[];
}

export interface FinalizeEvaluationRowRequest {
  evaluadoId: number;
  resultadoFinal: 'PENDIENTE' | 'APROBADO' | 'DESAPROBADO';
}
