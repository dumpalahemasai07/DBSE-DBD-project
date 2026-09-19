const User = require('../models/User');
const jwt = require('jsonwebtoken');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'secret123', {
    expiresIn: '30d',
  });
};

const registerUser = async (req, res, next) => {
  try {
    const { name, email, password, phone, role } = req.body;
    const lowerEmail = (email || '').toLowerCase();
    const userRole = (role === 'admin' || role === 'provider') ? role : 'customer';

    const userExists = await User.findOne({ email: lowerEmail });
    if (userExists) {
      return res.status(400).json({ success: false, error: 'User with this email already exists' });
    }

    const user = await User.create({
      name,
      email: lowerEmail,
      password,
      phone: phone || '+91 9876543210',
      role: userRole
    });
    
    res.status(201).json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        addresses: user.addresses || [],
        token: generateToken(user._id)
      }
    });
  } catch (error) {
    next(error);
  }
};

const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const lowerEmail = (email || '').toLowerCase();

    const user = await User.findOne({ email: lowerEmail });
    if (user && (await user.matchPassword(password))) {
      res.json({
        success: true,
        data: {
          _id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          addresses: user.addresses || [],
          token: generateToken(user._id)
        }
      });
    } else {
      res.status(401).json({ success: false, error: 'Invalid email or password' });
    }
  } catch (error) {
    next(error);
  }
};

const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });
    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

const updateUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });

    user.name = req.body.name || user.name;
    user.phone = req.body.phone || user.phone;
    if (req.body.password) {
      user.password = req.body.password;
    }

    const updatedUser = await user.save();
    res.json({
      success: true,
      data: {
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        role: updatedUser.role,
        addresses: updatedUser.addresses || []
      }
    });
  } catch (error) {
    next(error);
  }
};

const addAddress = async (req, res, next) => {
  try {
    const { tag, house, building, street, area, city, state, pincode, landmark, contactName, contactPhone, latitude, longitude, placeId, isDefault } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });

    const makeDefault = Boolean(isDefault) || user.addresses.length === 0;

    if (makeDefault) {
      user.addresses.forEach(addr => addr.isDefault = false);
    }

    const newAddr = {
      tag: tag || 'Home',
      house: house || street || 'Doorstep Address',
      building: building || '',
      street: street || 'Main Street',
      area: area || city || 'Jubilee Hills',
      city: city || 'Hyderabad',
      state: state || 'Telangana',
      pincode: pincode || '500033',
      landmark: landmark || '',
      contactName: contactName || user.name || '',
      contactPhone: contactPhone || user.phone || '',
      latitude: latitude ? Number(latitude) : undefined,
      longitude: longitude ? Number(longitude) : undefined,
      placeId: placeId || '',
      isDefault: makeDefault
    };

    user.addresses.push(newAddr);
    await user.save();

    res.json({ success: true, data: user.addresses });
  } catch (error) {
    next(error);
  }
};

const updateAddress = async (req, res, next) => {
  try {
    const { addressId } = req.params;
    const { tag, house, building, street, area, city, state, pincode, landmark, contactName, contactPhone, latitude, longitude, placeId, isDefault } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });

    const addr = user.addresses.id(addressId);
    if (!addr) return res.status(404).json({ success: false, error: 'Address not found' });

    if (isDefault) {
      user.addresses.forEach(a => a.isDefault = false);
      addr.isDefault = true;
    }

    if (tag) addr.tag = tag;
    if (house !== undefined) addr.house = house;
    if (building !== undefined) addr.building = building;
    if (street !== undefined) addr.street = street;
    if (area !== undefined) addr.area = area;
    if (city !== undefined) addr.city = city;
    if (state !== undefined) addr.state = state;
    if (pincode !== undefined) addr.pincode = pincode;
    if (landmark !== undefined) addr.landmark = landmark;
    if (contactName !== undefined) addr.contactName = contactName;
    if (contactPhone !== undefined) addr.contactPhone = contactPhone;
    if (latitude !== undefined) addr.latitude = Number(latitude);
    if (longitude !== undefined) addr.longitude = Number(longitude);
    if (placeId !== undefined) addr.placeId = placeId;

    await user.save();
    res.json({ success: true, data: user.addresses });
  } catch (error) {
    next(error);
  }
};

const setDefaultAddress = async (req, res, next) => {
  try {
    const { addressId } = req.params;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });

    user.addresses.forEach(a => {
      a.isDefault = (a._id.toString() === addressId);
    });

    await user.save();
    res.json({ success: true, data: user.addresses });
  } catch (error) {
    next(error);
  }
};

const deleteAddress = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });

    const target = user.addresses.id(req.params.addressId);
    const wasDefault = target ? target.isDefault : false;

    user.addresses = user.addresses.filter(addr => addr._id.toString() !== req.params.addressId);

    if (wasDefault && user.addresses.length > 0) {
      user.addresses[0].isDefault = true;
    }

    await user.save();
    res.json({ success: true, data: user.addresses });
  } catch (error) {
    next(error);
  }
};

const getFavorites = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).populate({
      path: 'favorites',
      populate: { path: 'category', select: 'name icon' }
    });
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });
    res.json({ success: true, data: user.favorites || [] });
  } catch (error) {
    next(error);
  }
};

const addFavorite = async (req, res, next) => {
  try {
    const { serviceId } = req.params;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });

    if (!user.favorites.includes(serviceId)) {
      user.favorites.push(serviceId);
      await user.save();
    }
    res.json({ success: true, data: user.favorites });
  } catch (error) {
    next(error);
  }
};

const removeFavorite = async (req, res, next) => {
  try {
    const { serviceId } = req.params;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });

    user.favorites = user.favorites.filter(favId => favId.toString() !== serviceId);
    await user.save();
    res.json({ success: true, data: user.favorites });
  } catch (error) {
    next(error);
  }
};

const getUsers = async (req, res, next) => {
  try {
    const users = await User.find({}).select('-password');
    res.json({ success: true, data: users });
  } catch (error) {
    next(error);
  }
};

module.exports = { 
  registerUser, 
  loginUser, 
  getMe, 
  updateUserProfile,
  addAddress,
  updateAddress,
  setDefaultAddress,
  deleteAddress,
  getFavorites,
  addFavorite,
  removeFavorite,
  getUsers 
};
