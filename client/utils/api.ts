// client/utils/api.ts

// For TypeScript, define the expected response structure
interface AiReviewResponse {
  success: boolean;
  aiFeedback?: string; // Optional because success could be false
  error?: string; // Optional error message
}

interface AiReviewRequest {
  code: string;
  language: string;
}

// Ensure this URL matches your compiler-service's accessible address
// Since Docker Compose sets it up, 'http://localhost:8000' is correct when running locally
const API_BASE_URL = 'http://localhost:8000';

export const getAiCodeReview = async (
  code: string,
  language: string
): Promise<AiReviewResponse> => { // This function now returns the full AiReviewResponse object
  try {
    const response = await fetch(`${API_BASE_URL}/ai-review`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code, language }),
    });

    if (!response.ok) {
      // If the response itself is not OK (e.g., 4xx, 5xx), parse error details
      const errorData = await response.json();
      // Return a structured error response
      return { success: false, error: errorData.error || `HTTP error! status: ${response.status}` };
    }

    const data: AiReviewResponse = await response.json();
    return data; // Return the parsed data directly
  } catch (error: any) {
    console.error('Error fetching AI code review:', error);
    // Return a structured error response for network or parsing issues
    return { success: false, error: error.message || 'An unknown error occurred during AI review.' };
  }
};