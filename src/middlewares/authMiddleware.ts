import type { Request, Response, NextFunction } from 'express';

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const token = req.headers['authorization'];

    if (token) {
        // Token doğrulama işlemleri
        next();
    } else {
        res.status(403).json({ message: 'Forbidden' });
    }
};
