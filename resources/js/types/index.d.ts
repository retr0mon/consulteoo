export interface User {
    id: number;
    name: string;
    email: string;
    email_verified_at?: string;
    role: 'patient' | 'practitioner';
}

export interface Slot {
    id: number;
    starts_at: string;
    ends_at: string;
    created_at: string;
    updated_at: string;
}

export interface AvailableSlot extends Slot {
    practitioner: {
        id: number;
        name: string;
    };
}

export interface AppointmentRow {
    id: number;
    starts_at: string;
    ends_at: string;
    status: 'scheduled' | 'cancelled' | 'completed';
    party: string;
}

export type PageProps<
    T extends Record<string, unknown> = Record<string, unknown>,
> = T & {
    auth: {
        user: User;
    };
    flash: {
        success?: string | null;
        error?: string | null;
    };
};
