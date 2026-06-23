export interface CreateUserRequest {
  dni: string;
  nombres: string;
  correo: string;
  celular?: string;
  rolId: number;
  estado: 'ACTIVO' | 'INACTIVO';
  firmaJpgUrl?: string;
  creadoPor: number | null;
}

export interface UpdateUserRequest {
  nombres: string;
  correo: string;
  celular: string;
  rolId: number;
  estado: 'ACTIVO' | 'INACTIVO';
}

export interface UserResponse {
  id: number;
  dni: string;
  nombres: string;
  correo: string;
  celular: string | null;
  rolId: number;
  rolCodigo: string;
  rolNombre: string;
  estado: 'ACTIVO' | 'INACTIVO';
  debeCambiarPassword: boolean;
  emailSent: boolean;
  creadoEn: string;
  firmaJpgUrl?: string;
}
