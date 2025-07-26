// API helper for connecting to backend server
import { logger } from "./logger";

const API_BASE_URL =
	process.env.NEXT_PUBLIC_API_URL ||
	"https://office-management-fsy7.onrender.com";

export interface ApiResponse<T = any> {
	success: boolean;
	data?: T;
	error?: string;
	message?: string;
}

class ApiClient {
	private baseUrl: string;
	private retryAttempts = 3;
	private retryDelay = 1000;

	constructor(baseUrl: string) {
		this.baseUrl = baseUrl;
	}

	// Get JWT token from localStorage
	private getAuthToken(): string | null {
		if (typeof window !== 'undefined') {
			return localStorage.getItem('token');
		}
		return null;
	}

	private async request<T>(
		endpoint: string,
		options: RequestInit = {},
		retryCount = 0
	): Promise<ApiResponse<T>> {
		try {
			const url = `${this.baseUrl}${endpoint}`;
			
			// Get auth token
			const token = this.getAuthToken();
			
			// Prepare headers
			const headers: Record<string, string> = {
				"Content-Type": "application/json",
				"Cache-Control": "no-cache",
				Pragma: "no-cache",
			};

			// Add Authorization header if token exists
			if (token) {
				headers["Authorization"] = `Bearer ${token}`;
			}

			// Merge with custom headers from options
			if (options.headers) {
				Object.assign(headers, options.headers);
			}

			const response = await fetch(url, {
				headers,
				...options,
			});

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const data = await response.json();
			return data;
		} catch (error) {
			logger.error(`API request failed for ${endpoint}`, { error, endpoint }, 'API');

			// Retry logic for network errors
			if (retryCount < this.retryAttempts && this.isRetryableError(error)) {
				logger.info(
					`Retrying request (${retryCount + 1}/${this.retryAttempts})...`,
					{ retryCount: retryCount + 1, maxRetries: this.retryAttempts, endpoint },
					'API'
				);
				await this.delay(this.retryDelay * (retryCount + 1));
				return this.request(endpoint, options, retryCount + 1);
			}

			return {
				success: false,
				error: error instanceof Error ? error.message : "Unknown error",
			};
		}
	}

	private isRetryableError(error: any): boolean {
		// Retry on network errors, not on 4xx client errors
		return (
			error instanceof TypeError ||
			(error.message && error.message.includes("fetch"))
		);
	}

	private delay(ms: number): Promise<void> {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}

	// Projects API
	async getProjects() {
		return this.request("/api/projects");
	}

	async createProject(projectData: any) {
		return this.request("/api/projects", {
			method: "POST",
			body: JSON.stringify(projectData),
		});
	}

	async updateProject(id: string, projectData: any) {
		return this.request(`/api/projects/${id}`, {
			method: "PUT",
			body: JSON.stringify(projectData),
		});
	}

	async deleteProject(id: string) {
		return this.request(`/api/projects/${id}`, {
			method: "DELETE",
		});
	}

	// Tasks API
	async getTasks() {
		return this.request("/api/tasks");
	}

	async createTask(taskData: any) {
		return this.request("/api/tasks", {
			method: "POST",
			body: JSON.stringify(taskData),
		});
	}

	async updateTask(id: string, taskData: any) {
		return this.request(`/api/tasks/${id}`, {
			method: "PUT",
			body: JSON.stringify(taskData),
		});
	}

	async deleteTask(id: string) {
		return this.request(`/api/tasks/${id}`, {
			method: "DELETE",
		});
	}

	// Clients API
	async getClients() {
		return this.request("/api/clients");
	}

	async createClient(clientData: any) {
		return this.request("/api/clients", {
			method: "POST",
			body: JSON.stringify(clientData),
		});
	}

	async updateClient(id: string, clientData: any) {
		return this.request(`/api/clients/${id}`, {
			method: "PUT",
			body: JSON.stringify(clientData),
		});
	}

	async deleteClient(id: string) {
		return this.request(`/api/clients/${id}`, {
			method: "DELETE",
		});
	}

	// Users API
	async getUsers() {
		return this.request("/api/users");
	}

	async createUser(userData: any) {
		return this.request("/api/users", {
			method: "POST",
			body: JSON.stringify(userData),
		});
	}

	async updateUser(id: string, userData: any) {
		return this.request(`/api/users/${id}`, {
			method: "PUT",
			body: JSON.stringify(userData),
		});
	}

	async deleteUser(id: string) {
		return this.request(`/api/users/${id}`, {
			method: "DELETE",
		});
	}

	// Roles API
	async getRoles() {
		return this.request("/api/roles");
	}

	async createRole(roleData: any) {
		return this.request("/api/roles", {
			method: "POST",
			body: JSON.stringify(roleData),
		});
	}

