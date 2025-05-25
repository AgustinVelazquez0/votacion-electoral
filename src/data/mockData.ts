// src/data/mockData.ts
import type { Candidate, VotingSession } from "../types";

export const mockCandidates: Candidate[] = [
  {
    id: 1,
    name: "María González",
    description: "Candidata con enfoque en educación y tecnología",
    party: "Partido Progresista",
    image: "/api/placeholder/150/150",
    proposals: [
      "Modernización del sistema educativo digital",
      "Inversión en tecnología e innovación",
      "Programas de capacitación laboral 4.0",
      "Digitalización de servicios públicos",
      "Becas para estudios tecnológicos",
    ],
  },
  {
    id: 2,
    name: "Carlos Rodríguez",
    description: "Candidato enfocado en economía y empleo",
    party: "Partido Económico",
    image: "/api/placeholder/150/150",
    proposals: [
      "Reducción de impuestos a PyMEs",
      "Creación de 100,000 empleos verdes",
      "Modernización de infraestructura",
      "Apoyo a emprendedores locales",
      "Incentivos para la inversión extranjera",
    ],
  },
  {
    id: 3,
    name: "Ana Martínez",
    description: "Candidata con enfoque social y medioambiental",
    party: "Partido Verde",
    image: "/api/placeholder/150/150",
    proposals: [
      "Políticas ambientales sostenibles",
      "Programas sociales inclusivos",
      "Transición a energías renovables",
      "Protección de áreas naturales",
      "Agricultura sostenible",
    ],
  },
];

export const mockSession: VotingSession = {
  id: "elec-2024-001",
  title: "Elecciones Presidenciales 2024",
  description: "Proceso electoral para elegir el próximo presidente del país",
  startDate: new Date("2024-11-01T08:00:00"),
  endDate: new Date("2024-11-30T20:00:00"),
  isActive: true,
  candidates: mockCandidates,
  totalVotes: 0,
  allowMultipleVotes: false,
  requiresVerification: true,
};
