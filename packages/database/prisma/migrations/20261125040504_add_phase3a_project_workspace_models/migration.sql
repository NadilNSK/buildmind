-- AlterTable
ALTER TABLE "projects" ADD COLUMN     "actualCompletionDate" TIMESTAMP(3),
ADD COLUMN     "archivedAt" TIMESTAMP(3),
ADD COLUMN     "clientName" TEXT,
ADD COLUMN     "consultantName" TEXT,
ADD COLUMN     "contractorName" TEXT,
ADD COLUMN     "estimatedContractValue" DECIMAL(15,2),
ADD COLUMN     "expectedCompletionDate" TIMESTAMP(3),
ADD COLUMN     "location" TEXT,
ADD COLUMN     "measurementUnitSystem" TEXT NOT NULL DEFAULT 'METRIC',
ADD COLUMN     "projectManager" TEXT,
ADD COLUMN     "projectType" TEXT NOT NULL DEFAULT 'COMMERCIAL',
ADD COLUMN     "startDate" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "spatial_nodes" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "parentNodeId" TEXT,
    "nodeType" TEXT NOT NULL DEFAULT 'BUILDING',
    "name" TEXT NOT NULL,
    "code" TEXT,
    "description" TEXT,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "spatial_nodes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "work_packages" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "parentPackageId" TEXT,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "work_packages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "spatial_nodes_projectId_idx" ON "spatial_nodes"("projectId");

-- CreateIndex
CREATE INDEX "spatial_nodes_parentNodeId_idx" ON "spatial_nodes"("parentNodeId");

-- CreateIndex
CREATE INDEX "spatial_nodes_nodeType_idx" ON "spatial_nodes"("nodeType");

-- CreateIndex
CREATE INDEX "spatial_nodes_status_idx" ON "spatial_nodes"("status");

-- CreateIndex
CREATE INDEX "spatial_nodes_displayOrder_idx" ON "spatial_nodes"("displayOrder");

-- CreateIndex
CREATE INDEX "work_packages_projectId_idx" ON "work_packages"("projectId");

-- CreateIndex
CREATE INDEX "work_packages_parentPackageId_idx" ON "work_packages"("parentPackageId");

-- CreateIndex
CREATE INDEX "work_packages_code_idx" ON "work_packages"("code");

-- CreateIndex
CREATE INDEX "work_packages_status_idx" ON "work_packages"("status");

-- CreateIndex
CREATE INDEX "work_packages_displayOrder_idx" ON "work_packages"("displayOrder");

-- CreateIndex
CREATE UNIQUE INDEX "work_packages_projectId_code_key" ON "work_packages"("projectId", "code");

-- CreateIndex
CREATE INDEX "projects_projectType_idx" ON "projects"("projectType");

-- AddForeignKey
ALTER TABLE "spatial_nodes" ADD CONSTRAINT "spatial_nodes_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "spatial_nodes" ADD CONSTRAINT "spatial_nodes_parentNodeId_fkey" FOREIGN KEY ("parentNodeId") REFERENCES "spatial_nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_packages" ADD CONSTRAINT "work_packages_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_packages" ADD CONSTRAINT "work_packages_parentPackageId_fkey" FOREIGN KEY ("parentPackageId") REFERENCES "work_packages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
