const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const NDVIMap = require('../models/ndviMap');

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
        console.log('ID recebido:', req.params.id);
        console.log('Body recebido:', req.body);
        console.log('Arquivo recebido:', req.file ? 'Sim' : 'Não');
        
        // Verificar se o ID é válido
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ error: 'ID inválido' });
        }

        // Função para extrair coordenadas de diferentes formatos
        const extractCoordinates = (body) => {
            let coordinates = {};
            
            // Método 1: coordinates como string JSON
            if (body.coordinates) {
                try {
                    coordinates = JSON.parse(body.coordinates);
                } catch (e) {
                    console.log('Erro ao parsear coordinates JSON:', e);
                }
            }
            
            // Método 2: campos separados com prefixo metadata[coordinates]
            const coordFields = ['north', 'south', 'east', 'west'];
            coordFields.forEach(field => {
                const fieldKey = `metadata[coordinates][${field}]`;
                if (body[fieldKey]) {
                    coordinates[field] = parseFloat(body[fieldKey]);
                }
            });
            
            // Método 3: campos diretos (para facilitar os testes)
            coordFields.forEach(field => {
                if (body[field] && !coordinates[field]) {
                    coordinates[field] = parseFloat(body[field]);
                }
            });
            
            return coordinates;
        };

        // Extrair coordenadas
        const coordinates = extractCoordinates(req.body);
        console.log('Coordenadas extraídas:', coordinates);

        // Preparar objeto de atualização
        const updates = {};
        
        // Campos básicos
        if (req.body.name) updates.name = req.body.name;
        if (req.body.description) updates.description = req.body.description;
        if (req.body.captureDate) updates.captureDate = req.body.captureDate;
        
        // Metadata
        if (Object.keys(coordinates).length > 0 || req.body.resolution || req.body['metadata[resolution]'] || req.body['metadata[format]']) {
            updates.metadata = {};
            
            if (Object.keys(coordinates).length > 0) {
                updates.metadata.coordinates = coordinates;
            }
            
            if (req.body.resolution || req.body['metadata[resolution]']) {
                updates.metadata.resolution = req.body.resolution || req.body['metadata[resolution]'];
            }
            
            if (req.body['metadata[format]']) {
                updates.metadata.format = req.body['metadata[format]'];
            }
        }

        // Se um novo arquivo foi enviado
        if (req.file) {
            updates.fileData = req.file.buffer;
            updates.fileType = req.file.mimetype;
            console.log('Novo arquivo será salvo:', req.file.mimetype);
        }

        console.log('Objeto de updates final:', { ...updates, fileData: updates.fileData ? '[Buffer]' : undefined });

        // Verificar se o mapa existe antes de tentar atualizar
        const existingMap = await NDVIMap.findById(req.params.id);
        if (!existingMap) {
            return res.status(404).json({ error: 'Mapa não encontrado' });
        }

        // Realizar a atualização
        const updatedMap = await NDVIMap.findByIdAndUpdate(
            req.params.id,
            updates,
            { 
                new: true, 
                runValidators: true,
                upsert: false
            }
        ).populate('uploadedBy', 'name email');

        // Preparar resposta sem o buffer
        const responseMap = updatedMap.toObject();
        delete responseMap.fileData;
        
        console.log('Mapa atualizado com sucesso');
        res.json({
            message: 'Mapa atualizado com sucesso',
            data: responseMap
        });
        
    } catch (error) {
        console.error('Erro na atualização:', error);
        
        // Tratamento específico de erros
        if (error.name === 'ValidationError') {
            return res.status(400).json({ 
                error: 'Dados inválidos',
                details: error.message 
            });
        }
        
        if (error.name === 'CastError') {
            return res.status(400).json({ 
                error: 'ID do mapa inválido' 
            });
        }
        
        res.status(500).json({ 
            error: 'Erro interno do servidor',
            message: error.message 
        });
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