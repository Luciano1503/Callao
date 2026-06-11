import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const user = authService.currentUser();

  if (!user) {
    return router.createUrlTree(['/login']);
  }

  if (user.debeCambiarPassword) {
    return router.createUrlTree(['/cambiar-contrasena']);
  }

  const profile = route.data['profile'];
  if (authService.canAccessProfile(profile, user.rolCodigo)) {
    if (profile === 'veedor' && !authService.canAccessVeedorType(route.paramMap.get('tipo'), user.rolCodigo)) {
      return router.createUrlTree([authService.defaultRouteForRole(user.rolCodigo)]);
    }

    return true;
  }

  return router.createUrlTree([authService.defaultRouteForRole(user.rolCodigo)]);
};
