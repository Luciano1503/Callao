export interface RolCatalog {
  id: number;
  codigo: string;
  nombre: string;
}

export interface CategoriaCatalog {
  id: number;
  codigo: string;
  nombre: string;
}

export interface ColorCatalog {
  id: number;
  nombre: string;
  codigoHex: string;
}

export interface CriterioCatalog {
  id: number;
  tipoCriterioId: number;
  tipoCodigo: string;
  tipoNombre: string;
  codigo: number;
  descripcion: string;
  siglas: string;
}

export interface VeedorCriteriosCatalog {
  tipoVeedorCodigo: string;
  habilidades: CriterioCatalog[];
  reglamentos: CriterioCatalog[];
}
