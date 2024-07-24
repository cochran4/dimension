import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, from, of } from 'rxjs';
import { Storage } from '@ionic/storage-angular';
import { catchError, switchMap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthenticationService {

  isAuthenticated: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  jwt = '';
  gift_url = '';

  constructor(private http: HttpClient, private storage: Storage) { 
    this.init()
  }

  async init() {
    await this.storage.create();
  }

  async ngOnInit() {
    await this.init();
    await this.loadJWT();
  }

  async loadJWT() {
    const jwt = await this.storage.get("jwt");
    if (jwt) {
      console.log('jwt found: ', jwt);
      this.jwt = jwt;
      this.isAuthenticated.next(true);
    } else {
      this.isAuthenticated.next(false);
    }
  }

  register(info: {
    name: string,
    study: string
  }): Observable<boolean> {

    const {name, study} = info

    return this.http.post('https://www.lorevimo.com/dimension/add_user.php', info, {responseType: 'text'}).pipe(
      switchMap(response => {
        const res = JSON.parse(response);
        console.log(res);
        this.jwt = res.jwt;
        this.gift_url = res.gift_url

        console.log('received jwt: ' + this.jwt);
        console.log('received gift_url ' + this.gift_url);

        if (this.gift_url != '') {
          return from(Promise.all([
            this.storage.set('name', name),
            this.storage.set('study', study),
            this.storage.set('jwt', this.jwt),
            this.storage.set('gift_url', this.gift_url)
          ]).then(() => true))
        }
    
        return of(false);
      }),
      catchError(() => {

        // temp until backend has more gift_urls to send
        this.storage.set('name', name),
        this.storage.set('study', study),
        this.storage.set('jwt', 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwOlwvXC9sb3Jldmltby5jb20iLCJhdWQiOiJodHRwOlwvXC9zZXFlcjIud2ViLmFwcCIsImlhdCI6MTcxOTY3NjkzMiwiZXhwIjoxNzIxNDkxMzMyLCJkYXRhIjp7Im5hbWUiOiJUZXN0VXNlciIsInN0dWR5IjoiVGVzdFN0dWR5IiwiZ2lmdF91cmwiOiJodHRwczpcL1wvZXhhbXBsZS5jb21cL2dpZnQ0In19.MpWwDYabhH_U-za5_hV17RUmi6UTMQFNqot1jZJQ6IM'),
        this.storage.set('gift_url', 'https://www.google.com')

        return of(false);
      })
    )
  }

  login() {
    this.isAuthenticated.next(true);
  }
}
