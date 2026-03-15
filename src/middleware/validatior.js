import { check, validationResult } from 'express-validator';

// دالة وسيطة لجمع الأخطاء وإرسالها للفرونت إند
const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        // نرسل أول رسالة خطأ فقط لتبسيط الأمر على الـ Alert في الفرونت إند
        return res.status(400).json({ message: errors.array()[0].msg });
    }
    next();
};

// قواعد التحقق للمنشورات
export const postValidator = [
    check('title').notEmpty().withMessage('Title is required'),
    check('message').isLength({ min: 10 }).withMessage('Message must be at least 10 characters'),
    check('tags').notEmpty().withMessage('At least one tag is required'),
    check('selectedFile').notEmpty().withMessage('Please upload an image'),
    validate
];

// قواعد التحقق للمستخدم (SignUp)
export const signUpValidator = [
    check('firstName').notEmpty().withMessage('First name is required'),
    check('lastName').notEmpty().withMessage('Last name is required'),
    check('email').isEmail().withMessage('Please provide a valid email'),
    check('password')
        .isLength({ min: 8 }).withMessage('Password must be 8+ characters')
        .matches(/\d/).withMessage('Password must contain a number'),
    check('confirmPassword').custom((value, { req }) => {
        if (value !== req.body.password) throw new Error('Passwords do not match');
        return true;
    }),
    validate
];