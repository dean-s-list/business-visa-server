// Interface for the transaction object
interface Transaction {
    id: string;
    type: string;
    rails: string;
    network: string;
    flow: string;
    amount: string;
    amountUSD: number;
    currency: string;
    description: string;
    available: string;
    updated: string;
    created: string;
}

// Interface for the line item object
interface LineItem {
    id: string;
    name: string;
    description: string;
    quantity: number;
    quantityMutable: boolean;
    price: {
        id: string;
        active: boolean;
        name: string | null;
        description: string | null;
        meta: object;
        network: string;
        billingScheme: string;
        customUnitAmount: {
            max: number | null;
            min: number | null;
            preset: number | null;
        };
        lookupKey: string | null;
        taxBehavior: string;
        type: string;
        tierType: string | null;
        tiers: any[]; // Define this based on the actual structure if needed
        currencyOptions: any[]; // Define this based on the actual structure if needed
        currency: string;
        unitAmount: string;
        unitAmountDecimal: number;
        recurring: {
            usageAggregation: string | null;
            interval: string | null;
            intervalCount: number | null;
            usageType: string | null;
            defaultLength: number | null;
        };
        product: any; // Define this based on the actual structure if needed
        updated: string;
        created: string;
    };
    updated: string;
    created: string;
}

// Interface for the payment link object
interface PaymentLink {
    id: string;
    name: string;
    description: string;
    meta: object;
    url: string;
    successUrl: string;
    failUrl: string;
    taxRate: null;
    lineItems: LineItem[];
    features: {
        requiresEmail: boolean;
        requiresName: boolean;
        requiresShippingDetails: boolean;
    };
    application: any; // Define this based on the actual structure if needed
    updated: string;
    created: string;
}

// Interface for the customer object
interface Customer {
    id: string;
    solanaPubKey: string;
    delinquent: boolean;
    amountUSD: number;
    personalInfo: any; // Define this based on the actual structure if needed
    created: string;
    updated: string;
}

// Interface for the solana transport object
interface SolanaTransport {
    id: string;
    tx: string;
    swapTx: object;
    hash: string;
    solanaEvent: {
        id: string;
        name: string;
        txSig: string;
        slot: number;
        blockTime: number;
        errored: boolean;
        updated: string;
        created: string;
    };
    updated: string;
    created: string;
}

// Interface for the user object
interface User {
    id: string;
    email: string | null;
    notificationsEmail: string;
    solanaPubKey: string;
    lastLogin: string;
    updated: string;
    created: string;
    deleted: string | null;
    emailNotifications: boolean;
    nonce: string;
    version: number;
}

// Interface for the application object
interface Application {
    id: string;
    name: string;
    nickname: string;
    image: string;
    favicons: {
        "16": string;
        "32": string;
        "180": string;
        "192": string;
        "512": string;
    };
    proxySolanaPubKey: string | null;
    initialized: boolean;
    updated: string;
    created: string;
    version: number;
}

// Interface for the main data object
interface Data {
    payment: {
        id: string;
        type: string;
        status: string;
        transactions: Transaction[];
        paymentLink: PaymentLink;
        invoice: any; // Define this based on the actual structure if needed
        customer: Customer;
        personalInfo: any; // Define this based on the actual structure if needed
        transport: {
            solana: SolanaTransport;
        };
        updated: string;
        created: string;
    };
}

// Interface for the main JSON object
export interface SphereWebhookResponse {
    hmacTimestamp: string;
    id: string;
    name: string;
    data: Data;
    mock: boolean;
    user: User;
    application: Application;
    version: number;
    updated: string;
    created: string;
}
