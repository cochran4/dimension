import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, from, of } from 'rxjs';
import { Storage } from '@ionic/storage-angular';
import { map, tap, switchMap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthenticationService {

  isAuthenticated: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  token = '';

  constructor(private http: HttpClient, private storage: Storage) { 
    this.init()
  }

  async init() {
    await this.storage.create();
  }

  async ngOnInit() {
    await this.init();
    await this.loadToken();
  }

  async loadToken() {
    const token = await this.storage.get("jwt");
    if (token) {
      console.log('token found: ', token);
      this.token = token;
      this.isAuthenticated.next(true);
    } else {
      this.isAuthenticated.next(false);
    }
  }

  login(info: {
    name: string,
    study: string
  }): Observable<boolean> {

    // temp code until backend is setup
    this.storage.set("name", "some_name");
    this.storage.set("gift_url", "https://www.google.com");
    this.storage.set("study", "study_name");
    this.storage.set("jwt", `eyJhbGciOiJIUzI1NiJ9.eyJSb2xlIjoiQWRtaW4iLCJJc3N1ZXIiOiJJc3N1ZXIiLCJVc2VybmFtZSI6IkphdmFJblVzZSIsImV4cCI6MTcxOTQxNzgzMSwiaWF0IjoxNzE5NDE3ODMxfQ.OBTzujidFAU8qOY2HQMv_OnvePDFLCoxp6uqJgmseoM`)
    this.isAuthenticated.next(true);
    return of(true);

    // return this.http.post("backendserver.com", info).pipe(
    //   map((data: any) => (data.token, data.gift_url)), 
    //   switchMap((token, gift_url) => {
    //     if (gift_url) {
    //      this.storage.set("name", info.name);
    //      this.storage.set("study", info.study);
    //      this.storage.set("token", token);
    //      this.storage.set("gift_url", gift_url)
    //       return of(true);
    //     } else {
    //       return of(false);
    //     }
    //   }),
    //   tap((res) => {
    //     if (res) {
    //       this.isAuthenticated.next(true);
    //     } else {
    //       this.isAuthenticated.next(false);
    //     }
    //   })
    // )
  }
}
