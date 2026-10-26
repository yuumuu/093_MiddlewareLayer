import express from 'express';
import pg from 'pg';
import Joi from 'joi';
import { errorResponse, successResponse } from './src/utils/response.js';

const app = express()
const port = 3000
const { Pool } = pg

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'mahasiswa',
    password: 'postgres',
    port: 5432,
})

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use((req, res, next) => {
    const start = Date.now()

    res.on('finish', () => {
        const duration = Date.now() - start

        console.log({
            methode: req.method,
            url: req.originalUrl,
            status: res.statusCode,
            duration: `${duration} ms`,
        })
    })

    next()
})

// Joi validation schema
const biodataSchema = Joi.object({
    id: Joi.number().integer().positive(),
    nama: Joi.string.trim().min(2).max(100).required(),
    nim: Joi.string().trim().min(5).max(20).required(),
    kelas: Joi.string().trim().min(1).max(20).required(),
})

const idSchema = Joi.object({
    id: Joi.number().integer().positive().required(),
})

app.get('/', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM biodata ORDER BY id')
        return successResponse(res, 'Data biodata berhasil diambil', result.rows)
    } catch (error) {
        console.error('Gagal mengambil data biodata:', error)
        return errorResponse(res, 'Gagal mengambil data biodata', 500)
    }
})

app.listen(port, () => {
    console.log(`Server berjalan di http://localhost:${port}`)
})