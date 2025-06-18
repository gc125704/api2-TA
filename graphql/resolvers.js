const NDVIMap = require('../models/ndviMap');
const mongoose = require('mongoose');

const resolvers = {
  Query: {
    // Listar todos os mapas com opções de paginação e ordenação
    ndviMaps: async (_, { propriedadeId, limit = 0, offset = 0, sortBy = 'createdAt' }) => {
      try {
        const sortOrder = sortBy.startsWith('-') ? -1 : 1;
        const sortField = sortBy.replace('-', '');
        
        const query = NDVIMap.find({ propriedadeId: Number(propriedadeId) })
          .sort({ [sortField]: sortOrder })
          .skip(offset);
          
        if (limit !== 0) {
          query.limit(limit);
        }
        
        const maps = await query;
        return maps;
      } catch (error) {
        throw new Error(`Erro ao buscar mapas NDVI: ${error.message}`);
      }
    },

    // Buscar mapa por ID
    ndviMap: async (_, { id, propriedadeId }) => {
      try {
        if (!mongoose.Types.ObjectId.isValid(id)) {
          throw new Error('ID inválido');
        }
        
        const map = await NDVIMap.findOne({ _id: id, propriedadeId: Number(propriedadeId) });
        if (!map) {
          throw new Error('Mapa não encontrado');
        }
        
        return map;
      } catch (error) {
        throw new Error(`Erro ao buscar mapa: ${error.message}`);
      }
    },

    // Buscar mapas por usuário
    ndviMapsByUser: async (_, { propriedadeId, limit = 0, offset = 0, sortBy = '-createdAt' }) => {
      try {
        const sortOrder = sortBy.startsWith('-') ? -1 : 1;
        const sortField = sortBy.replace('-', '');
        
        const query = NDVIMap.find({ propriedadeId: Number(propriedadeId) })
          .sort({ [sortField]: sortOrder })
          .skip(offset);
          
        if (limit !== 0) {
          query.limit(limit);
        }
        
        const maps = await query;
        return maps;
      } catch (error) {
        throw new Error(`Erro ao buscar mapas do usuário: ${error.message}`);
      }
    },

    // Buscar mapas por intervalo de datas
    ndviMapsByDateRange: async (_, { startDate, endDate, propriedadeId, limit = 0, offset = 0, sortBy = '-captureDate' }) => {
      try {
        const sortOrder = sortBy.startsWith('-') ? -1 : 1;
        const sortField = sortBy.replace('-', '');
        
        const query = NDVIMap.find({
          captureDate: {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
          },
          propriedadeId: Number(propriedadeId)
        })
        .sort({ [sortField]: sortOrder })
        .skip(offset);
        
        if (limit !== 0) {
          query.limit(limit);
        }
        
        const maps = await query;
        return maps;
      } catch (error) {
        throw new Error(`Erro ao buscar mapas por data: ${error.message}`);
      }
    },

    // Obter arquivo do mapa (retorna em base64)
    ndviMapFile: async (_, { id, propriedadeId }) => {
      try {
        if (!mongoose.Types.ObjectId.isValid(id)) {
          throw new Error('ID inválido');
        }
        
        const map = await NDVIMap.findOne({ _id: id, propriedadeId: Number(propriedadeId) });
        if (!map) {
          throw new Error('Mapa não encontrado');
        }
        
        // Retorna o arquivo em base64
        return map.fileData.toString('base64');
      } catch (error) {
        throw new Error(`Erro ao obter arquivo: ${error.message}`);
      }
    },

    ndviMapsByPropriedades: async (_, { propriedadeIds, limit = 0, offset = 0, sortBy = 'createdAt' }) => {
      try {
        const sortOrder = sortBy.startsWith('-') ? -1 : 1;
        const sortField = sortBy.replace('-', '');

        let queryObj = {};
        if (propriedadeIds && propriedadeIds.length > 0) {
          queryObj.propriedadeId = { $in: propriedadeIds.map(Number) };
        }

        // Buscar o total antes da paginação
        const totalCount = await NDVIMap.countDocuments(queryObj);

        const query = NDVIMap.find(queryObj)
          .sort({ [sortField]: sortOrder })
          .skip(offset);

        if (limit !== 0) {
          query.limit(limit);
        }

        const items = await query;
        return { totalCount, items };
      } catch (error) {
        throw new Error(`Erro ao buscar mapas NDVI por propriedades: ${error.message}`);
      }
    },

    // Novo endpoint para contar mapas por lista de propriedades
    ndviMapsCountByPropriedades: async (_, { propriedadeIds }) => {
      try {
        let queryObj = {};
        if (propriedadeIds && propriedadeIds.length > 0) {
          queryObj.propriedadeId = { $in: propriedadeIds.map(Number) };
        }
        const count = await NDVIMap.countDocuments(queryObj);
        return count;
      } catch (error) {
        throw new Error(`Erro ao contar mapas NDVI por propriedades: ${error.message}`);
      }
    }
  },

  // Resolver para o tipo NDVIMap
  NDVIMap: {
    // Converter fileData de Buffer para base64
    fileData: (parent) => {
      if (parent.fileData) {
        return parent.fileData.toString('base64');
      }
      return null;
    },
    
    // Converter datas para string ISO
    captureDate: (parent) => {
      return parent.captureDate.toISOString();
    },
    
    createdAt: (parent) => {
      return parent.createdAt.toISOString();
    },
    
    updatedAt: (parent) => {
      return parent.updatedAt.toISOString();
    }
  },

  Mutation: {
    // Criar novo mapa NDVI
    createNDVIMap: async (_, { input, fileData, propriedadeId }) => {
      try {
        // Converter base64 para Buffer
        const buffer = Buffer.from(fileData, 'base64');
        
        const ndviMap = new NDVIMap({
          ...input,
          fileData: buffer,
          captureDate: new Date(input.captureDate),
          propriedadeId: Number(propriedadeId)
        });
        
        const savedMap = await ndviMap.save();
        return savedMap;
      } catch (error) {
        if (error.name === 'ValidationError') {
          throw new Error(`Dados inválidos: ${error.message}`);
        }
        throw new Error(`Erro ao criar mapa: ${error.message}`);
      }
    },

    // Atualizar mapa existente
    updateNDVIMap: async (_, { id, input, fileData, propriedadeId }) => {
      try {
        if (!mongoose.Types.ObjectId.isValid(id)) {
          throw new Error('ID inválido');
        }

        // Verificar se o mapa existe e pertence à propriedade
        const existingMap = await NDVIMap.findOne({ _id: id, propriedadeId: Number(propriedadeId) });
        if (!existingMap) {
          throw new Error('Mapa não encontrado');
        }

        // Preparar dados de atualização
        const updateData = { ...input };
        
        // Converter data se fornecida
        if (input.captureDate) {
          updateData.captureDate = new Date(input.captureDate);
        }
        
        // Adicionar novo arquivo se fornecido
        if (fileData) {
          updateData.fileData = Buffer.from(fileData, 'base64');
        }
        
        // Atualizar timestamp
        updateData.updatedAt = new Date();

        const updatedMap = await NDVIMap.findByIdAndUpdate(
          id,
          updateData,
          { 
            new: true, 
            runValidators: true 
          }
        );

        return updatedMap;
      } catch (error) {
        if (error.name === 'ValidationError') {
          throw new Error(`Dados inválidos: ${error.message}`);
        }
        throw new Error(`Erro ao atualizar mapa: ${error.message}`);
      }
    },

    // Deletar mapa
    deleteNDVIMap: async (_, { id}) => {
      try {
        if (!mongoose.Types.ObjectId.isValid(id)) {
          throw new Error('ID inválido');
        }

        // Verificar se o mapa existe e pertence à propriedade
        const map = await NDVIMap.findOne({ _id: id });
        if (!map) {
          throw new Error('Mapa não encontrado');
        }

        await NDVIMap.findByIdAndDelete(id);
        return true;
      } catch (error) {
        throw new Error(`Erro ao deletar mapa: ${error.message}`);
      }
    }
  }
};

module.exports = resolvers;