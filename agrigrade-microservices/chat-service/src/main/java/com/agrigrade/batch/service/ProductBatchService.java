package com.agrigrade.batch.service;

import com.agrigrade.auth.entity.User;
import com.agrigrade.auth.repository.UserRepository;
import com.agrigrade.batch.dto.BatchImageDto;
import com.agrigrade.batch.dto.CreateBatchRequest;
import com.agrigrade.batch.dto.ProductBatchResponse;
import com.agrigrade.batch.dto.UpdateBatchStatusRequest;
import com.agrigrade.batch.entity.BatchImage;
import com.agrigrade.batch.entity.ProductBatch;
import com.agrigrade.batch.repository.BatchImageRepository;
import com.agrigrade.batch.repository.ProductBatchRepository;
import com.agrigrade.common.exception.ApiException;
import com.agrigrade.crop.entity.Crop;
import com.agrigrade.crop.entity.CropVariety;
import com.agrigrade.crop.repository.CropRepository;
import com.agrigrade.crop.repository.CropVarietyRepository;
import com.agrigrade.profile.entity.Address;
import com.agrigrade.profile.entity.FarmerProfile;
import com.agrigrade.profile.repository.AddressRepository;
import com.agrigrade.profile.repository.FarmerProfileRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
@Transactional
public class ProductBatchService {

    private final ProductBatchRepository batchRepository;
    private final BatchImageRepository imageRepository;
    private final FarmerProfileRepository farmerProfileRepository;
    private final UserRepository userRepository;
    private final CropRepository cropRepository;
    private final CropVarietyRepository varietyRepository;
    private final AddressRepository addressRepository;
    private final ImageStorageService imageStorageService;

    @PersistenceContext
    private EntityManager entityManager;

    public ProductBatchService(
            ProductBatchRepository batchRepository,
            BatchImageRepository imageRepository,
            FarmerProfileRepository farmerProfileRepository,
            UserRepository userRepository,
            CropRepository cropRepository,
            CropVarietyRepository varietyRepository,
            AddressRepository addressRepository,
            ImageStorageService imageStorageService
    ) {
        this.batchRepository = batchRepository;
        this.imageRepository = imageRepository;
        this.farmerProfileRepository = farmerProfileRepository;
        this.userRepository = userRepository;
        this.cropRepository = cropRepository;
        this.varietyRepository = varietyRepository;
        this.addressRepository = addressRepository;
        this.imageStorageService = imageStorageService;
    }

    public ProductBatchResponse createBatch(String userPublicId, CreateBatchRequest request) {
        User user = userRepository.findByPublicId(userPublicId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "USER_NOT_FOUND", "User not found"));

        FarmerProfile farmer = farmerProfileRepository.findByUserId(user.getId())
                .orElseGet(() -> {
                    FarmerProfile fp = new FarmerProfile();
                    fp.setUserId(user.getId());
                    fp.setFarmerCode("FARMER-" + user.getId());
                    return farmerProfileRepository.save(fp);
                });

