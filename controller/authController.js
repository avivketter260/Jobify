import User from "../modules/User.js";
import { BadRequest, UnAuthenticated } from "../errors/index.js"
import { StatusCodes } from 'http-status-codes';

const register = async (req, res, next) => {
    const { name, password, email } = req.body;

    if (!name || !password || !email) {
        throw new BadRequest('please provide all values')
    }

    const userAlreadyExists = await User.findOne({ email });
    if (userAlreadyExists) {
        throw new BadRequest('Email already in use')
    }

    const user = await User.create({ name, password, email });
    const token = user.createJWT()
    return res.status(StatusCodes.CREATED).json({ user: { email: user.email, lastName: user.lastName, location: user.location, name: user.name }, token, location: user.location });
}

const login = async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        throw new BadRequest('please provide all values');
    }
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
        throw new UnAuthenticated('Invalid Credentials');
    }
    const isPasswordCorrect = await user.comparePassword(password);
    if (!isPasswordCorrect) {
        throw new UnAuthenticated('Invalid Credentials');
    }

    const token = user.createJWT();
    user.password = undefined;
    res.status(StatusCodes.OK).json({ user, token, location: user.location });
}

const updateUser = async (req, res) => {
    const { email, name, lastName, location } = req.body;
    if (!email || !name || !lastName || !location) {
        throw new UnAuthenticated('Please provide all values');
    
    }
    const user = await User.findOne({_id: req.user.userId});

    user.email = email;
    user.name = name;
    user.lastName = lastName;
    user.location = location;
    
    await user.save();

    const token = user.createJWT();
    res.status(StatusCodes.OK).json({
        user,
        token,
        location: user.location
    })
}

export {
    register,
    login,
    updateUser,
}