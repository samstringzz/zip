export interface User {
  id: string;
  username: string;
  email: string;
  password: string;
  created_at: Date;
  updated_at: Date;
}

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  created_at: Date;
}

export interface CreateUserDTO {
  username: string;
  email: string;
  password: string;
}
export interface LoginDTO {
  email: string;
  password: string;
}

