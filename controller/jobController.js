import { StatusCodes } from "http-status-codes";
import Job from "../modules/Job.js";
import { BadRequest, NotFoundError, UnAuthenticated } from "../errors/index.js"
import checkPermissions from "../utils/checkPermissions.js";
import mongoose from "mongoose";
import moment from 'moment'
const createJob = async (req, res) => {
    const { position, company } = req.body;
    if (!position || !company) {
        throw new BadRequest('Please Provide All Values');
    }
    req.body.createdBy = req.user.userId;
    const job = await Job.create(req.body);
    res.status(StatusCodes.CREATED).json({ job });
}

const getAllJob = async (req, res) => {

    const { search, status, jobType, sort } = req.query;
    const queryObject = {
        createdBy: req.user.userId
    }

    if (status && status !== 'all') {
        queryObject.status = status;
    }

    if (jobType && jobType !== 'all') {
        queryObject.jobType = jobType;
    }

    if (search) {
        queryObject.position = { $regex: search, $options: 'i' }
    }
    let result = Job.find(queryObject);
    // chain sort conditions
    if (sort === 'latest') {
        result = result.sort('-createdAt')
    }
    if (sort === 'oldest') {
        result = result.sort('createdAt')
    }
    if (sort === 'a-z') {
        result = result.sort('position')
    }
    if (sort === 'z-a') {
        result = result.sort('-position')
    }


    // setup pagination
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    // if page is 1 and limit is 10 jobs : 0* 10 = no skip jobs for page one 
    // if page is 2 and limit is 10 jobs : 1* 10 = skip 10  jobs for page two 
    const skip = (page - 1) * limit;
    result = result.skip(skip).limit(limit)

    const totalJobs = await Job.countDocuments(queryObject);
    const numOfPages = Math.ceil(totalJobs / limit);
    const jobs = await result;

    res.status(StatusCodes.OK).json({ jobs, totalJobs: jobs.length, numOfPages })
}

const updateJob = async (req, res) => {
    const { id: jobId } = req.params
    const { company, position, jobLocation } = req.body

    if (!position || !company || !jobLocation) {
        throw new BadRequest('Please provide all values')
    }
    const job = await Job.findOne({ _id: jobId })

    if (!job) {
        throw new NotFoundError(`No job with id :${jobId}`)
    }

    // check permissions
    checkPermissions(req.user, job.createdBy)

    job.position = position
    job.company = company
    job.jobLocation = jobLocation

    await job.save()
    res.status(StatusCodes.OK).json({ job })
}
const deleteJob = async (req, res) => {
    const { id: jobId } = req.params;
    const job = await Job.findOne({ _id: jobId });
    if (!job) {
        throw new NotFoundError(`No job with id :${jobId}`)
    }
    checkPermissions(req.user, job.createdBy);

    await job.remove();
    res.status(StatusCodes.OK).json({ msg: 'Success! Job removed' });

}

const showStats = async (req, res) => {
    let stats = await Job.aggregate([
        { $match: { createdBy: mongoose.Types.ObjectId(req.user.userId) } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
    ])

    // reduce stats to simple obj
    stats = stats.reduce((newStats, currentItem) => {
        const { _id: title, count } = currentItem
        newStats[title] = count
        return newStats
    }, {})

    const defaultStats = {
        pending: stats.pending || 0,
        interview: stats.interview || 0,
        declined: stats.declined || 0,
    }
    let monthlyApplications = await Job.aggregate([
        { $match: { createdBy: mongoose.Types.ObjectId(req.user.userId) } },
        {
            $group: {
                _id: {
                    year: {
                        $year: '$createdAt',
                    },
                    month: {
                        $month: '$createdAt',
                    },
                },
                count: { $sum: 1 },
            },
        },
        { $sort: { '_id.year': -1, '_id.month': -1 } },
        { $limit: 6 },
    ])
    monthlyApplications = monthlyApplications.map((item) => {
        const { _id: { year, month }, count } = item;
        const date = moment()
            .month(month - 1) // Mongo index is from 1-12 and moment counts from 0-11 
            .year(year)
            .format('MM Y')
        return {
            date,
            count
        }
    }).reverse()
    res.status(StatusCodes.OK).json({ defaultStats, monthlyApplications })
}

export {
    createJob,
    getAllJob,
    updateJob,
    deleteJob,
    showStats,
}