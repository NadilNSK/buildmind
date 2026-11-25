const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const prisma = new PrismaClient();

async function backfill() {
  console.log('--- Starting Phase 3C Document Migration Backfill ---');

  const unmigratedDocs = await prisma.document.findMany({
    where: {
      latestVersionId: null,
    },
    include: {
      spatialLinks: true,
      workPackageLinks: true,
    },
  });

  console.log(`Found ${unmigratedDocs.length} unmigrated document(s).`);

  for (const doc of unmigratedDocs) {
    const versionId = crypto.randomUUID();

    await prisma.$transaction(async (tx) => {
      // 1. Create initial DocumentVersion (v1, rev '01', PUBLISHED)
      await tx.documentVersion.create({
        data: {
          id: versionId,
          organizationId: doc.organizationId,
          projectId: doc.projectId,
          documentId: doc.id,
          versionNumber: 1,
          revisionCode: '01',
          title: doc.title,
          description: doc.description,
          originalFilename: doc.originalFilename,
          fileFormat: doc.fileFormat,
          mimeType: doc.mimeType,
          fileSizeBytes: doc.fileSizeBytes,
          storageObjectKey: doc.storageObjectKey,
          checksumSha256: doc.checksumSha256,
          uploadStatus: doc.uploadStatus,
          securityScanStatus: doc.securityScanStatus,
          workflowStatus: 'PUBLISHED',
          uploadedById: doc.uploadedById,
          createdAt: doc.createdAt,
          publishedAt: doc.createdAt,
        },
      });

      // 2. Point document to this version
      await tx.document.update({
        where: { id: doc.id },
        data: {
          latestVersionId: versionId,
          currentPublishedVersionId: versionId,
          currentRevisionCode: '01',
        },
      });

      // 3. Mirror spatial links to version level
      if (doc.spatialLinks && doc.spatialLinks.length > 0) {
        await tx.documentVersionSpatialLink.createMany({
          data: doc.spatialLinks.map((sl) => ({
            versionId,
            spatialNodeId: sl.spatialNodeId,
          })),
          skipDuplicates: true,
        });
      }

      // 4. Mirror WBS links to version level
      if (doc.workPackageLinks && doc.workPackageLinks.length > 0) {
        await tx.documentVersionWorkPackageLink.createMany({
          data: doc.workPackageLinks.map((wl) => ({
            versionId,
            workPackageId: wl.workPackageId,
          })),
          skipDuplicates: true,
        });
      }

      // 5. If drawing category or format, ensure DrawingMetadata exists
      const isDrawing =
        doc.category.includes('DRAWING') ||
        ['DWG', 'DXF', 'PDF'].includes(doc.fileFormat.toUpperCase());

      if (isDrawing) {
        const existingDrawing = await tx.drawingMetadata.findUnique({
          where: { documentId: doc.id },
        });
        if (!existingDrawing) {
          await tx.drawingMetadata.create({
            data: {
              organizationId: doc.organizationId,
              projectId: doc.projectId,
              documentId: doc.id,
              drawingNumber: doc.reference,
              drawingTitle: doc.title,
              discipline: doc.discipline || 'ARCHITECTURE',
              drawingType: 'FLOOR_PLAN',
              sheetSize: 'A1',
              issuePurpose: 'FOR_INFORMATION',
              status: 'ACTIVE',
            },
          });
        }
      }
    });

    console.log(`Successfully migrated document ${doc.reference} (${doc.id}) -> Version ${versionId}`);
  }

  console.log('--- Phase 3C Document Migration Backfill Completed Successfully ---');
}

backfill()
  .catch((err) => {
    console.error('Migration backfill failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
