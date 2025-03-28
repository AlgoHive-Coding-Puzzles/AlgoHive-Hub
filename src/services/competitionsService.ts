import { AxiosError } from "axios";
import { ApiClient } from "../config/ApiClient";
import { Competition } from "../models/Competition";
import { Group } from "../models/Group";
import { Try } from "../models/Try";

export interface CompetitionStatistics {
  competition_id: string;
  title: string;
  total_users: number;
  active_users: number;
  completion_rate: number;
  average_score: number;
  highest_score: number;
}

interface RateLimitResponse {
  is_correct?: boolean;
  error?: string;
  wait_time_seconds?: number;
}

// Get all competitions
export const fetchCompetitions = async (): Promise<Competition[]> => {
  const response = await ApiClient.get("/competitions/");
  return response.data;
};

// Get competition details
export const fetchCompetitionDetails = async (
  id: string
): Promise<Competition> => {
  const response = await ApiClient.get(`/competitions/${id}`);
  return response.data;
};

// Create a new competition
export const createCompetition = async (
  competition: Partial<Competition>
): Promise<Competition> => {
  const response = await ApiClient.post("/competitions/", competition);
  return response.data;
};

// Update an existing competition
export const updateCompetition = async (
  id: string,
  competition: Partial<Competition>
): Promise<Competition> => {
  const response = await ApiClient.put(`/competitions/${id}`, competition);
  return response.data;
};

// Delete a competition
export const deleteCompetition = async (id: string): Promise<void> => {
  await ApiClient.delete(`/competitions/${id}`);
};

// Toggle competition visibility
export const toggleCompetitionVisibility = async (
  id: string,
  show: boolean
): Promise<Competition> => {
  const response = await ApiClient.put(`/competitions/${id}/visibility`, {
    show,
  });
  return response.data;
};

// Mark competition as finished
export const finishCompetition = async (id: string): Promise<Competition> => {
  const response = await ApiClient.put(`/competitions/${id}/finish`);
  return response.data;
};

// Get competition statistics
export const fetchCompetitionStatistics = async (
  id: string
): Promise<CompetitionStatistics> => {
  const response = await ApiClient.get(`/competitions/${id}/statistics`);
  return response.data;
};

// Get competition groups
export const fetchCompetitionGroups = async (id: string): Promise<Group[]> => {
  const response = await ApiClient.get(`/competitions/${id}/groups`);
  return response.data;
};

// Add group to competition
export const addGroupToCompetition = async (
  competitionId: string,
  groupId: string
): Promise<Competition> => {
  const response = await ApiClient.post(
    `/competitions/${competitionId}/groups/${groupId}`
  );
  return response.data;
};

// Remove group from competition
export const removeGroupFromCompetition = async (
  competitionId: string,
  groupId: string
): Promise<Competition> => {
  const response = await ApiClient.delete(
    `/competitions/${competitionId}/groups/${groupId}`
  );
  return response.data;
};

// Get competition tries
export const fetchCompetitionTries = async (id: string): Promise<Try[]> => {
  const response = await ApiClient.get(`/competitions/${id}/tries`);
  return response.data;
};

// Get user competition tries
export const fetchUserCompetitionTries = async (
  competitionId: string,
  userId: string
): Promise<Try[]> => {
  const response = await ApiClient.get(
    `/competitions/${competitionId}/users/${userId}/tries`
  );
  return response.data;
};

// Get all competitions accessible to the current user through their groups
export const fetchUserCompetitions = async (): Promise<Competition[]> => {
  const response = await ApiClient.get("/competitions/user");
  return response.data;
};

export const getCompetitionPuzzleInput = async (
  competitionId: string,
  puzzleId: string,
  puzzleIndex: number,
  puzzleDifficulty: string
): Promise<{ input_lines: string[] }> => {
  const response = await ApiClient.post("/competitions/input", {
    competition_id: competitionId,
    puzzle_difficulty: puzzleDifficulty,
    puzzle_id: puzzleId,
    puzzle_index: puzzleIndex,
  });
  return response.data;
};

export const submitPuzzleAnswer = async (
  competitionId: string,
  puzzleId: string,
  puzzleIndex: number,
  puzzleDifficulty: string,
  solution: number,
  puzzle_step: number
): Promise<RateLimitResponse> => {
  try {
    const response = await ApiClient.post("/competitions/answer_puzzle", {
      competition_id: competitionId,
      puzzle_difficulty: puzzleDifficulty,
      puzzle_id: puzzleId,
      puzzle_index: puzzleIndex,
      solution: solution.toString(),
      puzzle_step: puzzle_step,
    });
    return { is_correct: response.data.is_correct };
  } catch (error: unknown) {
    if (error instanceof AxiosError) {
      // Handle Axios error
      const axiosError = error as AxiosError<RateLimitResponse>;
      if (axiosError.response?.status === 429) {
        return {
          error: "Rate limit exceeded",
          wait_time_seconds: axiosError.response.data.wait_time_seconds,
        };
      }
    }
    console.error("An unknown error occurred:", error);
    return { error: "An unknown error occurred" };
  }
};

export const fetchPuzzleTries = async (
  competitionId: string,
  puzzleId: string,
  puzzleIndex: number
): Promise<Try[]> => {
  const response = await ApiClient.get(
    `/competitions/${competitionId}/puzzles/${puzzleId}/${puzzleIndex}/tries`
  );
  return response.data;
};

export const checkPuzzlePermission = async (
  competitionId: string,
  puzzleIndex: number
): Promise<boolean> => {
  const response = await ApiClient.get(
    `/competitions/${competitionId}/permission/puzzles/${puzzleIndex}`
  );
  return response.data.has_permission;
};

export const exportCompetitionDataExcel = async (
  competitionId: string
): Promise<void> => {
  const response = await ApiClient.get(
    `/competitions/${competitionId}/export`,
    { responseType: "blob" }
  );
  const blob = new Blob([response.data], { type: "application/vnd.ms-excel" });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `competition_${competitionId}_data.xlsx`;
  a.click();
  window.URL.revokeObjectURL(url);
};
