// graphql/typeDefs.js - Definição do Schema GraphQL
const { gql } = require('apollo-server-express');

const typeDefs = gql`
  type Coordinates {
    north: Float
    south: Float
    east: Float
    west: Float
  }

  type Metadata {
    coordinates: Coordinates
    resolution: Float!
    format: String!
  }

  type NDVIMap {
    id: ID!
    name: String!
    description: String
    captureDate: String!
    fileType: String!
    metadata: Metadata!
    propriedadeId: Int!
    createdAt: String!
    updatedAt: String!
    fileData: String! # Retorna o buffer como base64
  }

  type NDVIMapResult {
    totalCount: Int!
    items: [NDVIMap!]!
  }

  input CoordinatesInput {
    north: Float
    south: Float
    east: Float
    west: Float
  }

  input MetadataInput {
    coordinates: CoordinatesInput
    resolution: Float!
    format: String!
  }

  input NDVIMapInput {
    name: String!
    description: String
    captureDate: String!
    fileType: String!
    metadata: MetadataInput!
    propriedadeId: Int!
  }

  input NDVIMapUpdateInput {
    name: String
    description: String
    captureDate: String
    fileType: String
    metadata: MetadataInput
  }

  type Query {
    # Listar todos os mapas NDVI com paginação opcional
    ndviMaps(propriedadeId: Int, limit: Int, offset: Int, sortBy: String): [NDVIMap!]!
    
    # Buscar mapas por uma lista de propriedades
    ndviMapsByPropriedades(propriedadeIds: [Int!], limit: Int, offset: Int, sortBy: String): NDVIMapResult!
    
    # Novo endpoint para contar mapas por lista de propriedades
    ndviMapsCountByPropriedades(propriedadeIds: [Int!]): Int!
    
    # Buscar um mapa específico por ID
    ndviMap(id: ID!, propriedadeId: Int!): NDVIMap
    
    # Buscar mapas por filtros
    ndviMapsByUser(propriedadeId: Int!, limit: Int, offset: Int, sortBy: String): [NDVIMap!]!
    ndviMapsByDateRange(startDate: String!, endDate: String!, propriedadeId: Int!, limit: Int, offset: Int, sortBy: String): [NDVIMap!]!
    
    # Obter o arquivo (retorna base64 ou URL para download)
    ndviMapFile(id: ID!, propriedadeId: Int!): String
  }

  type Mutation {
    # Criar novo mapa NDVI
    createNDVIMap(input: NDVIMapInput!, fileData: String!, propriedadeId: Int!): NDVIMap!
    
    # Atualizar mapa existente
    updateNDVIMap(id: ID!, input: NDVIMapUpdateInput!, fileData: String, propriedadeId: Int!): NDVIMap!
    
    # Deletar mapa
    deleteNDVIMap(id: ID!): Boolean!
  }
`;

module.exports = typeDefs;