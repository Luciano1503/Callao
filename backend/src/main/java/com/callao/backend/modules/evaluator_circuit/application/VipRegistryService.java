package com.callao.backend.modules.evaluator_circuit.application;

import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.StreamSupport;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.callao.backend.modules.evaluator_circuit.domain.VipRegistry;
import com.callao.backend.modules.evaluator_circuit.infrastructure.VipRegistryRepository;
import com.callao.backend.shared.error.BusinessException;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class VipRegistryService {

	private final VipRegistryRepository repository;

	public List<VipRegistry> findAll() {
		return StreamSupport.stream(repository.findAll().spliterator(), false)
			.collect(Collectors.toList());
	}

	public VipRegistry findByDni(String dni) {
		return repository.findByDni(dni);
	}

	@Transactional
	public VipRegistry register(String dni, String nombres) {
		if (dni == null || !dni.matches("\\d{8}")) {
			throw new BusinessException("El DNI debe tener 8 digitos numericos.");
		}
		if (nombres == null || nombres.trim().isEmpty()) {
			throw new BusinessException("Los nombres no pueden estar vacios.");
		}
		if (repository.existsByDni(dni)) {
			throw new BusinessException("este dni ya registra como vip");
		}

		Authentication auth = SecurityContextHolder.getContext().getAuthentication();
		Long loggedInUserId = (Long) auth.getPrincipal();

		VipRegistry registry = VipRegistry.create(dni, nombres.trim().toUpperCase(), loggedInUserId.intValue());
		registry = repository.save(registry);
		repository.updateVipStatusInEvaluados(dni, true);
		return registry;
	}

	@Transactional
	public void delete(String dni) {
		if (!repository.existsByDni(dni)) {
			throw new BusinessException("El DNI " + dni + " no se encuentra en el registro VIP.");
		}
		repository.deleteByDni(dni);
		repository.updateVipStatusInEvaluados(dni, false);
	}
}
