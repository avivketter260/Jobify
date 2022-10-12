import { readFile } from "fs/promises";
import connectDB from './db/connect.js';
import Job from "./modules/Job.js";
import dotenv from 'dotenv';
dotenv.config();

const start = async () => {
    try {
        await connectDB(process.env.MONGO_URL);
        await Job.deleteMany();

        const fakeJobs = JSON.parse(await readFile(new URL('./FAKE_JOBS.json', import.meta.url)));

        await Job.create(fakeJobs);
        process.exit(0);

    } catch (error) {
        process.exit(1)
    }
}
start()
