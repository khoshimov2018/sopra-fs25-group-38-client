import { isProduction } from "@/utils/environment";
/**
 * Returns the API base URL based on the current environment.
 * In production it retrieves the URL from NEXT_PUBLIC_PROD_API_URL (or falls back to a hardcoded url).
 * In development, it returns "http://localhost:8080".
 */
export function getApiDomain(): string {
  const prodUrl = process.env.NEXT_PUBLIC_PROD_API_URL ||
   "https://sopra-fs25-khoshimov-r-server.oa.r.appspot.com";// Production URL
  
  // For local development, we need to ensure the port is correct
  const devUrl = "http://localhost:8080";
  
  // Check if we're running in a browser and if it's development mode
  if (typeof window !== 'undefined' && !isProduction()) {
    console.log(`Using development API URL: ${devUrl}`);
  }
  
  return isProduction() ? prodUrl : devUrl;
}
