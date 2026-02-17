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

export type CatalogItemType =
  | "gpu"
  | "cpu"
  | "ram_kit"
  | "power_supply"
  | "case"
  | "motherboard"
  | "compact_ai_system"
  | "storage_drive"
  | "cpu_cooler";

export type PublicCatalogItemDetail = {
  itemType: CatalogItemType;
  itemId: number;
  name: string;
  subtitle: string;
  preorderPriceEur: number;
  marketAvgEur: number | null;
  basePriceEur: number;
  checkoutItemType: CatalogItemType;
  specs: Array<{ label: string; value: string }>;
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

export function getCatalogItemDetailView(itemType: CatalogItemType, itemId: number): PublicCatalogItemDetail | null {
  const catalog = getHomeCatalogView();

  if (itemType === "gpu") {
    const item = catalog.gpus.find((entry) => entry.id === itemId);
    if (!item) return null;
    return {
      itemType,
      itemId,
      name: item.name,
      subtitle: `${item.brand} graphics card`,
      preorderPriceEur: item.preorderPriceEur,
      marketAvgEur: item.marketAvgEur,
      basePriceEur: item.priceEur,
      checkoutItemType: itemType,
      specs: [
        { label: "Brand", value: item.brand },
        { label: "VRAM", value: `${item.vramGb}GB` },
        { label: "Architecture", value: item.architecture },
        { label: "AI Score", value: String(item.aiScore) },
      ],
    };
  }

  if (itemType === "cpu") {
    const item = catalog.cpus.find((entry) => entry.id === itemId);
    if (!item) return null;
    return {
      itemType,
      itemId,
      name: item.name,
      subtitle: `${item.brand} processor`,
      preorderPriceEur: item.preorderPriceEur,
      marketAvgEur: item.marketAvgEur,
      basePriceEur: item.priceEur,
      checkoutItemType: itemType,
      specs: [
        { label: "Brand", value: item.brand },
        { label: "Cores / Threads", value: `${item.cores} / ${item.threads}` },
        { label: "Socket", value: item.socket },
        { label: "AI Score", value: String(item.aiScore) },
      ],
    };
  }

  if (itemType === "ram_kit") {
    const item = catalog.ramKits.find((entry) => entry.id === itemId);
    if (!item) return null;
    return {
      itemType,
      itemId,
      name: item.name,
      subtitle: `${item.brand} memory kit`,
      preorderPriceEur: item.preorderPriceEur,
      marketAvgEur: item.marketAvgEur,
      basePriceEur: item.priceEur,
      checkoutItemType: itemType,
      specs: [
        { label: "Capacity", value: `${item.capacityGb}GB (${item.modules})` },
        { label: "Generation", value: item.ddrGen },
        { label: "Speed", value: `${item.speedMtS} MT/s` },
        { label: "Latency", value: item.casLatency },
        { label: "Profiles", value: item.profileSupport },
      ],
    };
  }

  if (itemType === "power_supply") {
    const item = catalog.powerSupplies.find((entry) => entry.id === itemId);
    if (!item) return null;
    return {
      itemType,
      itemId,
      name: item.name,
      subtitle: `${item.brand} power supply`,
      preorderPriceEur: item.preorderPriceEur,
      marketAvgEur: item.marketAvgEur,
      basePriceEur: item.priceEur,
      checkoutItemType: itemType,
      specs: [
        { label: "Wattage", value: `${item.wattage}W` },
        { label: "Efficiency", value: item.efficiencyRating },
        { label: "ATX Standard", value: item.atxStandard },
        { label: "Modularity", value: item.modularity },
        { label: "PCIe5 / 12V-2x6", value: item.pcie5Support ? "Supported" : "No" },
      ],
    };
  }

  if (itemType === "case") {
    const item = catalog.cases.find((entry) => entry.id === itemId);
    if (!item) return null;
    return {
      itemType,
      itemId,
      name: item.name,
      subtitle: `${item.brand} PC case`,
      preorderPriceEur: item.preorderPriceEur,
      marketAvgEur: item.marketAvgEur,
      basePriceEur: item.priceEur,
      checkoutItemType: itemType,
      specs: [
        { label: "Form Factor", value: item.formFactor },
        { label: "Max GPU Length", value: `${item.maxGpuMm}mm` },
        { label: "Radiator Support", value: item.radiatorSupport },
        { label: "Included Fans", value: item.includedFans },
      ],
    };
  }

  if (itemType === "motherboard") {
    const item = catalog.motherboards.find((entry) => entry.id === itemId);
    if (!item) return null;
    return {
      itemType,
      itemId,
      name: item.name,
      subtitle: `${item.brand} motherboard`,
      preorderPriceEur: item.preorderPriceEur,
      marketAvgEur: item.marketAvgEur,
      basePriceEur: item.priceEur,
      checkoutItemType: itemType,
      specs: [
        { label: "Socket", value: item.socket },
        { label: "Chipset", value: item.chipset },
        { label: "Memory Support", value: item.memorySupport },
        { label: "Max Memory", value: `${item.maxMemoryGb}GB` },
        { label: "PCIe Gen5", value: item.pcieGen5Support ? "Yes" : "No" },
      ],
    };
  }

  if (itemType === "compact_ai_system") {
    const item = catalog.compactAiSystems.find((entry) => entry.id === itemId);
    if (!item) return null;
    return {
      itemType,
      itemId,
      name: item.name,
      subtitle: `${item.vendor} compact AI system`,
      preorderPriceEur: item.preorderPriceEur,
      marketAvgEur: item.marketAvgEur,
      basePriceEur: item.priceEur,
      checkoutItemType: itemType,
      specs: [
        { label: "Chip", value: item.chip },
        { label: "Memory", value: `${item.memoryGb}GB unified` },
        { label: "Storage", value: `${item.storageGb}GB SSD` },
        { label: "GPU Class", value: item.gpuClass },
        { label: "Installed Software", value: item.installedSoftware },
        { label: "Stock", value: item.inStock ? "In Stock" : "Out of Stock" },
      ],
    };
  }

  if (itemType === "storage_drive") {
    const item = catalog.storageDrives.find((entry) => entry.id === itemId);
    if (!item) return null;
    return {
      itemType,
      itemId,
      name: item.name,
      subtitle: `${item.brand} storage drive`,
      preorderPriceEur: item.preorderPriceEur,
      marketAvgEur: item.marketAvgEur,
      basePriceEur: item.priceEur,
      checkoutItemType: itemType,
      specs: [
        { label: "Type", value: item.driveType },
        { label: "Interface", value: item.interface },
        { label: "Capacity", value: `${item.capacityGb}GB` },
        { label: "Seq Read", value: `${item.seqReadMbS} MB/s` },
        { label: "Endurance", value: item.enduranceTbw === 0 ? "n/a" : `${item.enduranceTbw} TBW` },
      ],
    };
  }

  const item = catalog.cpuCoolers.find((entry) => entry.id === itemId);
  if (!item) return null;
  return {
    itemType: "cpu_cooler",
    itemId,
    name: item.name,
    subtitle: `${item.brand} CPU cooler`,
    preorderPriceEur: item.preorderPriceEur,
    marketAvgEur: item.marketAvgEur,
    basePriceEur: item.priceEur,
    checkoutItemType: "cpu_cooler",
    specs: [
      { label: "Type", value: item.coolerType },
      { label: "Height / Radiator", value: `${item.radiatorOrHeightMm}mm` },
      { label: "Socket Support", value: item.socketSupport },
      { label: "Max TDP", value: `${item.maxTdpW}W` },
      { label: "Noise", value: item.noiseDb },
    ],
  };
}
