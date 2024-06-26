import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { Router } from '@angular/router';
import { Storage } from '@ionic/storage-angular';

@Injectable({
  providedIn: 'root'
})
export class FinishGuard implements CanActivate {
  
  constructor(private router: Router, private localStorage: Storage){}

  async canActivate(): Promise<boolean> {
      const finished = await this.localStorage.get("finished");
      if (finished && (finished == "true")) {
        return true;
      } else {
        return false;
      }
  }
  
}
