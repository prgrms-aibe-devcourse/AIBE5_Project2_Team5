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

export type MyActivityItemResponse = {
  postId: number;
  title: string;
  overview: string;
  projectState: string;
  jobState: string;
  category: string;
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

/** 신규 추가: 내가 등록한 프로젝트 공고 목록 조회 */
export function getMyPostsApi() {
  return apiRequest<MyActivityItemResponse[]>(
      "/api/projects/my-posts",
      { method: "GET" },
      "내가 등록한 공고를 불러오지 못했습니다."
  );
}

/** 신규 추가: 내가 지원한 프로젝트 공고 목록 조회 */
export function getMyApplicationsApi() {
  return apiRequest<MyActivityItemResponse[]>(
      "/api/projects/my-applications",
      { method: "GET" },
      "내가 지원한 공고를 불러오지 못했습니다."
  );
}
