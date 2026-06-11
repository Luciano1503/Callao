import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { CreateUserRequest, UpdateUserRequest, UserResponse } from '../models/user';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly api = inject(ApiService);

  getUsers(): Observable<UserResponse[]> {
    return this.api.get<UserResponse[]>('/users').pipe(map((response) => response.data));
  }

  createUser(request: CreateUserRequest): Observable<UserResponse> {
    return this.api.post<UserResponse, CreateUserRequest>('/users', request).pipe(map((response) => response.data));
  }

  updateUser(userId: number, request: UpdateUserRequest): Observable<UserResponse> {
    return this.api.put<UserResponse, UpdateUserRequest>(`/users/${userId}`, request).pipe(map((response) => response.data));
  }

  deactivateUser(userId: number): Observable<UserResponse> {
    return this.api.delete<UserResponse>(`/users/${userId}`).pipe(map((response) => response.data));
  }
}
