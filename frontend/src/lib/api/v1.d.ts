export interface paths {
    "/tickets": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: {
                    page?: number;
                    limit?: number;
                    cursor?: string;
                    createdFrom?: string;
                    createdTo?: string;
                    sortBy?: "title" | "status" | "updatedAt" | "createdAt";
                    sortOrder?: "asc" | "desc";
                    status?: "OPEN" | "IN_PROGRESS" | "DONE";
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["TicketListSuccessEnvelope"];
                    };
                };
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["StandardErrorEnvelope"];
                    };
                };
            };
        };
        put?: never;
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": components["schemas"]["CreateTicketBody"];
                };
            };
            responses: {
                201: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["TicketSingleSuccessEnvelope"];
                    };
                };
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["StandardErrorEnvelope"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/tickets/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    id: string;
                };
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": components["schemas"]["UpdateTicketBody"];
                };
            };
            responses: {
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["TicketSingleSuccessEnvelope"];
                    };
                };
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["StandardErrorEnvelope"];
                    };
                };
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["StandardErrorEnvelope"];
                    };
                };
                409: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["StandardErrorEnvelope"];
                    };
                };
            };
        };
        trace?: never;
    };
}
export type webhooks = Record<string, never>;
export interface components {
    schemas: {
        TicketStatus: "OPEN" | "IN_PROGRESS" | "DONE";
        TicketPublic: {
            id: string;
            title: string;
            description: string;
            status: components["schemas"]["TicketStatus"];
            createdAt: string;
            updatedAt: string;
            userId: string;
        };
        PaginationMeta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
            hasNextPage: boolean;
            hasPreviousPage: boolean;
            nextCursor: string | null;
        };
        TicketListInner: {
            data: components["schemas"]["TicketPublic"][];
            meta: components["schemas"]["PaginationMeta"];
        };
        TicketListSuccessEnvelope: {
            success: true;
            timestamp: string;
            data: components["schemas"]["TicketListInner"];
        };
        TicketSingleSuccessEnvelope: {
            success: true;
            timestamp: string;
            data: components["schemas"]["TicketPublic"];
        };
        CreateTicketBody: {
            userId: string;
            title: string;
            description: string;
            status: components["schemas"]["TicketStatus"];
        };
        UpdateTicketBody: {
            title: string;
            description: string;
            status: components["schemas"]["TicketStatus"];
            updatedAt: string;
        };
        StandardErrorEnvelope: {
            success: false;
            timestamp: string;
            statusCode: number;
            error: string;
            message: string | string[];
            details?: unknown;
        };
    };
    responses: never;
    parameters: never;
    requestBodies: never;
    headers: never;
    pathItems: never;
}
export type $defs = Record<string, never>;
export type operations = Record<string, never>;
