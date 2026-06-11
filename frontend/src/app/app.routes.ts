import { Routes } from '@angular/router';

import { authGuard } from './core/guards/auth.guard';
import { MainLayout } from './layout/main-layout/main-layout';
import { Dashboard } from './features/admin/dashboard/dashboard';
import { EditUser } from './features/admin/edit-user/edit-user';
import { EvaluatedRelation } from './features/supervisor-evaluados/evaluated-relation/evaluated-relation';
import { EvaluationSheets } from './features/evaluador-circuito/evaluation-sheets/evaluation-sheets';
import { FinalReview } from './features/admin/final-review/final-review';
import { Login } from './features/auth/login/login';
import { NewUser } from './features/admin/new-user/new-user';
import { Profile } from './features/account/profile/profile';
import { Users } from './features/admin/users/users';
import { VeedorSheet } from './features/veedores/veedor-sheet/veedor-sheet';
import { Verification } from './features/auth/verification/verification';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'login'
  },
  {
    path: 'login',
    component: Login,
    title: 'Iniciar sesion'
  },
  {
    path: 'verify',
    redirectTo: 'cambiar-contrasena'
  },
  {
    path: 'cambiar-contrasena',
    component: Verification,
    title: 'Cambio de contrasena'
  },
  {
    path: '',
    component: MainLayout,
    children: [
      {
        path: 'dashboard',
        component: Dashboard,
        title: 'Panel de control',
        canActivate: [authGuard],
        data: { profile: 'admin' }
      },
      {
        path: 'usuarios',
        component: Users,
        title: 'Mantenimiento de usuarios',
        canActivate: [authGuard],
        data: { profile: 'admin' }
      },
      {
        path: 'usuarios/nuevo',
        component: NewUser,
        title: 'Nuevo usuario',
        canActivate: [authGuard],
        data: { profile: 'admin' }
      },
      {
        path: 'usuarios/:dni/editar',
        component: EditUser,
        title: 'Editar usuario',
        canActivate: [authGuard],
        data: { profile: 'admin' }
      },
      {
        path: 'relacion-evaluados',
        component: EvaluatedRelation,
        title: 'Relacion de evaluados',
        canActivate: [authGuard],
        data: { profile: 'supervisor' }
      },
      {
        path: 'fichas-evaluacion',
        component: EvaluationSheets,
        title: 'Fichas de evaluacion',
        canActivate: [authGuard],
        data: { profile: 'evaluador' }
      },
      {
        path: 'veedores/:tipo',
        component: VeedorSheet,
        title: 'Ficha de veedor',
        canActivate: [authGuard],
        data: { profile: 'veedor' }
      },
      {
        path: 'revision-final',
        component: FinalReview,
        title: 'Revision final',
        canActivate: [authGuard],
        data: { profile: 'admin' }
      },
      {
        path: 'perfil',
        component: Profile,
        title: 'Configuracion de perfil',
        canActivate: [authGuard]
      }
    ]
  },
  {
    path: '**',
    redirectTo: 'login'
  }
];
