export interface LoginRequest {
  usuario: string;
  password: string;
}

export interface ChangePasswordRequest {
  usuarioId: number;
  oldPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}

export interface LoginResponse {
  usuarioId: number;
  dni: string;
  nombres: string;
  correo: string;
  celular: string | null;
  rolCodigo: string;
  rolNombre: string;
  debeCambiarPassword: boolean;
}
