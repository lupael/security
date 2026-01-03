const request = require('supertest');
const express = require('express');
const authRouter = require('../routes/auth');
const db = require('../models');

const app = express();
app.use(express.json());
app.use('/api/auth', authRouter);

describe('Auth API', () => {

    beforeAll(async () => {
        await db.sequelize.sync({ force: true });
    });

    afterAll(async () => {
        await db.sequelize.close();
    });

    it('should register a new user', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send({
                username: 'testuser',
                email: 'test@example.com',
                password: 'password123',
            });
        expect(res.statusCode).toEqual(201);
        expect(res.body.message).toBe('User created successfully');
    });

    it('should not register an existing user', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send({
                username: 'testuser',
                email: 'test@example.com',
                password: 'password123',
            });
        expect(res.statusCode).toEqual(400);
        expect(res.body.message).toBe('User already exists');
    });

    it('should login a registered user', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({
                email: 'test@example.com',
                password: 'password123',
            });
        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('token');
    });

    it('should not login an unregistered user', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({
                email: 'nouser@example.com',
                password: 'password123',
            });
        expect(res.statusCode).toEqual(400);
        expect(res.body.message).toBe('Invalid credentials');
    });
});
