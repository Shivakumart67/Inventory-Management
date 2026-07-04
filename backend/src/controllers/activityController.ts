import { Response, NextFunction } from 'express';
import ActivityService from '../services/activityService';
import { AuthRequest } from '../middleware/auth';

export const getActivityLogs = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { limit = '100', page = '1', action, user, fromDate, toDate, search } = req.query;
    const l = parseInt(limit as string, 10);
    const p = parseInt(page as string, 10);

    const filters: any = {};
    if (action) filters.action = action as string;
    if (user) filters.user = user as string;
    if (fromDate) filters.fromDate = fromDate as string;
    if (toDate) filters.toDate = toDate as string;
    if (search) filters.search = search as string;

    const logs = await ActivityService.getLogs(l, p, filters);
    return res.status(200).json({ success: true, ...logs });
  } catch (error) {
    next(error);
  }
};
export default getActivityLogs;
