export type Role = "owner" | "admin" | "member";

export type TaskStatus = "TODO" | "IN_PROGRESS" | "REVIEW" | "DONE";

export type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface Organization {
  _id: string;
  name: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Member {
  _id: string;
  userId: {
    _id: string;
    name: string;
    email: string;
  };
  organizationId: string;
  role: Role;
  createdAt: string;
}

export interface Project {
  _id: string;
  name: string;
  description?: string;
  organizationId: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  _id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  projectId: string;
  organizationId: string;
  assigneeId?: string;
  createdBy: string;
  dueDate?: string;
  labels: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  _id: string;
  content: string;
  taskId: string;
  userId: {
    _id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface DashboardData {
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  myAssignedTasks: number;
  overdueTasks: number;
  breakdown: {
    _id: TaskStatus;
    count: number;
  }[];
}

export interface Activity {
  _id: string;
  actorId: {
    _id: string;
    name: string;
    email: string;
  };
  action: string;
  targetId?: string;
  message: string;
  createdAt: string;
}

export interface Notification {
  _id: string;
  type: "TASK_ASSIGNED" | "NEW_COMMENT";
  message: string;
  relatedTaskId?: string;
  isRead: boolean;
  createdAt: string;
}

export interface Pagination {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  pagination?: Pagination;
  message?: string;
}
