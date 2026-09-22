package com.agrigrade.batch.controller;

import com.agrigrade.batch.dto.BatchImageDto;
import com.agrigrade.batch.dto.CreateBatchRequest;
import com.agrigrade.batch.dto.ProductBatchResponse;
import com.agrigrade.batch.dto.UpdateBatchStatusRequest;
import com.agrigrade.batch.entity.BatchImage;
import com.agrigrade.batch.service.ProductBatchService;
import jakarta.validation.Valid;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/v1/batches")
public class ProductBatchController {

    private final ProductBatchService batchService;

    public ProductBatchController(ProductBatchService batchService) {
        this.batchService = batchService;
    }

    @PostMapping
    @PreAuthorize("hasRole('FARMER') or hasRole('ADMIN')")
    public ResponseEntity<ProductBatchResponse> createBatch(
            Authentication authentication,
            @Valid @RequestBody CreateBatchRequest request
    ) {
        String publicId = authentication.getName();
        ProductBatchResponse response = batchService.createBatch(publicId, request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @PostMapping(value = "/{id}/images", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('FARMER') or hasRole('ADMIN')")
    public ResponseEntity<BatchImageDto> uploadImage(
            Authentication authentication,
            @PathVariable("id") Long batchId,
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "mediaType", required = false, defaultValue = "PHOTO") String mediaType
    ) {
        String publicId = authentication.getName();
        BatchImageDto response = batchService.uploadBatchImage(publicId, batchId, file, mediaType);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @GetMapping("/{id}/images/{imageId}")
    public ResponseEntity<Resource> getBatchImage(
            @PathVariable("id") Long batchId,
            @PathVariable("imageId") Long imageId
    ) {
        BatchImage imageEntity = batchService.getBatchImageEntity(batchId, imageId);
        Resource resource = batchService.loadBatchImageResource(batchId, imageId);

        MediaType mediaType;
        try {
            mediaType = MediaType.parseMediaType(imageEntity.getMimeType());
        } catch (Exception e) {
            mediaType = MediaType.APPLICATION_OCTET_STREAM;
        }

        return ResponseEntity.ok()
                .contentType(mediaType)
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + imageEntity.getId() + "\"")
                .body(resource);
    }

    @DeleteMapping("/{id}/images/{imageId}")
    @PreAuthorize("hasRole('FARMER') or hasRole('ADMIN')")
    public ResponseEntity<Void> deleteBatchImage(
            Authentication authentication,
            @PathVariable("id") Long batchId,
            @PathVariable("imageId") Long imageId
    ) {
        String publicId = authentication.getName();
        batchService.deleteBatchImage(publicId, batchId, imageId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping
    @PreAuthorize("hasRole('FARMER') or hasRole('ADMIN')")
    public ResponseEntity<List<ProductBatchResponse>> getBatches(Authentication authentication) {
        String publicId = authentication.getName();
        List<ProductBatchResponse> response = batchService.getFarmerBatches(publicId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('FARMER') or hasRole('ADMIN')")
    public ResponseEntity<ProductBatchResponse> getBatchById(
            Authentication authentication,
            @PathVariable("id") Long batchId
    ) {
        String publicId = authentication.getName();
        ProductBatchResponse response = batchService.getBatchById(publicId, batchId);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasRole('FARMER') or hasRole('ADMIN')")
    public ResponseEntity<ProductBatchResponse> updateBatchStatus(
            Authentication authentication,
            @PathVariable("id") Long batchId,
            @Valid @RequestBody UpdateBatchStatusRequest request
    ) {
        String publicId = authentication.getName();
        ProductBatchResponse response = batchService.updateBatchStatus(publicId, batchId, request);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('FARMER') or hasRole('ADMIN')")
    public ResponseEntity<Void> deleteBatch(
            Authentication authentication,
            @PathVariable("id") Long batchId
    ) {
        String publicId = authentication.getName();
        batchService.deleteBatch(publicId, batchId);
        return ResponseEntity.noContent().build();
    }
}
