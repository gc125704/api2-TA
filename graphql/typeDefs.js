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
    uploadedBy: String!
    createdAt: String!
    updatedAt: String!
    fileData: String! # Retorna o buffer como base64
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
    uploadedBy: String!
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
    ndviMaps(limit: Int, offset: Int, sortBy: String): [NDVIMap!]!
    
    # Buscar um mapa específico por ID
    ndviMap(id: ID!): NDVIMap
    
    # Buscar mapas por filtros
    ndviMapsByUser(uploadedBy: String!): [NDVIMap!]!
    ndviMapsByDateRange(startDate: String!, endDate: String!): [NDVIMap!]!
    
    # Obter o arquivo (retorna base64 ou URL para download)
    ndviMapFile(id: ID!): String
  }

  type Mutation {
    # Criar novo mapa NDVI
    createNDVIMap(input: NDVIMapInput!, fileData: String!): NDVIMap!
    
    # Atualizar mapa existente
    updateNDVIMap(id: ID!, input: NDVIMapUpdateInput!, fileData: String): NDVIMap!
    
    # Deletar mapa
    deleteNDVIMap(id: ID!): Boolean!
  }
`;

module.exports = typeDefs;