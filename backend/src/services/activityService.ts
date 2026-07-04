import mongoose from 'mongoose';
import dayjs from 'dayjs';
import ActivityLog from '../models/ActivityLog';

interface ActivityFilters {
  action?: string;
  user?: string;
  fromDate?: string;
  toDate?: string;
  search?: string;
}

export class ActivityService {
  static async log(
    userId: mongoose.Types.ObjectId,
    action: string,
    details: string,
    ipAddress?: string
  ): Promise<void> {
    try {
      const logEntry = new ActivityLog({
        user: userId,
        action,
        details,
        ipAddress,
      });
      await logEntry.save();
    } catch (error) {
      console.error('Failed to save activity log:', error);
    }
  }

  static async getLogs(limit = 100, page = 1, filters: ActivityFilters = {}) {
    const skip = (page - 1) * limit;
    const query: any = {};

    if (filters.action) {
      query.action = filters.action;
    }

    if (filters.user) {
      query.user = filters.user;
    }

    if (filters.fromDate || filters.toDate) {
      query.timestamp = {};
      if (filters.fromDate) query.timestamp.$gte = dayjs(filters.fromDate).startOf('day').toDate();
      if (filters.toDate) query.timestamp.$lte = dayjs(filters.toDate).endOf('day').toDate();
    }

    if (filters.search) {
      query.details = { $regex: filters.search, $options: 'i' };
    }

    const items = await ActivityLog.find(query)
      .populate('user', 'name username role')
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await ActivityLog.countDocuments(query);

    return {
      items,
      total,
      page,
      pages: Math.ceil(total / limit),
    };
  }
}
export default ActivityService;
