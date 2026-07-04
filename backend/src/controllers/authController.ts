import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import ActivityService from '../services/activityService';
import { AuthRequest } from '../middleware/auth';

export const login = async (req: Request, res: Response, next: NextFunction) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Username and password are required' });
  }

  try {
    const user = await User.findOne({ username: username.toLowerCase() });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (user.status === 'INACTIVE') {
      return res.status(403).json({ success: false, message: 'Account is deactivated' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const jwtSecret = process.env.JWT_SECRET || 'fallback_jwt_secret_key_123456';
    const token = jwt.sign(
      { id: user._id, role: user.role },
      jwtSecret,
      { expiresIn: '8h' }
    );

    await ActivityService.log(
      user._id as any,
      'LOGIN',
      `User ${user.username} logged in successfully`,
      req.ip
    );

    return res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        role: user.role,
        mobile: user.mobile,
        email: user.email,
        address: user.address,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (req.user) {
      await ActivityService.log(
        req.user._id as any,
        'LOGOUT',
        `User ${req.user.username} logged out`,
        req.ip
      );
    }
    return res.status(200).json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    return res.status(200).json({
      success: true,
      user: {
        id: req.user._id,
        name: req.user.name,
        username: req.user.username,
        role: req.user.role,
        mobile: req.user.mobile,
        email: req.user.email,
        address: req.user.address,
      },
    });
  } catch (error) {
    next(error);
  }
};
