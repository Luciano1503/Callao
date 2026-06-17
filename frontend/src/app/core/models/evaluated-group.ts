export interface EvaluatedPerson {
  id: number;
  grupoId: number;
  numeroFila: number;
  dni: string;
  nombres: string;
  placa: string | null;
  categoriaId: number;
  categoriaCodigo: string;
  categoriaNombre: string;
  esVip: boolean;
  resultadoFinal: string;
  creadoEn: string;
}

export interface EvaluatedGroup {
  id: number;
  numeroGrupo: number;
  colorId: number;
  colorNombre: string;
  colorHex: string;
  supervisorId: number;
  observaciones: string | null;
  estado: string;
  registradoEn: string;
  finalizadoEn: string | null;
  totalEvaluados: number;
  capacidadMaxima: number;
  puedeAgregar: boolean;
  evaluados: EvaluatedPerson[];
}

export interface EvaluatedGroupSummary {
  id: number;
  numeroGrupo: number;
  colorNombre: string;
  colorHex: string;
  estado: string;
  totalEvaluados: number;
  registradoEn: string;
}

export interface CreateEvaluatedRequest {
  supervisorId: number;
  dni: string;
  nombres: string;
  categoriaId: number;
  placa: string;
  esVip: boolean;
}

export interface CreateGroupRequest {
  supervisorId: number;
  colorId: number | null;
}

export interface FinalizeGroupRequest {
  supervisorId: number;
  observaciones: string;
}

export interface UpdateGroupColorRequest {
  supervisorId: number;
  colorId: number;
}

export interface UpdateGroupDateRequest {
  supervisorId: number;
  registradoEn: string;
}
