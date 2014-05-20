ALTER TABLE searchFormFieldValue ADD CONSTRAINT FK_sffv_sff
FOREIGN KEY (field_id) REFERENCES searchFormField(id)
ON DELETE CASCADE;