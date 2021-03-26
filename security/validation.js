const joi = require("joi");

/* Functions used to validate user input */

/* JOI allows us to create schemes with fields and the kind of 
validation we want performed on them in an easy and straightforward
manner. There are many more options available but we decided these 
were sufficient for our project. The methods are essentially the 
requirements for each field and are very intuitive so do not need 
much explaining. */

// Registration Validation
const registerValidation = data => {
    /* For example, register payload will have 3 fields.
    Email, which is a string of email type and is required,
    username which is also a string, needs minimum 3 characters and is required,
    and lastly password which is also a string, with minimum 6 characters and also required. */
    const schema = joi.object({
        email: joi.string().email().required(),
        username: joi.string().min(3).required(),
        password: joi.string().min(6).required(),
    }).unknown(true);
    return schema.validate(data)
}

// Login Validation
const loginValidation = data => {
    // Same explanation as above.
    const schema = joi.object({
        email: joi.string().email().required(),
        password: joi.string().min(6).required()
    });
    return schema.validate(data)
}

/* Exporting these schemas allow us to use them anywhere on our website */
module.exports.registerValidation = registerValidation;
module.exports.loginValidation = loginValidation;