-- Make analysis_id optional in price_predictions for standalone price forecasts
ALTER TABLE price_predictions MODIFY COLUMN analysis_id BIGINT UNSIGNED NULL;
