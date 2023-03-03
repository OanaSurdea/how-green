import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, map, Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { AuthInterceptor } from '../../interceptors/auth.interceptor';
import { IUser } from './../../../../shared/interfaces/user.interface';

const apiBaseUrl: string = environment.apiEndpoint;

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  public isUserLoggedIn: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  public userData: BehaviorSubject<IUser> = new BehaviorSubject<IUser>(null);
  public accessToken: BehaviorSubject<string> = new BehaviorSubject<string>(null);

  constructor(
    private router: Router,
    private httpClient: HttpClient,
  ) {
    this.refreshUserState();
  }

  register(userCredentials: {}): void {
    this.httpClient
      .post(`${apiBaseUrl}/auth/register`, userCredentials, { withCredentials: true })
      .subscribe(() => {
        this.router.navigate(['/login']);
      });
  }

  login(userCredentials: {}): void {
    this.httpClient
      .post(`${apiBaseUrl}/auth/login`, userCredentials, { withCredentials: true })
      .subscribe((res: any) => {
        AuthInterceptor.accessToken = res.token;

        localStorage.setItem('isUserLoggedIn', 'true');
        localStorage.setItem('accessToken', JSON.stringify(res.token));

        this.isUserLoggedIn.next(true);
        this.getUserData().subscribe();

        this.router.navigate(['/']);
      });
  }

  getUserData(): Observable<IUser> {
    return this.httpClient
      .get(`${apiBaseUrl}/auth/user`, { withCredentials: true })
      .pipe(map((user: IUser) => {
        localStorage.setItem('userData', JSON.stringify(user));
        this.userData.next(user);

        return user;
      }));
  }

  refreshUserState(): void {
    const storedUserLogin = JSON.parse(localStorage.getItem('isUserLoggedIn'));
    const storedUserData = JSON.parse(localStorage.getItem('userData'));
    const storedAccessToken = localStorage.getItem('accessToken');

    this.isUserLoggedIn.next(storedUserLogin);
    this.userData.next(storedUserData);
    this.accessToken.next(storedAccessToken);
  }

  logout(): void {
    this.httpClient
      .post(`${apiBaseUrl}/auth/logout`, {}, { withCredentials: true })
      .subscribe(res => {
        console.log('res', res);
        AuthInterceptor.accessToken = '';
        localStorage.removeItem('isUserLoggedIn');
        localStorage.removeItem('userData');
        localStorage.removeItem('accessToken');

        this.router.navigate(['/login']);
      });
  }

}
