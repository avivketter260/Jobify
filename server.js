import express from "express";
import dotenv from 'dotenv'
import morgan from 'morgan';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import path from 'path';
import helmet from 'helmet'
import xss from 'xss-clean'
import mongoSanitize from 'express-mongo-sanitize'
const __dirname = dirname(fileURLToPath(import.meta.url))

dotenv.config()
import 'express-async-errors'
const app = express();
const port = process.env.PORT || 5000;
// middleware
import notFoundMiddleware from "./middleware/not-found.js";
import errorHandlerMiddleware from "./middleware/error-handler.js";
if(process.env.NODE_ENV !== 'production'){
    app.use(morgan('dev'))
}
// db and authenticateUser
import connectDB from "./db/connect.js";

// routes
import authRoutes from './routes/authRoutes.js';
import jobsRoutes from './routes/jobRoutes.js';
import authenticateUser from './middleware/auth.js';

app.get('/api/v1', (req, res) => {
    res.json({ msg: 'API' });
})

app.use(express.json());
app.use(helmet());
app.use(xss());
app.use(mongoSanitize());


app.use(express.static(path.resolve(__dirname,'./client/build')));


app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/jobs',authenticateUser, jobsRoutes);

app.get('*',(rea,res)=>{
    res.sendFile(path.resolve(__dirname,'./client/build', 'index.html'))
})


app.use(notFoundMiddleware);
app.use(errorHandlerMiddleware);



const start = async () => {
    try {
        await connectDB(process.env.MONGO_URL)
        app.listen(port, () => console.log(`Listening on port ${port}`));
    } catch (error) {
        console.log(error);
    }
}
start()