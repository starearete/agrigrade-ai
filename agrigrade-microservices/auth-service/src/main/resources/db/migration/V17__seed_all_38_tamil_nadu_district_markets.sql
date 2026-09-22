-- ============================================================================
-- Flyway Migration V17: Seed Real-World Agricultural Markets for All 38 Tamil Nadu Districts
-- Database: agrigrade_ai
-- ============================================================================

SET FOREIGN_KEY_CHECKS = 0;

-- Insert / Update Real-World Markets for each of the 38 Districts in Tamil Nadu
INSERT INTO `markets` (`code`, `name`, `market_type`, `district`, `state`, `address_line`, `latitude`, `longitude`, `is_active`)
VALUES
  -- 1. Ariyalur
  ('MKT-ARIYALUR', 'Ariyalur Regulated Agricultural Market', 'MANDI', 'Ariyalur', 'Tamil Nadu', 'Market Road, Ariyalur', 11.1401, 79.0786, 1),
  
  -- 2. Chengalpattu
  ('MKT-CHENGALPATTU', 'Chengalpattu Uzhavar Sandhai Mandi', 'FARMER_MARKET', 'Chengalpattu', 'Tamil Nadu', 'GST Road, Chengalpattu', 12.6841, 79.9836, 1),
  
  -- 3. Chennai
  ('MKT_KOYAMBEDU', 'Koyambedu Wholesale Market Complex', 'WHOLESALE_HUB', 'Chennai', 'Tamil Nadu', 'Koyambedu, Chennai', 13.0694, 80.1948, 1),
  
  -- 4. Coimbatore
  ('MKT-COIMBATORE-MGR', 'Coimbatore MGR Wholesale Market', 'WHOLESALE_HUB', 'Coimbatore', 'Tamil Nadu', 'Mettupalayam Road, RS Puram, Coimbatore', 11.0018, 76.9629, 1),
  ('MKT-POLLACHI-AGRI', 'Pollachi Agricultural Produce Market Hub', 'MANDI', 'Coimbatore', 'Tamil Nadu', 'Market Road, Pollachi', 10.6580, 77.0080, 1),
  
  -- 5. Cuddalore
  ('MKT-PANRUTI', 'Panruti Cashew & Jackfruit Wholesale Mandi', 'WHOLESALE_HUB', 'Cuddalore', 'Tamil Nadu', 'Main Road, Panruti', 11.7749, 79.5537, 1),
  ('MKT-CUDDALORE', 'Cuddalore Uzhavar Sandhai', 'FARMER_MARKET', 'Cuddalore', 'Tamil Nadu', 'Manjakuppam, Cuddalore', 11.7480, 79.7714, 1),
  
  -- 6. Dharmapuri
  ('MKT-DHARMAPURI-TOMATO', 'Dharmapuri Tomato & Vegetable Wholesale Hub', 'WHOLESALE_HUB', 'Dharmapuri', 'Tamil Nadu', 'NH44 Market Yard, Dharmapuri', 12.1211, 78.1582, 1),
  
  -- 7. Dindigul
  ('MKT-ODDANCHATRAM', 'Oddanchatram Daily Vegetable Market', 'WHOLESALE_HUB', 'Dindigul', 'Tamil Nadu', 'Dharapuram Road, Oddanchatram', 10.4851, 77.7478, 1),
  ('MKT-DINDIGUL-CENTRAL', 'Dindigul Central Market Yard', 'MANDI', 'Dindigul', 'Tamil Nadu', 'Batlagundu Road, Dindigul', 10.3673, 77.9803, 1),
  
  -- 8. Erode
  ('MKT-ERODE-SAMPATH', 'Erode Sampath Nagar Wholesale Mandi', 'WHOLESALE_HUB', 'Erode', 'Tamil Nadu', 'Sampath Nagar, Erode', 11.3410, 77.7172, 1),
  ('MKT-SATHY-FPO', 'Sathyamangalam Farmer Producer Mandi', 'DIRECT_BUYER_HUB', 'Erode', 'Tamil Nadu', 'Sathy-Athani Main Road, Sathyamangalam', 11.5034, 77.2444, 1),
  ('MKT-GOBI-AGRI', 'Gobichettipalayam Agricultural Regulated Market', 'MANDI', 'Erode', 'Tamil Nadu', 'Kullampalayam Road, Gobichettipalayam', 11.4546, 77.4373, 1),
  
  -- 9. Kallakurichi
  ('MKT-KALLAKURICHI', 'Kallakurichi Regulated Agricultural Market', 'MANDI', 'Kallakurichi', 'Tamil Nadu', 'Kachirapalayam Road, Kallakurichi', 11.7384, 78.9639, 1),
  
  -- 10. Kancheepuram
  ('MKT-KANCHEEPURAM', 'Kancheepuram Vegetable & Fruit Wholesale Market', 'MANDI', 'Kancheepuram', 'Tamil Nadu', 'Gandhi Road, Kancheepuram', 12.8342, 79.7036, 1),
  
  -- 11. Kanniyakumari
  ('MKT-NAGERCOIL-VADSERY', 'Nagercoil Vadasery Wholesale Agricultural Market', 'WHOLESALE_HUB', 'Kanniyakumari', 'Tamil Nadu', 'Vadasery, Nagercoil', 8.1833, 77.4119, 1),
  
  -- 12. Karur
  ('MKT-KARUR-AGRI', 'Karur Uzhavar Sandhai & Agricultural Mandi', 'MANDI', 'Karur', 'Tamil Nadu', 'Jawahar Bazaar, Karur', 10.9601, 78.0766, 1),
  
  -- 13. Krishnagiri
  ('MKT-KRISHNAGIRI-MANGO', 'Krishnagiri Mango & Horticulture Hub', 'WHOLESALE_HUB', 'Krishnagiri', 'Tamil Nadu', 'Rayakottai Road, Krishnagiri', 12.5186, 78.2137, 1),
  
  -- 14. Madurai
  ('MKT-MADURAI-MATTUTHAVANI', 'Madurai Mattuthavani Wholesale Market', 'WHOLESALE_HUB', 'Madurai', 'Tamil Nadu', 'Mattuthavani Integrated Complex, Madurai', 9.9467, 78.1569, 1),
  ('MKT-MADURAI-PARAVAI', 'Paravai Vegetable Wholesale Market', 'MANDI', 'Madurai', 'Tamil Nadu', 'Dindigul Main Road, Paravai, Madurai', 9.9705, 78.0772, 1),
  
  -- 15. Mayiladuthurai
  ('MKT-MAYILADUTHURAI', 'Mayiladuthurai Regulated Agricultural Market', 'MANDI', 'Mayiladuthurai', 'Tamil Nadu', 'Kacheri Road, Mayiladuthurai', 11.1075, 79.6523, 1),
  
  -- 16. Nagapattinam
  ('MKT-NAGAPATTINAM', 'Nagapattinam Grain & Vegetable Mandi', 'MANDI', 'Nagapattinam', 'Tamil Nadu', 'Public Office Road, Nagapattinam', 10.7672, 79.8449, 1),
  
  -- 17. Namakkal
  ('MKT-NAMAKKAL-AGRI', 'Namakkal Agricultural Produce & Poultry Hub', 'MANDI', 'Namakkal', 'Tamil Nadu', 'Mohanur Road, Namakkal', 11.2189, 78.1674, 1),
  
  -- 18. Nilgiris
  ('MKT-OOTY-VEGETABLE', 'Ooty Municipal Vegetable & Hill Produce Market', 'WHOLESALE_HUB', 'Nilgiris', 'Tamil Nadu', 'Commercial Road, Ooty', 11.4102, 76.6950, 1),
  ('MKT-METTUPALAYAM', 'Mettupalayam Potato & Hill Crop Wholesale Hub', 'WHOLESALE_HUB', 'Nilgiris', 'Tamil Nadu', 'Coimbatore-Ooty Road, Mettupalayam', 11.3002, 76.9468, 1),
  
  -- 19. Perambalur
  ('MKT-PERAMBALUR', 'Perambalur Regulated Agricultural Market', 'MANDI', 'Perambalur', 'Tamil Nadu', 'Elambalur Road, Perambalur', 11.2342, 78.8819, 1),
  
  -- 20. Pudukkottai
  ('MKT-PUDUKKOTTAI', 'Pudukkottai Uzhavar Sandhai & Commodity Mandi', 'FARMER_MARKET', 'Pudukkottai', 'Tamil Nadu', 'Santhai Pettai, Pudukkottai', 10.3797, 78.8208, 1),
  
  -- 21. Ramanathapuram
  ('MKT-RAMANATHAPURAM', 'Ramanathapuram Regulated Agricultural Market', 'MANDI', 'Ramanathapuram', 'Tamil Nadu', 'Salai Street, Ramanathapuram', 9.3639, 78.8395, 1),
  
  -- 22. Ranipet
  ('MKT-RANIPET', 'Ranipet Regulated Market & Vegetable Hub', 'MANDI', 'Ranipet', 'Tamil Nadu', 'Arcot Road, Ranipet', 12.9272, 79.3331, 1),
  
  -- 23. Salem
  ('MKT-SALEM-LEIGH', 'Salem Leigh Bazaar Wholesale Mandi', 'WHOLESALE_HUB', 'Salem', 'Tamil Nadu', 'Leigh Bazaar, Salem', 11.6643, 78.1460, 1),
  ('MKT-ATTUR-AGRI', 'Attur Regulated Agricultural Market Yard', 'MANDI', 'Salem', 'Tamil Nadu', 'Cuddalore Main Road, Attur', 11.5975, 78.5982, 1),
  
  -- 24. Sivaganga
  ('MKT-KARAIKUDI', 'Karaikudi Agricultural Produce Market', 'MANDI', 'Sivaganga', 'Tamil Nadu', 'College Road, Karaikudi', 10.0735, 78.7732, 1),
  
  -- 25. Tenkasi
  ('MKT-ALANGULAM', 'Alangulam Vegetable Wholesale Market', 'WHOLESALE_HUB', 'Tenkasi', 'Tamil Nadu', 'Tirunelveli-Tenkasi Road, Alangulam', 8.8711, 77.4958, 1),
  
  -- 26. Thanjavur
  ('MKT-THANJAVUR-KAMARAJ', 'Thanjavur Kamaraj Vegetable Market', 'WHOLESALE_HUB', 'Thanjavur', 'Tamil Nadu', 'South Rampart, Thanjavur', 10.7870, 79.1378, 1),
  
  -- 27. Theni
  ('MKT-THENI-CENTRAL', 'Theni Farmers Wholesale Mandi', 'MANDI', 'Theni', 'Tamil Nadu', 'Madurai Road, Theni', 10.0104, 77.4768, 1),
  ('MKT-CUMBUM-VALLEY', 'Cumbum Valley Banana & Grape Terminal', 'DIRECT_BUYER_HUB', 'Theni', 'Tamil Nadu', 'LF Road, Cumbum', 9.7346, 77.2811, 1),
  
  -- 28. Thoothukudi
  ('MKT-THOOTHUKUDI', 'Thoothukudi Kamaraj Market Yard', 'WHOLESALE_HUB', 'Thoothukudi', 'Tamil Nadu', 'WGC Road, Thoothukudi', 8.7642, 78.1348, 1),
  
  -- 29. Tiruchirappalli
  ('MKT-TRICHY-GANDHI', 'Tiruchirappalli Gandhi Market', 'WHOLESALE_HUB', 'Tiruchirappalli', 'Tamil Nadu', 'Gandhi Market, Trichy', 10.8271, 78.6972, 1),
  
  -- 30. Tirunelveli
  ('MKT-TIRUNELVELI-NAINAR', 'Tirunelveli Nainarkulam Wholesale Market', 'WHOLESALE_HUB', 'Tirunelveli', 'Tamil Nadu', 'Nainarkulam Road, Tirunelveli Town', 8.7280, 77.7074, 1),
  
  -- 31. Tirupathur
  ('MKT-TIRUPATHUR', 'Tirupathur Regulated Agricultural Market', 'MANDI', 'Tirupathur', 'Tamil Nadu', 'Vaniyambadi Road, Tirupathur', 12.4958, 78.5678, 1),
  
  -- 32. Tiruppur
  ('MKT-TIRUPPUR-THENNAM', 'Tiruppur Thennampalayam Daily Wholesale Market', 'WHOLESALE_HUB', 'Tiruppur', 'Tamil Nadu', 'Palladam Road, Thennampalayam, Tiruppur', 11.1085, 77.3411, 1),
  
  -- 33. Tiruvallur
  ('MKT-TIRUVALLUR', 'Tiruvallur Regulated Market & Farmer Hub', 'MANDI', 'Tiruvallur', 'Tamil Nadu', 'JN Road, Tiruvallur', 13.1438, 79.9083, 1),
  
  -- 34. Tiruvannamalai
  ('MKT-TIRUVANNAMALAI', 'Tiruvannamalai Regulated Agricultural Market', 'MANDI', 'Tiruvannamalai', 'Tamil Nadu', 'Manalurpet Road, Tiruvannamalai', 12.2253, 79.0747, 1),
  
  -- 35. Tiruvarur
  ('MKT-MANNARGUDI', 'Mannargudi Agricultural Produce Market', 'MANDI', 'Tiruvarur', 'Tamil Nadu', 'Big Bazaar Street, Mannargudi', 10.6637, 79.4442, 1),
  
  -- 36. Vellore
  ('MKT-VELLORE-NETHAJI', 'Vellore Nethaji Daily Wholesale Market', 'WHOLESALE_HUB', 'Vellore', 'Tamil Nadu', 'Long Bazaar, Vellore', 12.9165, 79.1325, 1),
  
  -- 37. Viluppuram
  ('MKT-VILUPPURAM', 'Viluppuram Agricultural Regulated Market', 'MANDI', 'Viluppuram', 'Tamil Nadu', 'Trichy Trunk Road, Viluppuram', 11.9401, 79.4861, 1),
  
  -- 38. Virudhunagar
  ('MKT-VIRUDHUNAGAR', 'Virudhunagar Commodity & Agricultural Mandi', 'WHOLESALE_HUB', 'Virudhunagar', 'Tamil Nadu', 'Madurai Road, Virudhunagar', 9.5872, 77.9579, 1)

ON DUPLICATE KEY UPDATE
  `name` = VALUES(`name`),
  `market_type` = VALUES(`market_type`),
  `district` = VALUES(`district`),
  `state` = VALUES(`state`),
  `address_line` = VALUES(`address_line`),
  `latitude` = VALUES(`latitude`),
  `longitude` = VALUES(`longitude`),
  `is_active` = 1;

-- Link district_id to districts table
UPDATE `markets` m
JOIN `districts` d ON LOWER(TRIM(m.district)) = LOWER(TRIM(d.name))
SET m.district_id = d.id;

SET FOREIGN_KEY_CHECKS = 1;
