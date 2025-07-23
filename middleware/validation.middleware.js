import Joi from 'joi';

// User validation schemas
const userSignupSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required'
  }),
  password: Joi.string().min(6).required().messages({
    'string.min': 'Password must be at least 6 characters long',
    'any.required': 'Password is required'
  }),
  role: Joi.string().valid('admin', 'seller', 'buyer').required().messages({
    'any.only': 'Role must be either admin, seller, or buyer',
    'any.required': 'Role is required'
  })
});

const userLoginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

const otpVerificationSchema = Joi.object({
  email: Joi.string().email().required(),
  otp: Joi.string().length(6).pattern(/^[0-9]+$/).required().messages({
    'string.length': 'OTP must be exactly 6 digits',
    'string.pattern.base': 'OTP must contain only numbers'
  })
});

// Product validation schemas
const productSchema = Joi.object({
  name: Joi.string().max(100).required(),
  description: Joi.string().max(500),
  height: Joi.number().min(1).required(),
  width: Joi.number().min(1).required(),
  depth: Joi.number().min(1),
  material: Joi.string().valid('leather', 'plastic', 'fabric', 'aluminum', 'carbon-fiber').required(),
  rate: Joi.number().min(0).required(),
  stock: Joi.number().min(0).default(1),
  features: Joi.array().items(Joi.string()),
  color: Joi.string()
});

// Order validation schemas
const orderSchema = Joi.object({
  product: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required().messages({
    'string.pattern.base': 'Invalid product ID format'
  }),
  quantity: Joi.number().min(1).default(1),
  paymentMethod: Joi.string().valid('cod', 'online').required(),
  shippingAddress: Joi.string().required(),
  orderNotes: Joi.string().max(200)
});

// Validation middleware
const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    
    if (error) {
      const message = error.details.map(detail => detail.message).join(', ');
      return res.status(400).json({
        success: false,
        message: `Validation error: ${message}`
      });
    }
    
    next();
  };
};

export {
  validate,
  userSignupSchema,
  userLoginSchema,
  otpVerificationSchema,
  productSchema,
  orderSchema
};