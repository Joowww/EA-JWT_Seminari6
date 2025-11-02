import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpResponse,
  HttpEvent,
  HttpInterceptor,
} from '@angular/common/http';
import { Observable, throwError, catchError, switchMap } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private isRefreshingToken = false;

  constructor(private authService: AuthService, private router: Router) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Skip interception for login requests
    if (request.url.includes('/login')) {
      return next.handle(request);
    }

    const currentToken = this.authService.getToken();
    console.log('Intercepting request:', request.url);
    console.log('Current access token:', currentToken);

    // Add Authorization header if an access token exists
    let modifiedRequest = request;
    if (currentToken) {
      modifiedRequest = request.clone({
        setHeaders: { Authorization: `Bearer ${currentToken}` },
      });
      console.log('Authorization header added');
    }

    return next.handle(modifiedRequest).pipe(
      catchError((errorResponse: HttpResponse<any>) => {
        // Handle token expiration
        if (errorResponse.status === 401 && !this.isRefreshingToken) {
          console.log('Access token expired, attempting to refresh');
          this.isRefreshingToken = true;

          return this.authService.refreshToken().pipe(
            switchMap((refreshResponse: any) => {
              console.log('Access token refreshed successfully');
              this.isRefreshingToken = false;

              const newAccessToken = refreshResponse.token;
              localStorage.setItem('token', newAccessToken);

              const retriedRequest = modifiedRequest.clone({
                setHeaders: { Authorization: `Bearer ${newAccessToken}` },
              });
              console.log('Retrying request with refreshed token');
              return next.handle(retriedRequest);
            }),
            catchError(refreshError => {
              if (refreshError.status === 401) {
                console.warn('Could not refresh token. Redirecting to login.');
                this.isRefreshingToken = false;
                this.authService.logout();
              }
              return throwError(() => refreshError);
            })
          );
        }

        // Handle forbidden access
        if (errorResponse.status === 403) {
          console.warn('Access forbidden (403)');
        }

        return throwError(() => errorResponse);
      })
    );
  }
}
