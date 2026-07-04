import { Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User';
import ActivityService from '../services/activityService';
import { AuthRequest } from '../middleware/auth';

export const createUser = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { name, username, password, mobile, email, address, role } = req.body;

  if (!name || !username || !password) {
    return res.status(400).json({ success: false, message: 'Name, username, and password are required' });
  }

  try {
    const existing = await User.findOne({ username: username.toLowerCase().trim() });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Username is already taken' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const newUser = new User({
      name,
      username: username.toLowerCase().trim(),
      passwordHash,
      mobile,
      email,
      address,
      role: role || 'MANAGER',
      status: 'ACTIVE',
    });

    await newUser.save();

    await ActivityService.log(
      req.user?._id as any,
      'USER_CREATE',
      `Created user account for ${newUser.username} (${newUser.role})`,
      req.ip
    );

    return res.status(201).json({
      success: true,
      user: {
        id: newUser._id,
        name: newUser.name,
        username: newUser.username,
        role: newUser.role,
        mobile: newUser.mobile,
        email: newUser.email,
        address: newUser.address,
        status: newUser.status,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const listUsers = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { search } = req.query;
    let query: any = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { username: { $regex: search, $options: 'i' } },
        { mobile: { $regex: search, $options: 'i' } },
      ];
    }

    const users = await User.find(query)
      .select('-passwordHash')
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, users });
  } catch (error) {
    next(error);
  }
};

export const getUserById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = await User.findById(req.params.id).select('-passwordHash');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    return res.status(200).json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

export const toggleUserStatus = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { status } = req.body;
  if (!status || !['ACTIVE', 'INACTIVE'].includes(status)) {
    return res.status(400).json({ success: false, message: 'Valid status (ACTIVE/INACTIVE) is required' });
  }

  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.status = status;
    await user.save();

    await ActivityService.log(
      req.user?._id as any,
      'USER_STATUS_UPDATE',
      `Updated status of ${user.username} to ${status}`,
      req.ip
    );

    return res.status(200).json({
      success: true,
      message: `User status successfully set to ${status}`,
      user: {
        id: user._id,
        username: user.username,
        status: user.status,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const resetUserPassword = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { password } = req.body;
  if (!password || password.length < 4) {
    return res.status(400).json({ success: false, message: 'Password must be at least 4 characters long' });
  }

  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.passwordHash = await bcrypt.hash(password, 10);
    await user.save();

    await ActivityService.log(
      req.user?._id as any,
      'USER_PASSWORD_RESET',
      `Reset password for user ${user.username}`,
      req.ip
    );

    return res.status(200).json({
      success: true,
      message: `Password reset successfully for ${user.username}`,
    });
  } catch (error) {
    next(error);
  }
};
