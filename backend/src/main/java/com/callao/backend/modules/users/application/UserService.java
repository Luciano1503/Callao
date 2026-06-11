package com.callao.backend.modules.users.application;

import java.util.List;
import java.util.Locale;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.callao.backend.modules.notification.application.EmailDeliveryException;
import com.callao.backend.modules.notification.application.EmailService;
import com.callao.backend.modules.notification.application.EmailService.WelcomeEmail;
import com.callao.backend.modules.users.dto.CreateUserRequest;
import com.callao.backend.modules.users.dto.UpdateUserRequest;
import com.callao.backend.modules.users.dto.UserResponse;
import com.callao.backend.modules.users.infrastructure.UserRepository;
import com.callao.backend.modules.users.infrastructure.UserRepository.CreateUserRow;
import com.callao.backend.modules.users.infrastructure.UserRepository.RoleRow;
import com.callao.backend.modules.users.infrastructure.UserRepository.UserRow;
import com.callao.backend.shared.error.BusinessException;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class UserService {

	private final UserRepository userRepository;
	private final PasswordEncoder passwordEncoder;
	private final EmailService emailService;

	public UserResponse create(CreateUserRequest request) {
		if (!request.password().equals(request.confirmPassword())) {
			throw new BusinessException("Las contrasenas no coinciden.");
		}

		String estado = normalizeEstado(request.estado());
		RoleRow role = userRepository.findRoleById(request.rolId())
			.orElseThrow(() -> new BusinessException("El rol seleccionado no existe."));

		String dni = request.dni().trim();
		String correo = request.correo().trim().toLowerCase(Locale.ROOT);
		String celular = blankToNull(request.celular());

		validateDni(dni);
		validateEmail(correo);
		validatePhone(celular);

		if (userRepository.existsByDniOrCorreo(dni, correo)) {
			throw new BusinessException("Ya existe un usuario registrado con ese DNI o correo.");
		}

		UserRow created = userRepository.create(new CreateUserRow(
			role.id(),
			dni,
			request.nombres().trim(),
			correo,
			celular,
			passwordEncoder.encode(request.password()),
			estado,
			request.creadoPor()
		));

		boolean emailSent = false;
		try {
			emailSent = emailService.sendWelcomeEmail(new WelcomeEmail(
				correo,
				created.nombres(),
				role.nombre(),
				created.dni(),
				request.password()
			));
		} catch (EmailDeliveryException exception) {
			emailSent = false;
		}

		return new UserResponse(
			created.id(),
			created.dni(),
			created.nombres(),
			created.correo(),
			created.celular(),
			role.id(),
			role.codigo(),
			role.nombre(),
			created.estado(),
			created.debeCambiarPassword(),
			emailSent,
			created.creadoEn()
		);
	}

	public List<UserResponse> findAll() {
		return userRepository.findAll();
	}

	public UserResponse deactivate(Long userId) {
		if (userRepository.deactivate(userId) == 0) {
			throw new BusinessException("El usuario seleccionado no existe.");
		}

		return userRepository.findById(userId)
			.orElseThrow(() -> new BusinessException("El usuario seleccionado no existe."));
	}

	public UserResponse update(Long userId, UpdateUserRequest request) {
		userRepository.findById(userId)
			.orElseThrow(() -> new BusinessException("El usuario seleccionado no existe."));

		String correo = request.correo().trim().toLowerCase(Locale.ROOT);
		String celular = blankToNull(request.celular());
		String estado = normalizeEstado(request.estado());

		validateEmail(correo);
		validatePhone(celular);

		if (userRepository.existsByCorreoExcluding(correo, userId)) {
			throw new BusinessException("El correo ya está en uso por otro usuario.");
		}

		RoleRow role = userRepository.findRoleById(request.rolId())
			.orElseThrow(() -> new BusinessException("El rol seleccionado no existe."));

		userRepository.update(userId, request.nombres().trim(), correo, celular, role.id(), estado);

		return userRepository.findById(userId)
			.orElseThrow(() -> new BusinessException("No se pudo recuperar el usuario actualizado."));
	}

	private String normalizeEstado(String estado) {
		String normalized = estado == null ? "" : estado.trim().toUpperCase(Locale.ROOT);
		if (!normalized.equals("ACTIVO") && !normalized.equals("INACTIVO")) {
			throw new BusinessException("El estado del usuario no es valido.");
		}

		return normalized;
	}

	private void validateDni(String dni) {
		if (!dni.matches("\\d{8}")) {
			throw new BusinessException("El DNI debe tener 8 digitos.");
		}
	}

	private void validateEmail(String correo) {
		if (!correo.matches("^[^\\s@]+@[^\\s@]+\\.[^\\s@]{2,}$")) {
			throw new BusinessException("El correo no tiene un formato valido.");
		}
	}

	private void validatePhone(String celular) {
		if (celular != null && !celular.matches("\\d{9}")) {
			throw new BusinessException("El celular debe tener 9 digitos.");
		}
	}

	private String blankToNull(String value) {
		if (value == null || value.trim().isBlank()) {
			return null;
		}

		return value.trim();
	}
}
