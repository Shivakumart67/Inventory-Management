import { Response, NextFunction } from 'express';
import SiteConfig from '../models/SiteConfig';
import { AuthRequest } from '../middleware/auth';

export const getSiteConfig = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    let config = await SiteConfig.findOne();
    if (!config) {
      // Auto-create default config if none exists
      config = await new SiteConfig({
        companyName: 'Shiva Farms',
        currency: 'INR',
        currencySymbol: '₹',
      }).save();
    }
    return res.status(200).json({ success: true, config });
  } catch (error) {
    next(error);
  }
};

export const updateSiteConfig = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { companyName, companyAddress, companyPhone, companyEmail, gstin, currency, currencySymbol } = req.body;

    let config = await SiteConfig.findOne();
    if (!config) {
      config = new SiteConfig({});
    }

    if (companyName !== undefined) config.companyName = companyName;
    if (companyAddress !== undefined) config.companyAddress = companyAddress;
    if (companyPhone !== undefined) config.companyPhone = companyPhone;
    if (companyEmail !== undefined) config.companyEmail = companyEmail;
    if (gstin !== undefined) config.gstin = gstin;
    if (currency !== undefined) config.currency = currency;
    if (currencySymbol !== undefined) config.currencySymbol = currencySymbol;

    await config.save();

    return res.status(200).json({ success: true, config });
  } catch (error) {
    next(error);
  }
};
