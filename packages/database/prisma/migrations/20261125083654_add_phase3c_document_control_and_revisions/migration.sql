-- AlterTable
ALTER TABLE "documents" ADD COLUMN     "currentPublishedVersionId" TEXT,
ADD COLUMN     "currentRevisionCode" TEXT DEFAULT '01',
ADD COLUMN     "latestVersionId" TEXT;

-- CreateTable
CREATE TABLE "document_versions" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "revisionCode" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "originalFilename" TEXT NOT NULL,
    "fileFormat" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileSizeBytes" BIGINT NOT NULL,
    "storageObjectKey" TEXT NOT NULL,
    "checksumSha256" TEXT NOT NULL,
    "uploadStatus" TEXT NOT NULL DEFAULT 'READY',
    "securityScanStatus" TEXT NOT NULL DEFAULT 'NOT_SCANNED',
    "workflowStatus" TEXT NOT NULL DEFAULT 'DRAFT',
    "uploadedById" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submittedAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "supersededAt" TIMESTAMP(3),
    "archivedAt" TIMESTAMP(3),

    CONSTRAINT "document_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "drawing_metadata" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "drawingNumber" TEXT NOT NULL,
    "drawingTitle" TEXT NOT NULL,
    "discipline" TEXT NOT NULL DEFAULT 'ARCHITECTURE',
    "drawingType" TEXT NOT NULL DEFAULT 'FLOOR_PLAN',
    "originator" TEXT,
    "sheetNumber" TEXT,
    "sheetSize" TEXT NOT NULL DEFAULT 'A1',
    "declaredScale" TEXT,
    "issuePurpose" TEXT NOT NULL DEFAULT 'FOR_INFORMATION',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "drawing_metadata_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_reviews" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "versionId" TEXT NOT NULL,
    "assignedReviewerId" TEXT NOT NULL,
    "requestedById" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "dueAt" TIMESTAMP(3),
    "comments" TEXT,
    "decisionNote" TEXT,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "document_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_transmittals" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "senderUserId" TEXT NOT NULL,
    "authorizedRecipients" JSONB NOT NULL,
    "issuePurpose" TEXT NOT NULL DEFAULT 'FOR_INFORMATION',
    "issueDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "notes" TEXT,
    "createdById" TEXT NOT NULL,
    "issuedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "document_transmittals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transmittal_items" (
    "id" TEXT NOT NULL,
    "transmittalId" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "documentVersionId" TEXT NOT NULL,
    "drawingNumber" TEXT,
    "documentReference" TEXT NOT NULL,
    "revisionCode" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "fileFormat" TEXT NOT NULL,
    "sheetSize" TEXT,
    "declaredScale" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transmittal_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_version_spatial_links" (
    "id" TEXT NOT NULL,
    "versionId" TEXT NOT NULL,
    "spatialNodeId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "document_version_spatial_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_version_work_package_links" (
    "id" TEXT NOT NULL,
    "versionId" TEXT NOT NULL,
    "workPackageId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "document_version_work_package_links_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "document_versions_organizationId_idx" ON "document_versions"("organizationId");

-- CreateIndex
CREATE INDEX "document_versions_projectId_idx" ON "document_versions"("projectId");

-- CreateIndex
CREATE INDEX "document_versions_documentId_idx" ON "document_versions"("documentId");

-- CreateIndex
CREATE INDEX "document_versions_workflowStatus_idx" ON "document_versions"("workflowStatus");

-- CreateIndex
CREATE INDEX "document_versions_checksumSha256_idx" ON "document_versions"("checksumSha256");

-- CreateIndex
CREATE INDEX "document_versions_uploadedById_idx" ON "document_versions"("uploadedById");

-- CreateIndex
CREATE INDEX "document_versions_createdAt_idx" ON "document_versions"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "document_versions_documentId_versionNumber_key" ON "document_versions"("documentId", "versionNumber");

-- CreateIndex
CREATE UNIQUE INDEX "document_versions_documentId_revisionCode_key" ON "document_versions"("documentId", "revisionCode");

-- CreateIndex
CREATE UNIQUE INDEX "drawing_metadata_documentId_key" ON "drawing_metadata"("documentId");

-- CreateIndex
CREATE INDEX "drawing_metadata_organizationId_idx" ON "drawing_metadata"("organizationId");

-- CreateIndex
CREATE INDEX "drawing_metadata_projectId_idx" ON "drawing_metadata"("projectId");

-- CreateIndex
CREATE INDEX "drawing_metadata_discipline_idx" ON "drawing_metadata"("discipline");

-- CreateIndex
CREATE INDEX "drawing_metadata_drawingType_idx" ON "drawing_metadata"("drawingType");

-- CreateIndex
CREATE INDEX "drawing_metadata_status_idx" ON "drawing_metadata"("status");

-- CreateIndex
CREATE UNIQUE INDEX "drawing_metadata_projectId_drawingNumber_key" ON "drawing_metadata"("projectId", "drawingNumber");

