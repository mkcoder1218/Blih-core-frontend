import { api } from "./client";
import type { ApiEnvelope } from "./types";

export type PositionCompetency = {
  id: string;
  businessId: string;
  positionId: string;
  name: string;
  description?: string | null;
  weight: number | string;
  isRequired: boolean;
  sortOrder: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type PositionCompetencyInput = {
  name: string;
  description?: string | null;
  weight: number;
  isRequired: boolean;
  sortOrder: number;
  isActive: boolean;
};

export const probationApi = {
  async getPositionCompetencies(
    positionId: string,
  ) {
    const response = await api.get<
      ApiEnvelope<PositionCompetency[]>
    >(
      `/api/v1/hr/probation/positions/${positionId}/competencies`,
    );

    return response.data.data;
  },

  async replacePositionCompetencies(
    positionId: string,
    competencies: PositionCompetencyInput[],
  ) {
    const response = await api.put<
      ApiEnvelope<PositionCompetency[]>
    >(
      `/api/v1/hr/probation/positions/${positionId}/competencies`,
      {
        competencies,
      },
    );

    return response.data.data;
  },
};
