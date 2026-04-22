import {
  defaultBackupDirectory,
  formatBackupCreatedAt,
  formatBackupSize,
  listBackupFiles,
  readBackupSettings,
  resolveDatabaseFilePath,
} from "@/lib/backup-storage";
import { prisma } from "@/lib/prisma";

export async function getBaseInfoOverviewData() {
  const [
    storeRows,
    staffRows,
    carrierRows,
    salesAgencyRows,
    colorRows,
    inventoryColorRows,
    deviceModelRows,
    inventoryDeviceModelRows,
    ratePlanRows,
    addOnServiceRows,
    backupSettings,
  ] = await Promise.all([
    prisma.store.findMany({
      orderBy: [{ isDefault: "desc" }, { isActive: "desc" }, { name: "asc" }],
    }),
    prisma.user.findMany({
      where: {
        role: "STAFF",
      },
      orderBy: [{ isActive: "desc" }, { displayName: "asc" }, { username: "asc" }],
      include: {
        _count: {
          select: {
            staffCommissionPolicies: true,
          },
        },
      },
    }),
    prisma.carrier.findMany({
      orderBy: [{ isActive: "desc" }, { name: "asc" }],
      include: {
        _count: {
          select: {
            ratePlans: true,
            services: true,
          },
        },
      },
    }),
    prisma.salesAgency.findMany({
      orderBy: [{ isActive: "desc" }, { name: "asc" }],
      include: {
        _count: {
          select: {
            sales: true,
          },
        },
      },
    }),
    prisma.inventoryColorOption.findMany({
      orderBy: [{ isActive: "desc" }, { name: "asc" }],
    }),
    prisma.inventoryItem.findMany({
      select: {
        color: true,
      },
    }),
    prisma.deviceModel.findMany({
      orderBy: [{ isActive: "desc" }, { manufacturer: "asc" }, { name: "asc" }],
    }),
    prisma.inventoryItem.findMany({
      select: {
        deviceModelId: true,
      },
    }),
    prisma.ratePlan.findMany({
      orderBy: [{ isActive: "desc" }, { name: "asc" }],
      include: {
        carrier: {
          select: {
            id: true,
            name: true,
            isActive: true,
          },
        },
      },
    }),
    prisma.addOnService.findMany({
      orderBy: [{ isActive: "desc" }, { name: "asc" }],
      include: {
        carrier: {
          select: {
            id: true,
            name: true,
            isActive: true,
          },
        },
      },
    }),
    readBackupSettings(),
  ]);

  const inventoryColorCountMap = inventoryColorRows.reduce<Record<string, number>>(
    (accumulator, inventoryItem) => {
      const normalizedColor = inventoryItem.color.trim();

      if (!normalizedColor) {
        return accumulator;
      }

      accumulator[normalizedColor] = (accumulator[normalizedColor] ?? 0) + 1;
      return accumulator;
    },
    {},
  );
  const inventoryDeviceModelCountMap = inventoryDeviceModelRows.reduce<Record<string, number>>(
    (accumulator, inventoryItem) => {
      accumulator[inventoryItem.deviceModelId] =
        (accumulator[inventoryItem.deviceModelId] ?? 0) + 1;

      return accumulator;
    },
    {},
  );

  const backupFiles = await listBackupFiles(backupSettings.backupDirectory);

  return {
    stores: storeRows.map((store) => ({
      id: store.id,
      code: store.code,
      name: store.name,
      region: store.region,
      isActive: store.isActive,
      isDefault: store.isDefault,
    })),
    staffs: staffRows.map((staff) => ({
      id: staff.id,
      username: staff.username,
      displayName: staff.displayName,
      isActive: staff.isActive,
      staffCommissionPolicyCount: staff._count.staffCommissionPolicies,
    })),
    carriers: carrierRows.map((carrier) => ({
      id: carrier.id,
      code: carrier.code,
      name: carrier.name,
      isActive: carrier.isActive,
      ratePlanCount: carrier._count.ratePlans,
      addOnServiceCount: carrier._count.services,
    })),
    salesAgencies: salesAgencyRows.map((salesAgency) => ({
      id: salesAgency.id,
      name: salesAgency.name,
      isActive: salesAgency.isActive,
      salesCount: salesAgency._count.sales,
    })),
    colors: colorRows.map((color) => ({
      id: color.id,
      name: color.name,
      isActive: color.isActive,
      inventoryCount: inventoryColorCountMap[color.name] ?? 0,
    })),
    deviceModels: deviceModelRows.map((deviceModel) => ({
      id: deviceModel.id,
      name: deviceModel.name,
      manufacturer: deviceModel.manufacturer,
      isActive: deviceModel.isActive,
      inventoryCount: inventoryDeviceModelCountMap[deviceModel.id] ?? 0,
    })),
    ratePlans: ratePlanRows.map((ratePlan) => ({
      id: ratePlan.id,
      carrierId: ratePlan.carrierId,
      carrierName: ratePlan.carrier.name,
      carrierActive: ratePlan.carrier.isActive,
      name: ratePlan.name,
      monthlyFee: ratePlan.monthlyFee,
      voiceCallMinutes: ratePlan.voiceCallMinutes,
      videoCallMinutes: ratePlan.videoCallMinutes,
      dataAllowanceGb: ratePlan.dataAllowanceGb,
      description: ratePlan.description,
      isActive: ratePlan.isActive,
    })),
    addOnServices: addOnServiceRows.map((service) => ({
      id: service.id,
      carrierId: service.carrierId,
      carrierName: service.carrier?.name ?? null,
      carrierActive: service.carrier?.isActive ?? null,
      name: service.name,
      monthlyFee: service.monthlyFee,
      description: service.description,
      isActive: service.isActive,
    })),
    backupState: {
      currentDirectory: backupSettings.backupDirectory,
      defaultDirectory: defaultBackupDirectory,
      sourceDatabasePath: resolveDatabaseFilePath(),
      backups: backupFiles.map((backup) => ({
        fileName: backup.fileName,
        createdAtLabel: formatBackupCreatedAt(backup.createdAt),
        sizeLabel: formatBackupSize(backup.sizeBytes),
      })),
    },
  };
}