-- CreateIndex
CREATE INDEX "document_reviews_organizationId_idx" ON "document_reviews"("organizationId");

-- CreateIndex
CREATE INDEX "document_reviews_projectId_idx" ON "document_reviews"("projectId");

-- CreateIndex
CREATE INDEX "document_reviews_documentId_idx" ON "document_reviews"("documentId");

-- CreateIndex
CREATE INDEX "document_reviews_versionId_idx" ON "document_reviews"("versionId");

-- CreateIndex
CREATE INDEX "document_reviews_assignedReviewerId_idx" ON "document_reviews"("assignedReviewerId");

-- CreateIndex
CREATE INDEX "document_reviews_status_idx" ON "document_reviews"("status");

-- CreateIndex
CREATE INDEX "document_transmittals_organizationId_idx" ON "document_transmittals"("organizationId");

-- CreateIndex
CREATE INDEX "document_transmittals_projectId_idx" ON "document_transmittals"("projectId");

-- CreateIndex
CREATE INDEX "document_transmittals_status_idx" ON "document_transmittals"("status");

-- CreateIndex
CREATE INDEX "document_transmittals_issueDate_idx" ON "document_transmittals"("issueDate");

-- CreateIndex
CREATE UNIQUE INDEX "document_transmittals_projectId_reference_key" ON "document_transmittals"("projectId", "reference");

-- CreateIndex
CREATE INDEX "transmittal_items_transmittalId_idx" ON "transmittal_items"("transmittalId");

-- CreateIndex
CREATE INDEX "transmittal_items_documentId_idx" ON "transmittal_items"("documentId");

-- CreateIndex
CREATE INDEX "transmittal_items_documentVersionId_idx" ON "transmittal_items"("documentVersionId");

-- CreateIndex
CREATE UNIQUE INDEX "transmittal_items_transmittalId_documentVersionId_key" ON "transmittal_items"("transmittalId", "documentVersionId");

-- CreateIndex
CREATE INDEX "document_version_spatial_links_versionId_idx" ON "document_version_spatial_links"("versionId");

-- CreateIndex
CREATE INDEX "document_version_spatial_links_spatialNodeId_idx" ON "document_version_spatial_links"("spatialNodeId");

-- CreateIndex
CREATE UNIQUE INDEX "document_version_spatial_links_versionId_spatialNodeId_key" ON "document_version_spatial_links"("versionId", "spatialNodeId");

-- CreateIndex
CREATE INDEX "document_version_work_package_links_versionId_idx" ON "document_version_work_package_links"("versionId");

-- CreateIndex
CREATE INDEX "document_version_work_package_links_workPackageId_idx" ON "document_version_work_package_links"("workPackageId");

-- CreateIndex
CREATE UNIQUE INDEX "document_version_work_package_links_versionId_workPackageId_key" ON "document_version_work_package_links"("versionId", "workPackageId");

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_latestVersionId_fkey" FOREIGN KEY ("latestVersionId") REFERENCES "document_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_currentPublishedVersionId_fkey" FOREIGN KEY ("currentPublishedVersionId") REFERENCES "document_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_versions" ADD CONSTRAINT "document_versions_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_versions" ADD CONSTRAINT "document_versions_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_versions" ADD CONSTRAINT "document_versions_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "drawing_metadata" ADD CONSTRAINT "drawing_metadata_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "drawing_metadata" ADD CONSTRAINT "drawing_metadata_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_reviews" ADD CONSTRAINT "document_reviews_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_reviews" ADD CONSTRAINT "document_reviews_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "document_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_reviews" ADD CONSTRAINT "document_reviews_assignedReviewerId_fkey" FOREIGN KEY ("assignedReviewerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_reviews" ADD CONSTRAINT "document_reviews_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_reviews" ADD CONSTRAINT "document_reviews_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_transmittals" ADD CONSTRAINT "document_transmittals_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_transmittals" ADD CONSTRAINT "document_transmittals_senderUserId_fkey" FOREIGN KEY ("senderUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_transmittals" ADD CONSTRAINT "document_transmittals_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transmittal_items" ADD CONSTRAINT "transmittal_items_transmittalId_fkey" FOREIGN KEY ("transmittalId") REFERENCES "document_transmittals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transmittal_items" ADD CONSTRAINT "transmittal_items_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transmittal_items" ADD CONSTRAINT "transmittal_items_documentVersionId_fkey" FOREIGN KEY ("documentVersionId") REFERENCES "document_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_version_spatial_links" ADD CONSTRAINT "document_version_spatial_links_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "document_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_version_spatial_links" ADD CONSTRAINT "document_version_spatial_links_spatialNodeId_fkey" FOREIGN KEY ("spatialNodeId") REFERENCES "spatial_nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_version_work_package_links" ADD CONSTRAINT "document_version_work_package_links_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "document_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_version_work_package_links" ADD CONSTRAINT "document_version_work_package_links_workPackageId_fkey" FOREIGN KEY ("workPackageId") REFERENCES "work_packages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
