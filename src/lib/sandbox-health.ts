/**
 * Utility functions for checking sandbox health and E2B service status
 */

import { Sandbox } from "@e2b/code-interpreter";

interface SandboxHealthCheck {
  isHealthy: boolean;
  error?: string;
  details?: {
    canCreateSandbox: boolean;
    templateExists: boolean;
    apiKeyValid: boolean;
  };
}

/**
 * Performs a health check on the E2B sandbox environment
 */
export async function checkSandboxHealth(): Promise<SandboxHealthCheck> {
  try {
    // Check if API key is available
    if (!process.env.E2B_API_KEY) {
      return {
        isHealthy: false,
        error: "E2B_API_KEY environment variable is not set",
        details: {
          canCreateSandbox: false,
          templateExists: false,
          apiKeyValid: false,
        },
      };
    }

    // Try to create a sandbox to test connectivity and template availability
    let sandbox: Sandbox | null = null;
    try {
      // Try with template name first
      sandbox = await Sandbox.create("vibe-nextjs-nandu", { timeoutMs: 30000 });
    } catch {
      try {
        // Fallback to template ID
        sandbox = await Sandbox.create("d622vkz8p86647vfbfsu", { timeoutMs: 30000 });
      } catch (idError) {
        return {
          isHealthy: false,
          error: `Failed to create sandbox with both template name and ID: ${idError}`,
          details: {
            canCreateSandbox: false,
            templateExists: false,
            apiKeyValid: true, // API key works but template doesn't exist
          },
        };
      }
    }

    // If we got here, sandbox creation was successful
    // Clean up the test sandbox
    if (sandbox) {
      try {
        await sandbox.kill();
      } catch (closeError) {
        console.warn("Failed to close test sandbox:", closeError);
      }
    }

    return {
      isHealthy: true,
      details: {
        canCreateSandbox: true,
        templateExists: true,
        apiKeyValid: true,
      },
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    let apiKeyValid = true;
    if (errorMessage.includes('unauthorized') || errorMessage.includes('401')) {
      apiKeyValid = false;
    }

    return {
      isHealthy: false,
      error: errorMessage,
      details: {
        canCreateSandbox: false,
        templateExists: false,
        apiKeyValid,
      },
    };
  }
}

/**
 * Validates a sandbox ID format
 */
export function isValidSandboxId(sandboxId: string): boolean {
  // E2B sandbox IDs are typically alphanumeric strings of specific length
  return /^[a-z0-9]{20,30}$/i.test(sandboxId);
}

/**
 * Validates a sandbox URL format
 */
export function isValidSandboxUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.endsWith('.e2b.dev') && urlObj.protocol === 'https:';
  } catch {
    return false;
  }
}
