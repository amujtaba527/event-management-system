export type UserRole = 'admin' | 'seller' | 'scanner';
export type TicketType = 'student' | 'student_guest' | 'outsider';
export type TicketStatus = 'issued' | 'checked-in';

export interface User {
    id: number;
    name: string;
    email: string;
    role: UserRole;
    created_at: Date;
}

export interface Student {
    id: number;
    roll_number: string;
    name: string;
    current_class: string;
    is_active: boolean;
    created_at: Date;
}

export interface Event {
    id: number;
    name: string;
    event_startdate: Date;
    event_enddate: Date;
    student_price: number;
    other_price: number;
    ticket_sale_start: Date;
    check_in_start: Date;
    created_at: Date;
}

export interface Ticket {
    id: string; // UUID
    event_id: number;
    issued_by_user_id: number;
    student_id?: number | null;
    attendee_name: string;
    attendee_class?: string;
    attendee_type: TicketType;
    status: TicketStatus;
    checked_in_at?: Date;
    checked_in_by_user_id?: number;
    created_at: Date;
    price: number;
}
