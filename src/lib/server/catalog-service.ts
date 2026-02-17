import "server-only";
import {
  getProfileBuildById,
  listCases,
  listCompactAiSystems,
  listCpuCoolers,
  listCpus,
  listEstonianPriceChecks,
  listGpus,
  listMotherboards,
  listPowerSupplies,
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
  preorderPriceEur: number;
  marketAvgEur: number | null;
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
  preorderPriceEur: number;
  marketAvgEur: number | null;
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
  preorderPriceEur: number;
  marketAvgEur: number | null;
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
  preorderPriceEur: number;
  marketAvgEur: number | null;
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
  preorderPriceEur: number;
  marketAvgEur: number | null;
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
  preorderPriceEur: number;
  marketAvgEur: number | null;
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
  preorderPriceEur: number;
  marketAvgEur: number | null;
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
  preorderPriceEur: number;
  marketAvgEur: number | null;
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
  preorderPriceEur: number;
  marketAvgEur: number | null;
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
  const priceChecks = listEstonianPriceChecks();
  const priceLookup = new Map<string, { final: number; avg: number }>();
  priceChecks.forEach((row) => {
    priceLookup.set(`${row.category}:${row.item_id}`, { final: row.final_price_eur, avg: row.market_avg_eur });
  });

  const resolvePreorderPrice = (category: string, itemId: number, basePrice: number) => {
    const fromMarket = priceLookup.get(`${category}:${itemId}`);
    if (fromMarket) {
      return {
        preorderPriceEur: Math.round(fromMarket.final),
        marketAvgEur: Number(fromMarket.avg.toFixed(2)),
      };
    }
    return {
      preorderPriceEur: Math.round(basePrice * 1.15),
      marketAvgEur: null,
    };
  };

  const gpus: PublicGpu[] = listGpus().map((gpu) => ({
    ...resolvePreorderPrice("gpu", gpu.id, gpu.price_eur),
    id: gpu.id,
    name: gpu.name,
    brand: gpu.brand,
    vramGb: gpu.vram_gb,
    architecture: gpu.architecture,
    aiScore: gpu.ai_score,
    priceEur: gpu.price_eur,
  }));

  const cpus: PublicCpu[] = listCpus().map((cpu) => ({
    ...resolvePreorderPrice("cpu", cpu.id, cpu.price_eur),
    id: cpu.id,
    name: cpu.name,
    brand: cpu.brand,
    cores: cpu.cores,
    threads: cpu.threads,
    socket: cpu.socket,
    aiScore: cpu.ai_score,
    priceEur: cpu.price_eur,
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
    ...resolvePreorderPrice("ram_kit", ramKit.id, ramKit.price_eur),
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
    ...resolvePreorderPrice("power_supply", psu.id, psu.price_eur),
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
    ...resolvePreorderPrice("case", pcCase.id, pcCase.price_eur),
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
    ...resolvePreorderPrice("motherboard", motherboard.id, motherboard.price_eur),
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
    ...resolvePreorderPrice("compact_ai_system", system.id, system.price_eur),
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
    ...resolvePreorderPrice("storage_drive", drive.id, drive.price_eur),
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
    ...resolvePreorderPrice("cpu_cooler", cooler.id, cooler.price_eur),
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
