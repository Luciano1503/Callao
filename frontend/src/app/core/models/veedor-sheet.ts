export interface VeedorSheetRow {
  evaluadoGrupoId: number;
  numeroFila: number;
  dni: string;
  nombres: string;
  categoriaCodigo: string;
  placa: string | null;
  resultadoFinal: 'PENDIENTE' | 'APROBADO' | 'DESAPROBADO';
  observacion: string | null;
  habilidadIds: number[];
  reglamentoIds: number[];
}

export interface VeedorSheet {
  fichaId: number | null;
  grupoId: number;
  numeroGrupo: number;
  colorNombre: string;
  colorHex: string;
  tipoVeedorCodigo: string;
  tipoVeedorNombre: string;
  estadoGrupo: string;
  estadoFicha: string;
  observaciones: string | null;
  registradoEn: string;
  evaluados: VeedorSheetRow[];
}

export interface SaveVeedorSheetRequest {
  veedorId: number;
  grupoId: number;
  observaciones: string;
  evaluados: SaveVeedorSheetRowRequest[];
}

export interface SaveVeedorSheetRowRequest {
  evaluadoGrupoId: number;
  observacion: string | null;
  habilidadIds: number[];
  reglamentoIds: number[];
}
