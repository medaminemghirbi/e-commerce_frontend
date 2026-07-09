import { inject, Injector } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { toObservable } from '@angular/core/rxjs-interop';
import { filter, firstValueFrom } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const injector = inject(Injector);
  const router = inject(Router);
  await firstValueFrom(toObservable(auth.loading, { injector }).pipe(filter(l => !l)));
  if (auth.isLoggedIn()) return true;
  return router.createUrlTree(['/auth/login']);
};
