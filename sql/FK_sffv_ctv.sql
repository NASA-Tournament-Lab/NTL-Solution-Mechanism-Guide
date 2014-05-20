ALTER TABLE searchFormFieldValue ADD CONSTRAINT FK_sffv_ctv
FOREIGN KEY (valuetype_id) REFERENCES characteristicTypeValue(id)
ON DELETE CASCADE;