const mongoose = require('mongoose');

const ndviMapSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    captureDate: {
        type: Date,
        required: true
    },
    fileData: {
        type: Buffer,
        required: true
    },
    fileType: {
        type: String,
        required: true,
        enum: ['image/tiff', 'image/jpeg', 'image/png']
    },
    metadata: {
        coordinates: {
            north: Number,
            south: Number,
            east: Number,
            west: Number
        },
        resolution: {
            type: Number,
            required: true
        },
        format: {
            type: String,
            required: true,
            enum: ['GeoTIFF', 'JPEG', 'PNG']
        }
    },
    propriedadeId: {
        type: Number,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Middleware para atualizar o updatedAt antes de salvar
ndviMapSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.models.NDVIMap || mongoose.model('NDVIMap', ndviMapSchema); 