        CropVariety variety = varietyRepository.findById(request.varietyId())
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "VARIETY_NOT_FOUND", "Crop variety not found with id: " + request.varietyId()));

        if (Boolean.FALSE.equals(variety.getIsActive())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "VARIETY_INACTIVE", "Selected crop variety is not active");
        }

        Crop crop = variety.getCrop();
        if (crop == null || Boolean.FALSE.equals(crop.getIsActive())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "CROP_INACTIVE", "Crop associated with the selected variety is not active");
        }

        if (request.cropId() != null) {
            Crop requestedCrop = cropRepository.findById(request.cropId())
                    .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "CROP_NOT_FOUND", "Crop not found with id: " + request.cropId()));
            if (!crop.getId().equals(requestedCrop.getId())) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_CROP_VARIETY", "Selected variety does not belong to the selected crop.");
            }
        }

        Address address = farmer.getPrimaryAddress();
        if (address == null) {
            address = new Address();
            address.setUserId(user.getId());
            address.setDistrict(request.district() != null ? request.district() : "Theni");
            address.setState(request.state() != null ? request.state() : "Tamil Nadu");
            address.setAddressLine1("Farm Location, " + (request.district() != null ? request.district() : "Theni"));
            address.setPincode("625531");
            address.setLocality(request.district() != null ? request.district() : "Theni");
            address.setIsPrimary(true);
            address = addressRepository.save(address);
            farmer.setPrimaryAddress(address);
            farmerProfileRepository.save(farmer);
        }

        ProductBatch batch = new ProductBatch();
        String cropCode = variety.getCrop() != null ? variety.getCrop().getCode() : "CROP";
        batch.setBatchNumber("BATCH-" + cropCode + "-" + System.currentTimeMillis() % 100000);
        batch.setFarmer(farmer);
        batch.setVariety(variety);
        batch.setHarvestDate(LocalDate.parse(request.harvestDate()));
        batch.setQuantity(request.quantity());
        batch.setQuantityUnit(request.quantityUnit() != null ? request.quantityUnit() : "KG");
        batch.setHarvestLocation(address);
        String storageCondition = "AMBIENT";
        if (request.storageCondition() != null) {
            String sc = request.storageCondition().trim().toUpperCase();
            if (sc.contains("COLD")) storageCondition = "COLD_STORAGE";
            else if (sc.contains("REFRIGER")) storageCondition = "REFRIGERATED";
            else if (sc.contains("ATMOSPHERE") || sc.contains("CONTROLLED")) storageCondition = "CONTROLLED_ATMOSPHERE";
            else storageCondition = "AMBIENT";
        }
        batch.setStorageCondition(storageCondition);
        batch.setStatus("HARVESTED");

        ProductBatch saved = batchRepository.save(batch);

        return mapToResponse(saved, user.getFullName());
    }

    public BatchImageDto uploadBatchImage(String userPublicId, Long batchId, MultipartFile file, String mediaType) {
        User user = userRepository.findByPublicId(userPublicId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "USER_NOT_FOUND", "User not found"));

        FarmerProfile farmer = farmerProfileRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "FARMER_NOT_FOUND", "Farmer profile not found"));

        ProductBatch batch = batchRepository.findById(batchId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "BATCH_NOT_FOUND", "Batch not found with id: " + batchId));

        if (batch.isInspectionLocked()) {
            throw new ApiException(HttpStatus.CONFLICT, "INSPECTION_LOCKED", "This batch has been certified and published. Image upload is locked and immutable.");
        }

        boolean isAdmin = user.getRoles() != null && user.getRoles().contains("ROLE_ADMIN");
        if (!isAdmin && (batch.getFarmer() == null || !batch.getFarmer().getId().equals(farmer.getId()))) {
            throw new ApiException(HttpStatus.FORBIDDEN, "FORBIDDEN", "You are not authorized to upload images for this batch");
        }

        // Store physical file and get cryptographic hash & metadata
        ImageStorageService.StoredFileResult result = imageStorageService.storeBatchFile(batchId, file, mediaType);

        List<BatchImage> existing = imageRepository.findByBatchIdOrderBySequenceNoAsc(batchId);
        int nextSeq = existing.size() + 1;

        BatchImage image = new BatchImage();
        image.setBatch(batch);
        boolean isVideo = "VIDEO".equalsIgnoreCase(mediaType) || result.mimeType().startsWith("video/");
        image.setMediaType(isVideo ? "VIDEO" : "PHOTO");
        image.setMimeType(result.mimeType());
        image.setFileSizeBytes(result.fileSizeBytes());
        image.setStorageKey(result.storageKey());
        image.setSequenceNo(nextSeq);
        image.setSha256Hash(result.sha256Hash());
        image.setCapturedAt(LocalDateTime.now());

        BatchImage saved = imageRepository.save(image);
        return mapToImageDto(saved);
    }

    @Transactional(readOnly = true)
    public BatchImage getBatchImageEntity(Long batchId, Long imageId) {
        BatchImage image = imageRepository.findById(imageId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "IMAGE_NOT_FOUND", "Image not found with id: " + imageId));

        if (image.getBatch() == null || !image.getBatch().getId().equals(batchId)) {
            throw new ApiException(HttpStatus.NOT_FOUND, "IMAGE_NOT_IN_BATCH", "Image does not belong to batch: " + batchId);
        }
        return image;
    }

    @Transactional(readOnly = true)
    public Resource loadBatchImageResource(Long batchId, Long imageId) {
        BatchImage image = getBatchImageEntity(batchId, imageId);
        return imageStorageService.loadFileAsResource(image.getStorageKey());
    }

    public void deleteBatchImage(String userPublicId, Long batchId, Long imageId) {
        User user = userRepository.findByPublicId(userPublicId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "USER_NOT_FOUND", "User not found"));

        FarmerProfile farmer = farmerProfileRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "FARMER_NOT_FOUND", "Farmer profile not found"));

        BatchImage image = getBatchImageEntity(batchId, imageId);

        if (image.getBatch() != null && image.getBatch().isInspectionLocked()) {
            throw new ApiException(HttpStatus.CONFLICT, "INSPECTION_LOCKED", "This batch has been certified and published. Evidence deletion is locked and immutable.");
        }

        boolean isAdmin = user.getRoles() != null && user.getRoles().contains("ROLE_ADMIN");
        if (!isAdmin && (image.getBatch().getFarmer() == null || !image.getBatch().getFarmer().getId().equals(farmer.getId()))) {
            throw new ApiException(HttpStatus.FORBIDDEN, "FORBIDDEN", "You are not authorized to delete images for this batch");
        }

        imageStorageService.deleteFile(image.getStorageKey());
        imageRepository.delete(image);
    }

    @Transactional(readOnly = true)
    public List<ProductBatchResponse> getFarmerBatches(String userPublicId) {
        User user = userRepository.findByPublicId(userPublicId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "USER_NOT_FOUND", "User not found"));

        FarmerProfile farmer = farmerProfileRepository.findByUserId(user.getId())
                .orElse(null);

        if (farmer == null) {
            return List.of();
        }

        return batchRepository.findByFarmerIdOrderByCreatedAtDesc(farmer.getId()).stream()
                .map(b -> mapToResponse(b, user.getFullName()))
                .toList();
    }

    @Transactional(readOnly = true)
    public ProductBatchResponse getBatchById(String userPublicId, Long batchId) {
        User user = userRepository.findByPublicId(userPublicId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "USER_NOT_FOUND", "User not found"));

        FarmerProfile farmer = farmerProfileRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "FARMER_NOT_FOUND", "Farmer profile not found"));

        ProductBatch batch = batchRepository.findByIdAndFarmerId(batchId, farmer.getId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "BATCH_NOT_FOUND", "Batch not found or unauthorized"));

        return mapToResponse(batch, user.getFullName());
    }

    public ProductBatchResponse updateBatchStatus(String userPublicId, Long batchId, UpdateBatchStatusRequest request) {
        User user = userRepository.findByPublicId(userPublicId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "USER_NOT_FOUND", "User not found"));

        FarmerProfile farmer = farmerProfileRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "FARMER_NOT_FOUND", "Farmer profile not found"));

        ProductBatch batch = batchRepository.findByIdAndFarmerId(batchId, farmer.getId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "BATCH_NOT_FOUND", "Batch not found or unauthorized"));

        batch.setStatus(request.status());
        ProductBatch updated = batchRepository.save(batch);

        return mapToResponse(updated, user.getFullName());
    }

    public void deleteBatch(String userPublicId, Long batchId) {
        User user = userRepository.findByPublicId(userPublicId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "USER_NOT_FOUND", "User not found"));

        FarmerProfile farmer = farmerProfileRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "FARMER_NOT_FOUND", "Farmer profile not found"));

        ProductBatch batch = batchRepository.findById(batchId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "BATCH_NOT_FOUND", "Batch not found with id: " + batchId));

        boolean isAdmin = user.getRoles() != null && user.getRoles().contains("ROLE_ADMIN");
        if (!isAdmin && (batch.getFarmer() == null || !batch.getFarmer().getId().equals(farmer.getId()))) {
            throw new ApiException(HttpStatus.FORBIDDEN, "FORBIDDEN", "You are not authorized to delete this batch");
        }

        // Check if batch is associated with active orders
        Number activeOrderCount = (Number) entityManager.createNativeQuery(
                "SELECT COUNT(*) FROM orders o JOIN marketplace_listings mpl ON o.listing_id = mpl.id WHERE mpl.batch_id = :batchId AND o.status IN ('AGREED', 'IN_TRANSIT')"
        ).setParameter("batchId", batchId).getSingleResult();

        if (activeOrderCount != null && activeOrderCount.longValue() > 0) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "BATCH_CANNOT_BE_DELETED", "This batch cannot be deleted because it has active buyer orders.");
        }

        // Cascade delete dependent child records
        entityManager.createNativeQuery("DELETE FROM buyer_inquiries WHERE listing_id IN (SELECT id FROM marketplace_listings WHERE batch_id = :batchId)")
                .setParameter("batchId", batchId).executeUpdate();
        entityManager.createNativeQuery("DELETE FROM buyer_favorites WHERE listing_id IN (SELECT id FROM marketplace_listings WHERE batch_id = :batchId)")
                .setParameter("batchId", batchId).executeUpdate();
        entityManager.createNativeQuery("DELETE FROM conversations WHERE listing_id IN (SELECT id FROM marketplace_listings WHERE batch_id = :batchId)")
                .setParameter("batchId", batchId).executeUpdate();
        entityManager.createNativeQuery("DELETE FROM listing_visibility WHERE listing_id IN (SELECT id FROM marketplace_listings WHERE batch_id = :batchId)")
                .setParameter("batchId", batchId).executeUpdate();
        entityManager.createNativeQuery("DELETE FROM marketplace_listings WHERE batch_id = :batchId")
                .setParameter("batchId", batchId).executeUpdate();

        entityManager.createNativeQuery("DELETE FROM ai_certificates WHERE batch_id = :batchId")
                .setParameter("batchId", batchId).executeUpdate();

        entityManager.createNativeQuery("DELETE FROM defect_results WHERE quality_result_id IN (SELECT qr.id FROM quality_results qr JOIN ai_analyses aia ON qr.analysis_id = aia.id WHERE aia.batch_id = :batchId)")
                .setParameter("batchId", batchId).executeUpdate();
        entityManager.createNativeQuery("DELETE FROM quality_results WHERE analysis_id IN (SELECT id FROM ai_analyses WHERE batch_id = :batchId)")
                .setParameter("batchId", batchId).executeUpdate();
        entityManager.createNativeQuery("DELETE FROM disease_findings WHERE disease_analysis_id IN (SELECT da.id FROM disease_analyses da WHERE da.batch_id = :batchId)")
                .setParameter("batchId", batchId).executeUpdate();
        entityManager.createNativeQuery("DELETE FROM disease_analyses WHERE batch_id = :batchId")
                .setParameter("batchId", batchId).executeUpdate();
        entityManager.createNativeQuery("DELETE FROM shelf_life_predictions WHERE batch_id = :batchId")
                .setParameter("batchId", batchId).executeUpdate();
        entityManager.createNativeQuery("DELETE FROM price_predictions WHERE batch_id = :batchId")
                .setParameter("batchId", batchId).executeUpdate();
        entityManager.createNativeQuery("DELETE FROM ai_analyses WHERE batch_id = :batchId")
                .setParameter("batchId", batchId).executeUpdate();

        entityManager.createNativeQuery("DELETE FROM market_recommendations WHERE batch_id = :batchId")
                .setParameter("batchId", batchId).executeUpdate();
        entityManager.createNativeQuery("DELETE FROM batch_images WHERE batch_id = :batchId")
                .setParameter("batchId", batchId).executeUpdate();

        batchRepository.delete(batch);

        // Delete physical batch files
        imageStorageService.deleteBatchDirectory(batchId);
    }

    private BatchImageDto mapToImageDto(BatchImage img) {
        String imageUrl = "/api/v1/batches/" + img.getBatch().getId() + "/images/" + img.getId();
        return new BatchImageDto(
                img.getId(),
                img.getBatch().getId(),
                imageUrl,
                img.getSequenceNo(),
                img.getSha256Hash(),
                img.getMediaType(),
                img.getUploadedAt() != null ? img.getUploadedAt().toString() : null
        );
    }

    private ProductBatchResponse mapToResponse(ProductBatch b, String farmerName) {
        List<BatchImageDto> imageDtos = imageRepository.findByBatchIdOrderBySequenceNoAsc(b.getId()).stream()
                .map(this::mapToImageDto)
                .toList();

        int cropAgeDays = 2;
        if (b.getHarvestDate() != null) {
            cropAgeDays = Math.max(0, (int) java.time.temporal.ChronoUnit.DAYS.between(b.getHarvestDate(), java.time.LocalDate.now()));
        }

        Double qualityScore = null;
        String assignedGrade = null;
        String certificateNumber = null;
        String certificateStatus = null;
        Double remainingShelfLifeDays = 8.0;

        try {
            Object[] certRow = (Object[]) entityManager.createNativeQuery(
                "SELECT certificate_number, status FROM ai_certificates WHERE batch_id = :batchId AND status = 'ISSUED' ORDER BY issued_at DESC LIMIT 1"
            ).setParameter("batchId", b.getId()).getSingleResult();
            if (certRow != null && certRow.length >= 2) {
                if (certRow[0] != null) certificateNumber = certRow[0].toString();
                if (certRow[1] != null) certificateStatus = certRow[1].toString();
            }
        } catch (Exception ignored) {}

        try {
            Object[] qRow = (Object[]) entityManager.createNativeQuery(
                "SELECT q.assigned_grade, q.quality_score FROM quality_results q JOIN ai_analyses a ON q.analysis_id = a.id WHERE a.batch_id = :batchId AND a.status = 'COMPLETED' ORDER BY a.completed_at DESC LIMIT 1"
            ).setParameter("batchId", b.getId()).getSingleResult();
            if (qRow != null && qRow.length >= 2) {
                if (qRow[0] != null) assignedGrade = qRow[0].toString();
                if (qRow[1] != null) qualityScore = ((Number) qRow[1]).doubleValue();
            }
        } catch (Exception ignored) {}

        return new ProductBatchResponse(
                b.getId(),
                b.getBatchNumber(),
                b.getFarmer() != null ? b.getFarmer().getId() : null,
                farmerName != null ? farmerName : "Farmer",
                b.getVariety() != null && b.getVariety().getCrop() != null ? b.getVariety().getCrop().getId() : null,
                b.getVariety() != null && b.getVariety().getCrop() != null ? b.getVariety().getCrop().getName() : "Crop",
                b.getVariety() != null ? b.getVariety().getId() : null,
                b.getVariety() != null ? b.getVariety().getName() : "Variety",
                b.getHarvestDate() != null ? b.getHarvestDate().toString() : null,
                b.getQuantity(),
                b.getQuantityUnit(),
                b.getHarvestLocation() != null ? b.getHarvestLocation().getDistrict() : "Theni",
                b.getHarvestLocation() != null ? b.getHarvestLocation().getState() : "Tamil Nadu",
                b.getStorageCondition(),
                b.getStatus(),
                imageDtos,
                qualityScore,
                assignedGrade,
                certificateNumber,
                certificateStatus,
                cropAgeDays,
                remainingShelfLifeDays,
                b.isInspectionLocked(),
                b.getInspectionLockedAt() != null ? b.getInspectionLockedAt().toString() : null,
                b.getCreatedAt() != null ? b.getCreatedAt().toString() : null,
                b.getUpdatedAt() != null ? b.getUpdatedAt().toString() : null
        );
    }
}
