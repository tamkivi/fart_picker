import "server-only";
import {
  getProfileBuildById,
  listCases,
  listCompactAiSystems,
  listCpuCoolers,
  listCpus,
  listGpus,
  listMotherboards,
  listPowerSupplies,
  listPrebuilts,
  listProfileBuilds,
  listRamKits,
  listStorageDrives,
} from "@/lib/catalog-db";

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

export type PublicRamKit = {
  id: number;
  name: string;
  brand: string;
  capacityGb: number;
  modules: string;
  ddrGen: string;
  speedMtS: number;
  casLatency: string;
  profileSupport: string;
  priceEur: number;
};

export type PublicPowerSupply = {
  id: number;
  name: string;
  brand: string;
  wattage: number;
  efficiencyRating: string;
  atxStandard: string;
  modularity: string;
  pcie5Support: boolean;
  priceEur: number;
};

export type PublicCase = {
  id: number;
  name: string;
  brand: string;
  formFactor: string;
  maxGpuMm: number;
  radiatorSupport: string;
  includedFans: string;
  priceEur: number;
};

export type PublicMotherboard = {
  id: number;
  name: string;
  brand: string;
  socket: string;
  chipset: string;
  memorySupport: string;
  maxMemoryGb: number;
  pcieGen5Support: boolean;
  priceEur: number;
};

export type PublicCompactAiSystem = {
  id: number;
  name: string;
  vendor: string;
  chip: string;
  memoryGb: number;
  storageGb: number;
  gpuClass: string;
  installedSoftware: string;
  bestFor: string;
  inStock: boolean;
  priceEur: number;
};

export type PublicStorageDrive = {
  id: number;
  name: string;
  brand: string;
  driveType: string;
  interface: string;
  capacityGb: number;
  seqReadMbS: number;
  enduranceTbw: number;
  priceEur: number;
};

export type PublicCpuCooler = {
  id: number;
  name: string;
  brand: string;
  coolerType: string;
  radiatorOrHeightMm: number;
  socketSupport: string;
  maxTdpW: number;
  noiseDb: string;
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

  const ramKits: PublicRamKit[] = listRamKits().map((ramKit) => ({
    id: ramKit.id,
    name: ramKit.name,
    brand: ramKit.brand,
    capacityGb: ramKit.capacity_gb,
    modules: ramKit.modules,
    ddrGen: ramKit.ddr_gen,
    speedMtS: ramKit.speed_mt_s,
    casLatency: ramKit.cas_latency,
    profileSupport: ramKit.profile_support,
    priceEur: ramKit.price_eur,
  }));

  const powerSupplies: PublicPowerSupply[] = listPowerSupplies().map((psu) => ({
    id: psu.id,
    name: psu.name,
    brand: psu.brand,
    wattage: psu.wattage,
    efficiencyRating: psu.efficiency_rating,
    atxStandard: psu.atx_standard,
    modularity: psu.modularity,
    pcie5Support: psu.pcie_5_support === 1,
    priceEur: psu.price_eur,
  }));

  const cases: PublicCase[] = listCases().map((pcCase) => ({
    id: pcCase.id,
    name: pcCase.name,
    brand: pcCase.brand,
    formFactor: pcCase.form_factor,
    maxGpuMm: pcCase.max_gpu_mm,
    radiatorSupport: pcCase.radiator_support,
    includedFans: pcCase.included_fans,
    priceEur: pcCase.price_eur,
  }));

  const motherboards: PublicMotherboard[] = listMotherboards().map((motherboard) => ({
    id: motherboard.id,
    name: motherboard.name,
    brand: motherboard.brand,
    socket: motherboard.socket,
    chipset: motherboard.chipset,
    memorySupport: motherboard.memory_support,
    maxMemoryGb: motherboard.max_memory_gb,
    pcieGen5Support: motherboard.pcie_gen5_support === 1,
    priceEur: motherboard.price_eur,
  }));

  const compactAiSystems: PublicCompactAiSystem[] = listCompactAiSystems().map((system) => ({
    id: system.id,
    name: system.name,
    vendor: system.vendor,
    chip: system.chip,
    memoryGb: system.memory_gb,
    storageGb: system.storage_gb,
    gpuClass: system.gpu_class,
    installedSoftware: system.installed_software,
    bestFor: system.best_for,
    inStock: system.in_stock === 1,
    priceEur: system.price_eur,
  }));

  const storageDrives: PublicStorageDrive[] = listStorageDrives().map((drive) => ({
    id: drive.id,
    name: drive.name,
    brand: drive.brand,
    driveType: drive.drive_type,
    interface: drive.interface,
    capacityGb: drive.capacity_gb,
    seqReadMbS: drive.seq_read_mb_s,
    enduranceTbw: drive.endurance_tbw,
    priceEur: drive.price_eur,
  }));

  const cpuCoolers: PublicCpuCooler[] = listCpuCoolers().map((cooler) => ({
    id: cooler.id,
    name: cooler.name,
    brand: cooler.brand,
    coolerType: cooler.cooler_type,
    radiatorOrHeightMm: cooler.radiator_or_height_mm,
    socketSupport: cooler.socket_support,
    maxTdpW: cooler.max_tdp_w,
    noiseDb: cooler.noise_db,
    priceEur: cooler.price_eur,
  }));

  return {
    gpus,
    cpus,
    prebuilts,
    ramKits,
    powerSupplies,
    cases,
    motherboards,
    compactAiSystems,
    storageDrives,
    cpuCoolers,
    profileBuilds,
  };
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
