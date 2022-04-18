import { HttpClient, HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, switchMap, throwError } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  public apiBaseUrl: string = environment.apiEndpoint;
  public refresh: boolean = false;
  public static accessToken: string = '';

  constructor(private http: HttpClient) {
  }

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const req = request.clone({
      setHeaders: {
        Authorization: `Bearer ${AuthInterceptor.accessToken}`
      }
    });

    return next.handle(req).pipe(catchError((err: HttpErrorResponse) => {
      if (err.status === 401 && !this.refresh) {
        this.refresh = true;

        return this.http.post(`${this.apiBaseUrl}/refresh`, {}, {withCredentials: true}).pipe(
          switchMap((res: any) => {
            AuthInterceptor.accessToken = res.token;

            return next.handle(request.clone({
              setHeaders: {
                Authorization: `Bearer ${AuthInterceptor.accessToken}`
              }
            }));
          })
        );
      }
      this.refresh = false;
      return throwError(() => err);
    }));
  }
}
