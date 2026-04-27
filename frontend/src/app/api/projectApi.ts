import { apiRequest } from "./apiClient";

export type FilteringResponse = {
  jobStates: string[];
  experienceLevels: string[];
  categories: string[];
};

export type CreateProjectPayload = {
  postType: string;
  title: string;
  category: string;
  categories: string[];
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

export type ApplyProjectPayload = {
  coverLetter: string;
  summary: string;
  expectedBudget?: number;
  portfolioUrl?: string;
  startDate?: string;
};

export type ProjectDetailResponse = {
  postId: number;
  postType: string;
  profileImage?: string | null;
  category: string;
  categories?: string[];
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
  thumbnailImageUrl?: string | null;
  imageUrls?: string[];
};

export type MyActivityItemResponse = {
  postId: number;
  title: string;
  overview: string;
  profileImage?: string | null;
  projectState: string;
  jobState: string;
  category: string;
  categories?: string[];
  deadline: string;
  thumbnailImageUrl?: string | null;
  imageUrls?: string[];
};

export type MyApplicationItemResponse = {
  applicationId: number;
  postId: number;
  title: string;
  overview?: string | null;
  profileImage?: string | null;
  expectedBudget?: number | null;
  projectState?: string | null;
  jobState?: string | null;
  category?: string | null;
  categories?: string[] | null;
  deadline?: string | null;
  thumbnailImageUrl?: string | null;
  imageUrls?: string[];
};

export type ProjectApplicationItemResponse = {
  applicationId: number;
  designerId: number;
  designerName: string;
  designerNickname?: string | null;
  designerProfileImage?: string | null;
  expectedBudget?: number | null;
  summary?: string | null;
  coverLetter?: string | null;
  portfolioUrl?: string | null;
  startDate?: string | null;
};

export function getProjectFilterOptionsApi() {
  return apiRequest<FilteringResponse>("/api/projects/filtering", {}, "Failed to load project filters.");
}

export function getProjectDetailApi(postId: number) {
  return apiRequest<ProjectDetailResponse>(`/api/projects/${postId}`, {}, "Failed to load project details.");
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

export function applyProjectApi(postId: number, payload: ApplyProjectPayload) {
  return apiRequest<string>(
    `/api/projects/${postId}/apply`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    "Failed to apply to project.",
  );
}

export function getMyPostsApi() {
  return apiRequest<MyActivityItemResponse[]>(
    "/api/projects/my-posts",
    { method: "GET" },
    "Failed to load my project posts.",
  );
}

export function getMyApplicationsApi() {
  return apiRequest<MyApplicationItemResponse[]>(
    "/api/projects/my-applications",
    { method: "GET" },
    "Failed to load my applications.",
  );
}

export function getProjectApplicationsApi(postId: number) {
  return apiRequest<ProjectApplicationItemResponse[]>(
    `/api/projects/${postId}/applications`,
    { method: "GET" },
    "Failed to load project applications.",
  );
}
