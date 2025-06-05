const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const NDVIMap = require('../models/NDVIMap');

// Configuração do multer para processar o arquivo em memória
const upload = multer({
    storage: multer.memoryStorage(),
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/tiff', 'image/jpeg', 'image/png'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Tipo de arquivo não suportado'));
        }
    },
    limits: {
        fileSize: 50 * 1024 * 1024 // 50MB limit
    }
});

// Upload de novo mapa NDVI
router.post('/', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "Arquivo obrigatório" });
        }

        const ndviData = {
            ...req.body,
            fileData: req.file.buffer,
            fileType: req.file.mimetype
        };

        const ndviMap = new NDVIMap(ndviData);
        const savedMap = await ndviMap.save();
        
        // Remover o buffer do objeto retornado para não sobrecarregar a resposta
        const responseMap = savedMap.toObject();
        delete responseMap.fileData;
        
        res.status(201).json(responseMap);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Listar todos os mapas NDVI
router.get('/', async (req, res) => {
    try {
        const maps = await NDVIMap.find()
            .populate('uploadedBy', 'name email')
            .sort({ createdAt: -1 });
        res.json(maps);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Obter um mapa NDVI específico
router.get('/:id', async (req, res) => {
    try {
        const map = await NDVIMap.findById(req.params.id)
            .populate('uploadedBy', 'name email');
        if (!map) {
            return res.status(404).json({ error: 'Mapa não encontrado' });
        }
        
        // Se a requisição incluir o parâmetro download=true, retorna o arquivo
        if (req.query.download === 'true') {
            res.setHeader('Content-Type', map.fileType);
            res.setHeader('Content-Disposition', `attachment; filename="${map.name}${path.extname(map.fileType)}"`);
            return res.send(map.fileData);
        }
        
        // Caso contrário, retorna os metadados sem o arquivo
        const responseMap = map.toObject();
        delete responseMap.fileData;
        res.json(responseMap);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Atualizar um mapa NDVI
router.put('/:id', upload.single('file'), async (req, res) => {
    try {
        const updates = {
            name: req.body.name,
            description: req.body.description,
            captureDate: req.body.captureDate,
            metadata: {
                coordinates: JSON.parse(req.body.coordinates || '{}'),
                resolution: req.body.resolution
            }
        };

        // Se um novo arquivo foi enviado, atualiza o fileData e fileType
        if (req.file) {
            updates.fileData = req.file.buffer;
            updates.fileType = req.file.mimetype;
        }

        const map = await NDVIMap.findByIdAndUpdate(
            req.params.id,
            updates,
            { new: true, runValidators: true }
        );

        if (!map) {
            return res.status(404).json({ error: 'Mapa não encontrado' });
        }

        const responseMap = map.toObject();
        delete responseMap.fileData;
        res.json(responseMap);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Deletar um mapa NDVI
router.delete('/:id', async (req, res) => {
    try {
        const map = await NDVIMap.findByIdAndDelete(req.params.id);
        if (!map) {
            return res.status(404).json({ error: 'Mapa não encontrado' });
        }
        res.json({ message: 'Mapa deletado com sucesso' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router; 