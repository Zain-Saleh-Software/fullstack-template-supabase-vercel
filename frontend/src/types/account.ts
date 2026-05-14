export interface Account {
    id: string
    name: string
    account_type: string
    status: string
    owner_id: string | null
    created_at: string | null
    updated_at: string | null
}

export interface AccountCreate {
    name: string
    account_type?: string
    status?: string
    owner_id?: string
}

export interface AccountUpdate {
    name?: string
    account_type?: string
    status?: string
    owner_id?: string
}
