import type { ApiResponseType } from "../types/index.ts";
import type { Response } from "express";

export const apiResponse = ({ success, message, result }: ApiResponseType) => {
    return {
        success,
        message,
        result,
    };
};

export const errorHandler = (error: unknown) => {
    const errorMessage =
        error instanceof Error ? error?.message : "Something went wrong!";

    return apiResponse({
        success: false,
        message: errorMessage,
        result: null,
    });
};

export const successHandler = (
    result: ApiResponseType["result"],
    message: string
) => {
    return apiResponse({
        success: true,
        message,
        result,
    });
};

export const handleNotFound = (res: Response) => {
    return res.status(404).json(errorHandler(new Error("Not found!!")));
};

export const handleApiRouteError = (res: Response, error: unknown) => {
    return res
        .status(500)
        .json(
            errorHandler(
                new Error("Something went wrong! Internal server error.")
            )
        );
};

export const handleApiAuthError = (res: Response) => {
    return res
        .status(401)
        .json(errorHandler(new Error("Unauthorized access!")));
};

export const handleApiClientError = (res: Response, message?: string) => {
    return res
        .status(400)
        .json(errorHandler(new Error(message ?? "Wrong parameters provided!")));
};
