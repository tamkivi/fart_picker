import "server-only";
import { getProfileBuildById, listCpus, listGpus, listPrebuilts, listProfileBuilds } from "@/lib/catalog-db";

export type PublicGpu = {
  id: number;
  name: string;
  brand: string;
  vramGb: number;
  architecture: string;
  aiScore: number;
  priceEur: number;
};

export type PublicCpu = {
  id: number;
  name: string;
  brand: string;
  cores: number;
  threads: number;
  socket: string;
  aiScore: number;
  priceEur: number;
};

export type PublicPrebuilt = {
  id: number;
  name: string;
  vendor: string;
  description: string;
  ramGb: number;
  storageGb: number;
  llmMaxModelSize: string;
  inStock: boolean;
  cpuName: string;
  gpuName: string;
  priceEur: number;
};

export type PublicProfileBuild = {
  id: number;
  profileKey: string;
  profileLabel: string;
  buildName: string;
  targetModel: string;
  ramGb: number;
  storageGb: number;
  estimatedPriceEur: number;
  bestFor: string;
  estimatedTokensPerSec: string;
  estimatedSystemPowerW: number;
  recommendedPsuW: number;
  coolingProfile: string;
  notes: string;
  sourceRefs: string;
  cpuName: string;
  gpuName: string;
};

export function getHomeCatalogView() {
  const gpus: PublicGpu[] = listGpus().map((gpu) => ({
    id: gpu.id,
    name: gpu.name,
    brand: gpu.brand,
    vramGb: gpu.vram_gb,
    architecture: gpu.architecture,
    aiScore: gpu.ai_score,
    priceEur: gpu.price_eur,
  }));

  const cpus: PublicCpu[] = listCpus().map((cpu) => ({
    id: cpu.id,
    name: cpu.name,
    brand: cpu.brand,
    cores: cpu.cores,
    threads: cpu.threads,
    socket: cpu.socket,
    aiScore: cpu.ai_score,
    priceEur: cpu.price_eur,
  }));

  const prebuilts: PublicPrebuilt[] = listPrebuilts().map((prebuilt) => ({
    id: prebuilt.id,
    name: prebuilt.name,
    vendor: prebuilt.vendor,
    description: prebuilt.description,
    ramGb: prebuilt.ram_gb,
    storageGb: prebuilt.storage_gb,
    llmMaxModelSize: prebuilt.llm_max_model_size,
    inStock: prebuilt.in_stock === 1,
    cpuName: prebuilt.cpu_name,
    gpuName: prebuilt.gpu_name,
    priceEur: prebuilt.price_eur,
  }));

  const profileBuilds: PublicProfileBuild[] = listProfileBuilds().map((build) => ({
    id: build.id,
    profileKey: build.profile_key,
    profileLabel: build.profile_label,
    buildName: build.build_name,
    targetModel: build.target_model,
    ramGb: build.ram_gb,
    storageGb: build.storage_gb,
    estimatedPriceEur: build.estimated_price_eur,
    bestFor: build.best_for,
    estimatedTokensPerSec: build.estimated_tokens_per_sec,
    estimatedSystemPowerW: build.estimated_system_power_w,
    recommendedPsuW: build.recommended_psu_w,
    coolingProfile: build.cooling_profile,
    notes: build.notes,
    sourceRefs: build.source_refs,
    cpuName: build.cpu_name,
    gpuName: build.gpu_name,
  }));

  return { gpus, cpus, prebuilts, profileBuilds };
}

export function getBuildDetailView(buildId: number): PublicProfileBuild | null {
  const build = getProfileBuildById(buildId);
  if (!build) {
    return null;
  }

  return {
    id: build.id,
    profileKey: build.profile_key,
    profileLabel: build.profile_label,
    buildName: build.build_name,
    targetModel: build.target_model,
    ramGb: build.ram_gb,
    storageGb: build.storage_gb,
    estimatedPriceEur: build.estimated_price_eur,
    bestFor: build.best_for,
    estimatedTokensPerSec: build.estimated_tokens_per_sec,
    estimatedSystemPowerW: build.estimated_system_power_w,
    recommendedPsuW: build.recommended_psu_w,
    coolingProfile: build.cooling_profile,
    notes: build.notes,
    sourceRefs: build.source_refs,
    cpuName: build.cpu_name,
    gpuName: build.gpu_name,
  };
}
