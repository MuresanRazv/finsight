export interface UserSettingsDto {
    tickers: string[]
}

export interface UserDto {
    firstname: string
    lastname: string
    email: string
}

export interface ChangePasswordDto {
    newPassword?: string
}

export interface RegisterRequest {
    firstname?: string
    lastname?: string
    email?: string
    password?: string
}

export interface AuthenticationResponse {
    access_token?: string
    refresh_token?: string
    access_token_expiry?: number
    refresh_token_expiry?: number
}

export interface AuthenticationRequest {
    email?: string
    password?: string
}

export interface SearchQuery {
    query?: string
    limit?: number
}
