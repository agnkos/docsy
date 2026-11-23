export type LoginPayload = {
  email: string
  password: string
}

export type AuthUser = {
  id: string
  email: string
  firstName: string
  lastName: string
  createdAt: string
  role: UserRole
}

export type AuthResponse = {
  accessToken: string
  expiresIn: number
  user: AuthUser
}

export type RegisterPayload = {
  firstName: string
  lastName: string
  email: string
  password: string
}

export type RegisterResponse = AuthUser

export type RefreshResponse = {
  accessToken: string
  expiresIn: number
}

export type UserRole = 'PATIENT' | 'DOCTOR' | 'ADMIN'
