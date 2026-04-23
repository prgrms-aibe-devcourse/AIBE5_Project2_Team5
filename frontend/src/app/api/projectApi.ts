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
  // 💡 수정됨: 백엔드의 List<String>에 맞춰 string[] 배열 타입으로 변경
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
  // 💡 수정됨: 백엔드 응답 DTO도 List<String>을 반환하므로 string[] 배열 타입으로 변경
  responsibilities: string[];
  qualifications: string[];
  experienceLevel: string;
  jobState: string;
  deadline: string;
};

export function getProjectFilterOptionsApi() {
  return publicApiRequest<FilteringResponse>("/api/projects/filtering", {}, "Failed to load project filters.");
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