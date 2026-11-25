-- CreateTable
CREATE TABLE "documents" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "discipline" TEXT NOT NULL DEFAULT 'GENERAL',
    "originalFilename" TEXT NOT NULL,
    "fileFormat" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileSizeBytes" BIGINT NOT NULL,
    "storageObjectKey" TEXT NOT NULL,
    "checksumSha256" TEXT NOT NULL,
    "uploadStatus" TEXT NOT NULL DEFAULT 'READY',
    "securityScanStatus" TEXT NOT NULL DEFAULT 'CLEAN',
    "uploadedById" TEXT NOT NULL,
    "archivedAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_upload_sessions" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "documentId" TEXT,
    "declaredFilename" TEXT NOT NULL,
    "declaredMimeType" TEXT NOT NULL,
    "declaredSizeBytes" BIGINT NOT NULL,
    "category" TEXT NOT NULL,
    "discipline" TEXT NOT NULL DEFAULT 'GENERAL',
    "storageKey" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "checksumSha256" TEXT,
    "actualSizeBytes" BIGINT,
    "metadata" JSONB,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "document_upload_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_spatial_links" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "spatialNodeId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "document_spatial_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_work_package_links" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "workPackageId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "document_work_package_links_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "documents_organizationId_idx" ON "documents"("organizationId");

-- CreateIndex
CREATE INDEX "documents_projectId_idx" ON "documents"("projectId");

-- CreateIndex
CREATE INDEX "documents_category_idx" ON "documents"("category");

-- CreateIndex
CREATE INDEX "documents_discipline_idx" ON "documents"("discipline");

-- CreateIndex
CREATE INDEX "documents_fileFormat_idx" ON "documents"("fileFormat");

-- CreateIndex
CREATE INDEX "documents_uploadStatus_idx" ON "documents"("uploadStatus");

-- CreateIndex
CREATE INDEX "documents_securityScanStatus_idx" ON "documents"("securityScanStatus");

-- CreateIndex
CREATE INDEX "documents_uploadedById_idx" ON "documents"("uploadedById");

-- CreateIndex
CREATE INDEX "documents_createdAt_idx" ON "documents"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "documents_projectId_reference_key" ON "documents"("projectId", "reference");

-- CreateIndex
CREATE INDEX "document_upload_sessions_organizationId_idx" ON "document_upload_sessions"("organizationId");

-- CreateIndex
CREATE INDEX "document_upload_sessions_projectId_idx" ON "document_upload_sessions"("projectId");

-- CreateIndex
CREATE INDEX "document_upload_sessions_userId_idx" ON "document_upload_sessions"("userId");

-- CreateIndex
CREATE INDEX "document_upload_sessions_status_idx" ON "document_upload_sessions"("status");

-- CreateIndex
CREATE INDEX "document_upload_sessions_expiresAt_idx" ON "document_upload_sessions"("expiresAt");

-- CreateIndex
CREATE INDEX "document_spatial_links_documentId_idx" ON "document_spatial_links"("documentId");

-- CreateIndex
CREATE INDEX "document_spatial_links_spatialNodeId_idx" ON "document_spatial_links"("spatialNodeId");

-- CreateIndex
CREATE UNIQUE INDEX "document_spatial_links_documentId_spatialNodeId_key" ON "document_spatial_links"("documentId", "spatialNodeId");

-- CreateIndex
CREATE INDEX "document_work_package_links_documentId_idx" ON "document_work_package_links"("documentId");

-- CreateIndex
CREATE INDEX "document_work_package_links_workPackageId_idx" ON "document_work_package_links"("workPackageId");

-- CreateIndex
CREATE UNIQUE INDEX "document_work_package_links_documentId_workPackageId_key" ON "document_work_package_links"("documentId", "workPackageId");

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_upload_sessions" ADD CONSTRAINT "document_upload_sessions_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_upload_sessions" ADD CONSTRAINT "document_upload_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_upload_sessions" ADD CONSTRAINT "document_upload_sessions_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_spatial_links" ADD CONSTRAINT "document_spatial_links_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_spatial_links" ADD CONSTRAINT "document_spatial_links_spatialNodeId_fkey" FOREIGN KEY ("spatialNodeId") REFERENCES "spatial_nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_work_package_links" ADD CONSTRAINT "document_work_package_links_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_work_package_links" ADD CONSTRAINT "document_work_package_links_workPackageId_fkey" FOREIGN KEY ("workPackageId") REFERENCES "work_packages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
