import { Request, Response } from 'express';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
}

export type RouteHandler = (req: AuthenticatedRequest, res: Response) => void;
export type AsyncRouteHandler = (req: AuthenticatedRequest, res: Response) => Promise<void>;
// Get recurring transactions
export type RequestHandler = (req: AuthenticatedRequest, res: Response) => void | Promise<void>;
export type AsyncRequestHandler = (req: AuthenticatedRequest, res: Response) => Promise<void> | void;
