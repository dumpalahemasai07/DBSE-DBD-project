const Service = require('../models/Service');
const Category = require('../models/Category');
const Package = require('../models/Package');

const getServices = async (req, res, next) => {
  try {
    const { category, tag, q, sortBy } = req.query;

    let filterQuery = {};
    if (category) {
      const catDoc = await Category.findOne({ 
        $or: [{ slug: category.toLowerCase() }, { name: new RegExp(`^${category}$`, 'i') }] 
      });
      if (catDoc) {
        filterQuery.category = catDoc._id;
      }
    }

    if (q) {
      const regex = new RegExp(q, 'i');
      filterQuery.$or = [{ name: regex }, { description: regex }];
    }

    let query = Service.find(filterQuery).populate('category', 'name slug');

    if (sortBy === 'price_asc') {
      query = query.sort({ startingPrice: 1 });
    } else if (sortBy === 'price_desc') {
      query = query.sort({ startingPrice: -1 });
    } else if (sortBy === 'rating_desc') {
      query = query.sort({ rating: -1 });
    }

    const services = await query;
    
    // Attach Packages as variants to each service
    const fullServices = await Promise.all(services.map(async (s) => {
      const pkgs = await Package.find({ service: s._id });
      const sObj = s.toObject();
      sObj.category = s.category ? s.category.name : 'General';
      sObj.imageUrl = (s.images && s.images.length > 0) ? s.images[0] : 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=600&q=80';
      sObj.includes = s.features && s.features.length > 0 ? s.features : ['General Inspection & Service'];
      sObj.excludes = ['Spare parts replacement not included unless requested'];

      if (pkgs && pkgs.length > 0) {
        sObj.variants = pkgs.map(p => ({
          _id: p._id,
          title: p.name,
          price: p.discountPrice || p.price,
          duration: p.duration
        }));
      } else {
        sObj.variants = [{ title: 'Standard Service', price: s.startingPrice, duration: s.duration || '60 mins' }];
      }

      return sObj;
    }));

    res.json({ success: true, data: fullServices });
  } catch (error) {
    next(error);
  }
};

const getServiceById = async (req, res, next) => {
  try {
    const service = await Service.findById(req.params.id).populate('category', 'name slug');
    if (!service) return res.status(404).json({ success: false, error: 'Service not found in database' });

    const pkgs = await Package.find({ service: service._id });
    const sObj = service.toObject();
    sObj.category = service.category ? service.category.name : 'General';
    sObj.imageUrl = (service.images && service.images.length > 0) ? service.images[0] : 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=600&q=80';
    sObj.includes = service.features && service.features.length > 0 ? service.features : ['General Inspection & Service'];
    sObj.excludes = ['Spare parts cost'];

    if (pkgs && pkgs.length > 0) {
      sObj.variants = pkgs.map(p => ({
        _id: p._id,
        title: p.name,
        price: p.discountPrice || p.price,
        duration: p.duration
      }));
    } else {
      sObj.variants = [{ title: 'Standard Package', price: service.startingPrice, duration: service.duration || '60 mins' }];
    }

    res.json({ success: true, data: sObj });
  } catch (error) {
    next(error);
  }
};

const searchServices = async (req, res, next) => {
  try {
    const q = req.query.q || '';
    const regex = new RegExp(q, 'i');

    const services = await Service.find({ $or: [{ name: regex }, { description: regex }] }).populate('category', 'name');
    
    const fullServices = await Promise.all(services.map(async (s) => {
      const pkgs = await Package.find({ service: s._id });
      const sObj = s.toObject();
      sObj.category = s.category ? s.category.name : 'General';
      sObj.imageUrl = (s.images && s.images.length > 0) ? s.images[0] : 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=600&q=80';
      sObj.variants = pkgs.map(p => ({
        _id: p._id,
        title: p.name,
        price: p.discountPrice || p.price,
        duration: p.duration
      }));
      return sObj;
    }));

    res.json({ success: true, data: fullServices });
  } catch (error) {
    next(error);
  }
};

const getCategories = async (req, res, next) => {
  try {
    const categories = await Category.find({ isActive: true }).sort({ displayOrder: 1 });
    res.json({ success: true, data: categories });
  } catch (error) {
    next(error);
  }
};

const createService = async (req, res, next) => {
  try {
    const { name, description, category, startingPrice, imageUrl, variants } = req.body;
    if (!name || !description || !category) {
      return res.status(400).json({ success: false, error: 'Name, description, and category are required' });
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    let catDoc = await Category.findOne({ name: new RegExp(`^${category}$`, 'i') });
    if (!catDoc) {
      catDoc = await Category.create({ name: category, slug: category.toLowerCase().replace(/[^a-z0-9]+/g, '-'), description: `${category} services`, image: imageUrl });
    }

    const service = await Service.create({
      name,
      slug,
      description,
      category: catDoc._id,
      startingPrice: startingPrice || 499,
      images: [imageUrl || 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=600&q=80']
    });

    if (variants && variants.length > 0) {
      for (const v of variants) {
        await Package.create({
          service: service._id,
          name: v.title,
          price: v.price,
          duration: v.duration || '45 mins'
        });
      }
    }

    res.status(201).json({ success: true, data: service });
  } catch (error) {
    next(error);
  }
};

const updateService = async (req, res, next) => {
  try {
    let service = await Service.findById(req.params.id);
    if (!service) return res.status(404).json({ success: false, error: 'Service not found' });

    Object.assign(service, req.body);
    await service.save();
    res.json({ success: true, data: service });
  } catch (error) {
    next(error);
  }
};

const deleteService = async (req, res, next) => {
  try {
    const service = await Service.findByIdAndDelete(req.params.id);
    if (!service) return res.status(404).json({ success: false, error: 'Service not found' });
    await Package.deleteMany({ service: req.params.id });
    res.json({ success: true, data: { message: 'Service deleted successfully' } });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getServices,
  getServiceById,
  searchServices,
  getCategories,
  createService,
  updateService,
  deleteService
};
