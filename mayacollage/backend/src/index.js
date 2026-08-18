import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import morgan from 'morgan';
import helmet from 'helmet';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import applicationRoutes from './routes/applicationRoutes.js';
import userRoutes from './routes/userRoutes.js';
import studentRoutes from './routes/studentRoutes.js';
import branchRoutes from './routes/branchRoutes.js';
import courseRoutes from './routes/courseRoutes.js';
import facultyRoutes from './routes/facultyRoutes.js';
import timetableRoutes from './routes/timetableRoutes.js';
import inquiryRoutes from './routes/inquiryRoutes.js';
import attendanceRoutes from './routes/attendanceRoutes.js';
import bookRoutes from './routes/bookRoutes.js';
import issueBookRoutes from './routes/issueBookRoutes.js';
import shelfRoutes from './routes/shelfRoutes.js';
import librarySettingsRoutes from './routes/librarySettingsRoutes.js';
import leaveRoutes from './routes/leaveRoutes.js';
import noticeRoutes from './routes/noticeRoutes.js';
import transportRoutes from './routes/transportRoutes.js';
import feeRoutes from './routes/feeRoutes.js';
import labRoutes from './routes/labRoutes.js';
import labInventoryRoutes from './routes/inventoryRoutes.js';
import labIssueRoutes from './routes/labIssueRoutes.js';
import subjectLabMappingRoutes from './routes/subjectLabMappingRoutes.js';
import labReportsRoutes from './routes/labReportsRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';

import http from 'http';
import { Server } from 'socket.io';

// Initialize dotenv
dotenv.config();

import mongoose from 'mongoose';
import { Student } from './models/studentModel.js';

// Connect to Database
connectDB();

const app = express();
const httpServer = http.createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Make io accessible globally
app.set('io', io);
app.use((req, res, next) => {
    req.io = io;
    next();
});

const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Socket connection
io.on('connection', (socket) => {
    console.log('User connected to socket:', socket.id);
    
    socket.on('join', (room) => {
        socket.join(room);
        console.log(`User joined room: ${room}`);
    });

    socket.on('disconnect', () => console.log('User disconnected'));
});

// MongoDB Change Streams for Real-Time Updates
mongoose.connection.once('open', () => {
    console.log('Database connected, initializing change streams...');
    
    // Watch Student Collection
    const studentStream = Student.watch([], { fullDocument: 'updateLookup' });
    
    studentStream.on('change', (change) => {
        if (['insert', 'update', 'replace'].includes(change.operationType)) {
            // Emit to all connected clients
            io.emit('student_updated', {
                type: change.operationType,
                studentId: change.documentKey._id,
                data: change.fullDocument
            });
        } else if (change.operationType === 'delete') {
            io.emit('student_deleted', {
                studentId: change.documentKey._id
            });
        }
    });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/users', userRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/branches', branchRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/faculty', facultyRoutes);
app.use('/api/timetables', timetableRoutes);
app.use('/api/inquiries', inquiryRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/library', issueBookRoutes);
app.use('/api/shelves', shelfRoutes);
app.use('/api/library-settings', librarySettingsRoutes);
app.use('/api/leaves', leaveRoutes);
app.use('/api/notices', noticeRoutes);
app.use('/api/transport', transportRoutes);
app.use('/api/fees', feeRoutes);
app.use('/api/labs', labRoutes);
app.use('/api/lab-inventory', labInventoryRoutes);
app.use('/api/lab-issues', labIssueRoutes);
app.use('/api/lab-mappings', subjectLabMappingRoutes);
app.use('/api/lab-reports', labReportsRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Basic Route
app.get('/', (req, res) => {
    res.json({
        message: 'Welcome to Maya ERP API Portal',
        status: 'Running',
        version: '1.0.0'
    });
});

// Health Check
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error Handling Middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        message: 'Internal Server Error',
        error: process.env.NODE_ENV === 'development' ? err.message : {}
    });
});

// Start Server
httpServer.listen(PORT, () => {
    console.log(`
  🚀 Real-time Server is running on port: ${PORT}
  🔗 Local: http://localhost:${PORT}
  📅 Started at: ${new Date().toLocaleString()}
  `);
});
