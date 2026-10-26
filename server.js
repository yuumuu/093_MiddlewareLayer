import express from 'express';
import pg from 'pg';
import Joi from 'joi';
import { errorResponse, successResponse } from './src/utils/response.js';
import { validateBody, validateParams } from './src/middlewares/validate.js';

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

app.post(
    '/biodata',
    validateBody(biodataSchema),
    async (req, res) => {
        const { id, nama, nim, kelas } = req.body

        const result = await pool.query(
            `INSERT INTO biodata (id, nama, nim, kelas)
            VALUES ($1, $2, $3, $4) RETURNING *`,
            [id ?? null, nama, nim, kelas]
        )

        return successResponse(
            res,
            'Data biodata berhasil ditambahkan',
            result.rows[0],
            201
        )
    }
)

app.put(
    '/biodata/:id',
    validateParams(idSchema),
    validateBody(biodataSchema.fork(
        ['nama', 'nim', 'kelas'],
        field => field.required()
    ).fork(['id'], field => field.forbidden())),

    async (req, res) => {
        const { id } = req.params
        const { nama, nim, kelas } = req.body

        const result = await pool.query(
            `UPDATE biodata SET nama = $1, nim = $2, kelas = $3
            WHERE id = $4 RETURNING *`,
            [nama, nim, kelas, id]
        )

        if (result.rowCount === 0) {
            return errorResponse(res, 'Data tidka ditemukan', 404)
        }

        return successResponse(
            res, 'Data berhasil diupdate', result.rows[0]
        )
    }
)

app.delete(
    '/biodata/:id',
    validateParams(idSchema),

    async(req, res) => {
        const { id } = req.params

        const result = await pool.query(
            'DELETE FROM biodata WHERE id = $1 RETURNING *',
            [id]
        )

        if (result.rowCount === 0) {
            return errorResponse(
                res, 'Data tidak ditemukan', 404
            )
        }

        return successResponse(
            res, 'Data berhasil dihapus',
            result.rows[0]
        )
    }
)

app.listen(port, () => {
    console.log(`Server berjalan di http://localhost:${port}`)
})