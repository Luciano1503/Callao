package com.callao.backend.modules.auth.application;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.callao.backend.modules.auth.dto.ChangePasswordRequest;
import com.callao.backend.modules.auth.dto.LoginRequest;
import com.callao.backend.modules.auth.dto.LoginResponse;
import com.callao.backend.modules.auth.infrastructure.AuthRepository;
import com.callao.backend.modules.auth.infrastructure.AuthRepository.AuthUserRow;
import com.callao.backend.shared.error.BusinessException;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AuthService {

	private final AuthRepository authRepository;
	private final PasswordEncoder passwordEncoder;

	public LoginResponse login(LoginRequest request) {
		AuthUserRow user = authRepository.findActiveByIdentifier(request.usuario())
			.orElseThrow(InvalidCredentialsException::new);

		if (!passwordEncoder.matches(request.password(), user.passwordHash())) {
			throw new InvalidCredentialsException();
		}

		return new LoginResponse(
			user.id(),
			user.dni(),
			user.nombres(),
			user.correo(),
			user.celular(),
			user.rolCodigo(),
			user.rolNombre(),
			user.debeCambiarPassword()
		);
	}

	public void changePassword(ChangePasswordRequest request) {
		if (!request.newPassword().equals(request.confirmNewPassword())) {
			throw new BusinessException("La nueva contrasena y su confirmacion no coinciden.");
		}

		AuthUserRow user = authRepository.findActiveById(request.usuarioId())
			.orElseThrow(InvalidCredentialsException::new);

		if (!passwordEncoder.matches(request.oldPassword(), user.passwordHash())) {
			throw new InvalidCredentialsException();
		}

		authRepository.updatePassword(user.id(), passwordEncoder.encode(request.newPassword()));
	}
}
