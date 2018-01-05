import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../environments/environment';

@Injectable()
export class ConfigService {

  private config: object = null;

  constructor(private http: HttpClient) { }

  public getConfig(key: any) {
    return this.config[key];
  }

  public async load() {
    await this.http.get('./drax-config.json').toPromise().then(response => {
      this.config = response;
    });

    if (environment.production) {
      await this.http.get('./drax-config.dev.json').toPromise()
        .then(response => {
          this.config = Object.assign(this.config, response);
        })
        .catch(err => {
          // s'ok
        })
      ;
    }
  }

}
