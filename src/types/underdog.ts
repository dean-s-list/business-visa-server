type Status = "pending" | "confirmed";

export interface GetAllNftsResponse {
    results: NftDetails[];
    page: number;
    limit: number;
    totalPages: number;
    totalResults: number;
}

export interface NftDetails {
    id: number;
    projectId: number;
    status: Status;
    ownerAddress: string;
    mintAddress: string;
    transferable: boolean;
    compressed: boolean;
    name: string;
    image: string;
}

export interface NftMintResponse {
    name: string;
    symbol: string;
    description: string;
    image: string;
    animationUrl: string;
    externalUrl: string;
    attributes: {
        [key: string]: string;
    };
    id: number;
    projectId: number;
    transferable: boolean;
    compressed: boolean;
    mintAddress: string;
    ownerAddress: string;
    claimerAddress: string;
    status: string;
}
