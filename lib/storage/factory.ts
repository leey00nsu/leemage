/**
 * Storage Factory
 * 
 * Creates and manages storage adapter instances based on provider type.
 */

import { StorageAdapter } from "./adapter";
import { StorageProvider } from "./types";

// Lazy imports to avoid circular dependencies
let OCIStorageAdapter: new () => StorageAdapter;
let CloudflareR2Adapter: new () => StorageAdapter;

async function loadAdapters() {
  if (!OCIStorageAdapter) {
    const ociModule = await import("./adapters/oci");
    OCIStorageAdapter = ociModule.OCIStorageAdapter;
  }
  if (!CloudflareR2Adapter) {
    const r2Module = await import("./adapters/r2");
    CloudflareR2Adapter = r2Module.CloudflareR2Adapter;
  }
}

export class StorageFactory {
  private static adapters: Map<StorageProvider, StorageAdapter> = new Map();
  private static initialized = false;

  private static async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await loadAdapters();
      this.initialized = true;
    }
  }

  /**
   * Gets the storage adapter for the specified provider.
   * Creates a new instance if one doesn't exist.
   */
  static async getAdapter(provider: StorageProvider): Promise<StorageAdapter> {
    await this.ensureInitialized();

    if (!this.adapters.has(provider)) {
      this.adapters.set(provider, this.createAdapter(provider));
    }
    return this.adapters.get(provider)!;
  }

  /**
   * Returns a list of storage providers that are properly configured.
   */
  static async getAvailableProviders(): Promise<StorageProvider[]> {
    await this.ensureInitialized();

    const available: StorageProvider[] = [];
    for (const provider of Object.values(StorageProvider)) {
      const adapter = await this.getAdapter(provider);
      if (adapter.isConfigured()) {
        available.push(provider);
      }
    }
    return available;
  }

  /**
   * Checks if a specific provider is configured and available.
   */
  static async isProviderAvailable(provider: StorageProvider): Promise<boolean> {
    const adapter = await this.getAdapter(provider);
    return adapter.isConfigured();
  }

  private static createAdapter(provider: StorageProvider): StorageAdapter {
    switch (provider) {
      case StorageProvider.OCI:
        return new OCIStorageAdapter();
      case StorageProvider.R2:
        return new CloudflareR2Adapter();
      default:
        throw new Error(`Unknown storage provider: ${provider}`);
    }
  }

  /**
   * Clears cached adapters (useful for testing).
   */
  static clearCache(): void {
    this.adapters.clear();
  }
}
