import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Router } from '@angular/router';

export interface User {
  _id: string;
  username: string;
  gmail: string;
  birthday: Date;
  eventos: string[];
}

export interface LoginResponse {
  message: string;
  user: User;
  token: string;
  refreshToken: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly apiUrl = 'http://localhost:3000/api';
  private userState = new BehaviorSubject<User | null>(null);
  public user$ = this.userState.asObservable();

  constructor(private http: HttpClient, private router: Router) {
    // Loads the user from localStorage if it exists
    const storedUserData = localStorage.getItem('currentUser');
    if (storedUserData && storedUserData !== 'undefined') {
      try {
        this.userState.next(JSON.parse(storedUserData));
      } catch (error) {
        console.error('Error parsing stored user:', error);
        localStorage.removeItem('currentUser');
      }
    }
  }

  // Authenticates a user and stores the returned tokens
  login(username: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/user/login`, { username, password }).pipe(
      tap(response => {
        const loggedUser = (response as any).User;
        if (loggedUser) {
          localStorage.setItem('currentUser', JSON.stringify(loggedUser));
          localStorage.setItem('token', response.token);
          localStorage.setItem('refreshToken', response.refreshToken);
          this.userState.next(loggedUser);
        }
      })
    );
  }

  // Logs out the current user and clears local storage
  logout(): void {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    this.userState.next(null);
    this.router.navigate(['/login']);
  }

  // Returns the current logged-in user
  getCurrentUser(): User | null {
    return this.userState.value;
  }

  // Checks whether there is a logged-in user
  isLoggedIn(): boolean {
    return !!this.userState.value;
  }

  // Returns the stored JWT access token
  getToken(): string | null {
    return localStorage.getItem('token');
  }

  // Requests a new access token using a refresh token
  refreshToken(): Observable<any> {
    const storedRefreshToken = localStorage.getItem('refreshToken');
    const storedUserData = localStorage.getItem('currentUser');

    if (!storedRefreshToken || !storedUserData) {
      throw new Error('No refresh token or current user found');
    }

    const parsedUser = JSON.parse(storedUserData);
    return this.http.post(`${this.apiUrl}/user/refresh`, {
      refreshToken: storedRefreshToken,
      userId: parsedUser._id,
    });
  }
}
