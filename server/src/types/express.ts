import { Response } from 'express';
import type { AuthRequest } from './auth';

export type RouteHandler = (req: AuthRequest, res: Response) => void;
export type AsyncRouteHandler = (req: AuthRequest, res: Response) => Promise<void>;
// Get recurring transactions
export type RequestHandler = (req: AuthRequest, res: Response) => void | Promise<void>;
export type AsyncRequestHandler = (req: AuthRequest, res: Response) => Promise<void> | void;
