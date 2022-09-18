
export interface User {
  logout(): void;
  getGroups(): string[];
  getBearerToken(): string|null;
}
