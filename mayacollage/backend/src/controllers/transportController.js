import Bus from '../models/busModel.js';
import { Student } from '../models/studentModel.js';

// Get all buses
export const getBuses = async (req, res) => {
    try {
        const buses = await Bus.find().populate({
            path: 'students.student',
            select: 'firstName lastName studentEmail applicantPhoto selectedBranch selectedProgram'
        });
        res.status(200).json(buses);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Create a new bus
export const createBus = async (req, res) => {
    try {
        const { busNo, driverName, conductorName, capacity, routeName, stops } = req.body;
        if (!busNo || !driverName || !conductorName || !capacity || !routeName) {
            return res.status(400).json({ message: 'Missing required fleet coordinates' });
        }
        const existingBus = await Bus.findOne({ busNo: busNo.trim() });
        if (existingBus) return res.status(400).json({ message: 'Fleet ID already exists in system' });
        const newBus = await Bus.create({
            busNo: busNo.trim(),
            driverName: driverName.trim(),
            conductorName: conductorName.trim(),
            capacity: Number(capacity),
            routeName: routeName.trim(),
            stops: Array.isArray(stops) ? stops.map(s => ({
                stationName: (s.stationName || "").trim(),
                price: Number(s.price) || 0
            })) : []
        });
        const io = req.app.get('io');
        if (io) io.emit('bus_added', newBus);
        res.status(201).json(newBus);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Assign student to bus
export const assignStudentToBus = async (req, res) => {
    try {
        const { busId, studentId, stopName } = req.body;
        const bus = await Bus.findById(busId);
        if (!bus) return res.status(404).json({ message: 'Bus not found' });
        if (bus.filled >= bus.capacity) return res.status(400).json({ message: 'Bus is already full' });
        
        // Use a generic query to avoid Mongoose CastError on the legacy path
        const studentAlreadyInBus = await Bus.findOne({
            $or: [
                { 'students.student': studentId },
                { 'students': { $elemMatch: { $eq: studentId } } }
            ]
        });
        
        if (studentAlreadyInBus) return res.status(400).json({ message: 'Student is already assigned to a bus' });

        const stop = bus.stops.find(s => s.stationName === stopName);
        bus.students.push({
            student: studentId,
            stopName: stopName,
            fare: stop ? stop.price : 0,
            paymentStatus: 'Pending'
        });
        bus.filled = bus.students.length;
        await bus.save();
        const updatedBus = await Bus.findById(busId).populate('students.student');
        const io = req.app.get('io');
        if (io) io.emit('student_assigned', { busId, studentId, updatedBus });
        res.status(200).json(updatedBus);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Unassign student
export const unassignStudentFromBus = async (req, res) => {
    try {
        const { busId, studentId } = req.body;
        const bus = await Bus.findById(busId);
        if (!bus) return res.status(404).json({ message: 'Bus not found' });
        
        bus.students = bus.students.filter(s => {
            const sid = s.student ? s.student.toString() : s.toString();
            return sid !== studentId;
        });

        bus.filled = bus.students.length;
        await bus.save();
        const updatedBus = await Bus.findById(busId).populate('students.student');
        const io = req.app.get('io');
        if (io) io.emit('student_unassigned', { busId, studentId, updatedBus });
        res.status(200).json(updatedBus);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Get a bus for a specific student (Student Dashboard)
export const getStudentBus = async (req, res) => {
    try {
        const { studentId } = req.params;
        
        // Use $elemMatch with $eq to bypass Mongoose strict casting for standard arrays vs subdocs
        const bus = await Bus.findOne({ 
            $or: [
                { 'students.student': studentId },
                { 'students': { $elemMatch: { $eq: studentId } } }
            ]
        })
        .select('busNo driverName conductorName routeName stops students')
        .lean();
        
        if (!bus) return res.status(200).json(null);

        let enrollment = bus.students.find(s => {
            const id = s.student ? s.student.toString() : s.toString();
            return id === studentId;
        });

        if (enrollment && (typeof enrollment === 'string' || enrollment instanceof String)) {
            enrollment = { student: enrollment, paymentStatus: 'Pending', fare: 0, stopName: 'Assigned' };
        }
        
        res.status(200).json({
            ...bus,
            studentDetail: enrollment
        });
    } catch (error) {
        console.error('getStudentBus error:', error);
        res.status(500).json({ message: 'Logistics sync failed', error: error.message });
    }
};

// Pay Transport Fee
export const payTransportFee = async (req, res) => {
    try {
        const { studentId, transactionId } = req.body;
        const bus = await Bus.findOne({ 'students.student': studentId });
        if (!bus) return res.status(404).json({ message: 'Enrollment not found' });

        const studentIdx = bus.students.findIndex(s => s.student.toString() === studentId);
        if (studentIdx === -1) return res.status(404).json({ message: 'Student idx not found in roster' });

        bus.students[studentIdx].paymentStatus = 'Paid';
        bus.students[studentIdx].paymentDate = new Date();
        bus.students[studentIdx].transactionId = transactionId || `TXN-${Date.now()}`;
        
        await bus.save();

        const io = req.app.get('io');
        if (io) io.emit('payment_processed', { busId: bus._id, studentId });

        res.status(200).json({ message: 'Payment processed successfully', enrollment: bus.students[studentIdx] });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Update bus status or details
export const updateBus = async (req, res) => {
    try {
        const { id } = req.params;
        const updatedBus = await Bus.findByIdAndUpdate(id, req.body, { new: true }).populate('students.student');
        const io = req.app.get('io');
        if (io) io.emit('bus_updated', updatedBus);
        res.status(200).json(updatedBus);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Delete bus
export const deleteBus = async (req, res) => {
    try {
        const { id } = req.params;
        await Bus.findByIdAndDelete(id);
        const io = req.app.get('io');
        if (io) io.emit('bus_deleted', { busId: id });
        res.status(200).json({ message: 'Bus removed successfully' });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};
