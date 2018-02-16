import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Observable } from 'rxjs/Observable';

import * as cmBrowser from 'codemirror/src/util/browser';


@Injectable()
export class MobileGuard implements CanActivate {

  constructor(
    private router: Router
  ) {}

  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean> | Promise<boolean> | boolean {

    if (cmBrowser.mobile) {
      this.router.navigate(['pages', 'sadness']);
      return false;
    }

    return true;
  }
}
