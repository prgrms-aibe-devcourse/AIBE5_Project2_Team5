import { apiRequest, publicApiRequest } from "./apiClient";

export type FilteringResponse = {
  jobStates: string[];
  experienceLevels: string[];
  categories: string[];
};

export type CreateProjectPayload = {
  postType: string;
  title: string;
  category: string;
  jobState: string;
  experienceLevel: string;
  budget: number;
  overview: string;
  fullDescription: string;
  skills: string[];
  responsibilities: string[];
  qualifications: string[];
  state: string;
  deadline: string;
};

export type ProjectDetailResponse = {
  postId: number;
  postType: string;
  category: string;
  title: string;
  budget: number;
  overview: string;
  fullDescription: string;
  responsibilities: string[];
  qualifications: string[];
  skills: string[];
  experienceLevel: string;
  jobState: string;
  deadline: string;
};

export function getProjectFilterOptionsApi() {
  return publicApiRequest<FilteringResponse>("/api/projects/filtering", {}, "Failed to load project filters.");
}

export function getProjectDetailApi(postId: number) {
  return publicApiRequest<ProjectDetailResponse>(`/api/projects/${postId}`, {}, "Failed to load project details.");
}

export function createProjectApi(payload: CreateProjectPayload) {
  return apiRequest<ProjectDetailResponse>(
    "http://localhost:8080/api/projects/create",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    "Failed to create project.",
  );
}
