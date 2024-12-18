export class AppError extends Error {
    constructor(message, code, details = {}) {
        super(message);
        this.code = code;
        this.details = details;
    }
}

export const ErrorHandler = {
    handle(error) {
        console.error(error);
        
        if (error instanceof AppError) {
            // Handle known application errors
            notifications.show(error.message, 'error');
        } else {
            // Handle unexpected errors
            notifications.show('An unexpected error occurred', 'error');
        }
    }
};
