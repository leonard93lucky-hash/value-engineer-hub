export interface Payment {
    id: string
    month: string
    name: string
    transferDate: string
    amount: number
}

export interface Expense {
    id: string
    description: string
    category: string
    date: string
    amount: number
}
