const request = require('supertest');
const express = require('express');
const scansRouter = require('../routes/scans');
const db = require('../models');

// Mock the auth middleware
jest.mock('../middleware/auth', () => (req, res, next) => {
    req.user = { id: 1 }; // Mock a logged-in user with ID 1
    next();
});

// Mock the scanner job
jest.mock('../jobs/scanner', () => ({
    runScan: jest.fn(),
}));
const { runScan } = require('../jobs/scanner');


const app = express();
app.use(express.json());
// We need to pass the io object to the app, so we'll mock it.
const mockIo = { to: () => ({ emit: () => {} }) };
app.set('io', mockIo);
app.use('/api/scans', scansRouter);

describe('Scans API', () => {

    beforeAll(async () => {
        await db.sequelize.sync({ force: true });
        // Create a mock user for the tests
        await db.User.create({
            id: 1,
            username: 'testuser',
            email: 'test@scan.com',
            password_hash: 'hashedpassword',
        });
    });

    afterAll(async () => {
        await db.sequelize.close();
    });

    afterEach(() => {
        runScan.mockClear();
    });

    describe('POST /api/scans', () => {
        it('should create a new scan and trigger the scanner job', async () => {
            const res = await request(app)
                .post('/api/scans')
                .send({
                    target: 'https://example.com',
                });

            expect(res.statusCode).toEqual(201);
            expect(res.body.target).toBe('https://example.com');
            expect(res.body.status).toBe('pending');
            expect(res.body.user_id).toBe(1);

            // Check if the scanner job was triggered
            expect(runScan).toHaveBeenCalledTimes(1);
            expect(runScan).toHaveBeenCalledWith(res.body.id, mockIo, 1);
        });
    });

    describe('GET /api/scans', () => {
        it('should get a list of scans for the user', async () => {
            // First, create a scan to ensure the list is not empty
            await db.Scan.create({ target: 'https://test1.com', user_id: 1 });
            
            const res = await request(app).get('/api/scans');

            expect(res.statusCode).toEqual(200);
            expect(Array.isArray(res.body)).toBe(true);
            expect(res.body.length).toBeGreaterThan(0);
            expect(res.body[0].target).toBe('https://test1.com');
        });
    });

    describe('GET /api/scans/:id', () => {
        it('should get a specific scan with its findings', async () => {
            const newScan = await db.Scan.create({ target: 'https://test2.com', user_id: 1 });
            await db.Finding.create({ scan_id: newScan.id, category: 'Security', severity: 'High', description: 'Test finding' });
            
            const res = await request(app).get(`/api/scans/${newScan.id}`);

            expect(res.statusCode).toEqual(200);
            expect(res.body.target).toBe('https://test2.com');
            expect(res.body.Findings).toHaveLength(1);
            expect(res.body.Findings[0].description).toBe('Test finding');
        });

        it('should return 404 for a scan that does not exist', async () => {
            const res = await request(app).get('/api/scans/999');
            expect(res.statusCode).toEqual(404);
        });

        it('should return 404 for a scan owned by another user', async () => {
            // Create a scan for another user (user_id 2)
            const otherScan = await db.Scan.create({ target: 'https://otheruser.com', user_id: 2 });
            
            const res = await request(app).get(`/api/scans/${otherScan.id}`);

            // Since the logged-in user is user 1, this should not be found
            expect(res.statusCode).toEqual(404);
        });
    });
});
