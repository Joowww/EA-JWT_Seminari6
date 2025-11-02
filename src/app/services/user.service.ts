import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { User } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class UserService {
  private baseUrl = 'http://localhost:3000/api/user';

  constructor(private http: HttpClient) {}

  // Retrieves all users
  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(this.baseUrl);
  }

  // Retrieves a single user by their ID
  getUserById(userId: string): Observable<User> {
    return this.http.get<User>(`${this.baseUrl}/${userId}`);
  }

  // Creates a new user
  addUser(newUser: User): Observable<User> {
    const requestHeaders = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.post<User>(this.baseUrl, newUser, { headers: requestHeaders });
  }

  // Updates an existing user and updates the localStorage if applicable
  updateUser(userToUpdate: User): Observable<User> {
    if (!userToUpdate._id) {
      throw new Error('Missing user _id for update');
    }

    return this.http.put<User>(`${this.baseUrl}/${userToUpdate._id}`, userToUpdate).pipe(
      tap(response => {
        const updatedUser = (response as any).user;
        if (updatedUser) {
          localStorage.setItem('currentUser', JSON.stringify(updatedUser));
        }
      })
    );
  }

  // Deletes a user by ID
  deleteUserById(userId: string): Observable<void> {
    console.log('Deleting user with id:', userId);
    return this.http.delete<void>(`${this.baseUrl}/${userId}`);
  }

  // Adds an event to a user
  addEventToUser(userId: string, eventId: string): Observable<User> {
    const requestHeaders = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.put<User>(
      `${this.baseUrl}/${userId}/addEvent`,
      { eventId },
      { headers: requestHeaders }
    );
  }
}
