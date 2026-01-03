/**
 * Retry a function with exponential backoff
 * @param fn Function to retry
 * @param maxRetries Maximum number of retry attempts
 * @param initialDelay Initial delay in milliseconds
 * @returns Result of the function
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000
): Promise<T> {
  let lastError: Error;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;

      // Don't retry on authentication errors or invalid API key
      if (error.message?.includes('API key') || error.message?.includes('authentication')) {
        throw error;
      }

      // Don't retry on invalid request format
      if (error.message?.includes('invalid') || error.message?.includes('schema')) {
        throw error;
      }

      if (attempt < maxRetries) {
        const delay = initialDelay * Math.pow(2, attempt);
        console.log(`Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError!;
}

/**
 * Custom error classes for better error handling
 */
export class APIKeyError extends Error {
  constructor(message: string = 'Invalid or missing API key') {
    super(message);
    this.name = 'APIKeyError';
  }
}

export class FileSizeError extends Error {
  constructor(message: string = 'File size exceeds maximum limit') {
    super(message);
    this.name = 'FileSizeError';
  }
}

export class FileTypeError extends Error {
  constructor(message: string = 'Unsupported file type') {
    super(message);
    this.name = 'FileTypeError';
  }
}

export class NetworkError extends Error {
  constructor(message: string = 'Network request failed') {
    super(message);
    this.name = 'NetworkError';
  }
}

export class GenerationError extends Error {
  constructor(message: string = 'Content generation failed') {
    super(message);
    this.name = 'GenerationError';
  }
}
