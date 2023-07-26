export interface Applicant {
    recordId: string;
    country: string;
    created_at: string;
    created_by?: {
        id: string;
        email: string;
        name: string;
    };
    discord_id: string;
    discover: string;
    email: string;
    expectations: string;
    expectations_text: string;
    id: number;
    name: string;
    projects: string;
    skills: string[];
    solana_wallet_address: string;
    status: "pending" | "rejected" | "accepted";
}
