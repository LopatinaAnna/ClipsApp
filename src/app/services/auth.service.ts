import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/compat/firestore';
import { delay, map, Observable } from 'rxjs';
import IUser from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private users: AngularFirestoreCollection<IUser>
  public isAuthenticated$: Observable<boolean>
  public isAuthenticatedWithDelay$: Observable<boolean>


  constructor(
    private auth: AngularFireAuth,
    private db: AngularFirestore
  ) {
    this.users = this.db.collection<IUser>('users')
    this.isAuthenticated$ = auth.user.pipe(
      map(user => !!user)
    )
    this.isAuthenticatedWithDelay$ = this.isAuthenticated$.pipe(
      delay(1000)
    )
  }

  public async createUser(userData: IUser) {
    if (!userData.password) {
      throw new Error('Password not provided!')
    }

    const userCredential = await this.auth.createUserWithEmailAndPassword(
      userData.email,
      userData.password
    )

    if (!userCredential.user) {
      throw new Error("User can't be found")
    }

    await this.users.doc(userCredential.user?.uid).set({
      name: userData.name,
      email: userData.email,
      age: userData.age,
      phoneNumber: userData.phoneNumber
    })

    userCredential.user.updateProfile({
      displayName: userData.name
    })
  }
}