	async updateRole(id: string, roleData: any) {
		return this.request(`/api/roles/${id}`, {
			method: "PUT",
			body: JSON.stringify(roleData),
		});
	}

	async deleteRole(id: string) {
		return this.request(`/api/roles/${id}`, {
			method: "DELETE",
		});
	}

	async seedRoles() {
		return this.request("/api/roles/seed", {
			method: "POST",
		});
	}

	// Auth API
	async login(credentials: { email: string; password: string }) {
		return this.request("/api/users/login", {
			method: "POST",
			body: JSON.stringify(credentials),
		});
	}

	async register(userData: any) {
		return this.request("/api/users", {
			method: "POST",
			body: JSON.stringify(userData),
		});
	}

	// Health check
	async healthCheck() {
		return this.request("/api/health");
	}

	// Task Types API
	async getTaskTypes() {
		return this.request("/api/taskTypes");
	}

	async createTaskType(typeData: any) {
		return this.request("/api/taskTypes", {
			method: "POST",
			body: JSON.stringify(typeData),
		});
	}

	async updateTaskType(id: string, typeData: any) {
		return this.request(`/api/taskTypes/${id}`, {
			method: "PUT",
			body: JSON.stringify(typeData),
		});
	}

	async deleteTaskType(id: string) {
		return this.request(`/api/taskTypes/${id}`, {
			method: "DELETE",
		});
	}

	async seedTaskTypes() {
		return this.request("/api/taskTypes/seed", {
			method: "POST",
		});
	}

	// Finance API
	async getTransactions() {
		return this.request("/api/transactions");
	}

	async createTransaction(transactionData: any) {
		return this.request("/api/transactions", {
			method: "POST",
			body: JSON.stringify(transactionData),
		});
	}

	async updateTransaction(id: string, transactionData: any) {
		return this.request(`/api/transactions/${id}`, {
			method: "PUT",
			body: JSON.stringify(transactionData),
		});
	}

	async deleteTransaction(id: string) {
		return this.request(`/api/transactions/${id}`, {
			method: "DELETE",
		});
	}

	// Upcoming Payments API
	async getUpcomingPayments() {
		return this.request("/api/upcomingPayments");
	}

	async createUpcomingPayment(paymentData: any) {
		return this.request("/api/upcomingPayments", {
			method: "POST",
			body: JSON.stringify(paymentData),
		});
	}

	async updateUpcomingPayment(id: string, paymentData: any) {
		return this.request(`/api/upcomingPayments/${id}`, {
			method: "PUT",
			body: JSON.stringify(paymentData),
		});
	}

	async deleteUpcomingPayment(id: string) {
		return this.request(`/api/upcomingPayments/${id}`, {
			method: "DELETE",
		});
	}

	// Attendance API
	async getAttendance() {
		return this.request("/api/attendance");
	}

	async createAttendance(attendanceData: any) {
		return this.request("/api/attendance", {
			method: "POST",
			body: JSON.stringify(attendanceData),
		});
	}

	async updateAttendance(id: string, attendanceData: any) {
		return this.request(`/api/attendance/${id}`, {
			method: "PUT",
			body: JSON.stringify(attendanceData),
		});
	}

	async deleteAttendance(id: string) {
		return this.request(`/api/attendance/${id}`, {
			method: "DELETE",
		});
	}

	// Company Settings API
	async getCompanySettings() {
		return this.request("/api/companySettings");
	}

	async updateCompanySettings(settingsData: any) {
		return this.request("/api/companySettings", {
			method: "POST",
			body: JSON.stringify(settingsData),
		});
	}

	// User Settings API
	async getUserSettings(userId: string) {
		return this.request(`/api/userSettings/${userId}`);
	}

	async updateUserSettings(settingsData: any) {
		return this.request("/api/userSettings", {
			method: "POST",
			body: JSON.stringify(settingsData),
		});
	}

	// Notifications API
	async getNotifications() {
		return this.request("/api/notifications");
	}

	async createNotification(notificationData: any) {
		return this.request("/api/notifications", {
			method: "POST",
			body: JSON.stringify(notificationData),
		});
	}

	async updateNotification(id: string, notificationData: any) {
		return this.request(`/api/notifications/${id}`, {
			method: "PUT",
			body: JSON.stringify(notificationData),
		});
	}

	async deleteNotification(id: string) {
		return this.request(`/api/notifications/${id}`, {
			method: "DELETE",
		});
	}

	// Realtime API
	async broadcastUpdate(updateData: any) {
		return this.request("/api/realtime/broadcast", {
			method: "POST",
			body: JSON.stringify(updateData),
		});
	}
}

export const api = new ApiClient(API_BASE_URL);
