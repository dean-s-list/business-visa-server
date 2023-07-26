export const logToConsole = (
    message: string,
    data?: object | string | number
) => {
    if (data) {
        console.log(message, data);
    } else {
        console.log(message);
    }
};

export const logErrorToConsole = (
    message: string,
    error: unknown,
    showFullError: boolean = false
) => {
    const errorMessage = error instanceof Error ? error?.message : error;

    console.error(message, showFullError ? error : errorMessage);
};

export const isBase64 = (value: string) => {
    try {
        // Convert the string to a Buffer using the Base64 encoding
        const buffer = Buffer.from(value, "base64");

        // Check if the buffer can be encoded back to the original string
        return buffer.toString("base64") === value;
    } catch (error) {
        return false;
    }
};
