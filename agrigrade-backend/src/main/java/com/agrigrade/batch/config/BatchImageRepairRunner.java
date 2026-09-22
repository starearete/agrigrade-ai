package com.agrigrade.batch.config;

import com.agrigrade.batch.entity.BatchImage;
import com.agrigrade.batch.entity.ProductBatch;
import com.agrigrade.batch.repository.BatchImageRepository;
import com.agrigrade.batch.repository.ProductBatchRepository;
import com.agrigrade.batch.service.ImageStorageService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.util.HexFormat;
import java.util.List;

@Component
public class BatchImageRepairRunner implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(BatchImageRepairRunner.class);

    private final ProductBatchRepository batchRepository;
    private final BatchImageRepository batchImageRepository;
    private final ImageStorageService imageStorageService;
    private final Path rootUploadDir;

    public BatchImageRepairRunner(
            ProductBatchRepository batchRepository,
            BatchImageRepository batchImageRepository,
            ImageStorageService imageStorageService,
            @Value("${app.upload.dir:uploads}") String uploadDir
    ) {
        this.batchRepository = batchRepository;
        this.batchImageRepository = batchImageRepository;
        this.imageStorageService = imageStorageService;
        this.rootUploadDir = Paths.get(uploadDir).toAbsolutePath().normalize();
    }

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        log.info("Checking & repairing batch product images across database...");

        List<ProductBatch> allBatches = batchRepository.findAll();
        int repairedCount = 0;

        for (ProductBatch batch : allBatches) {
            boolean needsImage = false;
            List<BatchImage> images = batchImageRepository.findByBatchIdOrderBySequenceNoAsc(batch.getId());

            if (images.isEmpty()) {
                needsImage = true;
            } else {
                BatchImage firstImg = images.get(0);
                try {
                    Path filePath = imageStorageService.resolveStoragePath(firstImg.getStorageKey());
                    if (!Files.exists(filePath) || Files.size(filePath) <= 200) {
                        needsImage = true;
                    }
                } catch (Exception e) {
                    needsImage = true;
                }
            }

            if (needsImage) {
                try {
                    repairBatchImage(batch, images.isEmpty() ? null : images.get(0));
                    repairedCount++;
                } catch (Exception ex) {
                    log.warn("Failed to generate image for batch #{}: {}", batch.getId(), ex.getMessage());
                }
            }
        }

        log.info("Batch image repair completed. Successfully verified/generated valid images for {} batches.", repairedCount);
    }

    private void repairBatchImage(ProductBatch batch, BatchImage existingRecord) throws Exception {
        String cropName = (batch.getVariety() != null && batch.getVariety().getCrop() != null)
                ? batch.getVariety().getCrop().getName()
                : "Agricultural Produce";

        String varietyName = batch.getVariety() != null
                ? batch.getVariety().getName()
                : "Standard";

        byte[] jpegBytes = generateCropJpegImage(cropName, varietyName, batch.getBatchNumber());

        Path batchDir = this.rootUploadDir.resolve("batches").resolve(String.valueOf(batch.getId())).normalize();
        Files.createDirectories(batchDir);

        String fileName = "crop_image_" + batch.getId() + ".jpg";
        Path targetPath = batchDir.resolve(fileName);
        Files.write(targetPath, jpegBytes);

        String storageKey = "uploads/batches/" + batch.getId() + "/" + fileName;

        MessageDigest digest = MessageDigest.getInstance("SHA-256");
        String sha256Hash = HexFormat.of().formatHex(digest.digest(jpegBytes));

        BatchImage image = existingRecord != null ? existingRecord : new BatchImage();
        image.setBatch(batch);
        image.setMediaType("PHOTO");
        image.setMimeType("image/jpeg");
        image.setFileSizeBytes((long) jpegBytes.length);
        image.setStorageKey(storageKey);
        image.setSequenceNo(1);
        image.setSha256Hash(sha256Hash);
        image.setCapturedAt(LocalDateTime.now());

        batchImageRepository.save(image);
    }

    private byte[] generateCropJpegImage(String cropName, String varietyName, String batchNumber) throws Exception {
        int width = 800;
        int height = 500;

        BufferedImage bufferedImage = new BufferedImage(width, height, BufferedImage.TYPE_INT_RGB);
        Graphics2D g2 = bufferedImage.createGraphics();

        g2.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
        g2.setRenderingHint(RenderingHints.KEY_TEXT_ANTIALIASING, RenderingHints.VALUE_TEXT_ANTIALIAS_ON);

        Color colorTop = new Color(46, 60, 50);
        Color colorBottom = new Color(25, 35, 28);

        GradientPaint gp = new GradientPaint(0, 0, colorTop, width, height, colorBottom);
        g2.setPaint(gp);
        g2.fillRect(0, 0, width, height);

        g2.setColor(new Color(255, 255, 255, 25));
        g2.fillOval(width / 2 - 180, height / 2 - 180, 360, 360);

        g2.setStroke(new BasicStroke(3));
        g2.setColor(new Color(255, 255, 255, 60));
        g2.drawOval(width / 2 - 200, height / 2 - 200, 400, 400);

        g2.setColor(Color.WHITE);
        g2.setFont(new Font("SansSerif", Font.BOLD, 42));
        FontMetrics fm1 = g2.getFontMetrics();
        String title = cropName.toUpperCase();
        int titleWidth = fm1.stringWidth(title);
        g2.drawString(title, (width - titleWidth) / 2, 210);

        g2.setFont(new Font("SansSerif", Font.PLAIN, 24));
        g2.setColor(new Color(255, 255, 255, 230));
        FontMetrics fm2 = g2.getFontMetrics();
        String subtitle = "Variety: " + varietyName;
        int subWidth = fm2.stringWidth(subtitle);
        g2.drawString(subtitle, (width - subWidth) / 2, 260);

        g2.setColor(new Color(255, 255, 255, 40));
        g2.fillRoundRect(80, 330, width - 160, 50, 20, 20);

        g2.setColor(Color.WHITE);
        g2.setFont(new Font("SansSerif", Font.BOLD, 16));
        FontMetrics fm3 = g2.getFontMetrics();
        String certText = "AGRIGRADE AI CERTIFIED LOAD • BATCH " + (batchNumber != null ? batchNumber : "");
        int certWidth = fm3.stringWidth(certText);
        g2.drawString(certText, (width - certWidth) / 2, 362);

        g2.dispose();

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        ImageIO.write(bufferedImage, "jpg", baos);
        return baos.toByteArray();
    }
}
